import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// NOTE: Use the Service Role key, so we must use the Auth Admin API which is provided by the server-side client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate .edu email domains
const validateEduEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  const eduPatterns = [
    /\.edu$/,          // Standard US .edu
    /\.edu\.[a-z]{2}$/,  // International .edu domains like .edu.au, .edu.in
    /\.ac\.[a-z]{2}$/,   // Academic domains like .ac.uk, .ac.in
    /\.university$/,     // .university domains
  ];
  
  return eduPatterns.some(pattern => pattern.test(emailLower));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // Initialize Supabase client with the Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    const url = new URL(req.url)
    // The client redirects to this URL after session creation. Default to SITE_URL.
    const redirectTo = url.searchParams.get('redirect_to') || Deno.env.get('SITE_URL') || 'http://localhost:3000/'
    let email = ''
    let user_id = ''
    let user_metadata: any = {}
    
    // --- Step 1: Parse User Data from Request ---
    try {
      if (req.method === 'POST' && (req.headers.get('content-type') || '').includes('application/json')) {
        const body = await req.json()
        email = body.email
        user_id = body.user_id
        user_metadata = body.user_metadata || {}
      } else {
        // Fallback for unexpected GET requests (shouldn't contain session data in GET params, but good for debugging)
        email = url.searchParams.get('email') || ''
        user_id = url.searchParams.get('user_id') || ''
        const meta = url.searchParams.get('user_metadata')
        user_metadata = meta ? JSON.parse(meta) : {}
      }
    } catch (_e) {
      // Body parse error
    }

    console.log('OAuth callback validation for:', email, user_id)

    // --- Step 2: Early Bounce/Failure Checks ---
    if (!email || !user_id) {
      // This is hit if the original OAuth flow failed or didn't pass back required data.
      return new Response(null, { status: 303, headers: { ...corsHeaders, 'Location': redirectTo } })
    }

    // Validate .edu email domain
    if (!validateEduEmail(email)) {
      // Delete the newly created user from Supabase Auth if the email is invalid
      await supabase.auth.admin.deleteUser(user_id)
      
      const errorUrl = new URL(`/auth?error=edu_required&email=${encodeURIComponent(email)}`, redirectTo).toString()
      
      return new Response(null, {
        status: 303,
        headers: { ...corsHeaders, 'Location': errorUrl },
      })
    }

    // --- Step 3: Check for Existing Profile & Linking ---
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking existing profile:', profileError)
      throw profileError
    }
    
    let finalUserId = user_id;

    if (existingProfile && existingProfile.user_id !== user_id) {
      // Profile exists, but the user_id belongs to the newly created Google identity.
      console.log('Found existing profile for email, linking accounts and cleaning up new Auth user...')
      
      // NOTE: Supabase does not support merging identities directly, so we delete the new auth.user
      // and rely on the client to re-login the user using the original identity.
      
      // Final user will be the existing user
      finalUserId = existingProfile.user_id;
      
      // Delete the redundant user created by Google OAuth
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)
      if (deleteError) {
        // Log, but do not stop the flow, as the user can still log in with the old account.
        console.error('Error deleting duplicate user:', deleteError)
      }
    }

    // --- Step 4: Create Profile if Necessary ---
    if (!existingProfile) {
      console.log('Creating new profile for user:', finalUserId)
      
      const emailDomain = email.split('@')[1]
      let university = user_metadata?.university || ''
      
      if (!university && emailDomain) {
        university = emailDomain.split('.')[0].toUpperCase()
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: finalUserId,
          email: email,
          username: user_metadata?.username || user_metadata?.name?.toLowerCase().replace(/\s+/g, '') || email.split('@')[0],
          full_name: user_metadata?.full_name || user_metadata?.name || '',
          avatar_url: user_metadata?.avatar_url || user_metadata?.picture || '',
          university: university,
          user_type: 'student'
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        throw insertError
      }
    }

    // --- Step 5: Final Redirect with Session Data (CRITICAL FIX) ---
    // The final redirect must contain the session data in the URL fragment (#) 
    // for the client-side supabase-js library to pick it up and log the user in.

    const { data: { session }, error: sessionError } = await supabase.auth.admin.getSession(finalUserId);

    if (sessionError || !session) {
        console.error('Could not retrieve final session for redirect:', sessionError)
        const errorUrl = new URL('/auth?error=session_final_failed', redirectTo).toString()
        return new Response(null, { status: 303, headers: { ...corsHeaders, 'Location': errorUrl } })
    }

    // Construct the URL fragment with session data
    const redirectFragment = `#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`
    
    // Perform the clean 303 redirect
    return new Response(null, {
        status: 303,
        headers: { 
            ...corsHeaders, 
            'Location': `${redirectTo}${redirectFragment}` 
        },
    })

  } catch (error) {
    console.error('Error in OAuth callback validation:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

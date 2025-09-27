import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate .edu email domains
const validateEduEmail = (email: string): boolean => {
  const eduPatterns = [
    /\.edu$/,           // Standard US .edu
    /\.edu\.[a-z]{2}$/,  // International .edu domains like .edu.au, .edu.in
    /\.ac\.[a-z]{2}$/,   // Academic domains like .ac.uk, .ac.in
    /\.university$/,     // .university domains
  ];
  
  return eduPatterns.some(pattern => pattern.test(email.toLowerCase()));
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const redirectTo = url.searchParams.get('redirect_to') || Deno.env.get('SITE_URL') || 'http://localhost:3000/'
    let email = ''
    let user_id = ''
    let user_metadata: any = {}
    try {
      if (req.method === 'POST' && (req.headers.get('content-type') || '').includes('application/json')) {
        const body = await req.json()
        email = body.email
        user_id = body.user_id
        user_metadata = body.user_metadata || {}
      } else {
        // Support optional email/user_id via query params when redirected here directly
        email = url.searchParams.get('email') || ''
        user_id = url.searchParams.get('user_id') || ''
        const meta = url.searchParams.get('user_metadata')
        user_metadata = meta ? JSON.parse(meta) : {}
      }
    } catch (_e) {
      // Ignore body parse errors; we'll fall back to redirect
    }

    console.log('OAuth callback validation for:', email, user_id)

    // If request didn't include user info (e.g., GET redirect), bounce to client
    if (!email || !user_id) {
      return new Response(null, { status: 303, headers: { ...corsHeaders, 'Location': redirectTo } })
    }

    // Validate .edu email
    if (!validateEduEmail(email)) {
      const errorUrl = new URL('/auth?error=edu_required', redirectTo).toString()
      return new Response(null, {
        status: 303,
        headers: { ...corsHeaders, 'Location': errorUrl },
      })
    }

    // Check if a profile with this email already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking existing profile:', profileError)
      throw profileError
    }

    if (existingProfile && existingProfile.user_id !== user_id) {
      console.log('Found existing profile for email, linking accounts...')
      
      // Link the Google identity to the existing profile
      // Delete the new user since we want to use the existing one
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)
      if (deleteError) {
        console.error('Error deleting duplicate user:', deleteError)
      }

      return new Response(null, {
        status: 303,
        headers: { ...corsHeaders, 'Location': redirectTo },
      })
    }

    // If no existing profile or same user, create/update profile
    if (!existingProfile) {
      console.log('Creating new profile for user:', user_id)
      
      // Extract university from email domain or metadata
      const emailDomain = email.split('@')[1]
      let university = user_metadata?.university || ''
      
      if (!university && emailDomain) {
        // Try to extract university name from domain
        university = emailDomain.split('.')[0].toUpperCase()
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user_id,
          email: email,
          username: user_metadata?.username || user_metadata?.name?.toLowerCase().replace(' ', '') || email.split('@')[0],
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

    return new Response(null, {
      status: 303,
      headers: { ...corsHeaders, 'Location': redirectTo },
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
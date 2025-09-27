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

    const { email, user_id, user_metadata } = await req.json()

    console.log('OAuth callback validation for:', email, user_id)

    // Validate .edu email
    if (!validateEduEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only .edu email addresses are allowed. Please use your university email.',
        should_delete_user: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

      return new Response(JSON.stringify({
        success: true,
        action: 'linked_to_existing',
        existing_user_id: existingProfile.user_id,
        message: 'Account linked to existing profile'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    return new Response(JSON.stringify({
      success: true,
      action: existingProfile ? 'existing_profile_updated' : 'new_profile_created',
      message: 'OAuth validation successful'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
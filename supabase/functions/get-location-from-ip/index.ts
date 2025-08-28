import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from the request
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client IP from various headers
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') ||
                    '8.8.8.8'; // fallback for development

    console.log('Detected IP:', clientIP);

    // Get location from IP using ipapi.co (free service)
    const locationResponse = await fetch(`https://ipapi.co/${clientIP}/json/`);
    const locationData = await locationResponse.json();

    console.log('Location data:', locationData);

    if (locationData.error) {
      throw new Error(locationData.reason || 'Failed to get location');
    }

    // Update user profile with location data
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        country: locationData.country_name || null,
        state: locationData.region || null,
        area: locationData.city || null,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      location: {
        country: locationData.country_name,
        state: locationData.region,
        area: locationData.city,
        ip: clientIP,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-location-from-ip function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to get location' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
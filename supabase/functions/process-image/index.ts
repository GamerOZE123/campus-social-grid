import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth token for this request
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''))

    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const type = formData.get('type') as string || 'post' // 'post' or 'advertising'

    if (!file || !userId) {
      throw new Error('Missing required fields: file and userId')
    }

    console.log(`Processing image for user ${userId}, type: ${type}`)

    // Convert file to array buffer for processing
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const baseFileName = `${userId}-${timestamp}`

    // Create different sizes
    const sizes = [
      { suffix: 'thumbnail', maxSize: 200, quality: 0.7 },
      { suffix: 'medium', maxSize: 800, quality: 0.8 },
      { suffix: 'original', maxSize: null, quality: 0.9 }
    ]

    const uploadPromises = sizes.map(async (size) => {
      let processedImage = uint8Array
      let fileName = `${baseFileName}-${size.suffix}.${fileExt}`

      // For now, we'll upload the original image for all sizes
      // In a production environment, you'd want to use an image processing library
      // like https://deno.land/x/imagescript or call an external service
      
      const bucket = type === 'advertising' ? 'post-images' : 'posts'
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, processedImage, {
          contentType: file.type,
          cacheControl: '31536000' // 1 year cache
        })

      if (error) {
        console.error(`Error uploading ${size.suffix}:`, error)
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return {
        size: size.suffix,
        url: publicUrl,
        path: data.path
      }
    })

    const uploadResults = await Promise.all(uploadPromises)
    
    // Organize results by size
    const imageUrls = {
      thumbnail: uploadResults.find(r => r.size === 'thumbnail')?.url,
      medium: uploadResults.find(r => r.size === 'medium')?.url,
      original: uploadResults.find(r => r.size === 'original')?.url
    }

    console.log('Image processing completed:', imageUrls)

    return new Response(JSON.stringify({
      success: true,
      imageUrls,
      message: 'Image processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error processing image:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
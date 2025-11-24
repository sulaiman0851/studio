import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  let supabase = createRouteHandlerClient({ cookies });

  // Log all cookies received by the route handler
  const allCookies = (await cookies()).getAll();
  console.log('API Route: Received cookies:', allCookies);

  let { data: { user } = {}, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('API Route: Supabase auth error:', authError);
  }
  console.log('API Route: Supabase user:', user);

  if (!user) {
    // Fallback: cek Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  }

  if (!user) {
    console.log('API Route: User not found, returning Unauthorized.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { image, latitude, longitude } = await req.json();

  if (!image || latitude === undefined || longitude === undefined) {
    console.log('API Route: Missing required fields.');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const imageBase64 = image.split(';base64,').pop();
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const fileExtension = image.split(';')[0].split('/')[1];
    const fileName = `${user.id}/${uuidv4()}.${fileExtension}`;

    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('geotagged_photos')
      .upload(fileName, imageBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('API Route: Storage Upload Error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('geotagged_photos')
      .getPublicUrl(uploadData.path);

    // Insert photo metadata into the database
    // Try to insert with file_path, fallback without it if column doesn't exist
    let dbError;
    const photoData: any = {
      user_id: user.id,
      image_url: publicUrl,
      latitude,
      longitude,
    };
    
    // Try with file_path first
    const { error: insertError } = await supabase
      .from('geotagged_photos')
      .insert({
        ...photoData,
        file_path: uploadData.path,
      });
    
    if (insertError && insertError.message?.includes('file_path')) {
      // Fallback: insert without file_path if column doesn't exist
      console.warn('file_path column not found, inserting without it. Please run migration.');
      const { error: fallbackError } = await supabase
        .from('geotagged_photos')
        .insert(photoData);
      dbError = fallbackError;
    } else {
      dbError = insertError;
    }

    if (dbError) {
      console.error('API Route: Database Insert Error:', dbError);
      return NextResponse.json({ error: 'Failed to save photo metadata.' }, { status: 500 });
    }

    console.log('API Route: Photo uploaded successfully.');
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('API Route: Upload processing error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

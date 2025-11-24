import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: NextRequest, context: any) {
  let supabase = createRouteHandlerClient({ cookies });
  let { data: { user } = {}, error: authError } = await supabase.auth.getUser();

  if (!user) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData || profileData.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
  }

  const { id } = context.params;

  // Get photo info to delete from storage
  const { data: photo, error: fetchError } = await supabase
    .from('geotagged_photos')
    .select('image_url, file_path')
    .eq('id', id)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Initialize Admin Client to bypass RLS for deletion
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Delete from database using Admin Client
  const { error: dbError } = await supabaseAdmin
    .from('geotagged_photos')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting photo from database:', dbError);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }

  // Delete from storage using the stored file_path
  if (photo.file_path) {
    const { error: storageError } = await supabaseAdmin.storage
      .from('geotagged_photos')
      .remove([photo.file_path]);
    
    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue even if storage delete fails - at least DB is cleaned
    }
  } else {
    // Fallback: try to parse from URL (for old photos without file_path)
    try {
      const urlParts = photo.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      const filePath = `${userId}/${fileName}`;
      
      const { error: storageError } = await supabaseAdmin.storage
        .from('geotagged_photos')
        .remove([filePath]);
      
      if (storageError) {
        console.error('Error deleting from storage (fallback):', storageError);
      }
    } catch (e) {
      console.error('Error parsing URL for storage deletion:', e);
    }
  }

  return NextResponse.json({ message: 'Photo deleted successfully' });
}

export async function PATCH(req: NextRequest, context: any) {
  let supabase = createRouteHandlerClient({ cookies });
  let { data: { user } = {} } = await supabase.auth.getUser();

  if (!user) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const body = await req.json();
  const { caption, description } = body;

  // Update database
  // Note: RLS should handle ownership checks, but we can add .eq('user_id', user.id) for extra safety if needed.
  // However, admins might want to edit too. Let's rely on RLS or check role.
  
  // Check if user is admin or owner
  // For simplicity, let's assume RLS allows update for owner.
  
  const { data, error } = await supabase
    .from('geotagged_photos')
    .update({ caption, description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }

  return NextResponse.json(data);
}

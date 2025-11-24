import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, context: any) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const body = await req.json();
  const { caption, description } = body;

  // Update database
  const { data, error } = await supabase
    .from('geotagged_photos')
    .update({ caption, description })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the photo (or is admin, logic can be added)
    .select()
    .single();

  if (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }

  return NextResponse.json(data);
}

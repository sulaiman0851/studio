import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, context: any) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } = {} } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const { title, description, due_date, status, assigned_to } = await req.json();

  // Check user role for authorization
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData || !['admin', 'senior'].includes(profileData.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient role' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({
      title,
      description,
      due_date,
      status,
      assigned_to,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: any) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } = {} } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  // Check user role for authorization
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData || !['admin', 'senior'].includes(profileData.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient role' }, { status: 403 });
  }

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Job deleted successfully.' });
}

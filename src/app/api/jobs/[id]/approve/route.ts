import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  // Check user role for authorization
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData || !['admin', 'senior'].includes(profileData.role)) {
    return NextResponse.json({ error: 'Forbidden: Only admin/senior can approve jobs' }, { status: 403 });
  }

  // Update job status to approved
  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving job:', error);
    return NextResponse.json({ error: 'Failed to approve job.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

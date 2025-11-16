import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Log all cookies received by the route handler
  const allCookies = (await cookies()).getAll();
  console.log('API Route (photos): Received cookies:', allCookies);

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('API Route (photos): Supabase auth error:', authError);
  }
  console.log('API Route (photos): Supabase user:', user);

  if (!user) {
    console.log('API Route (photos): User not found, returning Unauthorized.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('geotagged_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('API Route (photos): Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

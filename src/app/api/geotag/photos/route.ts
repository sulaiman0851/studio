import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  let supabase = createRouteHandlerClient({ cookies });

  // Log all cookies received by the route handler
  const allCookies = (await cookies()).getAll();
  console.log('API Route (photos): Received cookies:', allCookies);

  let { data: { user } = {}, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('API Route (photos): Supabase auth error:', authError);
  }
  console.log('API Route (photos): Supabase user:', user);

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
    console.log('API Route (photos): User not found, returning Unauthorized.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Pagination
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('geotagged_photos')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('API Route (photos): Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos.' }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total: count,
      hasMore: count ? from + (data?.length || 0) < count : false
    }
  });
}

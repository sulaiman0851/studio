import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  const token = authorization?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'today', 'week', 'month', 'year'
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'created_at'; // Default sort by created_at
  const order = searchParams.get('order') || 'desc'; // Default order desc (newest first)
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);

  // Apply Date Filters
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    query = query.gte('due_date', today.toISOString()).lt('due_date', tomorrow.toISOString());
  } else if (filter === 'week') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    query = query.gte('due_date', startOfWeek.toISOString()).lt('due_date', endOfWeek.toISOString());
  } else if (filter === 'month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    query = query.gte('due_date', startOfMonth.toISOString()).lt('due_date', endOfMonth.toISOString());
  } else if (filter === 'year') {
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
    query = query.gte('due_date', startOfYear.toISOString()).lt('due_date', endOfYear.toISOString());
  }

  // Apply Search
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply Sorting
  // Map 'name' to 'title' for sorting if needed, or just use 'title' directly
  const sortField = sort === 'name' ? 'title' : sort;
  query = query.order(sortField, { ascending: order === 'asc' });

  // Apply Pagination
  query = query.range(from, to);

  console.log('Constructed Supabase query:', query.toString());
  const { data, error, count } = await query;
  console.log('Supabase query result - Data length:', data?.length);
  console.log('Supabase query result - Error:', error);

  if (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: {
      total: count,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    }
  });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('Authorization');
  const token = authorization?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  const { title, description, due_date, assigned_to } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title,
      description,
      due_date,
      created_by: user.id,
      assigned_to: assigned_to || user.id, // Assign to self if not specified
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
  }

  return NextResponse.json(data);
}

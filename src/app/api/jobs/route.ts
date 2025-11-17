import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'today', 'week', 'month', 'year'

  let query = supabase
    .from('jobs')
    .select('*')
    .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`); // Users can see their own jobs or jobs assigned to them

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

  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs.', details: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

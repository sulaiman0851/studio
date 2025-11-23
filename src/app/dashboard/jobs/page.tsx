'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { PlusCircle, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CardSkeleton from '@/components/ui/card-skeleton';

interface Job {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

type FilterType = 'today' | 'week' | 'month' | 'year' | 'all';

const JobsPage = () => {
  const supabase = createClient();
  const { currentUser, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  // Form states for create/edit
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [assignedTo, setAssignedTo] = useState('');

  const isAdminOrSenior = role === 'admin' || role === 'senior';

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      const queryParams = new URLSearchParams({
        filter,
        page: page.toString(),
        limit: '9', // 9 items per page
        sort: sortBy,
        order: sortOrder,
      });

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/jobs?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const result = await response.json();
      setJobs(result.data);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      let message = 'An unknown error occurred';
      if (err instanceof Error) {
        message = err.message;
      }
      toast({ title: 'Error', description: `Could not load jobs: ${message}`, variant: 'destructive' });
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchJobs();
    }
  }, [authLoading, currentUser, filter, searchQuery, sortBy, sortOrder, page]);

  const handleCreateJob = async () => {
    if (!title) {
      toast({ title: 'Error', description: 'Job title is required.', variant: 'destructive' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, description, due_date: dueDate || null, assigned_to: assignedTo || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create job');
      }

      toast({ title: 'Success', description: 'Job created successfully!' });
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
      fetchJobs(); // Refresh list
    } catch (err) {
      let message = 'An unknown error occurred';
      if (err instanceof Error) {
        message = err.message;
      }
      toast({ title: 'Error', description: `Could not create job: ${message}`, variant: 'destructive' });
    }
  };

  const handleEditJob = async () => {
    if (!currentJob || !title) {
      toast({ title: 'Error', description: 'Job title is required.', variant: 'destructive' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`/api/jobs/${currentJob.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, description, due_date: dueDate || null, status, assigned_to: assignedTo || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      toast({ title: 'Success', description: 'Job updated successfully!' });
      setIsEditModalOpen(false);
      setCurrentJob(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('pending');
      setAssignedTo('');
      fetchJobs(); // Refresh list
    } catch (err) {
      let message = 'An unknown error occurred';
      if (err instanceof Error) {
        message = err.message;
      }
      toast({ title: 'Error', description: `Could not update job: ${message}`, variant: 'destructive' });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      toast({ title: 'Success', description: 'Job deleted successfully!' });
      fetchJobs(); // Refresh list
    } catch (err) {
      let message = 'An unknown error occurred';
      if (err instanceof Error) {
        message = err.message;
      }
      toast({ title: 'Error', description: `Could not delete job: ${message}`, variant: 'destructive' });
    }
  };

  const openEditModal = (job: Job) => {
    setCurrentJob(job);
    setTitle(job.title);
    setDescription(job.description || '');
    setDueDate(job.due_date ? job.due_date.split('T')[0] : ''); // Format for input type="date"
    setStatus(job.status);
    setAssignedTo(job.assigned_to || '');
    setIsEditModalOpen(true);
  };

  if (!authLoading && !currentUser) {
    return <div>Please log in to view jobs.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job List</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due_date" className="text-right">
                  Due Date
                </Label>
                <Input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assigned_to" className="text-right">
                  Assigned To (User ID)
                </Label>
                <Input id="assigned_to" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Optional" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateJob}>Create Job</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="title">Name</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(val: 'asc' | 'desc') => { setSortOrder(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => { setFilter('all'); setPage(1); }}>All</Button>
        <Button variant={filter === 'today' ? 'default' : 'outline'} onClick={() => { setFilter('today'); setPage(1); }}>Today</Button>
        <Button variant={filter === 'week' ? 'default' : 'outline'} onClick={() => { setFilter('week'); setPage(1); }}>This Week</Button>
        <Button variant={filter === 'month' ? 'default' : 'outline'} onClick={() => { setFilter('month'); setPage(1); }}>This Month</Button>
        <Button variant={filter === 'year' ? 'default' : 'outline'} onClick={() => { setFilter('year'); setPage(1); }}>This Year</Button>
      </div>

      {loadingJobs ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p>No jobs found.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="truncate pr-2" title={job.title}>{job.title}</span>
                    {isAdminOrSenior && (
                      <div className="flex space-x-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteJob(job.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                  <div className="mt-auto space-y-1 pt-4">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Status:</span>
                      <span className={`capitalize ${job.status === 'completed' ? 'text-green-600' : job.status === 'in-progress' ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Due:</span>
                      <span>{job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Created:</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Updated:</span>
                      <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Assigned:</span>
                      <span className="truncate max-w-[100px]" title={job.assigned_to || 'Self'}>{job.assigned_to || 'Self'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {/* Edit Job Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-due_date" className="text-right">
                Due Date
              </Label>
              <Input id="edit-due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-assigned_to" className="text-right">
                  Assigned To (User ID)
                </Label>
                <Input id="edit-assigned_to" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Optional" className="col-span-3" />
              </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditJob}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsPage;

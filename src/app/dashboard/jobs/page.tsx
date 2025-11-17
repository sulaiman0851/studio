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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

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

  const fetchJobs = async (currentFilter: FilterType) => {
    setLoadingJobs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`/api/jobs?filter=${currentFilter}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data);
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
      fetchJobs(filter);
    }
  }, [authLoading, currentUser, filter]);

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
      fetchJobs(filter); // Refresh list
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
      fetchJobs(filter); // Refresh list
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
      fetchJobs(filter); // Refresh list
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

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!currentUser) {
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

      <div className="flex space-x-2 mb-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'today' ? 'default' : 'outline'} onClick={() => setFilter('today')}>Today</Button>
        <Button variant={filter === 'week' ? 'default' : 'outline'} onClick={() => setFilter('week')}>This Week</Button>
        <Button variant={filter === 'month' ? 'default' : 'outline'} onClick={() => setFilter('month')}>This Month</Button>
        <Button variant={filter === 'year' ? 'default' : 'outline'} onClick={() => setFilter('year')}>This Year</Button>
      </div>

      {loadingJobs ? (
        <p>Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p>No jobs found for this filter.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {job.title}
                  {isAdminOrSenior && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(job)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteJob(job.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Due: {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Status: {job.status}</p>
                <p className="text-xs text-muted-foreground">Assigned To: {job.assigned_to || 'Self'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
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


'use client';

import { useAppContext } from '@/components/app-shell';
import { JobsDataTable } from '@/components/jobs/data-table';
import { jobsColumns } from '@/components/jobs/columns';
import { updateJobAction, deleteJobAction } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import type { Job, User, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function NotificationContent({
  title,
  description,
  jobs,
  currentUser,
  users,
  onUpdateJob,
  onDeleteJob,
  onCreateJob
}: {
  title: string;
  description: string;
  jobs: Job[];
  currentUser: User;
  users: User[];
  onUpdateJob: (job: Job, userRole: UserRole) => Promise<boolean>;
  onDeleteJob: (jobId: number) => Promise<void>;
  onCreateJob: (job: Omit<Job, 'id' | 'job_id'>) => Promise<boolean>;
}) {
  if (jobs.length === 0) {
    return (
        <Card className="mt-4">
            <CardHeader className="items-center text-center">
                <BellRing className="h-12 w-12 mb-4 text-muted-foreground" />
                <CardTitle>All Caught Up</CardTitle>
                <CardDescription>There are no notifications in this category.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <JobsDataTable 
          columns={jobsColumns} 
          data={jobs} 
          currentUser={currentUser} 
          users={users}
          onUpdateJob={onUpdateJob} 
          onDeleteJob={onDeleteJob}
          onCreateJob={onCreateJob}
        />
      </CardContent>
    </Card>
  );
}


export default function NotificationsPage() {
  const { currentUser, users, jobs, setJobs } = useAppContext();

  if (!currentUser || !jobs || !users) {
    return null; // Data is loading in AppShell
  }
  
  const isPrivilegedUser = currentUser.role === 'Admin' || currentUser.role === 'Senior';
  
  const jobsForApproval = isPrivilegedUser ? jobs.filter(job => job.status === 'Pending Approval') : [];
  
  const newJobs = isPrivilegedUser 
    ? jobs.filter(job => job.status === 'Pending')
    : jobs.filter(job => job.status === 'Pending' && job.assigned_engineer_id === currentUser.id);

  const handleUpdateJob = async (updatedJob: Job, userRole: UserRole) => {
    const isApproving = updatedJob.status === 'Pending Approval' && isPrivilegedUser;
    const result = await updateJobAction(updatedJob, userRole);
    
    if (result.success) {
      const engineer = users.find(u => u.id === updatedJob.assigned_engineer_id);
      const finalJobState = isApproving
        ? { ...updatedJob, status: 'In Progress', assigned_engineer_name: engineer?.name || 'Unassigned' }
        : { ...updatedJob, assigned_engineer_name: engineer?.name || 'Unassigned' };

      setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? finalJobState : job)));

      toast({
        title: isApproving ? "Job Approved" : "Job Updated",
        description: `Job ${updatedJob.job_id} has been successfully updated.`,
      });
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.error || "Could not update the job.",
      });
      return false;
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    const jobToDelete = jobs.find(j => j.id === jobId);
    if (!jobToDelete) return;
    
    const result = await deleteJobAction(jobId);
    if (result.success) {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({
        title: "Job Deleted",
        description: `Job ${jobToDelete.job_id} has been deleted.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: result.error || "Could not delete the job.",
      });
    }
  };
  
  // This is a placeholder as onCreateJob is not directly used on this page
  const handleCreateJob = async (newJobData: Omit<Job, 'id'|'job_id'>) => {
    toast({
        variant: 'destructive',
        title: 'Not Implemented',
        description: 'Creating jobs from this page is not supported.',
    });
    return false;
  };


  const defaultTab = isPrivilegedUser ? "approvals" : "new-jobs";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className={`grid w-full ${isPrivilegedUser ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isPrivilegedUser && <TabsTrigger value="approvals">Pending Approval</TabsTrigger>}
        <TabsTrigger value="new-jobs">New Jobs</TabsTrigger>
      </TabsList>
      
      {isPrivilegedUser && (
        <TabsContent value="approvals">
           <NotificationContent 
             title="Pending Approvals"
             description="Jobs with pending updates that require your approval."
             jobs={jobsForApproval}
             currentUser={currentUser}
             users={users}
             onUpdateJob={handleUpdateJob}
             onDeleteJob={handleDeleteJob}
             onCreateJob={handleCreateJob}
           />
        </TabsContent>
      )}

      <TabsContent value="new-jobs">
        <NotificationContent 
          title="New Jobs"
          description={isPrivilegedUser ? "All new jobs that are pending assignment or action." : "New jobs assigned to you."}
          jobs={newJobs}
          currentUser={currentUser}
          users={users}
          onUpdateJob={handleUpdateJob}
          onDeleteJob={handleDeleteJob}
          onCreateJob={handleCreateJob}
        />
      </TabsContent>
    </Tabs>
  );
}

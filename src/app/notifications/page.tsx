
'use client';

import { useAppContext } from '@/components/app-shell';
import { JobsDataTable } from '@/components/jobs/data-table';
import { jobsColumns } from '@/components/jobs/columns';
import { updateJobAction, deleteJobAction } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import type { Job, User } from '@/lib/types';
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
  onUpdateJob: (job: Job, userRole: User['role']) => Promise<boolean>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onCreateJob: (job: Job) => Promise<boolean>;
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
    : jobs.filter(job => job.status === 'Pending' && job.assignedEngineer === currentUser.name);

  const handleUpdateJob = async (updatedJob: Job, userRole: User['role']) => {
    const isApproving = updatedJob.status === 'Pending Approval' && isPrivilegedUser;
    const result = await updateJobAction(updatedJob, userRole);
    
    if (result.success) {
      // For approvals, we might want to set status to 'In Progress' or something else
      const finalJobState = isApproving ? { ...updatedJob, status: 'In Progress' } : updatedJob;

      setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? finalJobState : job)));

      toast({
        title: isApproving ? "Job Approved" : "Job Updated",
        description: `Job ${updatedJob.id} has been successfully updated.`,
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

  const handleDeleteJob = async (jobId: string) => {
    const result = await deleteJobAction(jobId);
    if (result.success) {
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({
        title: "Job Deleted",
        description: `Job ${jobId} has been deleted.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: result.error || "Could not delete the job.",
      });
    }
  };

  const handleCreateJob = async (newJobData: Job) => {
    const result = await updateJobAction(newJobData, currentUser.role); // Using update action as a placeholder
    if (result.success) {
      setJobs(prevJobs => [...prevJobs, newJobData]);
      toast({
        title: 'Job Created',
        description: `New job for ${newJobData.customerName} has been created.`,
      });
      return true;
    } else {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: result.error || 'Could not create the job.',
      });
      return false;
    }
  };


  const defaultTab = isPrivilegedUser ? "approvals" : "new-jobs";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {isPrivilegedUser && <TabsTrigger value="approvals">Pending Approval</TabsTrigger>}
        <TabsTrigger value="new-jobs" className={!isPrivilegedUser ? 'col-span-2' : ''}>New Jobs</TabsTrigger>
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

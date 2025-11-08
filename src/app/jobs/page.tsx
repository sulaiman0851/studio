
'use client';

import { createJobAction, updateJobAction, deleteJobAction } from '@/lib/actions';
import type { Job, User } from '@/lib/types';
import { JobsDataTable } from '@/components/jobs/data-table';
import { jobsColumns } from '@/components/jobs/columns';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/components/app-shell';


export default function JobsPage() {
  const { currentUser, users, jobs, setJobs } = useAppContext();

  const handleCreateJob = async (newJobData: Job) => {
    const result = await createJobAction(newJobData);
    if (result.success && result.job) {
      setJobs(prevJobs => [...prevJobs, result.job!]);
      toast({
        title: 'Job Created',
        description: `New job ${result.job.id} for ${result.job.customerName} has been created.`,
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
  
  const handleUpdateJob = async (updatedJob: Job, userRole: User['role']) => {
    const result = await updateJobAction(updatedJob, userRole);
    if (result.success) {
      if (userRole === 'Admin' || userRole === 'Senior') {
        setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? updatedJob : job)));
      } else {
        // For engineers, the status is changed to 'Pending Approval'
        setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? { ...job, status: 'Pending Approval' } : job)));
      }
      // The toast message is now handled inside JobFormSheet for more context
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: result.error || "Could not save the job.",
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

  if (!currentUser || !jobs || !users) {
    return null; // Data is loading in AppShell
  }

  return (
    <JobsDataTable 
      columns={jobsColumns} 
      data={jobs} 
      currentUser={currentUser}
      users={users}
      onCreateJob={handleCreateJob}
      onUpdateJob={handleUpdateJob} 
      onDeleteJob={handleDeleteJob} 
    />
  );
}

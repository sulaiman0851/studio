
'use client';

import { createJobAction, updateJobAction, deleteJobAction } from '@/lib/actions';
import type { Job, User, UserRole } from '@/lib/types';
import { JobsDataTable } from '@/components/jobs/data-table';
import { jobsColumns } from '@/components/jobs/columns';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from '@/components/app-shell';


export default function JobsPage() {
  const { currentUser, users, jobs, setJobs } = useAppContext();

  const handleCreateJob = async (newJobData: Omit<Job, 'id' | 'job_id'>) => {
    const result = await createJobAction(newJobData);
    if (result.success && result.job) {
      // Create a temporary job object for the UI update
      const engineer = users.find(u => u.id === result.job!.assigned_engineer_id);
      const tempJob = {
          ...result.job,
          assigned_engineer_name: engineer?.name || 'Unassigned'
      } as Job;

      setJobs(prevJobs => [...prevJobs, tempJob]);
      toast({
        title: 'Job Created',
        description: `New job ${result.job.job_id} for ${result.job.customer_name} has been created.`,
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
  
  const handleUpdateJob = async (updatedJob: Job, userRole: UserRole) => {
    const result = await updateJobAction(updatedJob, userRole);
    if (result.success) {
      const engineer = users.find(u => u.id === updatedJob.assigned_engineer_id);
      
      const finalJobState = (userRole === 'Admin' || userRole === 'Senior')
        ? { ...updatedJob, assigned_engineer_name: engineer?.name || 'Unassigned' }
        : { ...updatedJob, status: 'Pending Approval', assigned_engineer_name: engineer?.name || 'Unassigned' };
      
      setJobs(prevJobs => prevJobs.map(job => (job.id === updatedJob.id ? finalJobState : job)));
      
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

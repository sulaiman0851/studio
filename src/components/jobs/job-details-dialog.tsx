
'use client';

import Image from 'next/image';
import type { Job, User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface JobDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  users: User[];
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-md">{value || '-'}</p>
  </div>
);

export function JobDetailsDialog({ isOpen, onOpenChange, job, users }: JobDetailsDialogProps) {
  if (!job) return null;
  
  const statusVariantMap: Record<Job['status'], "default" | "secondary" | "destructive" | "outline"> = {
    Completed: "default",
    "In Progress": "secondary",
    Pending: "outline",
    Cancelled: "destructive",
    "Pending Approval": "default"
  };

  const assignedEngineer = users.find(u => u.id === job.assigned_engineer_id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Job Details: {job.job_id}</DialogTitle>
          <DialogDescription>
            Viewing details for the job assigned to {job.customer_name}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="space-y-6 py-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Job Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="Customer Name" value={job.customer_name} />
                <DetailItem label="Address" value={job.address} />
                <DetailItem label="Job Type" value={job.job_type} />
                <DetailItem label="Assigned Engineer" value={assignedEngineer?.name || 'Unassigned'} />
                <DetailItem label="Date" value={new Date(job.date).toLocaleDateString()} />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={statusVariantMap[job.status]}>{job.status}</Badge>
                </div>
              </div>
              <DetailItem label="Reason for Job" value={job.reason} />
            </div>

            <Separator />
            <h4 className="text-lg font-semibold">Equipment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Equipment Type" value={job.equipment.type} />
              <DetailItem label="Serial Number (SN)" value={job.equipment.serialNumber} />
              <DetailItem label="Power R/X" value={job.equipment.powerRx} />
            </div>

            <Separator />
            <h4 className="text-lg font-semibold">Network Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem label="PPPoE Username" value={job.network?.pppoeUsername} />
                <DetailItem label="Default SSID" value={job.network?.defaultSsid} />
                <DetailItem label="New SSID" value={job.network?.newSsid} />
            </div>

            <Separator />
            <h4 className="text-lg font-semibold">Photos</h4>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PlaceHolderImages.slice(0,3).map(img => (
                    <div key={img.id} className="relative aspect-video">
                        <Image src={img.imageUrl} alt={img.description} fill className="rounded-md object-cover" data-ai-hint={img.imageHint} />
                    </div>
                ))}
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

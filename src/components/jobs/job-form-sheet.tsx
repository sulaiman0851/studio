
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Job, JobType, JobStatus, User, UserRole } from "@/lib/types";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SerialNumberInput } from "./serial-number-input";
import { AiSuggestionBox } from "./ai-suggestion-box";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Loader2 } from "lucide-react";

const jobSchema = z.object({
  id: z.number().optional(),
  job_id: z.string().optional(),
  customer_name: z.string().min(2, "Customer name is required."),
  address: z.string().min(5, "Address is required."),
  job_type: z.string({ required_error: "Please select a job type."}),
  status: z.string(),
  reason: z.string().min(10, "Reason must be at least 10 characters."),
  assigned_engineer_id: z.string({ required_error: "Please assign an engineer."}).nullable(),
  date: z.string(),
  equipment: z.object({
    type: z.enum(["Modem", "ONT"], { required_error: "Please select equipment type."}),
    serialNumber: z.string().min(6, "Serial number is required."),
    powerRx: z.string().min(3, "Power R/X is required."),
  }),
  network: z.object({
    pppoeUsername: z.string().optional(),
    pppoePassword: z.string().optional(),
    newSsid: z.string().optional(),
    wlanKey: z.string().optional(),
    defaultSsid: z.string().optional(),
  }).optional(),
});

const jobTypes: JobType[] = [
  "Installation", "Troubleshoot", "Replace Modem / ONT", "Terminate Modem / ONT", 
  "Survey", "Customer Handling / Support", "Maintenance", "Re-Aktivasi Modem / ONT"
];

const jobStatuses: JobStatus[] = ["Pending", "In Progress", "Completed", "Cancelled", "Pending Approval"];

interface JobFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  user: User;
  users: User[];
  onSave: (data: any) => Promise<boolean>;
}

const getFreshJob = (currentUser: User): Partial<Job> => ({
    customer_name: '',
    address: '',
    reason: '',
    assigned_engineer_id: currentUser.role === 'Engineer' ? currentUser.id : null,
    status: 'Pending',
    date: new Date().toISOString(),
    job_type: 'Installation',
    equipment: {
        type: 'ONT',
        serialNumber: '',
        powerRx: '',
    },
    network: {
        pppoeUsername: '',
        pppoePassword: '',
        newSsid: '',
        wlanKey: '',
        defaultSsid: '',
    },
});

export function JobFormSheet({ isOpen, onOpenChange, job, user, users, onSave }: JobFormSheetProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!job;
  
  const form = useForm<z.infer<typeof jobSchema>>({
    resolver: zodResolver(jobSchema),
    defaultValues: isEditing ? job : getFreshJob(user),
  });

  React.useEffect(() => {
    if (isOpen) {
        form.reset(isEditing ? job : getFreshJob(user));
    }
  }, [isOpen, job, isEditing, user, form]);

  const isPrivilegedUser = user.role === 'Admin' || user.role === 'Senior';
  const isApproving = isPrivilegedUser && job?.status === 'Pending Approval';
  const engineers = (users || []).filter(u => u.role === 'Engineer' || u.role === 'Senior');

  async function onSubmit(data: z.infer<typeof jobSchema>) {
    setIsSaving(true);
    
    // The onSave prop expects different types for create vs update
    const payload = isEditing ? { ...job, ...data } : data;

    const success = await onSave(payload);
    setIsSaving(false);

    if (success) {
      let toastMessage: { title: string; description: string; };
      if (isEditing) {
        if (!isPrivilegedUser) {
            toastMessage = {
            title: "Update Requested",
            description: `Request to update job ${data.job_id} has been sent for approval.`,
            };
        } else if (isApproving) {
            toastMessage = {
            title: "Job Approved",
            description: `Job ${data.job_id} has been updated and approved.`,
            };
        }
        else {
            toastMessage = {
            title: "Job Updated",
            description: `Job ${data.job_id} for ${data.customer_name} has been saved.`,
            };
        }
      } else {
         toastMessage = {
            title: "Job Created",
            description: `New job for ${data.customer_name} has been successfully created.`,
         };
      }
      toast(toastMessage);
      onOpenChange(false);
    }
  }

  const handleGeotagPhoto = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        console.log("Lat:", position.coords.latitude, "Lng:", position.coords.longitude);
        toast({
            title: "Location Acquired",
            description: "Geotag captured. You can now select a photo."
        });
        // In a real app, you would trigger a file input here.
      }, () => {
        toast({
            title: "Error",
            description: "Could not get location.",
            variant: "destructive"
        });
      });
    }
  };
  
  const submitButtonText = () => {
    if (isSaving) return 'Saving...';
    if (!isEditing) return 'Create Job';
    if (isApproving) return 'Approve Changes';
    if (isPrivilegedUser) return 'Save Changes';
    return 'Request Update';
  };
  
  const sheetTitle = isEditing 
    ? (isApproving ? 'Approve Job Update:' : 'Edit Job:') + ` ${job?.job_id || ''}`
    : 'Create a New Job';
  
  const sheetDescription = isEditing
    ? (isApproving ? `Review and approve changes for job assigned to ${job?.customer_name}.` : `Update the details for the job assigned to ${job?.customer_name}.`)
    : 'Fill in the details below to create a new job entry.';


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>{sheetTitle}</SheetTitle>
              <SheetDescription>{sheetDescription}</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 pr-6">
              <div className="space-y-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="job_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="assigned_engineer_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assigned Engineer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""} disabled={!isPrivilegedUser && user.role === 'Engineer'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an engineer" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {engineers.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                  />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isPrivilegedUser}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {jobStatuses.map(status => <SelectItem key={status} value={status} disabled={status === 'Pending Approval' && !isPrivilegedUser}>{status}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Job</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the reason for this job..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <h4 className="text-md font-semibold">Equipment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="equipment.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Type</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select equipment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONT">ONT</SelectItem>
                            <SelectItem value="Modem">Modem</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <SerialNumberInput />
                  <FormField
                    control={form.control}
                    name="equipment.powerRx"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power R/X</FormLabel>
                        <FormControl>
                          <Input placeholder="-21.5 dBm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                <h4 className="text-md font-semibold">Network Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="network.pppoeUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PPPoE Username</FormLabel>
                        <FormControl>
                          <Input placeholder="user@isp.com" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="network.pppoePassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PPPoE Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="network.newSsid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New SSID</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer_WiFi" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="network.wlanKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WLAN Key</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {isEditing && (
                    <>
                        <Separator />
                        <AiSuggestionBox />

                        <Separator />
                        <h4 className="text-md font-semibold">Photo Upload</h4>
                        <div className="space-y-4">
                            <Button type="button" variant="outline" onClick={handleGeotagPhoto}>Upload Geotagged Photo</Button>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {PlaceHolderImages.slice(0,3).map(img => (
                                    <div key={img.id} className="relative aspect-video">
                                        <Image src={img.imageUrl} alt={img.description} fill className="rounded-md object-cover" data-ai-hint={img.imageHint} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}


              </div>
            </ScrollArea>
            <SheetFooter className="pt-4 border-t">
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonText()}
              </Button>
            </SheetFooter>
          </form>
        </Form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}

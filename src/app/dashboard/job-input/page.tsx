'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth to get currentUser

type JobType =
  | 'Instalasi'
  | 'Troubleshoot'
  | 'Replace Modem / ONT'
  | 'Terminate Modem / ONT'
  | 'Survei'
  | 'Customer Handling / Support'
  | 'Maintenance'
  | 'Re-Aktivasi Modem / ONT';

const JobInputPage = () => {
  const supabase = createClient();
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get currentUser

  const [jobType, setJobType] = useState<JobType | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [typeModemOnt, setTypeModemOnt] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [powerRx, setPowerRx] = useState('');
  const [pppoeUsername, setPppoeUsername] = useState('');
  const [pppoePassword, setPppoePassword] = useState('');
  const [defaultSsid, setDefaultSsid] = useState('');
  const [newSsidWlanKey, setNewSsidWlanKey] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a job.',
        variant: 'destructive',
      });
      return;
    }
    if (!jobType) {
      toast({
        title: 'Error',
        description: 'Please select a Job Type.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const formData = {
      user_id: currentUser.id,
      job_type: jobType,
      customer_name: customerName,
      type_modem_ont: typeModemOnt,
      serial_number: serialNumber,
      power_rx: powerRx,
      pppoe_username: pppoeUsername,
      pppoe_password: pppoePassword,
      default_ssid: defaultSsid,
      new_ssid_wlan_key: newSsidWlanKey,
      reason: reason,
    };

    const { error } = await supabase.from('job_entries').insert([formData]);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Job entry submitted successfully!',
      });

      // Send Telegram notification
      try {
        const telegramResponse = await fetch('/api/send-telegram-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobDetails: formData }),
        });

        if (!telegramResponse.ok) {
          console.error('Failed to send Telegram notification via API route.');
          toast({
            title: 'Warning',
            description: 'Job submitted, but Telegram notification failed.',
            variant: 'destructive', // Changed to destructive as it's a failure
          });
        } else {
          toast({
            title: 'Notification Sent',
            description: 'Telegram notification sent successfully!',
          });
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notification:', telegramError);
        toast({
          title: 'Warning',
          description: 'Job submitted, but an error occurred while sending Telegram notification.',
          variant: 'destructive', // Changed to destructive as it's an error
        });
      }

      // Clear form fields
      setJobType('');
      setCustomerName('');
      setTypeModemOnt('');
      setSerialNumber('');
      setPowerRx('');
      setPppoeUsername('');
      setPppoePassword('');
      setDefaultSsid('');
      setNewSsidWlanKey('');
      setReason('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Form Input Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={(value: JobType) => setJobType(value)}>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select a job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instalasi">Instalasi</SelectItem>
                  <SelectItem value="Troubleshoot">Troubleshoot</SelectItem>
                  <SelectItem value="Replace Modem / ONT">Replace Modem / ONT</SelectItem>
                  <SelectItem value="Terminate Modem / ONT">Terminate Modem / ONT</SelectItem>
                  <SelectItem value="Survei">Survei</SelectItem>
                  <SelectItem value="Customer Handling / Support">Customer Handling / Support</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Re-Aktivasi Modem / ONT">Re-Aktivasi Modem / ONT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Sub-parameters based on Job Type */}
            {jobType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mt-4">Sub-parameters for {jobType}</h3>
                
                {/* Customer Name - Always visible */}
                <div className="grid gap-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Modem/ONT related */}
                {(jobType === 'Instalasi' ||
                  jobType === 'Troubleshoot' ||
                  jobType === 'Replace Modem / ONT' ||
                  jobType === 'Re-Aktivasi Modem / ONT') && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="typeModemOnt">Type Modem/ONT</Label>
                      <Input
                        id="typeModemOnt"
                        value={typeModemOnt}
                        onChange={(e) => setTypeModemOnt(e.target.value)}
                        placeholder="Enter modem/ONT type"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="serialNumber">Serial Number (SN masked default)</Label>
                      <Input
                        id="serialNumber"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Enter serial number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="powerRx">Power R/X</Label>
                      <Input
                        id="powerRx"
                        value={powerRx}
                        onChange={(e) => setPowerRx(e.target.value)}
                        placeholder="Enter power R/X"
                      />
                    </div>
                  </>
                )}

                {/* PPPOE related */}
                {(jobType === 'Instalasi' ||
                  jobType === 'Troubleshoot' ||
                  jobType === 'Re-Aktivasi Modem / ONT') && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="pppoeUsername">PPPOE Username</Label>
                      <Input
                        id="pppoeUsername"
                        value={pppoeUsername}
                        onChange={(e) => setPppoeUsername(e.target.value)}
                        placeholder="Enter PPPOE username"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pppoePassword">PPPOE Password</Label>
                      <Input
                        id="pppoePassword"
                        type="password"
                        value={pppoePassword}
                        onChange={(e) => setPppoePassword(e.target.value)}
                        placeholder="Enter PPPOE password"
                      />
                    </div>
                  </>
                )}

                {/* SSID/WLAN related */}
                {(jobType === 'Instalasi' ||
                  jobType === 'Replace Modem / ONT' ||
                  jobType === 'Re-Aktivasi Modem / ONT') && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="defaultSsid">Default SSID</Label>
                      <Input
                        id="defaultSsid"
                        value={defaultSsid}
                        onChange={(e) => setDefaultSsid(e.target.value)}
                        placeholder="Enter default SSID"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="newSsidWlanKey">New SSID + WLAN Key</Label>
                      <Input
                        id="newSsidWlanKey"
                        value={newSsidWlanKey}
                        onChange={(e) => setNewSsidWlanKey(e.target.value)}
                        placeholder="Enter new SSID and WLAN key"
                      />
                    </div>
                  </>
                )}

                {/* Reason */}
                {(jobType === 'Terminate Modem / ONT' ||
                  jobType === 'Troubleshoot' ||
                  jobType === 'Maintenance' ||
                  jobType === 'Customer Handling / Support' ||
                  jobType === 'Survei') && (
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason"
                    />
                  </div>
                )}
              </div>
            )}

            <Button type="submit">Submit Job</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobInputPage;

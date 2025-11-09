export type UserRole = 'Admin' | 'Senior' | 'Engineer';

export type User = {
  id: string; // Corresponds to Supabase auth.users.id (UUID)
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
};

export type JobType =
  | 'Installation'
  | 'Troubleshoot'
  | 'Replace Modem / ONT'
  | 'Terminate Modem / ONT'
  | 'Survey'
  | 'Customer Handling / Support'
  | 'Maintenance'
  | 'Re-Aktivasi Modem / ONT';

export type JobStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Pending Approval';

export type Job = {
  id: number; // Corresponds to SERIAL PRIMARY KEY in Supabase
  job_id: string; // Custom job ID like "JOB-001"
  customer_name: string;
  address: string;
  job_type: JobType;
  status: JobStatus;
  assigned_engineer_id: string | null; // UUID from auth.users
  assigned_engineer_name?: string; // This will be joined from the users table
  date: string; // ISO 8601 format
  equipment: {
    type: 'Modem' | 'ONT';
    serialNumber: string;
    powerRx: string;
  };
  network: {
    pppoeUsername?: string;
    pppoePassword?: string;
    defaultSsid?: string;
    newSsid?: string;
    wlanKey?: string;
  };
  reason: string;
  notes?: string;
  photos?: { url: string; geotag: { lat: number; lng: number } }[];
};

export type TelegramSettings = {
  botToken: string;
  chatId: string;
};

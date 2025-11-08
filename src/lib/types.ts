
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Senior' | 'Engineer';
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
  id: string;
  customerName: string;
  address: string;
  jobType: JobType;
  status: JobStatus;
  assignedEngineer: string;
  date: string; // ISO 8601 format
  equipment: {
    type: 'Modem' | 'ONT';
    serialNumber: string;
    powerRx: string; // e.g., "-21.5 dBm"
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

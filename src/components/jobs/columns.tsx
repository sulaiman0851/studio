
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job, JobStatus } from "@/lib/types";
import { DataTableRowActions } from "./data-table-row-actions";

const statusVariantMap: Record<JobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  Completed: "default",
  "In Progress": "secondary",
  Pending: "outline",
  Cancelled: "destructive",
  "Pending Approval": "default", // Will be styled with custom class
};

export const jobsColumns: ColumnDef<Job>[] = [
  {
    accessorKey: "job_id",
    header: "Job ID",
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "job_type",
    header: "Job Type",
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as JobStatus;
      const isPendingApproval = status === "Pending Approval";
      return <Badge 
              variant={statusVariantMap[status]} 
              className={isPendingApproval ? 'bg-yellow-500 text-white' : ''}
             >
                {status}
            </Badge>;
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return new Intl.DateTimeFormat("en-US").format(date);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <DataTableRowActions row={row} />;
    },
  },
];

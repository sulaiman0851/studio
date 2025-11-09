
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job, User, UserRole } from "@/lib/types";
import { JobFormSheet } from "./job-form-sheet";
import { JobDetailsDialog } from "./job-details-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle } from "lucide-react";

interface DataTableProps<TData extends Job, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  currentUser: User;
  users: User[];
  onUpdateJob: (job: Job, userRole: UserRole) => Promise<boolean>;
  onCreateJob: (job: Omit<Job, 'id' | 'job_id'>) => Promise<boolean>;
  onDeleteJob: (jobId: number) => Promise<void>;
}

export function JobsDataTable<TData extends Job, TValue>({
  columns,
  data: initialData,
  currentUser,
  users,
  onUpdateJob,
  onCreateJob,
  onDeleteJob,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [editingJob, setEditingJob] = React.useState<TData | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [viewingJob, setViewingJob] = React.useState<TData | null>(null);
  const [jobToDelete, setJobToDelete] = React.useState<TData | null>(null);

  const dataWithActions = React.useMemo(() => {
    return initialData.map(job => ({
      ...job,
      onEdit: () => setEditingJob(job),
      onDelete: () => setJobToDelete(job),
      onViewDetails: () => setViewingJob(job),
    }));
  }, [initialData]);

  const table = useReactTable({
    data: dataWithActions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
        columnVisibility: {
            // Hide the raw 'id' column, we use 'job_id' for display
            id: false, 
        }
    }
  });

  const handleDelete = async () => {
    if (jobToDelete) {
      await onDeleteJob(jobToDelete.id);
      setJobToDelete(null);
    }
  };
  
  const handleSave = (jobData: any) => {
    if (editingJob) {
      // It's an update
      return onUpdateJob(jobData as Job, currentUser.role);
    }
    // It's a creation
    return onCreateJob(jobData as Omit<Job, 'id' | 'job_id'>);
  }

  const handleOpenCreate = () => {
    setEditingJob(null);
    setIsCreating(true);
  }

  const isSheetOpen = !!editingJob || isCreating;
  const onSheetOpenChange = (open: boolean) => {
    if (!open) {
      setEditingJob(null);
      setIsCreating(false);
    }
  };


  return (
    <div>
        <div className="flex items-center justify-between py-4">
            <Input
            placeholder="Filter by customer..."
            value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("customer_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <Button onClick={handleOpenCreate}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Job
            </Button>
        </div>
        <div className="rounded-md border">
            <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                    return (
                        <TableHead key={header.id}>
                        {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            )}
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Next
            </Button>
        </div>

        <JobFormSheet 
            isOpen={isSheetOpen} 
            onOpenChange={onSheetOpenChange} 
            job={editingJob} 
            user={currentUser}
            users={users}
            onSave={handleSave}
        />

        <JobDetailsDialog
            isOpen={!!viewingJob}
            onOpenChange={(open) => !open && setViewingJob(null)}
            job={viewingJob}
            users={users}
        />

        <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete job <span className="font-semibold">{jobToDelete?.job_id}</span> for <span className="font-semibold">{jobToDelete?.customer_name}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

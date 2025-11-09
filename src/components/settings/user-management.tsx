
'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, ArrowUpDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User, UserRole } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { updateUserRoleAction, deleteUserAction } from '@/lib/actions';

const roleVariantMap: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Senior: 'secondary',
  Engineer: 'outline',
};

interface UserManagementProps {
  initialUsers: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export function UserManagement({ initialUsers, setUsers }: UserManagementProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdating(true);
    const originalUsers = initialUsers;
    
    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    const result = await updateUserRoleAction(userId, newRole);

    if (result.success) {
        toast({
            title: "Role Updated",
            description: `User role has been changed to ${newRole}.`
        });
    } else {
        setUsers(originalUsers);
        toast({
            variant: 'destructive',
            title: "Update Failed",
            description: result.error || "Could not update user role."
        });
    }
    setIsUpdating(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setIsUpdating(true);
    const originalUsers = initialUsers;
    
    setUsers(currentUsers => currentUsers.filter(user => user.id !== userId));
    setUserToDelete(null);

    const result = await deleteUserAction(userId);

    if (result.success) {
        toast({
            title: "User Deleted",
            description: "The user has been successfully removed."
        });
    } else {
        setUsers(originalUsers);
        toast({
            variant: 'destructive',
            title: "Delete Failed",
            description: result.error || "Could not delete user."
        });
    }
    setIsUpdating(false);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as User['role'];
        return <Badge variant={roleVariantMap[role]}>{role}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const roles: User['role'][] = ['Admin', 'Senior', 'Engineer'];

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Edit Role</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole as User['role'])}
                    >
                        {roles.map(role => (
                            <DropdownMenuRadioItem key={role} value={role} disabled={isUpdating}>{role}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground"
                onClick={() => setUserToDelete(user)}
                disabled={isUpdating}
              >
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: initialUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
      <Card>
          <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                  Manage your team members and their roles.
              </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex items-center py-4">
                  <Input
                  placeholder="Filter by name..."
                  value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                  onChange={(event) =>
                      table.getColumn('name')?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                  />
                  {isUpdating && <Loader2 className="ml-4 h-5 w-5 animate-spin" />}
              </div>
              <div className="rounded-md border">
                  <Table>
                  <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                              {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                  )}
                          </TableHead>
                          ))}
                      </TableRow>
                      ))}
                  </TableHeader>
                  <TableBody>
                      {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                          <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
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
                          <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                          >
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
          </CardContent>
      </Card>

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user account for <span className="font-semibold">{userToDelete.name}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteUser(userToDelete.id)}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

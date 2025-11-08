
'use client';

import { useAppContext } from '@/components/app-shell';
import { UserManagement } from '@/components/settings/user-management';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return names[0].substring(0, 2);
};

const roleVariantMap: Record<User['role'], 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Senior: 'secondary',
  Engineer: 'outline',
};

function EngineerList({ users }: { users: User[] }) {
  // Menampilkan semua pengguna, tidak hanya engineer dan senior
  const allUsers = users;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engineer List</CardTitle>
        <CardDescription>
          A list of all users on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.length > 0 ? (
                allUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                       <Badge variant={roleVariantMap[user.role]}>{user.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


export default function EngineersPage() {
  const { currentUser, users, setUsers } = useAppContext();

  if (!currentUser || !users) {
    return null; // Data is loading in AppShell
  }
  
  if (currentUser.role === 'Admin') {
    return <UserManagement initialUsers={users} setUsers={setUsers} />;
  }

  return <EngineerList users={users} />;
}

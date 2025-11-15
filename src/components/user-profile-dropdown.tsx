import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { LogOut, Settings, User } from 'lucide-react';

export function UserProfileDropdown() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isProfilePicExpanded, setIsProfilePicExpanded] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <DropdownMenu>
        <Dialog open={isProfilePicExpanded} onOpenChange={setIsProfilePicExpanded}>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
              <DialogTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={currentUser?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=68"} />
                  <AvatarFallback>
                    {getInitials(currentUser?.email)}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <p className="font-semibold">My Account</p>
              <p className="text-xs text-muted-foreground dark:text-gray-300 font-normal">
                {currentUser?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
          <DialogContent className="sm:max-w-[425px] p-0">
            <DialogHeader>
              <DialogTitle className="sr-only">Profile Picture</DialogTitle>
            </DialogHeader>
            <img
              src={currentUser?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=68"}
              alt="Profile Picture"
              className="w-full h-auto object-contain rounded-lg"
            />
          </DialogContent>
        </Dialog>
      </DropdownMenu>
    </>
  );
}

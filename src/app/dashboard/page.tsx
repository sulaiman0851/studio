
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUser(userData.user);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', userData.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          router.push('/login');
        } else if (profileData) {
          setUserProfile(profileData);
        } else {
           router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };
    getUserAndProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-800">FieldOps Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 hidden sm:inline">
            Welcome, {userProfile.username} ({userProfile.role})!
          </span>
          {userProfile.role === 'admin' && (
             <Button variant="outline" onClick={() => router.push('/editrole')}>
                Edit Roles
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="destructive"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your Dashboard</CardTitle>
            <CardDescription>
              This is your main hub for managing operations.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p>Select an option to get started.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

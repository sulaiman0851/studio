'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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
          .eq('id', userData.user.id);

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
        } else if (profileData && profileData.length > 0) {
          setUserProfile(profileData[0]);
        } else {
          // Handle case where profile is not found
          console.error('Profile not found for user:', userData.user.id);
        }
      } else {
        router.push('/login');
      }
    };
    getUserAndProfile();
  }, []);

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
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Project Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {userProfile.username} ({userProfile.role})!</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Section */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-5 rounded-lg shadow flex flex-col items-start">
            <h3 className="text-lg font-semibold text-gray-700">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
            <p className="text-sm text-gray-500">+2 since last month</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow flex flex-col items-start">
            <h3 className="text-lg font-semibold text-gray-700">Tasks Completed</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">152</p>
            <p className="text-sm text-gray-500">+20.1% from last month</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow flex flex-col items-start">
            <h3 className="text-lg font-semibold text-gray-700">Files Shared</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">34</p>
            <p className="text-sm text-gray-500">+19% from last month</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow flex flex-col items-start">
            <h3 className="text-lg font-semibold text-gray-700">Team Members</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
            <p className="text-sm text-gray-500">+1 since last month</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="md:col-span-1 bg-white p-5 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-gray-700">
                <span className="font-medium">Olivia Martin</span> pushed a commit to Project Alpha.
              </p>
              <span className="text-sm text-gray-500 ml-auto">5m ago</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-gray-700">
                <span className="font-medium">Jackson Lee</span> created a new task in Project Beta.
              </p>
              <span className="text-sm text-gray-500 ml-auto">10m ago</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-gray-700">
                <span className="font-medium">Sophia Miller</span> shared a file in Project Gamma.
              </p>
              <span className="text-sm text-gray-500 ml-auto">1h ago</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
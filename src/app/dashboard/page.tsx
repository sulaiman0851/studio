import React from 'react';
import { RevenueChart, UsersChart } from '@/components/charts';

const DashboardPage = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard Overview
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Welcome back! Here's a summary of your operations.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <UsersChart />
      </div>

      {/* You can add more components here */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          - Technician John Doe completed a job.
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          - New work order #1234 created.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
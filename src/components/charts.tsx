'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const monthlyRevenue = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
];

const weeklyUsers = [
  { week: 'Week 1', users: 120 },
  { week: 'Week 2', users: 150 },
  { week: 'Week 3', users: 130 },
  { week: 'Week 4', users: 180 },
];

export const RevenueChart = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Revenue</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyRevenue}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UsersChart = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Active Users</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={weeklyUsers}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="users" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

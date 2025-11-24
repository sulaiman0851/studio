# Team Analytics Page

## Overview
Comprehensive analytics dashboard untuk monitoring performa seluruh tim/pengguna yang bekerja.

## Features

### 📊 Summary Cards
- **Total Jobs**: Total semua jobs dengan breakdown minggu ini
- **Team Members**: Jumlah anggota tim aktif
- **Completion Rate**: Persentase jobs yang selesai tepat waktu
- **Overdue Jobs**: Jobs yang terlambat dan perlu perhatian

### 📈 Charts & Visualizations

#### 1. Jobs Trend (Line Chart)
- Menampilkan trend pembuatan jobs dalam 30 hari terakhir
- Membantu identify pola workload harian

#### 2. Team Productivity (Bar Chart)
- Produktivitas per anggota tim dalam 7 hari terakhir
- Ranking berdasarkan jumlah jobs yang dibuat
- Top 10 most productive members

#### 3. Jobs by Type (Pie Chart)
- Distribusi jenis-jenis pekerjaan
- Persentase untuk setiap job type

#### 4. Jobs by Status (Pie Chart)
- Distribusi status jobs (pending, completed, in-progress, dll)
- Visual overview dari workload status

### 📋 Team Performance Table
Tabel detail untuk setiap anggota tim dengan metrics:
- **Name & Role**: Nama lengkap dan role (admin/user)
- **Jobs Created**: Total jobs yang dibuat
- **Jobs Assigned**: Total jobs yang di-assign ke user
- **Completed**: Jobs yang sudah selesai (hijau)
- **Pending**: Jobs yang masih pending (kuning)
- **Photos**: Total geotagged photos yang diupload
- **Last 7 Days**: Aktivitas minggu ini (badge hijau jika aktif)

## API Endpoint

### GET `/api/analytics`
Returns comprehensive analytics data:

```typescript
{
  summary: {
    totalJobs: number;
    totalUsers: number;
    totalPhotos: number;
    jobsLast30Days: number;
    jobsLast7Days: number;
    overdueJobs: number;
    completionRate: number;
  },
  userMetrics: Array<{
    id: string;
    username: string;
    fullname: string;
    role: string;
    totalJobsCreated: number;
    totalJobsAssigned: number;
    jobsLast30Days: number;
    jobsLast7Days: number;
    totalPhotos: number;
    completedJobs: number;
    pendingJobs: number;
  }>,
  jobsByType: Record<string, number>,
  jobsByStatus: Record<string, number>,
  dailyJobsTrend: Array<{
    date: string;
    count: number;
    label: string;
  }>,
  weeklyProductivity: Array<{
    username: string;
    count: number;
  }>
}
```

## Performance Considerations

### Optimizations Applied:
1. ✅ **Efficient queries**: Only fetch necessary columns
2. ✅ **Client-side processing**: Data aggregation di API route
3. ✅ **Indexed queries**: Menggunakan indexes yang sudah dibuat
4. ✅ **Pagination ready**: Top 10 untuk weekly productivity

### Expected Load Time:
- **With indexes**: ~1-2 seconds
- **Without indexes**: ~5-10 seconds

## Usage

### Access the Page
Navigate to: `/dashboard/analytics`

### Required Permissions
- Any authenticated user can view analytics
- Data is filtered based on user's access level

## Color Coding

### Charts
- Blue (#3b82f6): Primary data
- Green (#10b981): Completed/Success
- Orange (#f59e0b): Warning/Pending
- Red (#ef4444): Error/Overdue
- Purple (#8b5cf6): Admin/Special

### Status Badges
- **Green**: Active/Completed
- **Yellow**: Pending/In Progress
- **Red**: Overdue/Error
- **Purple**: Admin role
- **Blue**: User role

## Future Enhancements

### Potential Features:
1. **Date Range Picker**: Custom date range untuk analytics
2. **Export to PDF/Excel**: Download analytics report
3. **Real-time Updates**: WebSocket untuk live data
4. **Comparison View**: Compare periods (this week vs last week)
5. **Drill-down**: Click chart untuk detail view
6. **Filters**: Filter by team, role, job type
7. **Goals & Targets**: Set targets dan track progress
8. **Notifications**: Alert untuk anomalies atau milestones

## Troubleshooting

### Slow Loading
1. Ensure database indexes are created (see `sql/add_performance_indexes.sql`)
2. Check Supabase query performance in dashboard
3. Consider adding caching for analytics data

### Empty Charts
1. Verify there's data in the database
2. Check console for API errors
3. Ensure user has proper permissions

### Incorrect Data
1. Check date calculations (timezone issues)
2. Verify data relationships (foreign keys)
3. Check RLS policies in Supabase

## Technical Stack
- **Frontend**: React, TypeScript, Recharts
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts library
- **UI**: shadcn/ui components

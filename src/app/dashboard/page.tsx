'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {

  return (
    <div>
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Selamat datang di FieldOps.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Ini adalah pusat kendali Anda untuk mengelola semua operasi lapangan.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p>Pilih menu dari sidebar untuk memulai.</p>
          </Content>
        </Card>
    </div>
  );
}

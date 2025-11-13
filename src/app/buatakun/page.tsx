
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, HardHat } from 'lucide-react';

const buatAkunSchema = z.object({
    name: z.string().min(2, { message: 'Nama harus memiliki minimal 2 karakter.' }),
    email: z.string().email({ message: 'Harap masukkan alamat email yang valid.' }),
    password: z.string().min(8, { message: 'Kata sandi harus memiliki minimal 8 karakter.' }),
});

export default function BuatAkunPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof buatAkunSchema>>({
    resolver: zodResolver(buatAkunSchema),
    defaultValues: {
        name: '',
        email: '',
        password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof buatAkunSchema>) {
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          avatar: `https://i.pravatar.cc/150?u=${values.email}`
        },
      },
    });
    
    if (error) {
        toast({
            variant: 'destructive',
            title: 'Pendaftaran Gagal',
            description: error.message || 'Terjadi kesalahan yang tidak terduga.',
        });
        setIsLoading(false);
    } else {
        toast({
            title: 'Pendaftaran Berhasil',
            description: 'Akun Anda telah dibuat. Silakan login.',
        });
        router.push('/login');
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center animated-gradient">
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
              <HardHat className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
          <CardDescription>Mulai dengan FieldOps</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Akun
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

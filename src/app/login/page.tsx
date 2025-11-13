
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, HardHat } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message || 'Email atau kata sandi salah. Silakan coba lagi.',
      });
      setIsLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center animated-gradient">
        <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
                <div className="mb-4 flex justify-center">
                    <HardHat className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>Sign in to your FieldOps account</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex items-center justify-between">
                        <FormField
                        control={form.control}
                        name="remember"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Remember me
                                </FormLabel>
                            </div>
                            </FormItem>
                        )}
                        />
                        <Link href="#" className="text-sm font-medium text-primary hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                    </Button>
                </form>
                </Form>

                <div className="mt-6 text-center text-sm">
                Belum punya akun?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                    Sign Up
                </Link>
                </div>
                 <div className="mt-2 text-center text-sm">
                    Butuh akun cepat?{' '}
                    <Link href="/buatakun" className="font-medium text-primary hover:underline">
                        Buat Akun Cepat
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

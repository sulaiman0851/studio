
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const backgroundImages = [
    { url: 'https://images.unsplash.com/photo-1587573429392-3875dc93e483?q=80&w=2070&auto=format&fit=crop', hint: 'fiber optic' },
    { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop', hint: 'engineer working' },
    { url: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=2090&auto=format&fit=crop', hint: 'wifi router' },
    { url: 'https://images.unsplash.com/photo-1558001019-3429b1c78b53?q=80&w=2070&auto=format&fit=crop', hint: 'olt server' },
    { url: 'https://images.unsplash.com/photo-1614995133370-134299b6f49f?q=80&w=2070&auto=format&fit=crop', hint: 'fiber installation' },
    { url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=2070&auto=format&fit=crop', hint: 'engineer tech' },
    { url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=1974&auto=format&fit=crop', hint: 'wifi connection' },
    { url: 'https://images.unsplash.com/photo-1590859947231-3c583344db6f?q=80&w=2070&auto=format&fit=crop', hint: 'server room' }
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
        title: 'Login Failed',
        description: error.message || 'Invalid email or password. Please try again.',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      // This is crucial. It forces a server-side rerender of the layout,
      // which allows AppShell to pick up the new auth state correctly.
      router.refresh();
    }
  }

  return (
    <div className="relative w-full h-screen">
        {backgroundImages.map((bg, index) => (
            <Image
                key={bg.url}
                src={bg.url}
                alt="Technician working"
                fill
                className={
                    `object-cover transition-opacity duration-1000 ease-in-out
                    ${index === currentBgIndex ? 'opacity-100' : 'opacity-0'}`
                }
                data-ai-hint={bg.hint}
                priority={index === 0}
            />
        ))}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full items-center justify-center px-4">
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

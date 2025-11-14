'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { HardHat } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      toast({
        variant: 'destructive',
        title: 'Registrasi Gagal',
        description: signUpError.message,
      });
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', signUpData.user.id);

      if (updateError) {
        toast({
          variant: 'destructive',
          title: 'Update Profil Gagal',
          description: updateError.message,
        });
      } else {
        toast({
          title: 'Registrasi Berhasil',
          description: 'Silakan cek email Anda untuk verifikasi.',
        });
        router.push('/login');
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Toaster />
      <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2 text-center">
              <h1 className="text-3xl font-bold">Daftar</h1>
              <p className="text-balance text-muted-foreground">
                Buat akun baru untuk mulai berkolaborasi.
              </p>
            </div>
            <form onSubmit={handleRegister} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Membuat Akun...' : 'Buat Akun'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Sudah punya akun?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="hidden bg-muted lg:flex items-center justify-center flex-col text-center p-8 bg-background">
          <HardHat className="h-24 w-24 mb-4 text-primary" />
          <h2 className="text-4xl font-bold mb-2">Platform Kolaborasi Proyek</h2>
          <p className="text-lg text-muted-foreground">
            Kelola tugas, bagikan file, dan berkomunikasi dengan tim Anda secara efisien.
          </p>
        </div>
      </div>
    </>
  );
}

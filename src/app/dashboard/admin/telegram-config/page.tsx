'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TelegramConfigPage = () => {
  const { currentUser, loading, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [configId, setConfigId] = useState<string | null>(null); // To store the ID of the existing config
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Redirect if not admin or not logged in
  useEffect(() => {
    if (!loading && (!currentUser || role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
        variant: 'destructive',
      });
      router.push('/dashboard'); // Redirect to dashboard or login
    }
  }, [currentUser, loading, role, router, toast]);

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      if (role === 'admin') {
        const { data, error } = await supabase
          .from('telegram_configs')
          .select('*')
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          toast({
            title: 'Error',
            description: 'Failed to fetch Telegram config: ' + error.message,
            variant: 'destructive',
          });
        } else if (data) {
          setBotToken(data.bot_token);
          setChatId(data.chat_id);
          setConfigId(data.id);
        }
      }
      setIsLoadingConfig(false);
    };

    if (!loading && currentUser && role === 'admin') {
      fetchConfig();
    }
  }, [currentUser, loading, role, supabase, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const configData = {
      bot_token: botToken,
      chat_id: chatId,
      is_active: true,
    };

    let error = null;
    if (configId) {
      // Update existing config
      const { error: updateError } = await supabase
        .from('telegram_configs')
        .update(configData)
        .eq('id', configId);
      error = updateError;
    } else {
      // Insert new config
      const { error: insertError } = await supabase
        .from('telegram_configs')
        .insert([configData]);
      error = insertError;
    }

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save Telegram config: ' + error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Telegram configuration saved successfully!',
      });
      // Re-fetch config to ensure configId is set if it was an insert
      if (!configId) {
        const { data } = await supabase
          .from('telegram_configs')
          .select('id')
          .eq('is_active', true)
          .single();
        if (data) setConfigId(data.id);
      }
    }
    setIsSaving(false);
  };

  if (loading || isLoadingConfig || !currentUser || role !== 'admin') {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Checking permissions and loading configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Notification Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="botToken">Telegram Bot Token</Label>
              <Input
                id="botToken"
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your Telegram Bot Token"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chatId">Telegram Chat ID</Label>
              <Input
                id="chatId"
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Enter your Telegram Chat ID"
                required
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramConfigPage;

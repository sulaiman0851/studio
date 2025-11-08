
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTelegramSettingsAction, saveTelegramSettingsAction } from "@/lib/actions";
import type { TelegramSettings } from "@/lib/types";

const telegramSettingsSchema = z.object({
    botToken: z.string().min(1, { message: "Bot Token is required." }),
    chatId: z.string().min(1, { message: "Chat ID is required." }),
});

export function TelegramSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<z.infer<typeof telegramSettingsSchema>>({
    resolver: zodResolver(telegramSettingsSchema),
    defaultValues: {
      botToken: "",
      chatId: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsFetching(true);
      const settings = await getTelegramSettingsAction();
      if (settings) {
        form.reset(settings);
      }
      setIsFetching(false);
    }
    fetchSettings();
  }, [form]);

  async function onSubmit(values: z.infer<typeof telegramSettingsSchema>) {
    setIsLoading(true);
    const result = await saveTelegramSettingsAction(values);
    if (result.success) {
        toast({
            title: "Settings Saved",
            description: "Your Telegram notification settings have been updated.",
        });
    } else {
        toast({
            variant: 'destructive',
            title: "Save Failed",
            description: result.error || "Could not save Telegram settings.",
        });
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Notifications</CardTitle>
        <CardDescription>Configure your Telegram Bot API Token and Chat ID to receive job notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading settings...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="botToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot API Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your bot token" {...field} />
                    </FormControl>
                    <FormDescription>
                      The unique token for your Telegram bot.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chatId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the destination chat ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      The ID of the user, group, or channel to send notifications to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

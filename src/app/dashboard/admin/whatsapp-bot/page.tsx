'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const WhatsAppBotPage = () => {
  const { currentUser, loading, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connecting' | 'open' | 'error'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Redirect if not admin or not logged in
  useEffect(() => {
    if (!loading && (!currentUser || role !== 'admin')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view this page.',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } else {
        setIsLoading(false);
    }
  }, [currentUser, loading, role, router, toast]);

  // Poll for connection status
  useEffect(() => {
    if (role !== 'admin' || !phoneNumber) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/status?phoneNumber=${phoneNumber}`);
        const data = await response.json();
        if (data.success) {
          setSessionStatus(data.status);
          if(data.status === 'open') {
            setQrCode(null);
          }
        } else {
          setSessionStatus('disconnected');
        }
      } catch (error) {
        console.error('Failed to fetch session status:', error);
        setSessionStatus('error');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [phoneNumber, role]);

  // Poll for logs
  useEffect(() => {
    if (role !== 'admin' || !phoneNumber) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/whatsapp/logs?phoneNumber=${phoneNumber}`);
        const data = await response.json();
        if (data.success) {
          const qrLog = data.logs.find((log: string) => log.startsWith('QRCODE:'));
          if (qrLog) {
            setQrCode(qrLog.substring(7));
          }
          setLogs(data.logs);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [phoneNumber, role]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);


  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setQrCode(null);
    setLogs([]);

    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection Initiated',
          description: 'A QR code will be generated. Please wait.',
        });
        setSessionStatus('connecting');
      } else {
        toast({
          title: 'Connection Failed',
          description: data.message || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate connection. Please check the console.',
        variant: 'destructive',
      });
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Disconnected',
          description: 'WhatsApp session has been disconnected.',
        });
        setSessionStatus('disconnected');
        setPhoneNumber('');
        setQrCode(null);
        setLogs([]);
      } else {
        toast({
          title: 'Disconnection Failed',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to disconnect. Please check the console.',
          variant: 'destructive',
        });
        console.error('Disconnect error:', error);
    }
  };

  if (isLoading || !currentUser || role !== 'admin') {
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
    <>
      <div className="p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Bot Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionStatus === 'open' ? (
              <div className="space-y-4">
                <p>
                  WhatsApp is connected to: <strong>{phoneNumber}</strong>
                </p>
                <Button onClick={handleDisconnect} variant="destructive">
                  Disconnect
                </Button>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Session Name (e.g., Phone Number)</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter a unique session name"
                    required
                    disabled={sessionStatus === 'connecting' || isConnecting}
                  />
                </div>
                <Button type="submit" disabled={isConnecting || sessionStatus === 'connecting'}>
                  {isConnecting || sessionStatus === 'connecting' ? 'Connecting...' : 'Connect with QR Code'}
                </Button>
                {qrCode && (
                  <div className="mt-4 p-4 bg-white rounded-md flex justify-center">
                    <QRCodeSVG value={qrCode} />
                  </div>
                )}
                {sessionStatus === 'connecting' && !qrCode && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <p>
                      Attempting to connect, please wait for QR code...
                    </p>
                  </div>
                )}
              </form>
            )}
            
            {phoneNumber && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Logs</h3>
                <div ref={logsContainerRef} className="h-64 bg-gray-900 text-white p-4 rounded-md overflow-y-auto text-xs font-mono">
                  {logs.filter(log => !log.startsWith('QRCODE:')).map((log, index) => (
                      <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WhatsAppBotPage;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client'; // Using client for simplicity, ideally use server client

export async function POST(request: Request) {
  const supabase = createClient(); // Using client-side Supabase client

  try {
    const { jobDetails } = await request.json();

    // 1. Fetch Telegram config
    const { data: config, error: configError } = await supabase
      .from('telegram_configs')
      .select('bot_token, chat_id')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('Telegram config not found or error:', configError?.message);
      // Don't fail the job submission if Telegram config is missing
      return NextResponse.json({ message: 'Telegram config not found, notification skipped.' }, { status: 200 });
    }

    const { bot_token, chat_id } = config;

    // 2. Construct message
    const message = `
*New Job Entry!*
*Job Type:* ${jobDetails.job_type}
*Customer Name:* ${jobDetails.customer_name || 'N/A'}
*Submitted by User ID:* ${jobDetails.user_id}

*Details:*
${jobDetails.type_modem_ont ? `  - Type Modem/ONT: ${jobDetails.type_modem_ont}\n` : ''}
${jobDetails.serial_number ? `  - Serial Number: ${jobDetails.serial_number}\n` : ''}
${jobDetails.power_rx ? `  - Power R/X: ${jobDetails.power_rx}\n` : ''}
${jobDetails.pppoe_username ? `  - PPPOE Username: ${jobDetails.pppoe_username}\n` : ''}
${jobDetails.default_ssid ? `  - Default SSID: ${jobDetails.default_ssid}\n` : ''}
${jobDetails.new_ssid_wlan_key ? `  - New SSID + WLAN Key: ${jobDetails.new_ssid_wlan_key}\n` : ''}
${jobDetails.reason ? `  - Reason: ${jobDetails.reason}\n` : ''}
    `.trim();

    // 3. Send message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
        parse_mode: 'Markdown', // Use Markdown for formatting
      }),
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Failed to send Telegram message:', errorData);
      return NextResponse.json({ message: 'Failed to send Telegram notification.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Telegram notification sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in Telegram notification API:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

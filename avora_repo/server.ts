import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.RESEND_EMAIL_FROM || 'Avora <onboarding@resend.dev>'; // Use your verified domain in production

app.post('/api/ping', async (req, res) => {
  const { userId } = req.body;
  if (userId) {
    await supabase.from('user_presence').upsert({
      user_id: userId,
      last_seen: new Date().toISOString()
    });
  }
  res.json({ success: true });
});

app.post('/api/notify/connection', async (req, res) => {
  const { recipientId, senderId, introMessage } = req.body;
  
  // Check settings
  const { data: settings } = await supabase.from('notification_settings').select('*').eq('user_id', recipientId).single();
  if (settings && settings.connection_requests === false) {
    return res.json({ success: true, skipped: 'disabled' });
  }
  
  const { data: senderProfile } = await supabase.from('profiles').select('name').eq('user_id', senderId).single();
  const { data: founderProfile } = await supabase.from('founders').select('startup_name').eq('user_id', senderId).maybeSingle();
  const { data: recipient } = await supabase.from('users').select('email').eq('id', recipientId).single();
  
  if (recipient?.email) {
    const startupStr = founderProfile?.startup_name ? ` (${founderProfile.startup_name})` : '';
    const subject = `New Connection Request from ${senderProfile?.name || 'Someone'}`;
    const textBody = `You have a new connection request on Avora from ${senderProfile?.name || 'Someone'}${startupStr}.\nIntro: ${introMessage || 'No intro message'}\n\n[ View Request ]`;
    
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipient.email,
          subject,
          text: textBody,
        });
        console.log(`[EMAIL SENT] Connection request to ${recipient.email}`);
      } catch (err) {
        console.error('[EMAIL ERROR]', err);
      }
    } else {
      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCHED] (Mock)`);
      console.log(`To: ${recipient.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: [Dark Theme / Avora Branding]`);
      console.log(`------------------------------------------------------`);
      console.log(`Body: ${textBody}`);
      console.log(`======================================================\n`);
    }
  }
  
  res.json({ success: true });
});

app.post('/api/notify/connection-accepted', async (req, res) => {
  const { recipientId, accepterId } = req.body;
  
  const { data: settings } = await supabase.from('notification_settings').select('*').eq('user_id', recipientId).single();
  if (settings && settings.connection_requests === false) {
    return res.json({ success: true, skipped: 'disabled' });
  }

  const { data: accepterProfile } = await supabase.from('profiles').select('name').eq('user_id', accepterId).single();
  const { data: recipient } = await supabase.from('users').select('email').eq('id', recipientId).single();
  
  if (recipient?.email) {
    const subject = `Connection Accepted!`;
    const textBody = `${accepterProfile?.name || 'Someone'} accepted your connection request.\n\n[ Start Chatting ]`;
    
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipient.email,
          subject,
          text: textBody,
        });
        console.log(`[EMAIL SENT] Connection accepted to ${recipient.email}`);
      } catch (err) {
        console.error('[EMAIL ERROR]', err);
      }
    } else {
      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCHED] (Mock)`);
      console.log(`To: ${recipient.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: [Dark Theme / Avora Branding]`);
      console.log(`------------------------------------------------------`);
      console.log(`Body: ${textBody}`);
      console.log(`======================================================\n`);
    }
  }
  
  res.json({ success: true });
});

app.post('/api/notify/message', async (req, res) => {
  const { recipientId, senderId, content } = req.body;
  
  const { data: settings } = await supabase.from('notification_settings').select('*').eq('user_id', recipientId).single();
  if (settings && settings.messages === false) {
    return res.json({ success: true, skipped: 'disabled' });
  }

  // Check activity from database
  const { data: presence } = await supabase.from('user_presence').select('last_seen').eq('user_id', recipientId).single();
  let isOnline = false;
  if (presence && presence.last_seen) {
    const lastActive = new Date(presence.last_seen).getTime();
    isOnline = (Date.now() - lastActive) < 20 * 60 * 1000;
  }
  
  if (isOnline) {
    console.log(`[NOTIFY] User ${recipientId} is online, skipping immediate email.`);
    return res.json({ success: true, skipped: 'online' });
  }

  // Batching logic: add to pending database table
  await supabase.from('pending_email_notifications').insert({
    recipient_id: recipientId,
    sender_id: senderId,
    content
  });

  // Note: Actual email sending is deferred to the cron job to survive serverless restarts.
  res.json({ success: true, queued: true });
});

// Endpoint for processing batched emails (To be called by Vercel Cron or similar scheduler)
app.post('/api/cron/process-emails', async (req, res) => {
  const { data: pending } = await supabase.from('pending_email_notifications').select('*').order('created_at', { ascending: true });
  
  if (!pending || pending.length === 0) {
    return res.json({ success: true, processed: 0 });
  }
  
  // Group by recipient
  const grouped = pending.reduce((acc: any, curr: any) => {
     acc[curr.recipient_id] = acc[curr.recipient_id] || [];
     acc[curr.recipient_id].push(curr);
     return acc;
  }, {});
  
  let processed = 0;
  for (const [recipientId, messages] of Object.entries(grouped)) {
     const msgs = messages as any[];
     const { data: recipient } = await supabase.from('users').select('email').eq('id', recipientId).single();
     
     if (recipient?.email) {
       const subject = `You have ${msgs.length} new messages on Avora`;
       const textBody = `You have unread messages waiting for you.\n\n[ View Messages ]`;
       
       if (process.env.RESEND_API_KEY) {
         try {
           await resend.emails.send({
             from: EMAIL_FROM,
             to: recipient.email,
             subject,
             text: textBody,
           });
           console.log(`[EMAIL SENT] Batched messages to ${recipient.email}`);
         } catch (err) {
           console.error('[EMAIL ERROR]', err);
         }
       } else {
         console.log(`\n======================================================`);
         console.log(`[EMAIL DISPATCHED] (Mock)`);
         console.log(`To: ${recipient.email}`);
         console.log(`Subject: ${subject}`);
         console.log(`Template: [Dark Theme / Avora Branding]`);
         console.log(`------------------------------------------------------`);
         console.log(`Body: ${textBody}`);
         console.log(`======================================================\n`);
       }
       
       // Delete processed messages
       await supabase.from('pending_email_notifications').delete().in('id', msgs.map(m => m.id));
       processed += msgs.length;
     }
  }
  
  res.json({ success: true, processed });
});

app.post('/api/notify/meeting', async (req, res) => {
  const { recipientId, senderId, action } = req.body;
  
  const { data: settings } = await supabase.from('notification_settings').select('*').eq('user_id', recipientId).single();
  if (settings && settings.meetings === false) {
    return res.json({ success: true, skipped: 'disabled' });
  }
  
  const { data: senderProfile } = await supabase.from('profiles').select('name').eq('user_id', senderId).single();
  const { data: recipient } = await supabase.from('users').select('email').eq('id', recipientId).single();
  
  if (recipient?.email) {
    const subject = `Meeting Update on Avora`;
    const textBody = `${senderProfile?.name || 'Someone'} ${action} a meeting.\n\n[ View Meeting ]`;
    
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: recipient.email,
          subject,
          text: textBody,
        });
        console.log(`[EMAIL SENT] Meeting update to ${recipient.email}`);
      } catch (err) {
        console.error('[EMAIL ERROR]', err);
      }
    } else {
      console.log(`\n======================================================`);
      console.log(`[EMAIL DISPATCHED] (Mock)`);
      console.log(`To: ${recipient.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Template: [Dark Theme / Avora Branding]`);
      console.log(`------------------------------------------------------`);
      console.log(`Body: ${textBody}`);
      console.log(`======================================================\n`);
    }
  }
  
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();

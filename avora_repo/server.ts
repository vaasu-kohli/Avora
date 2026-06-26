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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const resendApiKey = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.RESEND_EMAIL_FROM;

if (!resendApiKey || !EMAIL_FROM) {
  console.error("FATAL: RESEND_API_KEY and RESEND_EMAIL_FROM are required.");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

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
    
    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        subject,
        text: textBody,
      });
      if (response.error) {
        console.error('[EMAIL ERROR] Resend API Error:', response.error);
        return res.status(500).json({ success: false, error: response.error });
      }
      console.log(`[EMAIL SENT] Connection request to ${recipient.email}`, response.data);
    } catch (err) {
      console.error('[EMAIL ERROR] Network/Unexpected:', err);
      return res.status(500).json({ success: false, error: 'Email delivery failed' });
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
    
    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        subject,
        text: textBody,
      });
      if (response.error) {
        console.error('[EMAIL ERROR] Resend API Error:', response.error);
        return res.status(500).json({ success: false, error: response.error });
      }
      console.log(`[EMAIL SENT] Connection accepted to ${recipient.email}`, response.data);
    } catch (err) {
      console.error('[EMAIL ERROR] Network/Unexpected:', err);
      return res.status(500).json({ success: false, error: 'Email delivery failed' });
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

  const { data: senderProfile } = await supabase.from('profiles').select('name').eq('user_id', senderId).single();
  const { data: recipient } = await supabase.from('users').select('email').eq('id', recipientId).single();
  
  if (recipient?.email) {
    const subject = `New Message from ${senderProfile?.name || 'Someone'}`;
    const textBody = `You have a new unread message on Avora from ${senderProfile?.name || 'Someone'}.\n\n"${content}"\n\n[ View Messages ]`;
    
    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        subject,
        text: textBody,
      });
      if (response.error) {
        console.error('[EMAIL ERROR] Resend API Error:', response.error);
        return res.status(500).json({ success: false, error: response.error });
      }
      console.log(`[EMAIL SENT] Message notification to ${recipient.email}`, response.data);
    } catch (err) {
      console.error('[EMAIL ERROR] Network/Unexpected:', err);
      return res.status(500).json({ success: false, error: 'Email delivery failed' });
    }
  }

  res.json({ success: true, sent: true });
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
    
    try {
      const response = await resend.emails.send({
        from: EMAIL_FROM,
        to: recipient.email,
        subject,
        text: textBody,
      });
      if (response.error) {
        console.error('[EMAIL ERROR] Resend API Error:', response.error);
        return res.status(500).json({ success: false, error: response.error });
      }
      console.log(`[EMAIL SENT] Meeting update to ${recipient.email}`, response.data);
    } catch (err) {
      console.error('[EMAIL ERROR] Network/Unexpected:', err);
      return res.status(500).json({ success: false, error: 'Email delivery failed' });
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

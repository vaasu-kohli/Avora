import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './avora_repo/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Sign up user 1
  const email1 = `test12345_${Date.now()}@gmail.com`;
  let { data: user1, error: err1 } = await supabase.auth.signUp({
    email: email1,
    password: 'password123'
  });
  if (err1 && err1.code === 'user_already_exists') {
     const res = await supabase.auth.signInWithPassword({ email: email1, password: 'password123' });
     user1 = res.data;
  } else if (err1) throw err1;
  const uid1 = user1.user!.id;

  // 2. Sign up user 2
  const email2 = `test23456_${Date.now()}@gmail.com`;
  let { data: user2, error: err2 } = await supabase.auth.signUp({
    email: email2,
    password: 'password123'
  });
  if (err2 && err2.code === 'user_already_exists') {
     const res = await supabase.auth.signInWithPassword({ email: email2, password: 'password123' });
     user2 = res.data;
  } else if (err2) throw err2;
  const uid2 = user2.user!.id;

  // Log in as user 1
  await supabase.auth.signInWithPassword({ email: email1, password: 'password123' });

  // 3. Create profile 1
  await supabase.from('users').upsert({ id: uid1, role: 'founder' });
  await supabase.from('profiles').upsert({ user_id: uid1, name: 'Test 1', user_type: 'founder' });

  // Create profile 2
  await supabase.from('users').upsert({ id: uid2, role: 'builder' });
  await supabase.from('profiles').upsert({ user_id: uid2, name: 'Test 2', user_type: 'builder' });

  // 4. Request connection 1 -> 2
  const { data: conn, error: connErr } = await supabase.from('connections').insert({
    sender_id: uid1,
    receiver_id: uid2,
    status: 'pending'
  }).select().single();
  
  if (connErr) throw connErr;
  console.log('Connection ID:', conn.id);

  // 5. Send message
  const { data: msg, error: msgErr } = await supabase.from('messages').insert({
    connection_id: conn.id,
    sender_id: uid1,
    receiver_id: uid2,
    message_text: 'hello world'
  }).select().single();

  if (msgErr) {
    console.error('Insert Error:', msgErr);
  } else {
    console.log('Inserted message:', msg);
  }
}

run().catch(console.error);

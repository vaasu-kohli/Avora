import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('messages').insert({
       connection_id: '123e4567-e89b-12d3-a456-426614174000',
       sender_id: '123e4567-e89b-12d3-a456-426614174000',
       receiver_id: '123e4567-e89b-12d3-a456-426614174000',
       message_text: "test"
  });
  console.log('Error:', error);
}

run();

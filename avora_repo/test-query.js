import { createClient } from '@supabase/supabase-js';

const supabase = createClient('http://127.0.0.1:54321', 'fake-key');

const query = supabase.from('messages')
  .select('*')
  .or(`sender_id.eq.user-uuid,receiver_id.eq.user-uuid`);

console.log(query.url);

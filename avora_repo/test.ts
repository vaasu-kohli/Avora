import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'fake';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const query = supabase.from('connections')
    .select('*')
    .or(`and(sender_id.eq.fake,receiver_id.eq.fake),and(sender_id.eq.fake,receiver_id.eq.fake)`);
  
  console.log(query.url);
}

run();

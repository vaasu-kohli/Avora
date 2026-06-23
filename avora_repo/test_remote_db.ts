import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './avora_repo/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'placeholder';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
console.log('URL?', !!process.env.VITE_SUPABASE_URL);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: p, error: pe } = await supabase.from('profiles').select('*').limit(1);
  console.log("PROFILES ERROR:", pe?.message, pe?.details);
  console.log("PROFILES DATA:", p ? Object.keys(p[0] || {}) : null);

  const { data: f, error: fe } = await supabase.from('founders').select('*').limit(1);
  console.log("FOUNDERS ERROR:", fe?.message);
  console.log("FOUNDERS DATA:", f ? Object.keys(f[0] || {}) : null);

  const { data: b, error: be } = await supabase.from('builders').select('*').limit(1);
  console.log("BUILDERS ERROR:", be?.message);
  console.log("BUILDERS DATA:", b ? Object.keys(b[0] || {}) : null);
}

test();

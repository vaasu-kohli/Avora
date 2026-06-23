import { supabase } from './src/lib/supabase';

async function fetchSchema() {
  // We can query a single row and see what keys it has, though not perfect, it's a start.
  // Alternatively, try querying the REST API endpoint for OpenAPI or use RPC.
  // Or just query a non-existent column and read the error, or query limit 1 and Object.keys
  
  const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles columns (if row exists or based on error):', pData && pData.length ? Object.keys(pData[0]) : pData);
  if (pErr) console.log('Profiles Error:', pErr);

  const { data: fData, error: fErr } = await supabase.from('founders').select('*').limit(1);
  console.log('Founders columns:', fData && fData.length ? Object.keys(fData[0]) : fData);
  if (fErr) console.log('Founders Error:', fErr);

  const { data: bData, error: bErr } = await supabase.from('builders').select('*').limit(1);
  console.log('Builders columns:', bData && bData.length ? Object.keys(bData[0]) : bData);
  if (bErr) console.log('Builders Error:', bErr);
}
fetchSchema();

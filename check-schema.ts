import { supabase } from './src/lib/supabase';

async function checkSchema() {
  console.log("Checking profiles table...");
  const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1);
  if (pErr) console.error("Profiles error:", pErr);
  else if (pData && pData.length > 0) console.log("Profiles columns:", Object.keys(pData[0]));
  else console.log("Profiles has no rows, but query succeeded");

  console.log("Checking founders table...");
  const { data: fData, error: fErr } = await supabase.from('founders').select('*').limit(1);
  if (fErr) console.error("Founders error:", fErr);
  else if (fData && fData.length > 0) console.log("Founders columns:", Object.keys(fData[0]));
  else console.log("Founders has no rows, but query succeeded");
  
  console.log("Checking builders table...");
  const { data: bData, error: bErr } = await supabase.from('builders').select('*').limit(1);
  if (bErr) console.error("Builders error:", bErr);
  else if (bData && bData.length > 0) console.log("Builders columns:", Object.keys(bData[0]));
  else console.log("Builders has no rows, but query succeeded");

  // Actually, we can get schema via querying the REST API with OPTIONS method, but this is harder.
  // We can just try to insert dummy data and catch the specific column missing errors, or we can use standard approaches.
}

checkSchema().then(() => process.exit(0));

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'placeholder';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findColumns(tableName, payload) {
  let currentPayload = { ...payload };
  const missingColumns = [];
  while (true) {
    const { error: upsertErr } = await supabase.from(tableName).upsert(currentPayload);
    if (upsertErr && upsertErr.message && upsertErr.message.includes("Could not find the '")) {
      const match = upsertErr.message.match(/Could not find the '([^']+)' column/);
      if (match) {
        const col = match[1];
        missingColumns.push(col);
        delete currentPayload[col];
        continue;
      }
    }
    console.log(`Table ${tableName}`);
    console.log(` Accepted columns: ${Object.keys(currentPayload).join(', ')}`);
    console.log('---');
    break;
  }
}

async function run() {
  const allFields = {
    user_id: "00000000-0000-0000-0000-000000000000",
    name: "a",
    photo_url: "a",
    bio: "a",
    college: "a",
    city: "a",
    location: "a",
    linkedin_url: "a",
    interests: ["a"],
    website: "a",
    availability: "a",
    commitment: "a",
    designation: "a",
    startup_name: "a",
    startup_description: "a",
    startup_stage: "a",
    problem_statement: "a",
    industry: "a",
    looking_for: ["a"],
    skills: ["a"],
    github_url: "a",
    leetcode_url: "a",
    portfolio_url: "a",
    resume_url: "a",
    current_projects: "a"
  };

  await findColumns('profiles', allFields);
  await findColumns('founders', allFields);
  await findColumns('builders', allFields);
}
run();

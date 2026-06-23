import 'dotenv/config';
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
console.log("VITE_SUPABASE_URL:", url);

async function check() {
  if (!url || !key) {
     console.log("No url/key");
     return;
  }
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const data = await res.json();
  console.log("Data keys:", Object.keys(data));
  if (data.info) {
    console.log("OpenAPI version:", data.info.version, data.openapi || data.swagger);
  }
  if (data.definitions) console.log("Definitions keys:", Object.keys(data.definitions).slice(0, 5));
  if (data.components && data.components.schemas) console.log("Component schemas keys:", Object.keys(data.components.schemas).slice(0, 5));
  
  for (const t of tables) {
    console.log(`\n=== Table: ${t} ===`);
    let def = null;
    if (data.definitions) def = data.definitions[t];
    else if (data.components && data.components.schemas) def = data.components.schemas[t];
    
    if (def && def.properties) {
      console.log(Object.keys(def.properties).join(', '));
    } else {
      console.log("Not found or no properties");
    }
  }
}
check();

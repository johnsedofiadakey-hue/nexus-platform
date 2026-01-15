const { createClient } = require('@supabase/supabase-js');

// Replace with your actual project URL and Anon Key from the Supabase Dashboard
const supabaseUrl = 'https://qkunvuzdovqfwacjxnla.supabase.co';
const supabaseKey = 'PASTE_YOUR_ANON_KEY_HERE'; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('User').select('*').limit(1);
  if (error) {
    console.error('NEXUS Status: CONNECTION FAILED', error.message);
  } else {
    console.log('NEXUS Status: ONLINE. Project is alive.');
  }
}

testConnection();
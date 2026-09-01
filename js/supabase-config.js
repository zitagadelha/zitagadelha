window.SUPABASE_URL = 'https://dwiiffblnpobbxelsbbq.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bGlmZmJsbnBvYmJ4ZWxzYmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTY4OTQsImV4cCI6MjEwMzg3Mjg5NH0.CBAaY9h9luIB_G2Ld41dtI25A1wuW7dN7Zff9G6Vpuw';

window.getSupabaseClient = function () {
  if (!window.__supabaseClient) {
    window.__supabaseClient = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );
  }
  return window.__supabaseClient;
};

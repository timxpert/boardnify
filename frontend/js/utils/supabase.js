// frontend/js/utils/supabase.js
const SUPABASE_URL = 'https://mazkugyfjwubsfgcedfl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hemt1Z3lmand1YnNmZ2NlZGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjY4OTEsImV4cCI6MjA4OTI0Mjg5MX0.vKSTWea3-KpRCPEXvY46kf_Dj85TKNgFZ3noGrn4ztI';
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: window.sessionStorage,
      autoRefreshToken: true,
      persistSession: true
    }
  });
  window.dbInsert = async (table, payload) => { try { const { error } = await window.supabaseClient.from(table).insert(payload); if (error) console.error(error); } catch(e) { console.error(e); } };
  window.dbUpdate = async (table, id, payload) => { try { const { error } = await window.supabaseClient.from(table).update(payload).eq('id', id); if (error) console.error(error); } catch(e) { console.error(e); } };
  window.dbDelete = async (table, id) => { try { const { error } = await window.supabaseClient.from(table).delete().eq('id', id); if (error) console.error(error); } catch(e) { console.error(e); } };
}
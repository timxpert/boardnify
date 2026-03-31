// frontend/js/utils/supabase.js
const SUPABASE_URL = 'https://mazkugyfjwubsfgcedfl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2idDYaLgKe7hsuUCSz_W0w_JlhVvmp8';

// Initialize Supabase Client globally if the library loaded correctly
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[Supabase] Initialized Client', window.supabaseClient);

  // Background Sync Helpers for Optimistic UI
  window.dbInsert = async (table, payload) => {
    try {
      const { error } = await window.supabaseClient.from(table).insert(payload);
      if (error) console.error(`[DB Insert Error - ${table}]:`, error);
    } catch(e) { console.error(e); }
  };

  window.dbUpdate = async (table, id, payload) => {
    try {
      const { error } = await window.supabaseClient.from(table).update(payload).eq('id', id);
      if (error) console.error(`[DB Update Error - ${table}]:`, error);
    } catch(e) { console.error(e); }
  };

  window.dbDelete = async (table, id) => {
    try {
      const { error } = await window.supabaseClient.from(table).delete().eq('id', id);
      if (error) console.error(`[DB Delete Error - ${table}]:`, error);
    } catch(e) { console.error(e); }
  };

} else {
  console.error('[Supabase] Library not found! Check index.html import.');
}

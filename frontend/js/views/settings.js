// frontend/js/views/settings.js

(function() {
  window.initSettings = async function(container) {
    // Topbar override if needed, but the image shows a generic header. 
    // Usually, we keep the main topbar.
    
    const colors = [
      { id: 'purple', value: '#6B46FA' },
      { id: 'brown', value: '#9A4D00' },
      { id: 'slate', value: '#6366F1' },
      { id: 'dark', value: '#1E1B4B' }
    ];

    container.innerHTML = `
      <div class="view-container animate-fade-in pb-32 bg-white">
        <!-- Header Section -->
        <div class="px-8 pt-12 pb-10">
          <h1 class="text-4xl font-black text-text-main font-['Cabinet_Grotesk'] mb-3">Settings</h1>
          <p class="text-sm text-text-muted font-medium leading-relaxed">Manage your designer preferences and board configurations.</p>
        </div>

        <div class="px-6 space-y-10">
          
          <!-- Personal Details -->
          <section class="space-y-4">
            <h3 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Personal Details</h3>
            <div class="bg-white rounded-[32px] border border-border-light shadow-subtle overflow-hidden">
              <!-- Profile Row -->
              <button onclick="window.showToast('Profile Editing coming soon')" class="w-full flex items-center justify-between p-6 hover:bg-bg-soft transition-all border-b border-border-light/50">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-bg-soft flex items-center justify-center text-text-muted">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <span class="text-sm font-bold text-text-main">Profile Information</span>
                </div>
                <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
              
              <!-- Notifications Row -->
              <div class="flex items-center justify-between p-6">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-bg-soft flex items-center justify-center text-text-muted">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <span class="text-sm font-bold text-text-main">Email Notifications</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" checked>
                  <div class="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          <!-- Board Customization -->
          <section class="space-y-4">
            <h3 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Board Customization</h3>
            <div class="bg-white rounded-[32px] border border-border-light shadow-subtle p-8 space-y-10">
              
              <!-- Theme Swatches -->
              <div class="space-y-4">
                <label class="text-[11px] font-black text-text-muted uppercase tracking-widest block">Default Board Theme</label>
                <div class="flex gap-4">
                  ${colors.map(c => `
                    <button onclick="window.showToast('Theme ${c.id} selected')" class="group relative">
                      <div class="w-12 h-12 rounded-full border-2 ${c.id === 'purple' ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'} transition-all overflow-hidden p-1">
                        <div class="w-full h-full rounded-full" style="background-color: ${c.value}"></div>
                      </div>
                      ${c.id === 'purple' ? `<div class="absolute inset-0 flex items-center justify-center text-white"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Preview Size (Segmented) -->
              <div class="space-y-4">
                <label class="text-[11px] font-black text-text-muted uppercase tracking-widest block">Asset Preview Size</label>
                <div class="flex p-1.5 bg-bg-soft rounded-2xl">
                  ${['S', 'M', 'L'].map(size => `
                    <button onclick="window.showToast('Size ${size} set')" class="flex-1 py-3 text-[11px] font-black rounded-xl transition-all ${size === 'M' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}">
                      ${size}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Auto-organize -->
              <div class="flex items-center justify-between pt-4 border-t border-border-light/30">
                <span class="text-sm font-bold text-text-main">Auto-organize Assets</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" checked>
                  <div class="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>

          <!-- Security & Storage -->
          <section class="space-y-4">
            <h3 class="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Security & Storage</h3>
            <div class="bg-white rounded-[32px] border border-border-light shadow-subtle overflow-hidden">
              <button onclick="window.showToast('Security settings coming soon')" class="w-full flex items-center justify-between p-6 hover:bg-bg-soft transition-all border-b border-border-light/50">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-bg-soft flex items-center justify-center text-text-muted">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm3 8H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v3z"/></svg>
                  </div>
                  <span class="text-sm font-bold text-text-main">Password & Security</span>
                </div>
                <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
              <button onclick="window.showToast('Storage panel coming soon')" class="w-full flex items-center justify-between p-6 hover:bg-bg-soft transition-all">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-bg-soft flex items-center justify-center text-text-muted">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
                  </div>
                  <span class="text-sm font-bold text-text-main">Storage Management</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-black text-text-muted uppercase">85% Full</span>
                  <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </button>
            </div>
          </section>

          <!-- Delete Account Row -->
          <button onclick="window.showToast('Open Delete Modal')" class="w-full bg-[#FFF5F5] rounded-[32px] border border-red-100 p-6 flex items-center justify-between hover:bg-red-100/50 transition-all">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-500">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </div>
              <span class="text-sm font-black text-red-600">Delete Account</span>
            </div>
            <svg class="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <!-- Version Info -->
          <div class="text-center py-8">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">Version 2.4.0 (Creative Cloud)</p>
          </div>

        </div>
      </div>
    `;
  };
})();

// frontend/js/components/inviteModal.js

(function() {
  window.openInviteModal = function() {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const content = document.getElementById('m-bottom-sheet-content');

    if (!sheet || !content) return;

    const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
    const projectTitle = proj ? proj.title : 'Boardnify Project';

    content.innerHTML = `
      <div class="animate-fade-in space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-text-dark tracking-tight">Invite Client</h2>
          </div>
          <button onclick="window.closeBottomSheet()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Email Input -->
        <div class="space-y-2">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
          <div class="relative">
            <input type="email" id="invite-email-input" class="w-full p-4 pr-12 rounded-2xl border border-gray-100 focus:border-brand outline-none transition-all text-sm font-bold text-text-dark bg-gray-50/50" placeholder="client@company.com">
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <p class="text-[9px] text-gray-400 font-medium">Invite will be sent directly to their inbox</p>
        </div>

        <!-- Public Access Link -->
        <div class="p-4 bg-brand/5 rounded-2xl border border-brand/10 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-brand">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              <span class="text-xs font-bold">Public Access Link</span>
            </div>
            <button class="px-4 py-1.5 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:scale-105 transition" onclick="window.showToast('Link Generated!')">Generate</button>
          </div>
          <p class="text-[10px] text-gray-500 leading-relaxed font-medium">Clients don't need a Boardnify account to view. They can access via a secure unique URL.</p>
        </div>

        <!-- Initial Permissions -->
        <div class="space-y-4">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Permissions</label>
          <div class="space-y-3">
            ${['Script', 'Moodboard', 'Style Frames'].map(item => `
              <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      ${item === 'Script' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>' : 
                        item === 'Moodboard' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' : 
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>'}
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-text-dark">${item}</h4>
                    <p class="text-[9px] text-gray-400 font-medium">Access to ${item.toLowerCase()} tools</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" ${item !== 'Style Frames' ? 'checked' : ''}>
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="flex gap-3 pt-4">
          <button onclick="window.closeBottomSheet()" class="flex-1 py-4 px-6 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-text-dark hover:bg-gray-50 transition">Cancel</button>
          <button id="send-invite-btn" class="flex-2 py-4 px-10 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition">Send Invitation</button>
        </div>
      </div>
    `;

    // Show sheet
    overlay.classList.remove('hidden');
    sheet.classList.remove('translate-y-full');

    // Attach invite logic
    const sendBtn = document.getElementById('send-invite-btn');
    const emailInput = document.getElementById('invite-email-input');

    sendBtn.onclick = async () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        window.showToast?.('Please enter a valid email.', 'error');
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';

      try {
        if (window.supabaseClient) {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          const { data, error } = await window.supabaseClient
            .from('client_invites')
            .insert({
              designer_id: user?.id,
              client_email: email,
              project_title: projectTitle,
              status: 'pending'
            })
            .select().single();

          if (error) throw error;

          await window.supabaseClient.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.origin + '/client-accept.html?invite_id=' + data.id }
          });
        }

        window.showToast?.('Invite sent! 📧', 'success');
        window.closeBottomSheet();
      } catch (err) {
        window.showToast?.(err.message, 'error');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Invitation';
      }
    };
  };

  window.closeBottomSheet = function() {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    if (sheet) sheet.classList.add('translate-y-full');
    if (overlay) overlay.classList.add('hidden');
  };
})();

// frontend/js/components/inviteModal.js

(function() {
  window.openInviteModal = function() {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const content = document.getElementById('m-bottom-sheet-content');

    if (!sheet || !content) return;

    const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
    const projectTitle = proj ? proj.title : 'Boardnify Project';

    // Exact Match for Image 2
    content.innerHTML = `
      <div class="animate-fade-in space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-[#F4F3FF] rounded-xl flex items-center justify-center text-[#6B21FF]">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-[#1A1916] tracking-tight">Invite Client</h2>
          </div>
          <button onclick="window.closeBottomSheet()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Email Input Section -->
        <div class="space-y-3">
          <label class="text-[11px] font-black text-gray-500 uppercase tracking-[0.1em]">Email Address</label>
          <div class="relative group">
            <input type="email" id="invite-email-input" 
              class="w-full p-4.5 pr-14 rounded-xl border border-gray-100 focus:border-[#6B21FF] focus:ring-4 focus:ring-[#6B21FF]/5 outline-none transition-all text-[15px] font-medium text-[#1A1916] bg-[#FFFFFF] shadow-sm" 
              placeholder="client@company.com">
            <div class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6B21FF] transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 font-medium tracking-wide">Invite will be sent directly to their inbox</p>
        </div>

        <!-- Public Access Link Card -->
        <div class="p-5 bg-[#F9F9FF] rounded-2xl border border-[#F0EFFF] space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 text-[#6B21FF]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              <span class="text-[13px] font-bold tracking-tight">Public Access Link</span>
            </div>
            <button class="px-5 py-2 bg-[#6B21FF] text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all" onclick="window.showToast('Link Generated!')">Generate</button>
          </div>
          <p class="text-[12px] text-gray-500 leading-relaxed font-medium">Clients don't need a Boardnify account to view. They can access via a secure unique URL.</p>
        </div>

        <!-- Permissions Section -->
        <div class="space-y-4">
          <label class="text-[11px] font-black text-gray-500 uppercase tracking-[0.1em]">Initial Permissions</label>
          <div class="space-y-3">
            ${[
              { id: 'script', title: 'Script', sub: 'View and comment on copy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'moodboard', title: 'Moodboard', sub: 'Access to visual inspiration', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'styleframes', title: 'Style Frames', sub: 'Review aesthetic frames', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }
            ].map(item => `
              <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <div class="flex items-center gap-4">
                  <div class="w-11 h-11 bg-[#F4F3FF] rounded-xl flex items-center justify-center text-[#6B21FF]">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-[14px] font-bold text-[#1A1916]">${item.title}</h4>
                    <p class="text-[11px] text-gray-400 font-medium">${item.sub}</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" ${item.id !== 'styleframes' ? 'checked' : ''}>
                  <div class="w-12 h-6.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6B21FF]"></div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 pt-6">
          <button onclick="window.closeBottomSheet()" class="flex-1 py-4.5 px-6 border border-gray-100 rounded-2xl text-[12px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all">Cancel</button>
          <button id="send-invite-btn" class="flex-[1.5] py-4.5 px-6 bg-[#6B21FF] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-[#6B21FF]/20 hover:brightness-110 active:scale-[0.98] transition-all">Send Invitation</button>
        </div>
      </div>
    `;

    // Show sheet with proper transition
    overlay.classList.remove('hidden');
    setTimeout(() => sheet.classList.remove('translate-y-full'), 10);

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
      const originalText = sendBtn.textContent;
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

        window.showToast?.('Invitation Sent Successfully!', 'success');
        window.closeBottomSheet();
      } catch (err) {
        window.showToast?.(err.message, 'error');
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
      }
    };
  };

  window.closeBottomSheet = function() {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    if (sheet) sheet.classList.add('translate-y-full');
    setTimeout(() => {
        if (overlay) overlay.classList.add('hidden');
    }, 300);
  };
})();

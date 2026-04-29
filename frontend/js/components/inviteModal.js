// frontend/js/components/inviteModal.js

(function() {
  window.openInviteModal = function() {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const content = document.getElementById('m-bottom-sheet-content');

    if (!sheet || !content) return;

    const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
    const projectTitle = proj ? proj.title : 'Boardnify Project';

    let currentStep = 1;

    function renderStep() {
      if (currentStep === 1) {
        content.innerHTML = `
          <div class="animate-fade-in space-y-8 p-4">
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Step 1 of 3</span>
                <h2 class="text-3xl font-black text-text-main font-['Cabinet_Grotesk']">Send Invite</h2>
              </div>
              <button onclick="window.closeBottomSheet()" class="w-12 h-12 bg-bg-soft rounded-2xl flex items-center justify-center text-text-muted hover:text-primary transition-all">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="space-y-6">
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Client Email</label>
                <div class="relative">
                  <input type="email" id="invite-email-input" 
                    class="w-full p-6 pl-16 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-sm text-text-main focus:ring-4 focus:ring-primary/5 transition-all" 
                    placeholder="client@company.com">
                  <div class="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="bento-card p-6 bg-white border border-border-light shadow-subtle space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3 text-primary">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span class="text-[11px] font-black uppercase tracking-widest">Public Access Link</span>
                  </div>
                  <button class="px-5 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">Generate</button>
                </div>
                <p class="text-[12px] text-text-muted font-medium leading-relaxed opacity-60">Clients don't need a Boardnify account to view. They can access via a secure unique URL.</p>
              </div>
            </div>

            <button id="next-to-step2" class="w-full py-6 bg-primary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-floating hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
              Next Step
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7l5 5-5 5M6 7l5 5-5 5"></path></svg>
            </button>
          </div>
        `;
        document.getElementById('next-to-step2').onclick = () => {
          currentStep = 2;
          renderStep();
        };
      } else if (currentStep === 2) {
        content.innerHTML = `
          <div class="animate-fade-in space-y-8 p-4">
            <div class="flex flex-col text-center">
              <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Step 2 of 3</span>
              <div class="w-24 h-24 bg-primary/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-card">
                 <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              <h2 class="text-3xl font-black text-text-main font-['Cabinet_Grotesk'] mb-3">Client Invitation</h2>
              <p class="text-[14px] text-text-muted font-medium max-w-xs mx-auto leading-relaxed">Antigravity Studio has invited you to collaborate on <span class="text-primary font-black">"${projectTitle}"</span></p>
            </div>

            <div class="flex gap-4 pt-4">
              <button onclick="window.closeBottomSheet()" class="flex-1 py-6 bg-white border border-border-light text-text-muted rounded-[32px] font-black text-xs uppercase tracking-[0.2em] hover:bg-bg-soft active:scale-95 transition-all">Decline</button>
              <button id="next-to-step3" class="flex-[1.5] py-6 bg-primary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-floating hover:brightness-110 active:scale-95 transition-all">Accept Invitation</button>
            </div>
          </div>
        `;
        document.getElementById('next-to-step3').onclick = () => {
          currentStep = 3;
          renderStep();
        };
      } else if (currentStep === 3) {
        content.innerHTML = `
          <div class="animate-fade-in space-y-8 p-4">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Step 3 of 3</span>
              <h2 class="text-3xl font-black text-text-main font-['Cabinet_Grotesk']">Introduce Yourself</h2>
              <p class="text-sm text-text-muted font-medium mt-2 opacity-60">How should the team refer to you?</p>
            </div>

            <div class="space-y-6">
              <div class="flex flex-col gap-2">
                <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
                <input id="client-name-input" type="text" placeholder="e.g. Sarah Jenkins" 
                  class="w-full p-6 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-sm text-text-main focus:ring-4 focus:ring-primary/5 transition-all">
              </div>
            </div>

            <button id="finalize-invite" class="w-full py-6 bg-primary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-floating hover:brightness-110 active:scale-95 transition-all">
              Join Collaboration
            </button>
          </div>
        `;
        document.getElementById('finalize-invite').onclick = async () => {
          const name = document.getElementById('client-name-input').value.trim();
          if (!name) {
            window.showToast?.('Please enter your name.', 'error');
            return;
          }
          window.showToast?.(`Welcome, ${name}!`, 'success');
          window.closeBottomSheet();
        };
      }
    }

    renderStep();

    // Show sheet with proper transition
    overlay.classList.remove('hidden');
    setTimeout(() => sheet.classList.remove('translate-y-full'), 10);
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

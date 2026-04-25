(function() {
  const themes = [
    { id: 'classic', name: 'Boardnify Original', color: '#EEECEA', preview: '#EEECEA' },
    { id: 'midnight', name: 'Deep Studio', color: '#1A1A1A', preview: '#1A1A1A', isDark: true },
    { id: 'lavender', name: 'Lavender', color: '#F1F0FF', preview: '#F1F0FF' },
    { id: 'ocean', name: 'Ocean', color: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)', preview: '#1e3a8a', isDark: true },
    { id: 'sand', name: 'Sand', color: '#FDFCFB', preview: '#FDFCFB' }
  ];

  let cropper = null;

  window.initSettings = async function(container) {
    // Override Topbar for Settings View (Image 2 style)
    const topbar = document.getElementById('m-topbar');
    if (topbar) {
       topbar.innerHTML = `
          <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-text-dark transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Profile & Settings</span>
          <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
          </button>
       `;
    }

    container.innerHTML = `
      <div class="view-container animate-fade-in pb-24 px-6 pt-8">
        <!-- Profile Header (Image 2 Style) -->
        <div class="flex flex-col items-center mb-10">
          <div class="relative mb-6">
             <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-premium">
                <img id="settings-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" class="w-full h-full object-cover">
             </div>
             <button id="profile-change-btn" class="absolute bottom-1 right-1 w-10 h-10 bg-[#6B21FF] text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
             </button>
             <input type="file" id="profile-upload-input" class="hidden" accept="image/*">
          </div>
          <div class="flex items-center gap-2 mb-1">
             <h2 class="text-2xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']" id="set-display-name-val">Elena Rodriguez</h2>
             <svg class="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 011.414 1.414z"></path></svg>
          </div>
          <div class="inline-flex items-center px-3 py-1 bg-[#F4F3FF] text-[#6B21FF] rounded-full text-[10px] font-black uppercase tracking-widest">
             PRO PLAN MEMBER
          </div>
        </div>

        <div class="space-y-6">
          <!-- Account Details Card -->
          <div class="bg-white rounded-[32px] p-8 border border-gray-100 shadow-premium">
             <div class="flex items-center justify-between mb-8">
                <h3 class="text-lg font-bold text-[#1A1916] font-['Cabinet_Grotesk']">Account Details</h3>
                <button id="settings-save-btn" class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest hover:underline">SAVE</button>
             </div>
             
             <div class="space-y-6">
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em]">Full Name</label>
                   <input type="text" id="set-display-name" value="Elena Rodriguez" class="w-full text-sm font-bold text-[#1A1916] outline-none border-b border-gray-100 pb-2 focus:border-[#6B21FF] transition-colors">
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em]">Email Address</label>
                   <input type="email" id="set-email" class="w-full text-sm font-bold text-gray-400 outline-none border-b border-gray-100 pb-2 bg-transparent" readonly>
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em]">Studio / Company</label>
                   <input type="text" id="set-company" value="Boardnify Studios" class="w-full text-sm font-bold text-[#1A1916] outline-none border-b border-gray-100 pb-2 focus:border-[#6B21FF] transition-colors">
                </div>
                <div class="space-y-2">
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em]">Bio / Status</label>
                   <textarea id="set-bio" class="w-full text-sm font-bold text-[#1A1916] outline-none border-b border-gray-100 pb-2 focus:border-[#6B21FF] transition-colors resize-none h-8 overflow-hidden">Creative Director & Lead Designer</textarea>
                </div>
             </div>
          </div>

          <!-- Appearance Card -->
          <div class="bg-white rounded-[32px] p-8 border border-gray-100 shadow-premium">
             <h3 class="text-lg font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-8">Appearance</h3>
             
             <div class="space-y-8">
                <div>
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em] block mb-4">Color Theme</label>
                   <div class="flex gap-2 p-1.5 bg-[#F4F3FF] rounded-2xl">
                      <button onclick="window.updateTheme('light')" class="flex-1 py-3 bg-white text-[#6B21FF] shadow-sm rounded-xl text-[10px] font-black uppercase tracking-widest theme-chip active">Light</button>
                      <button onclick="window.updateTheme('dark')" class="flex-1 py-3 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest theme-chip">Dark</button>
                      <button onclick="window.updateTheme('system')" class="flex-1 py-3 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest theme-chip">System</button>
                   </div>
                </div>

                <div>
                   <label class="text-[10px] font-black text-gray-300 uppercase tracking-[0.1em] block mb-6">Accent Saturation</label>
                   <div class="relative pt-1">
                      <div class="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                         <span>Soft</span>
                         <span>Vibrant</span>
                      </div>
                      <div class="h-2 bg-[#F4F3FF] rounded-full relative">
                         <div class="absolute inset-y-0 left-0 bg-[#6B21FF] rounded-full w-[75%]"></div>
                         <div class="absolute top-1/2 left-[75%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white border-4 border-[#6B21FF] rounded-full shadow-lg"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <!-- Danger Zone Card -->
          <div class="rounded-[32px] p-8 border-2 border-red-50 bg-red-50/10 shadow-sm">
             <h3 class="text-lg font-bold text-red-600 font-['Cabinet_Grotesk'] mb-2">Danger Zone</h3>
             <p class="text-[11px] font-medium text-red-400 mb-6">Permanently remove your workspace and all data.</p>
             <button id="set-delete-account" class="w-full py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200">Delete Workspace</button>
          </div>
        </div>
      </div>
    `;

    // Initialize state
    await loadUserData();
    setupEventListeners();
    renderThemeGrid();
  };

  async function loadUserData() {
    if (!window.supabaseClient) return;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (user) {
      const metadata = user.user_metadata || {};
      
      const mailInp = document.getElementById('set-email');
      const nameInp = document.getElementById('set-display-name');
      const bioInp = document.getElementById('set-bio');
      const avatarImg = document.getElementById('settings-avatar');

      if(mailInp) mailInp.value = user.email;
      if(nameInp) nameInp.value = metadata.full_name || '';
      if(bioInp) bioInp.value = metadata.bio || '';
      if(avatarImg && metadata.avatar_url) avatarImg.src = metadata.avatar_url;
      
      const fontSize = metadata.font_size || 'medium';
      updateFontSizeUI(fontSize);
    }
  }

  function setupEventListeners() {
    // Save Button
    const saveBtn = document.getElementById('settings-save-btn');
    if(saveBtn) saveBtn.onclick = saveSettings;

    // Font Size Buttons
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.onclick = () => {
        const size = btn.dataset.size;
        window.applyFontSize?.(size);
        updateFontSizeUI(size);
      };
    });

    // Password Reset
    const resetBtn = document.getElementById('set-reset-pw');
    if(resetBtn) {
      resetBtn.onclick = async () => {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if(!user) return;
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(user.email, {
          redirectTo: window.location.origin + '/login.html'
        });
        if (error) {
          window.showToast('Failed to send reset link: ' + error.message, 'error');
        } else {
          window.showToast('Reset link sent to ' + user.email, 'success');
        }
      };
    }

    // Delete Account (Opens global delete modal from app.html if it still exists, otherwise we'd need to recreate it)
    const deleteBtn = document.getElementById('set-delete-account');
    if(deleteBtn) {
      deleteBtn.onclick = () => {
        const delModal = document.getElementById('delete-security-modal');
        if(delModal) {
          delModal.classList.remove('hidden');
          delModal.classList.add('flex');
          setTimeout(() => delModal.classList.add('opacity-100'), 10);
        }
      };
    }

    // Avatar Upload
    const changeBtn = document.getElementById('profile-change-btn');
    const fileInput = document.getElementById('profile-upload-input');
    if(changeBtn && fileInput) {
      changeBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const cropModal = document.getElementById('crop-modal');
            const cropImg = document.getElementById('crop-preview-img');
            if(cropModal && cropImg) {
              cropImg.src = ev.target.result;
              cropModal.classList.remove('hidden');
              cropModal.classList.add('flex');
              setTimeout(() => {
                cropModal.classList.add('opacity-100');
                if(cropper) cropper.destroy();
                cropper = new Cropper(cropImg, { aspectRatio: 1, viewMode: 1 });
              }, 10);
            }
          };
          reader.readAsDataURL(file);
        }
      };
    }
  }

  function updateFontSizeUI(size) {
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      if(btn.dataset.size === size) {
        btn.classList.add('bg-white', 'shadow-sm', 'text-brand');
        btn.classList.remove('text-text-muted');
      } else {
        btn.classList.remove('bg-white', 'shadow-sm', 'text-brand');
        btn.classList.add('text-text-muted');
      }
    });
  }

  function renderThemeGrid() {
    const grid = document.getElementById('set-theme-grid');
    if (!grid) return;
    const currentTheme = window.appData?.user?.user_metadata?.preferred_theme || 'classic';
    
    grid.innerHTML = themes.map(t => `
      <div onclick="window.updateWallpaper('${t.id}')" 
           class="group cursor-pointer p-1 rounded-xl border-2 transition-all ${currentTheme === t.id ? 'border-brand' : 'border-transparent bg-gray-50/50 hover:bg-gray-100'}">
        <div class="w-full h-10 rounded-lg shadow-sm border border-black/5" style="background: ${t.color}" title="${t.name}"></div>
        <p class="text-[8px] font-black text-center mt-2 uppercase tracking-tighter text-text-muted truncate px-1">${t.name}</p>
      </div>
    `).join('');
  }

  async function saveSettings() {
    const name = document.getElementById('set-display-name').value;
    const bio = document.getElementById('set-bio').value;
    const fontSize = document.querySelector('.font-size-btn.bg-white')?.dataset.size || 'medium';

    if (window.supabaseClient) {
      const saveBtn = document.getElementById('settings-save-btn');
      const originalText = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const { error } = await window.supabaseClient.auth.updateUser({
        data: {
          full_name: name,
          bio: bio,
          font_size: fontSize
        }
      });

      if (error) {
        window.showToast('Failed to save: ' + error.message, 'error');
      } else {
        window.showToast('Settings updated! ✨', 'success');
        if (window.syncUserProfile) await window.syncUserProfile();
      }
      
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  }

})();

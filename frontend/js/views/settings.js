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
    container.innerHTML = `
      <div class="view-container animate-fade-in pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-text-dark tracking-tight">Account Settings</h1>
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Manage your workspace and profile</p>
          </div>
          <button id="settings-save-btn" class="px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 transition-all">
            Save Changes
          </button>
        </div>

        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bento-card p-6">
            <div class="flex items-center gap-6">
              <div class="relative group cursor-pointer" id="profile-change-btn">
                <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-brand transition-all">
                  <img id="settings-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" class="w-full h-full object-cover">
                </div>
                <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                </div>
                <input type="file" id="profile-upload-input" class="hidden" accept="image/*">
              </div>
              <div>
                <h3 class="text-sm font-bold text-text-dark mb-1">Your Profile Photo</h3>
                <p class="text-[9px] font-black text-text-muted uppercase tracking-widest">JPG, GIF or PNG. Max 2MB.</p>
              </div>
            </div>
          </div>

          <!-- Account Details Card -->
          <div class="bento-card p-6 space-y-6">
            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
              <input type="text" id="set-display-name" class="w-full p-4 rounded-xl border border-gray-100 focus:border-brand outline-none transition-all text-xs font-bold text-text-dark bg-gray-50/50">
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
              <input type="email" id="set-email" class="w-full p-4 rounded-xl border border-gray-100 outline-none text-xs font-bold text-text-muted bg-gray-100/50 cursor-not-allowed" readonly>
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bio / Introduction</label>
              <textarea id="set-bio" class="w-full h-24 p-4 rounded-xl border border-gray-100 focus:border-brand outline-none transition-all text-xs font-bold text-text-dark bg-gray-50/50 resize-none"></textarea>
            </div>
          </div>

          <!-- Interface Preferences -->
          <div class="bento-card p-6 space-y-8">
            <div>
              <h3 class="text-xs font-black text-text-dark uppercase tracking-widest mb-6">Interface Theme</h3>
              <div class="grid grid-cols-3 gap-3" id="set-theme-grid"></div>
            </div>
            
            <div>
              <h3 class="text-xs font-black text-text-dark uppercase tracking-widest mb-6">Typography Scale</h3>
              <div class="flex gap-2 p-1.5 bg-gray-50 rounded-2xl w-full">
                <button data-size="small" class="font-size-btn flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Small</button>
                <button data-size="medium" class="font-size-btn flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Medium</button>
                <button data-size="large" class="font-size-btn flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all">Large</button>
              </div>
            </div>
          </div>

          <!-- Security & Privacy -->
          <div class="bento-card p-6">
            <h3 class="text-xs font-black text-text-dark uppercase tracking-widest mb-6">Security & Danger Zone</h3>
            <div class="space-y-3">
              <button id="set-reset-pw" class="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-text-dark transition-all text-left flex items-center justify-between">
                <span>Reset My Password</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
              <button id="set-delete-account" class="w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all text-left">
                Delete My Workspace
              </button>
            </div>
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

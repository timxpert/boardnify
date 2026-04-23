(function() {
  const themes = [
    { id: 'classic', name: 'Boardnify Original', color: '#EEECEA', preview: '#EEECEA' },
    { id: 'midnight', name: 'Deep Studio', color: '#1A1A1A', preview: '#1A1A1A', isDark: true },
    { id: 'lavender', name: 'Lavender', color: '#F1F0FF', preview: '#F1F0FF' },
    { id: 'ocean', name: 'Ocean', color: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)', preview: '#1e3a8a', isDark: true },
    { id: 'sand', name: 'Sand', color: '#FDFCFB', preview: '#FDFCFB' }
  ];

  let cropper = null;

  // --- UI Selectors ---
  const profilePopover = document.getElementById('profile-modal');
  const profilePopoverContent = document.getElementById('profile-modal-content');
  const settingsModal = document.getElementById('settings-modal');
  const settingsContent = document.getElementById('settings-modal-content');
  
  const settingsBtn = document.getElementById('global-settings-btn');
  const popoverSettingsBtn = document.getElementById('popover-settings-btn');

  const updateAllAvatars = (url) => {
    if(!url) return;
    const avatars = ['sidebar-avatar', 'profile-avatar', 'settings-avatar'];
    avatars.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.src = url;
    });
  };

  const applyFontSize = (size) => {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size || 'medium'}`);
    
    // Update active state in settings
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      if(btn.dataset.size === size) {
        btn.classList.add('bg-white', 'shadow-md', 'border', 'border-gray-100');
        btn.classList.remove('hover:bg-white', 'hover:shadow-sm');
      } else {
        btn.classList.remove('bg-white', 'shadow-md', 'border', 'border-gray-100');
        btn.classList.add('hover:bg-white', 'hover:shadow-sm');
      }
    });
  };

  window.applyTheme = function(themeId) {
    const theme = themes.find(t => t.id === themeId) || themes[0];
    document.documentElement.style.setProperty('--bg-canvas', theme.color);
    
    if (theme.isDark) {
      document.body.classList.add('theme-dark');
      document.documentElement.style.setProperty('--text-main', '#FFFFFF');
      document.documentElement.style.setProperty('--text-muted', '#A1A1AA');
    } else {
      document.body.classList.remove('theme-dark');
      document.documentElement.style.setProperty('--text-main', '#1A1916');
      document.documentElement.style.setProperty('--text-muted', '#8E8A84');
    }
  };

  // --- Modal Logic ---

  const openPopover = async () => {
    if(!profilePopover) return;
    profilePopover.classList.remove('hidden');
    setTimeout(() => {
      profilePopoverContent.classList.remove('translate-y-full', 'opacity-0');
      profilePopoverContent.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    if (window.supabaseClient) {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (user) {
        const emailEl = document.getElementById('profile-email');
        const nameEl = document.getElementById('profile-name');
        if(emailEl) emailEl.textContent = user.email;
        if(nameEl) {
           const namePart = user.email.split('@')[0];
           const formattedName = namePart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
           nameEl.textContent = user.user_metadata?.full_name || formattedName;
        }
        if(user.user_metadata?.avatar_url) updateAllAvatars(user.user_metadata.avatar_url);
      }
    }
  };

  const closePopover = () => {
    if(!profilePopoverContent) return;
    profilePopoverContent.classList.add('translate-y-full', 'opacity-0');
    profilePopoverContent.classList.remove('translate-y-0', 'opacity-100');
    setTimeout(() => profilePopover.classList.add('hidden'), 300);
  };

  const openSettings = async () => {
    closePopover();
    if(!settingsModal) return;
    settingsModal.classList.remove('hidden');
    settingsModal.classList.add('flex');
    setTimeout(() => {
      settingsModal.classList.add('opacity-100');
      settingsContent.classList.remove('translate-y-full', 'opacity-0');
      settingsContent.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    // Populate Fields
    if (window.supabaseClient) {
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (user) {
        const mailInp = document.getElementById('set-email');
        const nameInp = document.getElementById('set-display-name');
        const bioInp = document.getElementById('set-bio');
        const portInp = document.getElementById('set-portfolio');

        if(mailInp) mailInp.value = user.email;
        if(nameInp) nameInp.value = user.user_metadata?.full_name || '';
        if(bioInp) bioInp.value = user.user_metadata?.bio || '';
        if(portInp) portInp.value = user.user_metadata?.portfolio_url || '';
        
        const fontSize = user.user_metadata?.font_size || 'medium';
        applyFontSize(fontSize);
      }
    }
    renderThemeGrid();
  };

  const closeSettings = () => {
    if(!settingsContent) return;
    settingsModal.classList.remove('opacity-100');
    settingsContent.classList.add('translate-y-full', 'opacity-0');
    settingsContent.classList.remove('translate-y-0', 'opacity-100');
    setTimeout(() => {
      settingsModal.classList.add('hidden');
      settingsModal.classList.remove('flex');
    }, 300);
  };

  const renderThemeGrid = () => {
    const grid = document.getElementById('set-theme-grid');
    if (!grid) return;
    const currentTheme = window.appData?.user?.user_metadata?.preferred_theme || 'classic';
    
    grid.innerHTML = themes.map(t => `
      <div onclick="window.updateWallpaper('${t.id}')" 
           class="group cursor-pointer p-1 rounded-2xl border-2 transition-all ${currentTheme === t.id ? 'border-[#FA5523]' : 'border-transparent hover:border-gray-100'}">
        <div class="w-full h-12 rounded-xl shadow-sm border border-black/5" style="background: ${t.color}" title="${t.name}"></div>
        <p class="text-[9px] font-bold text-center mt-2 uppercase tracking-widest text-text-muted">${t.name}</p>
      </div>
    `).join('');
  };

  window.updateWallpaper = async function(themeId) {
    window.applyTheme(themeId);
    if (window.supabaseClient) {
      await window.supabaseClient.auth.updateUser({
        data: { preferred_theme: themeId }
      });
      if (window.appData && window.appData.user) {
        if (!window.appData.user.user_metadata) window.appData.user.user_metadata = {};
        window.appData.user.user_metadata.preferred_theme = themeId;
      }
      renderThemeGrid();
    }
  };

  const saveSettings = async () => {
    const name = document.getElementById('set-display-name').value;
    const bio = document.getElementById('set-bio').value;
    const portfolio = document.getElementById('set-portfolio').value;
    const fontSize = document.querySelector('.font-size-btn.bg-white')?.dataset.size || 'medium';

    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.auth.updateUser({
        data: {
          full_name: name,
          bio: bio,
          portfolio_url: portfolio,
          font_size: fontSize
        }
      });

      if (error) {
        if (window.showToast) window.showToast('Failed to save settings: ' + error.message, 'error');
      } else {
        if (window.showToast) window.showToast('Settings saved! ✨', 'success');
        if (window.appData && window.appData.user) {
           if(!window.appData.user.user_metadata) window.appData.user.user_metadata = {};
           Object.assign(window.appData.user.user_metadata, {
            full_name: name,
            bio: bio,
            portfolio_url: portfolio,
            font_size: fontSize
          });
        }
        closeSettings();
      }
    }
  };

  // --- Handlers ---
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.settings-tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#FA5523]/10', 'text-[#FA5523]');
        b.classList.add('text-text-muted');
      });
      btn.classList.add('active', 'bg-[#FA5523]/10', 'text-[#FA5523]');
      btn.classList.remove('text-text-muted');
      document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
      const targetTab = document.getElementById(`tab-${tab}`);
      if(targetTab) targetTab.classList.remove('hidden');
    };
  });

  document.querySelectorAll('.font-size-btn').forEach(btn => {
    btn.onclick = () => applyFontSize(btn.dataset.size);
  });

  if (settingsBtn) settingsBtn.onclick = openPopover;
  if (popoverSettingsBtn) popoverSettingsBtn.onclick = openSettings;
  
  const pClose = document.getElementById('profile-close-btn');
  if(pClose) pClose.onclick = closePopover;

  const sClose = document.getElementById('settings-close-btn');
  if(sClose) sClose.onclick = closeSettings;

  const sSave = document.getElementById('settings-save-btn');
  if(sSave) sSave.onclick = saveSettings;

  // Password Reset Logic
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
        window.showToast('Reset password link sent to ' + user.email + ' 📧', 'success');
      }
    };
  }

  // --- Delete Security Modal Logic ---
  const delSecModal = document.getElementById('delete-security-modal');
  const delSecContent = document.getElementById('delete-security-content');
  const delConfirmInp = document.getElementById('delete-confirm-input');
  const finalDelBtn = document.getElementById('final-delete-btn');
  const delCancelBtn = document.getElementById('delete-cancel-btn');

  const openDeleteSecurity = () => {
    if(!delSecModal) return;
    delConfirmInp.value = '';
    finalDelBtn.disabled = true;
    finalDelBtn.className = 'w-full py-5 bg-red-50 text-red-300 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] cursor-not-allowed';
    
    delSecModal.classList.remove('hidden');
    delSecModal.classList.add('flex');
    setTimeout(() => {
      delSecModal.classList.add('opacity-100');
      delSecContent.classList.remove('scale-95');
    }, 10);
  };

  const closeDeleteSecurity = () => {
    if(!delSecContent) return;
    delSecModal.classList.remove('opacity-100');
    delSecContent.classList.add('scale-95');
    setTimeout(() => {
      delSecModal.classList.add('hidden');
      delSecModal.classList.remove('flex');
    }, 300);
  };

  if(delConfirmInp) {
    delConfirmInp.oninput = (e) => {
      const isMatch = e.target.value === 'Delete my account';
      finalDelBtn.disabled = !isMatch;
      if(isMatch) {
        finalDelBtn.classList.remove('bg-red-50', 'text-red-300', 'cursor-not-allowed');
        finalDelBtn.classList.add('bg-red-600', 'text-white', 'shadow-xl', 'shadow-red-600/20');
      } else {
        finalDelBtn.classList.add('bg-red-50', 'text-red-300', 'cursor-not-allowed');
        finalDelBtn.classList.remove('bg-red-600', 'text-white', 'shadow-xl', 'shadow-red-600/20');
      }
    };
  }

  if(delCancelBtn) delCancelBtn.onclick = closeDeleteSecurity;

  const deleteBtn = document.getElementById('set-delete-account');
  if(deleteBtn) {
    deleteBtn.onclick = openDeleteSecurity;
  }

  if(finalDelBtn) {
    finalDelBtn.onclick = async () => {
      if (window.supabaseClient) {
         finalDelBtn.disabled = true;
         finalDelBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto"></div>';
         
         await window.supabaseClient.auth.updateUser({
           data: { deleted_at: new Date().toISOString() }
         });
         
         if (window.showToast) window.showToast('Account scheduled for deletion.', 'warning');
         setTimeout(() => {
           if(window.signOut) window.signOut();
           else window.location.href = 'login.html';
         }, 1500);
      }
    };
  }

  // --- Initial Load ---
  if (window.supabaseClient) {
    (async () => {
       const userRes = await window.supabaseClient.auth.getUser();
       const user = userRes.data.user;
       if(user) {
         applyFontSize(user.user_metadata?.font_size || 'medium');
         if(user.user_metadata?.avatar_url) updateAllAvatars(user.user_metadata.avatar_url);
       }
    })();
  }

  // --- Cropper (Standalone) ---
  const cropModal = document.getElementById('crop-modal');
  const cropContent = document.getElementById('crop-modal-content');
  const cropImg = document.getElementById('crop-preview-img');
  const fileInput = document.getElementById('profile-upload-input');
  const changeBtn = document.getElementById('profile-change-btn');

  if (changeBtn && fileInput) {
    changeBtn.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          cropImg.src = ev.target.result;
          cropModal.classList.remove('hidden'); cropModal.classList.add('flex');
          setTimeout(() => {
            cropModal.classList.add('opacity-100'); cropContent.classList.remove('scale-95');
            if(cropper) cropper.destroy();
            cropper = new Cropper(cropImg, { aspectRatio: 1, viewMode: 1 });
          }, 10);
        };
        reader.readAsDataURL(file);
      }
    };
  }


  const applyCrop = document.getElementById('crop-apply-btn');
  if(applyCrop) {
    applyCrop.onclick = async () => {
      if(!cropper) return;
      
      applyCrop.disabled = true;
      applyCrop.textContent = 'Uploading...';
      
      const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
      canvas.toBlob(async (blob) => {
        try {
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          const fileName = `avatars/${user.id}_${Date.now()}.jpg`;
          
          const { data, error } = await window.supabaseClient.storage
            .from('thumbnails') // Reusing the public bucket
            .upload(fileName, blob, { upsert: true });

          if (error) throw error;

          const { data: { publicUrl } } = window.supabaseClient.storage
            .from('thumbnails')
            .getPublicUrl(fileName);

          updateAllAvatars(publicUrl);
          await window.supabaseClient.auth.updateUser({ data: { avatar_url: publicUrl } });
          
          if(window.showToast) window.showToast('Profile photo updated!');
          if(window.syncUserProfile) window.syncUserProfile();
          
          cropModal.classList.add('hidden');
        } catch (err) {
          console.error(err);
          if(window.showToast) window.showToast('Upload failed: ' + err.message, 'error');
        } finally {
          applyCrop.disabled = false;
          applyCrop.textContent = 'Apply Transformation';
        }
      }, 'image/jpeg', 0.9);
    };
  }

})();

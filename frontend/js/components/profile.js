(function() {
  const themes = [
    { id: 'classic', name: 'Boardnify Original', color: '#EEECEA', preview: '#EEECEA' },
    { id: 'midnight', name: 'Deep Studio', color: '#1A1A1A', preview: '#1A1A1A', isDark: true },
    { id: 'lavender', name: 'Lavender', color: '#F1F0FF', preview: '#F1F0FF' },
    { id: 'ocean', name: 'Ocean', color: 'linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 100%)', preview: '#1e3a8a', isDark: true },
    { id: 'sand', name: 'Sand', color: '#FDFCFB', preview: '#FDFCFB' }
  ];

  // --- UI Selectors ---
  const profilePopover = document.getElementById('profile-modal');
  const profilePopoverContent = document.getElementById('profile-modal-content');
  const settingsBtn = document.getElementById('global-settings-btn');
  
  const updateAllAvatars = (url) => {
    if(!url) return;
    const avatars = ['sidebar-avatar', 'profile-avatar', 'settings-avatar'];
    avatars.forEach(id => {
      const el = document.getElementById(id);
      if(el) el.src = url;
    });
  };

  window.applyFontSize = (size) => {
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size || 'medium'}`);
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

  // --- Popover Logic ---

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
      // Re-render grid if we are in settings view
      if (typeof renderThemeGrid === 'function') renderThemeGrid();
    }
  };

  // --- Handlers ---
  if (settingsBtn) settingsBtn.onclick = openPopover;
  
  const pClose = document.getElementById('profile-close-btn');
  if(pClose) pClose.onclick = closePopover;

  // --- Initial Load ---
  if (window.supabaseClient) {
    (async () => {
       const userRes = await window.supabaseClient.auth.getUser();
       const user = userRes.data.user;
       if(user) {
         window.applyFontSize(user.user_metadata?.font_size || 'medium');
         if(user.user_metadata?.avatar_url) updateAllAvatars(user.user_metadata.avatar_url);
       }
    })();
  }

})();

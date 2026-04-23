const app = document.getElementById('app');
let currentRoute = 'dashboard';

const socket = (typeof io !== 'undefined') ? io(window.BASE_URL || undefined) : null;

const routes = {
  dashboard: window.initDashboard,
  moodboard: window.initMoodboard,
  script: window.initScript,
  task_tracker: window.initKanban,
  style_frames: window.initStyleFrames,
  motion_project: window.initMotionProjects,
  review: window.initReviews,
  trash: window.initTrash,
  storyboard: window.initStoryboard
};

window.navigate = function(route, projectId = null, skipHash = false) {
  currentRoute = route;
  window.currentProject = projectId;
  
  // Update URL hash for persistence/deep-linking
  if (!skipHash) {
    window.location.hash = projectId ? `${route}/${projectId}` : route;
  }

  // Update dynamic breadcrumb & title
  const activeLabelEl = document.getElementById('breadcrumb-active-label');
  const boardTitleEl = document.getElementById('active-board-title');
  const targetLink = document.querySelector(`.nav-link[data-route="${route}"]`);
  
  const proj = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];

  if (!proj && route !== 'dashboard' && route !== 'trash') {
    app.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center p-12">
        <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-6 font-sans">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
        <h2 class="text-xl font-bold text-text-dark mb-2">No Project Selected</h2>
        <p class="text-xs text-text-muted font-medium mb-8">Please select or create a project to view this board.</p>
        <button onclick="window.navigate('dashboard')" class="px-8 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Back to Dashboard</button>
      </div>
    `;
    return;
  }

  if (activeLabelEl && targetLink) {
    activeLabelEl.textContent = targetLink.dataset.label || route.charAt(0).toUpperCase() + route.slice(1);
  }

  if (boardTitleEl) {
    if (route === 'dashboard') {
       boardTitleEl.textContent = 'Project Home';
       boardTitleEl.contentEditable = 'false';
    } else {
       boardTitleEl.textContent = proj?.title || 'Untitled Board';
       boardTitleEl.contentEditable = 'true';
    }
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.route === route) {
      link.classList.add('active');
    }
  });
  
  app.innerHTML = '';
  if (routes[route]) {
    // Show a skeleton loader inside the view container before initializing
    app.innerHTML = `
      <div class="view-container animate-pulse p-10 space-y-8">
        <div class="h-12 w-1/3 bg-gray-100 rounded-xl"></div>
        <div class="grid grid-cols-1 gap-6">
          <div class="h-64 bg-gray-50 rounded-2xl"></div>
          <div class="h-64 bg-gray-50 rounded-2xl"></div>
          <div class="h-64 bg-gray-50 rounded-2xl"></div>
        </div>
        <div class="h-96 bg-gray-50 rounded-2xl w-full"></div>
      </div>
    `;
    
    // Tiny delay to ensure the skeleton is visible
    setTimeout(() => {
      app.innerHTML = '';
      routes[route](app, socket, projectId);
    }, 150);
  } else {
    app.innerHTML = '<div class="flex items-center justify-center h-full text-2xl text-gray-500">404 - View not found</div>';
  }
};

// Support Browser Back/Forward buttons and direct links
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const parts = hash.split('/');
    const route = parts[0];
    const projectId = parts[1] || null;
    if (route !== currentRoute || projectId !== window.currentProject) {
      window.navigate(route, projectId, true);
    }
  }
});

window.navigateTo = window.navigate;

// Title Sync Logic
const boardTitleEl = document.getElementById('active-board-title');
if (boardTitleEl) {
  boardTitleEl.onblur = () => {
    const newTitle = boardTitleEl.textContent.trim();
    const projId = window.currentProject || window.appData.projects[0]?.id;
    if (newTitle && projId) {
      const proj = window.appData.projects.find(p => p.id === projId);
      if (proj) {
         proj.title = newTitle;
         if (window.dbUpdate) window.dbUpdate('projects', projId, { title: newTitle });
         if (window.showToast) window.showToast('Project title updated');
      }
    }
  };
  boardTitleEl.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      boardTitleEl.blur();
    }
  };
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const route = e.currentTarget.dataset.route;
    window.navigate(route, window.currentProject);
    if (window.innerWidth < 768) {
       const sidebar = document.getElementById('m-side-drawer');
       const overlay = document.getElementById('m-side-drawer-overlay');
       if(sidebar && !sidebar.classList.contains('-translate-x-full')) {
           sidebar.classList.add('-translate-x-full');
           sidebar.classList.remove('translate-x-0');
           if (overlay) {
             overlay.classList.add('opacity-0');
             setTimeout(() => overlay.classList.add('hidden'), 300);
           }
       }
    }
  });
});

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('m-side-drawer');
const mobileOverlay = document.getElementById('m-side-drawer-overlay');

function toggleMobileSidebar() {
  if(!sidebar) return;
  const isOpen = sidebar.classList.contains('-translate-x-full');
  if(isOpen) {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    if (mobileOverlay) {
      mobileOverlay.classList.remove('hidden');
      setTimeout(() => mobileOverlay.classList.remove('opacity-0'), 10);
    }
  } else {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    if (mobileOverlay) {
      mobileOverlay.classList.add('opacity-0');
      setTimeout(() => mobileOverlay.classList.add('hidden'), 300);
    }
  }
}

if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
if(mobileOverlay) mobileOverlay.addEventListener('click', toggleMobileSidebar);

window.updateNavVisibility = function() {
  const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
  if(!proj) return;
  if(!proj.data) proj.data = {};
  if(!proj.data.clientPermissions) {
    proj.data.clientPermissions = { moodboard: false, styleframes: true, script: true, kanban: true, reviews: true, motionprojects: true };
  }
  const perms = proj.data.clientPermissions;
  const isClient = window.activeRole === 'client';
  document.querySelectorAll('.nav-link').forEach(link => {
     const rt = link.dataset.route;
     if (rt === 'dashboard' || rt === 'trash') {
        if (rt === 'trash' && isClient) link.style.display = 'none';
        else link.style.display = 'flex';
        return;
     }
     if (isClient && perms[rt] === false) {
        link.style.display = 'none';
        if (currentRoute === rt) window.navigate('dashboard', proj.id);
     } else {
        link.style.display = 'flex';
     }
  });
};

const _urlParams = new URLSearchParams(window.location.search);
window.activeRole = _urlParams.get('role') || 'designer';
window.activeClient = _urlParams.get('client') || 'All';

window.appData = {
  trash: [],
  reviews: [],
  projects: [],
  activity: [],
  notifications: []
};


window.syncUserProfile = async function() {
  if (!window.supabaseClient) return;
  
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) return;

  window.appData.user = user;
  const metadata = user.user_metadata || {};
  const fullName = metadata.full_name || user.email.split('@')[0];
  const avatarUrl = metadata.avatar_url;

  // Update Sidebar Avatar
  const sidebarAvatar = document.getElementById('sidebar-avatar');
  const sidebarBtn = document.getElementById('global-settings-btn');
  
  if (sidebarAvatar) {
    if (avatarUrl) {
      sidebarAvatar.src = avatarUrl;
      sidebarAvatar.classList.remove('hidden');
      if (sidebarBtn.querySelector('.initials-placeholder')) sidebarBtn.querySelector('.initials-placeholder').remove();
    } else {
      // Create initials placeholder if no avatar
      sidebarAvatar.classList.add('hidden');
      const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      if (!sidebarBtn.querySelector('.initials-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'initials-placeholder w-full h-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs';
        placeholder.textContent = initials;
        sidebarBtn.appendChild(placeholder);
      }
    }
  }

  // Update Profile Popover
  const pName = document.getElementById('profile-name');
  const pEmail = document.getElementById('profile-email');
  const pAvatar = document.getElementById('profile-avatar');
  if (pName) pName.textContent = fullName;
  if (pEmail) pEmail.textContent = user.email;
  if (pAvatar && avatarUrl) pAvatar.src = avatarUrl;

  // Update Settings Modal
  const sName = document.getElementById('set-display-name');
  const sEmail = document.getElementById('set-email');
  const sAvatar = document.getElementById('settings-avatar');
  if (sName) sName.value = fullName;
  if (sEmail) sEmail.value = user.email;
  if (sAvatar && avatarUrl) sAvatar.src = avatarUrl;

  // Apply User Theme Preference
  if (metadata.preferred_theme && window.applyTheme) {
    window.applyTheme(metadata.preferred_theme);
  }
};

window.logActivity = function(action, target) {
  const actId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'a' + Date.now();
  const userName = window.appData?.user?.user_metadata?.full_name || (window.activeRole === 'client' ? 'Client' : 'Designer');
  const payload = { id: actId, user_name: userName, action: action, target: target };
  window.appData.activity.unshift({ id: payload.id, user: payload.user_name, action: payload.action, target: payload.target, time: 'Just now' });
  if(window.appData.activity.length > 20) window.appData.activity.pop();
  if(window.dbInsert) {
     (async () => {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const userId = user?.id || null;
        const finalPayload = { ...payload, ...(userId && { user_id: userId }) };
        window.dbInsert('activity', finalPayload);
     })();
  }
};

window.updateBadges = function() {
  const tBadge = document.getElementById('nav-trash-badge');
  const rBadge = document.getElementById('nav-reviews-badge');
  if(tBadge) {
    tBadge.textContent = window.appData.trash.length;
    tBadge.classList.toggle('hidden', window.appData.trash.length === 0);
  }
  if(rBadge) {
    const pending = window.appData.reviews.filter(r => r.status === 'Pending').length;
    rBadge.textContent = pending;
    rBadge.classList.toggle('hidden', pending === 0 || window.activeRole === 'client');
  }
};

const roleBtnDesigner = document.getElementById('role-toggle-designer');
const roleBtnClient = document.getElementById('role-toggle-client');

function updateRoleUI(skipNavigate = false) {
  const isClient = window.activeRole === 'client';
  
  // Highlight active role btn
  const btnDesigner = document.getElementById('role-toggle-designer');
  const btnClient = document.getElementById('role-toggle-client');
  if (btnDesigner && btnClient) {
    if (isClient) {
      btnDesigner.classList.remove('bg-white', 'shadow-sm');
      btnClient.classList.add('bg-white', 'shadow-sm');
    } else {
      btnClient.classList.remove('bg-white', 'shadow-sm');
      btnDesigner.classList.add('bg-white', 'shadow-sm');
    }
  }

  document.querySelectorAll('#global-invite-client-btn, #access-settings-btn, .editors-btn, .unsorted-pill').forEach(el => {
    if (isClient) el.style.display = 'none';
    else el.style.display = '';
  });
  
  window.updateBadges();
  window.updateNavVisibility();
  if(!skipNavigate) navigate(currentRoute, window.currentProject);
}

if(roleBtnDesigner && roleBtnClient) {
  roleBtnDesigner.addEventListener('click', () => { window.activeRole = 'designer'; updateRoleUI(); });
  roleBtnClient.addEventListener('click', () => { window.activeRole = 'client'; updateRoleUI(); });
}

const clientSelect = document.getElementById('global-client-select');
if(clientSelect) {
  clientSelect.addEventListener('change', (e) => {
    window.activeClient = e.target.value;
    if(window.showToast) window.showToast(`Filtering view for: ${window.activeClient}`);
    navigate(currentRoute, window.currentProject);
  });
}

// New Client Invite Modal Logic
const globalInviteBtn = document.getElementById('global-invite-client-btn');
const newClientInviteModal = document.getElementById('new-client-invite-modal');
const newClientInviteContent = document.getElementById('new-client-invite-content');
const newClientInviteCloseBtn = document.getElementById('new-client-invite-close');
const newClientInviteCancelBtn = document.getElementById('new-client-invite-cancel');
const newClientInviteSubmitBtn = document.getElementById('new-client-invite-submit');
const newClientInviteEmail = document.getElementById('new-client-invite-email');
const newClientInviteProjectTitle = document.getElementById('new-client-invite-project-title');
const newClientInviteProjectDesc = document.getElementById('new-client-invite-project-desc');
const newClientInviteError = document.getElementById('new-client-invite-error');
const globalClientSelect = document.getElementById('global-client-select');

const closeNewClientInviteModal = () => {
  newClientInviteModal.classList.add('opacity-0');
  newClientInviteContent.classList.add('scale-95');
  setTimeout(() => newClientInviteModal.classList.add('hidden'), 300);
  newClientInviteEmail.value = '';
  newClientInviteProjectTitle.value = '';
  newClientInviteProjectDesc.value = '';
  newClientInviteError.classList.add('hidden');
  newClientInviteEmail.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
  newClientInviteProjectTitle.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
};

if(globalInviteBtn) {
  globalInviteBtn.addEventListener('click', () => {
    newClientInviteModal.classList.remove('hidden');
    setTimeout(() => {
      newClientInviteModal.classList.remove('opacity-0');
      newClientInviteContent.classList.remove('scale-95');
    }, 10);
  });
}

if(newClientInviteCloseBtn) newClientInviteCloseBtn.addEventListener('click', closeNewClientInviteModal);
if(newClientInviteCancelBtn) newClientInviteCancelBtn.addEventListener('click', closeNewClientInviteModal);

if(newClientInviteModal) {
  newClientInviteModal.addEventListener('click', (e) => {
    if(e.target === newClientInviteModal) closeNewClientInviteModal();
  });
}

if(newClientInviteSubmitBtn) {
  newClientInviteSubmitBtn.addEventListener('click', async () => {
    const email = newClientInviteEmail.value.trim();
    const projectTitle = newClientInviteProjectTitle.value.trim();
    const projectDesc = newClientInviteProjectDesc.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = true;

    if(!email || !emailRegex.test(email)) {
      newClientInviteEmail.classList.add('border-red-500', 'ring-2', 'ring-red-500');
      isValid = false;
    } else {
      newClientInviteEmail.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
    }

    if(!projectTitle) {
      newClientInviteProjectTitle.classList.add('border-red-500', 'ring-2', 'ring-red-500');
      isValid = false;
    } else {
      newClientInviteProjectTitle.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
    }

    if(!isValid) {
      newClientInviteError.textContent = "Please fill in all required fields.";
      newClientInviteError.classList.remove('hidden');
      return;
    }

    try {
      newClientInviteSubmitBtn.textContent = 'Sending...';
      newClientInviteSubmitBtn.disabled = true;

      let uid = null;
      let designerName = 'Your Designer';
      if (window.supabaseClient) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
          uid = user.id;
          designerName = user.user_metadata?.full_name || user.email || 'Your Designer';
        }
      }

      // Insert invite directly into Supabase
      const { data, error } = await window.supabaseClient
        .from('client_invites')
        .insert({
          designer_id: uid,
          designer_name: designerName,
          client_email: email,
          project_title: projectTitle,
          project_desc: projectDesc,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send magic link invite email to client
      const { error: inviteError } = await window.supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin + '/client-accept.html?invite_id=' + data.id
        }
      });

      if (inviteError) throw inviteError;

      // Add client to dropdown as pending
      if (globalClientSelect) {
        let optionExists = false;
        for (let i = 0; i < globalClientSelect.options.length; i++) {
          if (globalClientSelect.options[i].value === projectTitle) {
            optionExists = true;
            break;
          }
        }
        if (!optionExists) {
          const newOption = document.createElement('option');
          newOption.value = projectTitle;
          newOption.textContent = `🕐 ${projectTitle} (Pending)`;
          newOption.disabled = true;
          globalClientSelect.appendChild(newOption);
        }
      }

      if(window.showToast) window.showToast(`Invite sent to ${email}! ${projectTitle} is pending approval.`, 'success');
      closeNewClientInviteModal();

    } catch(err) {
      console.error(err);
      newClientInviteError.textContent = err.message || 'Failed to send invite';
      newClientInviteError.classList.remove('hidden');
    } finally {
      newClientInviteSubmitBtn.textContent = 'Send Invite';
      newClientInviteSubmitBtn.disabled = false;
    }
  });
}

// Client Access Settings Modal Logic
const accessBtn = document.getElementById('access-settings-btn');
const accessModal = document.getElementById('access-modal');
const accessModalContent = document.getElementById('access-modal-content');
const accessCloseBtn = document.getElementById('access-close-btn');
const accessContainer = document.getElementById('access-toggles-container');

if(accessBtn) {
  accessBtn.addEventListener('click', () => {
     if(window.activeRole === 'client') return;
     const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
     if(!proj) return;
     if(!proj.data) proj.data = {};
     if(!proj.data.clientPermissions) {
        proj.data.clientPermissions = { library: false, moodboard: false, styleframes: true, script: true, kanban: true, reviews: true, motionprojects: true };
     }
     const perms = proj.data.clientPermissions;
     const labels = {
        moodboard: 'Moodboard Builder',
        styleframes: 'Style Frames',
        script: 'Scripts',
        kanban: 'Task Tracker',
        motionprojects: 'Motion Projects',
        reviews: 'Reviews'
     };
     accessContainer.innerHTML = Object.keys(labels).map(key => `
        <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
           <span class="text-sm font-semibold text-gray-800">${labels[key]}</span>
           <label class="relative inline-flex items-center cursor-pointer">
             <input type="checkbox" class="sr-only peer access-toggle-item" data-key="${key}" ${perms[key] ? 'checked' : ''}>
             <div class="w-11 h-6 bg-border-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-light after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
           </label>
        </div>
     `).join('');
     document.querySelectorAll('.access-toggle-item').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
           const key = e.target.dataset.key;
           proj.data.clientPermissions[key] = e.target.checked;
           if(window.dbUpdate) window.dbUpdate('projects', proj.id, { data: proj.data });
           window.updateNavVisibility();
        });
     });
     accessModal.classList.remove('hidden');
     setTimeout(() => {
        accessModal.classList.remove('opacity-0');
        accessModalContent.classList.remove('scale-95');
     }, 10);
  });
}

if(accessCloseBtn) {
  accessCloseBtn.addEventListener('click', () => {
     accessModal.classList.add('opacity-0');
     accessModalContent.classList.add('scale-95');
     setTimeout(() => accessModal.classList.add('hidden'), 300);
  });
}

// Notifications Logic
window.appData.notifications = [
  { id: 1, title: 'New Review on Acme Corp', time: '5m ago', read: false, link: 'reviews' },
  { id: 2, title: 'Asset added to Moodboard', time: '1h ago', read: false, link: 'moodboard' },
  { id: 3, title: 'Client approved Style Frames', time: '2h ago', read: true, link: 'styleframes' }
];

function updateNotificationsUI() {
  const badge = document.getElementById('nav-notif-badge');
  const list = document.getElementById('nav-notif-list');
  if(!badge || !list) return;
  const unread = window.appData.notifications.filter(n => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
  list.innerHTML = window.appData.notifications.length ? window.appData.notifications.map(n => `
    <div class="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer smooth-transition ${n.read ? 'opacity-50' : ''}" onclick="window.navigate('${n.link}'); window.markNotifRead(${n.id})">
       <div class="flex justify-between items-start mb-1">
         <h4 class="text-sm font-bold text-gray-800 ${n.read ? '' : 'text-brand'}">${n.title}</h4>
         ${!n.read ? '<span class="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1"></span>' : ''}
       </div>
       <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${n.time}</span>
    </div>
  `).join('') : '<div class="p-8 text-center text-sm text-gray-400">No notifications</div>';
}

window.markNotifRead = function(id) {
  const n = window.appData.notifications.find(n => n.id === id);
  if(n) n.read = true;
  updateNotificationsUI();
};

const notifMarkReadBtn = document.getElementById('nav-notif-mark-read');
if(notifMarkReadBtn) {
  notifMarkReadBtn.onclick = (e) => {
    e.stopPropagation();
    window.appData.notifications.forEach(n => n.read = true);
    updateNotificationsUI();
  };
}

const notifBtn = document.getElementById('nav-notif-btn');
const notifDropdown = document.getElementById('nav-notif-dropdown');
if(notifBtn && notifDropdown) {
  notifBtn.onclick = (e) => {
    e.stopPropagation();
    const hidden = notifDropdown.classList.contains('hidden');
    if(hidden) {
      notifDropdown.classList.remove('hidden');
      setTimeout(() => notifDropdown.classList.remove('opacity-0', 'scale-95'), 10);
    } else {
      notifDropdown.classList.add('opacity-0', 'scale-95');
      setTimeout(() => notifDropdown.classList.add('hidden'), 200);
    }
  };
  document.addEventListener('click', () => {
    if(!notifDropdown.classList.contains('hidden')) {
       notifDropdown.classList.add('opacity-0', 'scale-95');
       setTimeout(() => notifDropdown.classList.add('hidden'), 200);
    }
  });
  notifDropdown.addEventListener('click', (e) => e.stopPropagation());
}

const originalTrigger = window.triggerNotification;
window.triggerNotification = function(type, data={}) {
  if (originalTrigger) originalTrigger(type, data);
  window.appData.notifications.unshift({
     id: Date.now(),
     title: (type.split('_').join(' ').toUpperCase()) + (data.projectName ? ` - ${data.projectName}` : ''),
     time: 'Just now',
     read: false,
     link: 'dashboard'
  });
  updateNotificationsUI();
};

updateNotificationsUI();
window.updateBadges();

/**
 * GLOBAL DATABASE HELPERS
 * These functions handle optimistic UI updates and background Supabase syncing.
 */

window.isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Sync Queue to prevent overlapping requests for the same record
const syncQueues = new Map();

window.dbUpdate = async (table, id, payload) => {
  if (!id || id === 'null') return;

  const syncKey = `${table}:${id}`;
  if (syncQueues.get(syncKey)) {
    // Already syncing this record, update the queued payload
    syncQueues.set(syncKey, { ...syncQueues.get(syncKey), ...payload });
    return;
  }
  
  syncQueues.set(syncKey, true); // Mark as syncing

  try {
    const updatePayload = { ...payload };
    if (table !== 'tasks') {
      updatePayload.last_updated = new Date();
    }
    const { error } = await window.supabaseClient.from(table).update(updatePayload).eq('id', id);
    if (error) {
      console.error(`[DB Update Error - ${table}]:`, error);
    }
  } catch(e) { 
    console.error(`[DB Sync] Failed to update ${table}/${id}:`, e); 
  } finally {
    const queuedPayload = syncQueues.get(syncKey);
    syncQueues.delete(syncKey);
    if (queuedPayload && typeof queuedPayload === 'object') {
      window.dbUpdate(table, id, queuedPayload);
    }
  }
};

window.dbInsert = async function(table, data) {
  // UUID Guard for insertion
  if (table === 'tasks' && !window.isUUID(data.id)) {
    console.log(`[DB Insert Guard] Skipped 'tasks' table insert for legacy/mock ID: ${data.id}.`);
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from(table)
      .insert(data);
    if (error) throw error;
  } catch (err) {
    console.error(`[DB Sync] Failed to insert into ${table}:`, err);
    if(window.showToast) window.showToast(`Sync Error: ${err.message}`, 'error');
  }
};

window.dbDelete = async function(table, id) {
  // UUID Guard for deletion
  if (table === 'tasks' && !window.isUUID(id)) {
     console.log(`[DB Delete Guard] Local-only deletion for legacy ID: ${id}`);
     return;
  }

  try {
    const { error } = await window.supabaseClient
      .from(table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error(`[DB Sync] Failed to delete from ${table}/${id}:`, err);
    if(window.showToast) window.showToast(`Sync Error: ${err.message}`, 'error');
  }
};

// Boot application by syncing with Supabase
window.bootApp = async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('magic');

  if (window.supabaseClient) {
    // 1. Mandatory Session Guard
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    
    // If no session and no magic link, redirect to login
    if (!session && !magicToken) {
       console.log('[Auth Guard] No active session found. Redirecting to login.html');
       window.location.href = 'login.html';
       return;
    }

    const appEl = document.getElementById('app');
    // REMOVED: Full screen syncing loader is now handled by the default HTML state for a smoother entry.

    // 2. Load User Profile / Check Status
    if (session) {
      const user = session.user;
      const deletedAt = user.user_metadata?.deleted_at;

      if (deletedAt) {
        const delDate = new Date(deletedAt);
        const expDate = new Date(delDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now < expDate) {
          // Inside 30-day grace period - Show Recovery Overlay
          const overlay = document.getElementById('recovery-overlay');
          const dateEl = document.getElementById('recovery-date');
          const daysEl = document.getElementById('recovery-days');
          const undoBtn = document.getElementById('recovery-undo-btn');

          if (overlay) {
            const diff = expDate - now;
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            
            if(dateEl) dateEl.textContent = expDate.toLocaleDateString();
            if(daysEl) daysEl.textContent = daysLeft;
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');

            if(undoBtn) {
              undoBtn.onclick = async () => {
                undoBtn.disabled = true;
                undoBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto"></div>';
                await window.supabaseClient.auth.updateUser({ data: { deleted_at: null } });
                window.location.reload();
              };
            }
            return; // Block boot
          }
        } else {
          // Grace period EXPIRED
          const appEl = document.getElementById('app');
          appEl.innerHTML = `
            <div class="fixed inset-0 bg-white z-[3000] flex items-center justify-center p-6 text-center">
              <div class="max-w-md">
                <h2 class="text-2xl font-bold text-text-dark mb-4">Account Permanently Deleted</h2>
                <p class="text-text-muted mb-8 text-sm">The 30-day restoration window for this account has closed. All data has been purged from our active systems.</p>
                <button onclick="signOut()" class="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl uppercase tracking-widest text-[10px]">Back to Login</button>
              </div>
            </div>
          `;
          return; // Block boot
        }
      }


      window.appData.user = user;
      if (window.syncUserProfile) window.syncUserProfile();
    }

    let magicBypassTargetId = null;
    if (magicToken) {
       try {
          const { data, error } = await window.supabaseClient.from('project_access_tokens').select('*').eq('token', magicToken).single();
          if (data && !error) {
             const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
             if (!isExpired) {
                window.activeRole = 'client';
                window.activeClient = data.client_name || 'Guest';
                magicBypassTargetId = data.project_id;
                window.currentProject = data.project_id;
                setTimeout(() => {
                  window.showToast(`Welcome back, ${window.activeClient}!`, 'success');
                  window.updateNavVisibility();
                }, 1000);
             } else {
                setTimeout(() => window.showToast('This link has expired, please contact your designer for a new link.', 'error'), 1000);
             }
          }
       } catch (e) {
          console.warn('Magic link validation failed or table missing.', e);
       }
    }

    try {
      const [projRes, revRes, actRes, trashRes, libRes, invitesRes] = await Promise.all([
        window.supabaseClient.from('projects').select('*').order('last_updated', { ascending: false }),
        window.supabaseClient.from('reviews').select('*'),
        window.supabaseClient.from('activity').select('*').order('created_at', { ascending: false }).limit(20),
        window.supabaseClient.from('trash').select('*').order('deleted_at', { ascending: false }),
        window.supabaseClient.from('client_invites').select('*')
      ]);

      if (projRes.data && projRes.data.length > 0) {
        window.appData.projects = projRes.data;
      } else {
        window.appData.projects = [];
      }
      
      // Resilient sync: If one table fails, don't crash the whole app boot
      const safeSync = async (table, targetProp) => {
        try {
          const res = await window.supabaseClient.from(table).select('*').limit(50);
          if (res.data && res.data.length > 0) window.appData[targetProp] = res.data;
        } catch (e) {
          console.warn(`[Sync] Failed to fetch table: ${table}. Tables may not exist yet.`, e);
        }
      };

      await safeSync('reviews', 'reviews');
      await safeSync('activity', 'activity');
      await safeSync('trash', 'trash');
      await safeSync('client_invites', 'client_invites');

    } catch(err) {
      console.error("Supabase initial sync core failed:", err);
      // Only show error if core projects/session failed
    }

    if (typeof updateRoleUI === 'function') updateRoleUI(true);
    
    // Restore from URL Hash or Magic Link
    const hash = window.location.hash.slice(1);
    if (hash) {
      const parts = hash.split('/');
      const route = parts[0];
      const projectId = parts[1] || null;
      navigate(route, projectId, true);
    } else {
      navigate('dashboard', magicBypassTargetId);
    }
  } else {
    if (typeof updateRoleUI === 'function') updateRoleUI(true);
    
    // Check hash even for local/offline mode
    const hash = window.location.hash.slice(1);
    if (hash) {
      const parts = hash.split('/');
      navigate(parts[0], parts[1] || null, true);
    } else {
      navigate('dashboard');
    }
  }
};

window.addEventListener('load', () => {
  window.bootApp();
});

window.signOut = async function() {
  if (window.supabaseClient) {
     await window.supabaseClient.auth.signOut();
  }
  window.appData.user = null;
  window.location.href = 'index.html';
};

window.showToast = function(message, type = 'success') {
  const toastContainer = document.getElementById('toast-container') || (function() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  const colors = {
    success: 'bg-white text-text-dark border-l-4 border-green-500',
    error: 'bg-white text-text-dark border-l-4 border-red-500',
    info: 'bg-white text-text-dark border-l-4 border-brand',
    warning: 'bg-white text-text-dark border-l-4 border-yellow-500'
  };
  const icons = {
    success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    info: '<svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    warning: '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
  };
  toast.className = `${colors[type] || colors.info} px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] smooth-transition transform translate-x-full opacity-0 flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-gray-100 min-w-[320px] pointer-events-auto cursor-pointer`;
  toast.innerHTML = `
    <div class="flex-shrink-0">${icons[type] || icons.info}</div>
    <div class="flex-grow">
      <p class="font-bold text-[9px] uppercase tracking-widest text-text-muted mb-0.5">${type}</p>
      <p class="font-bold text-[13px] text-text-dark">${message}</p>
    </div>
  `;
  toast.onclick = () => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  };
  toastContainer.appendChild(toast);
  setTimeout(() => { toast.classList.remove('translate-x-full', 'opacity-0'); }, 10);
  setTimeout(() => {
    if(toast.parentNode) {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
};


window.setTimeout(() => {
  window.showToast('Client "Acme Corp" approved your moodboard!', 'success');
}, 2000);

window.startVoiceRecord = async function(onStopCallback) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      stream.getTracks().forEach(track => track.stop());
      if (onStopCallback) onStopCallback(audioUrl);
    };
    mediaRecorder.start();
    return mediaRecorder;
  } catch(err) {
    window.showToast('Microphone access denied or unavailable.');
    return null;
  }
};
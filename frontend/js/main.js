const app = document.getElementById('app');
let currentRoute = 'dashboard';

// Initialize Socket connection using the central API URL if set, otherwise default to current host
const socket = (typeof io !== 'undefined') ? io(window.BASE_URL || undefined) : null;

// ─── Deleted duplicate activeHistory and EditorClipboard handles. Handled in js/utils/editor.js ───



const routes = {
  dashboard: window.initDashboard,
  moodboard: window.initMoodboard,
  script: window.initScript,
  kanban: window.initKanban,
  library: window.initLibrary,
  styleframes: window.initStyleFrames,
  motionprojects: window.initMotionProjects,
  reviews: window.initReviews,
  trash: window.initTrash
};

window.navigate = function(route, projectId = null) {
  currentRoute = route;
  window.currentProject = projectId;
  
  // Update sidebar active states
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active', 'text-gray-900', 'font-semibold', 'bg-red-50', 'text-red-600');
    link.classList.add('text-gray-600', 'font-medium');
    
    if (link.dataset.route === route) {
      link.classList.add('active');
      link.classList.remove('text-gray-600');
      if(route === 'trash') {
        link.classList.add('bg-red-50', 'text-red-600');
      } else {
        link.classList.add('text-gray-900', 'font-semibold');
      }
    }
  });

  // Render view
  app.innerHTML = ''; // clear current view
  if (routes[route]) {
    // Pass projectId as the 3rd argument to the view init function
    routes[route](app, socket, projectId);
  } else {
    app.innerHTML = '<div class="flex items-center justify-center h-full text-2xl text-gray-500">404 - View not found</div>';
  }
}

// Support older navigateTo naming if used elsewhere
window.navigateTo = window.navigate;


// Global Nav Listeners
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const route = e.currentTarget.dataset.route;
    window.navigate(route, window.currentProject);
  });
});

// Permissions visibility logic
window.updateNavVisibility = function() {
  const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
  if(!proj) return;
  
  if(!proj.data.clientPermissions) {
    proj.data.clientPermissions = { library: false, moodboard: false, styleframes: true, script: true, kanban: true, reviews: true, motionprojects: true };
  }
  
  const perms = proj.data.clientPermissions;
  const isClient = window.activeRole === 'client';
  
  document.querySelectorAll('.nav-link').forEach(link => {
     const rt = link.dataset.route;
     // Dashboard & Trash are global/always accessible based on roles, not perms
     if (rt === 'dashboard' || rt === 'trash') {
        if (rt === 'trash' && isClient) link.style.display = 'none'; // hidden for clients always
        else link.style.display = 'flex';
        return;
     }

     if (isClient && perms[rt] === false) {
        link.style.display = 'none';
        // if currently on this route, redirect to dashboard
        if (currentRoute === rt) window.navigate('dashboard', proj.id);
     } else {
        link.style.display = 'flex';
     }
  });
};


// Global Client & Role State
window.activeClient = 'All';
window.activeRole = 'designer'; // 'designer' or 'client'

// Live Data Store (Hydrated from Supabase)
window.appData = {
  trash: [],
  reviews: [
    {
      id: 'rev-1',
      projectId: 'p-1',
      title: 'Brand Anthem Final',
      type: 'motion',
      client: 'Acme Corp',
      designer: 'You',
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      messages: [
        { sender: 'You', text: 'Hey Sarah, please review the latest cut.', time: '10:00 AM' }
      ]
    }
  ],
  projects: [
    {
      id: 'p-1',
      title: 'Brand Anthem',
      client: 'Acme Corp',
      last_updated: new Date().toISOString(),
      data: {
        moodboard: [
          { id: 'el-1', type: 'image', x: 100, y: 100, width: 300, content: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop' },
          { id: 'el-2', type: 'palette', x: 500, y: 150, width: 200, colors: ['#1E293B', '#3B82F6', '#F97316', '#F8FAFC'] }
        ],
        tasks: [
          { id: 't1', title: 'Gather typo motion references', tag: 'Research', col: 'todo', client: 'Acme Corp', attachments: 2, assignee: 'Me', priority: 'Medium', deadline: '2024-03-20' },
          { id: 't2', title: 'Approve initial moodboard direction', tag: 'Presentation', col: 'review', client: 'Globex', attachments: 0, assignee: 'Client', priority: 'High', deadline: '2024-03-10' }
        ]
      }
    },
    {
      id: 'p-2',
      title: 'Social Media Campaign',
      client: 'Globex',
      last_updated: new Date().toISOString(),
      data: {}
    }
  ],
  activity: [
    { id: 'a1', user: 'Designer', action: 'Created project', target: 'Brand Anthem', time: '1h ago' },
    { id: 'a2', user: 'Client', action: 'Approved moodboard', target: 'Social Media Campaign', time: '2h ago' }
  ],
  notifications: [
    { id: 1, title: 'New Review on Acme Corp', time: '5m ago', read: false, link: 'reviews' },
    { id: 2, title: 'Asset added to Moodboard', time: '1h ago', read: false, link: 'moodboard' },
    { id: 3, title: 'Client approved Style Frames', time: '2h ago', read: true, link: 'styleframes' }
  ],
  library: [
    { id: 'lib1', title: 'Fintech UI Patterns', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop', tags: ['UI', 'Motion'], client: 'Globex', type: 'Image' },
    { id: 'lib2', title: 'Abstract 3D Shape', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', tags: ['3D'], client: 'Acme Corp', type: 'Image' }
  ]
};

window.logActivity = function(action, target) {
  const actId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'a' + Date.now();
  const payload = {
    id: actId,
    user_name: window.activeRole === 'client' ? 'Client' : 'Designer',
    action: action,
    target: target
  };

  // Optimistic UI
  window.appData.activity.unshift({
    id: payload.id,
    user: payload.user_name,
    action: payload.action,
    target: payload.target,
    time: 'Just now'
  });
  
  if(window.appData.activity.length > 20) window.appData.activity.pop();

  // Supabase Push
  if(window.dbInsert) window.dbInsert('activity', payload);
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

function updateRoleUI() {
  if(window.activeRole === 'designer') {
    roleBtnDesigner.className = 'px-3 py-1 text-xs font-bold rounded-md bg-white text-gray-800 shadow-sm smooth-transition';
    roleBtnClient.className = 'px-3 py-1 text-xs font-bold rounded-md text-gray-500 hover:text-gray-800 smooth-transition';
    document.body.classList.remove('role-client');
  } else {
    roleBtnClient.className = 'px-3 py-1 text-xs font-bold rounded-md bg-white text-gray-800 shadow-sm smooth-transition';
    roleBtnDesigner.className = 'px-3 py-1 text-xs font-bold rounded-md text-gray-500 hover:text-gray-800 smooth-transition';
    document.body.classList.add('role-client');
  }
  window.updateBadges();
  window.updateNavVisibility();
  navigate(currentRoute, window.currentProject); // Refresh view
}

if(roleBtnDesigner && roleBtnClient) {
  roleBtnDesigner.addEventListener('click', () => { window.activeRole = 'designer'; updateRoleUI(); });
  roleBtnClient.addEventListener('click', () => { window.activeRole = 'client'; updateRoleUI(); });
}

// Client Selector Logic
const clientSelect = document.getElementById('global-client-select');
if(clientSelect) {
  clientSelect.addEventListener('change', (e) => {
    window.activeClient = e.target.value;
    if(window.showToast) window.showToast(`Filtering view for: ${window.activeClient}`);
    // Re-render current route to apply filter
    navigate(currentRoute, window.currentProject);
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
     if(window.activeRole === 'client') return; // Designers only
     const proj = window.appData.projects.find(p => p.id === window.currentProject) || window.appData.projects[0];
     if(!proj) return;
     
     if(!proj.data.clientPermissions) {
        proj.data.clientPermissions = { library: false, moodboard: false, styleframes: true, script: true, kanban: true, reviews: true, motionprojects: true };
     }
     
     const perms = proj.data.clientPermissions;
     
     const labels = {
        library: 'Media Library',
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
             <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B2B]"></div>
           </label>
        </div>
     `).join('');

     // Bind toggle changes
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

// Initialize Badges
window.updateBadges();

// Boot application by syncing with Supabase
window.bootApp = async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const magicToken = urlParams.get('magic');

  if (window.supabaseClient) {
    const appEl = document.getElementById('app');
    appEl.innerHTML = '<div class="w-full h-full flex items-center justify-center flex-col text-brand"><div class="w-10 h-10 border-4 border-brand border-t-transparent animate-spin rounded-full mb-4"></div><p class="font-bold text-sm tracking-widest uppercase text-gray-400">Syncing with Supabase Database...</p></div>';
    
    // Magic Link Intercept
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
                setTimeout(() => window.showToast(`Welcome back, ${window.activeClient}!`, 'success'), 1000);
             } else {
                setTimeout(() => window.showToast('This link has expired, please contact your designer for a new link.', 'error'), 1000);
             }
          }
       } catch (e) {
          console.warn('Magic link validation failed or table missing.', e);
       }
    }

    try {
      const [projRes, revRes, actRes, trashRes, libRes] = await Promise.all([
        window.supabaseClient.from('projects').select('*').order('last_updated', { ascending: false }),
        window.supabaseClient.from('reviews').select('*'),
        window.supabaseClient.from('activity').select('*').order('created_at', { ascending: false }).limit(20),
        window.supabaseClient.from('trash').select('*').order('deleted_at', { ascending: false }),
        window.supabaseClient.from('library').select('*')
      ]);

      if (projRes.data && projRes.data.length > 0) window.appData.projects = projRes.data;
      if (revRes.data && revRes.data.length > 0) window.appData.reviews = revRes.data;
      if (actRes.data && actRes.data.length > 0) window.appData.activity = actRes.data;
      if (trashRes.data && trashRes.data.length > 0) window.appData.trash = trashRes.data;
      if (libRes.data && libRes.data.length > 0) window.appData.library = libRes.data;
      
    } catch(err) {
      console.error("Supabase boot sync failed:", err);
      if(window.showToast) window.showToast('Failed to load from database. Using local placeholder data!', 'error');
    }

    window.updateBadges();
    window.updateNavVisibility();
    navigate('dashboard', magicBypassTargetId);
  } else {
    window.updateBadges();
    window.updateNavVisibility();
    navigate('dashboard');
  }
};

// Start Boot
window.bootApp();

// Global Toast Notifications
// Global Toast Notifications (Enhanced)
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
    success: 'bg-white text-gray-800 border-l-4 border-green-500',
    error: 'bg-white text-gray-800 border-l-4 border-red-500',
    info: 'bg-white text-gray-800 border-l-4 border-brand',
    warning: 'bg-white text-gray-800 border-l-4 border-yellow-500'
  };
  
  const icons = {
    success: '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
    error: '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    info: '<svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    warning: '<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
  };

  toast.className = `${colors[type] || colors.info} px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] smooth-transition transform translate-x-full opacity-0 flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-gray-100 min-w-[320px] pointer-events-auto cursor-pointer pointer-events-auto`;
  toast.innerHTML = `
    <div class="flex-shrink-0">${icons[type] || icons.info}</div>
    <div class="flex-grow">
      <p class="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">${type}</p>
      <p class="font-bold text-sm text-gray-800">${message}</p>
    </div>
  `;
  
  toast.onclick = () => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  };

  toastContainer.appendChild(toast);

  // animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 10);

  // animate out
  const timeout = setTimeout(() => {
    if(toast.parentNode) {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// Global Theme Logic
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('theme-icon-sun');
const moonIcon = document.getElementById('theme-icon-moon');

function updateThemeUI(isDark) {
  if(isDark) {
    document.documentElement.classList.add('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

let isDarkMode = localStorage.getItem('theme') === 'dark';
updateThemeUI(isDarkMode);

if(themeToggle) {
  themeToggle.onclick = () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeUI(isDarkMode);
    window.showToast(`Switched to ${isDarkMode ? 'Dark' : 'Light'} Mode`, 'info');
  };
}

// Global Demo Simulation
window.setTimeout(() => {
  window.showToast('Client "Acme Corp" approved your moodboard!', 'success');
}, 2000);

// Global Voice Note Helper
window.startVoiceRecord = async function(onStopCallback) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

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

const timeAgo = (date) => {
  if (!date) return "recently";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "just now";
};

window.initDashboard = function(container, socket) {
  const isClient = window.activeRole === 'client';
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isClient) {
    renderClientDashboard(container);
  } else {
    renderDesignerDashboard(container);
  }

  // Keyboard Scrolling
  if (!window.__dashboardScrollInitialized) {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
      
      const app = document.getElementById('app');
      if (!app) return;
      
      const scrollAmount = 300;
      if (e.key === 'ArrowDown') {
        app.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        app.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      }
    });
    window.__dashboardScrollInitialized = true;
  }
  // Cleanup listener when view changes (simple version: overwrite window logic or use a global flag)
  // For now, we'll keep it simple as the whole script re-runs on init.

  function renderDesignerDashboard(container) {
    let rawProjects = window.activeClient === 'All' 
      ? window.appData.projects 
      : window.appData.projects.filter(p => p.client === window.activeClient);
      
    const filteredProjects = rawProjects.map(p => ({ ...p, status: p.status || 'In Progress' }));

    const stats = {
      active: filteredProjects.length,
      pending: filteredProjects.filter(p => ['In Review', 'Pending Review', 'Needs Your Review'].includes(p.status)).length,
      completed: filteredProjects.filter(p => p.status === 'Approved').length,
      collabs: window.appData.projects.length
    };

    const currentFilter = window._dashboardFilter || 'All';
    const displayProjects = currentFilter === 'All' 
      ? filteredProjects 
      : filteredProjects.filter(p => p.type === currentFilter.toLowerCase().replace(' ', '_'));

    container.innerHTML = `
      <div class="view-container w-full max-w-7xl mx-auto p-6 md:p-12 pb-24">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 class="text-3xl font-bold text-text-dark tracking-tight mb-1">Home</h1>
            <p class="text-text-muted text-sm font-medium">Manage your workspace and projects</p>
          </div>
          <button onclick="window.showCreateModal()" class="bg-brand hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-xl smooth-transition shadow-lg shadow-brand/20 flex items-center gap-2 text-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            New Project
          </button>
        </header>

        <!-- Stats Overview -->
        ${rawProjects.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Active Projects</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.active}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Awaiting Review</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.pending}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Completed</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.completed}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Collaborators</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.collabs}</h3>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2 mb-10">
          ${['All', 'Moodboard', 'Script', 'Review', 'Motion Project', 'Style Frames', 'Task Tracker'].map(f => `
            <button onclick="window.filterDashboard('${f}')" class="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === f ? 'bg-brand text-white shadow-md' : 'bg-white border border-border-light text-text-muted hover:border-brand/40'}">${f === 'Motion Project' ? 'Motion' : (f === 'Style Frames' ? 'Style' : (f === 'Task Tracker' ? 'Tasks' : f))}</button>
          `).join('')}
        </div>
        ` : ''}

        <div class="grid grid-cols-1 gap-12">
          <!-- Projects List -->
          <div class="space-y-8">
            ${rawProjects.length > 0 ? `
            <h2 class="text-[11px] font-black text-text-dark uppercase tracking-widest flex items-center gap-2">
              My Workspace
              <span class="bg-gray-100 text-text-muted text-[10px] px-2 py-0.5 rounded-full font-bold">${displayProjects.length}</span>
            </h2>
            ` : ''}

            ${displayProjects.length === 0 ? `
              <div class="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-border-light rounded-3xl bg-gray-50/30">
                 <div class="w-20 h-20 bg-white shadow-subtle rounded-3xl flex items-center justify-center text-gray-200 mb-6">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                 </div>
                 <h3 class="text-xl font-bold text-text-dark mb-1">No projects found</h3>
                 <p class="text-sm text-text-muted font-medium mb-8">Start your next creative journey by creating a project.</p>
                 <button onclick="window.showCreateModal()" class="px-8 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition">Create Your First Project</button>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${displayProjects.map(p => {
                  const typeConfig = {
                    moodboard: { label: 'Moodboard', icon: '<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>', bg: 'bg-purple-50', text: 'text-purple-500' },
                    script: { label: 'Script', icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>', bg: 'bg-green-50', text: 'text-green-500' },
                    review: { label: 'Review', icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>', bg: 'bg-red-50', text: 'text-red-500' },
                    task_tracker: { label: 'Tasks', icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>', bg: 'bg-teal-50', text: 'text-teal-500' },
                    motion_project: { label: 'Motion', icon: '<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>', bg: 'bg-orange-50', text: 'text-orange-500' },
                    style_frames: { label: 'Frames', icon: '<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>', bg: 'bg-blue-50', text: 'text-blue-500' }
                  };
                  const config = typeConfig[p.type] || typeConfig.moodboard;
                  
                  return `
                  <div class="group bg-white border border-border-light rounded-[32px] p-8 shadow-subtle hover:shadow-card hover:border-brand/20 transition-all cursor-pointer relative" id="card-${p.id}" onclick="window.navigate('${p.type}', '${p.id}')">
                    <div class="flex justify-between items-start mb-6">
                      <div class="w-12 h-12 ${config.bg} ${config.text} rounded-2xl flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${config.icon}</svg>
                      </div>
                      <div class="relative project-menu-container">
                        <button onclick="event.stopPropagation(); window.toggleProjectMenu('${p.id}')" class="p-2 hover:bg-gray-50 rounded-xl text-gray-300 hover:text-text-dark transition-colors">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                        </button>
                        <div id="menu-${p.id}" class="hidden absolute right-0 mt-2 w-48 bg-white border border-border-light rounded-2xl shadow-floating z-50 py-2 animate-scale-in">
                           <button onclick="window.navigate('${p.type}', '${p.id}')" class="w-full text-left px-4 py-2 text-xs font-bold text-text-dark hover:bg-gray-50">Open</button>
                           <button onclick="window.startRename('${p.id}')" class="w-full text-left px-4 py-2 text-xs font-bold text-text-dark hover:bg-gray-50">Rename</button>
                           <button onclick="window.confirmDeleteProject('${p.id}')" class="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Delete</button>
                        </div>
                      </div>
                    </div>
                    
                    <div class="mb-6">
                      <h3 class="text-xl font-bold text-text-dark mb-2" id="title-display-${p.id}">${p.title}</h3>
                      <input type="text" id="title-edit-${p.id}" class="hidden w-full text-xl font-bold border-b border-brand outline-none pb-1" value="${p.title}" onclick="event.stopPropagation()">
                      
                      <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        <span class="text-text-muted opacity-60">${p.client || 'Personal'}</span>
                        <span class="text-gray-300">•</span>
                        <span class="${p.status === 'Approved' ? 'text-blue-500' : (p.status === 'In Progress' ? 'text-green-500' : 'text-purple-500')}">${p.status || 'Draft'}</span>
                      </div>
                    </div>

                    <p class="text-[11px] font-bold text-text-muted opacity-40">Edited ${p.updated_at ? timeAgo(p.updated_at) : 'recently'}</p>

                    <!-- Deletion Overlay -->
                    <div id="delete-confirm-${p.id}" class="hidden absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[32px] z-[60] flex flex-col items-center justify-center p-8 text-center" onclick="event.stopPropagation()">
                       <h4 class="text-base font-bold text-text-dark mb-2">Delete Project?</h4>
                       <div class="flex gap-2 w-full mt-4">
                          <button onclick="window.deleteProject('${p.id}')" class="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase">Delete</button>
                          <button onclick="window.cancelDeleteProject('${p.id}')" class="flex-1 py-3 bg-gray-100 text-text-muted rounded-2xl text-[10px] font-black uppercase">No</button>
                       </div>
                    </div>
                  </div>
                `}).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderClientDashboard(container) {
    const filteredProjects = window.activeClient !== 'All' 
       ? window.appData.projects.filter(p => p.client === window.activeClient)
       : window.appData.projects;

    const stats = {
      active: filteredProjects.length,
      pending: filteredProjects.filter(p => ['In Review', 'Pending Review', 'Needs Your Review'].includes(p.status) || !p.status || p.status === 'In Progress').length,
      completed: filteredProjects.filter(p => p.status === 'Approved').length,
      collabs: filteredProjects.length
    };

    container.innerHTML = `
      <div class="view-container w-full max-w-7xl mx-auto p-6 md:p-12 pb-24">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 class="text-3xl font-bold text-text-dark tracking-tight mb-1">Home</h1>
            <p class="text-text-muted text-sm font-medium">Manage your workspace and projects</p>
          </div>
        </header>

        <!-- Stats Overview -->
        ${filteredProjects.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Active Projects</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.active}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Awaiting Review</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.pending}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Completed</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.completed}</h3>
          </div>
          <div class="bg-white p-8 rounded-[24px] border border-border-light shadow-subtle hover:shadow-subtle-lg transition-shadow">
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Collaborators</p>
            <h3 class="text-4xl font-bold text-text-dark tracking-tighter">${stats.collabs}</h3>
          </div>
        </div>
        ` : ''}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          ${filteredProjects.length === 0 ? `
            <div class="lg:col-span-4 py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-border-light rounded-[32px] bg-gray-50/30">
               <svg class="w-12 h-12 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
               <h3 class="text-lg font-bold text-text-dark mb-1">No shared projects</h3>
               <p class="text-xs text-text-muted font-medium max-w-sm">Projects shared by your designer will appear here.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              ${filteredProjects.map(p => {
                const typeConfig = {
                  moodboard: { label: 'Moodboard', icon: '<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>', bg: 'bg-purple-50', text: 'text-purple-500' },
                  script: { label: 'Script', icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>', bg: 'bg-green-50', text: 'text-green-500' },
                  review: { label: 'Review', icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>', bg: 'bg-red-50', text: 'text-red-500' },
                  task_tracker: { label: 'Tasks', icon: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>', bg: 'bg-teal-50', text: 'text-teal-500' },
                  motion_project: { label: 'Motion', icon: '<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>', bg: 'bg-orange-50', text: 'text-orange-500' },
                  style_frames: { label: 'Frames', icon: '<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>', bg: 'bg-blue-50', text: 'text-blue-500' }
                };
                const config = typeConfig[p.type] || typeConfig.moodboard;

                return `
                <div class="group bg-white border border-border-light rounded-[32px] p-8 shadow-subtle hover:shadow-card hover:border-brand/20 transition-all cursor-pointer relative" onclick="window.navigate('${p.type}', '${p.id}')">
                   <div class="flex justify-between items-start mb-6">
                      <div class="w-12 h-12 ${config.bg} ${config.text} rounded-2xl flex items-center justify-center">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${config.icon}</svg>
                      </div>
                      <span class="badge ${p.status === 'Approved' ? 'badge-green' : 'badge-purple'}">${p.status || 'In Progress'}</span>
                   </div>
                   
                   <div class="mb-6">
                      <h3 class="text-xl font-bold text-text-dark mb-2">${p.title}</h3>
                      <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
                        <span>Edited ${timeAgo(p.updated_at || p.last_updated)}</span>
                      </div>
                   </div>
                </div>
                `;
              }).join('')}
            </div>
          `}

        </div>
      </div>
    `;
  }
}

window.showCreateModal = async function() {
  if (window.activeRole === 'client') return; 

  // Fetch clients from Supabase
  let clients = [];
  try {
    const { data } = await window.supabaseClient.from('clients').select('id, name');
    clients = data || [];
  } catch (err) { console.error('Failed to fetch clients', err); }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text-dark/60 backdrop-blur-md animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden transform scale-95 transition-all flex flex-col max-h-[90vh]">
      <div class="p-10 border-b border-border-light flex justify-between items-center shrink-0">
        <div>
           <h2 class="text-3xl font-bold text-text-dark tracking-tight">Create Project</h2>
           <p class="text-sm text-text-muted font-medium mt-1">Plan. Manage. Execute.</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-full border border-border-light flex items-center justify-center text-gray-400 hover:text-text-dark hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="p-10 overflow-y-auto space-y-10 custom-scrollbar">
        <!-- Title -->
        <div>
          <label class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Project Title</label>
          <input type="text" id="new-p-title" placeholder="E.g. Brand Anthem 2024" class="w-full px-7 py-5 rounded-3xl border border-border-light focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none smooth-transition text-base text-text-dark font-bold bg-gray-50/50">
        </div>

        <!-- Client -->
        <div>
          <label class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Select Client <span class="opacity-40 italic">(Optional)</span></label>
          <select id="new-p-client" class="w-full px-7 py-5 rounded-3xl border border-border-light focus:border-brand outline-none smooth-transition text-base text-text-dark font-bold bg-gray-50/50 appearance-none">
            <option value="">Select a client</option>
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>

        <!-- Types -->
        <div>
          <label class="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">Board Type</label>
          <div class="grid grid-cols-2 gap-4" id="type-selector">
             ${[
               { id: 'moodboard', title: 'Moodboard', desc: 'Collect visual references and assets', icon: '<path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' },
               { id: 'task_tracker', title: 'Task Tracker', desc: 'Manage tasks and project to-dos', icon: '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
               { id: 'script', title: 'Script', desc: 'Write or upload your project script', icon: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>' },
               { id: 'review', title: 'Review', desc: 'Share work and collect feedback', icon: '<path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>' },
               { id: 'motion_project', title: 'Motion Project', desc: 'Plan and organise motion or video work', icon: '<path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' },
               { id: 'style_frames', title: 'Style Frames', desc: 'Build out visual style and frame references', icon: '<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>' }
             ].map(t => `
               <button onclick="window.selectProjectType('${t.id}')" id="type-btn-${t.id}" class="project-type-btn p-6 border-2 border-border-light rounded-[32px] flex flex-col items-start gap-4 hover:border-brand/40 smooth-transition text-left group ${t.id === 'moodboard' ? 'border-brand bg-brand/5 active-type' : ''}" data-type="${t.id}">
                  <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-text-muted group-hover:bg-brand/10 group-hover:text-brand transition-colors type-icon-box">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${t.icon}</svg>
                  </div>
                  <div>
                    <span class="block text-xs font-black uppercase tracking-widest text-text-dark mb-1">${t.title}</span>
                    <span class="block text-[10px] text-text-muted font-medium leading-relaxed">${t.desc}</span>
                  </div>
               </button>
             `).join('')}
          </div>
        </div>
      </div>

      <div class="p-8 bg-gray-50/50 border-t border-border-light flex gap-4 shrink-0">
        <button onclick="this.closest('.fixed').remove()" class="flex-1 px-6 py-5 rounded-3xl font-bold text-xs text-gray-400 hover:text-text-dark transition uppercase tracking-widest">Cancel</button>
        <button id="confirm-create" class="flex-1 px-6 py-5 rounded-3xl font-black text-xs uppercase tracking-widest bg-brand text-white hover:opacity-90 shadow-xl shadow-brand/20 transition-all transform active:scale-95">Create Project</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.firstElementChild.classList.remove('scale-95'), 10);

  window.selectProjectType = (typeId) => {
    document.querySelectorAll('.project-type-btn').forEach(b => {
      b.classList.remove('border-brand', 'bg-brand/5', 'active-type');
      b.querySelector('.type-icon-box').classList.remove('bg-brand/10', 'text-brand');
    });
    const btn = document.getElementById(`type-btn-${typeId}`);
    btn.classList.add('border-brand', 'bg-brand/5', 'active-type');
    btn.querySelector('.type-icon-box').classList.add('bg-brand/10', 'text-brand');
  };

  document.getElementById('confirm-create').onclick = async () => {
    const titleInput = document.getElementById('new-p-title');
    const title = titleInput.value.trim();
    const clientId = document.getElementById('new-p-client').value || null;
    const type = modal.querySelector('.active-type')?.dataset.type || 'moodboard';

    if(!title) {
      titleInput.classList.add('border-red-500', 'ring-4', 'ring-red-500/5');
      titleInput.placeholder = "Please enter a project title";
      titleInput.focus();
      return;
    }

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const newProjectId = crypto.randomUUID();
    
    const clientName = clients.find(c => c.id === clientId)?.name || null;

    const newProject = {
      id: newProjectId,
      user_id: user.id,
      title: title,
      client_id: clientId,
      type: type,
      updated_at: new Date().toISOString()
    };

    try {
      if(window.dbInsert) {
        await window.dbInsert('projects', newProject);
        
        // Optimistic local update
        window.appData.projects.unshift({
           ...newProject,
           client: clientName, // For backward compatibility in rendering
           last_updated: newProject.updated_at
        });

        window.showToast(`Project created: ${title}`, 'success');
        modal.remove();
        window.navigate(type, newProjectId);
      }
    } catch (err) {
      console.error(err);
      window.showToast('Failed to create project', 'error');
    }
  };
};

// Layout & Menu Handlers
window.filterDashboard = function(filter) {
  window._dashboardFilter = filter;
  window.initDashboard(document.getElementById('app'), null);
};

window.toggleProjectMenu = function(id) {
  const menu = document.getElementById(`menu-${id}`);
  const isHidden = menu.classList.contains('hidden');
  document.querySelectorAll('[id^="menu-"]').forEach(m => m.classList.add('hidden'));
  if (isHidden) menu.classList.remove('hidden');
  
  const closeMenu = (e) => {
    if (!e.target.closest('.project-menu-container')) {
      menu.classList.add('hidden');
      document.removeEventListener('click', closeMenu);
    }
  };
  document.addEventListener('click', closeMenu);
};

window.startRename = function(id) {
  const display = document.getElementById(`title-display-${id}`);
  const edit = document.getElementById(`title-edit-${id}`);
  display.classList.add('hidden');
  edit.classList.remove('hidden');
  edit.focus();
  edit.select();
  
  edit.onblur = async () => {
    const newTitle = edit.value.trim();
    if (newTitle && newTitle !== display.textContent) {
      display.textContent = newTitle;
      const project = window.appData.projects.find(p => p.id === id);
      if (project) project.title = newTitle;
      if (window.dbUpdate) await window.dbUpdate('projects', id, { title: newTitle });
    }
    display.classList.remove('hidden');
    edit.classList.add('hidden');
  };
  
  edit.onkeydown = (e) => {
    if (e.key === 'Enter') edit.blur();
    if (e.key === 'Escape') {
      edit.value = display.textContent;
      edit.blur();
    }
  };
};

window.duplicateProject = async function(id) {
  const source = window.appData.projects.find(p => p.id === id);
  if (!source) return;
  
  const newId = crypto.randomUUID();
  const copy = {
     ...source,
     id: newId,
     title: `Copy of ${source.title}`,
     updated_at: new Date().toISOString()
  };
  delete copy.client; // Don't sync the helper field
  delete copy.last_updated;

  try {
    if(window.dbInsert) {
      await window.dbInsert('projects', copy);
      window.appData.projects.unshift({ ...copy, client: source.client, last_updated: copy.updated_at });
      window.initDashboard(document.getElementById('app'), null);
      window.showToast('Project duplicated');
    }
  } catch (err) { window.showToast('Duplication failed', 'error'); }
};

window.confirmDeleteProject = function(id) {
  document.getElementById(`delete-confirm-${id}`).classList.remove('hidden');
};

window.cancelDeleteProject = function(id) {
  document.getElementById(`delete-confirm-${id}`).classList.add('hidden');
};

window.deleteProject = async function(id) {
  const card = document.getElementById(`card-${id}`);
  card.style.transform = 'scale(0.9) translateY(20px)';
  card.style.opacity = '0';
  
  setTimeout(async () => {
    try {
      if(window.dbDelete) {
        await window.dbDelete('projects', id);
        
        // Asset Cleanup: Delete files from storage
        const folderPath = `projects/${id}/`;
        const { data: files } = await window.supabaseClient.storage.from('assets').list(folderPath);
        if (files && files.length > 0) {
          await window.supabaseClient.storage.from('assets').remove(files.map(f => `${folderPath}${f.name}`));
        }

        window.appData.projects = window.appData.projects.filter(p => p.id !== id);
        card.remove();
        window.showToast('Project deleted', 'success');
        
        // If empty after delete, re-render for empty state
        if (window.appData.projects.length === 0) window.initDashboard(document.getElementById('app'), null);
      }
    } catch (err) { 
      window.showToast('Cleanup failed partially, project deleted.', 'warning'); 
      window.initDashboard(document.getElementById('app'), null);
    }
  }, 300);
};

window.showMagicLinkModal = function(projectId, projectTitle) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text-dark/40 backdrop-blur-sm';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-md shadow-subtle overflow-hidden transform scale-95 transition-all">
      <div class="p-8 border-b border-border-light flex justify-between items-center bg-gray-50/50">
        <div>
           <h2 class="text-xl font-bold text-text-dark tracking-tight">Share Access</h2>
           <p class="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">${projectTitle}</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-text-dark transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div id="magic-step-1" class="p-10 space-y-6">
        <div>
          <label class="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Client Name</label>
          <input type="text" id="magic-c-name" placeholder="E.g. John Doe" class="w-full px-5 py-4 rounded-2xl border border-border-light outline-none text-sm font-bold bg-gray-50/50 focus:border-brand smooth-transition">
        </div>
        
        <button id="generate-magic-btn" class="w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-brand text-white shadow-lg shadow-brand/20 hover:opacity-90 transition flex items-center justify-center gap-3">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
           Generate Invite Link
        </button>
      </div>

      <div id="magic-step-2" class="p-10 hidden flex-col items-center">
         <div class="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
         </div>
         <h3 class="text-lg font-bold text-text-dark mb-2">Link Generated!</h3>
         <p class="text-xs text-text-muted text-center mb-8">Anyone with this link can view and collaborate on the board.</p>
         
         <div class="w-full flex items-center bg-gray-50/50 border border-border-light rounded-2xl p-2 mb-8">
            <input type="text" id="magic-result-link" class="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 font-mono px-4 truncate" readonly>
            <button id="copy-magic-btn" class="bg-white border border-border-light px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition shadow-sm">Copy</button>
         </div>

         <div class="grid grid-cols-2 gap-4 w-full">
            <button onclick="this.closest('.fixed').remove()" class="py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 hover:text-text-dark transition text-xs uppercase tracking-widest">Close</button>
            <button id="wa-magic-btn" class="py-4 rounded-2xl font-bold text-white bg-[#25D366] hover:bg-[#20BE5C] transition text-xs flex items-center justify-center gap-2 uppercase tracking-widest">WhatsApp</button>
         </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  setTimeout(() => modal.firstElementChild.classList.remove('scale-95'), 10);

  const btnGen = document.getElementById('generate-magic-btn');
  btnGen.onclick = async () => {
     const cName = document.getElementById('magic-c-name').value;
     if (!cName) { window.showToast('Please enter the client name.', 'error'); return; }

     const magicToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
     const baseUrl = window.location.origin + window.location.pathname;
     const finalLink = `${baseUrl}?magic=${magicToken}`;
     
     document.getElementById('magic-step-1').classList.add('hidden');
     document.getElementById('magic-step-2').classList.remove('hidden');
     document.getElementById('magic-step-2').classList.add('flex');
     
     document.getElementById('magic-result-link').value = finalLink;
     document.getElementById('copy-magic-btn').onclick = () => {
        navigator.clipboard.writeText(finalLink);
        window.showToast('Link copied to clipboard!');
     };
  };
};

window.changeThumbnail = async function(projectId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    window.openCropper(file, async (croppedBlob) => {
        await uploadThumbnail(projectId, croppedBlob);
    });
  };

  input.click();
};

window.openCropper = function(file, onCrop) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[10001] flex flex-col bg-black/95 backdrop-blur-md animate-fade-in';
        modal.innerHTML = `
            <div class="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                <h3 class="text-white font-bold text-sm tracking-tight uppercase">Crop Thumbnail (16:9)</h3>
                <div class="flex gap-3">
                    <button id="crop-cancel" class="px-5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition">Cancel</button>
                    <button id="crop-confirm" class="px-6 py-2 bg-brand text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/20 hover:scale-105 transition-all">Apply Crop</button>
                </div>
            </div>
            <div class="flex-1 overflow-hidden flex items-center justify-center p-8 md:p-12">
                <img id="cropper-img" src="${e.target.result}" class="max-w-full max-h-full opacity-0 transition-opacity duration-300">
            </div>
        `;
        document.body.appendChild(modal);

        const img = document.getElementById('cropper-img');
        let cropper = null;

        img.onload = () => {
            img.classList.remove('opacity-0');
            cropper = new Cropper(img, {
                aspectRatio: 16 / 9,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };

        document.getElementById('crop-cancel').onclick = () => {
            if (cropper) cropper.destroy();
            modal.remove();
        };

        document.getElementById('crop-confirm').onclick = () => {
            if (!cropper) return;
            const canvas = cropper.getCroppedCanvas({
                width: 1280,
                height: 720,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });
            
            canvas.toBlob((blob) => {
                onCrop(blob);
                cropper.destroy();
                modal.remove();
            }, 'image/jpeg', 0.9);
        };
    };
    reader.readAsDataURL(file);
};

async function uploadThumbnail(projectId, blob) {
    window.showToast('Verifying storage bucket...', 'info');

    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const fileName = `${projectId}/${Date.now()}.jpg`;
        const filePath = `project-covers/${fileName}`;

        // Proactively find which bucket exists
        let activeBucket = 'thumbnails';
        const { data: bucketInfo, error: bucketError } = await window.supabaseClient.storage.getBucket('thumbnails');

        if (bucketError || !bucketInfo) {
            console.warn('Bucket "thumbnails" not found, checking "thumbnail"...');
            const { data: b2, error: e2 } = await window.supabaseClient.storage.getBucket('thumbnail');
            if (e2 || !b2) {
                const msg = 'Storage Error: No "thumbnails" bucket found in your Supabase project. Please create one and set it to Public.';
                console.error(msg);
                const url = prompt(`${msg}\n\nAlternatively, enter a direct image URL:`);
                if (url) updateDB(projectId, url);
                return;
            }
            activeBucket = 'thumbnail';
        }

        window.showToast(`Uploading to ${activeBucket}...`, 'info');
        const { data, error } = await window.supabaseClient.storage
            .from(activeBucket)
            .upload(filePath, blob, { contentType: 'image/jpeg', cacheControl: '3600', upsert: true });

        if (error) {
            console.error('Upload Error:', error);
            if (error.status === 403) {
                alert('Permission Denied (403): You MUST add RLS Policies to your bucket in Supabase (Storage -> Policies).');
            } else {
                const url = prompt(`Upload failed (${error.message}). Enter image URL:`);
                if (url) updateDB(projectId, url);
            }
            return;
        }

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from(activeBucket)
            .getPublicUrl(filePath);

        updateDB(projectId, publicUrl);
    } catch (err) {
        console.error(err);
        window.showToast('Storage process failed.', 'error');
        const url = prompt('Please enter an image URL:');
        if (url) updateDB(projectId, url);
    }
}

async function updateDB(projectId, url) {
    if (window.dbUpdate) {
        await window.dbUpdate('projects', projectId, { cover: url });
        
        // Update local appData
        if(window.appData && window.appData.projects) {
            const project = window.appData.projects.find(p => p.id === projectId);
            if (project) project.cover = url;
        }
        
        const img = document.getElementById(`cover-${projectId}`);
        if (img) img.src = url;
        
        window.showToast('Thumbnail updated!');
    }
}

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
    };

    const currentFilter = window._dashboardFilter || 'All';
    const displayProjects = currentFilter === 'All' 
      ? filteredProjects 
      : filteredProjects.filter(p => p.type === currentFilter.toLowerCase().replace(' ', '_'));

    container.innerHTML = `
      <div class="view-container w-full max-w-7xl mx-auto p-6 pb-24">
        <!-- Dashboard Header -->
        <header class="mb-8">
          <h1 class="text-3xl font-black text-text-dark tracking-tight mb-1">Projects Dashboard</h1>
          <p class="text-text-muted text-sm font-medium">Welcome back! Here's what's happening.</p>
        </header>

        <!-- Horizontal Tasks Scroll (Tasks Progress) -->
        <section class="mb-10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-[11px] font-black text-text-dark uppercase tracking-widest">Tasks Progress</h2>
            <button onclick="window.navigate('kanban')" class="text-[10px] font-bold text-primary uppercase tracking-wider">View All</button>
          </div>
          <div class="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-6 px-6">
            ${[
              { title: 'Moodboard Review', project: 'Nike Spring', status: 'Due Today', color: 'bg-primary/10 text-primary' },
              { title: 'Script Draft', project: 'Apple Vision', status: 'In Progress', color: 'bg-blue-50 text-blue-500' },
              { title: 'Style Frames', project: 'Tesla X', status: 'Pending', color: 'bg-orange-50 text-orange-500' }
            ].map(task => `
              <div class="bento-card min-w-[200px] p-5 shrink-0">
                <span class="inline-block px-2 py-1 rounded-lg ${task.color} text-[8px] font-black uppercase tracking-wider mb-3">${task.status}</span>
                <h4 class="font-bold text-sm text-text-dark mb-1">${task.title}</h4>
                <p class="text-[10px] text-text-muted font-medium">${task.project}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Projects Grid -->
        <section class="mb-10">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-[11px] font-black text-text-dark uppercase tracking-widest">My Workspace (${displayProjects.length})</h2>
            <button onclick="window.showCreateModal()" class="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>

          <div class="flex flex-wrap gap-2 mb-6">
            ${['All', 'Moodboard', 'Script', 'Review', 'Motion'].map(f => `
              <button onclick="window.filterDashboard('${f}')" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === f ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-text-muted'}">${f}</button>
            `).join('')}
          </div>

          <div class="grid grid-cols-1 gap-6">
            ${displayProjects.length === 0 ? `
              <div class="py-16 text-center bento-card border-dashed">
                 <p class="text-sm text-text-muted font-medium">No projects found. Create your first board!</p>
              </div>
            ` : displayProjects.map(p => {
              const typeConfig = {
                moodboard: { icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z', color: 'text-purple-500 bg-purple-50' },
                script: { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-blue-500 bg-blue-50' },
                review: { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-green-500 bg-green-50' }
              };
              const config = typeConfig[p.type] || typeConfig.moodboard;
              return `
                <div class="bento-card p-6 flex gap-5 items-center relative" onclick="window.navigate('${p.type}', '${p.id}')">
                   <div class="w-14 h-14 ${config.color} rounded-2xl flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.icon}"></path></svg>
                   </div>
                   <div class="flex-1 min-w-0">
                      <h3 class="font-black text-text-dark text-lg truncate mb-1">${p.title}</h3>
                      <div class="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                         <span>${p.client || 'Personal'}</span>
                         <span>•</span>
                         <span class="text-primary">${p.status || 'In Progress'}</span>
                      </div>
                   </div>
                   <button onclick="event.stopPropagation(); window.toggleProjectMenu('${p.id}')" class="p-2 text-gray-300">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                   </button>
                   <div id="menu-${p.id}" class="hidden absolute right-6 top-16 w-32 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                      <button onclick="window.startRename('${p.id}')" class="w-full text-left px-4 py-2 text-[10px] font-bold text-text-dark uppercase tracking-widest">Rename</button>
                      <button onclick="window.confirmDeleteProject('${p.id}')" class="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">Delete</button>
                   </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="mb-10">
          <h2 class="text-[11px] font-black text-text-dark uppercase tracking-widest mb-6">Recent Activity</h2>
          <div class="bento-card p-6 space-y-6">
            ${[
              { user: 'Alex', action: 'uploaded 4 style frames to', board: 'Cyberpunk 2077', time: '2h ago' },
              { user: 'Sarah', action: 'approved the script for', board: 'Nike Air', time: '5h ago' },
              { user: 'Mike', action: 'added a comment on', board: 'Tesla X', time: '1d ago' }
            ].map(act => `
              <div class="flex gap-4">
                 <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px] shrink-0">${act.user[0]}</div>
                 <div class="flex-1">
                    <p class="text-xs text-text-dark leading-snug">
                       <span class="font-bold">${act.user}</span> ${act.action} <span class="font-bold text-primary">${act.board}</span>
                    </p>
                    <span class="text-[9px] text-text-muted font-medium">${act.time}</span>
                 </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderClientDashboard(container) {
    const filteredProjects = window.activeClient !== 'All' 
       ? window.appData.projects.filter(p => p.client === window.activeClient)
       : window.appData.projects;

    container.innerHTML = `
      <div class="view-container w-full max-w-7xl mx-auto p-6 pb-24">
        <header class="mb-8">
          <h1 class="text-3xl font-black text-text-dark tracking-tight mb-1">Client Dashboard</h1>
          <p class="text-text-muted text-sm font-medium">Select a project to review progress.</p>
        </header>

        <div class="grid grid-cols-1 gap-6">
          ${filteredProjects.length === 0 ? `
            <div class="py-16 text-center bento-card border-dashed">
               <p class="text-sm text-text-muted font-medium">No projects shared with you yet.</p>
            </div>
          ` : filteredProjects.map(p => `
            <div class="bento-card p-6 flex gap-5 items-center" onclick="window.navigate('${p.type}', '${p.id}')">
               <div class="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               </div>
               <div class="flex-1 min-w-0">
                  <h3 class="font-black text-text-dark text-lg truncate mb-1">${p.title}</h3>
                  <div class="flex items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                     <span>${p.status || 'In Progress'}</span>
                     <span>•</span>
                     <span>Edited ${timeAgo(p.updated_at || p.last_updated)}</span>
                  </div>
               </div>
               <div class="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

}

window.showCreateModal = async function() {
  if (window.activeRole === 'client') return; 

  const overlay = document.getElementById('m-bottom-sheet-overlay');
  const sheet = document.getElementById('m-bottom-sheet');
  const content = document.getElementById('m-bottom-sheet-content');

  // Fetch clients
  let clients = [];
  try {
    const { data } = await window.supabaseClient.from('clients').select('id, name');
    clients = data || [];
  } catch (err) { console.error('Failed to fetch clients', err); }

  content.innerHTML = `
    <div class="space-y-8 animate-fade-in">
      <div>
         <h2 class="text-2xl font-black text-text-dark tracking-tight mb-1">Create Project</h2>
         <p class="text-xs text-text-muted font-medium">New board, new possibilities.</p>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Project Title</label>
          <input type="text" id="new-p-title" placeholder="Project Name" class="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none text-sm font-bold bg-gray-50/50 focus:border-primary">
        </div>

        <div>
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Board Type</label>
          <div class="grid grid-cols-2 gap-3" id="type-selector">
             ${[
               { id: 'moodboard', title: 'Moodboard', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14' },
               { id: 'task_tracker', title: 'Tasks', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
               { id: 'script', title: 'Script', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586' },
               { id: 'review', title: 'Review', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14' }
             ].map(t => `
               <button onclick="window.selectProjectType('${t.id}')" id="type-btn-${t.id}" class="project-type-btn p-4 border border-gray-100 rounded-2xl flex flex-col items-start gap-3 transition-all ${t.id === 'moodboard' ? 'border-primary bg-primary/5 active-type' : ''}" data-type="${t.id}">
                  <div class="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 type-icon">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${t.icon}"></path></svg>
                  </div>
                  <span class="text-[10px] font-black uppercase tracking-widest text-text-dark">${t.title}</span>
               </button>
             `).join('')}
          </div>
        </div>

        <button id="confirm-create" class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-xl shadow-primary/20">Create Project</button>
      </div>
    </div>
  `;

  // Show Bottom Sheet
  overlay.classList.remove('hidden');
  sheet.classList.remove('translate-y-full');

  const closeSheet = () => {
    overlay.classList.add('hidden');
    sheet.classList.add('translate-y-full');
  };

  overlay.onclick = closeSheet;

  window.selectProjectType = (typeId) => {
    document.querySelectorAll('.project-type-btn').forEach(b => {
      b.classList.remove('border-primary', 'bg-primary/5', 'active-type');
      b.querySelector('.type-icon').classList.add('text-gray-400');
      b.querySelector('.type-icon').classList.remove('text-primary');
    });
    const btn = document.getElementById(`type-btn-${typeId}`);
    btn.classList.add('border-primary', 'bg-primary/5', 'active-type');
    btn.querySelector('.type-icon').classList.remove('text-gray-400');
    btn.querySelector('.type-icon').classList.add('text-primary');
  };

  document.getElementById('confirm-create').onclick = async () => {
    const titleInput = document.getElementById('new-p-title');
    const title = titleInput.value.trim();
    const type = content.querySelector('.active-type')?.dataset.type || 'moodboard';

    if(!title) {
      titleInput.classList.add('border-red-500');
      titleInput.focus();
      return;
    }

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const newProjectId = crypto.randomUUID();
    
    const newProject = {
      id: newProjectId,
      user_id: user.id,
      title: title,
      type: type,
      updated_at: new Date().toISOString()
    };

    try {
      if(window.dbInsert) {
        await window.dbInsert('projects', newProject);
        window.appData.projects.unshift({ ...newProject, last_updated: newProject.updated_at });
        window.showToast(`Project created`, 'success');
        closeSheet();
        window.navigate(type, newProjectId);
      }
    } catch (err) {
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

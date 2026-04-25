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
  
  // Update Topbar for Dashboard (Avatar Left, Logo Center, Search/Bell Right - Image 1 Style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <div class="flex items-center gap-3">
           <button id="mobile-menu-btn" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0" onclick="window.toggleMobileSidebar()">
              <img src="${window.appData?.user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}" class="w-full h-full object-cover">
           </button>
        </div>
        <div class="flex-1 flex justify-center">
           <h2 class="font-black text-xl font-['Cabinet_Grotesk'] text-[#1A1916]">Boardnify</h2>
        </div>
        <div class="flex items-center gap-2">
           <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </button>
           <button class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 relative">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <div class="absolute top-2.5 right-2.5 w-2 h-2 bg-[#6B21FF] rounded-full border-2 border-white"></div>
           </button>
        </div>
     `;
  }

  renderDesignerDashboard(container);

  function renderDesignerDashboard(container) {
    const projects = window.appData.projects || [];
    const currentFilter = window._dashboardFilter || 'All';
    
    const displayProjects = currentFilter === 'All' 
      ? projects 
      : projects.filter(p => p.type === currentFilter.toLowerCase());

    // Extract tasks for horizontal scroll (using mock tasks if none exist for premium feel)
    const allTasks = projects.flatMap(p => p.data?.tasks || []).slice(0, 5);
    const displayTasks = allTasks.length > 0 ? allTasks : [
      { title: 'Finalize Moodboard', project: 'Nike Sprint', status: 'Due Today', color: 'bg-[#F4F3FF] text-[#6B21FF]' },
      { title: 'Drafting Script', project: 'Apple Vision', status: 'In Progress', color: 'bg-blue-50 text-blue-500' },
      { title: 'Style Frames', project: 'Tesla X', status: 'Pending', color: 'bg-orange-50 text-orange-500' }
    ];

    container.innerHTML = `
      <div class="view-container w-full max-w-7xl mx-auto p-6 pb-24 animate-fade-in">
        <!-- Greeting -->
        <header class="mb-10 mt-4">
          <h1 class="text-3xl font-black text-[#1A1916] tracking-tight font-['Cabinet_Grotesk'] mb-1">Projects Dashboard</h1>
          <p class="text-gray-400 text-sm font-medium">Welcome back! Manage your creative pipeline.</p>
        </header>

        <!-- Horizontal Tasks Scroll (Tasks Progress - Image 1 Style) -->
        <section class="mb-12">
          <div class="flex items-center justify-between mb-6 px-1">
            <h2 class="text-[11px] font-black text-[#1A1916] uppercase tracking-[0.2em]">Tasks Progress</h2>
            <button onclick="window.navigate('kanban')" class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div class="flex overflow-x-auto gap-5 no-scrollbar pb-4 -mx-6 px-6">
            ${displayTasks.map(task => `
              <div class="bg-white rounded-[32px] p-6 shrink-0 w-[240px] shadow-premium border border-gray-50 active:scale-95 transition-all">
                <span class="inline-block px-3 py-1.5 rounded-full ${task.color || 'bg-gray-50 text-gray-400'} text-[9px] font-black uppercase tracking-widest mb-4">${task.status}</span>
                <h4 class="font-bold text-base text-[#1A1916] font-['Cabinet_Grotesk'] mb-1 truncate">${task.title}</h4>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${task.project || 'General'}</p>
              </div>
            `).join('')}
            <button onclick="window.navigate('kanban')" class="bg-[#F4F3FF] rounded-[32px] p-6 shrink-0 w-[140px] flex flex-col items-center justify-center gap-2 text-[#6B21FF] active:scale-95 transition-all">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
               <span class="text-[10px] font-black uppercase tracking-widest">Add Task</span>
            </button>
          </div>
        </section>

        <!-- Project Workspace -->
        <section>
          <div class="flex items-center justify-between mb-8 px-1">
            <h2 class="text-[11px] font-black text-[#1A1916] uppercase tracking-[0.2em]">My Workspace</h2>
            <button onclick="window.showCreateModal()" class="w-12 h-12 bg-[#6B21FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 active:scale-90 transition-all">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>

          <!-- Type Filters -->
          <div class="flex items-center gap-3 mb-8 overflow-x-auto no-scrollbar -mx-1 px-1">
            ${['All', 'Moodboard', 'Script', 'Kanban', 'Styleframes'].map(f => `
              <button onclick="window.filterDashboard('${f}')" class="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${currentFilter === f ? 'bg-[#6B21FF] text-white shadow-lg shadow-purple-200' : 'bg-white border border-gray-100 text-gray-400 hover:border-purple-200'}">${f}</button>
            `).join('')}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${displayProjects.length === 0 ? `
              <div class="py-20 text-center bg-white border border-dashed border-gray-200 rounded-[40px] md:col-span-2 lg:col-span-3">
                 <div class="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                 </div>
                 <p class="text-sm text-gray-400 font-bold uppercase tracking-widest">No boards found</p>
              </div>
            ` : displayProjects.map(p => `
              <div class="group relative bg-white rounded-[40px] p-6 shadow-subtle hover:shadow-premium border border-gray-50 transition-all cursor-pointer overflow-hidden" onclick="window.navigate('${p.type}', '${p.id}')">
                <div class="flex items-center gap-5 mb-6">
                   <div class="w-16 h-16 rounded-[24px] bg-[#F4F3FF] text-[#6B21FF] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      ${p.type === 'moodboard' ? '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"></path></svg>' : 
                        p.type === 'kanban' ? '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path></svg>' :
                        '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586"></path></svg>'}
                   </div>
                   <div class="flex-1 min-w-0">
                      <h3 class="font-black text-[#1A1916] text-xl truncate mb-1 font-['Cabinet_Grotesk']">${p.title}</h3>
                      <div class="flex items-center gap-2">
                         <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${p.client || 'Personal'}</span>
                      </div>
                   </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                   <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-green-400"></div>
                      <span class="text-[9px] font-black text-green-500 uppercase tracking-widest">${p.status || 'Active'}</span>
                   </div>
                   <span class="text-[9px] font-bold text-gray-300 uppercase tracking-widest">${timeAgo(p.updated_at || p.last_updated)}</span>
                </div>
                
                <button onclick="event.stopPropagation(); window.toggleProjectMenu('${p.id}')" class="absolute top-6 right-6 p-2 text-gray-200 hover:text-[#6B21FF] transition-colors opacity-0 group-hover:opacity-100">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01"></path></svg>
                </button>
                <div id="menu-${p.id}" class="hidden absolute right-12 top-14 w-40 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2">
                   <button onclick="window.confirmDeleteProject('${p.id}')" class="w-full text-left px-5 py-3 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-colors">Delete Board</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }
}

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
    if (!e.target.closest('[id^="menu-"]') && !e.target.closest('button[onclick*="toggleProjectMenu"]')) {
      menu.classList.add('hidden');
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 10);
};

window.confirmDeleteProject = async function(id) {
  if (confirm('Permanently delete this board?')) {
    try {
      if(window.dbDelete) {
        await window.dbDelete('projects', id);
        window.appData.projects = window.appData.projects.filter(p => p.id !== id);
        window.initDashboard(document.getElementById('app'), null);
        if(window.showToast) window.showToast('Board removed', 'success');
      }
    } catch (err) {
      if(window.showToast) window.showToast('Failed to delete', 'error');
    }
  }
};

window.initDashboard = function(container, socket) {
  const isClient = window.activeRole === 'client';

  if (isClient) {
    renderClientDashboard(container);
  } else {
    renderDesignerDashboard(container);
  }

  function renderDesignerDashboard(container) {
    let rawProjects = window.activeClient === 'All' 
      ? window.appData.projects 
      : window.appData.projects.filter(p => p.client === window.activeClient);
      
    const filteredProjects = rawProjects.map(p => ({ ...p, status: p.status || 'In Progress' }));

    const collaboratorUsers = new Set(window.appData.activity.map(a => a.user));
    const stats = {
      active: filteredProjects.length,
      pending: filteredProjects.filter(p => ['In Review', 'Pending Review', 'Needs Your Review'].includes(p.status)).length,
      completed: filteredProjects.filter(p => p.status === 'Approved').length,
      collabs: collaboratorUsers.size
    };

    container.innerHTML = `
      <div class="view-container">
        <header class="flex justify-between items-center mb-10">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Projects Dashboard</h1>
            <p class="text-gray-500 text-lg">Manage your active creative moodboards and workspace</p>
          </div>
          <button onclick="window.showCreateModal()" class="bg-brand hover:bg-brand/90 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-brand/20 smooth-transition flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            New Project
          </button>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-brand shadow-inner">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.active}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Active<br>Projects</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.pending}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Awaiting<br>Review</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.completed}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Completed<br>&nbsp;</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.collabs}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Total<br>Collaborators</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            Active Workspace
            <span class="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full font-black">${filteredProjects.length}</span>
          </h2>
          
          ${filteredProjects.length === 0 ? `
            <div onclick="window.showCreateModal()" class="bg-white rounded-xl shadow-sm h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-brand hover:bg-brand/5 smooth-transition cursor-pointer group mx-4 md:mx-8">
              <div class="w-20 h-20 rounded-[28px] bg-gray-50 group-hover:bg-brand/10 flex items-center justify-center mb-6 smooth-transition shadow-inner border border-gray-100/50">
                <svg class="w-10 h-10 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span class="text-xl font-bold text-gray-400 group-hover:text-brand">Create New Project</span>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-8">
              ${filteredProjects.map(p => `
                <div class="bg-white rounded-xl shadow-sm hover:-translate-y-1 smooth-transition p-4 relative flex flex-col border border-gray-100 group h-[380px]">
                  <div class="aspect-video bg-gray-100 w-full overflow-hidden relative cursor-pointer rounded-lg shrink-0 mb-4" onclick="window.navigate('${p.type}', '${p.id}')">
                    <img src="${p.cover || 'https://placehold.co/600x338/f3f4f6/a3a8b8?text=Project'}" onerror="this.src='https://placehold.co/600x338/f3f4f6/a3a8b8?text=Image+Unavailable'" class="w-full h-full object-cover group-hover:scale-105 smooth-transition" alt="${p.title}">
                  </div>
                  <div class="flex-1 flex flex-col justify-between">
                    <div>
                      <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-gray-900 text-lg tracking-tight line-clamp-1 pr-2 cursor-pointer" onclick="window.navigate('${p.type}', '${p.id}')">${p.title}</h3>
                        <span class="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : ['In Review', 'Pending Review', 'Needs Your Review'].includes(p.status) ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-brand'}">${p.status}</span>
                      </div>
                      <p class="text-xs text-gray-400 font-medium mb-1 line-clamp-1">${p.client || 'No Client'}</p>
                      <p class="text-[10px] text-gray-400 font-bold tracking-wide uppercase">Updated ${p.last_updated ? new Date(p.last_updated).toLocaleDateString() : 'Just now'}</p>
                    </div>
                    
                    <div class="mt-4 flex gap-2 w-full">
                       <button onclick="window.navigate('${p.type}', '${p.id}')" class="flex-1 bg-brand text-white font-bold text-xs py-2.5 rounded-lg hover:bg-brand/90 smooth-transition shadow-sm truncate px-1">Open</button>
                       <button onclick="window.showMagicLinkModal('${p.id}', '${p.title.replace(/'/g, "\\'")}')" class="flex-1 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-bold text-xs py-2.5 rounded-lg smooth-transition truncate px-1 shadow-sm">Share</button>
                       <button onclick="window.showWhatsAppModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.client || ''}')" class="flex-shrink-0 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white p-2.5 rounded-lg smooth-transition" title="Notify Client via WhatsApp">
                          <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg>
                       </button>
                       <button onclick="if(confirm('Delete project?')) { window.appData.projects = window.appData.projects.filter(pp => pp.id !== '${p.id}'); window.navigate('dashboard'); }" class="flex-shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg smooth-transition border border-transparent hover:border-red-100" title="Delete">
                          <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                       </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderClientDashboard(container) {
    const filteredProjects = window.activeClient !== 'All' 
       ? window.appData.projects.filter(p => p.client === window.activeClient)
       : window.appData.projects;

    const stats = {
      shared: filteredProjects.length,
      awaiting: filteredProjects.filter(p => ['In Review', 'Pending Review', 'Needs Your Review'].includes(p.status || 'In Progress')).length,
      approved: filteredProjects.filter(p => (p.status || 'In Progress') === 'Approved').length,
      feedback: filteredProjects.filter(p => ['Needs Revisions', 'Feedback Requested'].includes(p.status || 'In Progress')).length
    };

    container.innerHTML = `
      <div class="view-container">
        <header class="flex justify-between items-center mb-10">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p class="text-gray-500 text-lg">Review and give feedback on your deliverables.</p>
          </div>
        </header>

        <!-- Client Stats Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.shared}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Projects<br>Shared With Me</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-brand shadow-inner">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.awaiting}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Awaiting<br>My Review</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.approved}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">Approved<br>by Me</div>
            </div>
          </div>
          <div class="glass-panel p-8 flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </div>
            <div>
              <div class="text-3xl font-black text-gray-900">${stats.feedback}</div>
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-1">My Pending<br>Feedback</div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-8">
          ${filteredProjects.length === 0 ? `
            <div class="glass-panel py-24 flex flex-col items-center justify-center text-center">
               <div class="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gray-100">
                  <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
               </div>
               <h3 class="text-2xl font-bold text-gray-900 mb-2">No projects have been shared with you yet</h3>
               <p class="text-gray-500 font-medium max-w-sm">Your designer will share projects here for your review and feedback.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-8">
              ${filteredProjects.map(p => { 
                const stat = p.status || 'In Progress';
                return `
                <div class="bg-white rounded-xl shadow-sm hover:-translate-y-1 smooth-transition p-4 relative flex flex-col border border-gray-100 group h-[380px]">
                  <div class="aspect-video bg-gray-100 w-full overflow-hidden relative cursor-pointer rounded-lg shrink-0 mb-4" onclick="window.navigate('${p.type}', '${p.id}')">
                    <img src="${p.cover || 'https://placehold.co/600x338/f3f4f6/a3a8b8?text=Project'}" onerror="this.src='https://placehold.co/600x338/f3f4f6/a3a8b8?text=Image+Unavailable'" class="w-full h-full object-cover group-hover:scale-105 smooth-transition" alt="${p.title}">
                  </div>
                  <div class="flex-1 flex flex-col justify-between">
                    <div>
                      <div class="flex justify-between items-start mb-1">
                        <h3 class="font-bold text-gray-900 text-lg tracking-tight line-clamp-1 pr-2 cursor-pointer" onclick="window.navigate('${p.type}', '${p.id}')">${p.title}</h3>
                        <span class="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${stat === 'Approved' ? 'bg-green-100 text-green-700' : ['In Review', 'Pending Review', 'Needs Your Review'].includes(stat) ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-brand'}">${stat}</span>
                      </div>
                      <p class="text-xs text-gray-400 font-bold tracking-wide">Last activity ${p.last_updated ? new Date(p.last_updated).toLocaleDateString() : 'Just now'}</p>
                    </div>
                    
                    <div class="mt-4 flex gap-3">
                       <button onclick="window.navigate('${p.type}', '${p.id}')" class="flex-1 bg-brand text-white font-bold text-xs py-2.5 rounded-lg hover:bg-brand/90 smooth-transition shadow-sm">View Project</button>
                       <button onclick="window.navigate('${p.type}', '${p.id}')" class="flex-1 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-bold text-xs py-2.5 rounded-lg smooth-transition">Leave Feedback</button>
                    </div>
                  </div>
                </div>
              `}).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }
}

window.showCreateModal = function() {
  if (window.activeRole === 'client') return; // Clients cannot create projects

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
      <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 class="text-2xl font-bold text-gray-800">Create New Project</h2>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-8 space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Project Title</label>
          <input type="text" id="new-p-title" placeholder="e.g. Summer Campaign 2026" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Client</label>
          <select id="new-p-client" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800 bg-white">
            <option value="Acme Corp">Acme Corp</option>
            <option value="Globex">Globex</option>
            <option value="Initech">Initech</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Project Type</label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
             <button onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('border-brand', 'bg-brand/5')); this.classList.add('border-brand', 'bg-brand/5')" class="p-4 border-2 border-brand bg-brand/5 rounded-2xl flex flex-col items-center gap-2 hover:border-brand smooth-transition group" data-type="moodboard">
                <svg class="w-6 h-6 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span class="text-xs font-bold text-gray-600">Moodboard</span>
             </button>
             <button onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('border-brand', 'bg-brand/5')); this.classList.add('border-brand', 'bg-brand/5')" class="p-4 border-2 border-gray-100 rounded-2xl flex flex-col items-center gap-2 hover:border-brand smooth-transition group" data-type="styleframes">
                <svg class="w-6 h-6 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
                <span class="text-xs font-bold text-gray-600">Style Frames</span>
             </button>
             <button onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('border-brand', 'bg-brand/5')); this.classList.add('border-brand', 'bg-brand/5')" class="p-4 border-2 border-gray-100 rounded-2xl flex flex-col items-center gap-2 hover:border-brand smooth-transition group" data-type="motionprojects">
                <svg class="w-6 h-6 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <span class="text-xs font-bold text-gray-600">Motion</span>
             </button>
             <button onclick="this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('border-brand', 'bg-brand/5')); this.classList.add('border-brand', 'bg-brand/5')" class="p-4 border-2 border-gray-100 rounded-2xl flex flex-col items-center gap-2 hover:border-brand smooth-transition group" data-type="kanban">
                <svg class="w-6 h-6 text-gray-400 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span class="text-xs font-bold text-gray-600">Tasks</span>
             </button>
          </div>
        </div>
      </div>
      <div class="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
        <button onclick="this.closest('.fixed').remove()" class="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 smooth-transition">Cancel</button>
        <button id="confirm-create" class="flex-1 px-6 py-3 rounded-xl font-bold bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand/90 smooth-transition">Create Project</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('confirm-create').onclick = () => {
    const title = document.getElementById('new-p-title').value;
    const client = document.getElementById('new-p-client').value;
    const type = modal.querySelector('.border-brand')?.dataset.type || 'moodboard';

    if(!title) {
      window.showToast('Please enter a project title.');
      return;
    }

    const newProjectId = crypto.randomUUID();
    const newProject = {
      id: newProjectId,
      title: title,
      client: client,
      type: type,
      status: 'Draft',
      progress: 0,
      cover: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600&auto=format&fit=crop'
    };

    // Optimistic Update
    window.appData.projects.unshift({
      ...newProject,
      last_updated: new Date().toISOString()
    });

    if(window.dbInsert) {
      window.dbInsert('projects', newProject);
    }

    if(window.logActivity) {
      const actId = crypto.randomUUID();
      const activityPayload = {
         id: actId,
         user_name: window.activeRole === 'client' ? 'Client' : 'Designer',
         action: 'created',
         target: title
      };
      window.appData.activity.unshift({
        ...activityPayload, user: activityPayload.user_name, time: 'Just now'
      });
      window.dbInsert('activity', activityPayload);
    }

    window.showToast(`Project "${title}" created successfully!`);
    modal.remove();
    window.navigate('dashboard');
  };
};

window.showMagicLinkModal = function(projectId, projectTitle) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col">
      <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
           <h2 class="text-2xl font-bold text-gray-800 tracking-tight">Client Access Link</h2>
           <p class="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">${projectTitle}</p>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div id="magic-step-1" class="p-8 space-y-5">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Client Name</label>
          <input type="text" id="magic-c-name" placeholder="E.g. John Doe" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800 font-medium">
        </div>
        <div class="grid grid-cols-2 gap-4">
           <div>
             <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Email (Opt)</label>
             <input type="email" id="magic-c-email" placeholder="john@example.com" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800 text-sm">
           </div>
           <div>
             <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">WhatsApp (Opt)</label>
             <input type="tel" id="magic-c-wa" placeholder="+1234567890" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800 text-sm">
           </div>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Link Expiry (Opt)</label>
          <input type="date" id="magic-c-expiry" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none smooth-transition text-gray-800 text-sm bg-white">
        </div>
        
        <button id="generate-magic-btn" class="w-full mt-4 px-6 py-3.5 rounded-xl font-bold bg-brand text-white shadow-lg shadow-brand/20 hover:bg-[#e65c20] smooth-transition flex items-center justify-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
           Generate Secure Link
        </button>
      </div>

      <div id="magic-step-2" class="p-8 hidden flex-col items-center">
         <div class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-inner">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
         </div>
         <h3 class="text-xl font-bold text-gray-800 mb-2">Link Generated!</h3>
         <p class="text-xs text-gray-500 mb-6 text-center">This secure link automatically bypasses login and only grants access to this specific project.</p>
         
         <div class="w-full flex items-center bg-gray-50 border border-gray-200 rounded-xl p-2 mb-6">
            <input type="text" id="magic-result-link" class="flex-1 bg-transparent border-none outline-none text-xs text-gray-600 font-medium px-2 truncate" readonly>
            <button id="copy-magic-btn" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 smooth-transition shadow-sm">Copy</button>
         </div>

         <div class="grid grid-cols-2 gap-3 w-full">
            <button onclick="this.closest('.fixed').remove()" class="px-4 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 smooth-transition text-sm">Close</button>
            <button id="wa-magic-btn" class="px-4 py-3 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20BE5C] shadow-lg shadow-[#25D366]/20 smooth-transition text-sm flex items-center justify-center gap-2">
               <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg>
               WhatsApp
            </button>
         </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const btnGen = document.getElementById('generate-magic-btn');
  btnGen.onclick = async () => {
     const cName = document.getElementById('magic-c-name').value;
     const cEmail = document.getElementById('magic-c-email').value;
     const cWa = document.getElementById('magic-c-wa').value;
     const cExpiry = document.getElementById('magic-c-expiry').value;
     
     if (!cName) {
        window.showToast('Please enter the client name.', 'error');
        return;
     }

     const magicToken = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
     const baseUrl = window.location.href.split('?')[0];
     const finalLink = `${baseUrl}?magic=${magicToken}`;
     
     const payload = {
        project_id: projectId,
        token: magicToken,
        client_name: cName,
        client_email: cEmail,
        client_whatsapp: cWa,
        expires_at: cExpiry ? new Date(cExpiry).toISOString() : null
     };

     // Create record in Supabase
     if (window.supabaseClient) {
        btnGen.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>';
        try {
           const { error } = await window.supabaseClient.from('project_access_tokens').insert([payload]);
           if (error && window.showToast) window.showToast('Database error: Make sure table is active!', 'warning');
        } catch (e) {
           console.error(e);
        }
     }

     document.getElementById('magic-step-1').classList.add('hidden');
     document.getElementById('magic-step-2').classList.remove('hidden');
     document.getElementById('magic-step-2').classList.add('flex');
     
     const linkDom = document.getElementById('magic-result-link');
     linkDom.value = finalLink;

     document.getElementById('copy-magic-btn').onclick = () => {
        navigator.clipboard.writeText(finalLink);
        window.showToast('Magic link copied to clipboard!', 'success');
     };

     // WhatsApp Direct Share
     const waBtn = document.getElementById('wa-magic-btn');
     waBtn.onclick = () => {
        const text = `Hi ${cName}, your project "${projectTitle}" has been shared with you on Boardnify.\n\nClick here to securely access and review it:\n${finalLink}`;
        const encoded = encodeURIComponent(text);
        let phoneStr = '';
        if (cWa) {
           phoneStr = cWa.replace(/[^0-9]/g, '');
        }
        window.open(`https://wa.me/${phoneStr}?text=${encoded}`, '_blank');
     };
  };
};

window.showWhatsAppModal = async function(projectId, projectTitle, clientName) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in';
  
  // Standard templates mapped to triggers
  const templates = {
     'New version delivered': `Hi {client}, your project "{project}" has been updated on Boardnify with a new version!\n\nClick your link to view the latest changes and leave your feedback:\n{link}`,
     'Feedback requested': `Hi {client}, we've uploaded new materials to "{project}".\n\nPlease review and let us know your thoughts so we can proceed!\n{link}`,
     'Project approved': `Hi {client}, fantastic news! "{project}" is now approved and completed.\n\nYou can access your final files here:\n{link}`,
     'Revision uploaded': `Hi {client}, the revisions you requested for "{project}" have just been uploaded.\n\nTake a look when you have a moment:\n{link}`,
     'Review reminder': `Hi {client}, friendly reminder that "{project}" is still awaiting your review on Boardnify.\n\nWhenever you're ready, click here to access it:\n{link}`
  };

  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col">
      <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-[#25D366]/10">
        <div class="flex items-center gap-4">
           <div class="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#25D366]/30">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg>
           </div>
           <div>
             <h2 class="text-xl font-black text-[#128C7E] tracking-tight">WhatsApp Client Update</h2>
             <p class="text-[10px] text-[#128C7E]/70 font-bold uppercase tracking-widest mt-0.5">${projectTitle}</p>
           </div>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="text-[#128C7E]/50 hover:text-[#128C7E] transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-8 space-y-6">
        <div>
          <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Update Trigger</label>
          <select id="wa-trigger-select" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none smooth-transition text-gray-800 font-medium bg-gray-50 text-sm">
             <option value="New version delivered">New version delivered</option>
             <option value="Feedback requested">Feedback requested</option>
             <option value="Project approved">Project approved</option>
             <option value="Revision uploaded">Revision uploaded</option>
             <option value="Review reminder">Review reminder</option>
          </select>
        </div>
        
        <div>
          <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest flex justify-between">
             Message Preview (Editable)
             <span id="wa-link-status" class="text-[#25D366] lowercase normal-case tracking-normal">Attaching links...</span>
          </label>
          <textarea id="wa-msg-body" rows="6" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none smooth-transition text-gray-800 font-medium text-sm resize-none"></textarea>
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Client WhatsApp Number</label>
          <input type="tel" id="wa-client-phone" placeholder="e.g. 14155552671" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366] outline-none smooth-transition text-gray-800 font-bold text-sm">
          <p class="text-[10px] text-gray-400 mt-1.5 font-medium">Auto-fetched if you previously generated a Magic Link with a phone number.</p>
        </div>
      </div>
      <div class="p-8 border-t border-gray-100 flex gap-4 bg-gray-50">
        <button onclick="this.closest('.fixed').remove()" class="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 smooth-transition">Cancel</button>
        <button id="wa-send-final" class="flex-1 px-6 py-3.5 rounded-xl font-bold bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#20BE5C] smooth-transition flex items-center justify-center gap-2">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
           Send via WhatsApp
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Fetch phone and link async
  let activeLink = `${window.location.href.split('?')[0]}?project=${projectId}`;
  let activePhone = '';

  const cName = clientName || 'Client';
  
  const injectTemplate = (trigger) => {
      let tmpl = templates[trigger] || templates['New version delivered'];
      tmpl = tmpl.replace('{client}', cName).replace('{project}', projectTitle).replace('{link}', activeLink);
      document.getElementById('wa-msg-body').value = tmpl;
  };

  injectTemplate('New version delivered');

  if (window.supabaseClient) {
     try {
        const { data } = await window.supabaseClient.from('project_access_tokens')
          .select('token, client_whatsapp')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (data) {
           activeLink = `${window.location.href.split('?')[0]}?magic=${data.token}`;
           if (data.client_whatsapp) {
              activePhone = data.client_whatsapp;
              document.getElementById('wa-client-phone').value = activePhone;
           }
           document.getElementById('wa-link-status').textContent = 'Magic Link attached!';
           injectTemplate('New version delivered'); // Refresh with Magic Link
        } else {
           document.getElementById('wa-link-status').textContent = 'Standard link attached.';
        }
     } catch(e) { 
         document.getElementById('wa-link-status').textContent = 'Standard link attached.';
     }
  } else {
      document.getElementById('wa-link-status').textContent = 'Standard link attached.';
  }

  document.getElementById('wa-trigger-select').addEventListener('change', (e) => {
     injectTemplate(e.target.value);
  });

  document.getElementById('wa-send-final').onclick = () => {
     const phoneEntry = document.getElementById('wa-client-phone').value.replace(/[^0-9]/g, '');
     const message = encodeURIComponent(document.getElementById('wa-msg-body').value);
     window.open(`https://wa.me/${phoneEntry}?text=${message}`, '_blank');
  };
};


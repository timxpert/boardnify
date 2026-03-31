window.initMotionProjects = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  if (!project.data?.motionProjects) {
    project.data = project.data || {};
    project.data.motionProjects = [
      {
        id: 'mp1',
        title: 'Brand Anthem',
        client: 'Acme Corp',
        status: 'In Progress',
        aspectRatio: '16:9',
        fps: '24',
        versions: [
          { vId: 'v1', status: 'Delivered', dlUrl: '#dl1', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { vId: 'v2', status: 'In Review', dlUrl: '#dl2', embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ],
        comments: 3
      }
    ];
  }
  window.globalMotionProjects = project.data.motionProjects;

  const saveMotionState = () => {
    project.data = project.data || {};
    project.data.motionProjects = window.globalMotionProjects;
    if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
  };
  
  const pushToHistory = (actionLabel, undoFn, redoFn) => {
    if(window.activeRole === 'client') return;
    if(window.activeHistory) window.activeHistory.push(actionLabel, 
       () => { undoFn(); saveMotionState(); }, 
       () => { redoFn(); saveMotionState(); }
    );
  };
  
  let currentFilter = { aspect: 'All', fps: 'All' };
  let currentActiveVId = null;

  // --- HTML LAYOUTS ---
  const gridLayout = `
    <div class="h-full overflow-y-auto bg-[#F7F8FA]">
      <div class="max-w-7xl mx-auto p-10">
        <header class="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-1">${project.title} Motion</h1>
            <p class="text-sm text-gray-500">Manage and review motion video deliverables entirely in one place.</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
               <select id="filter-aspect" class="bg-transparent text-[11px] font-bold uppercase tracking-widest text-gray-600 border-none focus:ring-0 cursor-pointer px-3 py-1.5 outline-none hover:text-gray-900 transition-colors">
                  <option value="All">ALL ASPECTS</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
               </select>
               <div class="w-px h-4 bg-gray-200"></div>
               <select id="filter-fps" class="bg-transparent text-[11px] font-bold uppercase tracking-widest text-gray-600 border-none focus:ring-0 cursor-pointer px-3 py-1.5 outline-none hover:text-gray-900 transition-colors">
                  <option value="All">ALL FPS</option>
                  <option value="24">24 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
               </select>
            </div>
            <button id="mp-new-proj-btn" class="bg-[#FF6B2B] hover:bg-[#e65c20] text-white font-bold py-2.5 px-6 rounded-xl smooth-transition shadow-lg hover:shadow-xl shadow-[#FF6B2B]/20 flex items-center gap-2 text-xs uppercase tracking-widest ${window.activeRole === 'client' ? 'hidden' : ''}">
              + New Project
            </button>
          </div>
        </header>
        <div id="mp-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Cards Injected via JS -->
        </div>
      </div>
    </div>

    <!-- New Project Modal -->
    <div id="mp-new-modal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center hidden opacity-0 smooth-transition">
      <div class="bg-white rounded-3xl shadow-2xl w-[550px] max-w-full overflow-hidden transform scale-95 transition-all duration-300" id="mp-modal-content">
        <div class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">New Motion Project</h2>
            <p class="text-sm text-gray-500">Configure technical specs and delivery links.</p>
          </div>
          <button id="mp-close-modal" class="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-full smooth-transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
        <div class="p-8 flex flex-col gap-6">
          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Project Title</label>
                <input type="text" id="mp-new-title" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] smooth-transition" placeholder="e.g. Q3 Explainer Video">
             </div>
             <div>
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client</label>
                <select id="mp-new-client" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] smooth-transition">
                   <option value="Acme Corp">Acme Corp</option>
                   <option value="Globex">Globex</option>
                   <option value="Initech">Initech</option>
                </select>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Aspect Ratio</label>
                <select id="mp-new-aspect" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] smooth-transition font-medium">
                   <option value="16:9">16:9 (Widescreen)</option>
                   <option value="9:16">9:16 (Vertical/Social)</option>
                   <option value="1:1">1:1 (Square)</option>
                </select>
             </div>
             <div>
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Frame Rate (FPS)</label>
                <select id="mp-new-fps" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] smooth-transition font-medium">
                   <option value="24">24 FPS (Cinematic)</option>
                   <option value="30">30 FPS (Standard)</option>
                   <option value="60">60 FPS (Smooth)</option>
                </select>
             </div>
          </div>

          <div>
             <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Video Delivery Link (YT/Vimeo/Drive)</label>
             <input type="text" id="mp-new-link" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] smooth-transition font-mono text-sm" placeholder="https://vimeo.com/...">
             <span id="mp-err-link" class="text-[10px] text-red-500 font-bold uppercase mt-1 hidden tracking-wider">Invalid Video URL Provided</span>
          </div>
        </div>
        <div class="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 px-8">
          <button id="mp-cancel-modal" class="px-6 py-2.5 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 rounded-xl smooth-transition">Cancel</button>
          <button id="mp-create-modal" class="bg-[#FF6B2B] hover:bg-[#e65c20] text-white font-bold text-xs uppercase tracking-widest py-2.5 px-8 rounded-xl shadow-lg shadow-[#FF6B2B]/20 smooth-transition">Create Project</button>
        </div>
      </div>
    </div>
  `;

  function renderDashboard() {
    container.innerHTML = gridLayout;
    
    const gridEl = document.getElementById('mp-grid-container');
    const newBtn = document.getElementById('mp-new-proj-btn');
    const modal = document.getElementById('mp-new-modal');
    const modalContent = document.getElementById('mp-modal-content');
    const closeBtn = document.getElementById('mp-close-modal');
    const cancelBtn = document.getElementById('mp-cancel-modal');
    const createBtn = document.getElementById('mp-create-modal');

    // Filter selectors
    const aspectFilter = document.getElementById('filter-aspect');
    const fpsFilter = document.getElementById('filter-fps');
    
    aspectFilter.value = currentFilter.aspect;
    fpsFilter.value = currentFilter.fps;

    const refreshGrid = () => {
      gridEl.innerHTML = '';
      window.globalMotionProjects.forEach((proj) => {
        if(window.activeClient !== 'All' && proj.client !== window.activeClient) return;
        if(currentFilter.aspect !== 'All' && proj.aspectRatio !== currentFilter.aspect) return;
        if(currentFilter.fps !== 'All' && proj.fps !== currentFilter.fps) return;

        const card = document.createElement('div');
        // Card wrapper styling: Max width 380px, 12px rounded corners, subtle shadow, lift on hover
        card.className = 'bg-[#FFFFFF] rounded-[12px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative max-w-[380px] w-full mx-auto border border-gray-100';
        
        const latestV = proj.versions[proj.versions.length - 1];
        let statusBg = 'bg-yellow-400 text-yellow-900';
        if(proj.status.toUpperCase() === 'DELIVERED') statusBg = 'bg-green-400 text-green-900';
        if(proj.status.toUpperCase() === 'IN REVIEW') statusBg = 'bg-blue-400 text-blue-900';
        
        card.innerHTML = `
          <!-- Delete/Duplicate Context Actions (Hidden for client) -->
          <div class="absolute top-4 right-4 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 ${window.activeRole === 'client' ? 'hidden' : ''}">
             <button class="p-2 bg-white/90 backdrop-blur rounded-[8px] text-gray-500 hover:text-brand shadow-sm hover:bg-white" onclick="event.stopPropagation(); window.duplicateMotionProj('${proj.id}')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
             <button class="p-2 bg-white/90 backdrop-blur rounded-[8px] text-gray-500 hover:text-red-500 shadow-sm hover:bg-white" onclick="event.stopPropagation(); window.deleteMotionProj('${proj.id}')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
          </div>
          
          <!-- Thumbnail (16:9 Aspect Ratio) -->
          <div class="w-full aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden rounded-t-[12px]">
            <img src="https://images.unsplash.com/photo-1492691523567-6170c8173461?q=80&w=600&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500 transform">
            <div class="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Play Button Overlay -->
            <div class="z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 group-hover:bg-brand/80 group-hover:border-brand transition-all shadow-xl">
               <svg class="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 z-20 ${statusBg} text-[9px] font-black px-2 py-1 rounded-[6px] shadow-sm tracking-widest uppercase">${proj.status}</div>
            <div class="absolute bottom-3 left-3 z-20 flex gap-1.5 opacity-90">
              <span class="bg-black/50 backdrop-blur text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase">${proj.aspectRatio}</span>
              <span class="bg-black/50 backdrop-blur text-white border border-white/20 text-[9px] font-bold px-2 py-0.5 rounded-[4px] tracking-widest uppercase">${proj.fps} FPS</span>
            </div>
          </div>
          
          <!-- Card Details -->
          <div class="p-5 flex-1 flex flex-col">
            <h3 class="font-bold text-gray-900 text-lg group-hover:text-brand transition-colors mb-0.5 leading-tight">${proj.title}</h3>
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">${proj.client}</p>
            
            <div class="flex items-center justify-between text-xs text-gray-500 mt-auto mb-4">
               <span>Latest: <span class="font-bold text-gray-700">${latestV.vId}</span></span>
               <span>${new Date().toLocaleDateString()}</span>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-100">
               <div class="flex -space-x-1.5">
                  <img src="https://i.pravatar.cc/100?img=11" class="w-6 h-6 rounded-full border-2 border-white bg-gray-200">
                  <img src="https://i.pravatar.cc/100?img=12" class="w-6 h-6 rounded-full border-2 border-white bg-gray-200">
               </div>
               <span class="text-[10px] font-bold text-gray-400 group-hover:text-brand uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  ${proj.comments} NOTES
               </span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => renderProjectView(proj));
        gridEl.appendChild(card);
      });
    };

    refreshGrid();

    aspectFilter.onchange = (e) => { currentFilter.aspect = e.target.value; refreshGrid(); };
    fpsFilter.onchange = (e) => { currentFilter.fps = e.target.value; refreshGrid(); };

    newBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      setTimeout(() => { modal.classList.add('opacity-100'); modalContent.classList.remove('scale-95'); }, 10);
    });

    const closeHandler = () => {
      modal.classList.remove('opacity-100');
      modalContent.classList.add('scale-95');
      setTimeout(() => modal.classList.add('hidden'), 300);
    };

    closeBtn.onclick = closeHandler;
    cancelBtn.onclick = closeHandler;

    createBtn.addEventListener('click', () => {
      const title = document.getElementById('mp-new-title').value.trim();
      const link = document.getElementById('mp-new-link').value.trim();
      const client = document.getElementById('mp-new-client').value;
      const aspect = document.getElementById('mp-new-aspect').value;
      const fps = document.getElementById('mp-new-fps').value;

      if(!title || !link) {
         if(window.showToast) window.showToast('Please fill all required fields');
         return;
      }
      if(!link.match(/youtube\.com|vimeo\.com|drive\.google\.com/)) {
         document.getElementById('mp-err-link').classList.remove('hidden');
         return;
      } else {
         document.getElementById('mp-err-link').classList.add('hidden');
      }

      const newProj = {
        id: 'mp' + Date.now(),
        title, client, aspectRatio: aspect, fps,
        status: 'Draft',
        versions: [{ vId: 'v1', status: 'Draft', embedUrl: getEmbedUrl(link), dlUrl: link, thread: [] }],
        comments: 0
      };

      const prevState = JSON.stringify(window.globalMotionProjects);
      window.globalMotionProjects.push(newProj);
      const nextState = JSON.stringify(window.globalMotionProjects);
      pushToHistory('New Motion Project', 
        () => { window.globalMotionProjects = JSON.parse(prevState); refreshGrid(); },
        () => { window.globalMotionProjects = JSON.parse(nextState); refreshGrid(); }
      );

      saveMotionState();
      closeHandler();
      refreshGrid();
      if(window.showToast) window.showToast('Motion project created!');
    });
  }

  function getEmbedUrl(link) {
    if(link.includes('youtube.com/watch?v=')) return link.replace('watch?v=', 'embed/');
    if(link.includes('vimeo.com/')) return `https://player.vimeo.com/video/${link.split('/').pop()}`;
    if(link.includes('drive.google.com/file/d/')) {
       const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
       return match ? `https://drive.google.com/file/d/${match[1]}/preview` : link;
    }
    return link;
  }

  function renderProjectView(proj) {
     const latestV = proj.versions[proj.versions.length-1].vId;
     if(!currentActiveVId || !proj.versions.find(v => v.vId === currentActiveVId)) {
        currentActiveVId = latestV;
     }

     window.setActiveVersion = (vId) => {
        currentActiveVId = vId;
        renderProjectView(proj);
     };

     const activeVersion = proj.versions.find(v => v.vId === currentActiveVId);

     container.innerHTML = `
        <div class="h-full flex flex-col bg-[#F7F8FA]">
          <header class="px-8 py-5 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10 shrink-0">
             <div class="flex items-center gap-5">
                <button id="mp-back-btn" class="p-2 -ml-2 text-gray-400 hover:text-brand rounded-full hover:bg-gray-50 smooth-transition">
                   <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div class="w-px h-6 bg-gray-200"></div>
                <div>
                   <h1 class="text-xl font-bold text-gray-900">${proj.title}</h1>
                   <div class="flex items-center gap-2 mt-1 opacity-70">
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${proj.client}</span>
                      <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span class="text-[10px] font-bold text-brand uppercase tracking-widest">${proj.aspectRatio}</span>
                      <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span class="text-[10px] font-bold text-brand uppercase tracking-widest">${proj.fps} FPS</span>
                   </div>
                </div>
             </div>
             <div class="flex gap-4">
                <button onclick="window.showWhatsAppModal('${projectId}', '${project.title.replace(/'/g, "\\'")}', '${project.client || ''}')" class="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${window.activeRole === 'client' ? 'hidden' : ''}">
                  <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg>
                  Notify Client
                </button>
                <button id="deliver-version-btn" class="bg-[#111111] hover:bg-black text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${window.activeRole === 'client' ? 'hidden' : ''}">
                  Deliver ${activeVersion.vId}
                </button>
             </div>
          </header>

          <div class="p-8 flex-1 overflow-y-auto">
             <div class="max-w-5xl mx-auto flex flex-col">
                
                <div class="flex gap-3 mb-8">
                  ${proj.versions.map(v => `
                    <button onclick="window.setActiveVersion('${v.vId}')" 
                            class="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs smooth-transition border cursor-pointer
                            ${v.vId === currentActiveVId ? 'bg-gray-900 text-white shadow-xl border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900 shadow-sm'}">
                      Version ${v.vId.replace('v', '')}
                    </button>
                  `).join('')}
                  
                  <button id="mp-add-version-btn" class="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs smooth-transition bg-[#FF6B2B]/5 text-[#FF6B2B] border border-dashed border-[#FF6B2B]/40 hover:bg-[#FF6B2B] hover:text-white ${window.activeRole === 'client' ? 'hidden' : ''}">
                    + Add Version
                  </button>
                </div>

                <div class="bg-white rounded-[20px] shadow-sm overflow-hidden border border-gray-200 animate-fade-in flex flex-col relative">
                   <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center px-6">
                      <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">STATUS: ${activeVersion.status}</span>
                      ${activeVersion.dlUrl ? `<button onclick="window.open('${activeVersion.dlUrl}', '_blank')" class="text-[10px] font-bold text-brand uppercase tracking-widest hover:underline flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Download MP4</button>` : ''}
                   </div>
                   <!-- Video Player Embed -->
                   <div class="aspect-video bg-black relative">
                      <iframe src="${activeVersion.embedUrl}" class="absolute inset-0 w-full h-full" border="0" allowfullscreen></iframe>
                   </div>
                   
                   <!-- Feedback Section -->
                   <div class="p-8 pb-10">
                      <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Visual Notes & Feedback for ${activeVersion.vId}</h4>
                      
                      <!-- Thread List -->
                      <div class="space-y-4" id="mp-thread-${activeVersion.vId}">
                         ${(activeVersion.thread || []).map(comment => `
                            <div class="flex gap-4 items-start animate-slide-up">
                               <div class="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-md border border-gray-700">${comment.user.charAt(0)}</div>
                               <div class="flex-1 bg-gray-50 p-5 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 px-1">${comment.user} <span class="text-gray-300 px-1">•</span> ${comment.time}</p>
                                  ${comment.audioUrl ? 
                                    window.renderAudioPlayer ? window.renderAudioPlayer(comment.audioUrl, comment.user) : `<audio src="${comment.audioUrl}" controls></audio>` 
                                    : `<p class="text-sm text-gray-700 leading-relaxed px-1">${comment.text}</p>`}
                               </div>
                            </div>
                         `).join('')}
                         ${!(activeVersion.thread && activeVersion.thread.length) ? '<div class="py-8 text-center text-sm text-gray-400 italic">No feedback for this version yet. Be the first to comment below!</div>' : ''}
                      </div>

                      <!-- Animated Feedback Input Bar -->
                      <div class="mt-8 relative w-full items-center">
                         <input type="text" id="mp-comment-input" placeholder="Type a message or visual note..." class="w-full pl-5 pr-14 py-4 bg-white border border-gray-200 hover:border-gray-300 rounded-[16px] shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B2B]/20 focus:border-[#FF6B2B] transition-all">
                         
                         <!-- Action Buttons Wrapper -->
                         <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10">
                            <!-- Mic Icon -->
                            <button id="mp-mic-btn" class="absolute inset-0 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#FF6B2B] rounded-[10px] transition-all duration-150 ease-in-out scale-100 opacity-100 voice-holder" title="Record Voice Note">
                               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </button>
                            <!-- Send Icon (Orange Paper Plane) -->
                            <button id="mp-send-btn" class="absolute inset-0 flex items-center justify-center text-white bg-[#FF6B2B] hover:bg-[#e65c20] shadow-md shadow-[#FF6B2B]/30 rounded-[10px] transition-all duration-150 ease-in-out scale-50 opacity-0 pointer-events-none" title="Send Feedback">
                               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

             </div>
          </div>
        </div>
     `;
     
     document.getElementById('mp-back-btn').onclick = renderDashboard;

     // Wiring Add Version
     const addVerBtn = document.getElementById('mp-add-version-btn');
     if(addVerBtn) {
        addVerBtn.onclick = () => {
           const link = prompt('Enter video link for new version:');
           if(link && link.match(/youtube\.com|vimeo\.com|drive\.google\.com/)) {
              const prevState = JSON.stringify(window.globalMotionProjects);
              const nextVId = 'v' + (proj.versions.length + 1);
              proj.versions.push({ vId: nextVId, status: 'Draft', embedUrl: getEmbedUrl(link), dlUrl: link, thread: [] });
              const nextState = JSON.stringify(window.globalMotionProjects);
              pushToHistory('Add Version',
                () => { window.globalMotionProjects = JSON.parse(prevState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); },
                () => { window.globalMotionProjects = JSON.parse(nextState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); }
              );
              saveMotionState();
              currentActiveVId = nextVId;
              renderProjectView(proj);
           } else if(link) {
              if(window.showToast) window.showToast('Invalid video URL format', 'error');
           }
        };
     }

     // Wiring Deliver Button
     const deliverBtn = document.getElementById('deliver-version-btn');
     if(deliverBtn) {
        deliverBtn.onclick = () => {
           const prevState = JSON.stringify(window.globalMotionProjects);
           activeVersion.status = 'Delivered';
           proj.status = 'In Review';
           const nextState = JSON.stringify(window.globalMotionProjects);
           pushToHistory('Deliver Version',
             () => { window.globalMotionProjects = JSON.parse(prevState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); },
             () => { window.globalMotionProjects = JSON.parse(nextState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); }
           );
           
           saveMotionState();
           
           if(window.triggerNotification) window.triggerNotification('delivery');
           else if(window.showToast) window.showToast(`Version ${activeVersion.vId} Delivered!`);
           
           if(window.logActivity) window.logActivity('delivered', `${proj.title} ${activeVersion.vId}`);
           renderProjectView(proj);
        };
     }

     // Feedback Input Animation Logic
     const commentInput = document.getElementById('mp-comment-input');
     const micBtn = document.getElementById('mp-mic-btn');
     const sendBtn = document.getElementById('mp-send-btn');

     const toggleInputIcons = () => {
        if(commentInput.value.length > 0) {
           micBtn.classList.replace('scale-100', 'scale-50');
           micBtn.classList.replace('opacity-100', 'opacity-0');
           micBtn.classList.add('pointer-events-none');
           
           sendBtn.classList.replace('scale-50', 'scale-100');
           sendBtn.classList.replace('opacity-0', 'opacity-100');
           sendBtn.classList.remove('pointer-events-none');
        } else {
           sendBtn.classList.replace('scale-100', 'scale-50');
           sendBtn.classList.replace('opacity-100', 'opacity-0');
           sendBtn.classList.add('pointer-events-none');
           
           micBtn.classList.replace('scale-50', 'scale-100');
           micBtn.classList.replace('opacity-0', 'opacity-100');
           micBtn.classList.remove('pointer-events-none');
        }
     };

     if(commentInput) {
        commentInput.addEventListener('input', toggleInputIcons);
        
        const submitComment = () => {
           if(commentInput.value.trim() !== '') {
              if(!activeVersion.thread) activeVersion.thread = [];
              const prevState = JSON.stringify(window.globalMotionProjects);
              activeVersion.thread.push({
                 id: 'cmt' + Date.now(),
                 user: window.activeRole === 'client' ? 'Client' : 'Designer',
                 time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                 text: commentInput.value.trim()
              });
              proj.comments++;
              const nextState = JSON.stringify(window.globalMotionProjects);
              pushToHistory('Add Comment',
                 () => { window.globalMotionProjects = JSON.parse(prevState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); },
                 () => { window.globalMotionProjects = JSON.parse(nextState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); }
              );
              
              saveMotionState();
              commentInput.value = '';
              toggleInputIcons();
              renderProjectView(proj);
           }
        };

        commentInput.addEventListener('keypress', (e) => {
           if(e.key === 'Enter') submitComment();
        });
        
        sendBtn.addEventListener('click', submitComment);
     }

     // Initialize Voice Recorder UI for the comment box if utility exists
     setTimeout(() => {
        if(window.initAudioRecorder) {
           const holder = document.getElementById('mp-mic-btn');
           if(holder) {
               window.initAudioRecorder(holder, (url) => {
                   if(!activeVersion.thread) activeVersion.thread = [];
                   const prevState = JSON.stringify(window.globalMotionProjects);
                   activeVersion.thread.push({
                       id: 'cmt' + Date.now(),
                       user: window.activeRole === 'client' ? 'Client' : 'Designer',
                       time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                       text: '🎤 Voice Note',
                       audioUrl: url
                   });
                   proj.comments++;
                   const nextState = JSON.stringify(window.globalMotionProjects);
                   pushToHistory('Add Voice Note',
                       () => { window.globalMotionProjects = JSON.parse(prevState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); },
                       () => { window.globalMotionProjects = JSON.parse(nextState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); }
                   );
                   saveMotionState();
                   renderProjectView(proj);
               });
           }
        }
     }, 100);
  }

  window.duplicateMotionProj = (id) => {
     const idx = window.globalMotionProjects.findIndex(p => p.id === id);
     if(idx === -1) return;
     const prevState = JSON.stringify(window.globalMotionProjects);
     
     const p = window.globalMotionProjects[idx];
     const n = JSON.parse(JSON.stringify(p));
     n.id = 'mp' + Date.now();
     n.title += " (Copy)";
     window.globalMotionProjects.splice(idx + 0, 0, n); // copy in place
     
     const nextState = JSON.stringify(window.globalMotionProjects);
     pushToHistory('Duplicate Project',
        () => { window.globalMotionProjects = JSON.parse(prevState); renderDashboard(); },
        () => { window.globalMotionProjects = JSON.parse(nextState); renderDashboard(); }
     );
     saveMotionState();
     renderDashboard();
  };

  window.deleteMotionProj = (id) => {
     if(window.activeRole === 'client') return;
     if(!confirm('Delete this Motion Project?')) return;
     const idx = window.globalMotionProjects.findIndex(p => p.id === id);
     if(idx === -1) return;
     const prevState = JSON.stringify(window.globalMotionProjects);
     
     const copy = JSON.parse(JSON.stringify(window.globalMotionProjects[idx]));
     if(window.appData && window.appData.trash) {
        const trashId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tr' + Date.now();
        const payload = { id: trashId, type: 'Motion Project', title: copy.title, deletedAt: new Date().toLocaleDateString(), project: project.title, data: copy };
        window.appData.trash.push(payload);
        if(window.dbInsert) window.dbInsert('trash', {
            id: trashId,
            type: payload.type,
            title: payload.title,
            project: payload.project,
            payload: payload.data
        });
        window.updateBadges();
     }

     window.globalMotionProjects.splice(idx, 1);
     
     const nextState = JSON.stringify(window.globalMotionProjects);
     pushToHistory('Delete Project',
        () => { window.globalMotionProjects = JSON.parse(prevState); renderDashboard(); },
        () => { window.globalMotionProjects = JSON.parse(nextState); renderDashboard(); }
     );
     saveMotionState();
     renderDashboard();
  };

  renderDashboard();
};

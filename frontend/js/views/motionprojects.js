window.initMotionProjects = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
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
    
    const _pId = projectId || window.currentProject || window.appData.projects[0]?.id;
    if (!_pId || _pId === 'null') return;
    if(window.dbUpdate && _pId) window.dbUpdate('projects', _pId, { data: project.data });
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

  // --- GLOBALS FOR UPLOADS & PREVIEWS ---
  window.openDocPreview = (url, title) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-fade-in p-10';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl w-full h-full max-w-6xl shadow-2xl flex flex-col overflow-hidden">
        <header class="h-16 px-8 flex items-center justify-between border-b border-border-light bg-gray-50/50">
          <h3 class="text-sm font-bold text-text-dark uppercase tracking-widest">${title || 'Document Preview'}</h3>
          <button onclick="this.closest('.fixed').remove()" class="p-2 text-gray-400 hover:text-text-dark transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>
        <div class="flex-1 bg-gray-200">
          <iframe src="${url}" class="w-full h-full border-none"></iframe>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  window.handleMPUpload = async (projectId, vId, onComplete) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,.pdf,.doc,.docx,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (window.showToast) window.showToast('Uploading to secure vault...', 'info');
      
      try {
        const bucket = 'assets'; // Defaulting to 'assets' bucket
        const fileName = `${projectId}/${vId}-${Date.now()}-${file.name}`;
        const filePath = `motion/${fileName}`;

        // Verify bucket existence (check assets first, then fallback)
        let { error: bucketErr } = await window.supabaseClient.storage.getBucket(bucket);
        let activeBucket = bucket;
        if (bucketErr) {
            console.warn('Bucket "assets" not found, falling back to "thumbnails"');
            activeBucket = 'thumbnails';
        }

        const { data, error } = await window.supabaseClient.storage.from(activeBucket).upload(filePath, file);
        if (error) throw error;

        const { data: { publicUrl } } = window.supabaseClient.storage.from(activeBucket).getPublicUrl(filePath);
        
        const isVideo = file.type.startsWith('video/');
        const isDoc = !isVideo;

        onComplete({
          url: publicUrl,
          name: file.name,
          type: isVideo ? 'video' : 'document',
          contentType: file.type
        });
        
        if (window.showToast) window.showToast('Upload complete!', 'success');
      } catch (err) {
        console.error(err);
        if (window.showToast) window.showToast(`Upload failed: ${err.message}`, 'error');
      }
    };
    input.click();
  };

  // --- HTML LAYOUTS ---
  const gridLayout = `
    <div class="h-full overflow-y-auto bg-bg-canvas">
      <div class="max-w-7xl mx-auto p-10">
        <header class="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
          <div>
            <h1 class="text-3xl font-bold text-text-dark mb-1">Motion</h1>
            <p class="text-sm text-text-muted">Manage and review motion video deliverables for this project.</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 bg-white rounded-lg p-1 shadow-subtle border border-border-light">
               <select id="filter-aspect" class="bg-transparent text-[10px] font-bold uppercase tracking-widest text-text-muted border-none focus:ring-0 cursor-pointer px-3 py-1.5 outline-none hover:text-text-dark transition-colors">
                  <option value="All">ALL ASPECTS</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
               </select>
               <div class="w-px h-4 bg-border-light mx-1"></div>
               <select id="filter-fps" class="bg-transparent text-[10px] font-bold uppercase tracking-widest text-text-muted border-none focus:ring-0 cursor-pointer px-3 py-1.5 outline-none hover:text-text-dark transition-colors">
                  <option value="All">ALL FPS</option>
                  <option value="24">24 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
               </select>
            </div>
            <button id="mp-new-proj-btn" class="bg-brand hover:bg-opacity-90 text-white font-bold py-2.5 px-6 rounded-lg smooth-transition shadow-sm flex items-center gap-2 text-xs uppercase tracking-widest ${window.activeRole === 'client' ? 'hidden' : ''}">
              + New Project
            </button>
          </div>
        </header>
        <div id="mp-grid-container" class="grid grid-cols-1 gap-8">
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
          <div class="grid grid-cols-1 gap-4">
             <div>
                <label class="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Project Title</label>
                <input type="text" id="mp-new-title" class="w-full p-3 bg-bg-canvas border border-border-light rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand smooth-transition" placeholder="e.g. Q3 Explainer Video">
             </div>
             <div>
                <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Client</label>
                <select id="mp-new-client" class="w-full p-3 bg-bg-canvas border border-border-light rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand smooth-transition font-bold text-text-dark">
                   <option value="Acme Corp">Acme Corp</option>
                   <option value="Globex">Globex</option>
                   <option value="Initech">Initech</option>
                </select>
             </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
             <div>
                <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Aspect Ratio</label>
                <select id="mp-new-aspect" class="w-full p-3 bg-bg-canvas border border-border-light rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand smooth-transition font-bold text-text-dark">
                   <option value="16:9">16:9 (Widescreen)</option>
                   <option value="9:16">9:16 (Vertical/Social)</option>
                   <option value="1:1">1:1 (Square)</option>
                </select>
             </div>
             <div>
                <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Frame Rate (FPS)</label>
                <select id="mp-new-fps" class="w-full p-3 bg-bg-canvas border border-border-light rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand smooth-transition font-bold text-text-dark">
                   <option value="24">24 FPS (Cinematic)</option>
                   <option value="30">30 FPS (Standard)</option>
                   <option value="60">60 FPS (Smooth)</option>
                </select>
             </div>
          </div>

          <div>
             <label class="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Video Delivery Link (YT/Vimeo/Drive)</label>
             <input type="text" id="mp-new-link" class="w-full p-3 bg-bg-canvas border border-border-light rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand smooth-transition font-mono text-sm" placeholder="https://vimeo.com/...">
             <span id="mp-err-link" class="text-[10px] text-red-500 font-bold uppercase mt-1 hidden tracking-wider">Invalid Video URL Provided</span>
          </div>
        </div>
        <div class="p-6 bg-gray-50 border-t border-border-light flex justify-end gap-3 px-8">
          <button id="mp-cancel-modal" class="px-6 py-2 pb-2 text-text-muted font-bold text-xs uppercase tracking-widest hover:text-text-dark rounded-lg smooth-transition">Cancel</button>
          <button id="mp-create-modal" class="bg-brand hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest py-2.5 px-8 rounded-lg shadow-sm smooth-transition">Create Project</button>
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
        // Card wrapper styling: Standard minimalist look
        card.className = 'bg-white rounded-lg border border-border-light hover:shadow-subtle hover:border-brand/40 transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden';
        
        const latestV = proj.versions[proj.versions.length - 1];
        let statusBadge = 'badge-yellow';
        if(proj.status.toUpperCase() === 'DELIVERED') statusBadge = 'badge-green';
        if(proj.status.toUpperCase() === 'IN REVIEW') statusBadge = 'badge-purple';
        
        card.innerHTML = `
          <!-- Delete/Duplicate Context Actions (Hidden for client) -->
          <div class="absolute top-4 right-4 flex items-center gap-1 z-30 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 ${window.activeRole === 'client' ? 'hidden' : ''}">
             <button class="p-2 bg-white/90 backdrop-blur rounded-[8px] text-gray-500 hover:text-brand shadow-sm hover:bg-white" onclick="event.stopPropagation(); window.duplicateMotionProj('${proj.id}')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
             <button class="p-2 bg-white/90 backdrop-blur rounded-[8px] text-gray-500 hover:text-red-500 shadow-sm hover:bg-white" onclick="event.stopPropagation(); window.deleteMotionProj('${proj.id}')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
          </div>
          
          <div class="w-full aspect-video bg-black relative flex items-center justify-center overflow-hidden">
            <img src="https://images.unsplash.com/photo-1492691523567-6170c8173461?q=80&w=600&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700">
            <div class="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
            
            <!-- Play Button Overlay -->
            <div class="z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:scale-110 group-hover:bg-brand group-hover:border-brand transition-all">
               <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            
            <!-- Badges -->
            <div class="absolute top-2 left-2 z-20">
               <span class="badge ${statusBadge}">${proj.status}</span>
            </div>
            <div class="absolute bottom-2 left-2 z-20 flex gap-1 justify-start">
              <span class="bg-black/40 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">${proj.aspectRatio}</span>
              <span class="bg-black/40 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">${proj.fps} FPS</span>
            </div>
          </div>
          
          <!-- Card Details -->
          <div class="p-4 flex-1 flex flex-col">
            <h3 class="font-bold text-text-dark text-[15px] group-hover:text-brand transition-colors mb-0.5 leading-tight">${proj.title}</h3>
            <p class="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-4">${proj.client}</p>
            
            <div class="flex items-center justify-between text-[11px] text-text-muted mt-auto mb-4 font-medium">
               <span>Latest: <span class="font-bold text-text-dark">${latestV.vId}</span></span>
               <span>${new Date().toLocaleDateString()}</span>
            </div>
            
            <div class="flex items-center justify-between pt-4 border-t border-border-light">
               <div class="flex -space-x-1.5">
                  <div class="w-6 h-6 rounded-full border-2 border-white bg-bg-canvas flex items-center justify-center text-[8px] font-bold">A</div>
                  <div class="w-6 h-6 rounded-full border-2 border-white bg-bg-canvas flex items-center justify-center text-[8px] font-bold text-brand">B</div>
               </div>
               <span class="text-[9px] font-bold text-text-muted group-hover:text-brand uppercase tracking-widest flex items-center gap-1.5 transition-colors">
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
        <div class="h-full flex flex-col bg-bg-canvas">
          <header class="h-16 px-8 bg-white border-b border-border-light flex items-center justify-between z-10 shrink-0">
             <div class="flex items-center gap-4">
                <button id="mp-back-btn" class="p-2 -ml-2 text-text-muted hover:text-brand rounded-lg hover:bg-bg-canvas smooth-transition">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div class="w-px h-6 bg-border-light"></div>
                <div>
                   <h1 class="text-lg font-bold text-text-dark leading-none">${proj.title}</h1>
                   <div class="flex items-center gap-2 mt-1.5">
                      <span class="text-[9px] font-bold text-text-muted uppercase tracking-wider">${proj.client}</span>
                      <span class="w-1 h-1 rounded-full bg-border-light"></span>
                      <span class="text-[9px] font-bold text-brand uppercase tracking-wider">${proj.aspectRatio} • ${proj.fps} FPS</span>
                   </div>
                </div>
             </div>
             <div class="flex gap-3">
                <button id="deliver-version-btn" class="bg-brand hover:opacity-90 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm transition-all flex items-center gap-2 ${window.activeRole === 'client' ? 'hidden' : ''}">
                  Deliver ${activeVersion.vId}
                </button>
             </div>
          </header>

          <div class="p-8 flex-1 overflow-y-auto">
             <div class="max-w-5xl mx-auto flex flex-col">
                
                <div class="flex gap-2 mb-8 border-b border-border-light">
                  ${proj.versions.map(v => `
                    <button onclick="window.setActiveVersion('${v.vId}')" 
                            class="px-4 py-3 font-bold uppercase tracking-widest text-[11px] smooth-transition border-b-2
                            ${v.vId === currentActiveVId ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-dark'}">
                      V${v.vId.replace('v', '')}
                    </button>
                  `).join('')}
                  
                  <button id="mp-add-version-btn" class="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-brand hover:opacity-80 border-b-2 border-transparent ${window.activeRole === 'client' ? 'hidden' : ''}">
                    + Link Embed
                  </button>
                  <button id="mp-upload-version-btn" class="px-4 py-3 font-bold uppercase tracking-widest text-[11px] text-brand hover:opacity-80 border-b-2 border-transparent ${window.activeRole === 'client' ? 'hidden' : ''}">
                    + Upload File
                  </button>
                </div>

                <div class="bg-white rounded-xl shadow-subtle overflow-hidden border border-border-light flex flex-col relative">
                   <div class="p-3 bg-gray-50 border-b border-border-light flex justify-between items-center px-6">
                      <span class="text-[9px] font-bold uppercase tracking-widest text-text-muted">STATUS: ${activeVersion.status}</span>
                      ${activeVersion.dlUrl ? `<button onclick="window.open('${activeVersion.dlUrl}', '_blank')" class="text-[9px] font-bold text-brand uppercase tracking-widest hover:opacity-80 flex items-center gap-1"><svg class="w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Download</button>` : ''}
                   </div>
                   <!-- Video/Doc/Embed Content Area -->
                   <div class="aspect-video bg-black relative flex items-center justify-center">
                      ${activeVersion.type === 'document' ? `
                         <div class="flex flex-col items-center gap-6">
                            <div class="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-brand">
                               <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </div>
                            <div class="text-center">
                               <h3 class="text-white font-bold mb-1">${activeVersion.file_name || 'Document Version'}</h3>
                               <p class="text-gray-500 text-[10px] uppercase font-black tracking-widest">In-App Preview Ready</p>
                            </div>
                            <button onclick="window.openDocPreview('${activeVersion.fileUrl || activeVersion.embedUrl}', '${activeVersion.file_name || 'Document View'}')" class="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">Preview Document</button>
                         </div>
                      ` : (activeVersion.fileUrl && activeVersion.fileUrl.match(/\.(mp4|mov|webm)$|video/i)) ? `
                         <video src="${activeVersion.fileUrl}" controls class="absolute inset-0 w-full h-full object-contain"></video>
                      ` : `
                         <iframe src="${activeVersion.embedUrl}" class="absolute inset-0 w-full h-full" border="0" allowfullscreen></iframe>
                      `}
                   </div>
                   
                   <!-- Feedback Section -->
                   <div class="p-8">
                      <h4 class="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-6">Feedback for ${activeVersion.vId}</h4>
                      
                      <!-- Thread List -->
                      <div class="space-y-4" id="mp-thread-${activeVersion.vId}">
                         ${(activeVersion.thread || []).map(comment => `
                            <div class="flex gap-4 items-start animate-slide-up">
                               <div class="w-8 h-8 rounded-full bg-text-dark text-white flex items-center justify-center font-bold text-xs">${comment.user.charAt(0)}</div>
                               <div class="flex-1 bg-bg-canvas p-4 rounded-lg border border-border-light">
                                  <p class="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-1">${comment.user} <span class="text-border-light px-1">•</span> ${comment.time}</p>
                                  ${comment.audioUrl ? 
                                    window.renderAudioPlayer ? window.renderAudioPlayer(comment.audioUrl, comment.user) : `<audio src="${comment.audioUrl}" controls></audio>` 
                                    : `<p class="text-sm text-text-dark leading-relaxed">${comment.text}</p>`}
                               </div>
                            </div>
                         `).join('')}
                         ${!(activeVersion.thread && activeVersion.thread.length) ? '<div class="py-8 text-center text-[13px] text-text-muted font-medium italic">No feedback for this version yet.</div>' : ''}
                      </div>

                      <!-- Feedback Input Bar -->
                      <div class="mt-8 relative w-full items-center">
                         <input type="text" id="mp-comment-input" placeholder="Type a note..." class="w-full pl-5 pr-14 py-3 bg-white border border-border-light hover:border-brand/40 rounded-lg shadow-sm text-sm text-text-dark focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all">
                         
                         <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-9 h-9">
                            <button id="mp-mic-btn" class="absolute inset-0 flex items-center justify-center text-text-muted hover:text-brand transition-all scale-100 opacity-100" title="Voice Note">
                               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                            </button>
                            <button id="mp-send-btn" class="absolute inset-0 flex items-center justify-center text-white bg-brand hover:opacity-90 rounded-lg transition-all scale-50 opacity-0 pointer-events-none">
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
         };
     }

     // Wiring Upload Version
     const uploadVerBtn = document.getElementById('mp-upload-version-btn');
     if(uploadVerBtn) {
        uploadVerBtn.onclick = () => {
           window.handleMPUpload(proj.id, 'v' + (proj.versions.length + 1), (fileData) => {
              const prevState = JSON.stringify(window.globalMotionProjects);
              const nextVId = 'v' + (proj.versions.length + 1);
              
              proj.versions.push({ 
                vId: nextVId, 
                status: 'Draft', 
                type: fileData.type,
                fileUrl: fileData.url,
                file_name: fileData.name,
                embedUrl: fileData.url, 
                dlUrl: fileData.url, 
                thread: [] 
              });
              
              const nextState = JSON.stringify(window.globalMotionProjects);
              pushToHistory('Upload Version',
                () => { window.globalMotionProjects = JSON.parse(prevState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); },
                () => { window.globalMotionProjects = JSON.parse(nextState); renderProjectView(window.globalMotionProjects.find(p=>p.id===proj.id)); }
              );
              saveMotionState();
              currentActiveVId = nextVId;
              renderProjectView(proj);
           });
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
        if(window.dbInsert) {
           (async () => {
              const { data: { user } } = await window.supabaseClient.auth.getUser();
              const userId = user?.id || null;
              const dbPayload = {
                  id: trashId,
                  type: payload.type,
                  title: payload.title,
                  project: payload.project,
                  payload: payload.data,
                  ...(userId && { user_id: userId })
              };
              window.dbInsert('trash', dbPayload);
           })();
        }
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

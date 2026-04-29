window.initMotionProjects = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;
  
  if (!project.data?.motionProjects) {
    project.data = project.data || {};
    project.data.motionProjects = [];
  }
  window.globalMotionProjects = project.data.motionProjects;

  const saveMotionState = async () => {
    project.data.motionProjects = window.globalMotionProjects;
    if(window.dbUpdate && _projectId) await window.dbUpdate('projects', _projectId, { data: project.data });
  };
  
  // Override Topbar for Motion View
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-[#1A1916] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Motion Projects</span>
        </div>
        <button id="mp-new-proj-btn" class="p-2 text-[#6B21FF] hover:opacity-80 transition-all">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
        </button>
     `;
     document.getElementById('mp-new-proj-btn').onclick = () => window.showNewMotionModal();
  }

  function renderGrid() {
     if (window.globalMotionProjects.length === 0) {
        return `
           <div class="flex flex-col items-center justify-center py-40 text-center px-10">
              <div class="w-24 h-24 bg-white rounded-[40px] shadow-card border border-border-light flex items-center justify-center mb-8">
                 <svg class="w-10 h-10 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <h2 class="text-2xl font-black text-text-main mb-3 font-['Cabinet_Grotesk']">No motion yet</h2>
              <p class="text-sm text-text-muted font-medium max-w-xs leading-relaxed opacity-60">Upload your first video project to start reviewing with clients.</p>
           </div>
        `;
     }

     return `
        <div class="grid grid-cols-1 gap-8 p-8 pb-32">
           ${window.globalMotionProjects.map((proj, idx) => `
              <div onclick="window.viewMotionProject('${proj.id}')" class="bg-white rounded-[40px] border border-border-light shadow-subtle overflow-hidden group active:scale-[0.98] transition-all duration-300 cursor-pointer">
                 <div class="relative aspect-video bg-black overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1492691523567-6170c8173461?q=80&w=600&auto=format&fit=crop" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    <!-- Status Badge -->
                    <div class="absolute top-6 left-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
                      <span class="text-[9px] font-black text-white uppercase tracking-widest">In Review</span>
                    </div>

                    <div class="absolute bottom-6 left-6">
                       <h3 class="text-2xl font-black text-white font-['Cabinet_Grotesk'] leading-tight">${proj.title}</h3>
                       <div class="flex items-center gap-2 mt-2">
                          <span class="text-[10px] font-black text-white/60 uppercase tracking-widest">${proj.aspectRatio}</span>
                          <div class="w-1 h-1 rounded-full bg-white/20"></div>
                          <span class="text-[10px] font-black text-white/60 uppercase tracking-widest">${proj.fps} FPS</span>
                       </div>
                    </div>

                    <!-- Play Icon Overlay -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       <div class="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/30">
                          <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                       </div>
                    </div>

                    <button class="absolute top-6 right-6 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                 </div>
                 <div class="p-8 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl bg-bg-soft flex items-center justify-center text-primary">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                       </div>
                       <div>
                          <div class="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 opacity-60">Version History</div>
                          <div class="text-sm font-black text-text-main font-['Cabinet_Grotesk']">v${proj.versions.length}.0 Stable</div>
                       </div>
                    </div>
                    <div class="flex -space-x-3">
                       ${['https://i.pravatar.cc/100?u=1', 'https://i.pravatar.cc/100?u=2', 'https://i.pravatar.cc/100?u=3'].map(src => `<img src="${src}" class="w-10 h-10 rounded-full border-4 border-white shadow-sm object-cover">`).join('')}
                    </div>
                 </div>
              </div>
           `).join('')}
        </div>
     `;
  }

  container.innerHTML = `
     <div class="view-container animate-fade-in bg-[#FDFCFB]">
        ${renderGrid()}
     </div>
  `;

  window.viewMotionProject = function(id) {
     const proj = window.globalMotionProjects.find(p => p.id === id);
     if (!proj) return;
     renderProjectDetail(proj);
  };

  function renderProjectDetail(proj) {
     const activeV = proj.versions[proj.versions.length - 1];
     
     container.innerHTML = `
        <div class="view-container animate-fade-in bg-bg-canvas pb-32">
           <header class="h-20 border-b border-border-light px-8 flex items-center justify-between z-50 bg-white sticky top-0 shrink-0">
              <div class="flex items-center gap-6">
                 <button onclick="window.initMotionProjects(document.getElementById('m-view-container'), null, '${_projectId}')" 
                   class="p-3 bg-bg-soft rounded-2xl text-gray-400 hover:text-primary active:scale-95 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <div class="flex flex-col">
                   <span class="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-0.5">Motion Review</span>
                   <h2 class="text-xl font-black text-text-main font-['Cabinet_Grotesk']">${proj.title}</h2>
                 </div>
              </div>
              <div class="flex gap-2 p-1.5 bg-bg-soft rounded-2xl border border-border-light">
                 ${proj.versions.map((v, i) => `
                    <button class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${i === proj.versions.length-1 ? 'bg-primary text-white shadow-card' : 'text-text-muted hover:text-primary'}">V${i+1}</button>
                 `).join('')}
                 <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border-light text-primary shadow-subtle hover:scale-105 active:scale-90 transition-all">
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                 </button>
              </div>
           </header>

           <div class="p-8 max-w-4xl mx-auto space-y-8">
              <div class="bg-black aspect-video rounded-[48px] overflow-hidden shadow-floating border-8 border-white relative flex items-center justify-center group">
                 <iframe src="${activeV.embedUrl}" class="absolute inset-0 w-full h-full border-none"></iframe>
              </div>

              <!-- Action Bar / Info Cards -->
              <div class="grid grid-cols-2 gap-6">
                <div class="bento-card bg-primary p-6 text-white border-none flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Download</span>
                    <span class="text-lg font-black font-['Cabinet_Grotesk']">Master File</span>
                  </div>
                  <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  </div>
                </div>
                <div class="bento-card p-6 flex items-center justify-between bg-white border border-border-light group cursor-pointer active:scale-95 transition-all">
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black text-text-muted opacity-60 uppercase tracking-widest mb-1">Due Date</span>
                    <span class="text-lg font-black text-text-main font-['Cabinet_Grotesk']">Oct 24, 2024</span>
                  </div>
                  <div class="w-12 h-12 bg-bg-soft rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
              </div>

              <div class="space-y-6 pt-4">
                 <div class="flex items-center justify-between">
                   <h3 class="text-2xl font-black text-text-main font-['Cabinet_Grotesk']">Feedback Loop</h3>
                   <div class="px-4 py-2 bg-green-50 text-green-600 rounded-full flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <span class="text-[10px] font-black uppercase tracking-widest">Client Active</span>
                   </div>
                 </div>
                 
                 <div class="space-y-6">
                    ${(activeV.thread || []).map(cmt => `
                       <div class="bg-white p-8 rounded-[40px] border border-border-light shadow-subtle relative group overflow-hidden">
                          <div class="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div class="flex items-center gap-4 mb-6">
                             <div class="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">${cmt.user[0].toUpperCase()}</div>
                             <div>
                                <div class="text-[10px] font-black text-text-main uppercase tracking-widest">${cmt.user}</div>
                                <div class="text-[9px] font-bold text-gray-300 mt-0.5">${cmt.time}</div>
                             </div>
                          </div>
                          <p class="text-[15px] text-text-muted leading-relaxed font-medium">${cmt.text}</p>
                       </div>
                    `).join('')}
                    ${!(activeV.thread?.length) ? `
                      <div class="bg-white/50 border-2 border-dashed border-border-light rounded-[40px] py-16 text-center">
                        <div class="w-16 h-16 bg-white rounded-3xl shadow-subtle border border-border-light flex items-center justify-center mx-auto mb-6">
                          <svg class="w-8 h-8 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                        </div>
                        <p class="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">No feedback yet</p>
                      </div>
                    ` : ''}
                 </div>
              </div>

              <!-- Action Bar -->
              <div class="fixed bottom-28 left-8 right-8 flex gap-4 z-[100] animate-slide-up">
                 <div class="flex-1 relative">
                   <input id="mp-comment-input" type="text" placeholder="Add a review note..." 
                     class="w-full pl-8 pr-16 py-5 bg-white border border-border-light rounded-[32px] shadow-floating outline-none text-sm font-bold text-text-main placeholder:text-gray-300 focus:ring-4 focus:ring-primary/5 transition-all">
                   <button class="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors">
                     <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                   </button>
                 </div>
                 <button onclick="window.sendMPComment('${proj.id}')" class="w-16 h-16 bg-primary text-white rounded-[32px] flex items-center justify-center shadow-floating hover:brightness-110 active:scale-95 transition-all">
                    <svg class="w-6 h-6 rotate-45 -mt-1 -mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                 </button>
              </div>
           </div>
        </div>
     `;

     window.sendMPComment = async function(pid) {
        const input = document.getElementById('mp-comment-input');
        if (input && input.value.trim()) {
           const proj = window.globalMotionProjects.find(p => p.id === pid);
           const activeV = proj.versions[proj.versions.length - 1];
           if (!activeV.thread) activeV.thread = [];
           
           activeV.thread.push({
              id: Date.now().toString(),
              user: window.appData?.user?.email || 'Designer',
              time: 'Just now',
              text: input.value.trim()
           });
           
           await saveMotionState();
           renderProjectDetail(proj);
           if (window.showToast) window.showToast('Feedback added');
        }
     };
  }

  window.showNewMotionModal = function() {
     const overlay = document.getElementById('m-bottom-sheet-overlay');
     const sheet = document.getElementById('m-bottom-sheet');
     const content = document.getElementById('m-bottom-sheet-content');
 
     content.innerHTML = `
        <div class="space-y-8 p-4">
           <div class="flex flex-col">
             <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Creator</span>
             <h2 class="text-3xl font-black text-text-main font-['Cabinet_Grotesk']">New Motion Project</h2>
           </div>

           <div class="space-y-6">
             <div class="flex flex-col gap-2">
               <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Project Name</label>
               <input id="mp-title-input" type="text" placeholder="e.g. Summer Campaign V1" 
                 class="w-full p-6 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-sm text-text-main focus:ring-4 focus:ring-primary/5 transition-all">
             </div>

             <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Aspect Ratio</label>
                  <select id="mp-aspect-input" class="w-full p-6 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-xs uppercase tracking-widest appearance-none">
                     <option>16:9 Wide</option>
                     <option>9:16 Vertical</option>
                     <option>1:1 Square</option>
                  </select>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Frame Rate</label>
                  <select id="mp-fps-input" class="w-full p-6 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-xs uppercase tracking-widest appearance-none">
                     <option>24 FPS</option>
                     <option>30 FPS</option>
                     <option>60 FPS</option>
                  </select>
                </div>
             </div>

             <div class="flex flex-col gap-2">
               <label class="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Video Source (Embed Link)</label>
               <input id="mp-url-input" type="text" placeholder="Paste YouTube or Vimeo URL" 
                 class="w-full p-6 rounded-3xl bg-bg-soft border border-border-light outline-none font-bold text-sm text-text-main focus:ring-4 focus:ring-primary/5 transition-all">
             </div>
           </div>

           <button onclick="window.confirmCreateMotion()" 
             class="w-full py-6 bg-primary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-floating hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
             Initialize Project
           </button>
        </div>
     `;

     overlay.classList.remove('hidden');
     sheet.classList.remove('translate-y-full');

     window.confirmCreateMotion = async function() {
        const title = document.getElementById('mp-title-input').value;
        const aspect = document.getElementById('mp-aspect-input').value;
        const fps = document.getElementById('mp-fps-input').value;
        const url = document.getElementById('mp-url-input').value;

        if (title && url) {
           const newProj = {
              id: 'mp' + Date.now(),
              title,
              aspectRatio: aspect,
              fps,
              versions: [{ vId: 'v1', status: 'Draft', embedUrl: url, thread: [] }]
           };
           window.globalMotionProjects.push(newProj);
           await saveMotionState();
           overlay.classList.add('hidden');
           sheet.classList.add('translate-y-full');
           window.initMotionProjects(container, socket, _projectId);
           if (window.showToast) window.showToast('Motion project created');
        }
     };
  };
};
;
};

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
           <div class="flex flex-col items-center justify-center py-40 text-center opacity-40 px-10">
              <div class="w-20 h-20 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                 <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">No motion projects yet</p>
           </div>
        `;
     }

     return `
        <div class="grid grid-cols-1 gap-6 p-6 pb-32">
           ${window.globalMotionProjects.map((proj, idx) => `
              <div onclick="window.viewMotionProject('${proj.id}')" class="bg-white rounded-[40px] border border-gray-100 shadow-premium overflow-hidden group active:scale-[0.98] transition-all">
                 <div class="relative aspect-video bg-black">
                    <img src="https://images.unsplash.com/photo-1492691523567-6170c8173461?q=80&w=600&auto=format&fit=crop" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-6 left-6">
                       <h3 class="text-xl font-bold text-white font-['Cabinet_Grotesk']">${proj.title}</h3>
                       <div class="flex items-center gap-2 mt-1">
                          <span class="text-[9px] font-black text-white/70 uppercase tracking-widest">${proj.aspectRatio}</span>
                          <span class="w-1 h-1 rounded-full bg-white/30"></span>
                          <span class="text-[9px] font-black text-white/70 uppercase tracking-widest">${proj.fps} FPS</span>
                       </div>
                    </div>
                    <div class="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                       <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                 </div>
                 <div class="p-6 flex items-center justify-between">
                    <div>
                       <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">LATEST VERSION</div>
                       <div class="text-xs font-bold text-[#1A1916]">Version ${proj.versions.length}</div>
                    </div>
                    <div class="flex -space-x-2">
                       ${Array.from({length: 3}).map(() => `<div class="w-8 h-8 rounded-full border-2 border-white bg-gray-100"></div>`).join('')}
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
        <div class="view-container animate-fade-in bg-[#FDFCFB] pb-32">
           <div class="p-6 border-b border-gray-50 bg-white sticky top-0 z-20">
              <div class="flex items-center gap-4 mb-4">
                 <button onclick="window.initMotionProjects(document.getElementById('m-view-container'), null, '${_projectId}')" class="p-2 -ml-2 text-gray-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
                 </button>
                 <h2 class="text-2xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']">${proj.title}</h2>
              </div>
              <div class="flex gap-2 overflow-x-auto no-scrollbar">
                 ${proj.versions.map((v, i) => `
                    <button class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${i === proj.versions.length-1 ? 'bg-[#6B21FF] text-white shadow-lg shadow-purple-100' : 'bg-gray-50 text-gray-400'}">V${i+1}</button>
                 `).join('')}
                 <button class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#F4F3FF] text-[#6B21FF]">+ New</button>
              </div>
           </div>

           <div class="p-6">
              <div class="bg-black aspect-video rounded-[32px] overflow-hidden shadow-2xl relative flex items-center justify-center group mb-8">
                 <iframe src="${activeV.embedUrl}" class="absolute inset-0 w-full h-full border-none"></iframe>
              </div>

              <div class="mb-8">
                 <h3 class="text-lg font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-6">Feedback Loop</h3>
                 <div class="space-y-4">
                    ${(activeV.thread || []).map(cmt => `
                       <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-premium">
                          <div class="flex items-center gap-3 mb-3">
                             <div class="w-8 h-8 rounded-xl bg-[#F4F3FF] flex items-center justify-center text-[#6B21FF] font-black text-[10px]">${cmt.user[0]}</div>
                             <div>
                                <div class="text-[10px] font-black text-[#1A1916] uppercase tracking-widest">${cmt.user}</div>
                                <div class="text-[8px] font-medium text-gray-300">${cmt.time}</div>
                             </div>
                          </div>
                          <p class="text-sm text-gray-500 leading-relaxed">${cmt.text}</p>
                       </div>
                    `).join('')}
                    ${!(activeV.thread?.length) ? '<p class="text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">No feedback yet</p>' : ''}
                 </div>
              </div>

              <!-- Action Bar -->
              <div class="fixed bottom-28 left-6 right-6 flex gap-3 z-[100]">
                 <input id="mp-comment-input" type="text" placeholder="Add a note..." class="flex-1 px-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-premium outline-none text-sm font-medium">
                 <button onclick="window.sendMPComment('${proj.id}')" class="w-16 h-16 bg-[#6B21FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
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
        <div class="space-y-6">
           <h2 class="text-2xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']">New Motion Project</h2>
           <input id="mp-title-input" type="text" placeholder="Project Title" class="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm">
           <div class="grid grid-cols-2 gap-4">
              <select id="mp-aspect-input" class="p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-[10px] uppercase tracking-widest">
                 <option>16:9</option>
                 <option>9:16</option>
                 <option>1:1</option>
              </select>
              <select id="mp-fps-input" class="p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-[10px] uppercase tracking-widest">
                 <option>24 FPS</option>
                 <option>30 FPS</option>
                 <option>60 FPS</option>
              </select>
           </div>
           <input id="mp-url-input" type="text" placeholder="Embed URL (YouTube/Vimeo)" class="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm">
           <button onclick="window.confirmCreateMotion()" class="w-full py-4 bg-[#6B21FF] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200">Create Project</button>
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

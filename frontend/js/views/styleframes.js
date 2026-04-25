window.initStyleFrames = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;

  // Ensure data structure exists
  if (!project.data) project.data = {};
  if (!project.data.styleframes) project.data.styleframes = [];

  // Override Topbar for Style Frames View (Image 4 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-[#1A1916] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Style Frames</span>
        </div>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        </button>
     `;
  }

  const currentTab = window._styleTab || 'All';

  function renderTabs() {
     return `
        <div class="flex items-center gap-8 overflow-x-auto no-scrollbar px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-50">
           ${['All', 'Drafts', 'Sent', 'Archived'].map(t => `
              <button onclick="window.switchStyleTab('${t}')" class="relative pb-2 text-[11px] font-black uppercase tracking-widest transition-colors ${currentTab === t ? 'text-[#6B21FF]' : 'text-gray-400 hover:text-gray-600'}">
                 ${t}
                 ${currentTab === t ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-[#6B21FF] rounded-t-full animate-in slide-in-from-left-1/2"></div>' : ''}
              </button>
           `).join('')}
        </div>
     `;
  }

  function renderFeed() {
     const frames = project.data.styleframes || [];

     if (frames.length === 0) {
        return `
           <div class="flex flex-col items-center justify-center py-40 text-center opacity-40">
              <div class="w-20 h-20 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                 <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"></path></svg>
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">No style frames uploaded</p>
           </div>
        `;
     }

     return frames.map((frame, index) => `
        <div class="px-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: ${index * 100}ms">
           <div class="relative w-full aspect-[4/3] rounded-[40px] overflow-hidden shadow-premium group mb-4">
              <img src="${frame.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
              <div class="absolute top-6 left-6 w-12 h-12 bg-[#6B21FF] text-white rounded-2xl flex items-center justify-center font-bold font-['Cabinet_Grotesk'] text-lg shadow-lg">
                 ${(index + 1).toString().padStart(2, '0')}
              </div>
              <div class="absolute top-6 right-6 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-[#1A1916]">
                 ${frame.status || 'v1.0'}
              </div>
           </div>
           <div class="flex items-start justify-between px-2">
              <div>
                 <h3 class="text-xl font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-1">${frame.title || 'Untitled Frame'}</h3>
                 <div class="flex items-center gap-2">
                    <span class="text-[10px] font-medium text-gray-400">Created by</span>
                    <span class="text-[10px] font-bold text-[#1A1916]">${frame.creator || 'Me'}</span>
                 </div>
              </div>
              <button onclick="window.deleteStyleFrame('${frame.id}')" class="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
           </div>
        </div>
     `).join('');
  }

  container.innerHTML = `
    <div class="view-container animate-fade-in pb-24 bg-[#FDFCFB]">
       ${renderTabs()}
       <div class="pt-8">
          ${renderFeed()}
       </div>
       
       <!-- Add New FAB -->
       <button id="add-scene-btn" onclick="window.uploadStyleFrame()" class="fixed bottom-28 right-6 w-16 h-16 bg-[#6B21FF] text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-purple-200 z-[100] active:scale-95 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
       </button>
    </div>
  `;

  window.switchStyleTab = function(tab) {
     window._styleTab = tab;
     window.initStyleFrames(container, socket, _projectId);
  };

  window.uploadStyleFrame = function() {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = 'image/*';
     input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (window.showToast) window.showToast('Uploading frame...', 'info');

        try {
           const fileName = `${Date.now()}-${file.name}`;
           const filePath = `styleframes/${_projectId}/${fileName}`;
           
           const { data, error } = await window.supabaseClient.storage
              .from('assets')
              .upload(filePath, file);

           if (error) throw error;

           const { data: { publicUrl } } = window.supabaseClient.storage
              .from('assets')
              .getPublicUrl(filePath);

           const newFrame = {
              id: Date.now().toString(),
              title: file.name.split('.')[0],
              img: publicUrl,
              creator: window.appData?.user?.email || 'Me',
              status: 'v1.0'
           };

           project.data.styleframes.push(newFrame);
           await saveStyleFrames();
           window.initStyleFrames(container, socket, _projectId);
           if (window.showToast) window.showToast('Frame uploaded');
        } catch (err) {
           console.error(err);
           if (window.showToast) window.showToast('Upload failed', 'error');
        }
     };
     input.click();
  };

  window.deleteStyleFrame = async function(id) {
     if (confirm('Delete this frame?')) {
        project.data.styleframes = project.data.styleframes.filter(f => f.id !== id);
        await saveStyleFrames();
        window.initStyleFrames(container, socket, _projectId);
     }
  };

  async function saveStyleFrames() {
     if (window.dbUpdate) {
        await window.dbUpdate('projects', _projectId, { styleframes: project.data.styleframes });
     }
  }
};

window.initStyleFrames = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  // Override Topbar for Style Frames View (Image 4 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-text-dark transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Style Frames</span>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        </button>
     `;
  }

  function renderTabs() {
     return `
        <div class="flex items-center gap-8 overflow-x-auto scrollbar-hide px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-50">
           ${['All', 'Drafts', 'Sent', 'Archived'].map((t, i) => `
              <button class="relative pb-2 text-[11px] font-black uppercase tracking-widest ${i === 0 ? 'text-[#6B21FF]' : 'text-gray-400'}">
                 ${t}
                 ${i === 0 ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-[#6B21FF] rounded-t-full"></div>' : ''}
              </button>
           `).join('')}
        </div>
     `;
  }

  function renderFeed() {
     const frames = [
        { id: '01', title: 'The Morning Fog', status: 'v1.0', creator: 'Elena Rodriguez', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop' },
        { id: '02', title: 'Obsidian Peaks', status: 'v1.2', creator: 'Marcus Chen', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop' }
     ];

     return frames.map(frame => `
        <div class="px-6 mb-10">
           <div class="relative w-full aspect-[4/3] rounded-[40px] overflow-hidden shadow-premium group mb-4">
              <img src="${frame.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
              <div class="absolute top-6 left-6 w-12 h-12 bg-[#6B21FF] text-white rounded-2xl flex items-center justify-center font-bold font-['Cabinet_Grotesk'] text-lg shadow-lg">
                 ${frame.id}
              </div>
              <div class="absolute top-6 right-6 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-[#1A1916]">
                 ${frame.status}
              </div>
           </div>
           <div class="flex items-start justify-between px-2">
              <div>
                 <h3 class="text-xl font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-1">${frame.title}</h3>
                 <div class="flex items-center gap-2">
                    <span class="text-[10px] font-medium text-gray-400">Created by</span>
                    <span class="text-[10px] font-bold text-[#1A1916]">${frame.creator}</span>
                 </div>
              </div>
              <button class="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
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
       <button id="add-scene-btn" class="fixed bottom-28 right-6 w-16 h-16 bg-[#6B21FF] text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-purple-200 z-[100] active:scale-95 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
       </button>
    </div>
  `;
};

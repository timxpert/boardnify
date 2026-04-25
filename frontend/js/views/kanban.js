window.initKanban = async function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  // Override Topbar for Progress View (Image 5 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-text-dark transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Technical Progress</span>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        </button>
     `;
  }

  function renderTabs() {
     return `
        <div class="flex items-center gap-8 overflow-x-auto scrollbar-hide px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-50">
           ${['In Progress', 'Completed', 'Backlog'].map((t, i) => `
              <button class="relative pb-2 text-[11px] font-black uppercase tracking-widest ${i === 0 ? 'text-[#6B21FF]' : 'text-gray-400'}">
                 ${t}
                 ${i === 0 ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-[#6B21FF] rounded-t-full"></div>' : ''}
              </button>
           `).join('')}
        </div>
     `;
  }

  function renderActivityFeed() {
     const tasks = [
        { id: 1, title: 'Optimizing Render Pipeline', status: 'Active Task', time: '12m ago', user: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop' },
        { id: 2, title: 'Fixing Physics Glitch', status: 'Blocked', time: '2h ago', user: 'Elena Rodriguez', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' },
        { id: 3, title: 'Particle System Refactor', status: 'Active Task', time: '4h ago', user: 'Sarah Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop' }
     ];

     return tasks.map(task => `
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-premium mb-4 group active:scale-[0.98] transition-all">
           <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                 <img src="${task.avatar}" class="w-10 h-10 rounded-2xl object-cover">
                 <div>
                    <h4 class="font-bold text-[#1A1916] font-['Cabinet_Grotesk'] leading-tight">${task.title}</h4>
                    <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">${task.user}</div>
                 </div>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${task.status === 'Blocked' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}">
                 ${task.status}
              </span>
           </div>
           <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">${task.time}</span>
              <button class="px-4 py-2 bg-[#F4F3FF] text-[#6B21FF] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#6B21FF] hover:text-white transition-all">MARK COMPLETED</button>
           </div>
        </div>
     `).join('');
  }

  container.innerHTML = `
    <div class="view-container animate-fade-in pb-32 bg-[#FDFCFB]">
       ${renderTabs()}
       <div class="p-6">
          <div class="mb-8">
             <h2 class="text-3xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']">Activity Feed</h2>
             <p class="text-[11px] font-medium text-gray-400 mt-1">Tracking 12 ongoing tasks for Project Delta.</p>
          </div>
          ${renderActivityFeed()}
       </div>

       <!-- FAB (Image 5 Style) -->
       <button id="add-task-global-btn" class="fixed bottom-28 right-6 w-16 h-16 bg-[#6B21FF] text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-purple-200 z-[100] active:scale-95 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
       </button>
    </div>
  `;
};

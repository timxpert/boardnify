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
  const user = window.appData?.user;
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  
  // Update Topbar for Dashboard (Hamburger Left, Logo Center, Search/Bell Right)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button id="mobile-menu-btn" class="p-2 text-[#1A1035]" onclick="window.toggleMobileSidebar()">
           <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <h2 class="font-bold text-xl tracking-tight text-[#1A1035]">Boardnify</h2>
        </div>
        <div class="flex items-center gap-1">
           <button class="p-2 text-[#1A1035]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </button>
           <button class="p-2 text-[#1A1035] relative">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <div class="absolute top-2 right-2 w-2 h-2 bg-[#6B46FA] rounded-full border-2 border-white"></div>
           </button>
        </div>
     `;
  }

  const projects = window.appData.projects || [];
  const stats = [
    { label: 'Active Boards', value: projects.length.toString(), color: 'bg-[#6B46FA]', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>' },
    { label: 'Total Tasks', value: projects.reduce((acc, p) => acc + (p.data?.tasks?.length || 0), 0).toString(), color: 'bg-[#00D1FF]', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>' },
    { label: 'Team Members', value: '12', color: 'bg-[#FFB800]', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>' },
    { label: 'New Comments', value: '08', color: 'bg-[#FF4D4D]', icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>' }
  ];

  container.innerHTML = `
    <div class="view-container p-6 pb-24 animate-fade-in bg-white">
      <header class="mb-10">
        <h1 class="text-3xl font-bold text-[#1A1035] tracking-tight mb-2">Hello, ${firstName}!</h1>
        <p class="text-[#6B6B6B] text-sm font-medium">Ready to take on your creative projects?</p>
      </header>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4 mb-10">
        ${stats.map(stat => `
          <div class="p-5 bg-[#F5F4FF] rounded-[28px] flex flex-col justify-between aspect-square">
            <div class="w-10 h-10 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
              ${stat.icon}
            </div>
            <div>
              <div class="text-3xl font-bold text-[#1A1035] mb-1">${stat.value}</div>
              <div class="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">${stat.label}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Recent Activity -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-bold text-[#1A1035]">Recent Activity</h2>
          <button class="text-sm font-bold text-[#6B46FA]">See all</button>
        </div>
        
        <div class="space-y-4">
          ${projects.length === 0 ? `
            <div class="p-8 text-center bg-[#F5F4FF] rounded-[32px] border border-dashed border-[#E5E0FF]">
              <p class="text-sm text-[#6B6B6B] font-medium">No recent activity yet.</p>
            </div>
          ` : projects.slice(0, 4).map(p => `
            <div class="flex items-center gap-4 p-4 bg-[#F5F4FF] rounded-[24px] cursor-pointer active:scale-[0.98] transition-all" onclick="window.navigate('${p.type}', '${p.id}')">
              <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#6B46FA] border border-[#E5E0FF] shrink-0">
                ${p.type === 'moodboard' ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"></path></svg>' : 
                  p.type === 'kanban' ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path></svg>' :
                  '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586"></path></svg>'}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-[15px] font-bold text-[#1A1035] truncate mb-0.5">${p.title}</h3>
                <p class="text-[12px] text-[#6B6B6B] font-medium">Updated ${timeAgo(p.updated_at || p.last_updated)}</p>
              </div>
              <div class="p-1">
                <svg class="w-5 h-5 text-[#E5E0FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}

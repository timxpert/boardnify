window.initReviews = function(container, socket, projectId) {
  // Override Topbar for Reviews View (Image 3 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-text-dark transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Technical Reviews</span>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors relative">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
           <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
     `;
  }

  function renderApprovalSection() {
     return `
        <div class="flex items-center gap-6 p-8 bg-white rounded-[40px] border border-gray-100 shadow-premium mb-8">
           <div class="relative w-24 h-24 shrink-0">
              <svg class="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="#F4F3FF" stroke-width="8" fill="transparent" />
                 <circle cx="48" cy="48" r="40" stroke="#6B21FF" stroke-width="8" fill="transparent" stroke-dasharray="251.2" stroke-dashoffset="62.8" stroke-linecap="round" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                 <span class="text-xl font-bold font-['Cabinet_Grotesk'] text-[#1A1916]">75%</span>
              </div>
           </div>
           <div>
              <h3 class="text-xl font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-1">Project Approved</h3>
              <p class="text-[11px] font-medium text-gray-400 leading-relaxed">3 out of 4 stakeholders have signed off on the current version.</p>
           </div>
        </div>
     `;
  }

  function renderVoiceMemo() {
     return `
        <div class="bg-[#F4F3FF] rounded-[32px] p-6 mb-6">
           <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                 <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop" class="w-8 h-8 rounded-full border-2 border-white">
                 <div>
                    <div class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest">NEW FEEDBACK</div>
                    <div class="text-[9px] font-medium text-purple-400">2 minutes ago</div>
                 </div>
              </div>
              <div class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest">0:42</div>
           </div>
           <div class="flex items-center gap-1 h-12 mb-2">
              ${Array.from({length: 24}).map((_, i) => `<div class="w-1 rounded-full bg-[#6B21FF]" style="height: ${Math.random() * 80 + 20}%"></div>`).join('')}
           </div>
        </div>
     `;
  }

  function renderReviewList() {
     const reviews = [
        { name: 'Marcus Chen', role: 'HEAD OF DESIGN', time: '1h ago', status: 'NEEDS REVIEW', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop' },
        { name: 'Sarah Wilson', role: 'PRODUCT MANAGER', time: '4h ago', status: 'APPROVED', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }
     ];

     return reviews.map(rev => `
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-premium mb-4">
           <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                 <img src="${rev.avatar}" class="w-12 h-12 rounded-2xl object-cover">
                 <div>
                    <h4 class="font-bold text-[#1A1916] font-['Cabinet_Grotesk']">${rev.name}</h4>
                    <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">${rev.role}</div>
                 </div>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${rev.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}">
                 ${rev.status}
              </span>
           </div>
           <p class="text-sm font-medium text-gray-500 leading-relaxed mb-4">"The motion blur on the transitions feels slightly heavy. Let's try reducing it by 15% to keep it snappy."</p>
           <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">${rev.time}</span>
              <button class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest">REPLY</button>
           </div>
        </div>
     `).join('');
  }

  container.innerHTML = `
    <div class="view-container animate-fade-in pb-32 px-6 pt-6 bg-[#FDFCFB]">
       ${renderApprovalSection()}
       
       <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-bold text-[#1A1916] font-['Cabinet_Grotesk']">Recent Feedback</h3>
          <button class="text-[10px] font-black text-gray-400 uppercase tracking-widest">VIEW ALL</button>
       </div>

       ${renderVoiceMemo()}
       ${renderReviewList()}

       <!-- Dual FABs (Image 3 Style) -->
       <div class="fixed bottom-28 left-6 right-6 flex gap-3 z-[100]">
          <button class="flex-1 py-4 bg-[#6B21FF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200">Approve All</button>
          <button class="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#6B21FF] shadow-premium">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </button>
       </div>
    </div>
  `;
};

window.initReviews = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;

  // Override Topbar for Reviews View (Image 3 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-[#1A1916] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Technical Reviews</span>
        </div>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors relative">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
           <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
     `;
  }

  const reviews = (window.appData.reviews || []).filter(r => r.project_id === _projectId);
  const approvedCount = reviews.filter(r => r.status === 'Approved').length;
  const progress = reviews.length > 0 ? Math.round((approvedCount / reviews.length) * 100) : 0;

  function renderApprovalSection() {
     return `
        <div class="flex items-center gap-6 p-8 bg-white rounded-[40px] border border-gray-100 shadow-premium mb-8">
           <div class="relative w-24 h-24 shrink-0">
              <svg class="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="#F4F3FF" stroke-width="8" fill="transparent" />
                 <circle cx="48" cy="48" r="40" stroke="#6B21FF" stroke-width="8" fill="transparent" stroke-dasharray="251.2" stroke-dashoffset="${251.2 * (1 - progress / 100)}" stroke-linecap="round" class="transition-all duration-1000" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center">
                 <span class="text-xl font-bold font-['Cabinet_Grotesk'] text-[#1A1916]">${progress}%</span>
              </div>
           </div>
           <div>
              <h3 class="text-xl font-bold text-[#1A1916] font-['Cabinet_Grotesk'] mb-1">${progress === 100 ? 'Fully Approved' : 'Review Progress'}</h3>
              <p class="text-[11px] font-medium text-gray-400 leading-relaxed">${approvedCount} out of ${reviews.length} stakeholders have signed off.</p>
           </div>
        </div>
     `;
  }

  function renderReviewList() {
     if (reviews.length === 0) {
        return `
           <div class="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <div class="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                 <svg class="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">No feedback yet</p>
           </div>
        `;
     }

     return reviews.map(rev => `
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-premium mb-4 animate-in fade-in slide-in-from-bottom-4">
           <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                 <div class="w-12 h-12 rounded-2xl bg-[#F4F3FF] flex items-center justify-center text-[#6B21FF] font-black text-sm uppercase">
                    ${rev.author ? rev.author[0] : '?'}
                 </div>
                 <div>
                    <h4 class="font-bold text-[#1A1916] font-['Cabinet_Grotesk']">${rev.author || 'Anonymous'}</h4>
                    <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">${rev.role || 'STAKEHOLDER'}</div>
                 </div>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${rev.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}">
                 ${rev.status || 'PENDING'}
              </span>
           </div>
           <p class="text-sm font-medium text-gray-500 leading-relaxed mb-4">${rev.content || 'No comment provided.'}</p>
           <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">${rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'recently'}</span>
              <button class="text-[10px] font-black text-[#6B21FF] uppercase tracking-widest hover:underline">REPLY</button>
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

       ${renderReviewList()}

       <!-- Dual FABs (Image 3 Style) -->
       <div class="fixed bottom-28 left-6 right-6 flex gap-3 z-[100]">
          <button onclick="window.approveAllReviews()" class="flex-1 py-4 bg-[#6B21FF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 active:scale-95 transition-transform">Approve All</button>
          <button class="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#6B21FF] shadow-premium active:scale-95 transition-transform">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          </button>
       </div>
    </div>
  `;

  window.approveAllReviews = async function() {
     if (window.dbUpdate && reviews.length > 0) {
        if (window.showToast) window.showToast('Approving all reviews...', 'info');
        try {
           for (const rev of reviews) {
              if (rev.status !== 'Approved') {
                 await window.supabaseClient.from('reviews').update({ status: 'Approved' }).eq('id', rev.id);
                 rev.status = 'Approved';
              }
           }
           window.initReviews(container, socket, _projectId);
           if (window.showToast) window.showToast('Project approved!', 'success');
        } catch (err) {
           console.error(err);
        }
     }
  };
};

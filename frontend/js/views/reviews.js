window.initReviews = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (!window.appData.reviews) {
    window.appData.reviews = [];
  }

  let currentTab = 'All'; // All, Pending, In Review, Approved, Changes Requested

  function renderHeader() {
    return `
      <header class="flex justify-between items-end mb-8">
        <div>
          <h1 class="text-3xl font-bold text-text-dark mb-1">Reviews</h1>
          <p class="text-sm text-text-muted">Manage pending approvals and feedback deliverables.</p>
        </div>
        ${window.activeRole !== 'client' ? `
           <div class="flex gap-2">
             <button id="req-review-main-btn" class="bg-brand hover:bg-opacity-90 text-white font-bold py-2.5 px-6 rounded-lg text-xs smooth-transition flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
               Request Review
             </button>
           </div>
        ` : ''}
      </header>
    `;
  }

  function renderTabs() {
     const tabs = ['All', 'Pending', 'In Review', 'Approved', 'Changes Requested'];
     return `
        <div class="flex gap-6 mb-8 border-b border-border-light overflow-x-auto">
          ${tabs.map(t => `
            <button class="rev-tab border-b-2 pb-3 px-0 text-sm font-bold transition-all whitespace-nowrap ${t === currentTab ? 'border-brand text-brand' : 'border-transparent text-text-muted hover:text-text-dark'}" data-tab="${t}">${t}</button>
          `).join('')}
        </div>
     `;
  }

  function renderEmptyState() {
     return `
         <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-border-light shadow-subtle text-center">
            <div class="w-16 h-16 bg-bg-canvas rounded-2xl flex items-center justify-center mb-6 text-text-muted">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-text-dark mb-2">No reviews yet</h3>
            <p class="text-sm text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">Request a client review to get feedback and approvals on your deliverables.</p>
            ${window.activeRole !== 'client' ? `
              <button id="req-review-empty-btn" class="bg-brand text-white font-bold py-2.5 px-8 rounded-lg text-xs smooth-transition shadow-sm">
                 Request Review
              </button>
            ` : ''}
         </div>
     `;
  }

  function renderSlideOver() {
     return `
       <!-- Slide Over Backdrop -->
       <div id="slide-backdrop" class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300"></div>
       
       <!-- Slide Over Panel -->
       <div id="slide-panel" class="fixed inset-y-0 right-0 w-[420px] bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col">
          <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h2 class="text-lg font-bold text-gray-800">New Review Request</h2>
             <button id="close-slide-btn" class="text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-white smooth-transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          
          <div class="p-6 flex-1 overflow-y-auto space-y-6">
             <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Project Version</label>
                <select id="sr-version" class="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#7C6FF7]/20 focus:border-[#7C6FF7] outline-none">
                   <option value="v1">Version 1 (V1)</option>
                   <option value="v2">Version 2 (V2)</option>
                   <option value="v3">Version 3 (V3)</option>
                </select>
             </div>
             
             <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Client Participant</label>
                <div class="relative">
                   <select id="sr-client" class="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl p-3 pl-12 focus:ring-2 focus:ring-[#7C6FF7]/20 focus:border-[#7C6FF7] outline-none appearance-none">
                      <option value="Acme Corp">Acme Corp Team</option>
                      <option value="Globex">Globex Reviewers</option>
                   </select>
                   <div class="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#7C6FF7]/20 flex items-center justify-center text-[#7C6FF7] text-xs font-bold">A</div>
                   <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
             </div>

             <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Review due by (Optional)</label>
                <input type="date" id="sr-deadline" class="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#7C6FF7]/20 focus:border-[#7C6FF7] outline-none text-gray-600">
             </div>

             <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea id="sr-msg" class="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-[#7C6FF7]/20 focus:border-[#7C6FF7] outline-none h-32 resize-none leading-relaxed text-gray-700">Hi team, please review the latest version of this project and share your feedback here.</textarea>
             </div>
          </div>
          
          <div class="p-6 border-t border-gray-100 flex items-center justify-between bg-white isolate">
             <button id="cancel-slide-btn" class="px-6 py-3 font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 smooth-transition">Cancel</button>
             <button id="submit-slide-btn" class="bg-[#7C6FF7] hover:bg-[#6a5de8] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#7C6FF7]/20 smooth-transition">Send Request</button>
          </div>
       </div>
     `;
  }

  function renderList() {
     const isClient = window.activeRole === 'client';
     let visibleReviews = window.appData.reviews;
     
     if(isClient && window.activeClient !== 'All') {
        visibleReviews = visibleReviews.filter(r => r.client.includes(window.activeClient));
     }

     if(currentTab !== 'All') {
        visibleReviews = visibleReviews.filter(r => r.status === currentTab);
     }

     if(window.appData.reviews.length === 0) {
        return renderEmptyState();
     }

     if(visibleReviews.length === 0) {
        return `<div class="p-10 text-center text-sm text-gray-500 bg-white rounded-2xl border border-gray-100 italic">No reviews match the current filter.</div>`;
     }

     return `
       <div class="flex flex-col gap-4">
         ${visibleReviews.map(rev => {
            let statusBadge = 'badge-gray';
            if(rev.status === 'Pending') statusBadge = 'badge-yellow';
            if(rev.status === 'In Review') statusBadge = 'badge-purple';
            if(rev.status === 'Approved') statusBadge = 'badge-green';
            if(rev.status === 'Changes Requested') statusBadge = 'badge-red';
            
            return `
              <div class="bg-white border border-border-light rounded-xl p-5 hover:shadow-subtle transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div class="flex items-center gap-5">
                   <div class="w-12 h-12 bg-bg-canvas rounded-lg flex items-center justify-center border border-border-light group-hover:bg-brand/5 group-hover:text-brand smooth-transition text-text-muted">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                   </div>
                   <div>
                      <div class="flex items-center gap-2 mb-1">
                         <h3 class="font-bold text-text-dark text-[15px] leading-none">${rev.title}</h3>
                         <span class="text-[9px] font-bold uppercase tracking-wider bg-bg-canvas px-1.5 py-0.5 rounded text-text-muted border border-border-light">${rev.version}</span>
                      </div>
                      <p class="text-[11px] font-medium text-text-muted flex items-center gap-2">
                         <span class="w-4 h-4 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[8px]">${rev.client.charAt(0)}</span>
                         ${rev.client} <span class="text-border-light">•</span> Sent ${rev.date} ${rev.deadline ? `<span class="text-border-light">•</span> <span class="text-red-500 font-bold">Due ${rev.deadline}</span>` : ''}
                      </p>
                   </div>
                </div>

                <div class="flex items-center gap-5">
                   <!-- Status Badge -->
                   <div class="flex flex-col items-end">
                      <span class="badge ${statusBadge}">${rev.status}</span>
                   </div>

                   <!-- Context Actions -->
                   <div class="h-8 w-px bg-gray-200 hidden md:block"></div>
                   
                   <div class="flex items-center gap-2">
                      ${rev.status === 'Pending' && !isClient ? `
                        <button class="rev-action-btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm smooth-transition" data-action="remind" data-id="${rev.id}">Remind Client</button>
                      ` : ''}
                      ${rev.status === 'In Review' && !isClient ? `
                        <button class="rev-action-btn bg-white hover:bg-red-50 text-red-600 border border-gray-200 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm smooth-transition" data-action="reject" data-id="${rev.id}">Request Changes</button>
                        <button class="rev-action-btn bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm shadow-green-500/20 smooth-transition" data-action="approve" data-id="${rev.id}">Approve</button>
                      ` : ''}
                      ${isClient && rev.status === 'Pending' ? `
                         <button class="rev-action-btn bg-brand text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm smooth-transition" data-action="start-review" data-id="${rev.id}">Review Now</button>
                      ` : ''}

                      <button class="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg smooth-transition cursor-help" title="View Detail (Placeholder)"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
                   </div>
                </div>
              </div>
            `;
         }).join('')}
       </div>
     `;
  }

  function wireEvents() {
     // Tab switching
     document.querySelectorAll('.rev-tab').forEach(btn => {
        btn.onclick = (e) => {
           currentTab = e.target.dataset.tab;
           renderDashboard();
        };
     });

     // Slide Over Toggle
     const toggleSlide = (show) => {
        const slide = document.getElementById('slide-panel');
        const back = document.getElementById('slide-backdrop');
        if(show) {
           back.classList.remove('hidden');
           // trigger reflow
           void back.offsetWidth;
           back.classList.remove('opacity-0');
           slide.classList.remove('translate-x-full');
        } else {
           slide.classList.add('translate-x-full');
           back.classList.add('opacity-0');
           setTimeout(() => back.classList.add('hidden'), 300);
        }
     };

     const reqMap = [
        document.getElementById('req-review-main-btn'),
        document.getElementById('req-review-empty-btn')
     ];
     reqMap.forEach(btn => {
        if(btn) btn.onclick = () => toggleSlide(true);
     });

     document.getElementById('close-slide-btn').onclick = () => toggleSlide(false);
     document.getElementById('cancel-slide-btn').onclick = () => toggleSlide(false);

     document.getElementById('submit-slide-btn').onclick = () => {
        const version = document.getElementById('sr-version').value;
        const client = document.getElementById('sr-client').value;
        const deadline = document.getElementById('sr-deadline').value;
        const msg = document.getElementById('sr-msg').value;

        const newRev = {
           id: 'rev-' + Date.now(),
           title: project.title + ' Deliverable',
           version: version.toUpperCase(),
           client: client.replace(' Team', '').replace(' Reviewers', ''),
           date: new Date().toLocaleDateString(),
           deadline: deadline ? deadline : null,
           status: 'Pending',
           messages: [
             { sender: 'Designer', text: msg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
           ]
        };

        window.appData.reviews.unshift(newRev);
        if(window.dbInsert) {
           (async () => {
              const { data: { user } } = await window.supabaseClient.auth.getUser();
              const userId = user?.id || null;
              const payload = { ...newRev, project_id: projectId, ...(userId && { user_id: userId }) };
              window.dbInsert('reviews', payload);
           })();
        }
        
        if(window.showToast) window.showToast('Review request sent to client!');
        toggleSlide(false);
        renderDashboard();
     };

     // Action buttons for lists
     document.querySelectorAll('.rev-action-btn').forEach(btn => {
        btn.onclick = (e) => {
           const id = e.target.dataset.id;
           const action = e.target.dataset.action;
           const rev = window.appData.reviews.find(r => r.id === id);
           
           if(action === 'remind') {
              if(window.showToast) window.showToast(`Reminder sent to ${rev.client}!`);
            } else if (action === 'approve') {
               rev.status = 'Approved';
                if(window.dbUpdate) {
                   if (!id || id === 'null') return;
                   window.dbUpdate('reviews', id, { status: 'Approved' });
                }
               if(window.showToast) window.showToast('Project Approved!');
               renderDashboard();
            } else if (action === 'reject') {
               rev.status = 'Changes Requested';
                if(window.dbUpdate) {
                   if (!id || id === 'null') return;
                   window.dbUpdate('reviews', id, { status: 'Changes Requested' });
                }
               if(window.showToast) window.showToast('Changes Requested!');
               renderDashboard();
            } else if (action === 'start-review') {
               rev.status = 'In Review';
                if(window.dbUpdate) {
                   if (!id || id === 'null') return;
                   window.dbUpdate('reviews', id, { status: 'In Review' });
                }
               if(window.showToast) window.showToast('Started Reviewing!');
               renderDashboard();
           }
        };
     });
  }

  function renderDashboard() {
    container.innerHTML = `
      <div class="h-full overflow-y-auto bg-[#F7F8FA] relative">
         <div class="max-w-6xl mx-auto p-10">
            ${renderHeader()}
            ${window.appData.reviews.length > 0 ? renderTabs() : ''}
            ${renderList()}
         </div>
         ${renderSlideOver()}
      </div>
    `;
    wireEvents();
  }

  renderDashboard();
  
  // Expose for external calls if needed
  window.triggerReviewSlide = () => {
     const slidePanel = document.getElementById('slide-panel');
     if(slidePanel) {
        document.getElementById('slide-backdrop').classList.remove('hidden');
        setTimeout(() => {
           document.getElementById('slide-backdrop').classList.remove('opacity-0');
           slidePanel.classList.remove('translate-x-full');
        }, 10);
     }
  };
};

window.initReviews = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  if (!window.appData.reviews) {
    window.appData.reviews = [];
  }

  let currentTab = 'All';

  function renderHeader() {
    return `
      <header class="p-6 bg-white border-b border-border-light shrink-0">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-xl font-black text-text-dark tracking-tight">Reviews</h1>
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">Feedback & Approvals</p>
          </div>
          ${window.activeRole !== 'client' ? `
            <button id="req-review-main-btn" class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          ` : ''}
        </div>
        
        <div class="flex items-center gap-6 overflow-x-auto scrollbar-hide border-b border-gray-50">
          ${['All', 'Pending', 'In Review', 'Approved', 'Changes'].map(t => `
            <button class="rev-tab pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${t === currentTab ? 'text-primary' : 'text-text-muted'}" data-tab="${t}">
              ${t}
              ${t === currentTab ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>' : ''}
            </button>
          `).join('')}
        </div>
      </header>
    `;
  }

  function renderEmptyState() {
     return `
         <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div class="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 text-primary">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            </div>
            <h3 class="text-lg font-black text-text-dark mb-2 uppercase tracking-tight">No reviews yet</h3>
            <p class="text-xs text-text-muted max-w-xs mx-auto mb-6 leading-relaxed">Request a client review to get feedback and approvals on your deliverables.</p>
            ${window.activeRole !== 'client' ? `
              <button id="req-review-empty-btn" class="bg-primary text-white font-black py-3 px-8 rounded-xl text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20">
                 Request Review
              </button>
            ` : ''}
         </div>
     `;
  }

  function getBottomSheetContent() {
      return `
        <div class="space-y-6">
           <div class="text-center mb-2">
              <h3 class="text-xl font-black text-text-dark tracking-tight">New Review</h3>
              <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">Send deliverable to client</p>
           </div>

           <div class="space-y-4">
              <div>
                 <label class="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">Project Version</label>
                 <select id="sr-version" class="w-full bg-bg-main border border-border-light rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="v1">Version 1 (V1)</option>
                    <option value="v2">Version 2 (V2)</option>
                    <option value="v3">Version 3 (V3)</option>
                 </select>
              </div>
              
              <div>
                 <label class="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">Client</label>
                 <select id="sr-client" class="w-full bg-bg-main border border-border-light rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none">
                    <option value="Acme Corp">Acme Corp Team</option>
                    <option value="Globex">Globex Reviewers</option>
                 </select>
              </div>

              <div>
                 <label class="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 px-1">Message</label>
                 <textarea id="sr-msg" class="w-full bg-bg-main border border-border-light rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none" placeholder="Add a note for the client...">Hi team, please review the latest version of this project.</textarea>
              </div>
           </div>
           
           <div class="grid grid-cols-2 gap-3 pt-2">
              <button onclick="window.closeBottomSheet()" class="py-4 bg-bg-main text-text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border-light">Cancel</button>
              <button id="submit-rev-btn" class="py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">Send Request</button>
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
        const statusMap = {
          'Pending': 'Pending',
          'In Review': 'In Review',
          'Approved': 'Approved',
          'Changes': 'Changes Requested'
        };
        visibleReviews = visibleReviews.filter(r => r.status === statusMap[currentTab] || r.status === currentTab);
     }

     if(window.appData.reviews.length === 0) {
        return renderEmptyState();
     }

     if(visibleReviews.length === 0) {
        return `<div class="p-6 text-center text-[10px] font-black text-text-muted uppercase tracking-widest bg-white rounded-2xl border border-border-light">No reviews match filter</div>`;
     }

     return `
       <div class="flex flex-col gap-4">
         ${visibleReviews.map(rev => {
            let statusClass = 'text-gray-400 bg-gray-50';
            if(rev.status === 'Pending') statusClass = 'text-amber-600 bg-amber-50';
            if(rev.status === 'In Review') statusClass = 'text-primary bg-primary/5';
            if(rev.status === 'Approved') statusClass = 'text-emerald-600 bg-emerald-50';
            if(rev.status === 'Changes Requested') statusClass = 'text-rose-600 bg-rose-50';
            
            return `
              <div class="bento-card p-5 group active:scale-[0.98] transition-all">
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-text-muted">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <h3 class="font-black text-text-dark text-sm leading-tight">${rev.title}</h3>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-bg-main text-text-muted border border-border-light">${rev.version}</span>
                        <span class="text-[8px] font-black text-text-muted uppercase tracking-widest">${rev.date}</span>
                      </div>
                    </div>
                  </div>
                  <span class="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusClass}">${rev.status}</span>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[8px]">${rev.client.charAt(0)}</div>
                    <span class="text-[9px] font-black text-text-muted uppercase tracking-widest">${rev.client}</span>
                  </div>
                  
                  <div class="flex gap-2">
                    ${rev.status === 'Pending' && !isClient ? `
                      <button class="rev-action-btn h-8 px-3 rounded-lg bg-bg-main border border-border-light text-[8px] font-black uppercase tracking-widest text-text-muted" data-action="remind" data-id="${rev.id}">Remind</button>
                    ` : ''}
                    ${isClient && rev.status === 'Pending' ? `
                       <button class="rev-action-btn h-8 px-4 rounded-lg bg-primary text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/10" data-action="start-review" data-id="${rev.id}">Review</button>
                    ` : ''}
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-main text-text-muted"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
                  </div>
                </div>
              </div>
            `;
         }).join('')}
       </div>
     `;
  }

  function wireEvents() {
     document.querySelectorAll('.rev-tab').forEach(btn => {
        btn.onclick = (e) => {
           currentTab = e.currentTarget.dataset.tab;
           renderDashboard();
        };
     });

     const showSheet = () => {
        if(window.openBottomSheet) {
          window.openBottomSheet(getBottomSheetContent());
          document.getElementById('submit-rev-btn').onclick = () => {
              const version = document.getElementById('sr-version').value;
              const client = document.getElementById('sr-client').value;
              const msg = document.getElementById('sr-msg').value;

              const newRev = {
                 id: 'rev-' + Date.now(),
                 title: project.title + ' Deliverable',
                 version: version.toUpperCase(),
                 client: client.replace(' Team', '').replace(' Reviewers', ''),
                 date: new Date().toLocaleDateString(),
                 status: 'Pending'
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
              
              if(window.showToast) window.showToast('Review request sent!');
              window.closeBottomSheet();
              renderDashboard();
          };
        }
     };

     const reqMap = [
        document.getElementById('req-review-main-btn'),
        document.getElementById('req-review-empty-btn')
     ];
     reqMap.forEach(btn => {
        if(btn) btn.onclick = showSheet;
     });

     document.querySelectorAll('.rev-action-btn').forEach(btn => {
        btn.onclick = (e) => {
           const id = e.target.dataset.id;
           const action = e.target.dataset.action;
           const rev = window.appData.reviews.find(r => r.id === id);
           
           if(action === 'remind') {
              if(window.showToast) window.showToast(`Reminder sent!`);
            } else if (action === 'start-review') {
               rev.status = 'In Review';
               if(window.dbUpdate && id) window.dbUpdate('reviews', id, { status: 'In Review' });
               if(window.showToast) window.showToast('Started Reviewing!');
               renderDashboard();
           }
        };
     });
  }

  function renderDashboard() {
    container.innerHTML = `
      <div class="h-full bg-bg-main flex flex-col overflow-hidden">
         ${renderHeader()}
         <div class="flex-1 overflow-y-auto p-6">
            ${renderList()}
         </div>
      </div>
    `;
    wireEvents();
  }

  renderDashboard();
};
};

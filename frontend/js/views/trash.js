window.initTrash = function(container, socket, projectId) {
  // Global Store hook
  if (!window.appData.trash) {
    window.appData.trash = [];
  }

  function renderListView() {
    container.innerHTML = `
      <div class="view-container">
        <header class="flex justify-between items-center mb-10">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Recycle Bin</h1>
            <p class="text-gray-500 text-lg">Deleted items are kept here for 30 days before permanent removal.</p>
          </div>
          ${window.appData.trash.length > 0 && window.activeRole === 'designer' ? `
            <button id="trash-empty-btn" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3.5 px-8 rounded-2xl smooth-transition flex items-center gap-3 text-sm uppercase tracking-widest">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Empty Trash
            </button>
          ` : ''}
        </header>
        
        <div class="flex flex-col gap-6" id="trash-list-container">
          <!-- List injected via JS -->
        </div>
      </div>
    `;

    const listContainer = document.getElementById('trash-list-container');
    
    if (window.appData.trash.length === 0) {
       listContainer.innerHTML = `
        <div class="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Trash is empty</h2>
          <p class="text-gray-500 max-w-sm mx-auto">Items you delete will show up here.</p>
        </div>
      `;
    } else {
      window.appData.trash.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 smooth-transition group';
        card.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-gray-800 line-through text-opacity-70">${item.title}</h3>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-600">${item.type}</span>
              </div>
              <p class="text-sm text-gray-500">Deleted ${item.deletedAt} • ${item.project ? 'From: ' + item.project : 'Project Level'}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            ${window.activeRole === 'designer' ? `
            <button class="bg-gray-50 hover:bg-gray-100 text-gray-600 p-2 rounded-lg smooth-transition border border-gray-200 hover:text-brand" title="Restore" data-restore="${index}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </button>
            <button class="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 p-2 rounded-lg smooth-transition border border-gray-200" title="Delete Permanently" data-delete="${index}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            ` : `
            <span class="text-xs text-gray-400 font-medium">Read Only</span>
            `}
          </div>
        `;
        listContainer.appendChild(card);
      });
    }

    // Attach Event Listeners
    const emptyBtn = document.getElementById('trash-empty-btn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => {
        if(confirm("Are you sure you want to permanently delete all items in the Trash?")) {
          if(window.dbDelete) {
             window.appData.trash.forEach(item => window.dbDelete('trash', item.id));
          }
          window.appData.trash = [];
          window.updateBadges();
          renderListView();
          if(window.showToast) window.showToast('Trash emptied permanently.');
        }
      });
    }

    document.querySelectorAll('[data-restore]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.dataset.restore;
        const item = window.appData.trash[idx];
        
        // True restoration logic based on type
        if(item.type === 'Style Frame') {
          project.data = project.data || {};
          project.data.frames = project.data.frames || [];
          project.data.frames.push(item.data);
          if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
          if(window.showToast) window.showToast(`Restored "${item.title}" to Style Frames sequence.`, 'success');
        } else if(item.type === 'Moodboard Element') {
          project.data = project.data || {};
          project.data.moodboard = project.data.moodboard || [];
          project.data.moodboard.push(item.data);
          if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
          if(window.showToast) window.showToast(`Restored element "${item.title}" to Moodboard.`, 'success');
        } else if(item.type === 'Motion Project') {
          project.data = project.data || {};
          project.data.motionProjects = project.data.motionProjects || [];
          project.data.motionProjects.push(item.data);
          if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
          if(window.showToast) window.showToast(`Restored "${item.title}" successfully.`, 'success');
        } else {
          if(window.showToast) window.showToast(`Restored "${item.title}" successfully.`, 'success');
        }
        
        if(window.dbDelete) window.dbDelete('trash', item.id);
        window.appData.trash.splice(idx, 1);
        window.updateBadges();
        renderListView();
      });
    });

    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.dataset.delete;
        const item = window.appData.trash[idx];
        if(confirm(`Permanently delete "${item.title}"? This cannot be undone.`)) {
          if(window.dbDelete) window.dbDelete('trash', item.id);
          window.appData.trash.splice(idx, 1);
          window.updateBadges();
          renderListView();
          if(window.showToast) window.showToast(`${item.title} deleted permanently.`);
        }
      });
    });
  }

  // Initial render
  renderListView();
};

window.initLibrary = function(container, socket, projectId) {
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Hydrate Library (Already Fetched by bootApp if present)
  if (!window.globalLibrary || window.globalLibrary.length === 0) {
    window.globalLibrary = window.appData.library || [
      { id: 'lib1', title: 'Fintech UI Patterns', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop', tags: ['UI', 'Motion'], client: 'Globex', type: 'Image' },
      { id: 'lib2', title: 'Abstract 3D Shape', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', tags: ['3D'], client: 'Acme Corp', type: 'Image' }
    ];
  }

  container.innerHTML = `
    <div class="view-container">
      <header class="flex flex-col mb-10">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h1 class="text-3xl font-bold text-text-dark tracking-tight">Library</h1>
            <p class="text-text-muted text-sm mt-1">Manage all your visual assets</p>
          </div>
          <button id="add-asset-btn" class="bg-brand hover:bg-opacity-90 text-white font-bold py-2.5 px-6 rounded-lg smooth-transition shadow-sm flex items-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Add Asset
          </button>
        </div>

        <div class="flex gap-2 mb-8 overflow-x-auto scrollbar-hide py-2" id="lib-asset-filters">
          <button class="filter-btn bg-text-dark text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider smooth-transition shadow-sm" data-filter="All">All</button>
          <button class="filter-btn bg-white border border-border-light text-text-muted hover:text-text-dark px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider smooth-transition" data-filter="Image">Images</button>
          <button class="filter-btn bg-white border border-border-light text-text-muted hover:text-text-dark px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider smooth-transition" data-filter="Video">Videos</button>
          <button class="filter-btn bg-white border border-border-light text-text-muted hover:text-text-dark px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider smooth-transition" data-filter="Motion">Motion</button>
        </div>
      </header>

      <div id="library-grid" class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4"></div>
    </div>

    <!-- Modals -->
    <div id="board-selector-popover" class="fixed z-[100] bg-white rounded-3xl shadow-modal border border-border-light w-[320px] hidden opacity-0 scale-95 smooth-transition overflow-hidden">
      <div class="p-4 border-b border-gray-50 bg-gray-50/50">
        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Moodboard</h3>
      </div>
      <div id="board-selector-list" class="max-h-64 overflow-y-auto p-2 space-y-1"></div>
    </div>

    <div id="delete-modal" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] flex items-center justify-center hidden opacity-0 smooth-transition">
      <div class="bg-white rounded-3xl shadow-modal w-[400px] p-8 text-center transform scale-95 transition-all duration-300">
         <h2 class="text-xl font-bold text-gray-800 mb-2">Move to Trash?</h2>
         <p class="text-sm text-gray-500 mb-8">This file will be moved to the trash and can be restored later.</p>
         <div class="flex gap-3">
            <button id="cancel-delete-btn" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl uppercase tracking-widest text-[10px]">Cancel</button>
            <button id="confirm-delete-btn" class="flex-1 bg-brand text-white font-bold py-3 rounded-xl shadow-lg shadow-brand/20 uppercase tracking-widest text-[10px]">Move to Trash</button>
         </div>
      </div>
    </div>
  `;

  const libraryGrid = document.getElementById('library-grid');
  let currentFilter = 'All';
  
  function renderLibrary() {
    libraryGrid.innerHTML = '';
    window.globalLibrary.forEach((item, index) => {
      if(window.activeClient !== 'All' && item.client !== window.activeClient) return;
      if(currentFilter !== 'All' && item.type !== currentFilter && !item.tags.includes(currentFilter)) return;
      
      const hoverActions = `
        <div class="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur rounded shadow-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button class="p-1.5 text-gray-700 hover:text-brand" onclick="event.stopPropagation(); window.showBoardSelector(event, ${index})">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button class="p-1.5 text-gray-700 hover:text-red-500" onclick="event.stopPropagation(); window.deleteLibraryItem(${index})"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
      `;

      const el = document.createElement('div');
      el.className = 'break-inside-avoid relative group rounded-lg overflow-hidden cursor-pointer border border-border-light hover:shadow-subtle transition-all bg-white';
      el.innerHTML = `
        <div class="relative overflow-hidden">
          ${item.type === 'Video' ? `<video src="${item.img}" class="w-full h-auto object-cover" muted loop></video>` : `<img src="${item.img}" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500">`}
        </div>
        <div class="p-3">
          <h5 class="text-[12px] font-bold text-text-dark truncate mb-1">${item.title}</h5>
          <div class="flex justify-between items-center text-[9px] font-bold text-text-muted uppercase tracking-wider">
             <span>${item.type || 'Image'}</span>
             <span>${item.client}</span>
          </div>
        </div>
        ${hoverActions}
      `;
      libraryGrid.appendChild(el);
    });
  }

  let itemToDeleteIdx = null;
  const deleteModal = document.getElementById('delete-modal');

  window.deleteLibraryItem = function(index) {
     itemToDeleteIdx = index;
     deleteModal.classList.remove('hidden');
     setTimeout(() => { deleteModal.classList.remove('opacity-0'); deleteModal.querySelector('div').classList.remove('scale-95'); }, 10);
  };

  document.getElementById('confirm-delete-btn').onclick = () => {
     if(itemToDeleteIdx !== null) {
       window.globalLibrary.splice(itemToDeleteIdx, 1);
       renderLibrary();
       deleteModal.classList.add('opacity-0');
       setTimeout(() => deleteModal.classList.add('hidden'), 300);
     }
  };

  document.getElementById('cancel-delete-btn').onclick = () => {
     deleteModal.classList.add('opacity-0');
     setTimeout(() => deleteModal.classList.add('hidden'), 300);
  };

  const boardPopover = document.getElementById('board-selector-popover');
  window.showBoardSelector = function(e, assetIdx) {
    const rect = e.currentTarget.getBoundingClientRect();
    boardPopover.style.top = (rect.bottom + 8) + 'px';
    boardPopover.style.left = (rect.left - 240) + 'px';
    boardPopover.classList.remove('hidden');
    setTimeout(() => boardPopover.classList.remove('opacity-0', 'scale-95'), 10);
  };

  renderLibrary();
};

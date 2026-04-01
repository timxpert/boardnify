window.initLibrary = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
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
        <div class="flex justify-between items-end mb-6">
          <div>
            <h1 class="text-4xl font-bold text-gray-900 flex items-center gap-4">
              ${project.title} Assets
              <span class="bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-orange-500/20">AI Powered</span>
            </h1>
            <p class="text-gray-500 text-lg mt-2">Scale your creative assets and inspiration for this project.</p>
          </div>
          <div class="flex gap-4 relative" id="add-asset-dropdown">
            <button onclick="window.showWhatsAppModal('${projectId}', '${project.title.replace(/'/g, "\\'")}', '${project.client || ''}')" class="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3.5 px-5 rounded-2xl smooth-transition shadow-sm flex items-center justify-center ${window.activeRole === 'client' ? 'hidden' : ''}">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg> 
            </button>
            <button id="add-asset-btn" class="bg-brand hover:bg-brand/90 text-white font-bold py-3.5 px-8 rounded-2xl smooth-transition shadow-xl shadow-brand/20 flex items-center gap-3 text-sm uppercase tracking-widest">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              Add Asset
            </button>
            <div id="asset-menu" class="absolute top-full right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 hidden flex-col w-56 overflow-hidden z-[100] scale-95 opacity-0 transition-all duration-200">
               <button id="btn-upload-file" class="p-4 text-left hover:bg-gray-50 flex items-center gap-4 text-xs font-black text-gray-700 uppercase tracking-widest">
                  <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Upload File
               </button>
               <button id="btn-paste-url" class="p-4 text-left hover:bg-gray-50 flex items-center gap-4 text-xs font-black text-gray-700 uppercase tracking-widest">
                  <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  Import URL
               </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-10">
          <button class="px-2 py-4 text-sm font-black uppercase tracking-widest border-b-4 border-brand text-brand lib-tab-btn" data-target="tab-library">My Library</button>
          <button class="px-2 py-4 text-sm font-black uppercase tracking-widest border-b-4 border-transparent text-gray-400 hover:text-gray-700 smooth-transition lib-tab-btn" data-target="tab-ai">AI Generator</button>
          <button class="px-2 py-4 text-sm font-black uppercase tracking-widest border-b-4 border-transparent text-gray-400 hover:text-red-500 smooth-transition lib-tab-btn flex items-center gap-2" data-target="tab-pinterest">Pinterest</button>
          <button class="px-2 py-4 text-sm font-black uppercase tracking-widest border-b-4 border-transparent text-gray-400 hover:text-blue-500 smooth-transition lib-tab-btn flex items-center gap-2" data-target="tab-behance">Behance</button>
        </div>
      </header>
      
      <div class="flex-1 relative">
        <!-- LIBRARY TAB -->
        <div id="tab-library" class="lib-tab-content block">
          
          <div class="flex gap-3 mb-8 overflow-x-auto scrollbar-hide py-2" id="lib-asset-filters">
            <button class="filter-btn bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition shadow-md" data-filter="All">All</button>
            <button class="filter-btn bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition" data-filter="Image">Images</button>
            <button class="filter-btn bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition" data-filter="Video">Videos</button>
            <button class="filter-btn bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition" data-filter="Audio">Audio</button>
            <button class="filter-btn bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition" data-filter="Fonts">Fonts</button>
            <button class="filter-btn bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest smooth-transition" data-filter="Palettes">Palettes</button>
          </div>

          <div id="library-grid" class="columns-1 sm:columns-2 md:columns-3 lg:columns-5 xl:columns-6 gap-6 space-y-6"></div>
        </div>
      
      <!-- AI GENERATOR TAB -->
      <div id="tab-ai" class="lib-tab-content hidden">
        <div class="bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200 p-8 rounded-2xl mb-8 flex flex-col items-center justify-center text-center">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">AI Inspiration Generator</h2>
            <p class="text-gray-600 mb-6 max-w-lg">Describe the creative direction you want to explore, and our AI will generate unique layouts, color palettes, and stylistic references instantly.</p>
            <div class="relative flex items-center gap-2 max-w-xl w-full">
              <input type="text" id="ai-prompt" placeholder="e.g. Minimalist luxury watch dashboard with dark mode UI..." class="w-full pl-6 pr-4 py-4 border-2 border-white rounded-xl text-md shadow-xl focus:outline-none focus:border-orange-400 focus:ring-0">
              <button id="ai-generate-btn" class="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg smooth-transition shadow-lg">Generate</button>
            </div>
        </div>
        <div id="loading-indicator" class="hidden w-full py-12 flex flex-col items-center justify-center">
          <div class="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-gray-500 font-medium">AI is materializing ideas...</p>
        </div>
        <div id="ai-grid" class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"></div>
      </div>

      <!-- PINTEREST TAB -->
      <div id="tab-pinterest" class="lib-tab-content hidden">
        <div class="flex items-center gap-2 mb-6">
          <input type="text" id="pinterest-search" placeholder="Search Pinterest..." class="w-full max-w-md p-3 rounded-lg border border-gray-200">
          <button id="pin-search-btn" class="bg-red-600 text-white px-6 py-3 rounded-lg font-bold">Search</button>
        </div>
        <div id="pinterest-grid" class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6"></div>
      </div>

      <!-- BEHANCE TAB -->
      <div id="tab-behance" class="lib-tab-content hidden">
         <div class="flex items-center gap-2 mb-6">
          <input type="text" id="behance-search" placeholder="Search Behance Projects..." class="w-full max-w-md p-3 rounded-lg border border-gray-200">
          <button id="be-search-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">Search</button>
        </div>
        <div id="behance-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
      </div>

    </div>

    <!-- URL MODAL -->
    <div id="url-modal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[200] flex items-center justify-center hidden opacity-0 smooth-transition">
      <div class="bg-white rounded-3xl shadow-2xl w-[450px] p-8 transform scale-95 transition-all">
         <h2 class="text-2xl font-bold text-gray-800 mb-2">Import from URL</h2>
         <p class="text-sm text-gray-500 mb-6">Paste a direct image or video link to add it to your library.</p>
         <input type="text" id="asset-url-input" class="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none mb-6 font-mono text-xs" placeholder="https://images.unsplash.com/...">
         <div class="flex gap-3">
            <button id="import-url-btn" class="flex-1 bg-brand text-white font-bold py-3 rounded-2xl shadow-lg shadow-brand/20 uppercase tracking-widest text-xs">Import Asset</button>
            <button id="close-url-modal" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-3 rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
         </div>
      </div>
    </div>

    <!-- CUSTOM DELETE MODAL -->
    <div id="delete-modal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[200] flex items-center justify-center hidden opacity-0 smooth-transition">
      <div class="bg-white rounded-3xl shadow-2xl w-[400px] p-8 text-center transform scale-95 transition-all">
         <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
         </div>
         <h2 class="text-xl font-bold text-gray-800 mb-2">Delete Asset?</h2>
         <p class="text-sm text-gray-500 mb-8">Are you sure you want to move this asset to the trash? This action can be undone from the Trash bin.</p>
         <div class="flex gap-3">
            <button id="cancel-delete-btn" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl uppercase tracking-widest text-xs smooth-transition">Cancel</button>
            <button id="confirm-delete-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 uppercase tracking-widest text-xs smooth-transition">Delete</button>
         </div>
      </div>
    </div>

    <!-- GLOBAL LIGHTBOX -->
    <div id="lib-lightbox" class="fixed inset-0 bg-black/95 z-[250] hidden items-center justify-center opacity-0 smooth-transition backdrop-blur-xl">
      <button id="close-lightbox" class="absolute top-6 right-8 text-white/50 hover:text-white transition-colors"><svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
      
      <div class="flex flex-col lg:flex-row max-w-7xl w-[95vw] h-[90vh] p-4 lg:p-12 gap-12 items-center lg:items-stretch">
        <div class="flex-[3] w-full flex items-center justify-center rounded-3xl overflow-hidden relative group" id="lb-media-container">
           <img id="lb-img" src="" class="max-w-full max-h-full object-contain shadow-2xl ring-1 ring-white/10 rounded-3xl">
        </div>
        <div class="flex-1 w-full max-w-sm bg-white rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
           <div class="p-8 border-b border-gray-100 bg-gray-50/50 text-center">
             <h2 id="lb-title" class="text-2xl font-black text-gray-800 tracking-tight">Title</h2>
             <span id="lb-source" class="inline-block mt-3 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm">Source</span>
           </div>
           
           <div class="p-8 flex-1 flex flex-col gap-6">
              <div class="space-y-4">
                 <button class="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold text-xs flex items-center gap-3 smooth-transition border border-gray-100" onclick="window.showToast('Copied to clipboard!')">
                    <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copy Asset URL
                 </button>
                 <button class="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold text-xs flex items-center gap-3 smooth-transition border border-gray-100" onclick="window.showToast('Added to Moodboard Selection')">
                    <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Send to Moodboard
                 </button>
              </div>

              <!-- Export Asset -->
              <div class="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 mt-auto">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Export Specification</label>
                <div class="flex gap-2 mb-4">
                  <select id="dl-format" class="flex-1 bg-white border border-gray-100 rounded-xl p-3 text-xs font-bold focus:ring-brand focus:border-brand outline-none shadow-sm">
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpg">JPG (High Res)</option>
                    <option value="webp">WEBP (Web Ready)</option>
                    <option value="mp4">MP4 (Video)</option>
                    <option value="mov">MOV (Source Video)</option>
                  </select>
                </div>
                <button id="lb-dl-btn" class="w-full bg-black hover:bg-gray-800 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex justify-center items-center gap-3 smooth-transition shadow-xl">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Download Asset
                </button>
              </div>

              <button id="lb-save-btn" class="w-full bg-brand hover:bg-brand/90 text-white p-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand/30 smooth-transition">
                Add to My Library
              </button>
           </div>
        </div>
      </div>
    </div>
    <!-- BOARD SELECTOR POPOVER -->
    <div id="board-selector-popover" class="fixed hidden z-[300] bg-white rounded-3xl shadow-2xl border border-gray-100 w-72 overflow-hidden transform scale-95 opacity-0 transition-all duration-200">
      <div class="p-4 border-b border-gray-50 bg-gray-50/50">
        <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Moodboard</h3>
      </div>
      <div id="board-selector-list" class="max-h-64 overflow-y-auto p-2 space-y-1">
        <!-- Moodboards injected here -->
      </div>
    </div>
  `;

  const libraryGrid = document.getElementById('library-grid');
  let currentFilter = 'All';
  
  // Render Library Items visually
  function renderLibrary() {
    libraryGrid.innerHTML = '';
    window.globalLibrary.forEach((item, index) => {
      // Filter logic
      if(window.activeClient !== 'All' && item.client !== window.activeClient) return;
      if(currentFilter !== 'All' && item.type !== currentFilter && !item.tags.includes(currentFilter)) return;
      
      const hoverActions = window.activeRole === 'designer' ? `
        <div class="absolute top-2 right-2 flex items-center bg-white/90 backdrop-blur rounded shadow-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button class="p-1.5 text-gray-700 hover:text-brand" title="Add to Moodboard" onclick="event.stopPropagation(); window.showBoardSelector(event, ${index})">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button class="p-1.5 text-gray-700 hover:text-brand" title="Duplicate" onclick="event.stopPropagation(); window.duplicateLibraryItem(${index})"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
          <button class="p-1.5 text-gray-700 hover:text-red-500" title="Delete" onclick="event.stopPropagation(); window.deleteLibraryItem(${index})"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>
      ` : '';

      const tagHtml = item.tags.map(t => `<span class="bg-white/30 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded shadow-sm">${t}</span>`).join('');
      const el = document.createElement('div');
      el.className = 'break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl smooth-transition border border-gray-100';
      el.innerHTML = `
        ${item.type === 'Video' ? `<video src="${item.img}" class="w-full h-auto object-cover" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>` : item.type === 'Audio' ? `<div class="w-full h-32 bg-gray-100 flex items-center justify-center"><svg class="w-12 h-12 text-gray-300"...></svg></div>` : `<img src="${item.img}" class="w-full h-auto object-cover" alt="Asset">`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 smooth-transition flex flex-col justify-end p-5">
           <h5 class="text-white font-bold tracking-wide">${item.title}</h5>
           <div class="flex gap-2 mt-3">${tagHtml}</div>
           ${window.activeClient === 'All' ? `<span class="absolute top-2 left-2 bg-black/60 text-white text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur border border-white/20">${item.client}</span>` : ''}
           ${item.type ? `<span class="absolute bottom-24 right-2 bg-brand/90 text-white text-[9px] uppercase font-black px-2 py-1 rounded shadow-md border border-white/20 tracking-wider">${item.type}</span>` : ''}
        </div>
        ${hoverActions}
      `;
      el.addEventListener('click', () => openLightbox(item.img, item.title, "My Library", item.type || 'Image'));
      libraryGrid.appendChild(el);
    });
    initDragAndDrop();
  }

  function initDragAndDrop() {
    let draggedItemIdx = null;
    const cards = libraryGrid.querySelectorAll('.break-inside-avoid');
    
    cards.forEach((card, idx) => {
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        draggedItemIdx = idx;
        card.classList.add('opacity-40', 'scale-95');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40', 'scale-95');
        draggedItemIdx = null;
      });
      card.addEventListener('dragover', (e) => e.preventDefault());
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if(draggedItemIdx !== null && draggedItemIdx !== idx) {
          const items = [...window.globalLibrary];
          const [moved] = items.splice(draggedItemIdx, 1);
          items.splice(idx, 0, moved);
          window.globalLibrary = items;
          renderLibrary();
        }
      });
    });
  }

  let itemToDeleteIdx = null;
  const deleteModal = document.getElementById('delete-modal');

  window.deleteLibraryItem = function(index) {
     itemToDeleteIdx = index;
     deleteModal.classList.remove('hidden');
     setTimeout(() => { deleteModal.classList.remove('opacity-0'); deleteModal.querySelector('div').classList.remove('scale-95'); }, 10);
  };

  document.getElementById('cancel-delete-btn').onclick = () => {
     deleteModal.classList.add('opacity-0');
     deleteModal.querySelector('div').classList.add('scale-95');
     setTimeout(() => deleteModal.classList.add('hidden'), 300);
     itemToDeleteIdx = null;
  };

  document.getElementById('confirm-delete-btn').onclick = () => {
     if(itemToDeleteIdx !== null) {
       const copy = JSON.parse(JSON.stringify(window.globalLibrary[itemToDeleteIdx]));
       if(window.activeHistory) {
         window.activeHistory.push({
            undo: () => { window.globalLibrary.splice(itemToDeleteIdx, 0, copy); if(libraryGrid) renderLibrary(); },
            redo: () => { window.globalLibrary.splice(itemToDeleteIdx, 1); if(libraryGrid) renderLibrary(); }
         });
       }
       if(window.appData && window.appData.trash) {
         window.appData.trash.push({ id: copy.id, type: 'library', title: copy.title, deletedAt: new Date().toLocaleDateString(), project: copy.client, data: copy });
         if(window.dbInsert) {
             window.dbInsert('trash', {
                 id: copy.id,
                 type: 'library',
                 title: copy.title,
                 project: copy.client,
                 payload: copy
             });
         }
         window.updateBadges();
       }
       window.globalLibrary.splice(itemToDeleteIdx, 1);
       if(window.dbDelete) window.dbDelete('library', copy.id);
       if(libraryGrid) renderLibrary();
       if(window.showToast) window.showToast('Asset moved to trash');
       document.getElementById('cancel-delete-btn').click();
     }
  };

  window.duplicateLibraryItem = function(index) {
     const item = window.globalLibrary[index];
     const dup = JSON.parse(JSON.stringify(item));
     dup.id = 'lib' + Date.now();
     dup.title = item.title + ' (Copy)';
     if(window.activeHistory) {
         window.activeHistory.push({
            undo: () => { window.globalLibrary.pop(); if(window.dbDelete) window.dbDelete('library', dup.id); if(libraryGrid) renderLibrary(); },
            redo: () => { window.globalLibrary.push(dup); if(window.dbInsert) window.dbInsert('library', dup); if(libraryGrid) renderLibrary(); }
         });
     }
     window.globalLibrary.push(dup);
     if(window.dbInsert) window.dbInsert('library', dup);
     if(libraryGrid) renderLibrary();
  };
  
  // --- ADD TO BOARD LOGIC ---
  const boardPopover = document.getElementById('board-selector-popover');
  const boardList = document.getElementById('board-selector-list');

  window.showBoardSelector = function(e, assetIdx) {
    const rect = e.currentTarget.getBoundingClientRect();
    boardPopover.style.top = (rect.bottom + 8) + 'px';
    boardPopover.style.left = (rect.left - 240) + 'px';
    
    // Fill moodboards
    const moodboards = window.appData.projects.filter(p => p.type === 'moodboard');
    if (moodboards.length === 0) {
      boardList.innerHTML = '<div class="p-4 text-[10px] font-bold text-gray-400 text-center uppercase">No moodboards found</div>';
    } else {
      boardList.innerHTML = moodboards.map(mb => `
        <button onclick="window.addToBoard('${mb.id}', ${assetIdx})" class="w-full text-left p-3 hover:bg-brand/5 rounded-2xl flex items-center gap-3 group/item transition-all">
          <div class="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
            <img src="${mb.img || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=200'}" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-gray-800 truncate">${mb.title}</div>
            <div class="text-[9px] text-gray-400 font-medium uppercase tracking-wider">${mb.client}</div>
          </div>
          <div class="opacity-0 group-hover/item:opacity-100 text-brand transition-opacity">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
          </div>
        </button>
      `).join('');
    }

    boardPopover.classList.remove('hidden');
    setTimeout(() => boardPopover.classList.remove('opacity-0', 'scale-95'), 10);
    
    // Close on click outside
    const closePop = (ev) => {
      if (!boardPopover.contains(ev.target) && ev.target !== e.currentTarget) {
        boardPopover.classList.add('opacity-0', 'scale-95');
        setTimeout(() => boardPopover.classList.add('hidden'), 200);
        document.removeEventListener('click', closePop);
      }
    };
    setTimeout(() => document.addEventListener('click', closePop), 20);
  };

  window.addToBoard = function(projectId, assetIdx) {
    const asset = window.globalLibrary[assetIdx];
    const project = window.appData.projects.find(p => p.id === projectId);
    if (!project || !asset) return;

    if (!project.data) project.data = {};
    if (!project.data.moodboard) project.data.moodboard = [];

    const newEl = {
      id: 'el-' + Date.now(),
      type: asset.type === 'Video' ? 'video' : 'image',
      src: asset.img,
      x: 100, // Default start position
      y: 100,
      w: 300,
      z: 10,
      title: asset.title
    };

    project.data.moodboard.push(newEl);
    
    if (window.dbUpdate) {
      window.dbUpdate('projects', projectId, { data: project.data });
    }
    
    if (window.showToast) window.showToast(`Added to "${project.title}"`);
    
    // Close popover
    boardPopover.classList.add('opacity-0', 'scale-95');
    setTimeout(() => boardPopover.classList.add('hidden'), 200);
  };

  renderLibrary();

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => {
       document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.replace('bg-gray-900', 'bg-white');
          b.classList.replace('text-white', 'text-gray-500');
          b.classList.remove('shadow-md');
       });
       btn.classList.replace('bg-white', 'bg-gray-900');
       btn.classList.replace('text-gray-500', 'text-white');
       btn.classList.add('shadow-md');
       currentFilter = btn.dataset.filter;
       renderLibrary();
    };
  });

  // Tab Switching Logic
  document.querySelectorAll('.lib-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // styles
      document.querySelectorAll('.lib-tab-btn').forEach(b => {
        b.classList.remove('border-brand', 'border-red-500', 'border-blue-500');
        b.classList.add('border-transparent');
        // Reset colors
        if(b.dataset.target === 'tab-library') b.classList.replace('text-brand', 'text-gray-500');
        if(b.dataset.target === 'tab-pinterest') b.classList.replace('text-red-500', 'text-gray-500');
        if(b.dataset.target === 'tab-behance') b.classList.replace('text-blue-500', 'text-gray-500');
      });
      
      const targetId = e.currentTarget.dataset.target;
      if(targetId === 'tab-library') e.currentTarget.classList.add('border-brand', 'text-brand');
      if(targetId === 'tab-pinterest') e.currentTarget.classList.add('border-red-500', 'text-red-500');
      if(targetId === 'tab-behance') e.currentTarget.classList.add('border-blue-500', 'text-blue-500');
      e.currentTarget.classList.remove('border-transparent', 'text-gray-500');
      
      // visibility
      document.querySelectorAll('.lib-tab-content').forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('block');
      });
      document.getElementById(targetId).classList.replace('hidden', 'block');
    });
  });

  // Dropdown Logic
  const addBtn = document.getElementById('add-asset-btn');
  const assetMenu = document.getElementById('asset-menu');
  
  if(addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = assetMenu.classList.contains('hidden');
      if(isHidden) {
        assetMenu.classList.remove('hidden');
        setTimeout(() => assetMenu.classList.remove('scale-95', 'opacity-0'), 10);
      } else {
        assetMenu.classList.add('scale-95', 'opacity-0');
        setTimeout(() => assetMenu.classList.add('hidden'), 200);
      }
    });

    document.addEventListener('click', () => {
      assetMenu.classList.add('scale-95', 'opacity-0');
      setTimeout(() => assetMenu.classList.add('hidden'), 200);
    });
  }

  // Upload Logic
  document.getElementById('btn-upload-file').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*,video/*';
    inp.onchange = (e) => {
       const file = e.target.files[0];
        if(file) {
          if(window.showToast) window.showToast(`Uploading ${file.name}...`);
          
          (async () => {
            try {
              const formData = new FormData();
              formData.append('file', file);

              console.log(`[Library] Uploading to: ${window.BASE_URL}/api/upload`);
              const response = await fetch(`${window.BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
              }

              const result = await response.json();
              const publicUrl = result.url;
              const type = file.type.startsWith('video') ? 'Video' : 'Image';

              const newAsset = {
                id: 'lib' + Date.now(),
                title: file.name,
                img: publicUrl,
                tags: ['Upload'],
                type: type,
                client: window.activeClient === 'All' ? 'Acme Corp' : window.activeClient
              };
              
              window.globalLibrary.unshift(newAsset); // Add to top
              if(window.dbInsert) window.dbInsert('library', newAsset);
              renderLibrary();
              if(window.showToast) window.showToast('Upload complete!', 'success');
            } catch (err) {
              console.error('[Library] Upload Error:', err);
              if(window.showToast) window.showToast(`Upload Error: ${err.message}`, 'error');
            }
          })();
        }
    };
    inp.click();
  };

  // URL Import Logic
  const urlModal = document.getElementById('url-modal');
  const urlInput = document.getElementById('asset-url-input');
  
  document.getElementById('btn-paste-url').onclick = () => {
    urlModal.classList.remove('hidden');
    setTimeout(() => { urlModal.classList.remove('opacity-0'); urlModal.querySelector('div').classList.remove('scale-95'); }, 10);
    urlInput.focus();
  };

  const closeUrlModal = () => {
    urlModal.classList.add('opacity-0');
    urlModal.querySelector('div').classList.add('scale-95');
    setTimeout(() => urlModal.classList.add('hidden'), 300);
    urlInput.value = '';
  };

  document.getElementById('close-url-modal').onclick = closeUrlModal;
  document.getElementById('import-url-btn').onclick = () => {
    const url = urlInput.value.trim();
    if(!url) return;
    
    if(window.showToast) window.showToast('Importing asset...');
    setTimeout(() => {
      const newAsset = {
        id: 'lib' + Date.now(),
        title: 'Imported Asset',
        img: url,
        tags: ['URL'],
        client: window.activeClient === 'All' ? 'Acme Corp' : window.activeClient
      };
      window.globalLibrary.push(newAsset);
      if(window.dbInsert) window.dbInsert('library', newAsset);
      renderLibrary();
      closeUrlModal();
      if(window.showToast) window.showToast('Asset imported from URL!');
    }, 800);
  };

  // Lightbox Logic
  const lightbox = document.getElementById('lib-lightbox');
  const lbTitle = document.getElementById('lb-title');
  const lbSource = document.getElementById('lb-source');
  let currentActiveLightboxAsset = null;

  function openLightbox(mediaSrc, title, source, type = 'Image') {
    const mediaContainer = document.getElementById('lb-media-container');
    if (type === 'Video' || source === 'Video') {
       mediaContainer.innerHTML = `<video src="${mediaSrc}" controls class="max-w-full max-h-full shadow-2xl ring-1 ring-white/10 rounded-3xl" autoplay></video>`;
    } else if (type === 'Audio') {
       mediaContainer.innerHTML = `<audio src="${mediaSrc}" controls class="w-full shadow-lg rounded-full"></audio>`;
    } else {
       mediaContainer.innerHTML = `<img src="${mediaSrc}" class="max-w-full max-h-full object-contain shadow-2xl ring-1 ring-white/10 rounded-3xl">`;
    }

    lbTitle.textContent = title;
    lbSource.textContent = source;
    currentActiveLightboxAsset = { img: mediaSrc, title: title, tags: [source], type };
    
    // Formatting specific styles
    if(source === 'Pinterest') lbSource.className = "inline-block mt-2 text-xs font-bold text-white uppercase tracking-widest px-2 py-0.5 bg-red-600 rounded shadow-md";
    else if(source === 'Behance') lbSource.className = "inline-block mt-2 text-xs font-bold text-white uppercase tracking-widest px-2 py-0.5 bg-blue-600 rounded shadow-md";
    else if(source === 'AI Gen') lbSource.className = "inline-block mt-2 text-[10px] font-bold text-white uppercase tracking-widest px-2 py-0.5 bg-gradient-to-r from-orange-400 to-pink-500 rounded shadow-md";
    else lbSource.className = "inline-block mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-full border border-gray-200";

    lightbox.classList.replace('hidden', 'flex');
    setTimeout(() => lightbox.classList.remove('opacity-0'), 10);
  }

  document.getElementById('close-lightbox').addEventListener('click', () => {
    lightbox.classList.add('opacity-0');
    setTimeout(() => lightbox.classList.replace('flex', 'hidden'), 300);
  });

  document.getElementById('lb-save-btn').addEventListener('click', () => {
    if(!currentActiveLightboxAsset) return;
    
    let clientAssigned = window.activeClient;
    if(window.activeClient === 'All') {
      clientAssigned = prompt("Save this asset directly to which client's library? (Acme Corp, Globex, Initech)", "Acme Corp");
      if(!clientAssigned) return;
    }

    const newAsset = {
      id: 'lib' + Date.now(),
      title: currentActiveLightboxAsset.title,
      img: currentActiveLightboxAsset.img,
      tags: currentActiveLightboxAsset.tags,
      client: clientAssigned
    };

    window.globalLibrary.push(newAsset);
    if(window.dbInsert) window.dbInsert('library', newAsset);
    renderLibrary();
    if(window.showToast) window.showToast('Asset saved to My Library!');
  });

  document.getElementById('lb-dl-btn').addEventListener('click', () => {
     if(!currentActiveLightboxAsset) return;
     const format = document.getElementById('dl-format').value.toUpperCase();
     if(window.showToast) window.showToast(`Downloading as ${format}...`);
     
     // Simulate file download
     setTimeout(() => {
        const a = document.createElement('a');
        a.href = currentActiveLightboxAsset.img;
        a.download = `boardnify-asset-${Date.now()}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
     }, 1000);
  });


  // --- API MOCKS & TAB HANDLERS ---
  const aiGrid = document.getElementById('ai-grid');
  const pinGrid = document.getElementById('pinterest-grid');
  const beGrid = document.getElementById('behance-grid');

  document.getElementById('ai-prompt').addEventListener('keydown', (e) => {
    if(e.key === 'Enter') document.getElementById('ai-generate-btn').click();
  });

  document.getElementById('ai-generate-btn').addEventListener('click', () => {
    const prompt = document.getElementById('ai-prompt').value.trim();
    if(!prompt) {
       if(window.showToast) window.showToast('Please enter a creative prompt', 'error');
       return;
    }

    const loader = document.getElementById('loading-indicator');
    loader.classList.remove('hidden');
    aiGrid.innerHTML = '';
    
    setTimeout(() => {
      loader.classList.add('hidden');
      const results = [
        { 
          t: 'Modern Minimalist', 
          img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600',
          palette: ['#0F172A', '#334155', '#94A3B8', '#F1F5F9'],
          fonts: ['Satoshi', 'General Sans'],
          keywords: ['Sleek', 'Corporate', 'Tech']
        },
        { 
          t: 'Glassmorphic Wave', 
          img: 'https://images.unsplash.com/photo-1633533402405-774fbe43126e?q=80&w=600',
          palette: ['#F59E0B', '#F97316', '#EF4444', '#7C2D12'],
          fonts: ['Outfit', 'Cabinet Grotesk'],
          keywords: ['Vibrant', 'Experimental', '3D']
        },
        { 
          t: 'Futuristic Gradient', 
          img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=600',
          palette: ['#8B5CF6', '#D946EF', '#EC4899', '#F472B6'],
          fonts: ['Plus Jakarta Sans', 'Manrope'],
          keywords: ['Cyber', 'Neon', 'Abstract']
        }
      ];
      
      results.forEach(res => {
        const palHtml = res.palette.map(c => `<div class="w-4 h-4 rounded-full border border-white/20" style="background:${c}"></div>`).join('');
        const kwHtml = res.keywords.map(k => `<span class="bg-white/10 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white/10">${k}</span>`).join('');
        
        const html = `
          <div class="break-inside-avoid relative group rounded-[32px] overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_20px_50px_rgba(249,115,22,0.3)] smooth-transition border border-white/10 mb-8 bg-gray-900"
               onclick="window.openLibraryMock(this, 'AI Gen')">
            <img src="${res.img}" class="w-full h-auto object-cover opacity-80 group-hover:opacity-100 smooth-transition" alt="AI Gen">
            <div class="p-6 bg-gray-900 border-t border-white/5">
              <div class="flex justify-between items-center mb-4">
                <h5 class="text-white font-black text-xs uppercase tracking-[0.2em] proj-title">${res.t}</h5>
                <div class="flex -space-x-1">${palHtml}</div>
              </div>
              <div class="flex flex-wrap gap-2 mb-4">${kwHtml}</div>
              <div class="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest pt-4 border-t border-white/5">
                 <span>Typography</span>
                 <span class="text-white/80">${res.fonts.join(' • ')}</span>
              </div>
            </div>
            <div class="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 pointer-events-none smooth-transition"></div>
          </div>
        `;
        aiGrid.insertAdjacentHTML('beforeend', html);
      });
      if(window.showToast) window.showToast('AI Generation Complete');
    }, 2000);
  });

  document.getElementById('pinterest-search').addEventListener('keydown', (e) => {
    if(e.key === 'Enter') document.getElementById('pin-search-btn').click();
  });

  document.getElementById('pin-search-btn').addEventListener('click', () => {
    const term = document.getElementById('pinterest-search').value.trim() || 'Aesthetics';
    pinGrid.innerHTML = '';
    if(window.showToast) window.showToast(`Searching Pinterest for "${term}"...`);
    
    const pins = [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=600',
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600',
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600'
    ];

    pins.forEach((p, i) => {
      const html = `
        <div class="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl smooth-transition mb-6" onclick="window.openLibraryMock(this, 'Pinterest')">
          <img src="${p}" class="w-full h-auto object-cover">
          <div class="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 smooth-transition flex flex-col justify-end p-5">
            <h5 class="text-white font-black text-xs uppercase tracking-widest proj-title">${term} Ref ${i+1}</h5>
          </div>
        </div>
      `;
      pinGrid.insertAdjacentHTML('beforeend', html);
    });
  });

  document.getElementById('behance-search').addEventListener('keydown', (e) => {
    if(e.key === 'Enter') document.getElementById('be-search-btn').click();
  });

  document.getElementById('be-search-btn').addEventListener('click', () => {
    const term = document.getElementById('behance-search').value.trim() || 'Creative';
    beGrid.innerHTML = '';
    if(window.showToast) window.showToast(`Searching Behance for "${term}"...`);

    const projects = [
      { t: 'Brand Identity', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600' },
      { t: 'UI Case Study', img: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=600' },
      { t: 'Motion Graphics', img: 'https://images.unsplash.com/photo-1550745679-33b7ba8219c6?q=80&w=600' }
    ];

    projects.forEach(p => {
      const html = `
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 smooth-transition cursor-pointer group flex flex-col" onclick="window.openLibraryMock(this, 'Behance')">
          <div class="h-56 w-full relative overflow-hidden">
            <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-110 smooth-transition">
          </div>
          <div class="p-6 bg-white">
            <h3 class="font-black text-gray-800 text-sm uppercase tracking-widest proj-title">${p.t}</h3>
            <p class="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-2">
               <span class="text-blue-500">BEHANCE</span> • ${term} Inspiration
            </p>
          </div>
        </div>
      `;
      beGrid.insertAdjacentHTML('beforeend', html);
    });
  });

  window.openLibraryMock = function(el, source) {
    const img = el.querySelector('img').src;
    const title = el.querySelector('.proj-title').textContent;
    openLightbox(img, title, source);
  };

  // OVERALL DROP UPLOAD ZONE ON CONTAINER
  container.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); container.classList.add('bg-brand/5'); });
  container.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); container.classList.remove('bg-brand/5'); });
  container.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    container.classList.remove('bg-brand/5');
    if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       Array.from(e.dataTransfer.files).forEach(file => {
          const type = file.type.startsWith('video') ? 'Video' : file.type.startsWith('audio') ? 'Audio' : 'Image';
          const reader = new FileReader();
          reader.onload = (ev) => {
             const newAsset = {
               id: 'lib' + Date.now() + Math.random(),
               title: file.name, img: ev.target.result, tags: ['Upload'], client: window.activeClient, type: type
             };
             window.globalLibrary.push(newAsset);
             if(window.dbInsert) window.dbInsert('library', newAsset);
             renderLibrary();
          };
          reader.readAsDataURL(file);
       });
       if(window.showToast) window.showToast('Files uploaded to library');
    }
  });
}

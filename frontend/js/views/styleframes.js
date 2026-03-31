window.initStyleFrames = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  container.innerHTML = `
    <div class="view-container">
      <header class="flex justify-between items-center mb-10">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">${project.title} Frames</h1>
          <p class="text-gray-500 text-lg">Sequence your scenes, add descriptions, and present the vision</p>
        </div>
        <div class="flex gap-4">
          <button id="sf-deliver-btn" class="bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-2xl smooth-transition flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl ${window.activeRole === 'client' ? 'hidden' : ''}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            Deliver
          </button>
          <button id="sf-share-btn" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-8 rounded-2xl smooth-transition flex items-center gap-2 text-sm uppercase tracking-widest shadow-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
            Share
          </button>
          <button onclick="window.showWhatsAppModal('${projectId}', '${project.title.replace(/'/g, "\\'")}', '${project.client || ''}')" class="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 px-6 rounded-2xl smooth-transition flex items-center gap-2 text-sm uppercase tracking-widest shadow-sm ${window.activeRole === 'client' ? 'hidden' : ''}">
            <svg class="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg>
            WhatsApp
          </button>
          <button id="add-scene-btn" class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 px-8 rounded-2xl smooth-transition flex items-center gap-2 text-sm uppercase tracking-widest shadow-sm ${window.activeRole === 'client' ? 'hidden' : ''}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Add Scene
          </button>
          
          <button id="sf-present-btn" class="bg-brand hover:bg-brand/90 text-white font-bold py-3 px-8 rounded-2xl smooth-transition shadow-xl shadow-brand/20 flex items-center gap-2 text-sm uppercase tracking-widest">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Present Sequence
          </button>
        </div>
      </header>
      
      <div id="frames-container" class="flex-1 overflow-y-auto pr-4 flex flex-col gap-8 scrollbar-hide">
        <!-- Cards rendered by JS -->
      </div>

      <!-- Filmstrip -->
      <div class="h-32 bg-white border-t border-gray-200 p-4 flex gap-4 overflow-x-auto items-center scrollbar-hide" id="sf-filmstrip">
        <!-- Thumbnails rendered by JS -->
      </div>
    </div>

    <!-- Presentation Overlay (Hidden) -->
    <div id="sf-presentation-mode" class="fixed inset-0 bg-gray-900 z-50 flex flex-col hidden opacity-0 smooth-transition text-white">
      <div class="p-4 flex justify-between items-center bg-gradient-to-b from-gray-900/80 to-transparent absolute top-0 w-full z-10 transition-opacity duration-300" id="sf-pres-toolbar">
        <div class="text-gray-400 font-medium" id="sf-pres-counter">Scene 1 / 1</div>
        <button id="sf-close-pres" class="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 smooth-transition backdrop-blur">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-8">
        <div class="w-full md:w-2/3 h-[50vh] md:h-[80vh] flex items-center justify-center">
          <img id="sf-pres-img" src="" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Presentation Scene">
        </div>
        <div class="w-full md:w-1/3 text-left">
          <span id="sf-pres-num" class="text-brand font-bold uppercase tracking-widest text-sm mb-2 block">Scene 01</span>
          <h2 id="sf-pres-title" class="text-3xl font-bold mb-6 text-white leading-tight">Opening Shot</h2>
          <p id="sf-pres-desc" class="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-2xl border border-white/10">Description goes here...</p>
        </div>
      </div>

      <button id="sf-prev-btn" class="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 p-4 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity z-10">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <button id="sf-next-btn" class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/60 p-4 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity z-10">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
      </button>
    </div>
  `;

  const framesContainer = document.getElementById('frames-container');
  const filmstrip = document.getElementById('sf-filmstrip');
  const addSceneBtn = document.getElementById('add-scene-btn');
  
  window.globalStyleFrames = project.data?.frames || [
    {
      id: 'sf1',
      title: 'Opening Shot - Logo Reveal',
      desc: 'Scene opens with a tight macro shot of the abstract glass shapes.\n\nVO: "Welcome to the future of finance..."',
      img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
      client: 'Acme Corp',
      status: 'Draft'
    }
  ];

  const saveFramesState = () => {
    project.data = project.data || {};
    project.data.frames = window.globalStyleFrames;
    if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
  };
  
  const pushToHistory = (actionLabel, undoFn, redoFn) => {
    if(window.activeRole === 'client') return;
    if(window.activeHistory) window.activeHistory.push(actionLabel, undoFn, redoFn);
  };
  
  const performHistoryAction = (actionLabel, actionFn) => {
    if(window.activeRole === 'client') { actionFn(); saveFramesState(); renderFrames(); return; }
    const prevState = JSON.stringify(window.globalStyleFrames);
    actionFn();
    const nextState = JSON.stringify(window.globalStyleFrames);
    if(prevState !== nextState) {
        pushToHistory(actionLabel, 
            () => { window.globalStyleFrames = JSON.parse(prevState); saveFramesState(); renderFrames(); },
            () => { window.globalStyleFrames = JSON.parse(nextState); saveFramesState(); renderFrames(); }
        );
    }
    saveFramesState();
    renderFrames();
  };

  const getProjectFrames = () => window.globalStyleFrames.filter(f => window.activeClient === 'All' || f.client === window.activeClient);

  function renderFrames() {
    framesContainer.innerHTML = '';
    filmstrip.innerHTML = '';

    const projectFrames = getProjectFrames();
    
    projectFrames.forEach((frame, index) => {
      const card = createDOMCard(frame, index + 1);
      framesContainer.appendChild(card);

      const thumb = document.createElement('div');
      thumb.className = `min-w-[120px] h-20 rounded-lg overflow-hidden border-2 cursor-pointer flex-shrink-0 group relative ${frame.img ? '' : 'bg-gray-100 flex items-center justify-center'} transition-all hover:border-brand/50 border-transparent`;
      thumb.innerHTML = frame.img 
        ? `<img src="${frame.img}" class="w-full h-full object-cover">`
        : `<svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
      
      thumb.onclick = () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('ring-4', 'ring-brand'));
        card.classList.add('ring-4', 'ring-brand');
      };
      
      filmstrip.appendChild(thumb);
    });
    
    initDragAndDrop();
  }

  function createDOMCard(frame, num) {
    const card = document.createElement('div');
    card.className = 'scene-card bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row group smooth-transition relative';
    card.draggable = true;
    card.dataset.id = frame.id;
    
    card.innerHTML = `
      <div class="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 cursor-grab active:cursor-grabbing text-gray-400 hover:text-brand drag-handle">
        <svg class="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
        <span class="font-bold text-lg text-gray-500">${String(num).padStart(2, '0')}</span>
      </div>
      
      <div class="w-full md:w-[400px] h-[250px] bg-gray-100 relative group-hover:bg-gray-200 smooth-transition flex-shrink-0 flex items-center justify-center cursor-pointer img-upload-area overflow-hidden">
        ${frame.img ? `<img src="${frame.img}" class="w-full h-full object-cover absolute inset-0">` : `
          <div class="flex flex-col items-center gap-2 text-gray-400">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span class="text-xs font-bold uppercase tracking-wider">Upload Frame</span>
          </div>
        `}
      </div>

      <div class="flex-1 p-8 flex flex-col relative">
        <div class="flex justify-between items-start mb-4">
          <input type="text" class="text-2xl font-bold text-gray-800 border-none focus:ring-0 p-0 bg-transparent w-full title-input" placeholder="Scene Title" value="${frame.title}">
          <div class="flex gap-2">
            <button class="status-badge px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all ${getStatusClass(frame.status)}">${frame.status}</button>
            <div class="relative group/menu ${window.activeRole === 'client' ? 'hidden' : ''}">
              <button class="text-gray-400 hover:text-gray-800 p-1"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z"></path></svg></button>
              <div class="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover/menu:block py-1 z-20">
                <button class="duplicate-btn w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">Duplicate</button>
                <button class="delete-btn w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        </div>
        
        <textarea class="w-full flex-1 text-gray-600 border-none focus:ring-0 p-0 resize-none bg-transparent leading-relaxed desc-input" placeholder="Enter shot description, VO notes, or creative directions...">${frame.desc}</textarea>
        
        <div class="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-4">
               <div class="flex -space-x-2">
                  <img class="w-6 h-6 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=33">
                  <div class="w-6 h-6 rounded-full border-2 border-white bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">C</div>
               </div>
               <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2 Feedback Notes</span>
            </div>
            <button class="status-badge px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-2">
               <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
               View Feedback
            </button>
        </div>
      </div>
    `;

    const titleInp = card.querySelector('.title-input');
    const descInp = card.querySelector('.desc-input');
    
    let origTitle = '';
    titleInp.onfocus = () => { origTitle = titleInp.value; };
    titleInp.onblur = () => { if(titleInp.value !== origTitle) performHistoryAction('Edit Title', () => { window.globalStyleFrames.find(f => f.id === frame.id).title = titleInp.value; }); };
    titleInp.oninput = (e) => { frame.title = e.target.value; };

    let origDesc = '';
    descInp.onfocus = () => { origDesc = descInp.value; };
    descInp.onblur = () => { if(descInp.value !== origDesc) performHistoryAction('Edit Description', () => { window.globalStyleFrames.find(f => f.id === frame.id).desc = descInp.value; }); };
    descInp.oninput = (e) => { frame.desc = e.target.value; };
    
    card.querySelector('.status-badge').onclick = () => {
      if(window.activeRole === 'client') return;
      performHistoryAction('Cycle Status', () => {
        const statuses = ['Draft', 'In Review', 'Approved'];
        let idx = statuses.indexOf(frame.status);
        window.globalStyleFrames.find(f => f.id === frame.id).status = statuses[(idx + 1) % statuses.length];
      });
    };

    if(!window.activeRole || window.activeRole === 'designer') {
      const imgInp = document.createElement('input');
      imgInp.type = 'file';
      imgInp.className = 'hidden';
      card.appendChild(imgInp);
      
      card.querySelector('.img-upload-area').onclick = () => imgInp.click();
      imgInp.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            performHistoryAction('Upload Frame', () => {
                window.globalStyleFrames.find(f => f.id === frame.id).img = ev.target.result;
            });
          };
          reader.readAsDataURL(file);
        }
      };

      card.querySelector('.delete-btn').onclick = () => {
        performHistoryAction('Delete Frame', () => {
            const trashId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tr' + Date.now();
            const payload = { id: trashId, title: frame.title || 'Untitled Frame', type: 'Style Frame', deletedAt: new Date().toLocaleDateString(), project: project.title, data: frame };
            window.appData.trash.push(payload);
            if(window.dbInsert) window.dbInsert('trash', {
               id: trashId,
               type: payload.type,
               title: payload.title,
               project: payload.project,
               payload: payload.data
            });
            window.globalStyleFrames = window.globalStyleFrames.filter(f => f.id !== frame.id);
        });
        window.updateBadges();
      };

      card.querySelector('.duplicate-btn').onclick = () => {
        performHistoryAction('Duplicate Frame', () => {
            const newF = JSON.parse(JSON.stringify(frame));
            newF.id = 'sf' + Date.now();
            window.globalStyleFrames.splice(window.globalStyleFrames.indexOf(frame) + 1, 0, newF);
        });
      };
    }

    return card;
  }

  function getStatusClass(status) {
    if(status === 'Approved') return 'bg-green-100 text-green-600';
    if(status === 'In Review') return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-500';
  }

  function initDragAndDrop() {
    let draggedItemIdx = null;

    // Main Cards Reordering
    const cards = framesContainer.querySelectorAll('.scene-card');
    cards.forEach((card, i) => {
      card.addEventListener('dragstart', (e) => {
        if(window.activeRole === 'client') return;
        draggedItemIdx = i;
        card.classList.add('opacity-40', 'scale-95');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('opacity-40', 'scale-95');
        draggedItemIdx = null;
      });
      card.addEventListener('dragover', (e) => e.preventDefault());
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if(draggedItemIdx !== null && draggedItemIdx !== i) {
          performHistoryAction('Reorder Scene', () => {
             const projFrames = getProjectFrames();
             const movedFrame = projFrames[draggedItemIdx];
             const targetFrame = projFrames[i];
             const globalFrom = window.globalStyleFrames.indexOf(movedFrame);
             const globalTo = window.globalStyleFrames.indexOf(targetFrame);
             window.globalStyleFrames.splice(globalFrom, 1);
             window.globalStyleFrames.splice(globalTo, 0, movedFrame);
          });
        }
      });
    });

    // Filmstrip Reordering (Sync with main)
    filmstrip.querySelectorAll('div').forEach((thumb, i) => {
      thumb.draggable = true;
      thumb.ondragstart = () => { 
        if(window.activeRole === 'client') return;
        draggedItemIdx = i; 
        thumb.style.opacity = '0.5'; 
      };
      thumb.ondragend = () => { thumb.style.opacity = '1'; draggedItemIdx = null; };
      thumb.ondragover = (e) => e.preventDefault();
      thumb.ondrop = () => {
        if(draggedItemIdx !== null && draggedItemIdx !== i) {
          performHistoryAction('Reorder Scene', () => {
             const projFrames = getProjectFrames();
             const movedFrame = projFrames[draggedItemIdx];
             const targetFrame = projFrames[i];
             const globalFrom = window.globalStyleFrames.indexOf(movedFrame);
             const globalTo = window.globalStyleFrames.indexOf(targetFrame);
             window.globalStyleFrames.splice(globalFrom, 1);
             window.globalStyleFrames.splice(globalTo, 0, movedFrame);
          });
        }
      };
    });
  }

  addSceneBtn.onclick = () => {
    performHistoryAction('Add Scene', () => {
        window.globalStyleFrames.push({
          id: 'sf' + Date.now(),
          title: '',
          desc: '',
          img: '',
          client: window.activeClient === 'All' ? 'Acme Corp' : window.activeClient,
          status: 'Draft'
        });
    });
  };

  const presentBtn = document.getElementById('sf-present-btn');
  const presMode = document.getElementById('sf-presentation-mode');
  const closePres = document.getElementById('sf-close-pres');
  const presImg = document.getElementById('sf-pres-img');
  const presTitle = document.getElementById('sf-pres-title');
  const presDesc = document.getElementById('sf-pres-desc');
  const presNum = document.getElementById('sf-pres-num');
  const presCounter = document.getElementById('sf-pres-counter');
  let presIndex = 0;

  presentBtn.onclick = () => {
    presIndex = 0;
    updatePresSlide();
    presMode.classList.remove('hidden');
    setTimeout(() => presMode.classList.add('opacity-100'), 10);
    if(presMode.requestFullscreen) presMode.requestFullscreen();
  };

  closePres.onclick = () => {
    if(document.fullscreenElement) document.exitFullscreen();
    presMode.classList.remove('opacity-100');
    setTimeout(() => presMode.classList.add('hidden'), 300);
  };

  function updatePresSlide(direction = 'none') {
    const projFrames = getProjectFrames();
    const frame = projFrames[presIndex];
    if(!frame) return;
    
    const contentBox = document.querySelector('#sf-presentation-mode > .flex-1');
    
    // Simple slide animation based on direction
    if(direction !== 'none') {
        contentBox.classList.add('transition-transform', 'duration-300', 'ease-in-out', 'opacity-0');
        contentBox.classList.add(direction === 'next' ? '-translate-x-full' : 'translate-x-full');
        
        setTimeout(() => {
            presImg.src = frame.img || '';
            presTitle.textContent = frame.title || 'Untitled';
            presDesc.textContent = frame.desc || 'No description provided.';
            presNum.textContent = `Scene ${String(presIndex + 1).padStart(2, '0')}`;
            presCounter.textContent = `${presIndex + 1} / ${projFrames.length}`;
            
            contentBox.classList.remove('-translate-x-full', 'translate-x-full');
            contentBox.classList.add(direction === 'next' ? 'translate-x-full' : '-translate-x-full');
            
            requestAnimationFrame(() => {
                contentBox.classList.remove('translate-x-full', '-translate-x-full', 'opacity-0');
            });
        }, 150);
    } else {
        presImg.src = frame.img || '';
        presTitle.textContent = frame.title || 'Untitled';
        presDesc.textContent = frame.desc || 'No description provided.';
        presNum.textContent = `Scene ${String(presIndex + 1).padStart(2, '0')}`;
        presCounter.textContent = `${presIndex + 1} / ${projFrames.length}`;
    }
  }

  document.getElementById('sf-next-btn').onclick = () => {
    if(presIndex < getProjectFrames().length - 1) { presIndex++; updatePresSlide('next'); }
  };
  document.getElementById('sf-prev-btn').onclick = () => {
    if(presIndex > 0) { presIndex--; updatePresSlide('prev'); }
  };

  renderFrames();

  // Toolbar button handlers
  document.getElementById('sf-share-btn').onclick = () => {
    if(window.renderInviteModal) { window.renderInviteModal(document.body); window.openInviteModal(); }
  };

  document.getElementById('sf-deliver-btn').onclick = () => {
    if(window.triggerNotification) window.triggerNotification('delivery_styleframes');
    else window.showToast('Project delivered to client!');
  };
};


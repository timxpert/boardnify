window.initStyleFrames = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  container.innerHTML = `
    <div class="view-container h-full bg-bg-main flex flex-col overflow-hidden">
      <header class="p-6 bg-white border-b border-border-light shrink-0">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1 class="text-xl font-black text-text-dark tracking-tight">Styleframes</h1>
            <p class="text-[10px] font-black text-text-muted uppercase tracking-widest">Creative Sequence</p>
          </div>
          <button id="add-scene-btn" class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>
        
        <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button id="sf-undo-btn" class="px-4 py-2 rounded-lg bg-gray-50 border border-border-light text-[10px] font-black uppercase tracking-widest text-text-muted disabled:opacity-30">Undo</button>
          <button id="sf-redo-btn" class="px-4 py-2 rounded-lg bg-gray-50 border border-border-light text-[10px] font-black uppercase tracking-widest text-text-muted disabled:opacity-30">Redo</button>
          <button id="sf-present-btn" class="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary ml-auto">Present</button>
        </div>
      </header>
      
      <div id="frames-container" class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Scenes rendered here -->
      </div>
    </div>

    <!-- Presentation Mode -->
    <div id="sf-presentation-mode" class="fixed inset-0 bg-[#0A0A0A] z-[2000] flex flex-col hidden opacity-0 transition-opacity duration-300">
      <div class="p-6 flex justify-between items-center absolute top-0 w-full z-10">
        <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest" id="sf-pres-counter">0 / 0</div>
        <button id="sf-close-pres" class="text-gray-500 hover:text-white transition-colors p-2">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div class="w-full aspect-video bg-black flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/5">
          <img id="sf-pres-img" src="" class="max-w-full max-h-full object-contain">
        </div>
        <div class="text-center px-4">
          <h2 id="sf-pres-title" class="text-xl font-black text-white mb-2 uppercase tracking-tight"></h2>
          <p id="sf-pres-desc" class="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto"></p>
        </div>
      </div>
    </div>
  `;

  const framesContainer = document.getElementById('frames-container');
  const filmstrip = document.getElementById('sf-filmstrip');

  if (!project.data) project.data = {};
  if (!project.data.frames) project.data.frames = [
    { id: 'sf1', title: 'Opening Scene', desc: 'Minimal intro sequence.', img: '' }
  ];

  window.globalStyleFrames = project.data.frames;

  // --- History Manager ---
  let history = [JSON.parse(JSON.stringify(window.globalStyleFrames))];
  let historyIdx = 0;
  let selectedFrameId = null;

  const pushHistory = () => {
    history = history.slice(0, historyIdx + 1);
    history.push(JSON.parse(JSON.stringify(window.globalStyleFrames)));
    historyIdx++;
    updateToolbarState();
  };

  const updateToolbarState = () => {
    const undoBtn = document.getElementById('sf-undo-btn');
    const redoBtn = document.getElementById('sf-redo-btn');
    const deleteBtn = document.getElementById('sf-delete-btn');
    if (undoBtn) undoBtn.disabled = historyIdx <= 0;
    if (redoBtn) redoBtn.disabled = historyIdx >= history.length - 1;
    if (deleteBtn) deleteBtn.disabled = !selectedFrameId;
  };

  const saveState = () => {
    project.data.frames = window.globalStyleFrames;
    const _pId = projectId || window.currentProject;
    if (_pId && window.dbUpdate) window.dbUpdate('projects', _pId, { data: project.data });
  };

  function renderFrames() {
    framesContainer.innerHTML = '';

    window.globalStyleFrames.forEach((frame, index) => {
      const card = document.createElement('div');
      card.className = `bento-card flex flex-col gap-4 relative group transition-all duration-300 ${selectedFrameId === frame.id ? 'border-primary ring-2 ring-primary/10' : 'border-border-light'}`;
      card.dataset.id = frame.id;
      card.innerHTML = `
        <div class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-border-light text-[8px] font-black text-text-dark shadow-sm uppercase tracking-widest">
          #${String(index + 1).padStart(2, '0')}
        </div>

        <div class="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden cursor-pointer relative group/upload upload-zone">
          ${frame.img ? `
            <img src="${frame.img}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <div class="w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-primary">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12h.01M16 6l-4-4-4 4m4-4v12"></path></svg>
              </div>
            </div>
          ` : `
            <div class="w-full h-full flex flex-col items-center justify-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-white border border-border-light flex items-center justify-center text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">Upload Frame</span>
            </div>
          `}
          <input type="file" class="hidden" accept="image/*">
        </div>
        
        <div class="flex flex-col gap-3">
          <input type="text" class="text-base font-black text-text-dark border-none focus:ring-0 p-0 bg-transparent w-full placeholder-gray-200 tracking-tight" placeholder="Scene Title" value="${frame.title || ''}">
          <textarea class="w-full text-xs text-text-muted border-none focus:ring-0 p-0 resize-none bg-transparent leading-relaxed placeholder-gray-200 font-medium h-16" placeholder="Visual description...">${frame.desc || ''}</textarea>
          
          <div class="flex justify-between items-center pt-2 border-t border-gray-50">
            <span class="text-[8px] font-black text-gray-200 uppercase tracking-widest">${frame.id.substring(0,8)}</span>
            <button class="delete-scene-btn w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('input, textarea, button, .upload-zone')) return;
        selectedFrameId = frame.id;
        document.querySelectorAll('[data-id]').forEach(c => c.classList.remove('border-primary', 'ring-2', 'ring-primary/10'));
        card.classList.add('border-primary', 'ring-2', 'ring-primary/10');
        updateToolbarState();
      };

      const titleInp = card.querySelector('input[type="text"]');
      const descInp = card.querySelector('textarea');
      const fileInp = card.querySelector('input[type="file"]');
      const uploadZone = card.querySelector('.upload-zone');

      uploadZone.onclick = () => fileInp.click();

      titleInp.onblur = () => { frame.title = titleInp.value; saveState(); pushHistory(); };
      descInp.onblur = () => { frame.desc = descInp.value; saveState(); pushHistory(); };
      fileInp.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            frame.img = ev.target.result;
            saveState();
            pushHistory();
            renderFrames();
          };
          reader.readAsDataURL(file);
        }
      };

      card.querySelector('.delete-scene-btn').onclick = (e) => {
        e.stopPropagation();
        window.deleteFrame(frame.id);
      };

      framesContainer.appendChild(card);
    });

    updateToolbarState();
  }

  window.deleteFrame = (id) => {
    if (confirm('Are you sure you want to delete this scene?')) {
      window.globalStyleFrames = window.globalStyleFrames.filter(f => f.id !== id);
      if (selectedFrameId === id) selectedFrameId = null;
      saveState();
      pushHistory();
      renderFrames();
    }
  };

  // Header toolbar buttons
  document.getElementById('add-scene-btn').onclick = () => {
    window.globalStyleFrames.push({ id: 'sf' + Date.now(), title: '', desc: '', img: '' });
    saveState();
    pushHistory();
    renderFrames();
    setTimeout(() => {
      const last = framesContainer.lastElementChild;
      if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  document.getElementById('sf-undo-btn').onclick = () => {
    if (historyIdx <= 0) return;
    historyIdx--;
    window.globalStyleFrames = JSON.parse(JSON.stringify(history[historyIdx]));
    project.data.frames = window.globalStyleFrames;
    saveState();
    renderFrames();
  };

  document.getElementById('sf-redo-btn').onclick = () => {
    if (historyIdx >= history.length - 1) return;
    historyIdx++;
    window.globalStyleFrames = JSON.parse(JSON.stringify(history[historyIdx]));
    project.data.frames = window.globalStyleFrames;
    saveState();
    renderFrames();
  };

  document.getElementById('sf-delete-btn').onclick = () => {
    if (selectedFrameId) window.deleteFrame(selectedFrameId);
  };

  // Keyboard shortcuts
  const kbHandler = (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); document.getElementById('sf-undo-btn')?.click(); }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) { e.preventDefault(); document.getElementById('sf-redo-btn')?.click(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFrameId) { e.preventDefault(); window.deleteFrame(selectedFrameId); }
  };
  window.addEventListener('keydown', kbHandler);

  // Presentation Mode
  let presIdx = 0;
  const presMode = document.getElementById('sf-presentation-mode');
  const presImg = document.getElementById('sf-pres-img');
  const presTitle = document.getElementById('sf-pres-title');
  const presDesc = document.getElementById('sf-pres-desc');
  const presCounter = document.getElementById('sf-pres-counter');

  const showSlide = (i) => {
    const f = window.globalStyleFrames[i];
    presImg.src = f?.img || '';
    presTitle.textContent = f?.title || '';
    presDesc.textContent = f?.desc || '';
    presCounter.textContent = `${i + 1} / ${window.globalStyleFrames.length}`;
  };

  document.getElementById('sf-present-btn').onclick = () => {
    if (!window.globalStyleFrames.length) return;
    presIdx = 0;
    showSlide(0);
    presMode.classList.remove('hidden');
    setTimeout(() => presMode.classList.remove('opacity-0'), 10);
  };

  document.getElementById('sf-close-pres').onclick = () => {
    presMode.classList.add('opacity-0');
    setTimeout(() => presMode.classList.add('hidden'), 300);
  };

  presMode.onclick = () => {
    presIdx = (presIdx + 1) % window.globalStyleFrames.length;
    showSlide(presIdx);
  };

  renderFrames();
};

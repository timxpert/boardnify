window.initStyleFrames = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  
  container.innerHTML = `
    <div class="view-container h-full bg-[#F5F5F7] flex flex-col overflow-hidden">
      <header class="h-20 px-10 border-b border-border-light bg-white flex justify-between items-center shrink-0">
        <div>
          <h1 class="text-2xl font-black text-text-dark tracking-tight">Styleframes</h1>
          <p class="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mt-1">Design Sequence &amp; Creative Visualization</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Undo/Redo/Delete cluster -->
          <div class="flex items-center gap-1 border border-border-light rounded-xl p-1 bg-gray-50">
            <button id="sf-undo-btn" title="Undo (Ctrl+Z)" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-dark hover:bg-white transition-all disabled:opacity-30" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            </button>
            <button id="sf-redo-btn" title="Redo (Ctrl+Y)" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-dark hover:bg-white transition-all disabled:opacity-30" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/></svg>
            </button>
            <div class="w-px h-5 bg-border-light mx-1"></div>
            <button id="sf-delete-btn" title="Delete selected scene" class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>

          <button id="add-scene-btn" class="px-6 py-2.5 rounded-xl border border-border-light text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-text-dark hover:bg-gray-50 transition-all shadow-sm">
            + Add Scene
          </button>
          <button id="sf-present-btn" class="bg-brand hover:opacity-90 text-white px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-all">
            Present
          </button>
        </div>
      </header>
      
      <!-- Scrollable frames area — grows, never shrinks -->
      <div id="frames-container" class="flex-1 overflow-y-auto p-12 flex flex-col gap-12 bg-[#F5F5F7]">
        <!-- Scenes rendered here -->
      </div>

      <!-- Filmstrip -->
      <div class="h-28 bg-white border-t border-border-light px-10 flex gap-4 overflow-x-auto items-center scrollbar-hide shrink-0" id="sf-filmstrip"></div>
    </div>

    <!-- Presentation Mode -->
    <div id="sf-presentation-mode" class="fixed inset-0 bg-[#0A0A0A] z-[200] flex flex-col hidden opacity-0 transition-opacity duration-300">
      <div class="p-8 flex justify-between items-center absolute top-0 w-full z-10">
        <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest" id="sf-pres-counter">0 / 0</div>
        <button id="sf-close-pres" class="text-gray-500 hover:text-white transition-colors p-2">
           <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="flex-1 flex flex-col items-center justify-center p-12 gap-12">
        <div class="w-full max-w-6xl aspect-video bg-black flex items-center justify-center rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5">
          <img id="sf-pres-img" src="" class="max-w-full max-h-full object-contain">
        </div>
        <div class="max-w-3xl text-center">
          <h2 id="sf-pres-title" class="text-3xl font-black text-white mb-6 uppercase tracking-tight"></h2>
          <p id="sf-pres-desc" class="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto font-medium"></p>
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
    filmstrip.innerHTML = '';

    window.globalStyleFrames.forEach((frame, index) => {
      const card = document.createElement('div');
      // Fixed-size card: never shrinks — always 280px tall for the image area
      card.className = `bg-white border-2 rounded-3xl overflow-hidden flex flex-col md:flex-row max-w-[960px] mx-auto w-full group hover:shadow-2xl hover:shadow-black/5 transition-all duration-300 relative cursor-pointer shrink-0 ${selectedFrameId === frame.id ? 'border-brand' : 'border-border-light'}`;
      card.dataset.id = frame.id;
      card.innerHTML = `
        <!-- Scene Number -->
        <div class="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border-light text-[9px] font-black text-text-dark shadow-sm uppercase tracking-[0.2em]">
          Scene ${String(index + 1).padStart(2, '0')}
        </div>

        <!-- Left: Upload Area (Fixed Size — always 280px tall) -->
        <div class="w-full md:w-[400px] h-[280px] bg-[#F9F9FB] p-4 shrink-0">
           <div class="w-full h-full border-2 border-dashed border-border-light rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand/40 hover:bg-white transition-all group/upload relative overflow-hidden upload-zone">
              ${frame.img ? `
                <img src="${frame.img}" class="w-full h-full object-cover rounded-xl">
                <div class="absolute inset-0 bg-brand/5 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] rounded-xl">
                   <div class="w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center text-brand transform scale-90 group-hover/upload:scale-100 transition-transform">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12h.01M16 6l-4-4-4 4m4-4v12"></path></svg>
                   </div>
                </div>
              ` : `
                <div class="w-14 h-14 rounded-2xl bg-white border border-border-light flex items-center justify-center text-text-muted mb-4 shadow-sm group-hover/upload:scale-110 smooth-transition">
                   <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <span class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Upload Frame</span>
              `}
           </div>
           <input type="file" class="hidden" accept="image/*">
        </div>
        
        <!-- Right: Metadata -->
        <div class="flex-1 p-10 flex flex-col bg-white min-h-[280px]">
          <input type="text" class="text-2xl font-black text-text-dark border-none focus:ring-0 p-0 mb-6 bg-transparent w-full placeholder-text-muted/20 tracking-tight" placeholder="Scene Title..." value="${frame.title || ''}">
          <textarea class="w-full flex-1 text-sm text-text-muted border-none focus:ring-0 p-0 resize-none bg-transparent leading-relaxed placeholder-text-muted/20 font-medium" placeholder="Break down the visual details, action, or camera movement here...">${frame.desc || ''}</textarea>
          
          <div class="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center">
            <span class="text-[10px] font-black text-gray-200 uppercase tracking-widest select-none">${frame.id}</span>
            <button class="delete-scene-btn text-[10px] font-black text-red-400/50 hover:text-red-500 uppercase tracking-[0.2em] transition-all flex items-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Delete Scene
            </button>
          </div>
        </div>
      `;

      // Select card on click
      card.onclick = (e) => {
        if (e.target.closest('input, textarea, button, .upload-zone')) return;
        selectedFrameId = frame.id;
        document.querySelectorAll('[data-id]').forEach(c => c.classList.replace('border-brand', 'border-border-light'));
        card.classList.replace('border-border-light', 'border-brand');
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

      // Filmstrip thumbnail
      const thumb = document.createElement('div');
      thumb.className = `w-32 h-20 rounded-xl border-2 shrink-0 cursor-pointer overflow-hidden transition-all duration-300 ${frame.img ? 'border-border-light' : 'border-dashed border-border-light bg-gray-50'}`;
      thumb.innerHTML = frame.img
        ? `<img src="${frame.img}" class="w-full h-full object-cover">`
        : '<div class="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase">Empty</div>';
      thumb.onclick = () => card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      filmstrip.appendChild(thumb);
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

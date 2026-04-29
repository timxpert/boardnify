window.initScript = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;
  const userId = window.appData?.user?.id;

  // --- STATE ---
  let scripts = [];
  let currentView = 'dashboard'; // 'dashboard' or 'editor'
  let activeScript = null;
  let autoSaveTimer = null;

  // --- HTML TEMPLATES ---
  const dashboardLayout = `
    <div class="h-full flex flex-col bg-bg-canvas overflow-y-auto scrollbar-hide">
      <header class="flex items-center justify-between px-10 py-10 shrink-0">
        <div>
          <h1 class="text-3xl font-black text-text-main tracking-tight font-['Cabinet_Grotesk']">Scripts</h1>
          <p class="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-70">Project Library & Writing Suite</p>
        </div>
        <div class="flex gap-3">
          <button id="btn-upload-script" class="px-6 py-3 bg-white border border-border-light text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 smooth-transition shadow-subtle flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Upload
          </button>
          <button id="btn-new-script" class="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:brightness-110 smooth-transition shadow-card flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            New Script
          </button>
        </div>
      </header>

      <div id="scripts-grid" class="px-10 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Cards Injected -->
      </div>

      <div id="scripts-empty" class="hidden flex-1 flex flex-col items-center justify-center text-center p-20 animate-fade-in">
        <div class="w-24 h-24 bg-white rounded-[40px] shadow-card border border-border-light flex items-center justify-center mb-8">
           <svg class="w-10 h-10 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </div>
        <h2 class="text-2xl font-black text-text-main mb-3 font-['Cabinet_Grotesk']">No scripts yet</h2>
        <p class="text-sm text-text-muted font-medium mb-10 max-w-xs leading-relaxed">Start drafting your idea from scratch or import an existing document.</p>
        <div class="flex gap-4">
           <button class="welcome-new-btn px-8 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-card">Blank Script</button>
           <button class="welcome-upload-btn px-8 py-4 bg-white border border-border-light text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-subtle">Import File</button>
        </div>
      </div>
    </div>
  `;

  const editorLayout = `
    <div class="h-full flex flex-col bg-white overflow-hidden animate-fade-in">
      <header class="h-20 border-b border-border-light px-8 flex items-center justify-between z-50 bg-white/95 backdrop-blur-xl shrink-0">
         <div class="flex items-center gap-6 flex-1">
            <button id="editor-back" class="p-3 -ml-3 text-gray-400 hover:text-text-main smooth-transition bg-bg-soft rounded-2xl active:scale-95">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <div class="flex flex-col">
              <span class="text-[9px] font-black text-primary uppercase tracking-[0.15em] mb-0.5">Project Editor</span>
              <input id="script-title-input" type="text" placeholder="Untitled script" 
                class="bg-transparent border-none outline-none font-black text-lg text-text-main placeholder:text-gray-200 p-0 focus:ring-0">
              <div class="h-0.5 w-full bg-primary/20 rounded-full mt-1"></div>
            </div>
         </div>

         <div class="flex items-center gap-6">
            <div id="save-indicator" class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 bg-bg-soft px-4 py-2 rounded-full border border-border-light">
               <span class="w-2 h-2 rounded-full bg-green-400"></span>
               AUTOSAVE: ON
            </div>
            <button class="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-card hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              Share Board
            </button>
         </div>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-12 flex justify-center bg-bg-canvas scrollbar-hide relative" id="editor-scroll">
         <div class="w-full max-w-3xl flex flex-col items-center">
            <!-- Floating Toolbar -->
            <div class="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
               <div class="bg-white/95 backdrop-blur-xl border border-border-light shadow-floating rounded-full p-2 flex items-center gap-1.5">
                  <button data-cmd="bold" class="tool-btn" title="Bold"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path></svg></button>
                  <button data-cmd="italic" class="tool-btn" title="Italic"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m-9 16h5m1-16h5"></path></svg></button>
                  <button data-cmd="underline" class="tool-btn" title="Underline"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 3v7a5 5 0 0010 0V3M5 20h14"></path></svg></button>
                  <div class="w-px h-5 bg-border-light mx-1"></div>
                  <button data-cmd="formatBlock" data-val="H1" class="tool-btn text-[10px] font-black">H1</button>
                  <button data-cmd="formatBlock" data-val="H2" class="tool-btn text-[10px] font-black">H2</button>
                  <button data-cmd="formatBlock" data-val="BLOCKQUOTE" class="tool-btn" title="Production Note">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                  </button>
                  <div class="w-px h-5 bg-border-light mx-1"></div>
                  <button data-cmd="insertUnorderedList" class="tool-btn"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16M4 6h.01M4 12h.01M4 18h.01"></path></svg></button>
                  <button data-cmd="undo" class="tool-btn ml-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg></button>
               </div>
            </div>

            <div id="script-canvas" contenteditable="true" 
                 class="min-h-[800px] w-full bg-white rounded-[40px] shadow-card border border-border-light p-16 md:p-24 focus:outline-none text-[16px] leading-[2] text-text-main font-normal empty:before:content-[attr(data-placeholder)] empty:before:text-gray-200"
                 data-placeholder="Once upon a time..."></div>
         </div>
      </div>

      <footer class="h-14 border-t border-border-light px-10 flex items-center justify-between shrink-0 bg-white z-50">
         <div class="flex items-center gap-8">
            <span class="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
              <span id="word-count" class="text-primary">0</span> WORDS
            </span>
            <span class="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
              <span id="char-count" class="text-primary">0</span> CHARS
            </span>
         </div>
         <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span class="text-[10px] font-black text-primary uppercase tracking-widest">Online Sync Active</span>
         </div>
      </footer>
    </div>
  `;

  // --- CORE LOGIC ---
  const loadScripts = async () => {
    try {
      const { data, error } = await window.supabaseClient
        .from('scripts')
        .select('*')
        .eq('project_id', _projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      scripts = data || [];
      render();
    } catch (err) {
      console.error('Failed to load scripts:', err);
      if (window.showToast) window.showToast('Failed to load scripts', 'error');
    }
  };

  const render = () => {
    if (currentView === 'dashboard') renderDashboard();
    else renderEditor();
  };

  const renderDashboard = () => {
    container.innerHTML = dashboardLayout;
    const grid = document.getElementById('scripts-grid');
    const empty = document.getElementById('scripts-empty');

    if (scripts.length === 0) {
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      grid.classList.remove('hidden');
      empty.classList.add('hidden');
      grid.innerHTML = scripts.map(s => {
        const excerpt = s.content ? s.content.replace(/<[^>]*>/g, '').substring(0, 80) : 'No content yet...';
        const dateStr = formatHumanDate(s.updated_at);
        return `
          <div class="script-card relative bg-white rounded-3xl p-8 border border-border-light shadow-subtle hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer" onclick="window.enterScript('${s.id}')">
            <div class="absolute top-6 right-6 z-10">
               <button class="p-3 bg-bg-soft rounded-xl text-gray-400 hover:text-primary transition-colors" onclick="event.stopPropagation(); window.toggleScriptMenu(this, '${s.id}')">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 5v.01M12 12v.01M12 19v.01"></path></svg>
               </button>
            </div>
            <div class="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 class="text-lg font-black text-text-main mb-3 truncate pr-10 font-['Cabinet_Grotesk']">${s.title}</h3>
            <p class="text-[13px] text-text-muted leading-relaxed line-clamp-3 mb-8 font-medium">${excerpt}</p>
            <div class="flex items-center justify-between pt-6 border-t border-gray-50">
               <div class="flex items-center gap-2">
                 <div class="w-2 h-2 rounded-full bg-primary/40"></div>
                 <span class="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">${s.source || 'TYPED'}</span>
               </div>
               <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest">${dateStr}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Wiring Dashboard Buttons
    document.getElementById('btn-new-script').onclick = createBlankScript;
    document.getElementById('btn-upload-script').onclick = uploadScriptFile;
    empty.querySelector('.welcome-new-btn').onclick = createBlankScript;
    empty.querySelector('.welcome-upload-btn').onclick = uploadScriptFile;
  };

  const renderEditor = () => {
    container.innerHTML = editorLayout;
    const titleInput = document.getElementById('script-title-input');
    const canvas = document.getElementById('script-canvas');
    const backBtn = document.getElementById('editor-back');

    titleInput.value = activeScript.title;
    canvas.innerHTML = activeScript.content || '';
    
    // Auto-focus title if brand new
    if (activeScript.title === 'Untitled script') titleInput.select();

    // Event Listeners
    backBtn.onclick = () => {
      currentView = 'dashboard';
      activeScript = null;
      render();
    };

    titleInput.oninput = () => {
      activeScript.title = titleInput.value;
      triggerAutoSave();
    };

    canvas.oninput = () => {
      activeScript.content = canvas.innerHTML;
      updateEditorStats();
      triggerAutoSave();
      applySceneStyling(canvas);
    };

    // Toolbar logic
    document.querySelectorAll('.tool-btn').forEach(btn => {
       btn.onclick = () => {
          const cmd = btn.dataset.cmd;
          const val = btn.dataset.val || null;
          document.execCommand(cmd, false, val);
          canvas.focus();
       };
    });

    updateEditorStats();
  };

  const updateEditorStats = () => {
    const canvas = document.getElementById('script-canvas');
    if (!canvas) return;
    const text = canvas.innerText || '';
    const words = text.trim().split(/\s+/).filter(x => x.length > 0).length;
    const chars = text.length;
    document.getElementById('word-count').textContent = words;
    document.getElementById('char-count').textContent = chars;
  };

  // --- ACTIONS ---
  window.enterScript = (id) => {
    activeScript = scripts.find(s => s.id === id);
    if (!activeScript) return;
    currentView = 'editor';
    render();
  };

  const createBlankScript = async () => {
    const newScript = {
      project_id: _projectId,
      user_id: userId,
      title: 'Untitled script',
      content: '',
      source: 'typed'
    };

    try {
      const { data, error } = await window.supabaseClient
        .from('scripts')
        .insert(newScript)
        .select()
        .single();

      if (error) throw error;
      scripts.unshift(data);
      activeScript = data;
      currentView = 'editor';
      render();
      if (window.showToast) window.showToast('New script created');
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast('Failed to create script', 'error');
    }
  };

  const uploadScriptFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.md';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (window.showToast) window.showToast('Analysing document...', 'info');

      try {
        let content = '';
        if (file.name.endsWith('.pdf')) {
          content = await extractTextFromPDF(file);
        } else {
          content = await file.text();
          if (file.name.endsWith('.md')) {
            content = content.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br>');
          } else {
            content = content.split('\n').map(l => `<p>${l}</p>`).join('');
          }
        }

        const newScript = {
          project_id: _projectId,
          user_id: userId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: content,
          source: 'uploaded'
        };

        const { data, error } = await window.supabaseClient
          .from('scripts')
          .insert(newScript)
          .select()
          .single();

        if (error) throw error;
        scripts.unshift(data);
        activeScript = data;
        currentView = 'editor';
        render();
        if (window.showToast) window.showToast('Document uploaded successfully');
      } catch (err) {
        console.error(err);
        if (window.showToast) window.showToast('Import failed: ' + err.message, 'error');
      }
    };
    input.click();
  };

  const extractTextFromPDF = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `<p>${pageText}</p>`;
          }
          resolve(fullText);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const triggerAutoSave = () => {
    updateSaveIndicator('saving');
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(performSave, 1000);
  };

  const performSave = async () => {
    if (!activeScript) return;
    try {
      const { error } = await window.supabaseClient
        .from('scripts')
        .update({
          title: activeScript.title,
          content: activeScript.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeScript.id);

      if (error) throw error;
      updateSaveIndicator('saved');
    } catch (err) {
      console.error('Save failed:', err);
      updateSaveIndicator('failed');
    }
  };

  const updateSaveIndicator = (status) => {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    if (status === 'saving') {
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span> SAVING...';
      el.style.opacity = '1';
    } else if (status === 'saved') {
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span> SAVED';
      setTimeout(() => { if (el) el.style.opacity = '0.3'; }, 2000);
    } else {
      el.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> UNSAVED CHANGES';
      el.style.opacity = '1';
    }
  };

  const applySceneStyling = (canvas) => {
    // Light scene slug styling if supported
    // For now we keep it simple as requested
  };

  const formatHumanDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 6) / (60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // --- MENU ACTIONS ---
  window.toggleScriptMenu = (btn, id) => {
     const existing = document.getElementById('script-context-menu');
     if (existing) existing.remove();

     const menu = document.createElement('div');
     menu.id = 'script-context-menu';
     menu.className = 'fixed bg-white shadow-2xl rounded-2xl border border-gray-100 py-2 w-48 z-[1000] animate-in zoom-in-95 duration-200';
     const rect = btn.getBoundingClientRect();
     menu.style.top = `${rect.bottom + 10}px`;
     menu.style.left = `${rect.right - 192}px`;

     menu.innerHTML = `
        <button class="w-full text-left px-4 py-2.5 text-xs font-bold text-text-dark hover:bg-gray-50 flex items-center gap-3 transition-colors" onclick="window.renameScript('${id}')">
           <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
           Rename
        </button>
        <button class="w-full text-left px-4 py-2.5 text-xs font-bold text-text-dark hover:bg-gray-50 flex items-center gap-3 transition-colors" onclick="window.duplicateScript('${id}')">
           <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
           Duplicate
        </button>
        <div class="h-px bg-gray-50 my-1 mx-2"></div>
        <button class="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors" onclick="window.deleteScript('${id}')">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
           Delete
        </button>
     `;
     document.body.appendChild(menu);

     const closeHandler = (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
           menu.remove();
           document.removeEventListener('click', closeHandler);
        }
     };
     document.addEventListener('click', closeHandler);
  };

  window.renameScript = async (id) => {
     const s = scripts.find(i => i.id === id);
     if (!s) return;
     const newName = prompt('Enter new script title:', s.title);
     if (newName && newName !== s.title) {
        try {
           await window.supabaseClient.from('scripts').update({ title: newName }).eq('id', id);
           s.title = newName;
           render();
           if (window.showToast) window.showToast('Renamed successfully');
        } catch (err) { console.error(err); }
     }
  };

  window.duplicateScript = async (id) => {
     const s = scripts.find(i => i.id === id);
     if (!s) return;
     const copy = { ...s, title: s.title + ' (Copy)' };
     delete copy.id;
     delete copy.created_at;
     delete copy.updated_at;

     try {
        const { data, error } = await window.supabaseClient.from('scripts').insert(copy).select().single();
        if (error) throw error;
        scripts.unshift(data);
        render();
        if (window.showToast) window.showToast('Script duplicated');
     } catch (err) { console.error(err); }
  };

  window.deleteScript = async (id) => {
     if (!confirm('Delete this script? This cannot be undone.')) return;
     try {
        await window.supabaseClient.from('scripts').delete().eq('id', id);
        scripts = scripts.filter(s => s.id !== id);
        render();
        if (window.showToast) window.showToast('Script deleted');
     } catch (err) { console.error(err); }
  };

  // --- INIT ---
  loadScripts();

  // Styles
  const style = document.createElement('style');
  style.innerHTML = `
    .tool-btn {
      width: 40px; height: 40px; display: flex; align-items: center; justify-center; 
      color: #64748b; border-radius: 100px; transition: all 0.2s;
    }
    .tool-btn:hover { background: #F5F4FF; color: var(--primary); transform: scale(1.1); }
    .tool-btn:active { transform: scale(0.9); }
    
    #script-canvas h1 { font-family: 'Cabinet Grotesk', sans-serif; font-size: 2.75rem; font-weight: 900; margin-bottom: 2rem; letter-spacing: -0.03em; color: var(--text-main); }
    #script-canvas h2 { font-family: 'Cabinet Grotesk', sans-serif; font-size: 1.75rem; font-weight: 800; margin-top: 3rem; margin-bottom: 1.5rem; color: var(--text-main); }
    #script-canvas p { margin-bottom: 1.5rem; color: #4B4B4B; }
    #script-canvas blockquote {
      background: #F8F7FF;
      border-left: 4px solid var(--primary);
      padding: 24px;
      border-radius: 0 24px 24px 0;
      margin: 2rem 0;
      font-style: italic;
      color: var(--primary);
      font-weight: 500;
    }
    #script-canvas blockquote:before {
      content: 'PRODUCTION NOTE';
      display: block;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.2em;
      margin-bottom: 12px;
      opacity: 0.6;
    }
  `;
  document.head.appendChild(style);
};

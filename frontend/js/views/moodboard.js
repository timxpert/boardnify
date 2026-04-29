(function() {
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  class UndoManager {
    constructor() { this.history = []; this.index = -1; }
    push(elements, connections) {
      const stateStr = JSON.stringify({ elements, connections });
      if (this.history[this.index] && this.history[this.index].raw === stateStr) return;

      this.history = this.history.slice(0, this.index + 1);
      this.history.push({ 
        elements: JSON.parse(stateStr), 
        connections: JSON.parse(JSON.stringify(connections)),
        raw: stateStr
      });
      this.index++;
      if (this.history.length > 50) { this.history.shift(); this.index--; }
    }
    undo() {
      if (this.index <= 0) return null;
      this.index--;
      return JSON.parse(JSON.stringify(this.history[this.index]));
    }
    redo() {
      if (this.index >= this.history.length - 1) return null;
      this.index++;
      return JSON.parse(JSON.stringify(this.history[this.index]));
    }
  }
  const undoMgr = new UndoManager();
  let canvas, ctx, elements = [], selectedElements = new Set();
  let isDragging = false, dragStart = { x: 0, y: 0 };
  let scale = 1, panX = 0, panY = 0, pointers = new Map();
  let isLassoing = false, lassoStart = { x: 0, y: 0 }, lassoBox = null;
  let connections = []; // { id, fromId, toId, style, thickness, color, headStart, headEnd, startPos, endPos }
  let selectedConnectionId = null;
  let isMovingArrowHandle = false, arrowTargetId = null, arrowHandleType = null;
  let svgLayer, elementsLayer;
  let currentTool = 'select';
  let highestZ = 1000;
  let isPanning = false, lastDist = 0;
  let isResizing = false, resizeDir = null, resizeTargetId = null;

  const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  const isMobile = () => {
    const isSmall = window.innerWidth <= 768;
    console.log("[Boardnify] UI Detection - screenWidth:", window.innerWidth, "isMobile:", isSmall);
    return isSmall;
  };

  const debounce = (func, wait) => {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  };

  let lastUpdateId = null;

  window.initMoodboard = function(container, socket, projectId) {
    if (!container) return;
    const proj = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
    if (!proj) return;
    window.currentProject = projectId;
    elements = proj.data?.moodboard || [];
    connections = proj.data?.connections || [];
    
    // Ensure project palette exists
    if (!proj.data) proj.data = {};
    if (!proj.data.palette) {
      proj.data.palette = ['#FFFFFF', '#F0EFED', '#7C6FF7', '#fdfbc9', '#f3f4f6'];
      // Force save the initial palette if it's a new board
      if (window.dbUpdate) window.dbUpdate('projects', projectId, { data: proj.data });
    }
    
    // Initial history push
    undoMgr.push(elements, connections);

    container.innerHTML = `
      <div id="moodboard-container" class="relative w-full h-full overflow-hidden touch-none" style="background: var(--bg-canvas);">
        <!-- Dot Grid Background -->
        <div class="absolute inset-0 pointer-events-none opacity-40" style="background-image: radial-gradient(#6B46FA 0.5px, transparent 0.5px); background-size: 24px 24px;"></div>
        
        <div id="moodboard-canvas" class="absolute inset-0 origin-top-left" style="width: 5000px; height: 5000px; transform: translate(0px, 0px) scale(1);">
          <svg id="moodboard-svg-layer" class="absolute inset-0 pointer-events-auto w-full h-full" style="z-index: 5;">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6B21FF" />
              </marker>
            </defs>
            <g id="moodboard-connections-group"></g>
          </svg>
          <div id="moodboard-elements-layer" class="absolute inset-0 z-10"></div>
        </div>
        
        <!-- Floating Toolbar -->
        <div class="absolute left-1/2 -translate-x-1/2 bottom-10 flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-2xl border border-[#E5E0FF] rounded-[24px] shadow-floating z-[100]">
          <button class="w-12 h-12 rounded-[18px] bg-[#6B46FA] text-white flex items-center justify-center m-tool-btn shadow-lg shadow-purple-200" data-tool="select">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
          </button>
          <button class="w-12 h-12 rounded-[18px] bg-white text-gray-400 hover:text-[#6B46FA] flex items-center justify-center m-tool-btn" data-tool="video">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </button>
          <button class="w-12 h-12 rounded-[18px] bg-white text-gray-400 hover:text-[#6B46FA] flex items-center justify-center m-tool-btn" data-tool="text">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
          </button>
          <button class="w-12 h-12 rounded-[18px] bg-white text-gray-400 hover:text-[#6B46FA] flex items-center justify-center m-tool-btn" data-tool="arrow">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
          <button class="w-12 h-12 rounded-[18px] bg-white text-gray-400 hover:text-[#6B46FA] flex items-center justify-center m-tool-btn" data-tool="upload">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          </button>
        </div>

        <input type="file" id="mb-file-input" class="hidden" multiple>
      </div>
    `;

    if (isMobile()) {
      document.getElementById('mb-mobile-topbar')?.classList.remove('hidden');
      const mobileToolbar = document.getElementById('mb-mobile-toolbar');
      if (mobileToolbar) {
        mobileToolbar.classList.remove('hidden');
        mobileToolbar.innerHTML = `
          <button class="nav-link m-tool-btn" data-tool="select"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="note"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="text"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7V4h16v3M9 20h6M12 4v16"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="arrow"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="upload"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="palette"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></button>
          <button class="nav-link m-tool-btn" data-tool="link" title="Web References"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></button>
          <button class="nav-link" id="mb-mobile-more"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg></button>
        `;
      }
      scale = 1; panX = 0; panY = 0;
      initMobileInteractions();
    } else {
      // Force hide mobile elements on desktop
      document.getElementById('mb-mobile-topbar')?.classList.add('hidden');
      document.getElementById('mb-mobile-toolbar')?.classList.add('hidden');
      const sheet = document.getElementById('m-bottom-sheet');
      if (sheet) {
        sheet.classList.remove('open');
        sheet.classList.add('hidden');
      }
    }

    canvas = document.getElementById('moodboard-canvas');
    if (!isMobile()) {
      const sidebar = document.getElementById('m-sidebar');
      if (sidebar) sidebar.style.display = 'flex';
    }
    svgLayer = document.getElementById('moodboard-svg-layer');
    elementsLayer = document.getElementById('moodboard-elements-layer');
    
    renderElements();
    renderConnections();
    updateTransform();

    // Pointer Events
    canvas.addEventListener('pointerdown', (e) => {
       if (currentTool === 'link') {
         showLinkPopover(e.clientX, e.clientY);
       } else {
         handlePointerDown(e);
       }
    });
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Tool Selection Helper
    window.selectTool = (tool) => {
      currentTool = tool;
      container.querySelectorAll('.m-tool-btn').forEach(b => {
        const isActive = b.dataset.tool === tool;
        b.classList.toggle('bg-primary', isActive);
        b.classList.toggle('text-white', isActive);
        b.classList.toggle('text-text-muted', !isActive);
      });
      const canvasContainer = document.getElementById('moodboard-container');
      if (canvasContainer) {
        if (tool === 'select') canvasContainer.style.cursor = 'default';
        else canvasContainer.style.cursor = 'crosshair';
      }
    };

    // Tools
    container.querySelectorAll('.m-tool-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const tool = btn.dataset.tool;
        window.selectTool(tool);

        if (tool === 'upload') {
          document.getElementById('mb-file-input').click();
        }
      };
    });

    const moreBtn = document.getElementById('mb-more-btn');
    if (moreBtn) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        window.showBottomSheet('more', `
          <div class="space-y-6">
            <h3 class="text-lg font-black text-text-dark tracking-tight">Board Options</h3>
            <div class="grid grid-cols-2 gap-3">
              <button class="flex flex-col items-start gap-2 p-4 border border-gray-100 rounded-2xl hover:border-primary transition-all group" onclick="window.undo(); window.hideBottomSheet();">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dark">Undo</span>
              </button>
              <button class="flex flex-col items-start gap-2 p-4 border border-gray-100 rounded-2xl hover:border-primary transition-all group" onclick="window.redo(); window.hideBottomSheet();">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path></svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dark">Redo</span>
              </button>
              <button class="flex flex-col items-start gap-2 p-4 border border-gray-100 rounded-2xl hover:border-primary transition-all group" onclick="window.showLinkModal(); window.hideBottomSheet();">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dark">Add Link</span>
              </button>
              <button class="flex flex-col items-start gap-2 p-4 border border-gray-100 rounded-2xl hover:border-red-500 transition-all group" onclick="selectedElements.clear(); renderElements(); window.hideBottomSheet();">
                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest text-text-dark">Deselect</span>
              </button>
            </div>
          </div>
        `);
      };
    }

    window.addMobileColor = (hex) => {
      const coords = toCanvasCoords({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
      addElement('palette', coords.x, coords.y, hex);
      hideBottomSheet();
    };

    window.showLinkModal = () => {
      const url = prompt("Enter URL to embed (YouTube, Vimeo, etc):");
      if (url) {
        const coords = toCanvasCoords({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
        handlePasteUrl(url, coords.x, coords.y);
      }
    };

    // Listen for remote updates from collaborators
    if (socket) {
      socket.addEventListener('message', (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'moodboard_update' && msg.projectId === projectId) {
            // Self-update filter: ignore if it matches our last transmitted change
            if (msg.updateId && msg.updateId === lastUpdateId) return;
            
            elements = msg.elements || [];
            connections = msg.connections || [];
            renderElements();
            renderConnections();
            if (msg.cursor) showRemoteCursor(msg.cursor);
          }
          if (msg.type === 'cursor_move' && msg.projectId === projectId) {
            showRemoteCursor(msg.cursor);
          }
        } catch(err) {}
      });

      // Broadcast cursor position to collaborators (Throttled to 50ms)
      const moodboardContainer = document.getElementById('moodboard-container');
      const broadcastCursor = throttle((e) => {
        if (socket.readyState === WebSocket.OPEN) {
          const coords = toCanvasCoords(e);
          socket.send(JSON.stringify({
            type: 'cursor_move',
            projectId,
            cursor: { 
              x: coords.x, 
              y: coords.y, 
              userId: window.appData?.user?.id,
              name: window.appData?.user?.name || 'User',
              color: window.appData?.user?.color || '#7C6FF7'
            }
          }));
        }
      }, 50);

      moodboardContainer.addEventListener('pointermove', broadcastCursor, { passive: true });
    }

    const fileInp = document.getElementById('mb-file-input');
    fileInp.onchange = handleFileUpload;

    // Paste Handle
    container.onpaste = (e) => {
      const text = e.clipboardData.getData('text');
      if (text.startsWith('http')) {
        e.preventDefault();
        const coords = toCanvasCoords({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
        handlePasteUrl(text, coords.x, coords.y);
      }
    };
  };

  function handlePasteUrl(url, x, y) {
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
      addVideoLink(url, x, y);
    } else {
      addElement('link', x, y, url); // Standard link preview
    }
  }

  function updateTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    const zoomEl = document.getElementById('mb-zoom-perc');
    if (zoomEl) zoomEl.textContent = Math.round(scale * 100) + '%';
  }

  function initMobileInteractions() {
    const hamburger = document.getElementById('mb-hamburger');
    const drawer = document.getElementById('m-side-drawer');
    const overlay = document.getElementById('m-side-drawer-overlay');

    const toggleDrawer = (show) => {
      if (show) {
        drawer.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
      } else {
        drawer.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
      }
    };

    if (hamburger) hamburger.onclick = () => toggleDrawer(true);
    if (overlay) overlay.onclick = () => toggleDrawer(false);

    // Navigation links in drawer
    drawer.querySelectorAll('.nav-drawer-item').forEach(item => {
      item.onclick = () => {
        toggleDrawer(false);
        // Navigation logic is handled by window.navigate called in onclick
      };
    });

    // Top Bar Refinement for Moodboard
    const topbar = document.getElementById('m-topbar');
    if (topbar) {
       topbar.innerHTML = `
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-2xl bg-[#F4F3FF] flex items-center justify-center text-[#6B21FF]">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
             </div>
             <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">CreativeSpace</span>
          </div>
          <button id="global-settings-btn" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
             <img id="sidebar-avatar" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" class="w-full h-full object-cover">
          </button>
       `;
    }

    window.handleMobileTap = (id, type) => {
      // Small delay to distinguish from drag start if needed, but here we use drag handles
      if (type === 'note' || type === 'text') {
        openFullscreenEditor(id);
      }
    };

    window.mobileAction = (id, action) => {
       if (action === 'edit') openFullscreenEditor(id);
       if (action === 'dup') window.duplicateElement(id);
       if (action === 'front') window.bringToFront(id);
       if (action === 'del') window.deleteElement(id);
    };

    const moreBtn = document.getElementById('mb-mobile-more');
    if (moreBtn) {
      moreBtn.onclick = () => {
        showBottomSheet('more', `
          <div class="grid grid-cols-2 gap-4">
            <button class="flex items-center gap-3 p-4 border rounded-xl" onclick="window.undo()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
              <span class="font-bold">Undo</span>
            </button>
            <button class="flex items-center gap-3 p-4 border rounded-xl" onclick="window.redo()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"></path></svg>
              <span class="font-bold">Redo</span>
            </button>
            <button class="flex items-center gap-3 p-4 border rounded-xl" onclick="window.togglePressure()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
              <span class="font-bold">Pressure</span>
            </button>
            <button class="flex items-center gap-3 p-4 border rounded-xl text-red-500" onclick="selectedElements.clear(); renderElements(); hideBottomSheet();">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              <span class="font-bold">Deselect</span>
            </button>
          </div>
        `);
      };
    }
  }

  window.showBottomSheet = (id, html) => {
    const sheet = document.getElementById('m-bottom-sheet');
    const content = document.getElementById('m-bottom-sheet-content');
    content.innerHTML = html;
    sheet.classList.add('open');
    
    // Close on backdrop or swipe logic could go here
    const closeHandler = (e) => {
      if (!sheet.contains(e.target) && !e.target.closest('.m-tool-btn') && !e.target.closest('#mb-mobile-more')) {
        hideBottomSheet();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 10);
  };

  window.hideBottomSheet = () => {
    document.getElementById('m-bottom-sheet').classList.remove('open');
  };

  window.openFullscreenEditor = (id) => {
    const el = elements.find(item => item.id === id);
    if (!el) return;

    const overlay = document.getElementById('m-mobile-editor-overlay');
    const body = document.getElementById('m-mobile-editor-body');
    const toolbar = document.getElementById('m-mobile-editor-toolbar');
    
    body.innerHTML = el.content || '';
    overlay.style.display = 'flex';
    

    toolbar.innerHTML = `
      <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-text-dark active:bg-primary active:text-white transition-colors" onclick="document.execCommand('bold')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6V12z"></path></svg>
      </button>
      <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-text-dark active:bg-primary active:text-white transition-colors" onclick="document.execCommand('italic')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 20l4-16m-9 16h5m1-16h5"></path></svg>
      </button>
      <div class="w-px h-6 bg-gray-100 mx-1"></div>
      <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-text-dark active:bg-primary active:text-white transition-colors" onclick="document.execCommand('insertUnorderedList')">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
    `;

    document.getElementById('mb-editor-back').onclick = () => {
      overlay.style.display = 'none';
    };
    document.getElementById('mb-editor-done').onclick = () => {
      el.content = body.innerHTML;
      overlay.style.display = 'none';
      renderElements();
      saveBoard();
      undoMgr.push(elements, connections);
    };

    body.focus();
  };
  window.showMobileTextEditor = window.openFullscreenEditor;

  function toCanvasCoords(e) {
    if (isMobile()) {
       // Mobile uses flow layout, coords are relative to container scroll
       const container = document.getElementById('moodboard-container');
       return {
         x: e.clientX,
         y: e.clientY + container.scrollTop - 56
       };
    }
    const rect = canvas.parentElement.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panX) / scale,
      y: (e.clientY - rect.top - panY) / scale
    };
  }

  function renderElements() {
    elements.forEach(el => {
      let card = document.getElementById(`card-${el.id}`);
      const isSelected = selectedElements.has(el.id);
      
      if (!card) {
        card = createCardElement(el);
        elementsLayer.appendChild(card);
      } else {
        // Update existing card classes
        card.className = `m-card m-card-${el.type} ${isSelected ? 'selected' : ''} shadow-card`;
        // Update position if not currently dragging
        if (!isDragging || !isSelected) {
          card.style.left = `${el.x}px`;
          card.style.top = `${el.y}px`;
        }
      }
    });

    // Remove cards for elements that no longer exist
    const currentIds = new Set(elements.map(el => `card-${el.id}`));
    Array.from(elementsLayer.children).forEach(child => {
      if (!currentIds.has(child.id)) child.remove();
    });

    highestZ = elements.reduce((max, i) => Math.max(max, i.z || 0), 1000) + 1;
  }

  function createCardElement(el) {
    const card = document.createElement('div');
    card.id = `card-${el.id}`;
    const isSelected = selectedElements.has(el.id);
    card.className = `m-card group m-card-${el.type} ${isSelected ? 'selected' : ''} shadow-card rounded-[20px] bg-white border border-border-light transition-all`;
    card.style.left = `${el.x}px`;
    card.style.top = `${el.y}px`;
    
    // For text and note elements, default to auto-height to fit content unless explicitly resized
    if (el.type === 'text' || el.type === 'note') {
      if (el.width) card.style.width = `${el.width}px`;
      card.style.height = 'auto'; // Always auto for content fit
      if (el.height) card.style.minHeight = `${el.height}px`;
    } else {
      if (el.width) card.style.width = `${el.width}px`;
      if (el.height) card.style.height = `${el.height}px`;
    }
    card.style.zIndex = el.z || 1000;
    
    let contentHtml = '';
    const dragBarHtml = `<div class="m-card-drag-bar absolute top-0 left-0 right-0 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"><svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-12a2 2 0 10.001 4.001A2 2 0 0013 2zm0 6a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z"></path></svg></div>`;

    switch(el.type) {
      case 'video':
        contentHtml = `
          ${dragBarHtml}
          <div class="m-card-video-inner h-full flex flex-col overflow-hidden rounded-[24px] bg-[#1A1916] shadow-premium">
            <div class="flex-1 bg-black relative flex items-center justify-center">
               <div class="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                     <svg class="w-6 h-6 text-[#6B21FF] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
               </div>
            </div>
            <div class="p-5 flex flex-col gap-1">
               <div class="text-[10px] font-black text-[#6B21FF] uppercase tracking-[0.2em]">PROCESS VIDEO</div>
               <div class="text-lg font-bold text-white font-['Cabinet_Grotesk'] leading-tight">${el.title || 'Retro-Futurism Synth Patch'}</div>
            </div>
          </div>
        `;
        break;
      case 'note':
        contentHtml = `
          ${dragBarHtml}
          <div class="m-card-note-inner h-full flex flex-col p-6 rounded-[24px] bg-[#F4F3FF] border border-[#EBE9FF] shadow-subtle">
             <div class="text-[10px] font-black text-[#6B21FF] uppercase tracking-[0.2em] mb-4">NOTE</div>
             <div contenteditable="true" class="outline-none text-md font-bold text-[#6B21FF] leading-relaxed">${el.content || 'Something important...'}</div>
          </div>
        `;
        break;
      case 'link':
        contentHtml = `
          ${dragBarHtml}
          <div class="m-card-link-inner h-full flex items-center gap-4 p-4 rounded-[24px] bg-white border border-gray-100 shadow-premium">
             <div class="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden shrink-0">
                <img src="${el.thumbnail || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop'}" class="w-full h-full object-cover">
             </div>
             <div class="flex flex-col min-w-0">
                <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">${el.domain || 'behance.net'}</div>
                <div class="text-[13px] font-bold text-[#1A1916] truncate leading-snug">${el.title || 'Vaporwave Aesthetic Gradients'}</div>
             </div>
          </div>
        `;
        break;
      case 'link':
        contentHtml = `
          ${dragBarHtml}
          <div class="m-card-link-inner h-full flex flex-col group/link overflow-hidden rounded-lg bg-white border border-gray-100">
            ${el.thumbnail ? `
              <div class="w-full h-32 shrink-0 bg-gray-50 overflow-hidden relative">
                <img src="${el.thumbnail}" class="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity"></div>
              </div>
            ` : `
              <div class="w-full h-20 shrink-0 bg-indigo-50/30 flex items-center justify-center border-b border-indigo-50">
                 <div class="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Reference</div>
              </div>
            `}
            <div class="p-4 flex flex-col flex-1 min-w-0">
               <a href="${el.content}" target="_blank" class="text-[13px] font-bold text-gray-900 line-clamp-2 mb-1.5 leading-snug group-hover/link:text-primary transition-colors hover:underline">${el.title || el.content}</a>
               ${el.description ? `<div class="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-auto opacity-80">${el.description}</div>` : ''}
               <div class="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                  <div class="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                    <img src="${el.favicon || 'https://www.google.com/s2/favicons?domain=' + el.domain}" class="w-3.5 h-3.5 rounded-sm">
                  </div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[120px]">${el.domain || 'External Site'}</div>
                  <a href="${el.content}" target="_blank" class="ml-auto w-6 h-6 flex items-center justify-center rounded-full bg-primary/5 text-primary opacity-100 transition-all hover:bg-primary hover:text-white">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </a>
               </div>
            </div>
              ${el.loading ? `<div class="absolute inset-0 bg-white/80 flex items-center justify-center z-20 backdrop-blur-[2px]"><div class="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div></div>` : ''}
          </div>
        `;
        break;
      case 'file':
        const ext = (el.title || '').split('.').pop().toLowerCase();
        let flatClass = 'f-gen-flat';
        if (ext === 'pdf') flatClass = 'f-pdf-flat';
        if (['doc', 'docx'].includes(ext)) flatClass = 'f-doc-flat';
        if (['xls', 'xlsx'].includes(ext)) flatClass = 'f-xls-flat';
        if (['ppt', 'pptx'].includes(ext)) flatClass = 'f-ppt-flat';
        
        contentHtml = `
          ${dragBarHtml}
          <div class="m-card-group-style h-full w-full overflow-hidden">
            <div class="m-group-header">
              <div class="m-group-title truncate">${(el.title || '').split('.')[0]}</div>
              <div class="m-group-subtitle">1 card, 1 file</div>
            </div>
            <div class="m-file-strip-refined group/f">
               <div class="milanote-file-icon ${flatClass}">
                  <div class="ext-text">${ext}</div>
               </div>
               <div class="flex-1 min-w-0">
                  <div class="text-[12px] font-bold text-[#2D2D2D] truncate mb-0.5">${el.title}</div>
                  <div class="text-[10px] font-semibold text-[#A0A0A0] uppercase tracking-tight">${el.size || 'Unknown'}</div>
               </div>
            </div>
          </div>
        `;
        break;
      case 'text':
        contentHtml = `
          ${dragBarHtml}
          <div 
            contenteditable="true" 
            class="outline-none bold-heading w-full h-full text-editor-inner min-h-[1em] whitespace-pre-wrap break-words" 
            style="font-family: ${el.fontFamily || 'inherit'}; font-size: ${el.fontSize || '24px'}px; color: ${el.textColor || 'inherit'}; text-align: ${el.textAlign || 'left'};"
            onfocus="window.showRichToolbar(this, '${el.id}')"
          >${el.content || 'Text Label'}</div>`;
        break;
    }
    
    if (isMobile()) {
      card.innerHTML = `
        <div class="m-drag-handle"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-12a2 2 0 10.001 4.001A2 2 0 0013 2zm0 6a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z"></path></svg></div>
        <div class="m-card-inner h-full w-full" onclick="window.handleMobileTap('${el.id}', '${el.type}')">${contentHtml}</div>
        <div class="m-resize-handle m-handle-br pointer-events-auto" data-dir="se" data-id="${el.id}"></div>
      `;

      if (isSelected) {
        const actionRow = document.createElement('div');
        actionRow.className = 'm-action-row animate-in fade-in slide-in-from-bottom-2';
        
        let openBtn = '';
        if (el.type === 'link' || el.type === 'video') {
           openBtn = `<button class="text-brand p-2 text-[10px] font-bold" onclick="event.stopPropagation(); window.mobileAction('${el.id}', 'open')">OPEN</button>`;
        }

        actionRow.innerHTML = `
          ${openBtn}
          <button class="text-white p-2 text-[10px] font-bold" onclick="event.stopPropagation(); window.mobileAction('${el.id}', 'edit')">EDIT</button>
          <button class="text-white p-2 text-[10px] font-bold" onclick="event.stopPropagation(); window.mobileAction('${el.id}', 'dup')">DUP</button>
          <button class="text-white p-2 text-[10px] font-bold" onclick="event.stopPropagation(); window.mobileAction('${el.id}', 'front')">FRONT</button>
          <button class="text-red-400 p-2 text-[10px] font-bold" onclick="event.stopPropagation(); window.mobileAction('${el.id}', 'del')">DEL</button>
        `;
        card.appendChild(actionRow);
      }
    } else {
      card.innerHTML = `
        <div class="m-card-inner h-full w-full">${contentHtml}</div>
        <div class="m-resize-handle m-handle-tl pointer-events-auto" data-dir="nw" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-tr pointer-events-auto" data-dir="ne" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-bl pointer-events-auto" data-dir="sw" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-br pointer-events-auto" data-dir="se" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-n pointer-events-auto" data-dir="n" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-s pointer-events-auto" data-dir="s" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-e pointer-events-auto" data-dir="e" data-id="${el.id}"></div>
        <div class="m-resize-handle m-handle-w pointer-events-auto" data-dir="w" data-id="${el.id}"></div>
      `;
    }

    const editable = card.querySelector('[contenteditable="true"]');
    if (editable) {
       if (isMobile()) {
         editable.onfocus = (e) => { e.preventDefault(); e.target.blur(); window.showMobileTextEditor(el.id); };
       } else {
         editable.oninput = () => { 
           el.content = editable.innerHTML;
           if (el.type === 'text' || el.type === 'note') {
             // Auto-update internal dimensions while typing, but maintain width
             card.style.height = 'auto';
             el.height = card.offsetHeight;
             
             // If it's a new text element, width should also be auto
             if(el.type === 'text' && !el.width) {
                card.style.width = 'auto';
                el.width = card.offsetWidth;
             }
           }
         };
         editable.onblur = () => { saveBoard(); undoMgr.push(elements, connections); };
       }
    }

    // Explicitly wire all <a href> links inside link/video cards to open in new tab
    // This bypasses the canvas pointer event interception which prevents default <a> navigation
    if (el.type === 'link' || el.type === 'video') {
      card.querySelectorAll('a[href]').forEach(anchor => {
        anchor.onclick = (e) => {
          e.stopPropagation();
          const href = anchor.getAttribute('href');
          if (href && href !== '#') {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
          return false;
        };
      });
    }

    window.mobileAction = (id, action) => {
      const el = elements.find(i => i.id === id);
      if (action === 'edit') window.showMobileTextEditor(id);
      if (action === 'open' && el) {
        const url = el.originalUrl || el.content;
        if (url) window.open(url, '_blank');
      }
      if (action === 'dup') window.duplicateElement(id);
      if (action === 'del') window.deleteElement(id);
      if (action === 'front') window.bringToFront(id);
    };

    card.onclick = (e) => {
      if (editable && e.target === card) editable.focus();
    };

    return card;
  }

  let isConnecting = false, connStartEl = null, connLine = null;

  function handlePointerDown(e) {
    if (e.target.closest('.m-tool-btn') || e.target.closest('.draw-tool-btn')) return;
    
    pointers.set(e.pointerId, e);
    const coords = toCanvasCoords(e);

    const target = e.target;
    if (target.classList.contains('m-arrow-handle')) {
      isMovingArrowHandle = true;
      arrowTargetId = target.dataset.id;
      arrowHandleType = target.dataset.type;
      return;
    }

    if (pointers.size === 2) {
      const p = Array.from(pointers.values());
      lastDist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
      isPanning = true;
      isDragging = false;
      return;
    }

    // Handle Resize Trigger
    const resizeHandle = e.target.closest('.m-resize-handle');
    if (resizeHandle) {
       isResizing = true;
       resizeDir = resizeHandle.dataset.dir;
       resizeTargetId = resizeHandle.dataset.id;
       dragStart = { x: e.clientX, y: e.clientY };
       return;
    }

    // Handle Connection Handle Trigger
    const arrowHandle = e.target.closest('.m-arrow-handle');
    if (arrowHandle) {
       isMovingArrowHandle = true;
       arrowTargetId = arrowHandle.dataset.id;
       arrowHandleType = arrowHandle.dataset.type; // 'start' or 'end'
       selectedConnectionId = arrowTargetId;
       dragStart = { x: e.clientX, y: e.clientY };
       return;
    }

    // Middle Mouse or Alt+Click for Panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning = true;
      dragStart = { x: e.clientX - panX, y: e.clientY - panY };
      return;
    }

    const dragHandle = e.target.closest('.m-drag-handle');
    const card = e.target.closest('.m-card');

    // Let clicks on <a> links inside cards pass through to the browser
    if (card && e.target.closest('a[href]')) {
      return; // Don't drag — let the browser handle the link click
    }
    
    if (isMobile()) {
      if (dragHandle && card) {
        handleCardDown(e, card);
        return;
      }
      // If it's a card but not the drag handle, select it (show action row) but don't drag
      if (card) {
        const id = card.id.replace('card-', '');
        selectedElements.clear();
        selectedElements.add(id);
        renderElements();
        return;
      }
    } else if (card) {
      handleCardDown(e, card);
      return;
    }

    // Canvas Background Click
    if (currentTool === 'note') {
      addElement('note', coords.x, coords.y);
      window.selectTool('select');
    } else if (currentTool === 'text') {
      addElement('text', coords.x, coords.y);
      window.selectTool('select');
    } else if (currentTool === 'palette') {
      addElement('palette', coords.x, coords.y);
      window.selectTool('select');
    } else if (currentTool === 'select' || currentTool === 'arrow') {
      selectedElements.clear();
      renderElements();
      isLassoing = true;
      lassoStart = { x: e.clientX, y: e.clientY };
      if (!lassoBox) {
        lassoBox = document.createElement('div');
        lassoBox.className = 'm-lasso';
        document.body.appendChild(lassoBox);
      }
      lassoBox.style.display = 'block';

      // Memoize bounds for performance
      elements.forEach(el => {
        const card = document.getElementById(`card-${el.id}`);
        if (card) {
          el._rect = card.getBoundingClientRect();
        }
      });
    }
  }

  let rafPending = false;
  let lastMouseEvent = null;

  function handlePointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);
    lastMouseEvent = e;

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(processPointerMove);
    }
  }

  function processPointerMove() {
    rafPending = false;
    if (!lastMouseEvent) return;
    
    const e = lastMouseEvent;
    const coords = toCanvasCoords(e);

    // Gestures (Pinch-to-zoom / Pan)
    if (pointers.size === 2) {
      const p = Array.from(pointers.values());
      const dist = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
      if (lastDist > 0) {
        const delta = dist / lastDist;
        scale *= delta;
        scale = Math.max(0.1, Math.min(3, scale));
        updateTransform();
      }
      lastDist = dist;
      return;
    }

    if (isPanning) {
      panX = e.clientX - dragStart.x;
      panY = e.clientY - dragStart.y;
      updateTransform();
      return;
    }

    if (isMovingArrowHandle) {
      const conn = connections.find(c => c.id === arrowTargetId);
      if (conn) {
        if (arrowHandleType === 'start') {
          conn.startPos = coords;
          // Check if hovering over a card to snap
          const targetCard = e.target.closest('.m-card');
          conn.fromId = targetCard ? targetCard.id.replace('card-', '') : null;
        } else {
          conn.endPos = coords;
          const targetCard = e.target.closest('.m-card');
          conn.toId = targetCard ? targetCard.id.replace('card-', '') : null;
        }
        renderConnections();
      }
      return;
    }

    if (isResizing) {
       const dx = (e.clientX - dragStart.x) / scale;
       const dy = (e.clientY - dragStart.y) / scale;
       performResize(resizeTargetId, resizeDir, dx, dy, e.shiftKey);
       dragStart = { x: e.clientX, y: e.clientY };
       return;
    }

    if (isDragging) {
      const dx = e.movementX / scale;
      const dy = e.movementY / scale;
      
      selectedElements.forEach(id => {
        const el = elements.find(item => item.id === id);
        if (el && !el.locked) {
          el.x += dx;
          el.y += dy;
          const card = document.getElementById(`card-${id}`);
          if (card) { 
            card.style.left = `${el.x}px`; 
            card.style.top = `${el.y}px`;
          }
        }
      });
      renderConnections();
    }
    
    if (isLassoing) {
      const x1 = Math.min(lassoStart.x, e.clientX);
      const y1 = Math.min(lassoStart.y, e.clientY);
      const w = Math.abs(lassoStart.x - e.clientX);
      const h = Math.abs(lassoStart.y - e.clientY);
      lassoBox.style.left = `${x1}px`; lassoBox.style.top = `${y1}px`;
      lassoBox.style.width = `${w}px`; lassoBox.style.height = `${h}px`;
      
      const lRect = { left: x1, top: y1, right: x1 + w, bottom: y1 + h };
      
      elements.forEach(el => {
        const rect = el._rect;
        if (!rect) return;
        const intersect = !(rect.right < lRect.left || rect.left > lRect.right || rect.bottom < lRect.top || rect.top > lRect.bottom);
        const card = document.getElementById(`card-${el.id}`);
        if (intersect) { 
          selectedElements.add(el.id); 
          if (card) card.classList.add('selected'); 
        } else { 
          selectedElements.delete(el.id); 
          if (card) card.classList.remove('selected'); 
        }
      });
    }

    if (isMovingArrowHandle) {
      const conn = connections.find(c => c.id === arrowTargetId);
      if (conn) {
        const targetCard = e.target.closest('.m-card');
        const targetId = targetCard ? targetCard.id.replace('card-', '') : null;

        if (arrowHandleType === 'start') {
          if (targetId && targetId !== conn.toId) {
            conn.fromId = targetId;
            delete conn.startPos;
          } else if (!targetId) {
            conn.fromId = null;
            conn.startPos = { x: coords.x, y: coords.y };
          }
        } else {
          if (targetId && targetId !== conn.fromId) {
            conn.toId = targetId;
            delete conn.endPos;
          } else if (!targetId) {
            conn.toId = null;
            conn.endPos = { x: coords.x, y: coords.y };
          }
        }
        renderConnections();
      }
    }

    if (isConnecting && connLine) {
      const start = getPointForElement(connStartEl);
      const d = calculateArrowPath(start, coords, 'curved');
      connLine.setAttribute('d', d);
    }
  }

  function handleWheel(e) {
    if (isMobile()) return;
    e.preventDefault();
    
    // Zoom if Ctrl is pressed, otherwise Pan
    if (e.ctrlKey) {
      const delta = -e.deltaY;
      const zoomFactor = Math.pow(1.1, delta / 100); 
      
      const oldScale = scale;
      scale *= zoomFactor;
      scale = Math.max(0.1, Math.min(3, scale));
      
      const rect = canvas.parentElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      panX = mouseX - (mouseX - panX) * (scale / oldScale);
      panY = mouseY - (mouseY - panY) * (scale / oldScale);
    } else {
      // Standard Panning (Natural Scrolling)
      panX -= e.deltaX;
      panY -= e.deltaY;
    }
    
    updateTransform();
  }

  function handlePointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastDist = 0;

    if (isDragging || isResizing || isMovingArrowHandle) {
      undoMgr.push(elements, connections);
      saveBoard();
    }

    if (isConnecting) {
      const targetCard = e.target.closest('.m-card');
      if (targetCard) {
        const toId = targetCard.id.replace('card-', '');
        if (toId !== connStartEl) {
          connections.push({
            id: 'conn-' + Date.now(),
            fromId: connStartEl,
            toId,
            style: 'curved',
            thickness: 3,
            color: '#7C6FF7',
            headEnd: true
          });
          renderConnections();
          saveBoard();
          undoMgr.push(elements, connections);
        }
      }
      if (connLine) connLine.remove();
      connLine = null;
    }

    if (isLassoing && lassoBox) {
      lassoBox.style.display = 'none';
    }

    isDragging = false;
    isPanning = false;
    isResizing = false;
    isLassoing = false;
    isConnecting = false;
    isMovingArrowHandle = false;
  }

  function performResize(id, dir, dx, dy, shiftKey) {
    const el = elements.find(item => item.id === id);
    if (!el) return;
    const card = document.getElementById(`card-${id}`);
    if (!el.width) el.width = card.offsetWidth;
    if (!el.height) el.height = card.offsetHeight;

    const minSize = 40;
    const oldW = el.width;
    const oldH = el.height;

    // Handle proportional scaling
    if (shiftKey && dir.length > 1) { // Only for corners
      const aspect = oldW / oldH;
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = dx / aspect;
        if (dir.includes('n')) dy = -dy;
      } else {
        dx = dy * aspect;
        if (dir.includes('w')) dx = -dx;
      }
    }

    if (dir.includes('e')) el.width = Math.max(minSize, el.width + dx);
    if (dir.includes('w')) {
      const nextW = Math.max(minSize, el.width - dx);
      el.x += (el.width - nextW);
      el.width = nextW;
    }
    if (dir.includes('s')) el.height = Math.max(minSize, el.height + dy);
    if (dir.includes('n')) {
      const nextH = Math.max(minSize, el.height - dy);
      el.y += (el.height - nextH);
      el.height = nextH;
    }

    card.style.width = `${el.width}px`;
    card.style.height = `${el.height}px`;
    card.style.left = `${el.x}px`;
    card.style.top = `${el.y}px`;
    renderConnections();
  }

  function handleCardDown(e, card) {
    const id = card.id.replace('card-', '');
    const el = elements.find(item => item.id === id);
    const coords = toCanvasCoords(e);

    if (currentTool === 'arrow') {
      if (isMobile()) {
        if (!connStartEl) {
          // First tap
          connStartEl = id;
          card.classList.add('selected');
        } else if (connStartEl !== id) {
          // Second tap
          connections.push({
            id: 'conn-' + Date.now(),
            fromId: connStartEl,
            toId: id,
            style: 'curved',
            thickness: 3,
            color: '#7C6FF7',
            headEnd: true
          });
          renderConnections();
          saveBoard();
          undoMgr.push(elements, connections);
          connStartEl = null;
          selectedElements.clear();
          renderElements();
        } else {
          // Tap same card again to cancel
          connStartEl = null;
          selectedElements.clear();
          renderElements();
        }
        return;
      }
      
      isConnecting = true;
      connStartEl = id;
      connLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      connLine.setAttribute('class', 'm-arrow-path');
      connLine.setAttribute('stroke', '#7C6FF7');
      connLine.setAttribute('stroke-width', '3');
      connLine.setAttribute('fill', 'none');
      svgLayer.appendChild(connLine);
      return;
    }

    if (!e.shiftKey && !selectedElements.has(id)) {
      selectedElements.clear();
      selectedElements.add(id);
      card.classList.add('selected');
    } else if (e.shiftKey) {
      if (selectedElements.has(id)) {
        selectedElements.delete(id);
        card.classList.remove('selected');
      } else {
        selectedElements.add(id);
        card.classList.add('selected');
      }
    } else {
      card.classList.add('selected');
      selectedElements.add(id);
    }

    el.z = ++highestZ;
    card.style.zIndex = el.z;
    isDragging = true;
    dragStart = { x: coords.x - el.x, y: coords.y - el.y };
  }

  window.showRichToolbar = (el, id) => {
    let bar = document.getElementById('m-rich-toolbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'm-rich-toolbar';
      bar.className = 'm-popover shadow-floating flex gap-1 p-1 bg-black rounded-lg';
      bar.innerHTML = `
        <button class="rich-btn p-1 hover:bg-white/10 rounded" onclick="document.execCommand('bold', false, null)"><b>B</b></button>
        <button class="rich-btn p-1 hover:bg-white/10 rounded" onclick="document.execCommand('italic', false, null)"><i>I</i></button>
        <button class="rich-btn p-1 hover:bg-white/10 rounded" onclick="document.execCommand('underline', false, null)"><u>U</u></button>
        <div class="w-px h-4 bg-white/20 mx-1 align-middle inline-block"></div>
        <select class="text-xs bg-transparent text-white outline-none" onchange="window.updateTextStyle('${id}', 'fontSize', this.value)">
          <option value="12">12</option><option value="14">14</option><option value="18">18</option><option value="24" selected>24</option><option value="32">32</option><option value="48">48</option>
        </select>
        <select class="text-xs bg-transparent text-white outline-none" onchange="window.updateTextStyle('${id}', 'fontFamily', this.value)">
          <option value="Inter">Inter</option><option value="serif">Serif</option><option value="monospace">Mono</option>
        </select>
        <div class="w-px h-4 bg-white/20 mx-1 align-middle inline-block"></div>
        <input type="color" class="w-4 h-4 p-0 border-0 bg-transparent" onchange="window.updateTextStyle('${id}', 'textColor', this.value)">
      `;
      document.body.appendChild(bar);
    }
    
    // Update IDs for the currently focused element
    bar.querySelectorAll('select, input').forEach(ctrl => {
      ctrl.onchange = (ev) => {
        const prop = ctrl.tagName === 'INPUT' ? 'textColor' : (ctrl.previousElementSibling?.tagName === 'SELECT' ? 'fontFamily' : 'fontSize');
        // Actually, let's just use data attributes or passed ID better
      };
    });
    
    // Re-bind actions for the specific ID
    const selects = bar.querySelectorAll('select');
    selects[0].onchange = (e) => window.updateTextStyle(id, 'fontSize', e.target.value);
    selects[1].onchange = (e) => window.updateTextStyle(id, 'fontFamily', e.target.value);
    bar.querySelector('input[type="color"]').onchange = (e) => window.updateTextStyle(id, 'textColor', e.target.value);

  // Use fixed positioning from getBoundingClientRect — no scrollY offset needed
  const rect = el.getBoundingClientRect();
  bar.style.position = 'fixed';
  bar.style.top = `${rect.top - 50}px`;
  bar.style.left = `${rect.left}px`;
  bar.style.display = 'flex';
  bar.style.zIndex = '10000';

  el.onblur = () => {
    setTimeout(() => {
      if (!document.activeElement.closest('#m-rich-toolbar')) {
        bar.style.display = 'none';
      }
    }, 200);
  };
};

window.updateTextStyle = (id, prop, val) => {
  const el = elements.find(item => item.id === id);
  if (!el) return;
  el[prop] = val;

  // Patch live DOM directly — never call renderElements() during text editing
  const card = document.getElementById(`card-${id}`);
  const editable = card?.querySelector('[contenteditable]');
  if (editable) {
    if (prop === 'fontSize') editable.style.fontSize = val + 'px';
    if (prop === 'fontFamily') editable.style.fontFamily = val;
    if (prop === 'textColor') editable.style.color = val;
    editable.focus();
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editable);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  saveBoard();
};

  function addElement(type, x, y, content = '') {
    const id = 'el-' + Date.now();
    const newEl = { id, type, x, y, z: ++highestZ };
    if (type === 'palette') newEl.colors = ['#7C6FF7', '#EEECEA'];
    else newEl.content = content;
    
    elements.push(newEl);
    renderElements();
    saveBoard();
    undoMgr.push(elements, connections);

    // Auto-highlight text for notes and text elements
    if (type === 'note' || type === 'text') {
      setTimeout(() => {
        const card = document.getElementById(`card-${id}`);
        const editable = card?.querySelector('[contenteditable="true"]');
        if (editable) {
          editable.focus();
          const range = document.createRange();
          range.selectNodeContents(editable);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 50);
    }
  }

  async function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        const url = URL.createObjectURL(file);
        video.src = url;
        
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(0.5, video.duration / 2 || 0.1);
        };
        
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        };
        
        video.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(async (file, index) => {
      const id = 'el-' + Date.now() + '-' + index;
      const coords = toCanvasCoords({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
      
      let thumbnail = null;
      if (file.type.startsWith('video/')) {
        thumbnail = await generateVideoThumbnail(file);
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        
        const ext = file.name.split('.').pop().toUpperCase();
        
        elements.push({ 
          id, 
          type, 
          thumbnail,
          x: coords.x + (index * 20), 
          y: coords.y + (index * 20), 
          content: ev.target.result,
          title: file.name,
          extension: ext,
          size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
          isNative: file.type.startsWith('video/'),
          z: ++highestZ 
        });
        
        if (index === files.length - 1) {
          renderElements();
          saveBoard();
          undoMgr.push(elements, connections);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }

  window.handleLinkTool = () => {
    showLinkPopover(window.innerWidth / 2, window.innerHeight / 2);
  };

  // --- Upload Choice Popover (Gallery vs Embeds) ---
  function showUploadChoicePopover(btnRect) {
    let popover = document.getElementById('m-upload-choice-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'm-upload-choice-popover';
      popover.className = 'm-popover shadow-floating p-2 flex flex-col gap-1 min-w-[180px] z-[5000]';
      document.body.appendChild(popover);
    }

    popover.innerHTML = `
      <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 pt-1 pb-0.5">Add Media</div>
      <button id="upload-gallery-btn" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors w-full text-left">
        <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-brand shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        </div>
        <div>
          <div class="text-[12px] font-bold text-gray-800">Upload from Gallery</div>
          <div class="text-[10px] text-gray-400">Image or video file</div>
        </div>
      </button>
      <button id="upload-embed-btn" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 font-semibold hover:bg-gray-50 transition-colors w-full text-left">
        <div class="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.277A1 1 0 0121 8.677V15.32a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
        </div>
        <div>
          <div class="text-[12px] font-bold text-gray-800">Embeds</div>
          <div class="text-[10px] text-gray-400">YouTube, Vimeo, website preview</div>
        </div>
      </button>
    `;

    // Position below the button
    const x = btnRect.right + 10;
    const y = btnRect.top;
    popover.style.display = 'block';
    popover.style.left = `${Math.min(window.innerWidth - 200, x)}px`;
    popover.style.top = `${y}px`;

    document.getElementById('upload-gallery-btn').onclick = () => {
      popover.style.display = 'none';
      document.getElementById('mb-file-input').click();
      // Reset tool back to select
      currentTool = 'select';
      window.selectTool('select');
    };

    document.getElementById('upload-embed-btn').onclick = () => {
      popover.style.display = 'none';
      showLinkPopover(window.innerWidth / 2, window.innerHeight / 2);
    };

    setTimeout(() => {
      const hideOnAway = (e) => {
        if (!popover.contains(e.target) && !e.target.closest('[data-tool="upload"]')) {
          popover.style.display = 'none';
          document.removeEventListener('click', hideOnAway);
          currentTool = 'select';
          container.querySelectorAll('.m-tool-btn').forEach(b => b.classList.remove('active'));
          container.querySelector('[data-tool="select"]')?.classList.add('active');
        }
      };
      document.addEventListener('click', hideOnAway);
    }, 200);
  }

  // --- Simple Clickable URL Popover (Link tool only) ---
  function showAddLinkPopover(btnRect) {
    let popover = document.getElementById('m-addlink-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'm-addlink-popover';
      popover.className = 'm-popover shadow-floating p-4 flex flex-col gap-3 min-w-[300px] z-[5000]';
      document.body.appendChild(popover);
    }

    popover.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <div class="w-6 h-6 rounded-lg bg-brand/10 flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </div>
        <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Add Web URL</div>
      </div>
      <div class="flex gap-2">
        <input type="url" id="m-addlink-input" placeholder="https://..." class="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
        <button id="m-addlink-submit" class="bg-brand text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:opacity-90">ADD</button>
      </div>
      <div class="text-[9px] text-gray-400">Creates a clickable card that opens the URL in a new tab.</div>
    `;

    // Position to the right of the button
    const x = btnRect.right + 10;
    const y = Math.min(window.innerHeight - 150, btnRect.top);
    popover.style.display = 'block';
    popover.style.left = `${Math.min(window.innerWidth - 330, x)}px`;
    popover.style.top = `${y}px`;

    // Center on canvas for drop position
    const dropClientX = window.innerWidth / 2;
    const dropClientY = window.innerHeight / 2;

    const input = document.getElementById('m-addlink-input');
    input.focus();

    const resetLinkTool = () => {
      window.selectTool('select');
      popover.style.display = 'none';
    };

    const submit = () => {
      const url = input.value.trim();
      if (url) {
        const coords = toCanvasCoords({ clientX: dropClientX, clientY: dropClientY });
        addLinkEmbed(url, coords.x, coords.y);
      }
      resetLinkTool();
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') resetLinkTool();
    };
    document.getElementById('m-addlink-submit').onclick = submit;

    setTimeout(() => {
      const hideOnAway = (e) => {
        if (!popover.contains(e.target) && !e.target.closest('[data-tool="link"]')) {
          resetLinkTool();
          document.removeEventListener('click', hideOnAway);
        }
      };
      document.addEventListener('click', hideOnAway);
    }, 200);
  }

  function showLinkPopover(clientX, clientY) {
    let popover = document.getElementById('m-link-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'm-link-popover';
      popover.className = 'm-popover shadow-floating p-4 flex flex-col gap-3 min-w-[300px] z-[5000]';
      document.body.appendChild(popover);
    }

    popover.innerHTML = `
      <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Reference or Embed</div>
      <div class="flex gap-2">
        <input type="text" id="m-link-input" placeholder="Paste website or video URL..." class="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
        <button id="m-link-submit" class="bg-brand text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:opacity-90">ADD</button>
      </div>
    `;

    popover.style.display = 'block';
    popover.style.left = `${Math.min(window.innerWidth - 320, clientX)}px`;
    popover.style.top = `${Math.min(window.innerHeight - 100, clientY)}px`;

    const input = document.getElementById('m-link-input');
    input.focus();

    const submit = () => {
      const url = input.value.trim();
      if (url) {
        const coords = toCanvasCoords({ clientX, clientY });
        if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) {
          addVideoLink(url, coords.x, coords.y);
        } else {
          addLinkEmbed(url, coords.x, coords.y);
        }
      }
      popover.style.display = 'none';
      if (currentTool === 'link') {
         window.selectTool('select');
      }
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') popover.style.display = 'none';
    };
    document.getElementById('m-link-submit').onclick = submit;

    // Handle clicking away
    const hideOnAway = (e) => {
      if (!popover.contains(e.target) && !e.target.closest('[data-tool="link"]')) {
        popover.style.display = 'none';
        window.removeEventListener('mousedown', hideOnAway);
      }
    };
    setTimeout(() => window.addEventListener('mousedown', hideOnAway), 10);
  }

  async function addLinkEmbed(url, x, y) {
    const id = 'el-' + Date.now();
    // Pre-create element for immediate UI feedback
    const placeholder = { id, type: 'link', x, y, z: ++highestZ, content: url, title: 'Loading link...', loading: true };
    elements.push(placeholder);
    renderElements();

    try {
      const response = await fetch(`${window.location.origin}/api/proxy/metadata?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      
      const data = await response.json();
      
      const el = elements.find(item => item.id === id);
      if (el) {
        el.loading = false;
        el.title = data.title || url;
        el.description = data.description || '';
        el.thumbnail = data.image || '';
        el.favicon = data.favicon || '';
        el.domain = data.domain || new URL(url).hostname.replace('www.', '');
        renderElements();
        saveBoard();
      }
    } catch (err) {
      console.error('Metadata fetch failed:', err);
      const el = elements.find(item => item.id === id);
      if (el) {
        el.loading = false;
        el.title = url;
        try { el.domain = new URL(url).hostname.replace('www.', ''); } catch(e) { el.domain = 'External Site'; }
        renderElements();
      }
    }
  }


  // Global Paste Listener for URLs
  window.addEventListener('paste', (e) => {
    if (e.target.closest('[contenteditable]') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const text = e.clipboardData.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      e.preventDefault();
      // Paste at cursor position or center
      const coords = toCanvasCoords({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
      if (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('vimeo.com')) {
        addVideoLink(text, coords.x, coords.y);
      } else {
        addLinkEmbed(text, coords.x, coords.y);
      }
    }
  });

async function addVideoLink(url, x, y) {
  let embedUrl = url;
  if (url.includes('youtube.com/watch')) {
    const vid = new URL(url).searchParams.get('v');
    embedUrl = `https://www.youtube.com/embed/${vid}?autoplay=0`;
  } else if (url.includes('youtu.be/')) {
    const vid = url.split('youtu.be/')[1].split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${vid}?autoplay=0`;
  } else if (url.includes('youtube.com/shorts/')) {
    const vid = url.split('/shorts/')[1].split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${vid}?autoplay=0`;
  } else if (url.includes('vimeo.com/')) {
    const vid = url.split('vimeo.com/')[1].split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${vid}`;
  }
  
  const isShorts = url.includes('/shorts/');
  const id = 'el-' + Date.now();
  const newEl = {
    id, type: 'video',
    x, y, z: ++highestZ,
    content: embedUrl,
    originalUrl: url,
    isEmbed: true,
    width: isShorts ? 320 : 400, 
    height: isShorts ? 580 : 380, // Vertical for shorts
    loading: true
  };
  elements.push(newEl);
  renderElements();

  try {
    const response = await fetch(`${window.location.origin}/api/proxy/metadata?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    const el = elements.find(item => item.id === id);
    if (el) {
      el.loading = false;
      el.title = data.title || 'Untitled Video';
      el.description = data.description || '';
      el.domain = data.domain || '';
      el.favicon = data.favicon || '';
      renderElements();
      saveBoard();
      undoMgr.push(elements, connections);
    }
  } catch (err) {
    console.error('Metadata fetch failed for video:', err);
    const el = elements.find(item => item.id === id);
    if (el) { el.loading = false; renderElements(); }
  }
}


  function renderConnections() {
    if (!svgLayer) return;
    const group = document.getElementById('moodboard-connections-group');
    if (!group) return;
    group.innerHTML = '';
    
    connections.forEach(conn => {
          group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          group.appendChild(path);
          connectionsGroup.appendChild(group);
          window._connectionElements.set(conn.id, group);
        } else {
          path = group.querySelector('path');
        }

        const d = calculateArrowPath(start, end, conn.style || 'curved');
        if (path.getAttribute('d') !== d) path.setAttribute('d', d);
        
        const className = `m-arrow-path ${selectedConnectionId === conn.id ? 'selected' : ''}`;
        if (path.getAttribute('class') !== className) path.setAttribute('class', className);
        
        const stroke = conn.color || '#7C6FF7';
        if (path.getAttribute('stroke') !== stroke) path.setAttribute('stroke', stroke);
        
        const strokeWidth = conn.thickness || 3;
        if (path.getAttribute('stroke-width') !== String(strokeWidth)) path.setAttribute('stroke-width', strokeWidth);
        
        path.setAttribute('fill', 'none');
        
        const markerEnd = conn.headEnd ? 'url(#arrowhead)' : '';
        if (path.getAttribute('marker-end') !== markerEnd) {
          if (markerEnd) path.setAttribute('marker-end', markerEnd);
          else path.removeAttribute('marker-end');
        }

        const markerStart = conn.headStart ? 'url(#arrowhead)' : '';
        if (path.getAttribute('marker-start') !== markerStart) {
          if (markerStart) path.setAttribute('marker-start', markerStart);
          else path.removeAttribute('marker-start');
        }
        
        path.style.pointerEvents = 'auto';
        path.onclick = (e) => {
           e.stopPropagation();
           selectedConnectionId = conn.id;
           selectedElements.clear();
           renderElements();
           renderConnections();
           showArrowPopover(e.clientX, e.clientY, conn);
        };
        
        // Handle handles
        const existingHandles = group.querySelectorAll('.m-arrow-handle');
        if (selectedConnectionId === conn.id) {
          if (existingHandles.length === 0) {
            const sHandle = createSvgHandle(start.x, start.y, conn.id, 'start');
            const eHandle = createSvgHandle(end.x, end.y, conn.id, 'end');
            group.appendChild(sHandle);
            group.appendChild(eHandle);
          } else {
            existingHandles[0].setAttribute('cx', start.x);
            existingHandles[0].setAttribute('cy', start.y);
            existingHandles[1].setAttribute('cx', end.x);
            existingHandles[1].setAttribute('cy', end.y);
          }
        } else {
          existingHandles.forEach(h => h.remove());
        }
      }
    });

    // Cleanup stale connections
    for (const [id, group] of window._connectionElements.entries()) {
      if (!activeIds.has(id)) {
        if (group.parentNode) group.remove();
        window._connectionElements.delete(id);
      }
    }
  }

  function getPointForElement(id, manualPos) {
    if (!id) return manualPos;
    const el = elements.find(e => e.id === id);
    if (!el) return manualPos;
    return {
      x: el.x + (el.width || 200) / 2,
      y: el.y + (el.height || 100) / 2
    };
  }

  function createSvgHandle(x, y, id, type) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', 6 / scale);
    c.setAttribute('class', 'm-arrow-handle');
    c.setAttribute('data-id', id);
    c.setAttribute('data-type', type);
    c.style.fill = 'var(--brand)';
    c.style.stroke = 'white';
    c.style.strokeWidth = 2 / scale;
    c.style.cursor = 'move';
    c.style.pointerEvents = 'auto';
    return c;
  }

  function calculateArrowPath(a, b, style) {
    if (style === 'straight') return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    const cp = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} C ${cp} ${a.y}, ${cp} ${b.y}, ${b.x} ${b.y}`;
  }

  window.showArrowPopover = (x, y, conn) => {
    let popover = document.getElementById('m-arrow-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'm-arrow-popover';
      popover.className = 'm-popover shadow-floating';
      document.body.appendChild(popover);
    }
    
    popover.innerHTML = `
      <div class="m-popover-title">Arrow Style</div>
      <div class="flex gap-2 mb-3">
        <button class="p-1 px-2 border rounded text-xs ${conn.style === 'straight' ? 'bg-brand text-white' : ''}" onclick="window.updateConn('${conn.id}', {style: 'straight'})">Straight</button>
        <button class="p-1 px-2 border rounded text-xs ${conn.style === 'curved' ? 'bg-brand text-white' : ''}" onclick="window.updateConn('${conn.id}', {style: 'curved'})">Curved</button>
      </div>
      <div class="m-popover-title">Direction</div>
      <div class="flex gap-2 mb-3">
        <button class="p-1 border rounded ${!conn.headStart && !conn.headEnd ? 'bg-brand text-white' : ''}" onclick="window.updateConn('${conn.id}', {headStart: false, headEnd: false})">None</button>
        <button class="p-1 border rounded ${conn.headEnd && !conn.headStart ? 'bg-brand text-white' : ''}" onclick="window.updateConn('${conn.id}', {headStart: false, headEnd: true})">→</button>
        <button class="p-1 border rounded ${conn.headStart && conn.headEnd ? 'bg-brand text-white' : ''}" onclick="window.updateConn('${conn.id}', {headStart: true, headEnd: true})">↔</button>
      </div>
      <div class="m-popover-title">Stroke</div>
      <div class="flex items-center gap-2 mb-3">
        <input type="range" min="1" max="10" value="${conn.thickness || 3}" class="flex-1" oninput="window.updateConn('${conn.id}', {thickness: parseInt(this.value)})">
      </div>
      <div class="m-popover-title">Color</div>
      <div class="flex gap-1">
        ${['#7C6FF7', '#1A1A1A', '#FF4444', '#44BB44'].map(c => `
          <div class="w-5 h-5 rounded-full cursor-pointer border ${conn.color === c ? 'ring-2 ring-brand' : ''}" style="background: ${c}" onclick="window.updateConn('${conn.id}', {color: '${c}'})"></div>
        `).join('')}
      </div>
      <button class="mt-4 w-full text-red-500 text-xs font-bold pt-2 border-t" onclick="window.deleteConn('${conn.id}')">Delete Arrow</button>
    `;
    
    popover.style.display = 'block';
    popover.style.left = `${Math.min(window.innerWidth - 200, x)}px`;
    popover.style.top = `${Math.min(window.innerHeight - 300, y)}px`;
    
    window.onclick = (e) => {
      if (!e.target.closest('#m-arrow-popover') && !e.target.closest('.m-arrow-path')) {
        popover.style.display = 'none';
        selectedConnectionId = null;
        renderConnections();
      }
    };
  };

  window.updateConn = (id, props) => {
    const conn = connections.find(c => c.id === id);
    if (conn) {
      Object.assign(conn, props);
      renderConnections();
      saveBoard();
      // Re-render popover to show active state
      window.showArrowPopover(parseInt(document.getElementById('m-arrow-popover').style.left), parseInt(document.getElementById('m-arrow-popover').style.top), conn);
    }
  };
  
  window.deleteConn = (id) => {
    connections = connections.filter(c => c.id !== id);
    selectedConnectionId = null;
    document.getElementById('m-arrow-popover').style.display = 'none';
    renderConnections();
    saveBoard();
    undoMgr.push(elements, connections);
  };

  const saveBoard = debounce(() => {
    lastUpdateId = Date.now().toString();
    const projId = window.currentProject || window.appData.projects[0]?.id;
    if (window.dbUpdate && projId) {
      const proj = window.appData.projects.find(p => p.id === projId);
      if (proj) {
        if (!proj.data) proj.data = {};
        proj.data.moodboard = elements;
        proj.data.connections = connections;
        if (projId) {
          window.dbUpdate('projects', projId, { data: proj.data });
        }
        if (typeof socket !== 'undefined' && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'moodboard_update',
            projectId: projId,
            elements,
            connections,
            updateId: lastUpdateId
          }));
        }
      }
    }
  }, 1000);

  window.copyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    if (window.showToast) window.showToast(`Copied ${hex} to clipboard`, 'info');
  };

  window.duplicateElement = (id) => {
    const original = elements.find(el => el.id === id);
    if (!original) return;

    const newId = 'el-' + Date.now();
    const newEl = JSON.parse(JSON.stringify(original));
    newEl.id = newId;
    newEl.x += 20;
    newEl.y += 20;
    newEl.z = ++highestZ;

    elements.push(newEl);
    renderElements();
    saveBoard();
    undoMgr.push(elements, connections);
  };

  window.deleteElement = (id) => {
    elements = elements.filter(el => el.id !== id);
    connections = connections.filter(c => c.fromId !== id && c.toId !== id);
    selectedElements.delete(id);
    renderElements();
    renderConnections();
    saveBoard();
    undoMgr.push(elements, connections);
  };

  window.bringToFront = (id) => {
    const el = elements.find(i => i.id === id);
    if (el) {
      el.z = ++highestZ;
      const card = document.getElementById(`card-${id}`);
      if (card) card.style.zIndex = el.z;
      saveBoard();
      // No need to push undo for Z-order usually, but good for consistency
      undoMgr.push(elements, connections);
    }
  };

  window.sendToBack = (id) => {
    const el = elements.find(i => i.id === id);
    if (el) {
      const minZ = Math.min(...elements.map(e => e.z || 1000));
      el.z = minZ - 1;
      renderElements();
      saveBoard();
      undoMgr.push(elements, connections);
    }
  };

  window.undo = () => {
    const state = undoMgr.undo();
    if (state) {
      elements = state.elements;
      connections = state.connections;
      renderElements();
      renderConnections();
      saveBoard();
    }
  };

  window.redo = () => {
    const state = undoMgr.redo();
    if (state) {
      elements = state.elements;
      connections = state.connections;
      renderElements();
      renderConnections();
      saveBoard();
    }
  };

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('[contenteditable]') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Arrow Navigation
    const panStep = 40;
    if (e.key === 'ArrowUp') { e.preventDefault(); panY += panStep; updateTransform(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); panY -= panStep; updateTransform(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); panX += panStep; updateTransform(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); panX -= panStep; updateTransform(); }
    
    if (e.ctrlKey && e.key === 'z') {
       e.preventDefault();
       window.undo();
    }
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
       e.preventDefault();
       window.redo();
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
       selectedElements.forEach(id => window.deleteElement(id));
       selectedElements.clear();
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      selectedElements.forEach(id => window.duplicateElement(id));
    }
  });

  // Context Menu
  window.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.m-card');
    if (!card) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, card.id.replace('card-', ''));
  });

  function showContextMenu(x, y, elId) {
    let menu = document.getElementById('moodboard-context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'moodboard-context-menu';
      menu.className = 'm-context-menu p-1';
      document.body.appendChild(menu);
    }
    
    const el = elements.find(i => i.id === elId);
    
    menu.innerHTML = `
      <div class="m-context-item flex justify-between gap-4" onclick="duplicateElement('${elId}')">Duplicate <span class="m-context-shortcut">Ctrl+D</span></div>
      <div class="m-context-item flex justify-between gap-4" onclick="deleteElement('${elId}')">Move to Trash <span class="m-context-shortcut">Del</span></div>
      <div class="h-px bg-gray-100 my-1 mx-1"></div>
      <div class="m-context-item flex justify-between gap-4" onclick="renameElement('${elId}')">Rename <span class="m-context-shortcut">R</span></div>
      <div class="m-context-item flex justify-between gap-4" onclick="lockElement('${elId}')">${el?.locked ? 'Unlock' : 'Lock Position'} <span class="m-context-shortcut">K</span></div>
      <div class="h-px bg-gray-100 my-1 mx-1"></div>
      <div class="m-context-item" onclick="bringToFront('${elId}')">Bring to Front <span class="m-context-shortcut">]</span></div>
      <div class="m-context-item" onclick="sendToBack('${elId}')">Send to Back <span class="m-context-shortcut">[</span></div>
      <div class="h-px bg-gray-100 my-1 mx-1"></div>
      <div class="m-context-item" onclick="convertToBoard('${elId}')">Convert to Board</div>
    `;
    
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
    
    setTimeout(() => {
      window.onclick = () => menu.classList.add('hidden');
    }, 10);
  }

  window.renameElement = (id) => {
    const el = elements.find(i => i.id === id);
    if (el) {
       const newTitle = prompt('Rename to:', el.title || el.content || '');
       if (newTitle !== null) {
          if (el.type === 'note' || el.type === 'text') el.content = newTitle;
          else el.title = newTitle;
          renderElements();
          saveBoard();
          undoMgr.push(elements, connections);
       }
    }
  };

  window.lockElement = (id) => {
     const el = elements.find(i => i.id === id);
     if (el) {
        el.locked = !el.locked;
        renderElements();
        saveBoard();
        undoMgr.push(elements, connections);
     }
  };

  window.convertToBoard = (id) => {
     const el = elements.find(i => i.id === id);
     if (el) {
        const title = el.title || el.content || 'New Board';
        const newEl = { 
           id: 'el-' + Date.now(), 
           type: 'board', 
           x: el.x, 
           y: el.y, 
           title: title, 
           count: 1, 
           z: ++highestZ 
        };
        elements = elements.filter(item => item.id !== id);
        elements.push(newEl);
        renderElements();
        saveBoard();
        undoMgr.push(elements, connections);
     }
  };

  window.bringToFront = (id) => {
    const el = elements.find(i => i.id === id);
    if (el) el.z = ++highestZ;
    renderElements();
    saveBoard();
    undoMgr.push(elements, connections);
  };

  window.copyHex = (hex) => {
     navigator.clipboard.writeText(hex);
     const toast = document.createElement('div');
     toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[10000] text-xs font-bold fade-in';
     toast.textContent = `Copied ${hex}`;
     document.body.appendChild(toast);
     setTimeout(() => toast.remove(), 2000);
  };

  window.addColorToPalette = (id) => {
    let panel = document.getElementById(`color-add-panel-${id}`);
    if (panel) { panel.remove(); return; }

    panel = document.createElement('div');
    panel.id = `color-add-panel-${id}`;
    panel.className = 'fixed z-[99999] bg-white rounded-xl shadow-floating p-3 flex flex-col gap-2';
    panel.style.width = '180px';

    const card = document.getElementById(`card-${id}`);
    const rect = card?.getBoundingClientRect();
    panel.style.top = `${rect ? rect.top : 200}px`;
    panel.style.left = `${rect ? rect.right + 8 : 200}px`;

    panel.innerHTML = `
      <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add Color</div>
      <input type="color" id="cp-picker-${id}" class="w-full h-8 rounded cursor-pointer border-0" value="#7C6FF7">
      <div class="flex gap-1 items-center">
        <span class="text-xs text-gray-400">#</span>
        <input type="text" id="cp-hex-${id}" placeholder="7C6FF7" maxlength="7"
          class="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none font-mono uppercase">
      </div>
      <button onclick="window.confirmAddColor('${id}')" 
        class="w-full text-xs bg-brand text-white rounded-lg py-1.5 font-bold hover:opacity-90">
        Add Swatch
      </button>
    `;

    document.body.appendChild(panel);

    const picker = document.getElementById(`cp-picker-${id}`);
    const hexInput = document.getElementById(`cp-hex-${id}`);

    picker.oninput = () => { hexInput.value = picker.value.replace('#', ''); };
    hexInput.oninput = () => {
      const val = hexInput.value.trim();
      if (/^[0-9a-fA-F]{6}$/.test(val)) picker.value = '#' + val;
    };

    setTimeout(() => {
      document.addEventListener('click', function handler(ev) {
        if (!panel.contains(ev.target) && !ev.target.closest(`#card-${id}`)) {
          panel.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  };

  window.confirmAddColor = (id) => {
    const picker = document.getElementById(`cp-picker-${id}`);
    if (!picker) return;
    const hex = picker.value.toUpperCase();
    const el = elements.find(i => i.id === id);
    if (el) {
      if (!el.colors) el.colors = [];
      el.colors.push(hex);
      const card = document.getElementById(`card-${id}`);
      const grid = card?.querySelector('.grid');
      if (grid) {
        const i = el.colors.length - 1;
        const swatch = document.createElement('div');
        swatch.className = 'relative group aspect-square rounded-md shadow-sm cursor-pointer border border-black/5';
        swatch.style.background = hex;
        swatch.onclick = (e) => { e.stopPropagation(); window.copyHex(hex); };
        swatch.innerHTML = `<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md"><button class="text-white" onclick="event.stopPropagation(); window.removeSwatch('${id}', ${i})"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`;
        grid.appendChild(swatch);
      }
      saveBoard();
      undoMgr.push(elements, connections);
      document.getElementById(`color-add-panel-${id}`)?.remove();
    }
  };

  // Swatch helpers
  window.removeSwatch = (id, index) => {
    const el = elements.find(i => i.id === id);
    if (el && el.colors) {
      el.colors.splice(index, 1);
      renderElements();
      saveBoard();
      undoMgr.push(elements, connections);
    }
  };

  let usePressure = true;
  window.togglePressure = () => {
    usePressure = !usePressure;
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[10000] text-xs font-bold fade-in';
    toast.textContent = `Pressure Simulation: ${usePressure ? 'ON' : 'OFF'}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const remoteCursors = new Map();

  function showRemoteCursor(cursor) {
    if (!cursor?.userId || cursor.userId === window.appData?.user?.id) return;
    
    let el = remoteCursors.get(cursor.userId);
    if (!el) {
      el = document.createElement('div');
      el.className = 'remote-cursor absolute pointer-events-none z-[9999]';
      el.innerHTML = `
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
          <path d="M0 0L0 16L4.5 12L7.5 18.5L9.5 17.5L6.5 11L12 11L0 0Z" fill="${cursor.color || '#7C6FF7'}"/>
        </svg>
        <div class="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white mt-0.5 whitespace-nowrap" 
             style="background: ${cursor.color || '#7C6FF7'}">${cursor.name}</div>
      `;
      elementsLayer.appendChild(el);
      remoteCursors.set(cursor.userId, el);
    }
    
    el.style.left = `${cursor.x}px`;
    el.style.top = `${cursor.y}px`;
    
    // Remove cursor after 5 seconds of inactivity
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => { if (el.parentNode) el.remove(); remoteCursors.delete(cursor.userId); }, 5000);
  }
})();

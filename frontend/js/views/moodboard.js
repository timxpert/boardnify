window.initMoodboard = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  const _projectId = projectId || 'p-1';
  
  // Clean up global styles
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden';
  if(document.getElementById('app')) document.getElementById('app').style.overflow = 'hidden';

  // --- STATE ---
  let scale = 1, panX = 0, panY = 0, isPanning = false, startPanX = 0, startPanY = 0;
  let isDragging = false, isResizing = false;
  let activeElements = new Set(); // For multi-select
  let highestZ = 10;
  let draggedElOffset = {x:0,y:0};
  let isBoxSelecting = false, selStartX = 0, selStartY = 0, selBox = null;
  let hoveredEl = null; // For connection arrows
  let isDrawingArrow = false, arrowStartEl = null;
  let ctxTarget = null; // Context menu target

  project.data = project.data || {};
  if(!project.data.moodboard) project.data.moodboard = [];
  if(!project.data.threads) project.data.threads = [];
  if(!project.data.colors) project.data.colors = ['#FF6B2B', '#1E293B', '#F87171', '#34D399'];

  // --- LAYOUT ---
  container.innerHTML = `
    <div class="flex h-full w-full bg-[#f4f5f7] overflow-hidden text-[#1e293b] font-sans relative">
      <!-- Left Add Panel -->
      <div id="mb-left-panel" class="w-64 bg-white border-r border-[#E5E5E5] flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform -translate-x-full md:translate-x-0 absolute md:relative h-full shrink-0">
         <div class="p-4 border-b border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
            <h3 class="text-[11px] font-black uppercase tracking-widest text-gray-500">Add to Board</h3>
            <button class="md:hidden text-gray-400" onclick="document.getElementById('mb-left-panel').classList.add('-translate-x-full')">✕</button>
         </div>
         <div class="flex-1 overflow-y-auto p-4 space-y-6 select-none bg-white">
            <div>
               <div class="text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">Media</div>
               <div class="grid grid-cols-2 gap-2">
                  <div class="add-tool bg-[#F9F9F9] hover:bg-[#F3F3F3] border border-[#EBEBEB] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors" data-type="image"><span class="text-xl mb-1">🖼️</span><span class="text-[10px] font-bold text-gray-600">Image</span></div>
                  <div class="add-tool bg-[#F9F9F9] hover:bg-[#F3F3F3] border border-[#EBEBEB] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors" data-type="video"><span class="text-xl mb-1">🎥</span><span class="text-[10px] font-bold text-gray-600">Video</span></div>
                  <div class="add-tool bg-[#F9F9F9] hover:bg-[#F3F3F3] border border-[#EBEBEB] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors col-span-2" data-type="link"><span class="text-xl mb-1">🔗</span><span class="text-[10px] font-bold text-gray-600">Add Link</span></div>
               </div>
            </div>
            <!-- My Media Library Panel added -->
            <div id="mb-media-lib-section" class="pt-4 border-t border-gray-100 hidden md:block">
               <div class="text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">My Media Library</div>
               <input type="text" id="mb-lib-search" class="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs font-medium mb-3 focus:ring-1 focus:border-brand outline-none transition" placeholder="Search file name...">
               <div id="mb-lib-loading" class="text-brand flex justify-center py-4"><svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
               <div id="mb-lib-grid" class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1"></div>
               <button id="mb-lib-load-more" class="w-full mt-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest transition hidden">Load More</button>
            </div>
            <div>
               <div class="text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">Notes</div>
               <div class="grid grid-cols-2 gap-2">
                  <div class="add-tool bg-[#FEFAED] hover:bg-[#FCEBAE] border border-[#FBE083] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors col-span-2" data-type="text" data-color="yellow"><span class="text-xl mb-1">📝</span><span class="text-[10px] font-bold text-[#A67C00]">Text Note</span></div>
                  <div class="add-tool bg-[#FDF2F8] border border-[#FBCFE8] p-2 rounded flex items-center justify-center cursor-pointer" data-type="text" data-color="pink"><span class="text-[10px] font-bold text-[#BE185D]">Pink</span></div>
                  <div class="add-tool bg-[#F0FDF4] border border-[#BBF7D0] p-2 rounded flex items-center justify-center cursor-pointer" data-type="text" data-color="green"><span class="text-[10px] font-bold text-[#15803D]">Green</span></div>
                  <div class="add-tool bg-[#EFF6FF] border border-[#BFDBFE] p-2 rounded flex items-center justify-center cursor-pointer" data-type="text" data-color="blue"><span class="text-[10px] font-bold text-[#1D4ED8]">Blue</span></div>
                  <div class="add-tool bg-[#FAF5FF] border border-[#E9D5FF] p-2 rounded flex items-center justify-center cursor-pointer" data-type="text" data-color="purple"><span class="text-[10px] font-bold text-[#7E22CE]">Purple</span></div>
                  <div class="add-tool bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded flex items-center justify-center cursor-pointer" data-type="text" data-color="gray"><span class="text-[10px] font-bold text-[#334155]">Gray</span></div>
               </div>
            </div>
            <div>
               <div class="text-[10px] font-bold uppercase tracking-widest text-[#B3B3B3] mb-3">Structure</div>
               <div class="grid grid-cols-2 gap-2">
                  <div class="add-tool bg-[#F9F9F9] border border-[#EBEBEB] hover:bg-[#F3F3F3] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer" data-type="column"><span class="text-xl mb-1">📋</span><span class="text-[10px] font-bold text-gray-600">Column</span></div>
                  <div class="add-tool bg-[#F9F9F9] border border-[#EBEBEB] hover:bg-[#F3F3F3] p-3 rounded-lg flex flex-col items-center justify-center cursor-pointer" data-type="color"><span class="text-xl mb-1">🎨</span><span class="text-[10px] font-bold text-gray-600">Swatch</span></div>
               </div>
            </div>
         </div>
      </div>
      
      <!-- Canvas Area -->
      <div class="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
         <!-- Header -->
         <header class="h-14 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] flex items-center justify-between px-5 z-30 shrink-0 pointer-events-auto shadow-sm">
            <div class="flex items-center gap-4">
               <button class="md:hidden text-gray-500" onclick="document.getElementById('mb-left-panel').classList.remove('-translate-x-full')">☰</button>
               <h1 class="text-sm font-bold text-[#1E293B] flex items-center gap-2">${project.title} <span class="bg-[#F3F4F6] text-[#6B7280] text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">Board</span></h1>
               <div id="save-dt" class="text-[10px] font-medium text-gray-400">Saved</div>
            </div>
            <div class="flex items-center gap-3">
               <div class="flex -space-x-2" id="board-collab"></div>
               <button class="bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] font-bold py-1.5 px-4 rounded shadow-sm text-xs transition">Share</button>
               <button class="bg-[#FF6B2B] hover:bg-[#E55A1F] text-white font-bold py-1.5 px-4 rounded shadow-sm text-xs transition min-w-[80px]" id="mb-deliver">Deliver</button>
               <button class="p-1.5 text-gray-400 hover:text-gray-800" onclick="document.getElementById('mb-right-panel').classList.toggle('hidden')">⋮</button>
            </div>
         </header>

         <!-- Main Viewport -->
         <div id="canvas-wrapper" class="flex-1 relative bg-transparent cursor-grab active:cursor-grabbing outline-none overflow-hidden touch-none" tabindex="0">
            <!-- Grid Background -->
            <div id="canvas-bg" class="absolute inset-0 pointer-events-none" style="background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px); background-size: 24px 24px; background-position: 0 0;"></div>
            
            <!-- Transforms Area -->
            <div id="canvas-content" class="absolute transform-origin-top-left" style="width:0;height:0;">
               <!-- Base layer for Arrows -->
               <svg class="absolute overflow-visible pointer-events-none z-0" style="width:100%; height:100%;">
                 <defs>
                   <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                     <polygon points="0 0, 8 3, 0 6" fill="#FF6B2B" />
                   </marker>
                 </defs>
                 <g id="arrows-layer"></g>
               </svg>
               <!-- Elements container -->
               <div id="elements-layer" class="absolute inset-0 z-10"></div>
            </div>
            
            <!-- UI Overlays (Selection, Guides) -->
            <div id="sel-box" class="absolute border border-[#FF6B2B] bg-[#FF6B2B]/10 pointer-events-none hidden z-50"></div>
            <div id="g-h" class="absolute h-[1px] bg-blue-500 pointer-events-none hidden z-50"></div>
            <div id="g-v" class="absolute w-[1px] bg-blue-500 pointer-events-none hidden z-50"></div>
         </div>

         <!-- Bottom specific floating tools -->
         <div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full flex items-center border border-gray-100 p-1 z-30">
            <button class="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B2B] transition" onclick="document.querySelector('[data-type=image]').click()">🖼️</button>
            <button class="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B2B] transition" onclick="document.querySelector('[data-type=text]').click()">📝</button>
            <button class="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B2B] transition" onclick="document.querySelector('[data-type=color]').click()">🎨</button>
            <div class="w-px h-5 bg-gray-200 mx-1"></div>
            <button id="zoom-out" class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 font-bold text-sm">-</button>
            <span id="zoom-level" class="text-[10px] font-bold text-gray-700 w-10 text-center cursor-pointer select-none" title="Reset to 100%">100%</span>
            <button id="zoom-in" class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-600 font-bold text-sm">+</button>
         </div>
      </div>
      
      <!-- Right Properties Panel -->
      <div id="mb-right-panel" class="w-[280px] bg-white border-l border-[#E5E5E5] z-40 shadow-sm shrink-0 flex flex-col absolute right-0 h-full hidden md:flex">
         <div class="p-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex justify-between items-center">
            <h3 class="text-[11px] font-black uppercase tracking-widest text-[#6B7280]">Properties</h3>
            <button class="text-gray-400 hover:text-gray-800 md:hidden" onclick="document.getElementById('mb-right-panel').classList.add('hidden')">✕</button>
         </div>
         <div id="props-empty" class="p-8 text-center text-xs text-gray-400 font-medium">Select an element to edit</div>
         <div id="props-content" class="p-5 flex-1 overflow-y-auto hidden flex-col gap-4">
            <div class="flex items-center gap-2 mb-2"><span id="prop-icon" class="text-xl"></span><span id="prop-title" class="font-bold text-sm text-gray-800"></span></div>
            <div class="grid grid-cols-2 gap-3">
               <div><label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">X Pos</label><input type="number" id="prop-x" class="w-full bg-[#f9fafb] border border-gray-200 rounded p-2 text-xs font-mono font-medium focus:ring-1 focus:border-brand outline-none"></div>
               <div><label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Y Pos</label><input type="number" id="prop-y" class="w-full bg-[#f9fafb] border border-gray-200 rounded p-2 text-xs font-mono font-medium focus:ring-1 focus:border-brand outline-none"></div>
               <div class="col-span-2"><label class="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Width</label><input type="number" id="prop-w" class="w-full bg-[#f9fafb] border border-gray-200 rounded p-2 text-xs font-mono font-medium focus:ring-1 focus:border-brand outline-none"></div>
            </div>
            
            <div id="prop-specific" class="pt-4 border-t border-gray-100 hidden flex-col gap-3"></div>
            
            <div class="pt-4 border-t border-gray-100 flex gap-2 mt-auto">
               <button id="prop-lock-btn" class="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition">Lock</button>
               <button id="prop-del-btn" class="flex-1 py-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-xs font-bold text-red-600 transition">Delete</button>
            </div>
         </div>
      </div>
      
      <!-- Context Menu -->
      <div id="ctx-menu" class="absolute bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.1)] py-1.5 w-48 z-50 hidden overflow-hidden text-[#374151]">
         <div class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 mb-1" id="ctx-title">Element</div>
         <button class="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#FF6B2B]/10 hover:text-[#FF6B2B] flex items-center gap-2 transition" id="ctx-comment">💬 Add Comment</button>
         <button class="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 transition" id="ctx-rf">⬆️ Bring to Front</button>
         <button class="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 transition" id="ctx-rb">⬇️ Send to Back</button>
         <button class="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 transition" id="ctx-dup">📋 Duplicate</button>
         <div class="h-px bg-gray-100 my-1"></div>
         <button class="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition" id="ctx-del">🗑️ Delete</button>
      </div>

      <!-- Thread / Comments Panel Overlay (Milanote style floating panel beside element) -->
      <div id="thread-panel" class="absolute bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 w-[280px] z-50 hidden flex-col overflow-hidden">
         <div class="p-3 border-b border-gray-100 bg-[#FAFAFA] flex justify-between items-center">
            <span class="text-[11px] font-black uppercase tracking-widest text-[#FF6B2B]">Thread</span>
            <button id="thread-resolve" class="text-[10px] font-bold text-gray-400 hover:text-green-600 transition flex items-center gap-1">✓ Resolve</button>
         </div>
         <div id="thread-msgs" class="p-4 max-h-64 min-h-[100px] overflow-y-auto flex flex-col gap-3 bg-white"></div>
         <div class="p-3 border-t border-gray-100 bg-[#FAFAFA] flex gap-2">
            <input type="text" id="thread-input" class="flex-1 bg-white border border-gray-200 rounded shadow-sm p-2 text-xs focus:ring-1 focus:ring-brand outline-none" placeholder="Reply...">
            <button id="thread-send" class="bg-brand text-white px-3 py-1 rounded shadow-sm text-xs font-bold hover:bg-brand/90 transition">Send</button>
         </div>
      </div>
      
      <!-- Invisible file input -->
      <input type="file" id="mb-file-input" accept="image/*,video/*" class="hidden">
    </div>
  `;

  // --- CORE DOM ---
  const wrapper = document.getElementById('canvas-wrapper');
  const content = document.getElementById('canvas-content');
  const bg = document.getElementById('canvas-bg');
  const elLayer = document.getElementById('elements-layer');
  const arrowLayer = document.getElementById('arrows-layer');
  const selBoxEl = document.getElementById('sel-box');
  const fileInput = document.getElementById('mb-file-input');

  // --- DB SYNC (Debounced) ---
  let saveTimeout;
  const saveState = () => {
     document.getElementById('save-dt').textContent = 'Saving...';
     clearTimeout(saveTimeout);
     saveTimeout = setTimeout(() => {
        // Collect exact state from DOM to ensure sync (excluding loading states)
        const updated = [];
        document.querySelectorAll('.mb-el:not([data-type="loading"])').forEach(el => {
           updated.push({
              id: el.id,
              type: el.dataset.type,
              x: parseFloat(el.style.left)||0,
              y: parseFloat(el.style.top)||0,
              w: parseFloat(el.style.width)||200,
              h: parseFloat(el.style.height)||null,
              content: el.dataset.content||'',
              color: el.dataset.color||'',
              caption: el.dataset.caption||'',
              locked: el.dataset.locked === 'true',
              z: parseInt(el.style.zIndex)||10
           });
        });
        project.data.moodboard = updated;
        if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
        document.getElementById('save-dt').textContent = 'All changes saved at ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
     }, 1000);
  };

  // --- RENDERING ---
  const applyTransform = () => {
    content.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    bg.style.backgroundPosition = `${panX}px ${panY}px`;
    bg.style.backgroundSize = `${24 * scale}px ${24 * scale}px`;
    document.getElementById('zoom-level').textContent = Math.round(scale * 100) + '%';
  };

  const colorsMap = {
     yellow: { bg: '#FEFAED', border: '#FBE083', text: '#A67C00' },
     pink: { bg: '#FDF2F8', border: '#FBCFE8', text: '#BE185D' },
     green: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
     blue: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
     purple: { bg: '#FAF5FF', border: '#E9D5FF', text: '#7E22CE' },
     gray: { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155' },
     white: { bg: '#FFFFFF', border: '#E5E7EB', text: '#1F2937' } // default text
  };

  const createElNode = (data) => {
     if(document.getElementById(data.id)) document.getElementById(data.id).remove();
     
     const el = document.createElement('div');
     el.id = data.id;
     el.className = 'mb-el absolute shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 rounded-xl group select-none hover:ring-2 hover:ring-black/10 transition-shadow';
     // Data attributes
     el.dataset.type = data.type;
     el.dataset.content = data.content || '';
     el.dataset.color = data.color || 'white';
     el.dataset.caption = data.caption || '';
     el.dataset.locked = data.locked ? 'true' : 'false';
     
     // Geometry
     el.style.left = data.x + 'px';
     el.style.top = data.y + 'px';
     el.style.width = data.w + 'px';
     if(data.h) el.style.height = data.h + 'px';
     el.style.zIndex = data.z || (highestZ++);
     if(el.style.zIndex >= highestZ) highestZ = parseInt(el.style.zIndex) + 1;

     let inner = '';
     const capHTML = `<div contenteditable="${!data.locked}" class="absolute -bottom-7 left-0 right-0 text-center text-xs font-medium text-gray-500 bg-transparent outline-none focus:text-gray-800 transition-colors pointer-events-auto empty:before:content-['Add_caption...'] empty:before:opacity-0 focus:empty:before:opacity-50 cap-edit">${data.caption||''}</div>`;

     if(data.type === 'loading') {
         inner = `<div class="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200" style="min-height:100px"><svg class="w-8 h-8 text-brand animate-spin mb-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="text-[10px] font-bold text-gray-400 uppercase">Uploading...</span></div>`;
     } 
     else if(data.type === 'image') {
         inner = `<div class="w-full h-full bg-white rounded-xl overflow-hidden relative"><img src="${data.content}" class="w-full h-full object-cover pointer-events-none" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect fill=\\'%23Fee2e2\\' width=\\'100\\' height=\\'100\\'/><text fill=\\'%23ef4444\\' x=\\'50\\' y=\\'50\\' font-family=\\'Arial\\' font-size=\\'10\\' text-anchor=\\'middle\\' alignment-baseline=\\'middle\\'>Broken Image</text></svg>'"></div>${capHTML}`;
     }
     else if(data.type === 'video') {
         inner = `<div class="w-full h-full bg-black rounded-xl overflow-hidden relative group/v"><img src="${data.content}" class="w-full h-full object-cover opacity-70 pointer-events-none"><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><div class="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><svg class="w-4 h-4 ml-1 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div></div>${capHTML}`;
     }
     else if(data.type === 'text') {
         const theme = colorsMap[data.color] || colorsMap.white;
         inner = `<textarea class="w-full h-full p-4 text-sm font-medium resize-none rounded-xl shadow-inner pointer-events-auto outline-none transition-colors border" style="background-color:${theme.bg}; border-color:${theme.border}; color:${theme.text}" placeholder="Type here..." ${data.locked?'disabled':''}>${data.content}</textarea>`;
     }
     else if(data.type === 'color') {
         inner = `<div class="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden pointer-events-none border border-gray-100"><div class="flex-1" style="background-color:${data.content||'#FF6B2B'}"></div><div class="h-8 bg-white flex items-center justify-center text-[10px] font-mono font-bold text-gray-600 uppercase">${data.content||'#FF6B2B'}</div></div>`;
     }
     else if(data.type === 'link') {
         // Fake OG Card
         let domain = 'Website';
         try{ domain = new URL(data.content).hostname.replace('www.','') }catch(e){}
         inner = `<div class="w-full h-full bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col pointer-events-none overflow-hidden"><div class="h-2/3 bg-gray-50 flex items-center justify-center text-gray-300"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg></div><div class="h-1/3 p-3 flex flex-col justify-center bg-white border-t border-gray-50"><span class="text-[9px] text-brand font-black uppercase tracking-widest">${domain}</span><span class="text-xs font-bold text-gray-800 truncate">${data.content}</span></div></div>`;
     }
     else if(data.type === 'column') {
         el.className = 'mb-el absolute rounded-xl bg-gray-50/80 border border-gray-200/80 p-4 transition-colors group select-none hover:border-gray-300';
         inner = `<input type="text" class="w-full bg-transparent font-bold text-sm text-gray-600 outline-none mb-2 pointer-events-auto" value="${data.content||'New Column'}"><div class="col-body w-full h-full min-h-[100px] pointer-events-none"></div>`;
     }

     // Lock / Badges
     const lockHTML = `<div class="absolute top-2 left-2 w-5 h-5 bg-white/90 backdrop-blur rounded flex items-center justify-center text-gray-500 transition-opacity z-20 ${data.locked?'':'hidden pointer-events-none'}"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>`;
     
     // Threads Badge
     const threadCount = project.data.threads.filter(t => t.elId === data.id && !t.resolved).length;
     const threadHTML = threadCount > 0 ? `<div class="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow z-20 cursor-pointer pointer-events-auto hover:scale-110 thread-badge">${threadCount}</div>` : '';

     // Resize Handle
     const resizeHTML = `<div class="resize-handle absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-brand rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 hover:scale-125 transition-transform z-20 ${data.locked?'hidden':''}"></div>`;
          
     // Connection Points (Arrow start nodes)
     const connHTML = `
       <div class="conn-pt absolute top-1/2 -left-1.5 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-crosshair z-20 transform -translate-y-1/2" data-dir="left"></div>
       <div class="conn-pt absolute top-1/2 -right-1.5 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-crosshair z-20 transform -translate-y-1/2" data-dir="right"></div>
       <div class="conn-pt absolute -top-1.5 left-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-crosshair z-20 transform -translate-x-1/2" data-dir="top"></div>
       <div class="conn-pt absolute -bottom-1.5 left-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-crosshair z-20 transform -translate-x-1/2" data-dir="bottom"></div>
     `;

     el.innerHTML = inner + lockHTML + threadHTML + resizeHTML + (data.locked?'':connHTML);
     
     // Event Binds directly
     const tArea = el.querySelector('textarea');
     if(tArea) {
         tArea.oninput = (e) => {
             el.dataset.content = e.target.value;
             el.style.height = Math.max(100, tArea.scrollHeight) + 'px';
             saveState();
         };
         // initial height
         setTimeout(()=> { el.style.height = Math.max(data.h||100, tArea.scrollHeight) + 'px'; }, 10);
     }
     const cap = el.querySelector('.cap-edit');
     if(cap) {
         cap.onblur = (e) => { el.dataset.caption = e.target.textContent; saveState(); };
         cap.onkeydown = (e) => { if(e.key === 'Enter') { e.preventDefault(); e.target.blur(); } e.stopPropagation();};
     }
     const tBadge = el.querySelector('.thread-badge');
     if(tBadge) {
         tBadge.onclick = (e) => { e.stopPropagation(); openThreadsPanel(el.id); };
     }

     elLayer.appendChild(el);
  };

  const renderAll = () => {
      elLayer.innerHTML = '';
      project.data.moodboard.forEach(createElNode);
      drawArrows();
  };

  // --- ARROWS ---
  let arrows = project.data.arrows || [];
  const drawArrows = () => {
     arrowLayer.innerHTML = '';
     arrows.forEach((a, idx) => {
         const fEl = document.getElementById(a.from);
         const tEl = document.getElementById(a.to);
         if(!fEl || !tEl) return;
         
         const getPt = (el, dir) => {
             const x = parseFloat(el.style.left);
             const y = parseFloat(el.style.top);
             const w = parseFloat(el.style.width);
             const h = parseFloat(el.style.height) || w;
             if(dir==='left') return {x: x, y: y+h/2};
             if(dir==='right') return {x: x+w, y: y+h/2};
             if(dir==='top') return {x: x+w/2, y: y};
             return {x: x+w/2, y: y+h};
         };
         
         const p1 = getPt(fEl, a.fDir);
         const p2 = getPt(tEl, a.tDir);
         
         // Bezier logic
         const dx = p2.x - p1.x;
         const dy = p2.y - p1.y;
         const c1x = p1.x + (a.fDir==='left'?-50:a.fDir==='right'?50:0);
         const c1y = p1.y + (a.fDir==='top'?-50:a.fDir==='bottom'?50:0);
         const c2x = p2.x + (a.tDir==='left'?-50:a.tDir==='right'?50:0);
         const c2y = p2.y + (a.tDir==='top'?-50:a.tDir==='bottom'?50:0);

         const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
         path.setAttribute('d', `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`);
         path.setAttribute('fill', 'none');
         path.setAttribute('stroke', '#FF6B2B');
         path.setAttribute('stroke-width', '2');
         path.setAttribute('marker-end', 'url(#arrowhead)');
         // Make clickable to delete
         path.style.cursor = 'pointer';
         path.style.pointerEvents = 'stroke';
         path.onclick = (e) => {
            e.stopPropagation();
            if(confirm('Delete Arrow?')) {
               arrows.splice(idx,1);
               project.data.arrows = arrows;
               saveState();
               drawArrows();
            }
         };
         arrowLayer.appendChild(path);
     });
  };

  // --- SUPABASE UPLOADS ---
  const uploadFile = async (file, nx, ny) => {
      if (!file) return;

      // 1. Validation (Type and Size)
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) {
          if (window.showToast) window.showToast('Invalid file type. Only images and videos are supported.', 'error');
          return;
      }
      if (file.size > 50 * 1024 * 1024) {
          if (window.showToast) window.showToast('File size exceeds 50MB limit.', 'error');
          return;
      }

      // 2. Auth Check
      if (window.supabaseClient) {
          try {
              const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
              if (sessionError || !session) {
                  window.location.href = '/login.html';
                  return;
              }
          } catch(e) {
              console.warn('Session check failed or not available:', e);
          }
      }
      const id = 'el-' + Date.now();
      
      // Add Placeholder
      createElNode({ id, type: 'loading', x: nx, y: ny, w: 200, h: 200, z: highestZ++ });
      
      try {
         const formData = new FormData();
         formData.append('file', file);
         
         const uploadUrl = `${window.BASE_URL}/api/upload`;
         console.log(`[Frontend] Uploading to: ${uploadUrl}`);

         const response = await fetch(uploadUrl, {
           method: 'POST',
           body: formData
         });

         if (!response.ok) {
           const errorData = await response.json();
           throw new Error(errorData.error || 'Upload failed');
         }

         const result = await response.json();
         const publicUrl = result.url;
         
         // Replace placeholder
         if(document.getElementById(id)) document.getElementById(id).remove();
         const node = { id, type: isVid?'video':'image', x: nx, y: ny, w: 300, h: isVid?200:0, content: publicUrl, locked:false, z:highestZ++ };
         createElNode(node);
         saveState();
      } catch(err) {
         console.error('File Upload Error:', err);
         if(document.getElementById(id)) document.getElementById(id).remove();
         const msg = err.message ? err.message : 'Upload Failed.';
         if(window.showToast) window.showToast(`Upload Error: ${msg}`, 'error');
      }
  };

  // --- ADD ELEMENTS ---
  const addElement = (type, color) => {
      const rc = wrapper.getBoundingClientRect();
      const nx = ((rc.width/2)/scale) - (panX/scale) - 100;
      const ny = ((rc.height/2)/scale) - (panY/scale) - 100;
      
      if(type === 'image' || type === 'video') {
         fileInput.dataset.dropX = nx;
         fileInput.dataset.dropY = ny;
         fileInput.click();
         return;
      }
      if(type === 'link') {
         const url = prompt('Enter URL:');
         if(url) {
            createElNode({ id:'el-'+Date.now(), type:'link', x:nx,y:ny,w:300,h:120, content:url, locked:false });
            saveState();
         }
         return;
      }
      
      const el = { id:'el-'+Date.now(), type, x:nx, y:ny, w: type==='text'?240: (type==='column'?300:200), h: type==='text'?120:(type==='column'?400:200), content:'', color: color||'white', locked:false };
      if(type==='color') el.content = project.data.colors[Math.floor(Math.random()*project.data.colors.length)];
      createElNode(el);
      if(type ==='text') document.getElementById(el.id).querySelector('textarea').focus();
      saveState();
  };

  // Binding left panel & bottom toolbar tools
  document.querySelectorAll('.add-tool, .mb-tool-btn').forEach(btn => {
      btn.onclick = (e) => {
         e.stopPropagation();
         addElement(btn.dataset.type || btn.dataset.action.replace('upload-','').replace('add-','').replace('-note',''), btn.dataset.color);
         if(window.innerWidth < 768 && btn.classList.contains('add-tool')) {
            document.getElementById('mb-left-panel').classList.add('-translate-x-full');
         }
      };
  });
  
  fileInput.onchange = (e) => {
      if(!e.target.files.length) return;
      uploadFile(e.target.files[0], parseFloat(fileInput.dataset.dropX), parseFloat(fileInput.dataset.dropY));
      fileInput.value = '';
  };

  // Drag & Drop to canvas
  wrapper.addEventListener('dragover', (e) => { e.preventDefault(); wrapper.classList.add('bg-blue-50/10'); });
  wrapper.addEventListener('dragleave', () => wrapper.classList.remove('bg-blue-50/10'));
  wrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      wrapper.classList.remove('bg-blue-50/10');
      if(!e.dataTransfer.files.length) return;
      const rc = wrapper.getBoundingClientRect();
      const nx = ((e.clientX - rc.left)/scale) - (panX/scale);
      const ny = ((e.clientY - rc.top)/scale) - (panY/scale);
      uploadFile(e.dataTransfer.files[0], nx, ny);
  });

  // --- PAN, ZOOM, DRAG ---
  wrapper.addEventListener('wheel', (e) => {
      if(e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomRate = 0.01;
          const newScale = Math.min(Math.max(0.25, scale - (e.deltaY * zoomRate)), 4);
          const rc = wrapper.getBoundingClientRect();
          const mx = e.clientX - rc.left, my = e.clientY - rc.top;
          panX = mx - (mx - panX) * (newScale / scale);
          panY = my - (my - panY) * (newScale / scale);
          scale = newScale;
          applyTransform();
      } else {
          panX -= e.deltaX;
          panY -= e.deltaY;
          applyTransform();
      }
  }, { passive: false });

  document.getElementById('zoom-in').onclick = () => { scale=Math.min(4, scale+0.1); applyTransform(); };
  document.getElementById('zoom-out').onclick = () => { scale=Math.max(0.25, scale-0.1); applyTransform(); };
  document.getElementById('zoom-level').onclick = () => { scale=1; panX=0; panY=0; applyTransform(); };

  wrapper.addEventListener('mousedown', (e) => {
      if(e.button === 1 || e.code === 'Space' || e.target === wrapper || e.target === bg || e.target === elLayer) {
          // Check for multi-select vs Pan
          if(e.shiftKey || e.target === wrapper || e.target===elLayer) {
             // Multi select Box
             if(!e.shiftKey) clearSelection();
             isBoxSelecting = true;
             selStartX = e.clientX;
             selStartY = e.clientY;
             selBoxEl.classList.remove('hidden');
             selBoxEl.style.left = selStartX + 'px';
             selBoxEl.style.top = selStartY + 'px';
             selBoxEl.style.width = '0px';
             selBoxEl.style.height = '0px';
          } else {
             // Pan
             isPanning = true;
             startPanX = e.clientX - panX;
             startPanY = e.clientY - panY;
             wrapper.style.cursor = 'grabbing';
          }
          return;
      }

      // Check Resize
      if(e.target.classList.contains('resize-handle')) {
         isResizing = true;
         const el = e.target.parentElement;
         selectElement(el, false);
         draggedElOffset = { w: parseFloat(el.style.width), h: parseFloat(el.style.height)||parseFloat(el.style.width), x: e.clientX, y: e.clientY };
         e.stopPropagation();
         return;
      }

      // Connection Drawing
      if(e.target.classList.contains('conn-pt')) {
         isDrawingArrow = true;
         arrowStartEl = e.target;
         e.stopPropagation();
         return;
      }

      // Context Menu
      if(e.button === 2) {
         const el = e.target.closest('.mb-el');
         if(el) {
            selectElement(el, false); // Single select
            ctxTarget = el;
            const ctxMenu = document.getElementById('ctx-menu');
            ctxMenu.classList.remove('hidden');
            ctxMenu.style.left = e.clientX + 'px';
            ctxMenu.style.top = e.clientY + 'px';
            document.getElementById('ctx-title').textContent = el.dataset.type + ' Note';
         }
         return;
      }

      // Standard Drag (Element)
      const el = e.target.closest('.mb-el');
      if(el && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT' && !e.target.closest('.cap-edit')) {
         if(el.dataset.locked === 'true') return;
         if(!activeElements.has(el)) {
            selectElement(el, e.shiftKey);
         }
         isDragging = true;
         draggedElOffset = { x: e.clientX, y: e.clientY };
         
         // Store initial positions for all selected
         activeElements.forEach(aEl => {
            aEl.dataset.sx = parseFloat(aEl.style.left);
            aEl.dataset.sy = parseFloat(aEl.style.top);
            aEl.style.zIndex = highestZ++;
         });
      }
  });

  window.addEventListener('mousemove', (e) => {
      if(isPanning) {
         panX = e.clientX - startPanX;
         panY = e.clientY - startPanY;
         applyTransform();
      } else if(isBoxSelecting) {
         const w = e.clientX - selStartX;
         const h = e.clientY - selStartY;
         selBoxEl.style.width = Math.abs(w) + 'px';
         selBoxEl.style.height = Math.abs(h) + 'px';
         selBoxEl.style.left = (w < 0 ? e.clientX : selStartX) + 'px';
         selBoxEl.style.top = (h < 0 ? e.clientY : selStartY) + 'px';
      } else if(isDragging) {
         const dx = (e.clientX - draggedElOffset.x) / scale;
         const dy = (e.clientY - draggedElOffset.y) / scale;
         
         activeElements.forEach(aEl => {
            aEl.style.left = (parseFloat(aEl.dataset.sx) + dx) + 'px';
            aEl.style.top = (parseFloat(aEl.dataset.sy) + dy) + 'px';
         });
         
         if(activeElements.size === 1) updatePropsPanelFast(activeElements.values().next().value);
         drawArrows(); // Update live
      } else if(isResizing) {
         const aEl = activeElements.values().next().value;
         if(!aEl) return;
         const dw = (e.clientX - draggedElOffset.x) / scale;
         const dh = (e.clientY - draggedElOffset.y) / scale;
         
         let isShape = aEl.dataset.type === 'color';
         aEl.style.width = Math.max(50, draggedElOffset.w + dw) + 'px';
         if(!isShape && aEl.dataset.type !== 'image') {
            aEl.style.height = Math.max(50, draggedElOffset.h + dh) + 'px';
         }
         updatePropsPanelFast(aEl);
         drawArrows();
      }
  });

  window.addEventListener('mouseup', (e) => {
      // End Pan
      if(isPanning) { isPanning = false; wrapper.style.cursor = 'grab'; }
      
      // End Box Select
      if(isBoxSelecting) {
         isBoxSelecting = false;
         selBoxEl.classList.add('hidden');
         const rc = selBoxEl.getBoundingClientRect();
         const crc = content.getBoundingClientRect();
         const sx = (rc.left - crc.left)/scale;
         const sy = (rc.top - crc.top)/scale;
         const sw = rc.width/scale;
         const sh = rc.height/scale;
         
         document.querySelectorAll('.mb-el').forEach(el => {
            const ex = parseFloat(el.style.left), ey = parseFloat(el.style.top);
            if(ex >= sx && ex <= sx+sw && ey >= sy && ey <= sy+sh && el.dataset.locked !== 'true') {
               activeElements.add(el);
               el.classList.add('ring-2', 'ring-brand', 'ring-offset-2');
            }
         });
      }
      
      // End Drag/Resize
      if(isDragging || isResizing) {
         isDragging = false;
         isResizing = false;
         saveState();
      }

      // End Arrow Draw
      if(isDrawingArrow) {
         const toEl = e.target.closest('.mb-el');
         if(toEl && toEl !== arrowStartEl.closest('.mb-el')) {
            // Find closest connection point conceptually, or just default top/bottom
            let tDir = 'top'; // simplified
            project.data.arrows = project.data.arrows || [];
            project.data.arrows.push({
               from: arrowStartEl.closest('.mb-el').id,
               fDir: arrowStartEl.dataset.dir,
               to: toEl.id,
               tDir: tDir
            });
            drawArrows();
            saveState();
         }
         isDrawingArrow = false;
      }
  });

  // Hide context menu on click elsewhere
  document.addEventListener('mousedown', (e) => {
     if(!e.target.closest('#ctx-menu')) document.getElementById('ctx-menu').classList.add('hidden');
     if(!e.target.closest('#thread-panel') && !e.target.closest('.thread-badge') && e.target.id!=='ctx-comment') {
         document.getElementById('thread-panel').classList.add('hidden');
     }
  });
  
  // Right click overrides
  wrapper.addEventListener('contextmenu', e => e.preventDefault());

  // --- SELECTION & PROPS ---
  const clearSelection = () => {
     activeElements.forEach(el => el.classList.remove('ring-2', 'ring-brand', 'ring-offset-2'));
     activeElements.clear();
     document.getElementById('props-empty').classList.remove('hidden');
     document.getElementById('props-content').classList.add('hidden');
  };
  
  const selectElement = (el, toggle=false) => {
     if(!toggle) clearSelection();
     if(toggle && activeElements.has(el)) {
        activeElements.delete(el);
        el.classList.remove('ring-2', 'ring-brand', 'ring-offset-2');
     } else {
        activeElements.add(el);
        el.classList.add('ring-2', 'ring-brand', 'ring-offset-2');
     }
     if(activeElements.size === 1) updatePropsPanel(activeElements.values().next().value);
     else {
        document.getElementById('props-empty').classList.remove('hidden');
        document.getElementById('props-content').classList.add('hidden');
     }
  };

  const updatePropsPanel = (el) => {
      document.getElementById('props-empty').classList.add('hidden');
      document.getElementById('props-content').classList.remove('hidden');
      if(window.innerWidth > 768 && document.getElementById('mb-right-panel').classList.contains('hidden')) {
          document.getElementById('mb-right-panel').classList.remove('hidden');
      }
      
      let pIcon = '🔲';
      if(el.dataset.type === 'image') pIcon = '🖼️';
      if(el.dataset.type === 'text') pIcon = '📝';
      
      document.getElementById('prop-icon').textContent = pIcon;
      document.getElementById('prop-title').textContent = el.dataset.type.toUpperCase() + ' PROPERTIES';
      
      const isLocked = el.dataset.locked === 'true';
      document.getElementById('prop-lock-btn').textContent = isLocked ? 'Unlock' : 'Lock';
      document.getElementById('prop-lock-btn').className = isLocked ? 'flex-1 py-2 bg-brand/10 text-brand rounded-lg text-xs font-bold transition' : 'flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 transition';
      
      updatePropsPanelFast(el);
  };

  const updatePropsPanelFast = (el) => {
      document.getElementById('prop-x').value = parseFloat(el.style.left) || 0;
      document.getElementById('prop-y').value = parseFloat(el.style.top) || 0;
      document.getElementById('prop-w').value = parseFloat(el.style.width) || 0;
  };

  ['x','y','w'].forEach(dim => {
     document.getElementById('prop-'+dim).addEventListener('change', e => {
        if(activeElements.size !== 1) return;
        const el = activeElements.values().next().value;
        if(el.dataset.locked === 'true') return;
        el.style[dim==='w'?'width':(dim==='x'?'left':'top')] = e.target.value + 'px';
        saveState();
        drawArrows();
     });
  });

  document.getElementById('prop-lock-btn').onclick = () => {
      activeElements.forEach(el => {
         const L = el.dataset.locked === 'true';
         el.dataset.locked = (!L).toString();
         el.querySelector('.resize-handle').classList.toggle('hidden');
         el.querySelectorAll('.conn-pt').forEach(n => n.classList.toggle('hidden'));
         const lBadge = el.querySelectorAll('div')[2]; // lock badge
         if(!L) lBadge.classList.replace('hidden', 'flex');
         else { lBadge.classList.replace('flex','hidden'); lBadge.classList.add('hidden'); }
      });
      if(activeElements.size === 1) updatePropsPanel(activeElements.values().next().value);
      saveState();
  };

  const delAction = () => {
      activeElements.forEach(el => {
         if(el.dataset.locked !== 'true') {
            el.remove();
            // remove related arrows
            arrows = arrows.filter(a => a.from !== el.id && a.to !== el.id);
         }
      });
      project.data.arrows = arrows;
      clearSelection();
      saveState();
      drawArrows();
  };
  document.getElementById('prop-del-btn').onclick = delAction;
  document.getElementById('ctx-del').onclick = () => { if(ctxTarget) { activeElements.add(ctxTarget); delAction(); ctxTarget=null; document.getElementById('ctx-menu').classList.add('hidden'); }};
  document.addEventListener('keydown', e => {
     if((e.key === 'Delete' || e.key === 'Backspace') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.contentEditable !== 'true') {
        delAction();
     }
  });

  // Context Actions
  document.getElementById('ctx-rf').onclick = () => { if(ctxTarget){ ctxTarget.style.zIndex = highestZ++; saveState(); document.getElementById('ctx-menu').classList.add('hidden');}};
  document.getElementById('ctx-rb').onclick = () => { if(ctxTarget){ ctxTarget.style.zIndex = 1; saveState(); document.getElementById('ctx-menu').classList.add('hidden');}};
  document.getElementById('ctx-dup').onclick = () => { 
      if(ctxTarget){ 
         const data = { id:'el-'+Date.now(), type:ctxTarget.dataset.type, x:parseFloat(ctxTarget.style.left)+20, y:parseFloat(ctxTarget.style.top)+20, w:parseFloat(ctxTarget.style.width), h:parseFloat(ctxTarget.style.height), content:ctxTarget.dataset.content, color:ctxTarget.dataset.color, locked:false };
         createElNode(data);
         saveState();
         document.getElementById('ctx-menu').classList.add('hidden');
      }
  };
  document.getElementById('ctx-comment').onclick = () => {
     if(ctxTarget) openThreadsPanel(ctxTarget.id);
     document.getElementById('ctx-menu').classList.add('hidden');
  };

  // --- COMMENTS / THREADS ---
  let activeThreadElId = null;
  const tPanel = document.getElementById('thread-panel');

  const openThreadsPanel = (elId) => {
      activeThreadElId = elId;
      const el = document.getElementById(elId);
      const rc = el.getBoundingClientRect();
      tPanel.style.left = (rc.right + 20) + 'px';
      tPanel.style.top = rc.top + 'px';
      tPanel.classList.remove('hidden');
      renderThreads();
      document.getElementById('thread-input').focus();
  };

  const renderThreads = () => {
      const container = document.getElementById('thread-msgs');
      const ts = project.data.threads.filter(t => t.elId === activeThreadElId && !t.resolved);
      container.innerHTML = ts.length === 0 ? '<div class="text-center text-xs text-gray-400 py-6">No active comments. Start a thread!</div>' : '';
      
      ts.forEach(t => {
         container.innerHTML += `
            <div class="bg-gray-50 rounded p-3 text-xs">
               <div class="font-bold text-[10px] text-brand mb-1 uppercase tracking-widest">${t.user}</div>
               <div class="text-gray-700">${t.text}</div>
            </div>
         `;
      });
      container.scrollTop = container.scrollHeight;
  };

  document.getElementById('thread-send').onclick = () => {
      const val = document.getElementById('thread-input').value.trim();
      if(!val || !activeThreadElId) return;
      project.data.threads.push({ elId: activeThreadElId, resolved: false, text: val, user: window.activeRole||'Designer' });
      document.getElementById('thread-input').value = '';
      if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
      // update badge
      createElNode(project.data.moodboard.find(e=>e.id===activeThreadElId)); // re-render that node to update badge
      renderThreads();
  };

  document.getElementById('thread-resolve').onclick = () => {
      project.data.threads.forEach(t => { if(t.elId === activeThreadElId) t.resolved = true; });
      if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
      createElNode(project.data.moodboard.find(e=>e.id===activeThreadElId));
      tPanel.classList.add('hidden');
  };

  // Init
  renderAll();

  // --- MY MEDIA LIBRARY PANEL LOGIC ---
  if(window.activeRole !== 'client') {
     document.getElementById('mb-media-lib-section').classList.remove('hidden');
     let libAssets = [];
     let filteredAssets = [];
     let itemsLimit = 20;

     const searchInp = document.getElementById('mb-lib-search');
     const gridEl = document.getElementById('mb-lib-grid');
     const loadBtn = document.getElementById('mb-lib-load-more');
     const loadingEl = document.getElementById('mb-lib-loading');

     const renderLibGrid = () => {
         gridEl.innerHTML = '';
         const max = Math.min(filteredAssets.length, itemsLimit);
         for(let i=0; i<max; i++) {
             const a = filteredAssets[i];
             const c = document.createElement('div');
             c.className = 'aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer relative group border border-gray-200 hover:border-[#FF6B2B] transition';
             // thumbnail min 80x80px logic
             c.innerHTML = `
                 ${a.type==='Video' ? `<video src="${a.img}" class="w-full h-full object-cover" muted></video>`:`<img src="${a.img}" class="w-full h-full object-cover">`}
                 <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span class="text-white font-bold text-xl">+</span>
                 </div>
             `;
             c.onclick = () => {
                 // add asset directly to board center
                 const rc = wrapper.getBoundingClientRect();
                 const nx = ((rc.width/2)/scale) - (panX/scale) - 100;
                 const ny = ((rc.height/2)/scale) - (panY/scale) - 100;
                 const typeToUse = a.type === 'Video' ? 'video' : 'image';
                 const node = { id: 'el-'+Date.now(), type: typeToUse, x: nx, y: ny, w: 300, h: a.type==='Video'?200:0, content: a.img, locked: false, z: highestZ++ };
                 createElNode(node);
                 saveState();
                 // close panel on mobile after tap
                 if(window.innerWidth < 768) {
                     document.getElementById('mb-left-panel').classList.add('-translate-x-full');
                 }
             };
             gridEl.appendChild(c);
         }
         
         if(filteredAssets.length > itemsLimit) loadBtn.classList.remove('hidden');
         else loadBtn.classList.add('hidden');
     };

     const fetchMbLibrary = async () => {
         try {
             if(window.supabaseClient) {
                 // Try fetching from supabase directly
                 const { data, error } = await window.supabaseClient.from('library').select('*').order('created_at', { ascending: false });
                 if(data && !error) libAssets = data;
                 else if(window.appData && window.appData.library) libAssets = window.appData.library;
             } else if (window.appData && window.appData.library) {
                 libAssets = window.appData.library;
             }
             filteredAssets = [...libAssets];
             loadingEl.classList.add('hidden');
             renderLibGrid();
         } catch(e) {
             console.error('Fetch Library Error:', e);
             loadingEl.classList.add('hidden');
         }
     };

     searchInp.oninput = (e) => {
         const str = e.target.value.toLowerCase();
         filteredAssets = libAssets.filter(a => a.title.toLowerCase().includes(str) || (a.tags && a.tags.join(' ').toLowerCase().includes(str)));
         itemsLimit = 20;
         renderLibGrid();
     };

     loadBtn.onclick = () => {
         itemsLimit += 20;
         renderLibGrid();
     };

     // initial fetch
     fetchMbLibrary();
  }

  // Mobile Pinch to Zoom
  let touchStartDist = 0;
  let initScale = 1;
  wrapper.addEventListener('touchstart', e => {
     if(e.touches.length === 2) {
        isPanning = false;
        isDragging = false;
        touchStartDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        initScale = scale;
     } else if(e.touches.length === 1 && e.target === wrapper) {
        // Single finger pan
        isPanning = true;
        startPanX = e.touches[0].clientX - panX;
        startPanY = e.touches[0].clientY - panY;
     }
  });
  wrapper.addEventListener('touchmove', e => {
     if(e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        scale = Math.min(4, Math.max(0.25, initScale * (dist / touchStartDist)));
        applyTransform();
     } else if(isPanning && e.touches.length === 1) {
        e.preventDefault();
        panX = e.touches[0].clientX - startPanX;
        panY = e.touches[0].clientY - startPanY;
        applyTransform();
     }
  }, {passive: false});
  wrapper.addEventListener('touchend', e => { isPanning = false; });
  
  // Cleanup hook
  const _ogNav = window.navigate;
  window.navigate = (route) => {
     if(document.getElementById('app')) document.getElementById('app').style.overflow = '';
     _ogNav(route);
  };
};

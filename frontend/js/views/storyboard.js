window.initStoryboard = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  const isRealUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const _projectId = projectId || project?.id;
  
  if (!project.data) project.data = {};
  if (!project.data.storyboard) project.data.storyboard = [
    { id: 'col-1', title: 'Act I: Introduction', elements: [] },
    { id: 'col-2', title: 'Act II: Rising Action', elements: [] },
    { id: 'col-3', title: 'Act III: Conclusion', elements: [] }
  ];

  container.innerHTML = `
    <div class="h-full flex flex-col bg-[#EEECEA]">
      <div class="flex-1 overflow-x-auto p-12">
        <div id="storyboard-columns" class="flex gap-8 h-full items-start">
          <!-- Columns rendered here -->
          <button id="add-column-btn" class="w-80 h-16 border-2 border-dashed border-border-light rounded-2xl flex items-center justify-center text-text-muted hover:text-text-dark hover:bg-white transition-all shrink-0">
             <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
             <span class="text-xs font-black uppercase tracking-widest">Add Column</span>
          </button>
        </div>
      </div>
    </div>
    
    <style>
      .s-column { width: 320px; flex-shrink: 0; display: flex; flex-col; gap: 4px; }
      .s-card { background: white; border-radius: 8px; border: 1px solid var(--border-light); padding: 12px; margin-bottom: 8px; cursor: grab; }
      .s-card:hover { border-color: var(--brand); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .s-drop-zone { min-height: 100px; flex-grow: 1; border-radius: 12px; transition: background 0.2s; }
      .s-drop-zone.over { background: rgba(124, 111, 247, 0.05); border: 2px dashed var(--brand); }
    </style>
  `;

  const colContainer = document.getElementById('storyboard-columns');
  const addColBtn = document.getElementById('add-column-btn');

  function renderStoryboard() {
    const existingCols = colContainer.querySelectorAll('.s-column');
    existingCols.forEach(c => c.remove());

    project.data.storyboard.forEach((col, cIdx) => {
      const colEl = document.createElement('div');
      colEl.className = 's-column flex flex-col h-full';
      colEl.innerHTML = `
        <div class="flex items-center justify-between mb-4 px-2">
           <input type="text" value="${col.title}" class="bg-transparent border-none focus:ring-0 text-sm font-black uppercase tracking-widest text-text-dark w-full" 
                  onblur="window.updateColTitle('${col.id}', this.value)">
           <button class="text-text-muted hover:text-red-500 p-1" onclick="window.deleteColumn('${col.id}')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
           </button>
        </div>

        <div class="s-drop-zone p-2 overflow-y-auto scrollbar-hide" data-col-id="${col.id}">
           ${col.elements.map(el => `
             <div class="s-card group" data-card-id="${el.id}" data-col-id="${col.id}">
                <div class="text-[11px] font-bold text-text-dark mb-2">${el.type.toUpperCase()}</div>
                <div class="text-xs text-text-muted leading-relaxed truncate-3-lines">${el.content || 'No content...'}</div>
             </div>
           `).join('')}
           <div class="mt-4 p-4 border border-dashed border-border-light rounded-xl text-center cursor-pointer hover:bg-white text-[10px] font-black uppercase tracking-widest text-text-muted"
                onclick="window.addCardToCol('${col.id}')">
              + New Card
           </div>
        </div>
      `;

      // --- CROSS-DEVICE DRAG AND DROP (PointerEvents) ---
      colEl.querySelectorAll('.s-card').forEach(card => {
        card.onpointerdown = (e) => {
          if (e.target.closest('button')) return;
          const cardId = card.dataset.cardId;
          const fromColId = card.dataset.colId;
          
          const isTouch = e.pointerType === 'touch';
          let dragTimeout = isTouch ? setTimeout(startDrag, 200) : startDrag();
          
          function startDrag() {
            card.setPointerCapture(e.pointerId);
            card.classList.add('opacity-40', 'scale-95');
            
            const ghost = card.cloneNode(true);
            ghost.classList.remove('opacity-40', 'scale-95');
            ghost.classList.add('fixed', 'pointer-events-none', 'z-[11000]', 'shadow-2xl', 'w-80');
            ghost.style.left = e.clientX - 100 + 'px';
            ghost.style.top = e.clientY - 40 + 'px';
            document.body.appendChild(ghost);
            
            card.onpointermove = (moveEv) => {
              ghost.style.left = moveEv.clientX - 100 + 'px';
              ghost.style.top = moveEv.clientY - 40 + 'px';
              const target = document.elementFromPoint(moveEv.clientX, moveEv.clientY);
              const dropZone = target?.closest('.s-drop-zone');
              document.querySelectorAll('.s-drop-zone').forEach(dz => dz.classList.remove('over'));
              if (dropZone) dropZone.classList.add('over');
            };
            
            card.onpointerup = (upEv) => {
              clearTimeout(dragTimeout);
              card.releasePointerCapture(upEv.pointerId);
              card.classList.remove('opacity-40', 'scale-95');
              if (ghost) ghost.remove();
              
              const target = document.elementFromPoint(upEv.clientX, upEv.clientY);
              const dropZone = target?.closest('.s-drop-zone');
              document.querySelectorAll('.s-drop-zone').forEach(dz => dz.classList.remove('over'));
              
              if (dropZone) {
                const toColId = dropZone.dataset.colId;
                if (fromColId !== toColId) {
                  window.moveCard(cardId, fromColId, toColId);
                }
              }
              card.onpointermove = null;
              card.onpointerup = null;
            };
          }
          
          if (isTouch) {
            card.onpointerup = () => clearTimeout(dragTimeout);
            card.onpointercancel = () => clearTimeout(dragTimeout);
          }
        };
      });

      colContainer.insertBefore(colEl, addColBtn);
    });
  }

  window.updateColTitle = (id, title) => {
    const col = project.data.storyboard.find(c => c.id === id);
    if (col) {
      col.title = title;
      saveState();
    }
  };

  window.addCardToCol = (colId) => {
    const target = project.data.storyboard.find(c => c.id === colId);
    if (target) {
      target.elements.push({ id: 's-' + Date.now(), type: 'note', content: 'New Story Element' });
      renderStoryboard();
      saveState();
    }
  };

  window.deleteColumn = (id) => {
    if (confirm('Delete this column and all its elements?')) {
      project.data.storyboard = project.data.storyboard.filter(c => c.id !== id);
      renderStoryboard();
      saveState();
    }
  };

  window.onCardDragStart = (e, cardId, fromColId) => {
    e.dataTransfer.setData('card-move', JSON.stringify({ cardId, fromColId }));
  };

  window.moveCard = (cardId, fromColId, toColId) => {
    const fromCol = project.data.storyboard.find(c => c.id === fromColId);
    const toCol = project.data.storyboard.find(c => c.id === toColId);
    const cardIdx = fromCol.elements.findIndex(el => el.id === cardId);
    const [card] = fromCol.elements.splice(cardIdx, 1);
    toCol.elements.push(card);
    renderStoryboard();
    saveState();
  };

  addColBtn.onclick = () => {
    project.data.storyboard.push({ id: 'col-' + Date.now(), title: 'New Column', elements: [] });
    renderStoryboard();
    saveState();
  };

  function saveState() {
    if (isRealUUID(_projectId)) {
      window.dbUpdate('projects', _projectId, { data: project.data });
    }
  }

  renderStoryboard();
};

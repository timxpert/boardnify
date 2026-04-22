window.initKanban = async function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _pId = projectId || project.id;
  
  // Fetch tasks from Supabase
  try {
    if (_pId) {
      const { data, error } = await window.supabaseClient
        .from('tasks')
        .select('*')
        .eq('project_id', _pId);
      
      if (error) throw error;
      window.globalKanbanTasks = data || [];
    } else {
      window.globalKanbanTasks = project.data?.tasks || [];
    }
  } catch (err) {
    console.error('[Kanban] Fetch error, falling back to metadata:', err);
    window.globalKanbanTasks = project.data?.tasks || [];
  }

  const saveToMetadata = () => {
    project.data = project.data || {};
    project.data.tasks = window.globalKanbanTasks;
    if(window.dbUpdate && _pId) window.dbUpdate('projects', _pId, { data: project.data });
  };

  const cols = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'approved', title: 'Done' }
  ];

  container.innerHTML = `
    <div class="view-container h-full bg-bg-canvas p-10">
      <header class="flex justify-between items-end mb-10 pb-6 border-b border-border-light">
        <div>
          <h1 class="text-3xl font-bold text-text-dark mb-1">Tasks</h1>
          <p class="text-text-muted text-sm">${project.title} • Milestone Tracking</p>
        </div>
        <button id="add-task-global-btn" class="bg-brand hover:bg-opacity-90 text-white font-bold py-2.5 px-6 rounded-lg text-xs smooth-transition flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          Add Task
        </button>
      </header>
      
      <div class="flex-1 overflow-x-auto flex gap-6 pb-10 h-full" id="kanban-board">
  ${cols.map(c => `
    <div class="kanban-column w-72 flex flex-col h-full flex-shrink-0" data-column="${c.id}">
      <div class="mb-4 flex justify-between items-center pr-2">
         <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">${c.title}</span>
            <span class="bg-gray-100 text-[9px] font-bold text-text-muted px-1.5 py-0.5 rounded-full" id="count-${c.id}">0</span>
         </div>
         ${c.id === 'approved' ? `<button id="clear-done-btn" class="text-[9px] font-bold text-text-muted hover:text-brand transition uppercase tracking-widest">Clear All</button>` : ''}
      </div>
      
      <!-- Only the form remains, hidden until triggered by the global button -->
      ${c.id === 'todo' ? `
        <div class="add-task-form hidden mb-4" id="form-${c.id}">
          <div class="bg-white p-4 border border-border-light rounded-lg shadow-subtle flex flex-col gap-3">
            <input type="text" class="w-full text-xs font-bold p-2 outline-none border-b border-border-light bg-transparent" placeholder="Task name..." id="input-title-${c.id}">
            <div class="flex gap-2">
              <button class="flex-1 py-2 bg-brand text-white text-[10px] font-bold rounded uppercase save-task-btn" data-col="${c.id}">Save</button>
              <button class="flex-1 py-2 bg-bg-canvas text-text-muted text-[10px] font-bold rounded uppercase cancel-task-btn" data-col="${c.id}">Cancel</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="flex-1 space-y-3 kanban-dropzone min-h-[500px]"></div>
    </div>
  `).join('')}
</div>
</div>
`;

  // --- Logic Functions ---

  function renderTasks() {
    document.querySelectorAll('.kanban-dropzone').forEach(dz => dz.innerHTML = '');
    const counts = { todo: 0, inprogress: 0, review: 0, approved: 0 };

    window.globalKanbanTasks.forEach(task => {
      const card = document.createElement('div');
      card.draggable = true;
      card.className = 'bg-white p-4 border border-border-light rounded-lg cursor-grab active:cursor-grabbing hover:shadow-subtle hover:border-brand/30 transition-all group relative';
      card.dataset.id = task.id;
      
      let priorityBadge = 'badge-gray';
      if(task.priority === 'High') priorityBadge = 'badge-purple';
      if(task.priority === 'Low') priorityBadge = 'badge-yellow';

      card.innerHTML = `
        <div class="flex flex-col gap-2">
           <h4 class="font-bold text-text-dark text-[13px] leading-tight title-text cursor-text" contenteditable="false">${task.title}</h4>
           <div class="flex items-center gap-2">
             <span class="text-[9px] font-bold text-text-muted uppercase tracking-wider">${task.tag || 'Task'}</span>
             <div class="w-1 h-1 rounded-full bg-border-light"></div>
             <button class="priority-cycle badge ${priorityBadge}" data-id="${task.id}">${task.priority || 'Medium'}</button>
           </div>
        </div>
        
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
           <button class="p-1 hover:bg-gray-100 rounded delete-task-btn" data-id="${task.id}">
             <svg class="w-3 h-3 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
           </button>
        </div>
      `;
      
      // Inline Title Edit
      const titleEl = card.querySelector('.title-text');
      titleEl.onclick = (e) => {
        if (titleEl.contentEditable === 'true') return;
        e.stopPropagation();
        titleEl.contentEditable = 'true';
        titleEl.focus();
        card.draggable = false;
        card.classList.add('ring-2', 'ring-brand/20');
      };
      titleEl.onblur = () => {
        titleEl.contentEditable = 'false';
        card.draggable = true;
        card.classList.remove('ring-2', 'ring-brand/20');
        const newTitle = titleEl.innerText.trim();
        if (newTitle && newTitle !== task.title) {
          task.title = newTitle;
          saveToMetadata();
          if (window.dbUpdate && _pId) window.dbUpdate('tasks', task.id, { title: newTitle });
        }
      };
      titleEl.onkeydown = (e) => { if(e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } };

      // Priority Cycling
      const prioBtn = card.querySelector('.priority-cycle');
      prioBtn.onclick = (e) => {
        e.stopPropagation();
        const prios = ['Low', 'Medium', 'High'];
        let nextIdx = (prios.indexOf(task.priority || 'Medium') + 1) % prios.length;
        task.priority = prios[nextIdx];
        
        // Update badge directly instead of full render
        prioBtn.textContent = task.priority;
        prioBtn.className = `priority-cycle badge ${task.priority === 'High' ? 'badge-purple' : (task.priority === 'Low' ? 'badge-yellow' : 'badge-gray')}`;
        
        saveToMetadata();
        if (window.dbUpdate && _pId) window.dbUpdate('tasks', task.id, { priority: task.priority });
      };

      // Delete
      card.querySelector('.delete-task-btn').onclick = () => {
        if(confirm('Delete this task?')) {
          window.globalKanbanTasks = window.globalKanbanTasks.filter(t => t.id !== task.id);
          renderTasks();
          saveToMetadata();
          if(window.dbDelete && _pId) window.dbDelete('tasks', task.id);
        }
      };
      
      const zone = document.querySelector(`[data-column="${task.col || 'todo'}"] .kanban-dropzone`);
      if(zone) {
        zone.appendChild(card);
        counts[task.col || 'todo']++;
      }


      // --- CROSS-DEVICE DRAG AND DROP (PointerEvents) ---
      let startY, startX, ghost;
      
      card.onpointerdown = (e) => {
        if (e.target.closest('button') || e.target.contentEditable === 'true') return;
        
        // Long press detection for mobile to distinguish from scroll
        const isTouch = e.pointerType === 'touch';
        let dragTimeout = isTouch ? setTimeout(startDrag, 200) : startDrag();
        
        function startDrag() {
          card.setPointerCapture(e.pointerId);
          card.classList.add('opacity-40', 'scale-95', 'rotate-1');
          
          ghost = card.cloneNode(true);
          ghost.classList.remove('opacity-40', 'scale-95', 'rotate-1');
          ghost.classList.add('fixed', 'pointer-events-none', 'z-[11000]', 'shadow-2xl', 'w-64');
          ghost.style.left = e.clientX - 100 + 'px';
          ghost.style.top = e.clientY - 40 + 'px';
          document.body.appendChild(ghost);
          
          let rafPending = false;
          card.onpointermove = (moveEv) => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
              rafPending = false;
              if (!ghost) return;
              ghost.style.left = moveEv.clientX - 100 + 'px';
              ghost.style.top = moveEv.clientY - 40 + 'px';
              
              // Highlight potential drop zones
              const target = document.elementFromPoint(moveEv.clientX, moveEv.clientY);
              const col = target?.closest('.kanban-column');
              document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('bg-brand/5'));
              if (col) col.classList.add('bg-brand/5');
            });
          };
          
          card.onpointerup = (upEv) => {
            clearTimeout(dragTimeout);
            card.releasePointerCapture(upEv.pointerId);
            card.classList.remove('opacity-40', 'scale-95', 'rotate-1');
            if (ghost) ghost.remove();
            
            const target = document.elementFromPoint(upEv.clientX, upEv.clientY);
            const col = target?.closest('.kanban-column');
            document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('bg-brand/5'));
            
            if (col) {
              const newCol = col.dataset.column;
              if (task.col !== newCol) {
                task.col = newCol;
                renderTasks();
                saveToMetadata();
                if (window.dbUpdate && _pId) window.dbUpdate('tasks', task.id, { col: newCol });
                if (window.showToast) window.showToast(`Moved to ${newCol.toUpperCase()}`);
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

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if(el) el.textContent = counts[key];
    });
  }

  // --- Global Tooltips/Setup ---
  const globalAddBtn = document.getElementById('add-task-global-btn');
  if(globalAddBtn) {
    globalAddBtn.onclick = () => {
      const todoForm = document.getElementById('form-todo');
      if(todoForm) {
        todoForm.classList.remove('hidden');
        const input = document.getElementById('input-title-todo');
        if(input) input.focus();
      }
    };
  }

  const clearDoneBtn = document.getElementById('clear-done-btn');
  if(clearDoneBtn) {
    clearDoneBtn.onclick = async () => {
      if(confirm('Archive all completed tasks?')) {
        const doneTasks = window.globalKanbanTasks.filter(t => t.col === 'approved');
        window.globalKanbanTasks = window.globalKanbanTasks.filter(t => t.col !== 'approved');
        renderTasks();
        saveToMetadata();
        for(const t of doneTasks) {
          if(window.dbDelete && _pId) window.dbDelete('tasks', t.id);
        }
        if(window.showToast) window.showToast(`Cleared ${doneTasks.length} tasks.`);
      }
    };
  }

  document.querySelectorAll('.cancel-task-btn').forEach(btn => {
     btn.onclick = () => {
        const col = btn.dataset.col;
        document.getElementById(`form-${col}`).classList.add('hidden');
     };
  });

  document.querySelectorAll('.save-task-btn').forEach(btn => {
    btn.onclick = async () => {
      const col = btn.dataset.col;
      const input = document.getElementById(`input-title-${col}`);
      const title = input.value.trim();
      if(!title) return;

      const newTask = {
        id: crypto.randomUUID(),
        title,
        col,
        project_id: _pId,
        priority: 'Medium',
        tag: 'Task',
        created_at: new Date().toISOString()
      };

      window.globalKanbanTasks.push(newTask);
      renderTasks();
      saveToMetadata();
      if(window.dbInsert && _pId) window.dbInsert('tasks', newTask);
      
      document.getElementById(`form-${col}`).classList.add('hidden');
      input.value = '';
    };
  });

  renderTasks();
};

window.initKanban = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  // Hydrate from Project Data (Supabase JSONB) or fallback to Defaults
  window.globalKanbanTasks = project.data?.tasks || [
    { id: 't1', title: 'Gather typo motion references', tag: 'Research', col: 'todo', client: 'Acme Corp', attachments: 2, assignee: 'Me', priority: 'Medium', deadline: '2024-03-20' },
    { id: 't2', title: 'Approve initial moodboard direction', tag: 'Presentation', col: 'review', client: 'Globex', attachments: 0, assignee: 'Client', priority: 'High', deadline: '2024-03-10' },
    { id: 't3', title: 'Test rendering output', tag: 'QA', col: 'todo', client: 'Initech', attachments: 1, assignee: 'Me', priority: 'Low', deadline: '2024-03-25' }
  ];

  const saveKanbanState = () => {
    project.data = project.data || {};
    project.data.tasks = window.globalKanbanTasks;
    if(window.dbUpdate) window.dbUpdate('projects', projectId, { data: project.data });
  };
  
  const pushToHistory = (actionLabel, undoFn, redoFn) => {
    if(window.activeRole === 'client') return;
    if(window.activeHistory) window.activeHistory.push(actionLabel, 
        () => { undoFn(); saveKanbanState(); }, 
        () => { redoFn(); saveKanbanState(); }
    );
  };

  const cols = [
    { id: 'todo', title: 'To Do', color: 'gray-700', bg: 'gray-100', accent: 'gray-400' },
    { id: 'inprogress', title: 'In Progress', color: 'blue-600', bg: 'blue-50', accent: 'blue-400' },
    { id: 'review', title: 'Client Review', color: 'brand', bg: 'orange-50', accent: 'brand' },
    { id: 'revisions', title: 'Revisions', color: 'red-600', bg: 'red-50', accent: 'red-400' },
    { id: 'approved', title: 'Approved', color: 'green-600', bg: 'green-50', accent: 'green-400' }
  ];

  container.innerHTML = `
    <div class="view-container h-full">
      <header class="flex justify-between items-center mb-10">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">${project.title} Tracker</h1>
          <p class="text-gray-500 text-lg tracking-tight">Manage and track production milestones in real-time</p>
        </div>
        <div class="flex gap-4">
          <div class="flex -space-x-2 items-center mr-4">
             <img src="https://i.pravatar.cc/100?img=1" class="w-10 h-10 rounded-full border-2 border-white shadow-md">
             <img src="https://i.pravatar.cc/100?img=2" class="w-10 h-10 rounded-full border-2 border-white shadow-md">
             <div class="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-400">+3</div>
          </div>
          <button onclick="window.showWhatsAppModal('${projectId}', '${project.title.replace(/'/g, "\\'")}', '${project.client || ''}')" class="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3.5 px-6 rounded-2xl smooth-transition flex items-center gap-2 text-sm uppercase tracking-widest shadow-sm ${window.activeRole === 'client' ? 'hidden' : ''}">
            <svg class="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg> 
            Notify
          </button>
          <button id="add-task-global-btn" class="bg-brand hover:bg-brand/90 text-white font-bold py-3.5 px-8 rounded-2xl smooth-transition shadow-xl shadow-brand/20 flex items-center gap-3 text-sm uppercase tracking-widest">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            Add Task
          </button>
        </div>
      </header>
      <div class="flex-1 overflow-x-auto flex gap-8 pb-10 h-full" id="kanban-board">
        ${cols.map(c => `
          <div class="kanban-column w-80 bg-gray-100 rounded-[32px] flex flex-col border border-gray-200/50 h-full flex-shrink-0 relative transition-all duration-300" data-column="${c.id}">
           <div class="p-5 rounded-t-3xl border-b border-gray-200/50 font-bold text-gray-800 flex justify-between items-center bg-white/50 backdrop-blur-sm">
             <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-${c.accent}"></div>
                <span class="text-sm uppercase tracking-widest">${c.title}</span>
             </div>
             <span class="text-[10px] font-bold bg-white text-gray-400 px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm" id="count-${c.id}">0</span>
           </div>
           
           <div class="p-4 flex-1 overflow-y-auto space-y-4 kanban-dropzone relative min-h-[150px]"></div>
           
           <!-- Inline Form -->
           <div class="px-4 pb-4 hidden add-task-form" id="form-${c.id}">
             <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-xl flex flex-col gap-3 transform scale-95 transition-all">
               <input type="text" class="w-full text-sm font-bold p-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" placeholder="Task title..." id="input-title-${c.id}">
               <div class="flex gap-2">
                  <input type="text" class="flex-1 text-[10px] uppercase font-bold p-2 bg-gray-50 border border-gray-100 rounded-lg outline-none" placeholder="Tag..." id="input-tag-${c.id}">
                  <select class="flex-1 text-[10px] uppercase font-bold p-2 bg-gray-50 border border-gray-100 rounded-lg" id="input-pri-${c.id}">
                    <option>Low</option>
                    <option selected>Medium</option>
                    <option>High</option>
                  </select>
               </div>
               <input type="date" class="w-full text-[10px] font-bold p-2 bg-gray-50 border border-gray-100 rounded-lg" id="input-date-${c.id}">
               <div class="flex items-center gap-2 mt-2">
                 <button class="flex-1 bg-brand text-white text-[10px] font-bold py-2 rounded-xl uppercase tracking-widest save-task-btn" data-col="${c.id}">Save</button>
                 <button class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-bold py-2 rounded-xl uppercase tracking-widest cancel-task-btn" data-col="${c.id}">Cancel</button>
               </div>
             </div>
           </div>
           
           <div class="p-4 bg-transparent mt-auto">
             <button class="w-full py-3 hover:bg-white rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest smooth-transition flex items-center justify-center gap-2 trigger-add-btn group" data-col="${c.id}">
               <svg class="w-4 h-4 group-hover:text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
               Add Task
             </button>
           </div>
         </div>
       `).join('')}
    </div>
  `;

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const deadline = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today;
  }

  function renderTasks() {
    document.querySelectorAll('.kanban-dropzone').forEach(dz => dz.innerHTML = '');
    const counts = { todo: 0, inprogress: 0, review: 0, revisions: 0, approved: 0 };

    window.globalKanbanTasks.forEach((task, index) => {
      if (window.activeClient !== 'All' && task.client !== window.activeClient) return;
      
      const overdue = isOverdue(task.deadline) && task.col !== 'approved';
      let prioColor = 'bg-gray-400';
      if(task.priority === 'High') prioColor = 'bg-red-500';
      if(task.priority === 'Medium') prioColor = 'bg-yellow-400';

      const card = document.createElement('div');
      card.draggable = true;
      card.className = 'task-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 smooth-transition group relative';
      card.dataset.id = task.id;
      
      card.innerHTML = `
        <div class="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 z-20">
          <button title="Duplicate" class="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-brand shadow-sm" onclick="event.stopPropagation(); window.duplicateTask('${task.id}')"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
          <button title="Edit" class="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-brand shadow-sm" onclick="event.stopPropagation(); window.editTask('${task.id}')"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
          <button title="Delete" class="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 shadow-sm" onclick="event.stopPropagation(); window.deleteTask('${task.id}')"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
        </div>

        <div class="flex justify-between items-start mb-3">
          <span class="text-[9px] font-bold px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md uppercase tracking-wider border border-gray-100 shadow-sm">${task.tag}</span>
          ${window.activeClient === 'All' ? `<span class="text-[9px] font-bold text-brand uppercase tracking-widest">${task.client}</span>` : ''}
        </div>
        
        <h4 class="font-bold text-gray-800 text-sm mb-4 leading-snug group-hover:text-brand smooth-transition">${task.title}</h4>
        
        <div class="flex items-center gap-4 text-[10px] mb-4">
           <div class="flex items-center gap-1.5 font-bold ${overdue ? 'text-red-500' : 'text-gray-400'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              ${task.deadline || 'No Date'}
              ${overdue ? '<span class="bg-red-100 text-[8px] px-1 rounded ml-1 animate-pulse">OVERDUE</span>' : ''}
           </div>
           <div class="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-widest">
              <div class="w-1.5 h-1.5 rounded-full ${prioColor}"></div>
              ${task.priority}
           </div>
        </div>

        <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
               <div class="w-6 h-6 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center hover:text-brand cursor-pointer smooth-transition">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
               </div>
               <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">${task.attachments || 0}</span>
            </div>
            <div class="flex items-center gap-2">
               <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">${task.assignee}</span>
               <img src="https://i.pravatar.cc/100?u=${task.assignee}" class="w-6 h-6 rounded-full border border-white shadow-sm ring-1 ring-gray-100">
            </div>
        </div>
      `;
      
      const zone = document.querySelector(`[data-column="${task.col}"] .kanban-dropzone`);
      if(zone) {
        zone.appendChild(card);
        counts[task.col]++;
      }

      card.addEventListener('dragstart', (e) => {
        if(window.activeRole === 'client' && task.assignee !== 'Client') { e.preventDefault(); return; }
        card.classList.add('opacity-40', 'scale-95');
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => card.classList.remove('opacity-40', 'scale-95'));
    });

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`count-${key}`);
      if(el) el.textContent = counts[key];
    });
  }

  // Column Drop Events
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('bg-white/60', 'border-brand/40', 'shadow-2xl');
    });
    col.addEventListener('dragleave', () => {
      col.classList.remove('bg-white/60', 'border-brand/40', 'shadow-2xl');
    });
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('bg-white/60', 'border-brand/40', 'shadow-2xl');
      const id = e.dataTransfer.getData('text/plain');
      const newCol = col.dataset.column;
      const tIdx = window.globalKanbanTasks.findIndex(t => t.id === id);
      if(tIdx > -1) {
        if(window.globalKanbanTasks[tIdx].col !== newCol) {
            const prevState = JSON.stringify(window.globalKanbanTasks);
            window.globalKanbanTasks[tIdx].col = newCol;
            const nextState = JSON.stringify(window.globalKanbanTasks);
            pushToHistory('Move Task',
               () => { window.globalKanbanTasks = JSON.parse(prevState); renderTasks(); },
               () => { window.globalKanbanTasks = JSON.parse(nextState); renderTasks(); }
            );
            renderTasks();
            saveKanbanState();
            if(window.showToast) window.showToast(`Moved to ${newCol}`);
        }
      }
    });
  });

  window.deleteTask = (id) => {
    if(confirm('Delete this task?')) {
      const idx = window.globalKanbanTasks.findIndex(t => t.id === id);
      if(idx === -1) return;
      
      const copy = JSON.parse(JSON.stringify(window.globalKanbanTasks[idx]));
      if(window.appData && window.appData.trash) {
        window.appData.trash.push({ id: copy.id, type: 'Task', title: copy.title, deletedAt: new Date().toLocaleDateString(), project: copy.client || 'Kanban', data: copy });
        window.updateBadges();
      }

      const prevState = JSON.stringify(window.globalKanbanTasks);
      window.globalKanbanTasks.splice(idx, 1);
      const nextState = JSON.stringify(window.globalKanbanTasks);
      
      pushToHistory('Delete Task',
         () => { window.globalKanbanTasks = JSON.parse(prevState); renderTasks(); },
         () => { window.globalKanbanTasks = JSON.parse(nextState); renderTasks(); }
      );
      renderTasks();
      saveKanbanState();
    }
  };

  window.editTask = (id) => {
    const tIdx = window.globalKanbanTasks.findIndex(t => t.id === id);
    if(tIdx === -1) return;
    const t = window.globalKanbanTasks[tIdx];
    const newTitle = prompt('New title:', t.title);
    if(newTitle && newTitle !== t.title) {
      const prevState = JSON.stringify(window.globalKanbanTasks);
      window.globalKanbanTasks[tIdx].title = newTitle;
      const nextState = JSON.stringify(window.globalKanbanTasks);
      
      pushToHistory('Edit Task',
         () => { window.globalKanbanTasks = JSON.parse(prevState); renderTasks(); },
         () => { window.globalKanbanTasks = JSON.parse(nextState); renderTasks(); }
      );
      renderTasks();
      saveKanbanState();
    }
  };

  window.duplicateTask = (id) => {
    const tIdx = window.globalKanbanTasks.findIndex(t => t.id === id);
    if(tIdx === -1) return;
    const t = window.globalKanbanTasks[tIdx];
    
    const prevState = JSON.stringify(window.globalKanbanTasks);
    const n = JSON.parse(JSON.stringify(t));
    n.id = 't' + Date.now();
    n.title += " (Copy)";
    window.globalKanbanTasks.splice(tIdx + 1, 0, n);
    const nextState = JSON.stringify(window.globalKanbanTasks);
    
    pushToHistory('Duplicate Task',
       () => { window.globalKanbanTasks = JSON.parse(prevState); renderTasks(); },
       () => { window.globalKanbanTasks = JSON.parse(nextState); renderTasks(); }
    );
    renderTasks();
    saveKanbanState();
  };

  // Add Task Handlers
  const addGlobalBtn = document.getElementById('add-task-global-btn');
  if(addGlobalBtn) {
    addGlobalBtn.onclick = () => {
       const form = document.querySelector('.add-task-form[id="form-todo"]');
       form.classList.toggle('hidden');
       form.querySelector('input').focus();
    };
  }

  document.querySelectorAll('.trigger-add-btn').forEach(btn => {
    btn.onclick = () => {
       const form = document.getElementById(`form-${btn.dataset.col}`);
       form.classList.remove('hidden');
       form.querySelector('input').focus();
       btn.classList.add('hidden');
    };
  });

  document.querySelectorAll('.cancel-task-btn').forEach(btn => {
    btn.onclick = () => {
       const col = btn.dataset.col;
       document.getElementById(`form-${col}`).classList.add('hidden');
       document.querySelector(`.trigger-add-btn[data-col="${col}"]`).classList.remove('hidden');
    };
  });

  document.querySelectorAll('.save-task-btn').forEach(btn => {
    btn.onclick = () => {
      const col = btn.dataset.col;
      const title = document.getElementById(`input-title-${col}`).value.trim();
      if(!title) return;

      const newTask = {
        id: 't' + Date.now(),
        title,
        tag: document.getElementById(`input-tag-${col}`).value || 'Task',
        col,
        client: window.activeClient === 'All' ? 'Acme Corp' : window.activeClient,
        priority: document.getElementById(`input-pri-${col}`).value,
        deadline: document.getElementById(`input-date-${col}`).value,
        assignee: 'Me'
      };

      const prevState = JSON.stringify(window.globalKanbanTasks);
      window.globalKanbanTasks.push(newTask);
      const nextState = JSON.stringify(window.globalKanbanTasks);
      pushToHistory('Add Task',
         () => { window.globalKanbanTasks = JSON.parse(prevState); renderTasks(); },
         () => { window.globalKanbanTasks = JSON.parse(nextState); renderTasks(); }
      );
      
      renderTasks();
      saveKanbanState();
      document.getElementById(`form-${col}`).classList.add('hidden');
      document.querySelector(`.trigger-add-btn[data-col="${col}"]`).classList.remove('hidden');
      document.getElementById(`input-title-${col}`).value = '';
    };
  });

  renderTasks();
};

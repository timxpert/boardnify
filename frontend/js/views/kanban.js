window.initKanban = async function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;

  if (!project.data) project.data = {};
  if (!project.data.tasks) project.data.tasks = [];

  // Update Topbar for Kanban View
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-[#1A1035]">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <span class="font-bold text-lg tracking-tight text-[#1A1035]">Task Tracker</span>
        </div>
        <button class="p-2 text-[#1A1035]">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        </button>
     `;
  }

  const columns = ['To Do', 'In Progress', 'Done'];

  function renderColumn(status) {
    const tasks = project.data.tasks.filter(t => t.status === status || (!t.status && status === 'To Do'));
    return `
      <div class="shrink-0 w-[280px] flex flex-col h-full">
        <div class="flex items-center justify-between mb-4 px-2">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-[#1A1035]">${status}</h3>
            <span class="px-2 py-0.5 bg-[#E5E0FF] text-[#6B46FA] text-[10px] font-bold rounded-full">${tasks.length}</span>
          </div>
          <button onclick="window.showAddTaskModal('${status}')" class="p-1 text-[#6B46FA]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto space-y-4 px-2 pb-10">
          ${tasks.map(task => `
            <div class="bg-white p-5 rounded-[24px] border border-[#E5E0FF] shadow-sm active:scale-[0.98] transition-all cursor-pointer">
              <div class="flex items-center justify-between mb-3">
                <span class="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  task.priority === 'High' ? 'bg-[#FF4D4D]/10 text-[#FF4D4D]' : 
                  task.priority === 'Medium' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 
                  'bg-[#6B46FA]/10 text-[#6B46FA]'
                }">${task.priority || 'Medium'}</span>
                <button onclick="event.stopPropagation(); window.deleteTask('${task.id}')" class="text-gray-300 hover:text-red-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <h4 class="text-[15px] font-bold text-[#1A1035] mb-4">${task.title}</h4>
              <div class="flex items-center justify-between pt-4 border-t border-[#F5F4FF]">
                <div class="flex -space-x-2">
                  <div class="w-6 h-6 rounded-full bg-[#E5E0FF] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#6B46FA]">${task.user ? task.user[0] : 'U'}</div>
                </div>
                <div class="flex items-center gap-1.5 text-gray-400">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                   <span class="text-[10px] font-bold">0</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="view-container h-full flex flex-col bg-[#F5F4FF] overflow-hidden">
      <div class="flex-1 flex gap-4 overflow-x-auto px-6 py-6 no-scrollbar">
        ${columns.map(renderColumn).join('')}
      </div>
      
      <!-- FAB -->
      <button onclick="window.showAddTaskModal('To Do')" class="fixed bottom-24 right-6 w-14 h-14 bg-[#6B46FA] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 z-50 active:scale-95 transition-transform">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
      </button>
    </div>
  `;

  window.showAddTaskModal = function(initialStatus = 'To Do') {
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const sheet = document.getElementById('m-bottom-sheet');
    const content = document.getElementById('m-bottom-sheet-content');

    content.innerHTML = `
      <div class="space-y-6 pb-10">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-[#1A1035]">New Task</h2>
          <button onclick="window.closeBottomSheet()" class="p-2 text-gray-400">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Task Title</label>
            <input id="task-title-input" type="text" placeholder="e.g. Design homepage" class="w-full h-14 px-5 rounded-2xl bg-white border border-[#E5E0FF] outline-none font-medium text-sm focus:border-[#6B46FA] transition-all">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Priority</label>
              <select id="task-priority-input" class="w-full h-14 px-5 rounded-2xl bg-white border border-[#E5E0FF] outline-none font-bold text-[10px] uppercase tracking-widest">
                <option>Low</option>
                <option selected>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 uppercase mb-2">Status</label>
              <select id="task-status-input" class="w-full h-14 px-5 rounded-2xl bg-white border border-[#E5E0FF] outline-none font-bold text-[10px] uppercase tracking-widest">
                ${columns.map(c => `<option ${c === initialStatus ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        
        <button onclick="window.confirmAddTask()" class="w-full h-14 bg-[#6B46FA] text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-100 active:scale-[0.98] transition-all">Create Task</button>
      </div>
    `;

    overlay.classList.remove('hidden');
    sheet.classList.remove('translate-y-full');

    window.confirmAddTask = async function() {
      const title = document.getElementById('task-title-input').value.trim();
      const priority = document.getElementById('task-priority-input').value;
      const status = document.getElementById('task-status-input').value;

      if (title) {
        const newTask = {
          id: Date.now().toString(),
          title,
          priority,
          status,
          user: window.appData?.user?.email || 'Me',
          created_at: new Date().toISOString()
        };
        project.data.tasks.push(newTask);
        await saveKanban();
        window.closeBottomSheet();
        window.initKanban(container, socket, _projectId);
        if (window.showToast) window.showToast('Task created');
      }
    };
  };

  window.closeBottomSheet = function() {
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const sheet = document.getElementById('m-bottom-sheet');
    overlay.classList.add('hidden');
    sheet.classList.add('translate-y-full');
  };

  window.deleteTask = async function(taskId) {
    if (confirm('Delete this task?')) {
      project.data.tasks = project.data.tasks.filter(t => t.id !== taskId);
      await saveKanban();
      window.initKanban(container, socket, _projectId);
    }
  };

  async function saveKanban() {
    if (window.dbUpdate) {
      await window.dbUpdate('projects', _projectId, { tasks: project.data.tasks });
    }
  }
};

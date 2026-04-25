window.initKanban = async function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  if (!project) return;
  const _projectId = projectId || project?.id;

  // Ensure data structure exists
  if (!project.data) project.data = {};
  if (!project.data.tasks) project.data.tasks = [];

  // Override Topbar for Progress View (Image 5 style)
  const topbar = document.getElementById('m-topbar');
  if (topbar) {
     topbar.innerHTML = `
        <button onclick="window.navigate('dashboard')" class="p-2 text-gray-400 hover:text-[#1A1916] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="flex-1 flex justify-center">
           <span class="font-bold text-lg tracking-tight font-['Cabinet_Grotesk'] text-[#1A1916]">Technical Progress</span>
        </div>
        <button class="p-2 text-gray-400 hover:text-[#6B21FF] transition-colors">
           <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
        </button>
     `;
  }

  const currentTab = window._kanbanTab || 'In Progress';

  function renderTabs() {
     return `
        <div class="flex items-center gap-8 overflow-x-auto no-scrollbar px-6 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-50">
           ${['In Progress', 'Completed', 'Backlog'].map(t => `
              <button onclick="window.switchKanbanTab('${t}')" class="relative pb-2 text-[11px] font-black uppercase tracking-widest transition-colors ${currentTab === t ? 'text-[#6B21FF]' : 'text-gray-400 hover:text-gray-600'}">
                 ${t}
                 ${currentTab === t ? '<div class="absolute bottom-0 left-0 w-full h-1 bg-[#6B21FF] rounded-t-full animate-in slide-in-from-left-1/2"></div>' : ''}
              </button>
           `).join('')}
        </div>
     `;
  }

  function renderActivityFeed() {
     const tasks = project.data.tasks.filter(t => t.status === currentTab);

     if (tasks.length === 0) {
        return `
           <div class="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <div class="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
                 <svg class="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path></svg>
              </div>
              <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">No tasks in ${currentTab}</p>
           </div>
        `;
     }

     return tasks.map(task => `
        <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-premium mb-4 group active:scale-[0.98] transition-all">
           <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-2xl bg-[#F4F3FF] flex items-center justify-center text-[#6B21FF] font-black text-xs uppercase">
                    ${task.user ? task.user[0] : '?'}
                 </div>
                 <div>
                    <h4 class="font-bold text-[#1A1916] font-['Cabinet_Grotesk'] leading-tight">${task.title}</h4>
                    <div class="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">${task.user || 'Unassigned'}</div>
                 </div>
              </div>
              <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}">
                 ${task.priority || 'Normal'}
              </span>
           </div>
           <div class="flex items-center justify-between pt-4 border-t border-gray-50">
              <span class="text-[9px] font-black text-gray-300 uppercase tracking-widest">${task.time || 'recently'}</span>
              ${currentTab !== 'Completed' ? `
                 <button onclick="window.updateTaskStatus('${task.id}', 'Completed')" class="px-4 py-2 bg-[#F4F3FF] text-[#6B21FF] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#6B21FF] hover:text-white transition-all">MARK COMPLETED</button>
              ` : `
                 <button onclick="window.updateTaskStatus('${task.id}', 'In Progress')" class="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">REOPEN</button>
              `}
           </div>
        </div>
     `).join('');
  }

  container.innerHTML = `
    <div class="view-container animate-fade-in pb-32 bg-[#FDFCFB]">
       ${renderTabs()}
       <div class="p-6">
          <div class="mb-8">
             <h2 class="text-3xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']">Activity Feed</h2>
             <p class="text-[11px] font-medium text-gray-400 mt-1">Tracking ${project.data.tasks.length} tasks for ${project.title}.</p>
          </div>
          ${renderActivityFeed()}
       </div>

       <!-- FAB (Image 5 Style) -->
       <button id="add-task-global-btn" onclick="window.showAddTaskModal()" class="fixed bottom-28 right-6 w-16 h-16 bg-[#6B21FF] text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-purple-200 z-[100] active:scale-95 transition-transform">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
       </button>
    </div>
  `;

  window.switchKanbanTab = function(tab) {
     window._kanbanTab = tab;
     window.initKanban(container, socket, _projectId);
  };

  window.updateTaskStatus = async function(taskId, newStatus) {
     const task = project.data.tasks.find(t => t.id === taskId);
     if (task) {
        task.status = newStatus;
        if (newStatus === 'Completed') task.time = 'Just now';
        await saveKanban();
        window.initKanban(container, socket, _projectId);
        if (window.showToast) window.showToast(`Task ${newStatus.toLowerCase()}`);
     }
  };

  window.showAddTaskModal = function() {
     const overlay = document.getElementById('m-bottom-sheet-overlay');
     const sheet = document.getElementById('m-bottom-sheet');
     const content = document.getElementById('m-bottom-sheet-content');

     content.innerHTML = `
        <div class="space-y-6">
           <h2 class="text-2xl font-bold text-[#1A1916] font-['Cabinet_Grotesk']">New Task</h2>
           <input id="task-title-input" type="text" placeholder="What needs to be done?" class="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm">
           <div class="grid grid-cols-2 gap-4">
              <select id="task-priority-input" class="p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-[10px] uppercase tracking-widest">
                 <option>Normal</option>
                 <option>High</option>
                 <option>Low</option>
              </select>
              <select id="task-user-input" class="p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold text-[10px] uppercase tracking-widest">
                 <option>Me</option>
                 <option>Team</option>
              </select>
           </div>
           <button onclick="window.confirmAddTask()" class="w-full py-4 bg-[#6B21FF] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200">Add Task</button>
        </div>
     `;

     overlay.classList.remove('hidden');
     sheet.classList.remove('translate-y-full');

     window.confirmAddTask = async function() {
        const title = document.getElementById('task-title-input').value;
        const priority = document.getElementById('task-priority-input').value;
        const user = document.getElementById('task-user-input').value === 'Me' ? (window.appData?.user?.email || 'Me') : 'Team';

        if (title) {
           const newTask = {
              id: Date.now().toString(),
              title,
              priority,
              user,
              status: 'In Progress',
              time: 'Just now'
           };
           project.data.tasks.push(newTask);
           await saveKanban();
           overlay.classList.add('hidden');
           sheet.classList.add('translate-y-full');
           window.initKanban(container, socket, _projectId);
           if (window.showToast) window.showToast('Task added');
        }
     };
  };

  async function saveKanban() {
     if (window.dbUpdate) {
        await window.dbUpdate('projects', _projectId, { tasks: project.data.tasks });
     }
  }
};

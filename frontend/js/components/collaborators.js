// frontend/js/components/collaborators.js

window.initCollaborators = function(containerId, projectId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const users = [
    { name: 'You', img: 'https://i.pravatar.cc/100?img=33', status: 'online', role: 'Designer' },
    { name: 'Sarah', img: 'https://i.pravatar.cc/100?img=12', status: 'online', role: 'Client' },
    { name: 'John', img: 'https://i.pravatar.cc/100?img=11', status: 'offline', role: 'Team' }
  ];

  function render() {
    container.innerHTML = users.map(user => `
      <div class="relative group cursor-pointer hover:scale-110 smooth-transition">
        <img class="w-8 h-8 rounded-full border-2 border-white shadow-sm ${user.status === 'offline' ? 'grayscale opacity-50' : ''}" 
             src="${user.img}" 
             alt="${user.name}"
             title="${user.name} (${user.role})">
        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'} border border-white rounded-full"></span>
        
        <!-- Hover Tooltip -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none smooth-transition whitespace-nowrap z-[100]">
          ${user.name} • ${user.role}
          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    `).join('') + `
      <button onclick="if(window.openInviteModal) window.openInviteModal()" class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 smooth-transition" title="Invite Others">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
    `;
  }

  render();

  // Socket listener for presence
  if (window.socket) {
    window.socket.on('user-joined', (user) => {
      if (!users.find(u => u.name === user.name)) {
        users.push({ ...user, status: 'online' });
        render();
        if(window.showToast) window.showToast(`${user.name} joined the project!`, 'info');
      }
    });

    window.socket.on('user-left', (userName) => {
      const user = users.find(u => u.name === userName);
      if (user) {
        user.status = 'offline';
        render();
      }
    });
  }
};

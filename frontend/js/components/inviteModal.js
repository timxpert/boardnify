// frontend/js/components/inviteModal.js

window.renderInviteModal = function(container) {
  // Check if it already exists to prevent duplicates
  if (document.getElementById('invite-modal-container')) return;

  const modalHtml = `
    <!-- Global Invite Modal -->
    <div id="invite-modal-container" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center hidden opacity-0 smooth-transition">
      <div class="bg-white rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden transform scale-95 smooth-transition relative" id="invite-modal-content">
        
        <button id="close-invite-modal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 smooth-transition z-10">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div class="px-10 pt-10 pb-8 border-b border-gray-100">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Share Project</h2>
          <p class="text-gray-500 text-lg">Invite clients or team members to collaborate on this project.</p>
        </div>
        
        <div class="p-8 bg-gray-50 flex-1 flex flex-col gap-6">
          
          <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative focus-within:ring-2 focus-within:ring-brand focus-within:border-brand smooth-transition">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invite via Email</label>
            <div class="flex flex-col gap-3">
              <input type="email" id="invite-email-input" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:bg-white" placeholder="colleague@acmecorp.com">
              
              <div class="flex gap-2">
                <select id="invite-role-select" class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:bg-white text-gray-700">
                  <option value="designer">Designer Team Member (Full Access)</option>
                  <option value="client" selected>Client (Review & Comment)</option>
                  <option value="client_team">Client Team Member (Review & Comment)</option>
                </select>
                <button id="send-invite-btn" class="bg-brand hover:bg-brand/90 text-white font-bold px-8 py-3.5 rounded-2xl shadow-xl shadow-brand/20 smooth-transition text-sm whitespace-nowrap uppercase tracking-widest">
                  Send Invite
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
              Active Collaborators
              <span class="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full" id="collab-count">2</span>
            </h3>
            
            <div class="flex flex-col gap-2" id="collaborators-list">
              <!-- Owner -->
              <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <img src="https://i.pravatar.cc/100?img=33" class="w-10 h-10 rounded-full border border-gray-200" alt="Avatar">
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-800">You (Designer)</h4>
                    <p class="text-xs text-gray-400">Owner</p>
                  </div>
                </div>
              </div>

              <!-- Existing Client -->
              <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm" id="collab-client">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold border border-gray-200 shadow-sm">C</div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 border-2 border-white rounded-full" title="Offline"></span>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-gray-800">Acme Client</h4>
                    <p class="text-xs text-brand font-medium">Client Role</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <select class="text-xs bg-gray-50 border border-gray-200 rounded p-1 text-gray-600 outline-none focus:border-brand" onchange="window.showToast('Role updated successfully')">
                    <option value="client" selected>Client</option>
                    <option value="designer">Designer</option>
                  </select>
                  <button class="text-gray-400 hover:text-red-500 p-1 smooth-transition" title="Remove User" onclick="
                    if(confirm('Remove Acme Client from this project?')) {
                      document.getElementById('collab-client').remove();
                      document.getElementById('collab-count').textContent = '1';
                      if(window.showToast) window.showToast('User removed');
                    }
                  ">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        <div class="px-10 py-6 border-t border-gray-100 bg-white flex justify-between items-center">
          <button class="text-sm font-black text-brand hover:text-brand-dark flex items-center gap-2 uppercase tracking-widest" onclick="navigator.clipboard.writeText(window.location.href); window.showToast('Project link copied!');">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            Copy Link
          </button>
          <button id="done-invite-modal" class="bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-10 rounded-2xl smooth-transition shadow-xl shadow-gray-900/10 text-sm uppercase tracking-widest">
            Done
          </button>
        </div>

      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', modalHtml);

  // Logic Setup
  const modal = document.getElementById('invite-modal-container');
  const modalContent = document.getElementById('invite-modal-content');
  const closeBtn = document.getElementById('close-invite-modal');
  const doneBtn = document.getElementById('done-invite-modal');
  const sendBtn = document.getElementById('send-invite-btn');
  const emailInput = document.getElementById('invite-email-input');
  const roleSelect = document.getElementById('invite-role-select');
  const list = document.getElementById('collaborators-list');
  const count = document.getElementById('collab-count');

  window.openInviteModal = function() {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modalContent.classList.remove('scale-95');
    }, 10);
  };

  const close = () => {
    modal.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
  };

  closeBtn.addEventListener('click', close);
  doneBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  sendBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      if(window.showToast) window.showToast('Please enter a valid email address.');
      emailInput.classList.add('border-red-500', 'ring-1', 'ring-red-500');
      setTimeout(() => emailInput.classList.remove('border-red-500', 'ring-1', 'ring-red-500'), 2000);
      return;
    }

    const roleRaw = roleSelect.value;
    let roleLabel = 'Client Role';
    let avatarChar = 'C';
    let gradient = 'from-green-400 to-green-600';

    if (roleRaw === 'designer') {
      roleLabel = 'Designer Role';
      avatarChar = 'D';
      gradient = 'from-blue-400 to-blue-600';
    } else if (roleRaw === 'client_team') {
      roleLabel = 'Client Team';
      avatarChar = 'T';
      gradient = 'from-purple-400 to-purple-600';
    }

    const newId = 'collab-' + Date.now();
    const newHtml = '<div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm opacity-0 transform translate-y-2 transition-all duration-300" id="' + newId + '">' +
        '<div class="flex items-center gap-3">' +
          '<div class="relative">' +
            '<div class="w-10 h-10 rounded-full bg-gradient-to-br ' + gradient + ' flex items-center justify-center text-white font-bold border border-gray-200 shadow-sm">' + avatarChar + '</div>' +
            '<span class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" title="Online (Pending Verify)"></span>' +
          '</div>' +
          '<div>' +
            '<h4 class="text-sm font-bold text-gray-800 truncate w-32">' + email + '</h4>' +
            '<p class="text-xs text-brand font-medium">' + roleLabel + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<select class="text-xs bg-gray-50 border border-gray-200 rounded p-1 text-gray-600 outline-none focus:border-brand" onchange="window.showToast(\'Role updated successfully\')">' +
            '<option value="client" ' + (roleRaw==='client'?'selected':'') + '>Client</option>' +
            '<option value="client_team" ' + (roleRaw==='client_team'?'selected':'') + '>Client Team</option>' +
            '<option value="designer" ' + (roleRaw==='designer'?'selected':'') + '>Designer</option>' +
          '</select>' +
          '<button class="text-gray-400 hover:text-red-500 p-1 smooth-transition" title="Remove User" onclick="' +
            'if(confirm(\'Remove this user from the project?\')) {' +
              'document.getElementById(\'' + newId + '\').remove();' +
              'document.getElementById(\'collab-count\').textContent = parseInt(document.getElementById(\'collab-count\').textContent) - 1;' +
              'if(window.showToast) window.showToast(\'User removed\');' +
            '}' +
          '">' +
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    list.insertAdjacentHTML('beforeend', newHtml);
    count.textContent = parseInt(count.textContent) + 1;
    
    // Animate in
    setTimeout(() => {
      const el = document.getElementById(newId);
      if(el) {
        el.classList.remove('opacity-0', 'translate-y-2');
      }
    }, 50);

    emailInput.value = '';
    
    // Trigger notification
    if(window.triggerNotification) {
      window.triggerNotification('invite', { email, role: roleLabel });
    } else if (window.showToast) {
      window.showToast(`Invitation sent to ${email}`);
    }

  });
};

window.initScript = function(container, socket, projectId) {
  const project = window.appData.projects.find(p => p.id === projectId) || window.appData.projects[0];
  // Base State for Script Feature
  const scriptState = {
    content: '', // Replaced blocks with single HTML string
    status: 'Draft',
    isClient: window.activeRole === 'client',
    historyStates: [] // for Version History
  };

  const saveSnapshot = () => {
    scriptState.historyStates.push({ time: new Date().toLocaleTimeString(), text: scriptState.content });
    saveState();
  };

  // ─── LOCAL STORAGE HANDLERS ────────────────────────────────────────────────
  const storageKey = `boardnify_script_${projectId || 'default'}`;
  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scriptState));
    } catch(e) {
      console.error('Failed to save script state', e);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        Object.assign(scriptState, JSON.parse(saved));
      }
    } catch(e) {
      console.error('Failed to load script state', e);
    }
  }

  loadState();

  // ─── STREAMING API HELPER ──────────────────────────────────────────────────
  async function streamBackendRoute(url, bodyData, onChunk, onDone, onError) {
    const fullUrl = url.startsWith('http') ? url : (window.BASE_URL || 'http://localhost:3000').replace(/\/$/, '') + '/' + url.replace(/^\//, '');
    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(bodyData)
          });
          
          if (!response.ok) {
             const errText = await response.text();
             let errorMsg = 'Error occurred from server.';
             try {
                const errJson = JSON.parse(errText);
                if (errJson.error) errorMsg = errJson.error;
             } catch(e) {
                errorMsg = errText;
             }
             console.error('API Error:', errorMsg);
             if (onError) onError(errorMsg);
             return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let buffer = "";

          while (!done) {
              const { value, done: doneReading } = await reader.read();
              done = doneReading;
              if (value) {
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop(); // keep last incomplete line
                  
                  for (let line of lines) {
                      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                          try {
                              const data = JSON.parse(line.substring(6));
                              if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
                                  onChunk(data.delta.text);
                              }
                          } catch(e) {}
                      }
                  }
              }
          }
          if (onDone) onDone();
      } catch(err) {
          console.error('Streaming error', err);
          if (onError) onError(err.message || 'Streaming error occurred.');
      }
  }

  // ─── RENDERERS ─────────────────────────────────────────────────────────────

  function renderTopBar() {
    return `
      <div class="h-16 px-8 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-20 flex-shrink-0">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-bold text-gray-800">Script Collaboration</h2>
          <span class="px-3 py-1 bg-${scriptState.status === 'Approved' ? 'green' : 'orange'}-100 text-${scriptState.status === 'Approved' ? 'green' : 'orange'}-700 text-xs font-bold rounded-full uppercase tracking-widest">${scriptState.status}</span>
        </div>
        <div class="flex items-center gap-3">
          ${scriptState.isClient ? `
            <button id="btn-request-changes" class="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 smooth-transition">Request Changes</button>
            <button id="btn-approve-script" class="px-5 py-2 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-md shadow-green-500/20 smooth-transition">Approve Script</button>
          ` : `
            <button onclick="window.showWhatsAppModal('${projectId}', '${project.title.replace(/'/g, "\\'")}', '${project.client || ''}')" class="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold px-5 py-2 rounded-xl smooth-transition flex items-center gap-2 text-sm shadow-sm ${window.activeRole === 'client' ? 'hidden' : ''}">
              <svg class="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.646.685 5.148 1.956 7.394L.548 24l4.72-1.414A11.966 11.966 0 0012.031 24c6.646 0 12.031-5.385 12.031-12.032C24.062 5.385 18.677 0 12.031 0zm0 22.012c-2.217 0-4.341-.58-6.22-1.68l-.446-.265-3.513 1.053 1.074-3.418-.29-.462A9.973 9.973 0 012.019 12.03c0-5.526 4.493-10.02 10.012-10.02 5.52 0 10.012 4.494 10.012 10.02 0 5.526-4.492 10.02-10.012 10.02zm5.503-7.525c-.302-.151-1.789-.884-2.065-.986-.276-.102-.478-.151-.679.151-.201.302-.78 .986-.956 1.188-.176.202-.352.227-.654.076-.302-.151-1.277-.47-2.433-1.498-.901-.801-1.508-1.79-1.684-2.092-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.302.302-.503.1-.202.05-.378-.025-.529-.076-.151-.68-1.638-.931-2.242-.244-.589-.492-.51-.68-.519-.175-.01-.377-.01-.578-.01-.201 0-.528.075-.806.377-.276.302-1.056 1.033-1.056 2.518s1.082 2.919 1.233 3.12c.151.201 2.126 3.245 5.148 4.549.719.31 1.28.495 1.719.633.722.228 1.38.196 1.898.119.58-.086 1.789-.731 2.04-1.437.252-.707.252-1.31.177-1.437-.076-.127-.277-.202-.579-.353z"/></svg> 
              Notify Client
            </button>
            <button class="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2 smooth-transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
              Share with Client
            </button>
            <button id="btn-request-approval" class="px-5 py-2 rounded-xl bg-brand text-white font-bold hover:bg-brand/90 shadow-md shadow-brand/20 smooth-transition">Request Approval</button>
          `}
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <div class="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Start your Script</h3>
        <p class="text-gray-500 mb-8 max-w-md text-center">Upload a document (.txt, .docx, .pdf) or write your script from scratch. Your client can review and leave notes.</p>
        <div class="flex gap-4">
          <input type="file" id="script-upload-input" accept=".txt,.pdf,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf" class="hidden" />
          <button id="btn-upload-script" class="px-6 py-3 bg-white border border-gray-200 text-gray-800 font-bold rounded-xl hover:shadow-md smooth-transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Upload Script
          </button>
          <button id="btn-write-script" class="px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 shadow-lg shadow-brand/20 smooth-transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            Write Script
          </button>
          
          <button id="btn-ai-generate-open" class="px-6 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 hover:border-indigo-200 smooth-transition flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Generate with AI
          </button>
        </div>
      </div>
    `;
  }

  function renderEditor() {
    return `
      <div class="flex-1 flex overflow-hidden">
        <!-- Main Script Area -->
        <div class="flex-1 flex flex-col bg-white overflow-hidden">
          <!-- Inner Editor Toolbar -->
          <div class="h-12 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center px-6 gap-2 flex-shrink-0 relative z-10">
             
             <!-- Formatting Tools -->
             <div class="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                <button type="button" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn font-serif font-bold text-sm" title="Bold (Ctrl+B)" onclick="document.execCommand('bold',false,null)">B</button>
                <button type="button" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn font-serif italic text-sm" title="Italic (Ctrl+I)" onclick="document.execCommand('italic',false,null)">I</button>
                <button type="button" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn font-bold text-xs uppercase tracking-widest px-2" title="Scene Heading" onclick="document.execCommand('formatBlock',false,'H3')">SCENE</button>
             </div>

             <button id="btn-editor-save" class="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn" title="Save Draft"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg></button>
             <button id="btn-editor-pdf" class="p-1.5 justify-center flex items-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn" title="Export PDF"><b class="text-[10px] uppercase font-black">PDF</b></button>
             <button id="btn-editor-history" class="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn" title="Version History" onclick="document.getElementById('version-panel').classList.toggle('hidden')"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
             <button id="btn-editor-dup" class="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg smooth-transition editor-action-btn" title="Duplicate"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
             <div class="w-px h-4 bg-gray-300 mx-1"></div>
             <button id="btn-editor-del" class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg smooth-transition editor-action-btn" title="Delete Script"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
             
             <div class="ml-auto flex items-center gap-2">
                <span id="save-indicator" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded mr-2">All changes saved</span>
                <button id="btn-toggle-analyzer" class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-indigo-100 smooth-transition shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Test for Conversion</button>
                <button id="btn-ai-rewrite" class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-indigo-100 smooth-transition shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg> Rewrite for Conversion</button>
             </div>
          </div>

          <div class="flex-1 overflow-y-auto p-12 lg:p-20 relative scrollbar-hide flex gap-10" id="script-editor-container">
            <div class="max-w-3xl flex-1 mx-auto relative h-full">
              <!-- Version History Quick Panel -->
              <div id="version-panel" class="hidden absolute top-0 -right-72 bg-white shadow-xl border border-gray-100 rounded-xl p-4 w-64 z-20">
                <h4 class="text-xs font-bold tracking-widest text-gray-400 uppercase border-b border-gray-50 pb-2 mb-2">Version History</h4>
                <div class="space-y-2 max-h-60 overflow-y-auto" id="version-list">
                  ${scriptState.historyStates.map((st, i) => `<div class="text-sm font-medium p-2 hover:bg-gray-50 rounded cursor-pointer flex justify-between group" onclick="window.restoreScript(${i})"><span>${st.time}</span><span class="text-brand opacity-0 group-hover:opacity-100 text-xs font-bold">Restore</span></div>`).join('')}
                </div>
              </div>

              <!-- Full Rich Text Canvas -->
              <style>
                 #script-content:empty:before { content: attr(placeholder); color: #9ca3af; pointer-events: none; display: block; }
                 #script-content h3 { font-weight: 900; text-transform: uppercase; font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; letter-spacing: 0.05em; color: #111827; }
                 #script-content p { margin-bottom: 1rem; }
              </style>
              <div id="script-content" class="w-full h-full min-h-[500px] text-lg leading-relaxed text-gray-800 outline-none font-medium" ${!scriptState.isClient ? 'contenteditable="true"' : ''} placeholder="Start writing your script here...">${scriptState.content}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSidebarContent() {
    if (!scriptState.activeBlockId) {
      return `
        <div class="p-6 border-b border-gray-200 bg-white shadow-sm z-10">
          <h3 class="font-bold text-gray-900 text-lg">Feedback & Comments</h3>
          <p class="text-sm text-gray-500">Select a paragraph to view or leave notes.</p>
        </div>
        <div class="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
          <svg class="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          <p class="font-medium">Click on any paragraph<br>to start commenting.</p>
        </div>
      `;
    }

    const blockComments = scriptState.comments.filter(c => c.blockId === scriptState.activeBlockId);
    
    return `
      <div class="p-6 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-gray-900 text-lg">Thread</h3>
          <p class="text-sm text-gray-500">Comments on selected block</p>
        </div>
        <button id="btn-close-sidebar" class="text-gray-400 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 smooth-transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6" id="comments-list">
        ${blockComments.length === 0 ? `
          <div class="flex-1 flex flex-col items-center justify-center text-center opacity-50 h-full">
            <p class="font-medium">No comments here yet.<br>Start the conversation below.</p>
          </div>
        ` : blockComments.map(c => `
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div class="flex justify-between items-start mb-2">
              <span class="font-bold text-sm text-gray-900">${c.user}</span>
              <span class="text-xs text-gray-400">${c.date}</span>
            </div>
            ${c.text ? `<p class="text-gray-700 text-sm leading-relaxed">${c.text}</p>` : ''}
            ${c.audioData ? `
              <div class="mt-3 bg-gray-50 rounded-lg p-2 flex items-center gap-3 border border-gray-100">
                <button class="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 hover:bg-brand/90 smooth-transition" onclick="const a = new Audio('${c.audioData}'); a.play();">
                  <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="w-1/3 h-full bg-brand"></div>
                </div>
                <span class="text-xs font-bold text-gray-500">Voice Note</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="p-4 border-t border-gray-200 bg-white">
        ${scriptState.isRecording ? `
          <div class="px-4 py-6 flex flex-col items-center justify-center bg-red-50 rounded-xl border border-red-100 mb-3 animate-pulse">
            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 mb-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </div>
            <p class="font-bold text-red-600 text-sm">Recording in progress...</p>
            <p class="text-xs text-red-400 mt-1">Speak clearly into your microphone</p>
          </div>
          <button id="btn-stop-record" class="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 smooth-transition flex items-center justify-center gap-2">
            <div class="w-3 h-3 bg-white rounded-sm"></div>
            Stop & Save Voice Note
          </button>
        ` : `
          <textarea id="comment-input" class="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-brand focus:border-brand outline-none resize-none mb-3 smooth-transition" rows="3" placeholder="Write a comment..."></textarea>
          <div class="flex justify-between items-center">
            <button id="btn-record-voice" class="p-2 text-gray-400 hover:text-brand hover:bg-orange-50 rounded-lg smooth-transition" title="Record Voice Note">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
            <button id="btn-post-comment" class="px-5 py-2 bg-gray-900 text-white font-bold rounded-lg text-sm hover:bg-gray-800 smooth-transition">Post</button>
          </div>
        `}
      </div>
    `;
  }

  function render() {
    container.innerHTML = `
      <div class="flex flex-col h-full w-full bg-white relative overflow-hidden">
        ${renderTopBar()}
        ${!scriptState.content ? renderEmptyState() : renderEditor()}
      </div>
    `;
    attachEvents();
  }

  // ─── EVENT HANDLERS ────────────────────────────────────────────────────────

  function attachEvents() {
    function showComingSoonModal() {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in';
      modal.innerHTML = `
        <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center animate-slide-up">
          <div class="w-16 h-16 bg-orange-50 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p class="text-gray-500 mb-8">This AI feature is coming soon, seat tight.</p>
          <button onclick="this.closest('.fixed').remove()" class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl smooth-transition">Close</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const aiGenOpenBtn = document.getElementById('btn-ai-generate-open');
    const analyzerBtn = document.getElementById('btn-toggle-analyzer');
    const rewriteBtn = document.getElementById('btn-ai-rewrite');

    if (aiGenOpenBtn) aiGenOpenBtn.onclick = showComingSoonModal;
    if (analyzerBtn) analyzerBtn.onclick = showComingSoonModal;
    if (rewriteBtn) rewriteBtn.onclick = showComingSoonModal;

    if (uploadBtn) {
      uploadBtn.onclick = () => uploadInput.click();
    }
    
    if (uploadInput) {
      uploadInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Mock robust parsing logic handling different extensions, resolving ultimately to text
        const reader = new FileReader();
        reader.onload = (evt) => {
          let text = evt.target.result;
          
          if(file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
             // Mock heuristic binary extraction fallback to show it's "processing" formatted text
             text = `<p><i>(Extracted from ${file.name})</i></p><p>This is the simulated decoded text from your binary document.</p><p><b>Start editing to format it properly.</b></p>`;
          } else {
             // Safely map \n to <p>
             text = text.split(/\n\s*\n|\n/).filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('');
          }
          
          scriptState.content = text;
          saveSnapshot();
          scriptState.status = 'Draft';
          saveState();
          render();
          if(window.showToast) window.showToast('Script uploaded successfully!', 'success');
        };
        
        if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
            // Mocking a short delay for "binary parsing", then read dummy text
            setTimeout(() => {
                const blob = new Blob(["mock binary data"], {type: 'text/plain'});
                reader.readAsText(blob);
            }, 400);
        } else {
            reader.readAsText(file);
        }
      };
    }
    
    if (writeBtn) {
      writeBtn.onclick = () => {
        scriptState.content = '<p><br></p>';
        saveState();
        render();
        setTimeout(() => {
          const content = document.getElementById('script-content');
          if (content) content.focus();
        }, 50);
      };
    }

    // Editor Toolbar Actions
    const btnSave = document.getElementById('btn-editor-save');
    if(btnSave) btnSave.onclick = () => {
        saveSnapshot();
        const ind = document.getElementById('save-indicator');
        if(ind) {
           ind.textContent = 'Saving...';
           setTimeout(() => { ind.textContent = 'All changes saved'; }, 800);
        }
    };
    
    window.restoreScript = (index) => {
        if(confirm('Restore this version? Unsaved changes will be lost.')) {
           const st = scriptState.historyStates[index];
           if(st) {
              parseTextToBlocks(st.text);
              if(window.showToast) window.showToast('Version restored', 'info');
           }
        }
    };

    const btnPdf = document.getElementById('btn-editor-pdf');
    if(btnPdf) btnPdf.onclick = () => { if(window.showToast) window.showToast('Generating PDF...'); };

    const btnDup = document.getElementById('btn-editor-dup');
    if(btnDup) btnDup.onclick = () => { 
        saveSnapshot();
        if(window.showToast) window.showToast('Script Duplicated!'); 
    };
    
    const btnDel = document.getElementById('btn-editor-del');
    if(btnDel) btnDel.onclick = () => { 
        if(confirm('Delete script entirely?')) {
           scriptState.content = '';
           scriptState.historyStates = [];
           scriptState.status = 'Draft';
           saveState();
           render();
        }
    };

    const scriptContent = document.getElementById('script-content');
    if (scriptContent && !scriptState.isClient) {
      let saveTimeout;
      scriptContent.addEventListener('input', (e) => {
          scriptState.content = e.currentTarget.innerHTML;
          
          const ind = document.getElementById('save-indicator');
          if(ind) ind.textContent = 'Saving...';
          
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
             saveSnapshot();
             if(ind) ind.textContent = 'All changes saved';
          }, 1500);
      });
    }

    // Version Restore Method (overriding the global one inside attachEvents scope)
    window.restoreScript = (index) => {
        if(confirm('Restore this version? Unsaved changes will be lost.')) {
           const st = scriptState.historyStates[index];
           if(st) {
              scriptState.content = st.text;
              saveState();
              render();
              if(window.showToast) window.showToast('Version restored', 'info');
           }
        }
    };

    // Top bar actions
    const approveBtn = document.getElementById('btn-approve-script');
    if (approveBtn) {
      approveBtn.onclick = () => {
        scriptState.status = 'Approved';
        saveState();
        render();
        if (window.showToast) window.showToast('Script Approved!', 'success');
      };
    }

    const reqChangesBtn = document.getElementById('btn-request-changes');
    if (reqChangesBtn) {
      reqChangesBtn.onclick = () => {
        scriptState.status = 'Needs Revisions';
        saveState();
        render();
        if (window.showToast) window.showToast('Revisions Requested.', 'warning');
      };
    }

    const reqApprovalBtn = document.getElementById('btn-request-approval');
    if (reqApprovalBtn) {
      reqApprovalBtn.onclick = () => {
        scriptState.status = 'Pending Review';
        saveState();
        render();
        if (window.showToast) window.showToast('Sent to Client for review.', 'info');
      };
    }

    // Remove sidebar logic, comments, and parseTextToBlocks as RTE engine handles text internally
  }

  // Initial render
  render();
};

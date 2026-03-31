/**
 * Audio Recorder Utility
 * Wraps MediaRecorder and provides a unified UI for recording voice notes in comment boxes.
 */

window.initAudioRecorder = function(containerElement, onRecordComplete) {
  // Check if mic button already exists
  if(containerElement.querySelector('.voice-record-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'voice-record-btn text-gray-400 hover:text-brand bg-gray-50 hover:bg-brand/10 rounded-full p-2 smooth-transition flex-shrink-0';
  btn.title = "Record Voice Note";
  btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>`;

  // Create UI overlay for active recording
  const activeUI = document.createElement('div');
  activeUI.className = 'absolute inset-0 bg-white z-20 hidden flex items-center justify-between px-3 md:px-4 rounded-lg border border-red-500 shadow-sm w-full';
  activeUI.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
      <span class="text-red-500 font-bold text-sm" id="rec-time">0:00</span>
      <span class="text-gray-500 text-xs hidden md:inline font-medium">Recording voice note...</span>
    </div>
    <div class="flex items-center gap-2">
      <button class="text-gray-400 hover:text-red-500 p-1 smooth-transition" title="Cancel" id="rec-cancel">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
      <button class="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow shadow-red-500/30 smooth-transition" title="Stop & Use" id="rec-stop">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"></path></svg>
      </button>
    </div>
  `;

  // Attach elements
  // We attach activeUI to the closest wide parent wrapper to replace the whole input line.
  const parentRow = containerElement.closest('.relative.w-full') || containerElement.closest('div.flex.items-center') || containerElement.parentElement;
  
  // Make activeUI position relative/full to take over the layout
  activeUI.className = 'bg-white z-20 hidden flex items-center justify-between px-3 md:px-4 rounded-xl border border-red-500 shadow-sm w-full py-3 absolute inset-0';
  
  if (parentRow) {
     if(getComputedStyle(parentRow).position === 'static') parentRow.style.position = 'relative';
     parentRow.appendChild(activeUI);
  } else {
     containerElement.style.position = 'relative'; 
     containerElement.appendChild(activeUI);
  }
  containerElement.appendChild(btn);

  let mediaRecorder;
  let audioChunks = [];
  let timerInterval;
  let startTime;

  const timerEl = activeUI.querySelector('#rec-time');

  const stopRecording = (cancelled) => {
    if(mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(timerInterval);
    activeUI.classList.add('hidden');
    
    // Unhide siblings
    if(parentRow) {
      Array.from(parentRow.children).forEach(c => {
         if(c !== activeUI) {
            c.style.opacity = '1';
            c.style.pointerEvents = 'auto';
         }
      });
    }

    if(cancelled) {
      audioChunks = [];
      if(window.showToast) window.showToast('Voice note cancelled.');
    }
  };

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        if(event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if(audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          if(onRecordComplete) onRecordComplete(audioUrl);
        }
      };

      activeUI.classList.remove('hidden');
      
      // Hide siblings
      if(parentRow) {
        Array.from(parentRow.children).forEach(c => {
           if(c !== activeUI) {
              c.style.opacity = '0';
              c.style.pointerEvents = 'none';
           }
        });
      }

      startTime = Date.now();
      timerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }, 1000);

      mediaRecorder.start();
    } catch(err) {
      console.error(err);
      if(window.showToast) window.showToast('Microphone access denied or unavailable.');
    }
  });

  activeUI.querySelector('#rec-cancel').addEventListener('click', (e) => {
    e.preventDefault();
    stopRecording(true);
  });

  activeUI.querySelector('#rec-stop').addEventListener('click', (e) => {
    e.preventDefault();
    stopRecording(false);
  });
};

window.renderAudioPlayer = function(audioUrl, senderName, timeStr) {
  return `
    <div class="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-full p-1 pr-4 max-w-sm mt-2 shadow-sm group">
      <button class="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center flex-shrink-0 shadow hover:scale-105 smooth-transition" onclick="const a = this.nextElementSibling; if(a.paused){a.play();this.innerHTML='<svg class=\\'w-4 h-4\\' fill=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path d=\\'M6 4h4v16H6zm8 0h4v16h-4z\\'></path></svg>'}else{a.pause();this.innerHTML='<svg class=\\'w-4 h-4\\' fill=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path d=\\'M8 5v14l11-7z\\'></path></svg>'}">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
      </button>
      <audio src="${audioUrl}" class="hidden" onended="this.previousElementSibling.innerHTML='<svg class=\\'w-4 h-4\\' fill=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path d=\\'M8 5v14l11-7z\\'></path></svg>'"></audio>
      <div class="flex-1">
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden w-full relative">
          <!-- Mock waveform visualization -->
          <div class="absolute inset-0 bg-brand/30" style="width: 100%; mask-image: repeating-linear-gradient(to right, transparent, transparent 2px, black 3px, black 4px); -webkit-mask-image: repeating-linear-gradient(to right, transparent, transparent 2px, black 3px, black 4px);"></div>
        </div>
      </div>
      <div class="text-[10px] text-gray-400 font-medium whitespace-nowrap">Voice Note</div>
      
      <!-- Destroy Player Button -->
      <button class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 smooth-transition ml-2 p-1 focus:outline-none" title="Delete Audio" onclick="
          const p = this.closest('.flex.gap-3.p-3');
          if(p) {
             const audio = p.querySelector('audio');
             if(audio) URL.revokeObjectURL(audio.src);
             p.remove();
             if(window.showToast) window.showToast('Voice note deleted');
          }
      ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    </div>
  `;
};

// frontend/js/components/feedbackPanel.js

(function() {
  window.openFeedbackPanel = function(context = "Project") {
    const sheet = document.getElementById('m-bottom-sheet');
    const overlay = document.getElementById('m-bottom-sheet-overlay');
    const content = document.getElementById('m-bottom-sheet-content');

    if (!sheet || !content) return;

    const messages = [
      { user: 'Sarah Client', text: 'Love the direction of the script, but can we make the intro a bit punchier?', time: '10:24 AM', avatar: 'SC' },
      { user: 'You', text: 'Absolutely! I will revise the first paragraph to focus more on the "Aha!" moment.', time: '10:30 AM', avatar: 'ME' },
      { user: 'Sarah Client', text: 'Perfect. Also, let\'s make sure the color palette matches the brand guide exactly.', time: '11:15 AM', avatar: 'SC' }
    ];

    content.innerHTML = `
      <div class="animate-fade-in flex flex-col h-[70vh]">
        <!-- Header -->
        <div class="flex items-center justify-between pb-6 border-b border-border-light shrink-0">
          <div class="flex flex-col">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-[10px] font-black text-primary uppercase tracking-widest">Live Feedback Loop</span>
            </div>
            <h2 class="text-3xl font-black text-text-main font-['Cabinet_Grotesk']">${context} Discussion</h2>
          </div>
          <button onclick="window.closeBottomSheet()" class="w-12 h-12 bg-bg-soft rounded-2xl flex items-center justify-center text-text-muted hover:text-primary transition-all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </button>
        </div>

        <!-- Chat Thread -->
        <div class="flex-1 overflow-y-auto py-8 space-y-8 no-scrollbar" id="feedback-thread">
          ${messages.map(msg => `
            <div class="flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'} animate-slide-up">
              <div class="flex items-center gap-3 mb-2 px-1">
                ${msg.user !== 'You' ? `<div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[8px] uppercase">${msg.avatar}</div>` : ''}
                <span class="text-[10px] font-black text-text-muted uppercase tracking-widest">${msg.user}</span>
                <span class="text-[10px] font-bold text-gray-200">${msg.time}</span>
                ${msg.user === 'You' ? `<div class="w-6 h-6 rounded-lg bg-bg-soft flex items-center justify-center text-text-muted font-black text-[8px] uppercase">${msg.avatar}</div>` : ''}
              </div>
              <div class="max-w-[85%] px-6 py-4 rounded-[28px] ${msg.user === 'You' ? 'bg-primary text-white rounded-tr-none' : 'bg-bg-soft text-text-main rounded-tl-none'} font-medium text-sm leading-relaxed shadow-subtle border border-border-light/50">
                ${msg.text}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Input Area -->
        <div class="pt-6 border-t border-border-light shrink-0">
          <div class="flex gap-4 items-center">
            <button class="w-14 h-14 bg-bg-soft text-primary rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group">
              <svg class="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
            <div class="flex-1 relative">
              <input type="text" id="feedback-input" placeholder="Type your response..." 
                class="w-full pl-6 pr-14 py-4.5 bg-white border border-border-light rounded-[24px] shadow-subtle outline-none font-bold text-sm text-text-main focus:ring-4 focus:ring-primary/5 transition-all">
              <button class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg class="w-5 h-5 rotate-45 -mt-0.5 -mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-center gap-2 mt-4 opacity-40">
            <div class="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
            <span class="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">End-to-End Encrypted Discussion</span>
          </div>
        </div>
      </div>
    `;

    overlay.classList.remove('hidden');
    setTimeout(() => {
      sheet.classList.remove('translate-y-full');
      const thread = document.getElementById('feedback-thread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }, 10);
  };
})();

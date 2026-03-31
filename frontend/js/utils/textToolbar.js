/**
 * Floating Text Styling Toolbar (Vertical)
 */

window.TextToolbar = {
  activeTextElement: null,
  toolbarElement: null,

  init() {
    if (this.toolbarElement) return;

    this.toolbarElement = document.createElement('div');
    this.toolbarElement.id = 'text-formatting-toolbar';
    // Changed to flex-col and stacked layout matching exactly what the prompt requested
    this.toolbarElement.className = 'fixed z-[100] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex flex-col items-center gap-1 transition-all duration-300 opacity-0 pointer-events-none transform -translate-x-4 w-12';
    
    this.toolbarElement.addEventListener('mousedown', (e) => e.stopPropagation());

    const fonts = [
      { name: 'Plus Jakarta Sans', class: 'font-jakarta' },
      { name: 'Outfit', class: 'font-outfit' },
      { name: 'Manrope', class: 'font-manrope' },
      { name: 'DM Sans', class: 'font-dmsans' },
      { name: 'Epilogue', class: 'font-epilogue' },
      { name: 'Satoshi', class: 'font-satoshi' },
      { name: 'General Sans', class: 'font-generalsans' },
      { name: 'Cabinet Grotesk', class: 'font-cabinet' }
    ];

    const sizes = [
      { label: 'S', value: 'text-xs' },
      { label: 'N', value: 'text-base' },
      { label: 'L', value: 'text-xl' },
      { label: 'D', value: 'text-3xl' }
    ];

    let html = `
      <!-- Font Family -->
      <div class="relative group w-full flex justify-center">
        <button class="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-700" title="Change Font">
          F
        </button>
        <div class="absolute top-0 left-full ml-3 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl hidden group-hover:block py-2 z-[110]">
          ${fonts.map(f => `<button class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${f.class}" onclick="window.TextToolbar.applyClass('font', '${f.class}', '${f.name}')">${f.name}</button>`).join('')}
        </div>
      </div>
      
      <!-- Size -->
      <div class="relative group w-full flex justify-center">
        <button class="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-700 font-bold" title="Text Size">
          Aa
        </button>
        <div class="absolute top-0 left-full ml-3 w-16 bg-white border border-gray-100 rounded-xl shadow-2xl hidden group-hover:block py-2 z-[110]">
          ${sizes.map(s => `<button class="w-full text-center px-2 py-2 hover:bg-gray-50 text-sm font-bold" onclick="window.TextToolbar.applyClass('size', '${s.value}')">${s.label}</button>`).join('')}
        </div>
      </div>

      <div class="w-8 h-px bg-gray-100 mx-auto my-1"></div>

      <!-- Basic Styles -->
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center font-bold text-gray-700" onclick="window.TextToolbar.toggleStyle('font-bold')" title="Bold">B</button>
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center italic text-gray-700 font-serif" onclick="window.TextToolbar.toggleStyle('italic')" title="Italic">I</button>
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center underline text-gray-700" onclick="window.TextToolbar.toggleStyle('underline')" title="Underline">U</button>
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center line-through text-gray-700" onclick="window.TextToolbar.toggleStyle('line-through')" title="Strikethrough">S</button>
      
      <!-- Alignment -->
      <button class="w-10 h-10 hover:bg-gray-100 flex items-center justify-center text-gray-600 rounded-xl" onclick="window.TextToolbar.applyClass('align', 'text-left')" title="Align Left"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16"></path></svg></button>
      <button class="w-10 h-10 hover:bg-gray-100 flex items-center justify-center text-gray-600 rounded-xl" onclick="window.TextToolbar.applyClass('align', 'text-center')" title="Align Center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16"></path></svg></button>
      <button class="w-10 h-10 hover:bg-gray-100 flex items-center justify-center text-gray-600 rounded-xl" onclick="window.TextToolbar.applyClass('align', 'text-right')" title="Align Right"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16"></path></svg></button>

      <div class="w-8 h-px bg-gray-100 mx-auto my-1"></div>

      <!-- Colors -->
      <input type="color" id="tt-color-picker" class="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm overflow-hidden p-0 mb-1" title="Text Color" onchange="window.TextToolbar.applyColor(this.value)">
      <button class="w-8 h-8 rounded-full bg-yellow-300 border-2 border-white shadow-sm hover:scale-110 transition-transform mb-1" onclick="window.TextToolbar.applyBgColor('#FEF08A')" title="Highlight"></button>

      <div class="w-8 h-px bg-gray-100 mx-auto my-1"></div>

      <!-- Lists & Extras -->
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700" onclick="window.TextToolbar.toggleStyle('list-decimal list-inside')" title="Ordered List"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h14M7 12h14M7 18h14M4 6h.01M4 12h.01M4 18h.01"></path></svg></button>
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700" onclick="window.TextToolbar.toggleStyle('list-disc list-inside')" title="Unordered List"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
      <button class="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-700 font-bold" onclick="window.TextToolbar.toggleStyle('border-l-4 border-brand pl-4 bg-brand/5 italic')" title="Blockquote">"</button>
      
      <div class="w-8 h-px bg-gray-100 mx-auto my-1"></div>

      <!-- Clear -->
      <button class="w-10 h-10 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center" onclick="window.TextToolbar.clearFormatting()" title="Clear All Formatting">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;

    this.toolbarElement.innerHTML = html;
    document.body.appendChild(this.toolbarElement);

    document.addEventListener('mousedown', (e) => {
      if (this.activeTextElement && !this.activeTextElement.contains(e.target) && !this.toolbarElement.contains(e.target)) {
        this.hide();
      }
    });
  },

  show(element) {
    if (window.activeRole === 'client') return; 

    this.activeTextElement = element;
    const rect = element.getBoundingClientRect();

    let leftPos = rect.left - 60; 
    if(leftPos < 10) leftPos = rect.right + 10; 

    this.toolbarElement.style.left = leftPos + 'px';
    this.toolbarElement.style.top = Math.max(80, rect.top) + 'px'; 
    this.toolbarElement.classList.remove('opacity-0', 'pointer-events-none', '-translate-x-4');
  },

  hide() {
    if(!this.toolbarElement) return;
    this.toolbarElement.classList.add('opacity-0', 'pointer-events-none', '-translate-x-4');
    this.activeTextElement = null;
  },

  getTarget() {
    if(!this.activeTextElement) return null;
    return this.activeTextElement.querySelector('textarea') || this.activeTextElement.querySelector('[contenteditable]') || this.activeTextElement.querySelector('p') || this.activeTextElement;
  },

  applyClass(category, className, fontName = null) {
    const target = this.getTarget();
    if(!target) return;

    if (category === 'font') {
      const fonts = ['font-jakarta', 'font-outfit', 'font-manrope', 'font-dmsans', 'font-epilogue', 'font-satoshi', 'font-generalsans', 'font-cabinet', 'font-sans'];
      target.classList.remove(...fonts);
    } else if (category === 'size') {
      const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'];
      target.classList.remove(...sizes);
    } else if (category === 'align') {
      const aligns = ['text-left', 'text-center', 'text-right', 'text-justify'];
      target.classList.remove(...aligns);
    }

    target.classList.add(className);
    if(window.showToast) window.showToast(`Applied ${category}`);
  },

  toggleStyle(className) {
    const target = this.getTarget();
    if(!target) return;
    
    if(className.includes(' ')) {
      const classes = className.split(' ');
      let hasAll = classes.every(c => target.classList.contains(c));
      if(hasAll) target.classList.remove(...classes);
      else target.classList.add(...classes);
    } else {
      target.classList.toggle(className);
    }
  },

  clearFormatting() {
    const target = this.getTarget();
    if(!target) return;
    
    // Clear all manual styles
    target.className = target.tagName === 'TEXTAREA' ? 'w-full h-full p-2 text-sm border-none focus:ring-0 bg-transparent text-gray-800 font-medium resize-none shadow-inner rounded bg-gray-50' : '';
    target.style.color = '';
    target.style.backgroundColor = '';
    if(window.showToast) window.showToast('Formatting cleared');
  },

  applyColor(colorHex) {
    const target = this.getTarget();
    if(!target) return;
    target.style.color = colorHex;
  },

  applyBgColor(colorHex) {
    const target = this.getTarget();
    if(!target) return;
    target.style.backgroundColor = colorHex;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.TextToolbar.init();
});


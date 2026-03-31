const fs = require('fs');
const files = [
  'c:/Users/DELL/Documents/Vibe coding/boardnify/frontend/js/views/moodboard.js',
  'c:/Users/DELL/Documents/Vibe coding/boardnify/frontend/js/views/kanban.js',
  'c:/Users/DELL/Documents/Vibe coding/boardnify/frontend/js/views/library.js'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');
    fs.writeFileSync(f, content);
  }
});

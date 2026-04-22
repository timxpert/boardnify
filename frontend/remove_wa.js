const fs = require('fs');
const path = require('path');
const viewDir = 'js/views';
const files = fs.readdirSync(viewDir).filter(f => f.endsWith('.js')).map(f => path.join(viewDir, f));

const btnPattern = /\s*<button[^>]*?window\.showWhatsAppModal[\s\S]*?<\/button>/g;
const funcPattern = /\s*window\.showWhatsAppModal\s*=\s*async function[\s\S]*?};\s*/;

for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(btnPattern, '');
    if (file.endsWith('dashboard.js')) {
        newContent = newContent.replace(funcPattern, '');
    }
    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        console.log('Updated ' + file);
    }
}

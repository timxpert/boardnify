import re
import glob

# Remove button pattern
pattern = re.compile(r'\s*<button[^>]*?window\.showWhatsAppModal.*?<\/button>', re.DOTALL)

for fpath in glob.glob('js/views/*.js'):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = pattern.sub('', content)
    
    if fpath.endswith('dashboard.js'):
        # also remove the showWhatsAppModal function
        func_pattern = re.compile(r'\s*window\.showWhatsAppModal\s*=\s*async function[\s\S]*?};\s*(?=$|\n|//)', re.DOTALL)
        new_content = func_pattern.sub('', new_content)
        
    if content != new_content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {fpath}")


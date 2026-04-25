import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # HTML class replacements
    replacements = {
        'class="input-group"': 'class="asistec-form-group"',
        "class='input-group'": "class='asistec-form-group'",
        'class="form-group"': 'class="asistec-form-group"',
        "class='form-group'": "class='asistec-form-group'",
        'class="label-text"': 'class="asistec-label"',
        'class="form-label"': 'class="asistec-label"',
        'class="input-wrapper"': 'class="asistec-input-wrapper"',
        'class="input-icon"': 'class="asistec-input-icon"',
        'class="field-icon"': 'class="asistec-input-icon"',
        'class="custom-input"': 'class="asistec-input has-icon"',
        'class="input-field"': 'class="asistec-input has-icon"',
        'class="form-control"': 'class="asistec-input"',
    }
    
    # Also handle combinations where classes are mixed like class="input-field peer"
    # To be safe, we just do a string replacement on the exact substrings.
    # A regex approach is safer for classes inside quotes:
    import re
    
    def replacer(match):
        cls_str = match.group(1)
        # Split into individual classes
        classes = cls_str.split()
        new_classes = []
        for c in classes:
            if c == 'input-group' or c == 'form-group': new_classes.append('asistec-form-group')
            elif c == 'label-text' or c == 'form-label': new_classes.append('asistec-label')
            elif c == 'input-wrapper': new_classes.append('asistec-input-wrapper')
            elif c == 'input-icon' or c == 'field-icon': new_classes.append('asistec-input-icon')
            elif c == 'custom-input' or c == 'input-field': 
                new_classes.append('asistec-input')
                new_classes.append('has-icon')
            elif c == 'form-control': new_classes.append('asistec-input')
            else: new_classes.append(c)
        
        # Deduplicate while preserving order
        seen = set()
        final_classes = []
        for c in new_classes:
            if c not in seen:
                final_classes.append(c)
                seen.add(c)
                
        return 'class="' + ' '.join(final_classes) + '"'

    new_content = re.sub(r'class="([^"]+)"', replacer, content)
    new_content = re.sub(r"class='([^']+)'", replacer, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Process HTML files
base_dir = r"c:\Users\henri\OneDrive\Documentos\GitHub\Proyecto_Practica_Assistec\Frontend\src\app\pages"
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            replace_in_file(os.path.join(root, file))

print("Done HTML replacements.")

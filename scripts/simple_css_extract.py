import re
import os

def extract_unique_css_classes(js_file):
    """Extract unique CSS class names from JavaScript file"""
    if not os.path.exists(js_file):
        return set()
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple patterns for class names
    patterns = [
        r'\.className\s*=\s*[\'"]([^"\']+)[\'"]',
        r'\.classList\.(?:add|remove|toggle|contains)\([\'"]([^"\']+)[\'"]\)',
        r'class=[\'"]([^"\']+)[\'"]',
        r'<[^>]+class=[\'"]([^"\']*)[\'"]',
    ]
    
    classes = set()
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            # Split multiple classes and clean
            class_names = match.split()
            for cls in class_names:
                if cls and not cls.startswith('${') and cls.replace('-', '').replace('_', '').isalnum():
                    classes.add(cls)
    
    return classes

def extract_unique_css_ids(js_file):
    """Extract unique CSS ID names from JavaScript file"""
    if not os.path.exists(js_file):
        return set()
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    patterns = [
        r'getElementById\([\'"]([^"\']+)[\'"]\)',
        r'id=[\'"]([^"\']+)[\'"]',
        r'<[^>]+id=[\'"]([^"\']*)[\'"]',
    ]
    
    ids = set()
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if match and not match.startswith('${') and match.replace('-', '').replace('_', '').isalnum():
                ids.add(match)
    
    return ids

def extract_css_definitions(css_file):
    """Extract class and ID definitions from CSS file"""
    if not os.path.exists(css_file):
        return set(), set()
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments and clean content
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    classes = set()
    ids = set()
    
    # Find class definitions
    class_matches = re.findall(r'\.([a-zA-Z][\w-]*)', content)
    for cls in class_matches:
        classes.add(cls)
    
    # Find ID definitions  
    id_matches = re.findall(r'#([a-zA-Z][\w-]*)', content)
    for id_name in id_matches:
        ids.add(id_name)
    
    return classes, ids

if __name__ == "__main__":
    js_files = [
        "background-enhanced.js",
        "stealth-extractor.js", 
        "proxy-controller.js"
    ]
    
    css_files = []
    styles_dir = "styles"
    if os.path.exists(styles_dir):
        for file in os.listdir(styles_dir):
            if file.endswith('.css'):
                css_files.append(os.path.join(styles_dir, file))
    
    # Also check for CSS files in root
    for file in ["base.css", "matrix_theme_v2.css"]:
        if os.path.exists(file):
            css_files.append(file)
    
    print("=== UNIQUE CSS COMPONENTS ===\n")
    
    # Collect all unique classes and IDs from JS
    all_js_classes = set()
    all_js_ids = set()
    
    for js_file in js_files:
        if os.path.exists(js_file):
            classes = extract_unique_css_classes(js_file)
            ids = extract_unique_css_ids(js_file)
            all_js_classes.update(classes)
            all_js_ids.update(ids)
    
    # Collect all unique classes and IDs from CSS
    all_css_classes = set()
    all_css_ids = set()
    
    for css_file in css_files:
        classes, ids = extract_css_definitions(css_file)
        all_css_classes.update(classes)
        all_css_ids.update(ids)
    
    print("JAVASCRIPT REFERENCES:")
    print(f"Classes ({len(all_js_classes)}):")
    for cls in sorted(all_js_classes):
        print(f"  .{cls}")
    
    print(f"\nIDs ({len(all_js_ids)}):")
    for id_name in sorted(all_js_ids):
        print(f"  #{id_name}")
    
    print(f"\nCSS DEFINITIONS:")
    print(f"Classes ({len(all_css_classes)}):")
    for cls in sorted(all_css_classes):
        print(f"  .{cls}")
    
    print(f"\nIDs ({len(all_css_ids)}):")
    for id_name in sorted(all_css_ids):
        print(f"  #{id_name}")
    
    # Find missing references
    missing_classes = all_js_classes - all_css_classes
    missing_ids = all_js_ids - all_css_ids
    
    if missing_classes or missing_ids:
        print(f"\nMISSING IN CSS:")
        if missing_classes:
            print(f"Classes ({len(missing_classes)}):")
            for cls in sorted(missing_classes):
                print(f"  .{cls}")
        if missing_ids:
            print(f"IDs ({len(missing_ids)}):")
            for id_name in sorted(missing_ids):
                print(f"  #{id_name}")
    else:
        print(f"\nAll JavaScript references are defined in CSS!")
    
    print(f"\nSUMMARY:")
    print(f"- JS Classes: {len(all_js_classes)}")
    print(f"- JS IDs: {len(all_js_ids)}")
    print(f"- CSS Classes: {len(all_css_classes)}")
    print(f"- CSS IDs: {len(all_css_ids)}")
    print(f"- Missing Classes: {len(missing_classes)}")
    print(f"- Missing IDs: {len(missing_ids)}")
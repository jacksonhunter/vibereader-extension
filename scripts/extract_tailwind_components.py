import re
import os
import json

def extract_css_references_detailed(js_file):
    """Extract detailed CSS class names, IDs, and variable references with context"""
    
    if not os.path.exists(js_file):
        return {}
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    references = {
        'classes': [],
        'ids': [],
        'variables': [],
        'inline_styles': [],
        'selectors': []
    }
    
    lines = content.split('\n')
    
    # Enhanced patterns with line context
    patterns = {
        'classes': [
            (r'\.className\s*=\s*[\'"]([^"\']+)[\'"]', 'className assignment'),
            (r'\.classList\.add\([\'"]([^"\']+)[\'"]\)', 'classList.add'),
            (r'\.classList\.remove\([\'"]([^"\']+)[\'"]\)', 'classList.remove'),
            (r'\.classList\.toggle\([\'"]([^"\']+)[\'"]\)', 'classList.toggle'),
            (r'\.classList\.contains\([\'"]([^"\']+)[\'"]\)', 'classList.contains'),
            (r'class=[\'"]([^"\']+)[\'"]', 'HTML class attribute'),
            (r'<[^>]+class=[\'"]([^"\']*)[\'"]', 'Template literal class'),
            (r'setAttribute\([\'"]class[\'"],\s*[\'"]([^"\']+)[\'"]', 'setAttribute class'),
        ],
        'ids': [
            (r'\.id\s*=\s*[\'"]([^"\']+)[\'"]', 'id assignment'),
            (r'getElementById\([\'"]([^"\']+)[\'"]\)', 'getElementById'),
            (r'id=[\'"]([^"\']+)[\'"]', 'HTML id attribute'),
            (r'<[^>]+id=[\'"]([^"\']*)[\'"]', 'Template literal id'),
            (r'setAttribute\([\'"]id[\'"],\s*[\'"]([^"\']+)[\'"]', 'setAttribute id'),
        ],
        'selectors': [
            (r'querySelector\([\'"]([^"\']+)[\'"]\)', 'querySelector'),
            (r'querySelectorAll\([\'"]([^"\']+)[\'"]\)', 'querySelectorAll'),
            (r'getElementsByClassName\([\'"]([^"\']+)[\'"]\)', 'getElementsByClassName'),
            (r'getElementsByTagName\([\'"]([^"\']+)[\'"]\)', 'getElementsByTagName'),
        ],
        'variables': [
            (r'(--[\w-]+)', 'CSS custom property'),
            (r'var\((--[\w-]+)\)', 'var() function'),
            (r'setProperty\([\'\"](--[\w-]+)[\'\"]', 'setProperty'),
            (r'getPropertyValue\([\'\"](--[\w-]+)[\'\"]', 'getPropertyValue'),
        ],
        'inline_styles': [
            (r'\.style\.(\w+)\s*=', 'style property assignment'),
            (r'\.style\[[\'"]([^"\']+)[\'"]\]\s*=', 'style bracket notation'),
        ]
    }
    
    for line_num, line in enumerate(lines, 1):
        for category, pattern_list in patterns.items():
            for pattern, description in pattern_list:
                matches = re.finditer(pattern, line, re.IGNORECASE)
                for match in matches:
                    value = match.group(1)
                    
                    if category == 'classes':
                        # Split multiple classes
                        class_names = value.split()
                        for class_name in class_names:
                            if class_name and not class_name.startswith('${'):  # Skip template literals
                                references[category].append({
                                    'value': class_name,
                                    'type': description,
                                    'file': js_file,
                                    'line': line_num,
                                    'context': line.strip()
                                })
                    else:
                        if value and not value.startswith('${'):  # Skip template literals
                            references[category].append({
                                'value': value,
                                'type': description,
                                'file': js_file,
                                'line': line_num,
                                'context': line.strip()
                            })
    
    return references

def extract_css_definitions(css_file):
    """Extract CSS class definitions, IDs, and variables from CSS files"""
    
    if not os.path.exists(css_file):
        return {}
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    definitions = {
        'classes': [],
        'ids': [],
        'variables': [],
        'animations': [],
        'media_queries': []
    }
    
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        if not line or line.startswith('/*'):
            continue
            
        # Class definitions
        class_matches = re.findall(r'\.([a-zA-Z][\w-]*)', line)
        for class_name in class_matches:
            if not any(d['value'] == class_name for d in definitions['classes']):
                definitions['classes'].append({
                    'value': class_name,
                    'file': css_file,
                    'line': line_num,
                    'context': line
                })
        
        # ID definitions
        id_matches = re.findall(r'#([a-zA-Z][\w-]*)', line)
        for id_name in id_matches:
            if not any(d['value'] == id_name for d in definitions['ids']):
                definitions['ids'].append({
                    'value': id_name,
                    'file': css_file,
                    'line': line_num,
                    'context': line
                })
        
        # CSS variables
        var_matches = re.findall(r'(--[\w-]+)', line)
        for var_name in var_matches:
            if not any(d['value'] == var_name for d in definitions['variables']):
                definitions['variables'].append({
                    'value': var_name,
                    'file': css_file,
                    'line': line_num,
                    'context': line
                })
        
        # Animations
        if '@keyframes' in line:
            anim_match = re.search(r'@keyframes\s+([\w-]+)', line)
            if anim_match:
                definitions['animations'].append({
                    'value': anim_match.group(1),
                    'file': css_file,
                    'line': line_num,
                    'context': line
                })
        
        # Media queries
        if '@media' in line:
            definitions['media_queries'].append({
                'value': line,
                'file': css_file,
                'line': line_num,
                'context': line
            })
    
    return definitions

def generate_components_analysis():
    """Generate comprehensive analysis of all CSS references"""
    
    # Files to analyze
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
    
    analysis = {
        'js_references': {},
        'css_definitions': {},
        'summary': {
            'total_js_classes': 0,
            'total_js_ids': 0,
            'total_js_variables': 0,
            'total_css_classes': 0,
            'total_css_ids': 0,
            'total_css_variables': 0,
            'files_analyzed': {
                'js': len([f for f in js_files if os.path.exists(f)]),
                'css': len(css_files)
            }
        }
    }
    
    # Analyze JavaScript files
    print("Analyzing JavaScript files...")
    for js_file in js_files:
        if os.path.exists(js_file):
            print(f"  - {js_file}")
            refs = extract_css_references_detailed(js_file)
            analysis['js_references'][js_file] = refs
            
            analysis['summary']['total_js_classes'] += len(refs['classes'])
            analysis['summary']['total_js_ids'] += len(refs['ids'])
            analysis['summary']['total_js_variables'] += len(refs['variables'])
    
    # Analyze CSS files
    print("Analyzing CSS files...")
    for css_file in css_files:
        print(f"  - {css_file}")
        defs = extract_css_definitions(css_file)
        analysis['css_definitions'][css_file] = defs
        
        analysis['summary']['total_css_classes'] += len(defs['classes'])
        analysis['summary']['total_css_ids'] += len(defs['ids'])
        analysis['summary']['total_css_variables'] += len(defs['variables'])
    
    return analysis

if __name__ == "__main__":
    print("=== Tailwind Component Extraction ===")
    print("Generating comprehensive CSS reference analysis...\n")
    
    analysis = generate_components_analysis()
    
    # Write raw data to JSON for processing
    with open('css_analysis_raw.json', 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    # Generate markdown report
    output = []
    output.append("# CSS References Analysis for Tailwind Migration")
    output.append("")
    output.append("## Summary")
    output.append(f"- JavaScript files analyzed: {analysis['summary']['files_analyzed']['js']}")
    output.append(f"- CSS files analyzed: {analysis['summary']['files_analyzed']['css']}")
    output.append(f"- Total CSS class references in JS: {analysis['summary']['total_js_classes']}")
    output.append(f"- Total CSS ID references in JS: {analysis['summary']['total_js_ids']}")
    output.append(f"- Total CSS variable references in JS: {analysis['summary']['total_js_variables']}")
    output.append(f"- Total CSS class definitions: {analysis['summary']['total_css_classes']}")
    output.append(f"- Total CSS ID definitions: {analysis['summary']['total_css_ids']}")
    output.append(f"- Total CSS variable definitions: {analysis['summary']['total_css_variables']}")
    output.append("")
    
    # JavaScript References
    output.append("## JavaScript CSS References")
    output.append("")
    for js_file, refs in analysis['js_references'].items():
        if not refs:
            continue
            
        output.append(f"### {js_file}")
        output.append("")
        
        for category, items in refs.items():
            if not items:
                continue
                
            output.append(f"#### {category.title()}")
            output.append("")
            
            # Group by value
            value_groups = {}
            for item in items:
                if item['value'] not in value_groups:
                    value_groups[item['value']] = []
                value_groups[item['value']].append(item)
            
            for value, occurrences in sorted(value_groups.items()):
                output.append(f"**{value}**")
                for occ in occurrences:
                    output.append(f"- Line {occ['line']}: {occ['type']}")
                    output.append(f"  ```javascript")
                    output.append(f"  {occ['context']}")
                    output.append(f"  ```")
                output.append("")
    
    # CSS Definitions
    output.append("## CSS Definitions")
    output.append("")
    for css_file, defs in analysis['css_definitions'].items():
        if not defs:
            continue
            
        output.append(f"### {css_file}")
        output.append("")
        
        for category, items in defs.items():
            if not items:
                continue
                
            output.append(f"#### {category.title()}")
            output.append("")
            
            for item in items:
                output.append(f"**{item['value']}** (Line {item['line']})")
                output.append(f"```css")
                output.append(f"{item['context']}")
                output.append(f"```")
                output.append("")
    
    # Write markdown file
    with open('css_analysis_raw.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print("Analysis complete!")
    print("Generated files:")
    print("  - css_analysis_raw.json (raw data)")
    print("  - css_analysis_raw.md (markdown report)")
    print("\nNext: Process raw data into components.md with component descriptions")
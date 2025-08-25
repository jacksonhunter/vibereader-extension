import re
import os

def extract_css_classes_from_file(css_file):
    """Extract all CSS class definitions from a CSS file"""
    
    if not os.path.exists(css_file):
        return set()
        
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all class selectors
    # Patterns: .class-name, .class:hover, .class::before, etc.
    class_pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*)'
    matches = re.findall(class_pattern, content)
    
    # Clean up and deduplicate
    classes = set()
    for match in matches:
        # Remove pseudo-classes and pseudo-elements
        clean_class = match.split(':')[0].split('[')[0]
        if clean_class and not clean_class.startswith('-'):  # Ignore CSS prefixes
            classes.add(clean_class)
    
    return classes

def extract_required_classes_from_api():
    """Extract required classes from CSS-API.md"""
    
    api_file = "CSS-API.md"
    if not os.path.exists(api_file):
        return set()
    
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find class requirements in API doc
    # Look for patterns like .class-name in the requirements
    class_pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*)'
    matches = re.findall(class_pattern, content)
    
    api_classes = set()
    for match in matches:
        clean_class = match.split(':')[0].split('[')[0]
        if clean_class:
            api_classes.add(clean_class)
    
    return api_classes

def extract_js_used_classes():
    """Get classes actually used in JavaScript (from previous analysis)"""
    # From the previous analysis results
    used_classes = {
        'article-byline', 'article-content', 'article-header', 'article-meta', 
        'article-title', 'ascii-art', 'ascii-canvas', 'category-content', 
        'category-header', 'cyber-code', 'cyber-heading', 'diagnostic-category',
        'disconnect-btn', 'error-display', 'error-icon', 'error-message', 
        'error-title', 'extraction-progress', 'extraction-status', 'footer-info',
        'led-indicator', 'loading', 'media-ascii-display', 'media-emoji-display',
        'media-label', 'media-normal-display', 'media-transition', 'media-wrapper',
        'meta-item', 'mode-hint', 'progress-bar', 'progress-fill', 'retry-btn',
        'terminal-content', 'terminal-controls', 'terminal-header', 'terminal-line',
        'terminal-title', 'terminal-window', 'theme-btn', 'vibe-article',
        'vibe-brand', 'vibe-btn', 'vibe-content', 'vibe-footer', 'vibe-header',
        'vibe-header-left', 'vibe-header-right', 'vibe-layout', 'vibe-reader-container',
        'vibe-reader-overlay', 'vibe-reader-proxy', 'vibe-sidebar', 'vibe-sidebar-spacer',
        'vibe-status', 'vibe-title', 'matrix-drop', 'vibe-rain-container',
        'glitch', 'glitching', 'neon-pulse', 'active', 'left-panel', 'right-panel',
        'error-details'  # Added from analysis
    }
    return used_classes

def compare_class_definitions(css_file1, css_file2, class_name):
    """Compare how a class is defined in two CSS files"""
    
    def get_class_definition(file_path, class_name):
        if not os.path.exists(file_path):
            return None
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the class definition block
        pattern = rf'\.{re.escape(class_name)}(?:[^{{])*\{{([^}}]*(?:\{{[^}}]*\}}[^}}]*)*)\}}'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            return match.group(1).strip()
        return None
    
    def1 = get_class_definition(css_file1, class_name)
    def2 = get_class_definition(css_file2, class_name)
    
    return def1, def2

if __name__ == "__main__":
    print("=== CSS Class Overlap Analysis ===\n")
    
    # Extract classes from each file
    base_classes = extract_css_classes_from_file("base.css")
    matrix_classes = extract_css_classes_from_file("matrix_theme_v2.css")
    themes_classes = extract_css_classes_from_file("themes_v2.css")
    api_required = extract_required_classes_from_api()
    js_used = extract_js_used_classes()
    
    print(f"Classes found:")
    print(f"  base.css: {len(base_classes)}")
    print(f"  matrix_theme_v2.css: {len(matrix_classes)}")
    print(f"  themes_v2.css: {len(themes_classes)}")
    print(f"  CSS-API.md required: {len(api_required)}")
    print(f"  JavaScript used: {len(js_used)}")
    print()
    
    # Find overlaps
    base_matrix_overlap = base_classes.intersection(matrix_classes)
    base_themes_overlap = base_classes.intersection(themes_classes)
    matrix_themes_overlap = matrix_classes.intersection(themes_classes)
    
    print("=== OVERLAPPING CLASSES ===")
    print(f"base.css & matrix_theme_v2.css: {len(base_matrix_overlap)} classes")
    if base_matrix_overlap:
        for cls in sorted(base_matrix_overlap)[:15]:
            print(f"  .{cls}")
        if len(base_matrix_overlap) > 15:
            print(f"  ... and {len(base_matrix_overlap) - 15} more")
    print()
    
    print(f"base.css & themes_v2.css: {len(base_themes_overlap)} classes")
    if base_themes_overlap:
        print(f"  {sorted(base_themes_overlap)}")
    print()
    
    # Unused classes analysis
    print("=== UNUSED CLASSES ===")
    
    # Classes in matrix but not used in JS
    matrix_unused = matrix_classes - js_used
    print(f"matrix_theme_v2.css classes NOT used in JavaScript: {len(matrix_unused)}")
    if matrix_unused:
        for cls in sorted(matrix_unused)[:20]:
            print(f"  .{cls}")
        if len(matrix_unused) > 20:
            print(f"  ... and {len(matrix_unused) - 20} more")
    print()
    
    # Classes in base but not used in JS
    base_unused = base_classes - js_used
    print(f"base.css classes NOT used in JavaScript: {len(base_unused)}")
    if base_unused:
        for cls in sorted(base_unused)[:20]:
            print(f"  .{cls}")
        if len(base_unused) > 20:
            print(f"  ... and {len(base_unused) - 20} more")
    print()
    
    # Missing from API requirements
    print("=== API COMPLIANCE ===")
    missing_from_combined = api_required - (base_classes.union(matrix_classes).union(themes_classes))
    print(f"Classes required by CSS-API.md but missing: {len(missing_from_combined)}")
    if missing_from_combined:
        for cls in sorted(missing_from_combined):
            print(f"  .{cls}")
    print()
    
    # Classes used in JS but missing from API requirements
    js_not_in_api = js_used - api_required
    print(f"Classes used in JavaScript but not documented in API: {len(js_not_in_api)}")
    if js_not_in_api:
        for cls in sorted(js_not_in_api)[:15]:
            print(f"  .{cls}")
        if len(js_not_in_api) > 15:
            print(f"  ... and {len(js_not_in_api) - 15} more")
    print()
    
    # Analyze the top conflicting classes
    print("=== TOP CONFLICTING CLASSES ===")
    conflict_classes = ['vibe-reader-container', 'vibe-header', 'vibe-article', 'terminal-window', 'media-wrapper']
    
    for cls in conflict_classes:
        if cls in base_matrix_overlap:
            print(f"\n.{cls} - DEFINED IN BOTH FILES:")
            base_def, matrix_def = compare_class_definitions("base.css", "matrix_theme_v2.css", cls)
            
            if base_def and matrix_def:
                print(f"  base.css: {len(base_def)} characters")
                print(f"  matrix_theme_v2.css: {len(matrix_def)} characters")
                print(f"  Same definition: {'YES' if base_def.strip() == matrix_def.strip() else 'NO'}")
            else:
                print(f"  Could not extract definitions for comparison")
    
    print("\n=== SUMMARY ===")
    print(f"Total unique classes across all files: {len(base_classes.union(matrix_classes).union(themes_classes))}")
    print(f"Classes with conflicts (defined in multiple files): {len(base_matrix_overlap)}")
    print(f"Potentially unused classes: {len(matrix_unused) + len(base_unused)} combined")
    print(f"API compliance: {len(api_required - missing_from_combined)}/{len(api_required)} required classes present")
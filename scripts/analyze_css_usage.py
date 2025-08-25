import re
import os

def extract_css_references(js_file):
    """Extract CSS class names and variable references from JavaScript file"""
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find CSS class references
    class_patterns = [
        r'\.className\s*=\s*[\'"]([^"\']+)[\'"]',
        r'\.classList\.add\([\'"]([^"\']+)[\'"]\)',
        r'\.classList\.remove\([\'"]([^"\']+)[\'"]\)',
        r'\.classList\.toggle\([\'"]([^"\']+)[\'"]\)',
        r'querySelector\([\'"]\.([^"\']+)[\'"]\)',
        r'querySelectorAll\([\'"]\.([^"\']+)[\'"]\)',
        r'getElementById\([\'"]([^"\']+)[\'"]\)',
        r'getElementsByClassName\([\'"]([^"\']+)[\'"]\)',
        r'class=[\'"]([^"\']+)[\'"]',  # HTML class attributes in template strings
        r'<[^>]+class=[\'"]([^"\']*)[\'"]',  # HTML in template literals
    ]
    
    classes = set()
    for pattern in class_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            # Split multiple classes
            class_names = match.split()
            classes.update(class_names)
    
    # Find CSS variable references (--variable-name)
    var_patterns = [
        r'--[\w-]+',  # CSS custom properties
        r'var\(--[\w-]+\)',  # var() function calls
        r'setProperty\([\'"]--[\w-]+[\'"]',  # style.setProperty calls
    ]
    
    variables = set()
    for pattern in var_patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            # Clean up var() wrapper and quotes
            var_name = match.replace('var(', '').replace(')', '').replace('"', '').replace("'", '').replace('setProperty(', '')
            if var_name.startswith('--'):
                variables.add(var_name)
    
    return classes, variables

def check_css_coverage(css_file, classes, variables):
    """Check if CSS classes and variables exist in a CSS file"""
    
    if not os.path.exists(css_file):
        return set(), set(), classes, variables
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    found_classes = set()
    found_variables = set()
    
    # Check for class definitions (.class-name)
    for class_name in classes:
        if f'.{class_name}' in content:
            found_classes.add(class_name)
    
    # Check for variable definitions (--variable-name:)
    for var_name in variables:
        if f'{var_name}:' in content:
            found_variables.add(var_name)
    
    missing_classes = classes - found_classes
    missing_variables = variables - found_variables
    
    return found_classes, found_variables, missing_classes, missing_variables

if __name__ == "__main__":
    js_files = [
        "background-enhanced.js",
        "stealth-extractor.js", 
        "proxy-controller.js"
    ]
    
    css_files = [
        "base.css",
        "matrix_theme_v2.css"
    ]
    
    print("=== CSS Usage Analysis ===\n")
    
    all_classes = set()
    all_variables = set()
    
    # Analyze each JavaScript file
    for js_file in js_files:
        if os.path.exists(js_file):
            print(f"Analyzing {js_file}...")
            classes, variables = extract_css_references(js_file)
            
            print(f"   CSS Classes: {len(classes)}")
            if classes:
                for cls in sorted(classes)[:10]:  # Show first 10
                    print(f"      .{cls}")
                if len(classes) > 10:
                    print(f"      ... and {len(classes) - 10} more")
            
            print(f"   CSS Variables: {len(variables)}")
            if variables:
                for var in sorted(variables)[:10]:  # Show first 10
                    print(f"      {var}")
                if len(variables) > 10:
                    print(f"      ... and {len(variables) - 10} more")
            
            all_classes.update(classes)
            all_variables.update(variables)
            print()
        else:
            print(f"ERROR: {js_file} not found")
    
    print(f"TOTAL UNIQUE REFERENCES:")
    print(f"   CSS Classes: {len(all_classes)}")
    print(f"   CSS Variables: {len(all_variables)}\n")
    
    # Check coverage in CSS files
    print("=== CSS Coverage Analysis ===\n")
    
    overall_found_classes = set()
    overall_found_variables = set()
    
    for css_file in css_files:
        print(f"Checking {css_file}...")
        found_classes, found_variables, missing_classes, missing_variables = check_css_coverage(
            css_file, all_classes, all_variables
        )
        
        print(f"   Found Classes: {len(found_classes)}")
        print(f"   Found Variables: {len(found_variables)}")
        print(f"   Missing Classes: {len(missing_classes)}")
        print(f"   Missing Variables: {len(missing_variables)}")
        
        if missing_classes:
            print(f"   Missing Classes: {', '.join(sorted(missing_classes)[:10])}")
        if missing_variables:
            print(f"   Missing Variables: {', '.join(sorted(missing_variables)[:10])}")
        
        overall_found_classes.update(found_classes)
        overall_found_variables.update(found_variables)
        print()
    
    # Summary
    total_missing_classes = all_classes - overall_found_classes
    total_missing_variables = all_variables - overall_found_variables
    
    print("=== SUMMARY ===")
    print(f"JavaScript references: {len(all_classes)} classes, {len(all_variables)} variables")
    print(f"CSS coverage: {len(overall_found_classes)}/{len(all_classes)} classes, {len(overall_found_variables)}/{len(all_variables)} variables")
    
    if total_missing_classes:
        print(f"\nMISSING CLASSES ({len(total_missing_classes)}):")
        for cls in sorted(total_missing_classes):
            print(f"   .{cls}")
    
    if total_missing_variables:
        print(f"\nMISSING VARIABLES ({len(total_missing_variables)}):")
        for var in sorted(total_missing_variables):
            print(f"   {var}")
    
    if not total_missing_classes and not total_missing_variables:
        print("\nAll JavaScript CSS references are covered!")
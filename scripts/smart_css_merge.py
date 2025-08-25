import re
import os

def parse_css_rules(css_content):
    """Parse CSS content into individual rules with selectors and definitions"""
    
    # Remove comments first
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Find all CSS rules
    rule_pattern = r'([^{}]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
    rules = {}
    rule_order = []  # Track original order
    
    for match in re.finditer(rule_pattern, css_content, re.DOTALL):
        selector = match.group(1).strip()
        definition = match.group(2).strip()
        
        if selector and definition:
            # Clean up selector (remove extra whitespace)
            selector = ' '.join(selector.split())
            
            # Store rule
            rules[selector] = definition
            if selector not in rule_order:
                rule_order.append(selector)
    
    return rules, rule_order

def extract_class_selectors(rules):
    """Extract just the class-based selectors from all rules"""
    
    class_rules = {}
    class_order = []
    
    for selector, definition in rules.items():
        # Check if selector contains class references
        if '.' in selector:
            class_rules[selector] = definition
            class_order.append(selector)
    
    return class_rules, class_order

def resolve_conflicts(matrix_rules, base_rules, matrix_order, base_order):
    """Resolve conflicts with base.css taking precedence"""
    
    merged_rules = {}
    merged_order = []
    conflicts = []
    
    print("Resolving conflicts...")
    
    # Start with matrix rules as foundation
    for selector in matrix_order:
        merged_rules[selector] = matrix_rules[selector]
        merged_order.append(selector)
    
    # Add base rules, overriding conflicts
    for selector in base_order:
        if selector in merged_rules:
            # Conflict detected
            conflicts.append(selector)
            print(f"  CONFLICT: {selector} - using base.css definition")
            merged_rules[selector] = base_rules[selector]  # Override with base
        else:
            # No conflict, add new rule
            merged_rules[selector] = base_rules[selector]
            merged_order.append(selector)
    
    print(f"Resolved {len(conflicts)} conflicts")
    return merged_rules, merged_order, conflicts

def generate_clean_css(rules, rule_order):
    """Generate clean CSS output from resolved rules"""
    
    output = []
    output.append("/* Base CSS v2 - Smart Merge (No Duplicates) */")
    output.append("/* Matrix theme foundation + Base.css overrides */")
    output.append("/* Conflicts resolved: base.css definitions used */")
    output.append("")
    
    current_section = None
    
    for selector in rule_order:
        definition = rules[selector]
        
        # Add section headers for organization
        if selector.startswith('.vibe-reader'):
            section = "VIBE READER"
        elif selector.startswith('.terminal'):
            section = "TERMINALS"
        elif selector.startswith('.media'):
            section = "MEDIA SYSTEM"
        elif selector.startswith('.ascii'):
            section = "ASCII SYSTEM"
        elif selector.startswith('@'):
            section = "ANIMATIONS & KEYFRAMES"
        else:
            section = "COMPONENTS"
        
        if section != current_section:
            output.append(f"\n/* ============================================================================ */")
            output.append(f"/* {section} */") 
            output.append(f"/* ============================================================================ */\n")
            current_section = section
        
        # Add the CSS rule
        output.append(f"{selector} {{")
        
        # Format definition with proper indentation
        lines = definition.split('\n')
        for line in lines:
            line = line.strip()
            if line:
                output.append(f"  {line}")
        
        output.append("}")
        output.append("")
    
    return '\n'.join(output)

def smart_css_merge(matrix_file, base_file, output_file):
    """Perform intelligent CSS merge with conflict resolution"""
    
    print(f"=== Smart CSS Merge ===")
    print(f"Matrix file: {matrix_file}")
    print(f"Base file: {base_file}")
    print(f"Output file: {output_file}")
    print()
    
    # Read matrix CSS
    if not os.path.exists(matrix_file):
        print(f"ERROR: {matrix_file} not found")
        return False
        
    with open(matrix_file, 'r', encoding='utf-8') as f:
        matrix_content = f.read()
    
    # Read base CSS  
    if not os.path.exists(base_file):
        print(f"ERROR: {base_file} not found")
        return False
        
    with open(base_file, 'r', encoding='utf-8') as f:
        base_content = f.read()
    
    print(f"Matrix CSS: {len(matrix_content)} characters")
    print(f"Base CSS: {len(base_content)} characters")
    print()
    
    # Parse CSS rules
    print("Parsing matrix CSS rules...")
    matrix_rules, matrix_order = parse_css_rules(matrix_content)
    print(f"  Found {len(matrix_rules)} rules")
    
    print("Parsing base CSS rules...")
    base_rules, base_order = parse_css_rules(base_content)
    print(f"  Found {len(base_rules)} rules")
    print()
    
    # Resolve conflicts (base.css wins)
    merged_rules, merged_order, conflicts = resolve_conflicts(
        matrix_rules, base_rules, matrix_order, base_order
    )
    
    print(f"Final merged rules: {len(merged_rules)}")
    print(f"Conflicts resolved: {len(conflicts)}")
    print()
    
    # Generate clean CSS
    print("Generating clean CSS...")
    clean_css = generate_clean_css(merged_rules, merged_order)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(clean_css)
    
    print(f"Clean CSS written: {len(clean_css)} characters")
    print(f"Size reduction: {len(matrix_content) + len(base_content)} -> {len(clean_css)} characters")
    
    # Show conflict summary
    if conflicts:
        print(f"\nCONFLICTS RESOLVED (using base.css definitions):")
        for selector in conflicts[:10]:
            print(f"  {selector}")
        if len(conflicts) > 10:
            print(f"  ... and {len(conflicts) - 10} more")
    
    print(f"\nSUCCESS: Clean merged CSS saved to {output_file}")
    return True

if __name__ == "__main__":
    matrix_file = "matrix_theme_v2.css"
    base_file = "base.css"  
    output_file = "base_v2_clean.css"
    
    success = smart_css_merge(matrix_file, base_file, output_file)
    
    if success:
        print("\n=== NEXT STEPS ===")
        print("1. Review base_v2_clean.css")
        print("2. Lint: npx stylelint base_v2_clean.css")
        print("3. Test: web-ext run")
        print("4. Compare file sizes and performance")
    else:
        print("Merge failed")
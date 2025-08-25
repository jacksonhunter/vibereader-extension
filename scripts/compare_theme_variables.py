import re
import os

def extract_root_and_theme_variables(file_path):
    """Extract CSS variables from :root and [data-theme] blocks only"""
    if not os.path.exists(file_path):
        print(f"WARNING: {file_path} not found")
        return {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    variables = {}
    
    # Find :root blocks
    root_pattern = r':root\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    root_matches = re.findall(root_pattern, content, re.DOTALL)
    
    for match in root_matches:
        root_vars = extract_variables_from_block(match)
        if root_vars:
            variables[':root'] = root_vars
    
    # Find [data-theme] blocks
    theme_pattern = r'\[data-theme="([^"]+)"\]\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    theme_matches = re.findall(theme_pattern, content, re.DOTALL)
    
    for theme_name, theme_content in theme_matches:
        theme_vars = extract_variables_from_block(theme_content)
        if theme_vars:
            variables[f'[data-theme="{theme_name}"]'] = theme_vars
    
    return variables

def extract_variables_from_block(block_content):
    """Extract CSS custom properties from a CSS block"""
    variables = {}
    
    # Find CSS custom properties (--variable-name: value;)
    var_pattern = r'--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);'
    var_matches = re.findall(var_pattern, block_content)
    
    for var_name, var_value in var_matches:
        # Clean up the value
        clean_value = var_value.strip()
        variables[f'--{var_name}'] = clean_value
    
    return variables

def compare_variable_sets(legacy_files, current_file):
    """Compare CSS variables from legacy files against current implementation"""
    
    print("=== CSS VARIABLE COMPARISON ANALYSIS ===\n")
    
    # Extract variables from current implementation
    current_vars = extract_root_and_theme_variables(current_file)
    
    print(f"CURRENT IMPLEMENTATION ({os.path.basename(current_file)}):")
    for selector, vars_dict in current_vars.items():
        print(f"  {selector}: {len(vars_dict)} variables")
    print()
    
    # Extract and compare each legacy file
    for legacy_file in legacy_files:
        if not os.path.exists(legacy_file):
            continue
            
        legacy_vars = extract_root_and_theme_variables(legacy_file)
        filename = os.path.basename(legacy_file)
        
        print(f"ANALYZING: {filename}")
        print("-" * 50)
        
        if not legacy_vars:
            print("  No :root or [data-theme] variables found\n")
            continue
        
        for selector, vars_dict in legacy_vars.items():
            print(f"\n  {selector} ({len(vars_dict)} variables):")
            
            # Find corresponding selector in current
            current_selector_vars = current_vars.get(selector, {})
            
            # Variables in legacy but not in current
            missing_in_current = set(vars_dict.keys()) - set(current_selector_vars.keys())
            
            # Variables in both (check for value differences)
            common_vars = set(vars_dict.keys()) & set(current_selector_vars.keys())
            value_differences = []
            
            for var in common_vars:
                legacy_val = vars_dict[var].strip()
                current_val = current_selector_vars[var].strip()
                if legacy_val != current_val:
                    value_differences.append((var, legacy_val, current_val))
            
            # Variables in current but not in legacy
            extra_in_current = set(current_selector_vars.keys()) - set(vars_dict.keys())
            
            # Report findings
            if missing_in_current:
                print(f"    MISSING IN CURRENT ({len(missing_in_current)}):")
                for var in sorted(missing_in_current):
                    print(f"      {var}: {vars_dict[var]}")
            
            if value_differences:
                print(f"    VALUE DIFFERENCES ({len(value_differences)}):")
                for var, legacy_val, current_val in value_differences:
                    print(f"      {var}:")
                    print(f"        Legacy:  {legacy_val}")
                    print(f"        Current: {current_val}")
            
            if extra_in_current:
                print(f"    EXTRA IN CURRENT ({len(extra_in_current)}):")
                for var in sorted(extra_in_current):
                    print(f"      {var}: {current_selector_vars[var]}")
            
            if not missing_in_current and not value_differences and not extra_in_current:
                print("    PERFECT MATCH")
        
        print()

def generate_summary(legacy_files, current_file):
    """Generate overall summary of findings"""
    
    print("=" * 60)
    print("SUMMARY REPORT")
    print("=" * 60)
    
    current_vars = extract_root_and_theme_variables(current_file)
    all_missing = set()
    all_different = set()
    
    for legacy_file in legacy_files:
        if not os.path.exists(legacy_file):
            continue
            
        legacy_vars = extract_root_and_theme_variables(legacy_file)
        
        for selector, vars_dict in legacy_vars.items():
            current_selector_vars = current_vars.get(selector, {})
            
            missing_vars = set(vars_dict.keys()) - set(current_selector_vars.keys())
            all_missing.update(missing_vars)
            
            common_vars = set(vars_dict.keys()) & set(current_selector_vars.keys())
            for var in common_vars:
                if vars_dict[var].strip() != current_selector_vars.get(var, '').strip():
                    all_different.add(var)
    
    print(f"\nOVERALL FINDINGS:")
    print(f"  Variables missing from current: {len(all_missing)}")
    print(f"  Variables with different values: {len(all_different)}")
    
    if all_missing:
        print(f"\n  CRITICAL MISSING VARIABLES:")
        for var in sorted(list(all_missing)[:10]):  # Show top 10
            print(f"    {var}")
        if len(all_missing) > 10:
            print(f"    ... and {len(all_missing) - 10} more")
    
    if all_different:
        print(f"\n  VARIABLES WITH VALUE CHANGES:")
        for var in sorted(list(all_different)[:10]):  # Show top 10
            print(f"    {var}")
        if len(all_different) > 10:
            print(f"    ... and {len(all_different) - 10} more")

if __name__ == "__main__":
    # Legacy files to compare
    legacy_files = [
        r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\base.css",
        r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\matrix-theme.css",
        r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\retrofuture-theme.css", 
        r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\themes.css"
    ]
    
    # Current implementation
    current_file = r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\styles\themes_v2.css"
    
    # Run comparison
    compare_variable_sets(legacy_files, current_file)
    
    # Generate summary
    generate_summary(legacy_files, current_file)
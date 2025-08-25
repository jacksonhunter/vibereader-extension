import re

def convert_matrix_variables(input_file, output_file):
    """Convert matrix-theme.css variables to use semantic API format"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Processing {input_file}...")
    print(f"Original file size: {len(content)} characters")
    
    # Remove theme definition blocks - we only want the component styles
    print("Removing theme definition blocks...")
    
    # Remove :root block
    content = re.sub(r':root\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    # Remove [data-theme="..."] blocks
    content = re.sub(r'\[data-theme="[^"]*"\]\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    print("Converting alpha transparency patterns...")
    
    # Handle alpha cases first (before basic var replacements)
    # rgb(var(--primary), 0.5) → rgba(var(--primary-500), 0.5)
    alpha_patterns = [
        (r'rgb\(var\(--primary\),\s*([\d.]+)\)', r'rgba(var(--primary-500), \1)'),
        (r'rgb\(var\(--secondary\),\s*([\d.]+)\)', r'rgba(var(--secondary-500), \1)'),
        (r'rgb\(var\(--accent\),\s*([\d.]+)\)', r'rgba(var(--accent-500), \1)'),
        (r'rgb\(var\(--bg-primary\),\s*([\d.]+)\)', r'rgba(var(--bg-primary), \1)'),
        (r'rgb\(var\(--bg-secondary\),\s*([\d.]+)\)', r'rgba(var(--bg-secondary), \1)'),
        (r'rgb\(var\(--bg-tertiary\),\s*([\d.]+)\)', r'rgba(var(--bg-tertiary), \1)'),
        (r'rgb\(var\(--text-primary\),\s*([\d.]+)\)', r'rgba(var(--text-primary), \1)'),
        (r'rgb\(var\(--text-secondary\),\s*([\d.]+)\)', r'rgba(var(--text-secondary), \1)'),
        (r'rgb\(var\(--text-accent\),\s*([\d.]+)\)', r'rgba(var(--text-accent), \1)'),
        (r'rgb\(var\(--border-color\),\s*([\d.]+)\)', r'rgba(var(--border-primary), \1)'),
        (r'rgb\(var\(--glow-primary\),\s*([\d.]+)\)', r'rgba(var(--glow-primary), \1)'),
        (r'rgb\(var\(--glow-secondary\),\s*([\d.]+)\)', r'rgba(var(--glow-secondary), \1)'),
    ]
    
    alpha_count = 0
    for pattern, replacement in alpha_patterns:
        matches = len(re.findall(pattern, content))
        if matches > 0:
            content = re.sub(pattern, replacement, content)
            alpha_count += matches
            print(f"  Converted {matches} alpha patterns: {pattern}")
    
    print("Converting basic variable patterns...")
    
    # Basic variable replacements
    # var(--primary) → rgb(var(--primary-500))
    basic_replacements = {
        'var(--primary)': 'rgb(var(--primary-500))',
        'var(--secondary)': 'rgb(var(--secondary-500))', 
        'var(--accent)': 'rgb(var(--accent-500))',
        'var(--border-color)': 'rgb(var(--border-primary))',
        'var(--bg-primary)': 'rgb(var(--bg-primary))',
        'var(--bg-secondary)': 'rgb(var(--bg-secondary))',
        'var(--bg-tertiary)': 'rgb(var(--bg-tertiary))',
        'var(--text-primary)': 'rgb(var(--text-primary))',
        'var(--text-secondary)': 'rgb(var(--text-secondary))',
        'var(--text-accent)': 'rgb(var(--text-accent))',
        'var(--glow-primary)': 'rgb(var(--glow-primary))',
        'var(--glow-secondary)': 'rgb(var(--glow-secondary))',
    }
    
    basic_count = 0
    for old_var, new_var in basic_replacements.items():
        count = content.count(old_var)
        if count > 0:
            content = content.replace(old_var, new_var)
            basic_count += count
            print(f"  Converted {count} instances: {old_var} -> {new_var}")
    
    # Clean up extra whitespace from removed theme blocks
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    content = content.strip()
    
    # Add header comment
    header = """/* Matrix Theme v2 - Component Styles Converted to CSS-API Format */
/* Generated from matrix-theme.css with semantic variable references */
/* Ready for merging with base.css */

"""
    content = header + content
    
    # Write converted file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\nConversion complete!")
    print(f"  Alpha conversions: {alpha_count}")
    print(f"  Basic conversions: {basic_count}")
    print(f"  Total conversions: {alpha_count + basic_count}")
    print(f"  Output file: {output_file}")
    print(f"  New file size: {len(content)} characters")
    
    return alpha_count + basic_count

if __name__ == "__main__":
    input_file = "styles/matrix-theme.css"
    output_file = "matrix_theme_v2.css"
    
    total_conversions = convert_matrix_variables(input_file, output_file)
    
    if total_conversions > 0:
        print(f"\n✅ Successfully converted {total_conversions} variable references")
        print(f"📁 Review the output file: {output_file}")
        print(f"📋 Next steps:")
        print(f"   1. Lint matrix_theme_v2.css")
        print(f"   2. Merge with base.css → base_v2.css")
        print(f"   3. Test with web-ext run")
    else:
        print("⚠️  No conversions were made - check if the input file has the expected variables")
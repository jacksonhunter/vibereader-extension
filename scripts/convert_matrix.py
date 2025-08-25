import re

def extract_hex_to_rgb(hex_color):
    """Convert hex color to RGB triplet"""
    hex_color = hex_color.strip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    
    try:
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16) 
        b = int(hex_color[4:6], 16)
        return f"{r} {g} {b}"
    except:
        return None

def parse_matrix_themes(css_file):
    """Extract theme definitions from matrix-theme.css and convert to semantic RGB variables"""
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find theme blocks
    theme_blocks = {}
    
    # Parse :root (nightdrive default)
    root_match = re.search(r':root\s*\{([^}]+)\}', content, re.DOTALL)
    if root_match:
        theme_blocks['nightdrive'] = parse_theme_variables(root_match.group(1))
    
    # Parse other themes
    theme_pattern = r'\[data-theme="([^"]+)"\]\s*\{([^}]+)\}'
    for match in re.finditer(theme_pattern, content, re.DOTALL):
        theme_name = match.group(1)
        theme_vars = parse_theme_variables(match.group(2))
        theme_blocks[theme_name] = theme_vars
    
    return theme_blocks

def parse_theme_variables(theme_content):
    """Parse CSS variables from theme block"""
    variables = {}
    
    # Find all CSS variables
    var_pattern = r'--([^:]+):\s*([^;]+);'
    for match in re.finditer(var_pattern, theme_content):
        var_name = match.group(1).strip()
        var_value = match.group(2).strip()
        
        # Convert hex colors to RGB
        if var_value.startswith('#'):
            rgb_value = extract_hex_to_rgb(var_value)
            if rgb_value:
                variables[var_name] = rgb_value
        elif 'rgb(' in var_value and '/' in var_value:
            # Extract RGB from rgb(r g b / alpha) format
            rgb_match = re.search(r'rgb\((\d+\s+\d+\s+\d+)', var_value)
            if rgb_match:
                variables[var_name] = rgb_match.group(1)
    
    return variables

def generate_semantic_themes(theme_blocks):
    """Generate themes_v2.css with semantic RGB variables"""
    
    output = "/* Matrix Theme Variables - Semantic RGB Format */\n\n"
    
    for theme_name, variables in theme_blocks.items():
        if theme_name == 'nightdrive':
            output += ":root {\n"
        else:
            output += f'[data-theme="{theme_name}"] {{\n'
        
        # Map old variables to semantic scale
        if 'primary' in variables:
            output += f"  --primary-500: {variables['primary']};\n"
        if 'secondary' in variables:
            output += f"  --secondary-500: {variables['secondary']};\n"  
        if 'accent' in variables:
            output += f"  --accent-500: {variables['accent']};\n"
        
        # Background system
        if 'bg-primary' in variables:
            output += f"  --bg-primary: {variables['bg-primary']};\n"
        if 'bg-secondary' in variables:
            output += f"  --bg-secondary: {variables['bg-secondary']};\n"
        if 'bg-tertiary' in variables:
            output += f"  --bg-tertiary: {variables['bg-tertiary']};\n"
        
        # Text system  
        if 'text-primary' in variables:
            output += f"  --text-primary: {variables['text-primary']};\n"
        if 'text-secondary' in variables:
            output += f"  --text-secondary: {variables['text-secondary']};\n"
        if 'text-accent' in variables:
            output += f"  --text-accent: {variables['text-accent']};\n"
        
        # Border system
        if 'border-color' in variables:
            output += f"  --border-primary: {variables['border-color']};\n"
        
        # Glow system
        if 'glow-primary' in variables:
            output += f"  --glow-primary: {variables['glow-primary']};\n"
        if 'glow-secondary' in variables:
            output += f"  --glow-secondary: {variables['glow-secondary']};\n"
        
        # Convenience variables for backwards compatibility
        output += f"  --primary: rgb(var(--primary-500));\n"
        output += f"  --secondary: rgb(var(--secondary-500));\n"  
        output += f"  --accent: rgb(var(--accent-500));\n"
        
        output += "}\n\n"
    
    return output

def extract_matrix_base_styles(css_file):
    """Extract non-theme base styles from matrix-theme.css"""
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove theme blocks
    content = re.sub(r':root\s*\{[^}]+\}', '', content, flags=re.DOTALL)
    content = re.sub(r'\[data-theme="[^"]+"\]\s*\{[^}]+\}', '', content, flags=re.DOTALL)
    
    # Convert hardcoded colors to use variables
    content = convert_to_variable_format(content)
    
    # Clean up extra whitespace
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    content = content.strip()
    
    return content

def convert_to_variable_format(css_content):
    """Convert hardcoded colors to rgb(var()) format"""
    
    # Common color mappings based on typical matrix theme colors
    color_mappings = {
        '#f92672': 'rgb(var(--primary-500))',
        '#66d9ef': 'rgb(var(--secondary-500))',
        '#ffbf80': 'rgb(var(--accent-500))',
        'var(--primary)': 'rgb(var(--primary-500))',
        'var(--secondary)': 'rgb(var(--secondary-500))', 
        'var(--accent)': 'rgb(var(--accent-500))',
        'var(--bg-primary)': 'rgb(var(--bg-primary))',
        'var(--bg-secondary)': 'rgb(var(--bg-secondary))',
        'var(--bg-tertiary)': 'rgb(var(--bg-tertiary))',
        'var(--text-primary)': 'rgb(var(--text-primary))',
        'var(--text-secondary)': 'rgb(var(--text-secondary))',
        'var(--text-accent)': 'rgb(var(--text-accent))',
        'var(--border-color)': 'rgb(var(--border-primary))',
        'var(--glow-primary)': 'rgb(var(--glow-primary))',
        'var(--glow-secondary)': 'rgb(var(--glow-secondary))',
    }
    
    for old_color, new_color in color_mappings.items():
        css_content = css_content.replace(old_color, new_color)
    
    return css_content

if __name__ == "__main__":
    matrix_file = "styles/matrix-theme.css"
    
    print("Parsing matrix-theme.css...")
    theme_blocks = parse_matrix_themes(matrix_file)
    
    print(f"Found {len(theme_blocks)} themes:")
    for theme in theme_blocks.keys():
        print(f"  - {theme}")
    
    # Generate new theme variables for themes_v2.css
    new_themes = generate_semantic_themes(theme_blocks)
    
    # Read existing themes_v2.css and append
    try:
        with open("themes_v2.css", 'r', encoding='utf-8') as f:
            existing_themes = f.read()
    except FileNotFoundError:
        existing_themes = ""
    
    with open("themes_v2.css", 'w', encoding='utf-8') as f:
        f.write(existing_themes)
        f.write("\n\n")
        f.write(new_themes)
    
    print("Added matrix theme variables to themes_v2.css")
    
    # Extract base styles for merging
    matrix_base = extract_matrix_base_styles(matrix_file)
    
    with open("matrix_base_extracted.css", 'w', encoding='utf-8') as f:
        f.write("/* Matrix Base Styles - Converted to RGB Variables */\n\n")
        f.write(matrix_base)
    
    print("Extracted matrix base styles to matrix_base_extracted.css")
    print("Ready to merge with base.css")
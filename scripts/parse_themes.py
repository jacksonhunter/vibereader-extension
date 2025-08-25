import re

def parse_themes(css_file, output_file):
    """Parse CSS file and extract theme blocks to output file"""
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all theme blocks using regex
    theme_pattern = r'\[data-theme="([^"]+)"\]\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    
    theme_blocks = []
    current_pos = 0
    
    while current_pos < len(content):
        # Find the next [data-theme="theme_name"] occurrence
        theme_match = re.search(r'\[data-theme="([^"]+)"\]', content[current_pos:])
        
        if not theme_match:
            break
            
        theme_name = theme_match.group(1)
        start_pos = current_pos + theme_match.start()
        
        # Find the opening brace
        brace_pos = content.find('{', start_pos)
        if brace_pos == -1:
            current_pos += theme_match.end()
            continue
            
        # Find the matching closing brace
        brace_count = 1
        pos = brace_pos + 1
        
        while pos < len(content) and brace_count > 0:
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1
        
        if brace_count == 0:
            # Extract the complete block
            block = content[start_pos:pos]
            theme_blocks.append((theme_name, block))
        
        current_pos = pos
    
    # Write extracted themes to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("/* Extracted Theme Definitions */\n\n")
        
        for theme_name, block in theme_blocks:
            f.write(f"/* Theme: {theme_name} */\n")
            f.write(block)
            f.write("\n\n")
    
    print(f"Extracted {len(theme_blocks)} theme blocks to {output_file}")
    
    # Print summary
    theme_names = set(name for name, _ in theme_blocks)
    print(f"Themes found: {', '.join(sorted(theme_names))}")

if __name__ == "__main__":
    css_file = "styles/retrofuture-theme.css"
    output_file = "themes_v2.css"
    
    parse_themes(css_file, output_file)
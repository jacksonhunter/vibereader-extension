import re

def extract_base_css(css_file, output_file):
    """Extract non-theme CSS blocks to base.css"""
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all theme block positions
    theme_positions = []
    pos = 0
    
    while pos < len(content):
        # Find next [data-theme="..."] selector
        theme_match = re.search(r'\[data-theme="[^"]+"\]', content[pos:])
        if not theme_match:
            break
            
        start_pos = pos + theme_match.start()
        
        # Find the opening brace
        brace_pos = content.find('{', start_pos)
        if brace_pos == -1:
            pos += theme_match.end()
            continue
            
        # Find matching closing brace
        brace_count = 1
        end_pos = brace_pos + 1
        
        while end_pos < len(content) and brace_count > 0:
            if content[end_pos] == '{':
                brace_count += 1
            elif content[end_pos] == '}':
                brace_count -= 1
            end_pos += 1
        
        if brace_count == 0:
            theme_positions.append((start_pos, end_pos))
        
        pos = end_pos
    
    # Extract base CSS (everything except theme blocks)
    base_css = ""
    last_pos = 0
    
    for start, end in theme_positions:
        # Add content before this theme block
        base_css += content[last_pos:start]
        last_pos = end
    
    # Add remaining content after last theme block
    base_css += content[last_pos:]
    
    # Clean up extra whitespace
    base_css = re.sub(r'\n\s*\n\s*\n', '\n\n', base_css)
    base_css = base_css.strip()
    
    # Write base CSS to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("/* Base CSS (non-theme styles) */\n\n")
        f.write(base_css)
    
    print(f"Extracted base CSS to {output_file}")
    print(f"Removed {len(theme_positions)} theme blocks")

if __name__ == "__main__":
    css_file = "styles/retrofuture-theme.css"
    output_file = "base.css"
    
    extract_base_css(css_file, output_file)
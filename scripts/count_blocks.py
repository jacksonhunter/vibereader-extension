import re

def count_css_blocks(file_path):
    """Count CSS rule blocks in a file"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return 0, f"File not found: {file_path}"
    
    # Count opening braces that start CSS blocks
    # This regex finds selectors followed by opening braces
    # Excludes braces inside strings and comments
    
    # Remove CSS comments first
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove strings to avoid counting braces inside them
    content = re.sub(r'"[^"]*"', '""', content)
    content = re.sub(r"'[^']*'", "''", content)
    
    # Count opening braces that start rule blocks
    # Look for patterns like "selector {" but exclude media queries and keyframes
    blocks = len(re.findall(r'\{', content))
    
    return blocks, None

def count_theme_blocks(file_path):
    """Count specifically theme blocks [data-theme="..."]"""
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return 0, f"File not found: {file_path}"
    
    # Count [data-theme="..."] selectors
    theme_blocks = len(re.findall(r'\[data-theme="[^"]+"\]', content))
    
    return theme_blocks, None

if __name__ == "__main__":
    files = [
        "styles/retrofuture-theme.css",
        "styles/matrix-theme.css",
        "base.css", 
        "themes_v2.css"
    ]
    
    print("CSS Block Count Analysis:")
    print("=" * 50)
    
    total_blocks = {}
    theme_blocks = {}
    
    for file_path in files:
        blocks, error = count_css_blocks(file_path)
        themes, _ = count_theme_blocks(file_path)
        
        if error:
            print(f"{file_path}: {error}")
        else:
            total_blocks[file_path] = blocks
            theme_blocks[file_path] = themes
            print(f"{file_path}:")
            print(f"  Total blocks: {blocks}")
            print(f"  Theme blocks: {themes}")
            print()
    
    # Verify extraction
    original = total_blocks.get("styles/retrofuture-theme.css", 0)
    base = total_blocks.get("base.css", 0)
    themes = total_blocks.get("themes_v2.css", 0)
    
    print("Verification:")
    print(f"Original: {original}")
    print(f"Base: {base}")
    print(f"Themes: {themes}")
    print(f"Base + Themes: {base + themes}")
    print(f"Match: {'OK' if original == base + themes else 'NO'}")
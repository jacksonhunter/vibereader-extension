import re

def analyze_animations(css_file):
    """Check if all animations have corresponding keyframes"""
    
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all animation references
    animation_pattern = r'animation:\s*([^;,\n]+)'
    animation_matches = re.findall(animation_pattern, content)
    
    # Extract animation names from animation declarations
    used_animations = set()
    for match in animation_matches:
        # Parse animation shorthand: name duration timing-function etc
        parts = match.strip().split()
        if parts:
            # Animation name is typically the first part (unless it starts with a duration)
            first_part = parts[0]
            if not re.match(r'^\d+\.?\d*s?$', first_part):  # Not a duration
                used_animations.add(first_part)
    
    # Find all keyframe definitions
    keyframes_pattern = r'@keyframes\s+([^{\s]+)'
    keyframes_matches = re.findall(keyframes_pattern, content)
    defined_keyframes = set(keyframes_matches)
    
    print("=== Animation Analysis ===\n")
    print(f"Used animations: {len(used_animations)}")
    print(f"Defined keyframes: {len(defined_keyframes)}")
    print()
    
    # Check for missing keyframes
    missing_keyframes = used_animations - defined_keyframes
    if missing_keyframes:
        print(f"MISSING KEYFRAMES ({len(missing_keyframes)}):")
        for name in sorted(missing_keyframes):
            print(f"  @keyframes {name} - MISSING")
        print()
    
    # Check for unused keyframes  
    unused_keyframes = defined_keyframes - used_animations
    if unused_keyframes:
        print(f"UNUSED KEYFRAMES ({len(unused_keyframes)}):")
        for name in sorted(unused_keyframes):
            print(f"  @keyframes {name} - NOT USED")
        print()
    
    # Show matched pairs
    matched = used_animations.intersection(defined_keyframes)
    if matched:
        print(f"MATCHED ANIMATIONS ({len(matched)}):")
        for name in sorted(matched):
            print(f"  {name}")
        print()
    
    print("=== DETAILED ANIMATION LIST ===")
    print("Used in animation declarations:")
    for name in sorted(used_animations):
        status = "OK" if name in defined_keyframes else "BAD"
        print(f"  {status} {name}")
    
    print(f"\nDefined keyframes:")
    for name in sorted(defined_keyframes):
        status = "OK" if name in used_animations else "UNUSED"
        print(f"  {status} {name}")
    
    return len(missing_keyframes) == 0

if __name__ == "__main__":
    css_file = "base_v2_clean.css"
    all_good = analyze_animations(css_file)
    
    if all_good:
        print(f"\nSUCCESS: All animations have keyframes!")
    else:
        print(f"\nWARNING: Some animations are missing keyframes!")
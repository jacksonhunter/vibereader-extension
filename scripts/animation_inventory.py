import re
import os

def analyze_animations_comprehensive():
    """Comprehensive animation analysis across all CSS files"""
    
    files_to_check = [
        ("Current base_v2_clean.css", "base_v2_clean.css"),
        ("Legacy base.css", r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\base.css"),
        ("Legacy themes.css", r"C:\Users\jacks\PycharmProjects\NightDrive theme\theme_exports\synthwave-themes\vibe-reader-extension\legacy\styles\themes.css")
    ]
    
    all_animations = {}  # {animation_name: [files_used_in]}
    all_keyframes = {}   # {keyframe_name: [files_defined_in]}
    
    print("=== COMPREHENSIVE ANIMATION INVENTORY ===\n")
    
    for file_desc, file_path in files_to_check:
        if not os.path.exists(file_path):
            print(f"ERROR: {file_desc}: FILE NOT FOUND")
            continue
            
        print(f"Analyzing {file_desc}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find animations used
        animation_pattern = r'animation:\s*([^;,\n]+)'
        animation_matches = re.findall(animation_pattern, content)
        
        used_animations = set()
        for match in animation_matches:
            parts = match.strip().split()
            if parts:
                first_part = parts[0]
                if not re.match(r'^\d+\.?\d*s?$', first_part):
                    used_animations.add(first_part)
                    if first_part not in all_animations:
                        all_animations[first_part] = []
                    all_animations[first_part].append(file_desc)
        
        # Find keyframes defined
        keyframes_pattern = r'@keyframes\s+([^{\s]+)'
        keyframes_matches = re.findall(keyframes_pattern, content)
        
        defined_keyframes = set(keyframes_matches)
        for keyframe in defined_keyframes:
            if keyframe not in all_keyframes:
                all_keyframes[keyframe] = []
            all_keyframes[keyframe].append(file_desc)
        
        print(f"   Used animations: {len(used_animations)}")
        print(f"   Defined keyframes: {len(defined_keyframes)}")
        print()
    
    return all_animations, all_keyframes

def create_animation_report(all_animations, all_keyframes):
    """Create detailed animation status report"""
    
    print("=== ANIMATION STATUS REPORT ===\n")
    
    # Find current working animations (in base_v2_clean.css)
    current_animations = set()
    current_keyframes = set()
    
    for anim, files in all_animations.items():
        if "Current base_v2_clean.css" in files:
            current_animations.add(anim)
    
    for keyframe, files in all_keyframes.items():
        if "Current base_v2_clean.css" in files:
            current_keyframes.add(keyframe)
    
    # 1. IMPLEMENTED ANIMATIONS
    working_animations = current_animations.intersection(current_keyframes)
    print(f"IMPLEMENTED & WORKING ANIMATIONS ({len(working_animations)}):")
    for anim in sorted(working_animations):
        print(f"   {anim}")
        # Show where keyframe is defined
        keyframe_files = all_keyframes.get(anim, [])
        if len(keyframe_files) > 1:
            print(f"      (also defined in: {', '.join([f for f in keyframe_files if f != 'Current base_v2_clean.css'])})")
    print()
    
    # 2. UNUSED KEYFRAMES IN CURRENT
    unused_current = current_keyframes - current_animations
    print(f"UNUSED KEYFRAMES IN CURRENT ({len(unused_current)}):")
    for keyframe in sorted(unused_current):
        legacy_usage = []
        for anim, files in all_animations.items():
            if anim == keyframe and "Current base_v2_clean.css" not in files:
                legacy_usage.extend(files)
        
        if legacy_usage:
            print(f"   {keyframe} (used in legacy: {', '.join(set(legacy_usage))})")
        else:
            print(f"   {keyframe} (never used)")
    print()
    
    # 3. LEGACY ANIMATIONS NOT IN CURRENT
    legacy_only_animations = set()
    legacy_only_keyframes = set()
    
    for anim, files in all_animations.items():
        if "Current base_v2_clean.css" not in files:
            legacy_only_animations.add(anim)
    
    for keyframe, files in all_keyframes.items():
        if "Current base_v2_clean.css" not in files:
            legacy_only_keyframes.add(keyframe)
    
    print(f"LEGACY-ONLY ANIMATIONS ({len(legacy_only_animations)}):")
    for anim in sorted(legacy_only_animations):
        files = all_animations[anim]
        has_keyframe = anim in legacy_only_keyframes
        keyframe_status = "OK has keyframe" if has_keyframe else "BAD missing keyframe"
        print(f"   {anim} - {keyframe_status} (in: {', '.join(files)})")
    print()
    
    # 4. THEME-SPECIFIC ANIMATIONS
    theme_animations = {}
    for anim in legacy_only_animations:
        files = all_animations[anim]
        if any("themes.css" in f for f in files):
            for theme in ["neon-surge", "storm", "phantom", "underground", "nightdrive"]:
                if theme in anim:
                    if theme not in theme_animations:
                        theme_animations[theme] = []
                    theme_animations[theme].append(anim)
    
    if theme_animations:
        print(f"THEME-SPECIFIC ANIMATIONS:")
        for theme, anims in theme_animations.items():
            print(f"   {theme.upper()}: {', '.join(anims)}")
        print()
    
    # 5. SUMMARY STATISTICS
    print("=== SUMMARY STATISTICS ===")
    print(f"Total unique animation names across all files: {len(all_animations)}")
    print(f"Total unique keyframe names across all files: {len(all_keyframes)}")
    print(f"Currently implemented (working): {len(working_animations)}")
    print(f"Currently unused keyframes: {len(unused_current)}")
    print(f"Legacy-only animations: {len(legacy_only_animations)}")
    print(f"Legacy-only keyframes: {len(legacy_only_keyframes)}")

if __name__ == "__main__":
    all_animations, all_keyframes = analyze_animations_comprehensive()
    create_animation_report(all_animations, all_keyframes)
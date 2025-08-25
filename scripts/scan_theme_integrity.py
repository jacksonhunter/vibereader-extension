import re
import os

def scan_retrofuture_elements():
    """Scan styles/retrofuture-theme.css for all CSS elements and count their occurrences"""
    
    retrofuture_file = "styles/retrofuture-theme.css"
    if not os.path.exists(retrofuture_file):
        print(f"ERROR: {retrofuture_file} not found")
        return None, None, None
    
    with open(retrofuture_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract CSS classes (including pseudo-classes and attribute selectors)
    class_pattern = r'\.([a-zA-Z0-9_-]+)(?:[:\[#]?[^,{]*)?'
    class_matches = re.findall(class_pattern, content)
    
    # Count class occurrences
    class_counts = {}
    for class_name in class_matches:
        class_counts[class_name] = class_counts.get(class_name, 0) + 1
    
    # Extract keyframes
    keyframe_pattern = r'@keyframes\s+([a-zA-Z0-9_-]+)'
    keyframe_matches = re.findall(keyframe_pattern, content)
    keyframe_counts = {}
    for keyframe in keyframe_matches:
        keyframe_counts[keyframe] = keyframe_counts.get(keyframe, 0) + 1
    
    # Extract animation references
    animation_pattern = r'animation(?:-name)?:\s*([a-zA-Z0-9_-]+)'
    animation_matches = re.findall(animation_pattern, content)
    animation_counts = {}
    for animation in animation_matches:
        # Filter out timing values and keywords
        if not re.match(r'^(\d+\.?\d*s?|ease|linear|infinite|alternate|forwards|backwards)$', animation):
            animation_counts[animation] = animation_counts.get(animation, 0) + 1
    
    # Extract CSS variables
    variable_pattern = r'--([a-zA-Z0-9_-]+)'
    variable_matches = re.findall(variable_pattern, content)
    variable_counts = {}
    for variable in variable_matches:
        variable_counts[variable] = variable_counts.get(variable, 0) + 1
    
    return class_counts, keyframe_counts, animation_counts, variable_counts

def scan_current_implementation():
    """Scan both base_v2_clean.css and themes_v2.css for comprehensive comparison"""
    
    files_to_scan = [
        ("base_v2_clean.css", "base_v2_clean.css"),
        ("themes_v2.css", "themes_v2.css")
    ]
    
    combined_content = ""
    
    for file_desc, file_path in files_to_scan:
        if not os.path.exists(file_path):
            print(f"WARNING: {file_path} not found")
            continue
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            combined_content += content + "\n"
    
    content = combined_content
    
    # Extract the same elements as retrofuture scan
    class_pattern = r'\.([a-zA-Z0-9_-]+)(?:[:\[#]?[^,{]*)?'
    class_matches = re.findall(class_pattern, content)
    class_counts = {}
    for class_name in class_matches:
        class_counts[class_name] = class_counts.get(class_name, 0) + 1
    
    keyframe_pattern = r'@keyframes\s+([a-zA-Z0-9_-]+)'
    keyframe_matches = re.findall(keyframe_pattern, content)
    keyframe_counts = {}
    for keyframe in keyframe_matches:
        keyframe_counts[keyframe] = keyframe_counts.get(keyframe, 0) + 1
    
    animation_pattern = r'animation(?:-name)?:\s*([a-zA-Z0-9_-]+)'
    animation_matches = re.findall(animation_pattern, content)
    animation_counts = {}
    for animation in animation_matches:
        if not re.match(r'^(\d+\.?\d*s?|ease|linear|infinite|alternate|forwards|backwards)$', animation):
            animation_counts[animation] = animation_counts.get(animation, 0) + 1
    
    variable_pattern = r'--([a-zA-Z0-9_-]+)'
    variable_matches = re.findall(variable_pattern, content)
    variable_counts = {}
    for variable in variable_matches:
        variable_counts[variable] = variable_counts.get(variable, 0) + 1
    
    return class_counts, keyframe_counts, animation_counts, variable_counts

def compare_theme_integrity():
    """Compare retrofuture-theme.css elements with current implementation (base + themes)"""
    
    print("=== THEME INTEGRITY SCAN ===\n")
    
    # Scan both files
    retro_classes, retro_keyframes, retro_animations, retro_variables = scan_retrofuture_elements()
    current_classes, current_keyframes, current_animations, current_variables = scan_current_implementation()
    
    if not all([retro_classes, current_classes]):
        return
    
    print(f"RETROFUTURE-THEME.CSS INVENTORY:")
    print(f"  Classes: {len(retro_classes)} unique")
    print(f"  Keyframes: {len(retro_keyframes)} unique") 
    print(f"  Animation references: {len(retro_animations)} unique")
    print(f"  CSS variables: {len(retro_variables)} unique")
    print()
    
    print(f"CURRENT IMPLEMENTATION (BASE + THEMES) INVENTORY:")
    print(f"  Classes: {len(current_classes)} unique")
    print(f"  Keyframes: {len(current_keyframes)} unique")
    print(f"  Animation references: {len(current_animations)} unique") 
    print(f"  CSS variables: {len(current_variables)} unique")
    print()
    
    # Check class preservation
    missing_classes = []
    preserved_classes = []
    
    for class_name, count in retro_classes.items():
        if class_name in current_classes:
            preserved_classes.append((class_name, count, current_classes[class_name]))
        else:
            missing_classes.append((class_name, count))
    
    print(f"CLASS PRESERVATION ANALYSIS:")
    print(f"  PRESERVED: {len(preserved_classes)}/{len(retro_classes)} classes")
    print(f"  MISSING: {len(missing_classes)} classes")
    
    if missing_classes:
        print(f"\n  MISSING CLASSES:")
        for class_name, original_count in missing_classes[:10]:  # Show first 10
            print(f"    .{class_name} (appeared {original_count}x in retrofuture)")
        if len(missing_classes) > 10:
            print(f"    ... and {len(missing_classes) - 10} more")
    
    # Check keyframe preservation  
    missing_keyframes = []
    preserved_keyframes = []
    
    for keyframe, count in retro_keyframes.items():
        if keyframe in current_keyframes:
            preserved_keyframes.append((keyframe, count, current_keyframes[keyframe]))
        else:
            missing_keyframes.append((keyframe, count))
    
    print(f"\nKEYFRAME PRESERVATION ANALYSIS:")
    print(f"  PRESERVED: {len(preserved_keyframes)}/{len(retro_keyframes)} keyframes")
    print(f"  MISSING: {len(missing_keyframes)} keyframes")
    
    if missing_keyframes:
        print(f"\n  MISSING KEYFRAMES:")
        for keyframe, original_count in missing_keyframes:
            print(f"    @keyframes {keyframe} (defined {original_count}x in retrofuture)")
    
    # Check animation preservation
    missing_animations = []
    preserved_animations = []
    
    for animation, count in retro_animations.items():
        if animation in current_animations:
            preserved_animations.append((animation, count, current_animations[animation]))
        else:
            missing_animations.append((animation, count))
    
    print(f"\nANIMATION REFERENCE ANALYSIS:")
    print(f"  PRESERVED: {len(preserved_animations)}/{len(retro_animations)} animation references")
    print(f"  MISSING: {len(missing_animations)} animation references")
    
    if missing_animations:
        print(f"\n  MISSING ANIMATION REFERENCES:")
        for animation, original_count in missing_animations:
            print(f"    animation: {animation} (used {original_count}x in retrofuture)")
    
    # Check variable preservation
    missing_variables = []
    preserved_variables = []
    
    for variable, count in retro_variables.items():
        if variable in current_variables:
            preserved_variables.append((variable, count, current_variables[variable]))
        else:
            missing_variables.append((variable, count))
    
    print(f"\nCSS VARIABLE ANALYSIS:")
    print(f"  PRESERVED: {len(preserved_variables)}/{len(retro_variables)} variables")
    print(f"  MISSING: {len(missing_variables)} variables")
    
    if missing_variables:
        print(f"\n  MISSING VARIABLES:")
        for variable, original_count in missing_variables[:10]:  # Show first 10
            print(f"    --{variable} (used {original_count}x in retrofuture)")
        if len(missing_variables) > 10:
            print(f"    ... and {len(missing_variables) - 10} more")
    
    # Summary score
    total_elements = len(retro_classes) + len(retro_keyframes) + len(retro_animations) + len(retro_variables)
    preserved_elements = len(preserved_classes) + len(preserved_keyframes) + len(preserved_animations) + len(preserved_variables)
    
    if total_elements > 0:
        integrity_score = (preserved_elements / total_elements) * 100
        print(f"\n=== INTEGRITY SCORE ===")
        print(f"Overall preservation: {preserved_elements}/{total_elements} elements ({integrity_score:.1f}%)")
        
        if integrity_score >= 95:
            print("EXCELLENT - Nearly complete theme preservation")
        elif integrity_score >= 85:
            print("GOOD - Most theme elements preserved")
        elif integrity_score >= 70:
            print("FAIR - Some theme elements missing")
        else:
            print("POOR - Significant theme elements missing")
    
    # Detailed count comparison for preserved elements
    print(f"\n=== USAGE COUNT CHANGES ===")
    
    count_changes = []
    for class_name, retro_count, themes_count in preserved_classes:
        if retro_count != themes_count:
            count_changes.append(('class', class_name, retro_count, themes_count))
    
    for keyframe, retro_count, themes_count in preserved_keyframes:
        if retro_count != themes_count:
            count_changes.append(('keyframe', keyframe, retro_count, themes_count))
    
    for animation, retro_count, themes_count in preserved_animations:
        if retro_count != themes_count:
            count_changes.append(('animation', animation, retro_count, themes_count))
    
    for variable, retro_count, themes_count in preserved_variables:
        if retro_count != themes_count:
            count_changes.append(('variable', variable, retro_count, themes_count))
    
    if count_changes:
        print(f"Elements with changed usage counts: {len(count_changes)}")
        for element_type, name, retro_count, themes_count in count_changes[:10]:
            direction = "UP" if themes_count > retro_count else "DOWN"
            print(f"  {element_type} '{name}': {retro_count} -> {themes_count} {direction}")
        if len(count_changes) > 10:
            print(f"  ... and {len(count_changes) - 10} more with count changes")
    else:
        print("All preserved elements have identical usage counts")

if __name__ == "__main__":
    compare_theme_integrity()
import re
import os

def get_missing_classes_details():
    """Get detailed information about missing classes from retrofuture-theme.css"""
    
    # Run the scan first to get missing classes
    retrofuture_file = "styles/retrofuture-theme.css"
    if not os.path.exists(retrofuture_file):
        print(f"ERROR: {retrofuture_file} not found")
        return []
    
    # Scan current implementation (base + themes)
    files_to_scan = [
        ("base_v2_clean.css", "base_v2_clean.css"),
        ("themes_v2.css", "themes_v2.css")
    ]
    
    combined_content = ""
    for file_desc, file_path in files_to_scan:
        if not os.path.exists(file_path):
            continue
        with open(file_path, 'r', encoding='utf-8') as f:
            combined_content += f.read() + "\n"
    
    # Get classes from both files
    class_pattern = r'\.([a-zA-Z0-9_-]+)(?:[:\[#]?[^,{]*)?'
    
    # Retrofuture classes
    with open(retrofuture_file, 'r', encoding='utf-8') as f:
        retro_content = f.read()
    
    retro_classes = re.findall(class_pattern, retro_content)
    current_classes = re.findall(class_pattern, combined_content)
    
    retro_class_set = set(retro_classes)
    current_class_set = set(current_classes)
    
    missing_classes = retro_class_set - current_class_set
    
    print("=== MISSING CLASSES FROM RETROFUTURE-THEME.CSS ===\n")
    
    missing_details = []
    
    for missing_class in sorted(missing_classes):
        # Find all occurrences in retrofuture to understand usage
        class_usages = []
        
        # Look for the class in different contexts
        patterns_to_check = [
            f'\\.{re.escape(missing_class)}\\b',  # Basic class selector
            f'\\.{re.escape(missing_class)}:',    # With pseudo-class
            f'\\.{re.escape(missing_class)}\\[',  # With attribute selector
            f'\\.{re.escape(missing_class)},',    # In selector list
            f'\\.{re.escape(missing_class)} \\{{', # With opening brace
        ]
        
        for pattern in patterns_to_check:
            matches = list(re.finditer(pattern, retro_content, re.IGNORECASE))
            for match in matches:
                # Get context around the match
                start = max(0, match.start() - 100)
                end = min(len(retro_content), match.end() + 100)
                context = retro_content[start:end]
                
                # Extract the CSS rule
                rule_start = context.rfind('\n', 0, match.start() - start)
                rule_end = context.find('}', match.end() - start)
                
                if rule_start != -1 and rule_end != -1:
                    rule = context[rule_start:rule_end].strip()
                    if rule and rule not in class_usages:
                        class_usages.append(rule)
        
        missing_details.append({
            'class': missing_class,
            'usages': class_usages[:3],  # Limit to first 3 usages
            'count': retro_classes.count(missing_class)
        })
    
    return missing_details

def analyze_missing_class_purposes(missing_details):
    """Analyze what purposes the missing classes serve"""
    
    categorized = {
        'UI Components': [],
        'Layout Elements': [],
        'Typography': [],
        'Media/Images': [],
        'Terminal/Console': [],
        'Animations/Effects': [],
        'Theme-specific': [],
        'Utility/Spacing': [],
        'Unknown': []
    }
    
    for detail in missing_details:
        class_name = detail['class']
        usages = detail['usages']
        
        # Categorize based on class name and usage patterns
        if any(keyword in class_name.lower() for keyword in ['button', 'btn', 'control', 'icon', 'input']):
            categorized['UI Components'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['header', 'footer', 'container', 'wrapper', 'panel']):
            categorized['Layout Elements'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['title', 'heading', 'text', 'font', 'decorator']):
            categorized['Typography'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['media', 'image', 'emoji', 'ascii', 'canvas']):
            categorized['Media/Images'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['terminal', 'console', 'cmd', 'shell']):
            categorized['Terminal/Console'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['glow', 'pulse', 'flicker', 'scan', 'anim']):
            categorized['Animations/Effects'].append(detail)
        elif any(keyword in class_name.lower() for keyword in ['theme', 'neon', 'cyber', 'matrix', 'retro']):
            categorized['Theme-specific'].append(detail)
        elif re.match(r'^[0-9]+$', class_name) or re.match(r'^[0-9]+[a-z]{2}$', class_name):
            categorized['Utility/Spacing'].append(detail)
        else:
            categorized['Unknown'].append(detail)
    
    return categorized

if __name__ == "__main__":
    missing_details = get_missing_classes_details()
    
    print(f"Total missing classes: {len(missing_details)}\n")
    
    if not missing_details:
        print("No missing classes found!")
        exit()
    
    # Show all missing classes with their usage context
    for detail in missing_details:
        print(f"CLASS: {detail['class']} (used {detail['count']}x)")
        if detail['usages']:
            print("  Usage contexts:")
            for i, usage in enumerate(detail['usages'][:2], 1):  # Show max 2 usages
                # Clean up the usage string
                cleaned = ' '.join(usage.split())
                if len(cleaned) > 80:
                    cleaned = cleaned[:80] + "..."
                print(f"    {i}. {cleaned}")
        else:
            print("  No clear usage context found")
        print()
    
    # Categorize missing classes
    print("\n" + "="*60)
    print("MISSING CLASSES BY CATEGORY")
    print("="*60)
    
    categorized = analyze_missing_class_purposes(missing_details)
    
    for category, classes in categorized.items():
        if classes:
            print(f"\n{category.upper()} ({len(classes)} classes):")
            for detail in classes:
                print(f"  - {detail['class']} (used {detail['count']}x)")
    
    print(f"\n" + "="*60)
    print("SUMMARY RECOMMENDATIONS")
    print("="*60)
    
    print("\n1. HIGH PRIORITY (Core functionality):")
    high_priority = []
    for category in ['UI Components', 'Layout Elements', 'Media/Images']:
        high_priority.extend(categorized[category])
    
    if high_priority:
        for detail in high_priority[:5]:  # Top 5
            print(f"   - {detail['class']}: Likely needed for core UI functionality")
    else:
        print("   - No high priority classes identified")
    
    print("\n2. MEDIUM PRIORITY (Visual enhancements):")
    medium_priority = []
    for category in ['Typography', 'Animations/Effects', 'Theme-specific']:
        medium_priority.extend(categorized[category])
        
    if medium_priority:
        for detail in medium_priority[:3]:  # Top 3
            print(f"   - {detail['class']}: Visual enhancement or theme-specific styling")
    else:
        print("   - No medium priority classes identified")
    
    print("\n3. LOW PRIORITY (Utilities/Unknown):")
    low_priority = []
    for category in ['Utility/Spacing', 'Terminal/Console', 'Unknown']:
        low_priority.extend(categorized[category])
        
    if low_priority:
        for detail in low_priority[:3]:  # Top 3  
            print(f"   - {detail['class']}: Utility class or unclear purpose")
    else:
        print("   - No low priority classes identified")
    
    print(f"\n4. NUMERIC CLASSES (Likely CSS parsing artifacts):")
    numeric_classes = [d for d in missing_details if re.match(r'^[0-9]+', d['class'])]
    if numeric_classes:
        print(f"   Found {len(numeric_classes)} numeric classes - likely CSS parsing errors")
        for detail in numeric_classes[:5]:  # Show first 5
            print(f"   - .{detail['class']}")
    else:
        print("   - No numeric classes found")
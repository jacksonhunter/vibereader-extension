import re
import os

def analyze_animation_details():
    """Detailed analysis of our 35 implemented animations"""
    
    # Read the CSS file to analyze targets and contexts
    with open("base_v2_clean.css", 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    # Read JavaScript files to check for animation triggers
    js_files = ["background-enhanced.js", "stealth-extractor.js", "proxy-controller.js"]
    js_content = ""
    for js_file in js_files:
        if os.path.exists(js_file):
            with open(js_file, 'r', encoding='utf-8') as f:
                js_content += f.read() + "\n"
    
    animations = [
        'ascii-fade-in', 'ascii-loading', 'categoryExpand', 'component-scan',
        'converting-pulse', 'cursor-blink', 'cyber-pulse', 'cyber-scan',
        'data-stream', 'decorator-pulse', 'emoji-pulse', 'enhanced-glow-pulse',
        'glass-shimmer', 'glitch-1', 'glitch-2', 'header-scan', 'heading-pulse',
        'led-pulse', 'led-pulse-green', 'loading-progress', 'loading-sweep',
        'matrix-fall', 'media-materialize', 'meta-pulse', 'neon-flicker',
        'nightdrive-pulse', 'phantom-flicker', 'progress-shine', 'pulse-glow',
        'retro-glow', 'scanlines', 'signature-glow', 'slide-in-left',
        'slide-in-right', 'title-pulse'
    ]
    
    print("=== DETAILED ANIMATION CATALOG ===\n")
    
    animation_details = {}
    
    for anim in animations:
        details = analyze_single_animation(anim, css_content, js_content)
        animation_details[anim] = details
    
    # Categorize animations
    categories = {
        'Background Effects': [],
        'UI Component Animations': [],
        'Text Effects': [],
        'Media System': [],
        'Loading & Progress': [],
        'Interactive Feedback': [],
        'Layout Transitions': [],
        'Status Indicators': []
    }
    
    for anim, details in animation_details.items():
        category = categorize_animation(anim, details)
        categories[category].append((anim, details))
    
    # Print categorized results
    for category, anims in categories.items():
        if anims:
            print(f"## {category.upper()} ({len(anims)})")
            print()
            for anim_name, details in anims:
                print(f"**{anim_name}**")
                print(f"   Target: {details['target']}")
                print(f"   Trigger: {details['trigger']}")
                print(f"   Purpose: {details['purpose']}")
                print(f"   Duration: {details['duration']}")
                print(f"   JavaScript: {details['js_support']}")
                if details['css_classes']:
                    print(f"   Classes: {', '.join(details['css_classes'][:3])}{'...' if len(details['css_classes']) > 3 else ''}")
                print()
    
    return animation_details

def analyze_single_animation(anim_name, css_content, js_content):
    """Analyze a single animation for targets, triggers, and purpose"""
    
    # Find where this animation is used in CSS
    pattern = f"animation:.*{re.escape(anim_name)}"
    matches = re.finditer(pattern, css_content, re.IGNORECASE)
    
    css_classes = []
    target_contexts = []
    
    for match in matches:
        # Find the selector that contains this animation
        start_pos = match.start()
        # Look backward to find the selector
        selector_start = css_content.rfind('{', 0, start_pos)
        if selector_start != -1:
            selector_text = css_content.rfind('\n', 0, selector_start)
            if selector_text != -1:
                selector_line = css_content[selector_text:selector_start].strip()
                css_classes.append(selector_line)
        
        # Get context around the animation
        context_start = max(0, start_pos - 100)
        context_end = min(len(css_content), start_pos + 100)
        context = css_content[context_start:context_end]
        target_contexts.append(context)
    
    # Extract duration from animation declaration
    duration_pattern = f"animation:.*{re.escape(anim_name)}[^;]*?(\\d+(?:\\.\\d+)?s)"
    duration_match = re.search(duration_pattern, css_content, re.IGNORECASE)
    duration = duration_match.group(1) if duration_match else "unknown"
    
    # Check if referenced in JavaScript
    js_refs = []
    anim_refs = [anim_name, anim_name.replace('-', '_'), anim_name.replace('-', '')]
    for ref in anim_refs:
        if ref in js_content:
            js_refs.append(ref)
    
    # Determine purpose and trigger based on name and context
    purpose = determine_purpose(anim_name, css_classes)
    trigger = determine_trigger(anim_name, css_classes, js_content)
    target = determine_target(anim_name, css_classes)
    
    return {
        'target': target,
        'trigger': trigger,
        'purpose': purpose,
        'duration': duration,
        'css_classes': css_classes,
        'js_support': 'YES' if js_refs else 'NO',
        'js_references': js_refs
    }

def determine_purpose(anim_name, css_classes):
    """Determine the purpose of an animation"""
    
    purpose_map = {
        'matrix-fall': 'Digital rain background effect',
        'scanlines': 'CRT monitor scanline overlay',
        'glitch-1': 'Text corruption effect (primary)',
        'glitch-2': 'Text corruption effect (secondary)',
        'neon-flicker': 'Neon light flickering simulation',
        'header-scan': 'Header scanning beam effect',
        'component-scan': 'Interactive element scanning overlay',
        'enhanced-glow-pulse': 'API-compliant multi-color glow effect',
        'cyber-scan': 'Cyberpunk scanning animation',
        'cyber-pulse': 'Cyberpunk pulsing effect',
        'title-pulse': 'Title text pulsing animation',
        'meta-pulse': 'Metadata pulsing effect',
        'heading-pulse': 'Heading decoration pulsing',
        'decorator-pulse': 'Decorative element pulsing',
        'signature-glow': 'Footer signature glow effect',
        'pulse-glow': 'General glow pulsing animation',
        'ascii-loading': 'ASCII art loading animation',
        'ascii-fade-in': 'ASCII content fade-in transition',
        'media-materialize': 'Media element appearance effect',
        'emoji-pulse': 'Emoji icon pulsing animation',
        'converting-pulse': 'Content conversion feedback',
        'loading-progress': 'Progress bar filling animation',
        'loading-sweep': 'Loading sweep effect',
        'progress-shine': 'Progress indicator shine effect',
        'slide-in-left': 'Left panel slide-in transition',
        'slide-in-right': 'Right panel slide-in transition',
        'data-stream': 'Data streaming animation',
        'cursor-blink': 'Terminal cursor blinking',
        'led-pulse': 'Status LED pulsing (default)',
        'led-pulse-green': 'Status LED pulsing (success)',
        'nightdrive-pulse': 'Nightdrive theme-specific pulsing',
        'phantom-flicker': 'Strange Days theme phantom flicker',
        'glass-shimmer': 'Glass morphism shimmer effect',
        'retro-glow': 'Retro-style glow animation',
        'categoryExpand': 'Category expansion animation'
    }
    
    return purpose_map.get(anim_name, 'Unknown purpose')

def determine_trigger(anim_name, css_classes, js_content):
    """Determine when/how an animation is triggered"""
    
    # Check for hover triggers
    hover_triggers = any(':hover' in cls for cls in css_classes)
    if hover_triggers:
        return 'On hover'
    
    # Check for loading/state-based triggers
    loading_triggers = any(word in anim_name for word in ['loading', 'progress', 'converting'])
    if loading_triggers:
        return 'During loading/processing'
    
    # Check for automatic/continuous animations
    continuous = any(word in anim_name for word in ['pulse', 'flicker', 'scan', 'fall', 'blink', 'shimmer'])
    if continuous:
        return 'Automatic/continuous'
    
    # Check for transition animations
    transitions = any(word in anim_name for word in ['fade', 'slide', 'materialize', 'expand'])
    if transitions:
        return 'On state change'
    
    # Check for JavaScript triggers
    if any(ref in js_content for ref in [anim_name, anim_name.replace('-', '_')]):
        return 'JavaScript controlled'
    
    return 'CSS-only automatic'

def determine_target(anim_name, css_classes):
    """Determine what element/component the animation targets"""
    
    if not css_classes:
        return 'Unknown target'
    
    # Take the first/most relevant class
    main_class = css_classes[0] if css_classes else ''
    
    target_map = {
        'matrix-drop': 'Matrix rain drops',
        'vibe-rain-container': 'Rain container',
        'retrofuture-bg-effects': 'Background scanlines',
        'vibe-brand': 'Brand/logo text',
        'vibe-header': 'Header section',
        'vibe-title': 'Main title',
        'vibe-article': 'Article content',
        'terminal-': 'Terminal windows',
        'led-indicator': 'Status LEDs',
        'media-': 'Media elements',
        'ascii-': 'ASCII content',
        'emoji-': 'Emoji icons',
        'progress-': 'Progress indicators',
        'cyber-': 'Cyberpunk elements',
        '.glitch': 'Text with glitch effect',
        'loading': 'Loading elements'
    }
    
    for key, description in target_map.items():
        if key in main_class:
            return description
    
    return main_class or 'Generic elements'

def categorize_animation(anim_name, details):
    """Categorize animation by its primary function"""
    
    if any(word in anim_name for word in ['matrix', 'scanlines', 'rain']):
        return 'Background Effects'
    elif any(word in anim_name for word in ['loading', 'progress', 'converting']):
        return 'Loading & Progress'
    elif any(word in anim_name for word in ['media', 'ascii', 'emoji']):
        return 'Media System'
    elif any(word in anim_name for word in ['slide', 'fade', 'materialize', 'expand']):
        return 'Layout Transitions'
    elif any(word in anim_name for word in ['led', 'cursor', 'blink']):
        return 'Status Indicators'
    elif any(word in anim_name for word in ['pulse', 'glow', 'flicker', 'shimmer']):
        return 'Text Effects'
    elif any(word in anim_name for word in ['scan', 'cyber', 'component']):
        return 'Interactive Feedback'
    else:
        return 'UI Component Animations'

if __name__ == "__main__":
    animation_details = analyze_animation_details()
    
    print("=== JAVASCRIPT INTEGRATION STATUS ===")
    js_supported = sum(1 for details in animation_details.values() if details['js_support'] == 'YES')
    css_only = len(animation_details) - js_supported
    
    print(f"JavaScript-controlled animations: {js_supported}")
    print(f"CSS-only animations: {css_only}")
    print(f"Total implemented: {len(animation_details)}")
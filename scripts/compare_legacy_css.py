#!/usr/bin/env python3
"""
Compare legacy CSS files with current v2 structure to find missing styles
"""

import os
import re
from pathlib import Path

def extract_css_rules(file_path):
    """Extract CSS rules, selectors, and properties from a CSS file"""
    if not os.path.exists(file_path):
        return {"selectors": set(), "properties": set(), "rules": []}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Find all CSS rules
    rules = []
    selectors = set()
    properties = set()
    
    # Match CSS rules: selector { properties }
    rule_pattern = r'([^{}]+)\s*\{([^{}]*)\}'
    matches = re.findall(rule_pattern, content, re.MULTILINE | re.DOTALL)
    
    for selector_part, props_part in matches:
        # Clean up selector
        selector = selector_part.strip()
        if selector:
            selectors.add(selector)
            
            # Extract properties
            prop_matches = re.findall(r'([^:;]+):\s*([^;]+);', props_part)
            rule_props = []
            for prop_name, prop_value in prop_matches:
                prop_name = prop_name.strip()
                prop_value = prop_value.strip()
                properties.add(prop_name)
                rule_props.append((prop_name, prop_value))
            
            if rule_props:
                rules.append((selector, rule_props))
    
    return {"selectors": selectors, "properties": properties, "rules": rules}

def compare_files():
    """Compare legacy files with current v2 files"""
    base_path = Path(__file__).parent.parent
    
    # File paths
    legacy_matrix = base_path / "legacy/styles/matrix-theme.css"
    legacy_retro = base_path / "legacy/styles/retrofuture-theme.css"
    current_base = base_path / "styles/base_v2_clean.css"
    current_themes = base_path / "styles/themes_v2.css"
    
    print("CSS LEGACY COMPARISON ANALYSIS")
    print("=" * 50)
    
    # Extract CSS from all files
    matrix_css = extract_css_rules(legacy_matrix)
    retro_css = extract_css_rules(legacy_retro)
    base_css = extract_css_rules(current_base)
    themes_css = extract_css_rules(current_themes)
    
    # Combine legacy
    legacy_selectors = matrix_css["selectors"] | retro_css["selectors"]
    legacy_properties = matrix_css["properties"] | retro_css["properties"]
    legacy_rules = matrix_css["rules"] + retro_css["rules"]
    
    # Combine current
    current_selectors = base_css["selectors"] | themes_css["selectors"]
    current_properties = base_css["properties"] | themes_css["properties"]
    
    print(f"STATISTICS:")
    print(f"Legacy selectors: {len(legacy_selectors)}")
    print(f"Current selectors: {len(current_selectors)}")
    print(f"Legacy properties: {len(legacy_properties)}")
    print(f"Current properties: {len(current_properties)}")
    
    # Find missing selectors
    missing_selectors = legacy_selectors - current_selectors
    print(f"\nMISSING SELECTORS ({len(missing_selectors)}):")
    for selector in sorted(missing_selectors):
        print(f"  {selector}")
    
    # Find missing properties
    missing_properties = legacy_properties - current_properties
    print(f"\nMISSING PROPERTIES ({len(missing_properties)}):")
    for prop in sorted(missing_properties):
        print(f"  {prop}")
    
    # Look for specific theme-related rules
    print(f"\nTHEME-SPECIFIC ANALYSIS:")
    theme_rules = []
    for selector, props in legacy_rules:
        if any(theme in selector.lower() for theme in ['nightdrive', 'neon-surge', 'outrun-storm', 'strange-days']):
            theme_rules.append((selector, props))
        elif any(keyword in selector for keyword in [':root', '[data-theme']):
            theme_rules.append((selector, props))
    
    print(f"Found {len(theme_rules)} theme-related rules in legacy:")
    for selector, props in theme_rules[:10]:  # Show first 10
        print(f"  {selector}")
        for prop_name, prop_value in props[:3]:  # Show first 3 properties
            print(f"    {prop_name}: {prop_value}")
    
    # Look for overlay/pseudo-element rules
    print(f"\nOVERLAY/PSEUDO-ELEMENT ANALYSIS:")
    overlay_rules = []
    for selector, props in legacy_rules:
        if '::before' in selector or '::after' in selector or 'overlay' in selector.lower():
            overlay_rules.append((selector, props))
    
    print(f"Found {len(overlay_rules)} overlay-related rules in legacy:")
    for selector, props in overlay_rules[:5]:  # Show first 5
        print(f"  {selector}")
        for prop_name, prop_value in props[:2]:  # Show first 2 properties
            print(f"    {prop_name}: {prop_value}")
    
    # Check for variable format issues
    print(f"\nVARIABLE FORMAT ANALYSIS:")
    var_issues = []
    for selector, props in legacy_rules:
        for prop_name, prop_value in props:
            if 'var(' in prop_value:
                var_issues.append((selector, prop_name, prop_value))
    
    print(f"Found {len(var_issues)} variable usages in legacy (first 10):")
    for selector, prop_name, prop_value in var_issues[:10]:
        print(f"  {selector} -> {prop_name}: {prop_value}")

if __name__ == "__main__":
    compare_files()
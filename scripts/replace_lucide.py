#!/usr/bin/env python3
"""Replace lucide-react imports and usages with @hugeicons/react and @hugeicons/core-free-icons."""

import re
import os

# Mapping from Lucide icon names to Hugeicons icon names
ICON_MAP = {
    'BookOpen': 'BookOpen01Icon',
    'Scroll': 'ScrollIcon',
    'Heart': 'HeartIcon',
    'FileText': 'File02Icon',
    'Star': 'StarIcon',
    'BookMarked': 'BookBookmark01Icon',
    'Library': 'LibraryIcon',
    'FileCheck': 'FileCheckIcon',
    'Search': 'Search01Icon',
    'X': 'Cancel01Icon',
    'Clock': 'Clock01Icon',
    'ArrowUp': 'ArrowUp01Icon',
    'ArrowDown': 'ArrowDown01Icon',
    'ArrowLeft': 'ArrowLeft01Icon',
    'ArrowRight': 'ArrowRight01Icon',
    'CornerDownLeft': 'ArrowDownLeft01Icon',
    'Filter': 'FilterIcon',
    'ChevronDown': 'ArrowDown01Icon',
    'ChevronUp': 'ArrowUp01Icon',
    'ChevronLeft': 'ArrowLeft01Icon',
    'ChevronRight': 'ArrowRight01Icon',
    'Home': 'Home01Icon',
    'Type': 'TextIcon',
    'CalendarRange': 'Calendar03Icon',
    'Loader2': 'Loading03Icon',
    'RefreshCw': 'RefreshIcon',
    'AlertCircle': 'AlertCircleIcon',
    'WifiOff': 'WifiOffIcon',
    'CheckCircle': 'CheckmarkCircle01Icon',
    'ExternalLink': 'ArrowUpRight01Icon',
    'AlertTriangle': 'Alert02Icon',
    'Info': 'InformationCircleIcon',
    'Trash2': 'Delete02Icon',
    'Eye': 'ViewIcon',
    'BarChart3': 'ChartBarLineIcon',
    'Download': 'Download04Icon',
    'User': 'UserIcon',
    'Menu': 'Menu01Icon',
    'FileX': 'FileRemoveIcon',
    'Calendar': 'Calendar01Icon',
    'List': 'ListViewIcon',
    'Palette': 'ColorsIcon',
    'History': 'HistoryIcon',
    'Bookmark': 'Bookmark03Icon',
    'Share': 'Share08Icon',
    'Smartphone': 'SmartPhone01Icon',
    'Plus': 'PlusSignIcon',
    'Zap': 'FlashIcon',
    'Bug': 'Bug01Icon',
    'Settings': 'Settings01Icon',
    'Divide': 'PathfinderDivideIcon',
    'Users': 'Group01Icon',
    'ArrowLeftIcon': 'ArrowLeft01Icon',
}

# Size mapping from Tailwind classes to size prop
SIZE_MAP = {
    'w-3 h-3': 14,
    'w-3.5 h-3.5': 14,
    'w-4 h-4': 16,
    'w-5 h-5': 20,
    'w-6 h-6': 24,
    'w-7 h-7': 28,
    'w-8 h-8': 32,
    'w-10 h-10': 40,
    'w-12 h-12': 48,
    'w-16 h-16': 64,
    'w-20 h-20': 80,
}


def extract_lucide_imports(content):
    """Extract imported icon names from lucide-react import lines."""
    pattern = r"import\s+\{\s*([^}]+)\s*\}\s+from\s+['\"]lucide-react['\"];?"
    matches = re.findall(pattern, content)
    icons = []
    for match in matches:
        names = [name.strip() for name in match.split(',') if name.strip()]
        icons.extend(names)
    return icons


def build_new_imports(icons):
    """Build the new import lines for hugeicons."""
    if not icons:
        return ''
    
    hugeicons = ['HugeiconsIcon']
    free_icons = []
    
    for icon in icons:
        if icon in ICON_MAP:
            free_icons.append(ICON_MAP[icon])
        else:
            print(f"WARNING: Unknown icon '{icon}'")
    
    free_icons = sorted(set(free_icons))
    
    lines = []
    lines.append("import { HugeiconsIcon } from '@hugeicons/react';")
    if free_icons:
        lines.append(f"import {{ {', '.join(free_icons)} }} from '@hugeicons/core-free-icons';")
    
    return '\n'.join(lines)


def remove_lucide_imports(content):
    """Remove all lucide-react import lines."""
    pattern = r"import\s+\{\s*[^}]+\s*\}\s+from\s+['\"]lucide-react['\"];?\n?"
    return re.sub(pattern, '', content)


def get_size_from_class(class_name):
    """Extract size prop from Tailwind size classes."""
    # Look for w-X h-X patterns
    for size_class, size in SIZE_MAP.items():
        if size_class in class_name:
            return size
    return None


def replace_icon_usages(content, imported_icons):
    """Replace icon JSX usages like <IconName className="..." /> with <HugeiconsIcon ... />."""
    
    # We need to handle various patterns
    # Pattern 1: <IconName className="..." /> or <IconName className="..." aria-hidden="true" />
    # Pattern 2: <IconName className="..." fill="current" /> -> color="currentColor"
    # Pattern 3: <IconName className="w-4 h-4 text-red-500" />
    
    for icon in imported_icons:
        if icon not in ICON_MAP:
            continue
        
        hugeicon = ICON_MAP[icon]
        
        # Match self-closing tags: <IconName ... />
        # Also match non-self-closing but icons are usually self-closing
        pattern = r'<(' + re.escape(icon) + r')\s+([^/>]*)(/?>)'
        
        def replacer(match):
            attrs = match.group(2)
            closing = match.group(3)
            
            # Extract className
            class_match = re.search(r'className=["\']([^"\']+)["\']', attrs)
            class_name = class_match.group(1) if class_match else ''
            
            # Extract aria-hidden
            aria_hidden_match = re.search(r'aria-hidden=["\']([^"\']+)["\']', attrs)
            aria_hidden = aria_hidden_match.group(1) if aria_hidden_match else None
            
            # Extract fill
            fill_match = re.search(r'fill=["\']([^"\']+)["\']', attrs)
            fill = fill_match.group(1) if fill_match else None
            
            # Determine size
            size = get_size_from_class(class_name)
            
            # Build new className (remove size classes)
            new_class = class_name
            for size_class in SIZE_MAP.keys():
                new_class = new_class.replace(size_class, '').strip()
            new_class = re.sub(r'\s+', ' ', new_class).strip()
            
            # Build the new tag
            props = []
            props.append(f'icon={{{hugeicon}}}')
            if size:
                props.append(f'size={{{size}}}')
            if new_class:
                props.append(f'className="{new_class}"')
            if fill and fill != 'current':
                props.append(f'color="{fill}"')
            if aria_hidden:
                props.append(f'aria-hidden="{aria_hidden}"')
            
            # Handle any remaining props that aren't className, fill, aria-hidden
            remaining = attrs
            # Remove className
            remaining = re.sub(r'\s*className=["\'][^"\']+["\']', '', remaining)
            # Remove fill
            remaining = re.sub(r'\s*fill=["\'][^"\']+["\']', '', remaining)
            # Remove aria-hidden
            remaining = re.sub(r'\s*aria-hidden=["\'][^"\']+["\']', '', remaining)
            remaining = remaining.strip()
            
            if remaining:
                # Handle special case: inline styles or other props we might need
                # Just append them - may need manual review
                props.append(remaining)
            
            return f'<HugeiconsIcon {" ".join(props)} />'
        
        content = re.sub(pattern, replacer, content)
        
        # Also handle <IconName /> with no attributes
        content = re.sub(r'<(' + re.escape(icon) + r')\s*/>', f'<HugeiconsIcon icon={{{hugeicon}}} size={{20}} />', content)
    
    return content


def process_file(filepath):
    """Process a single file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if file has lucide-react imports
    if 'lucide-react' not in content:
        return False
    
    imported_icons = extract_lucide_imports(content)
    if not imported_icons:
        return False
    
    print(f"Processing {filepath} - icons: {imported_icons}")
    
    # Build new imports
    new_imports = build_new_imports(imported_icons)
    
    # Remove old imports
    content = remove_lucide_imports(content)
    
    # Replace icon usages
    content = replace_icon_usages(content, imported_icons)
    
    # Insert new imports after the first 'use client' or import statement
    # Find the first import or 'use client' line
    lines = content.split('\n')
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("import ") or line.startswith("'use "):
            insert_idx = i + 1
    
    # Insert new imports
    lines.insert(insert_idx, new_imports)
    content = '\n'.join(lines)
    
    # Clean up double blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True


def main():
    directories = [
        '/Users/mehranbolhasani/Projects/Ganjeh/src/components',
        '/Users/mehranbolhasani/Projects/Ganjeh/src/app',
    ]
    
    files_processed = []
    
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    filepath = os.path.join(root, file)
                    if process_file(filepath):
                        files_processed.append(filepath)
    
    print(f"\nProcessed {len(files_processed)} files:")
    for f in files_processed:
        print(f"  - {f}")


if __name__ == '__main__':
    main()

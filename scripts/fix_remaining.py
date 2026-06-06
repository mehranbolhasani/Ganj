#!/usr/bin/env python3
"""Fix remaining issues after initial lucide replacement."""

import re

# For CategoryList.tsx
CATEGORY_LIST_OLD = """// Function to get the appropriate icon for each category
const getCategoryIcon = (title: string) => {
  const iconMap: { [key: string]: React.ComponentType<{className?: string}> } = {
    'غزلیات': Heart,        // Ghazals - Heart for love poetry
    'قطعات': FileText,      // Qata'at - FileText for short pieces
    'رباعیات': Star,        // Rubaiyat - Star for quatrains
    'قصاید': Scroll,        // Qasidas - Scroll for odes
    'اشعار منتسب': BookMarked, // Attributed poems - BookMarked
    'مثنویات': BookOpen,    // Mathnavis - BookOpen for long poems
    'مخمسات': Library,      // Mukhammas - Library for five-line poems
    'مستزاد': FileCheck,    // Mustazad - FileCheck for extended poems
  };

  return iconMap[title] || BookOpen; // Default to BookOpen if not found
};"""

CATEGORY_LIST_NEW = """// Function to get the appropriate icon for each category
import type { IconSvgElement } from '@hugeicons/react';

const getCategoryIcon = (title: string) => {
  const iconMap: { [key: string]: IconSvgElement } = {
    'غزلیات': HeartIcon,        // Ghazals - Heart for love poetry
    'قطعات': File02Icon,      // Qata'at - FileText for short pieces
    'رباعیات': StarIcon,        // Rubaiyat - Star for quatrains
    'قصاید': ScrollIcon,        // Qasidas - Scroll for odes
    'اشعار منتسب': BookBookmark01Icon, // Attributed poems - BookMarked
    'مثنویات': BookOpen01Icon,    // Mathnavis - BookOpen for long poems
    'مخمسات': LibraryIcon,      // Mukhammas - Library for five-line poems
    'مستزاد': FileCheckIcon,    // Mustazad - FileCheck for extended poems
  };

  return iconMap[title] || BookOpen01Icon; // Default to BookOpen if not found
};"""


def fix_category_list(content):
    content = content.replace(CATEGORY_LIST_OLD, CATEGORY_LIST_NEW)
    # Fix the JSX usage
    content = content.replace(
        '<IconComponent className={`w-5 h-5 ${styles.icon}`} />',
        '<HugeiconsIcon icon={IconComponent} size={20} className={`w-5 h-5 ${styles.icon}`} />'
    )
    return content


def fix_search_results_tabs(content):
    # Fix the tab icon definitions
    content = content.replace(
        "{ key: 'all', label: 'همه', count: totalResults, icon: Search },",
        "{ key: 'all', label: 'همه', count: totalResults, icon: Search01Icon },"
    )
    content = content.replace(
        "{ key: 'poets', label: 'شاعران', count: totalCounts.poets, icon: Users },",
        "{ key: 'poets', label: 'شاعران', count: totalCounts.poets, icon: Group01Icon },"
    )
    content = content.replace(
        "{ key: 'categories', label: 'مجموعه‌ها', count: totalCounts.categories, icon: BookOpen },",
        "{ key: 'categories', label: 'مجموعه‌ها', count: totalCounts.categories, icon: BookOpen01Icon },"
    )
    content = content.replace(
        "{ key: 'poems', label: 'اشعار', count: totalCounts.poems, icon: FileText },",
        "{ key: 'poems', label: 'اشعار', count: totalCounts.poems, icon: File02Icon },"
    )
    
    # Fix the JSX usage in tabs
    content = content.replace(
        '<Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />',
        '<HugeiconsIcon icon={Icon} size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />'
    )
    return content


def fix_roadmap_content(content):
    # Replace feature icon definitions
    replacements = {
        'icon: Search,': 'icon: Search01Icon,',
        'icon: Bookmark,': 'icon: Bookmark03Icon,',
        'icon: Eye,': 'icon: ViewIcon,',
        'icon: Smartphone,': 'icon: SmartPhone01Icon,',
        'icon: Filter,': 'icon: FilterIcon,',
        'icon: Share,': 'icon: Share08Icon,',
        'icon: Users,': 'icon: Group01Icon,',
    }
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    # Replace JSX usage
    content = content.replace(
        '<feature.icon className="w-5 h-5 text-green-600" />',
        '<HugeiconsIcon icon={feature.icon} size={20} className="w-5 h-5 text-green-600" />'
    )
    content = content.replace(
        '<feature.icon className="w-5 h-5 text-blue-600" />',
        '<HugeiconsIcon icon={feature.icon} size={20} className="w-5 h-5 text-blue-600" />'
    )
    return content


def fix_missing_size_props(content):
    """Fix HugeiconsIcon components that have w-X h-X in className but no size prop."""
    # Pattern: <HugeiconsIcon icon={...} className="... w-X h-X ..." />
    # Add size prop based on w-X h-X
    
    size_map = {
        'w-3 h-3': '14',
        'w-3.5 h-3.5': '14',
        'w-4 h-4': '16',
        'w-5 h-5': '20',
        'w-6 h-6': '24',
        'w-7 h-7': '28',
        'w-8 h-8': '32',
        'w-10 h-10': '40',
        'w-12 h-12': '48',
        'w-16 h-16': '64',
        'w-20 h-20': '80',
    }
    
    def replacer(match):
        before = match.group(1)
        icon = match.group(2)
        class_name = match.group(3)
        after = match.group(4)
        
        # Check if already has size prop
        if 'size=' in before:
            return match.group(0)
        
        # Find size from className
        size = None
        for size_class, size_val in size_map.items():
            if size_class in class_name:
                size = size_val
                break
        
        if size:
            return f'<HugeiconsIcon icon={{{icon}}}{before}size={{{size}}} className="{class_name}"{after}>'
        return match.group(0)
    
    # Match HugeiconsIcon without size prop but with className containing size classes
    pattern = r'<HugeiconsIcon icon=\{([^}]+)\}([^>]*)className=["\']([^"\']*w-\d+(?:\.\d+)? h-\d+(?:\.\d+)?[^"\']*)["\']([^>]*)>'
    content = re.sub(pattern, replacer, content)
    
    return content


def fix_remaining_lucide_tags(content, filepath):
    """Find and replace any remaining <OldIconName ... /> tags."""
    # This is a safety net - find any remaining lucide-style icon components
    # that weren't replaced. We look for capitalized tag names that match known lucide icons.
    
    known_lucide = [
        'Search', 'Users', 'BookOpen', 'FileText', 'Heart', 'X', 'Clock',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'CornerDownLeft',
        'Filter', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
        'Home', 'Type', 'CalendarRange', 'Loader2', 'RefreshCw', 'AlertCircle',
        'WifiOff', 'CheckCircle', 'ExternalLink', 'AlertTriangle', 'Info',
        'Trash2', 'Eye', 'BarChart3', 'Download', 'User', 'Menu', 'FileX',
        'Calendar', 'List', 'Palette', 'History', 'Bookmark', 'Share',
        'Smartphone', 'Plus', 'Zap', 'Bug', 'Settings', 'Divide',
        'ArrowLeftIcon'
    ]
    
    icon_map = {
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
    
    size_map = {
        'w-3 h-3': '14',
        'w-3.5 h-3.5': '14',
        'w-4 h-4': '16',
        'w-5 h-5': '20',
        'w-6 h-6': '24',
        'w-7 h-7': '28',
        'w-8 h-8': '32',
        'w-10 h-10': '40',
        'w-12 h-12': '48',
        'w-16 h-16': '64',
        'w-20 h-20': '80',
    }
    
    for icon in known_lucide:
        pattern = r'<(' + re.escape(icon) + r')\s+([^/>]*)(/?>)'
        
        def tag_replacer(match):
            attrs = match.group(2)
            closing = match.group(3)
            
            # Extract className
            class_match = re.search(r'className=["\']([^"\']+)["\']', attrs)
            class_name = class_match.group(1) if class_match else ''
            
            # Extract aria-hidden
            aria_match = re.search(r'aria-hidden=["\']([^"\']+)["\']', attrs)
            aria_hidden = aria_match.group(1) if aria_match else None
            
            # Determine size
            size = None
            for size_class, size_val in size_map.items():
                if size_class in class_name:
                    size = size_val
                    break
            
            # Build new className (remove size classes)
            new_class = class_name
            for size_class in size_map.keys():
                new_class = new_class.replace(size_class, '').strip()
            new_class = re.sub(r'\s+', ' ', new_class).strip()
            
            hugeicon = icon_map.get(icon, icon + 'Icon')
            
            props = [f'icon={{{hugeicon}}}']
            if size:
                props.append(f'size={{{size}}}')
            if new_class:
                props.append(f'className="{new_class}"')
            if aria_hidden:
                props.append(f'aria-hidden="{aria_hidden}"')
            
            # Handle remaining props
            remaining = attrs
            remaining = re.sub(r'\s*className=["\'][^"\']+["\']', '', remaining)
            remaining = re.sub(r'\s*aria-hidden=["\'][^"\']+["\']', '', remaining)
            remaining = remaining.strip()
            
            if remaining:
                props.append(remaining)
            
            return f'<HugeiconsIcon {" ".join(props)} />'
        
        new_content = re.sub(pattern, tag_replacer, content)
        if new_content != content:
            print(f"  Fixed remaining <{icon}> tag in {filepath}")
            content = new_content
        
        # Also handle no-attribute version
        pattern2 = r'<(' + re.escape(icon) + r')\s*/>'
        new_content2 = re.sub(pattern2, f'<HugeiconsIcon icon={{{icon_map.get(icon, icon + "Icon")}}} size={{20}} />', content)
        if new_content2 != content:
            print(f"  Fixed remaining <{icon}/> tag in {filepath}")
            content = new_content2
    
    return content


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    if 'CategoryList.tsx' in filepath:
        content = fix_category_list(content)
    
    if 'SearchResults.tsx' in filepath:
        content = fix_search_results_tabs(content)
    
    if 'RoadmapContent.tsx' in filepath:
        content = fix_roadmap_content(content)
    
    # Fix missing size props
    content = fix_missing_size_props(content)
    
    # Fix any remaining lucide tags
    content = fix_remaining_lucide_tags(content, filepath)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
        return True
    return False


def main():
    import os
    directories = [
        '/Users/mehranbolhasani/Projects/Ganjeh/src/components',
        '/Users/mehranbolhasani/Projects/Ganjeh/src/app',
    ]
    
    fixed_files = []
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(('.tsx', '.ts')):
                    filepath = os.path.join(root, file)
                    if process_file(filepath):
                        fixed_files.append(filepath)
    
    print(f"\nFixed {len(fixed_files)} files")


if __name__ == '__main__':
    main()

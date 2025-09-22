# CSS Collision Analysis Report

## CSS Loading Order (Critical to understand cascade)

1. **HTML Head Order:**
   - `force-styles.css` (linked in layout.tsx head)
   - `globals.css` (imported via layout - includes design-tokens.css)
   - Component CSS modules (scoped)

2. **Within globals.css:**
   - design-tokens.css (@import first)
   - globals.css content (loaded after tokens)

## Current CSS File Analysis

### 1. force-styles.css (Public, Linked in Head)
```css
Lines: ~111
Key Rules:
- body { background-color: #f8fafc !important; }
- section .container-max { background: transparent !important; }
- section[id="technology"] selectors for white background
- Text color overrides for different sections
```

### 2. globals.css (Main CSS, Imported)
```css
Lines: ~615
Key Rules:
- body { background-color: #f8fafc; } (line 23)
- .bg-white { background-color: rgb(255 255 255); } (line 108)
- Section background fix at END (lines 608-613)
```

### 3. design-tokens.css (Imported by globals.css)
```css
Lines: ~170
Key Rules:
- CSS Custom Properties (:root)
- No direct styling conflicts
```

### 4. PerformanceMetrics.module.css (Scoped)
```css
Lines: ~55
Key Rules:
- Scoped to component
- Uses design tokens
- Performance-specific styling
```

## Potential Collision Areas

### Body Background Conflicts
- ❌ force-styles.css: `body { background-color: #f8fafc !important; }`
- ❌ globals.css: `body { background-color: #f8fafc; }`
- ❌ layout.tsx: `<body style={{ backgroundColor: 'transparent' }}>`

**COLLISION:** Three different body background declarations!

### Section Background Conflicts
- ❌ force-styles.css: `section[id="technology"] { background: white !important; }`
- ❌ globals.css (end): `section[id="technology"] { background: white !important; }`
- ✅ page.tsx: `<section className="py-20 bg-white">`

**COLLISION:** Duplicate section background rules!

### Container/Padding Conflicts
- ❌ force-styles.css: `section .container-max { background: transparent !important; }`
- ❌ globals.css: `.container-max { ... }`
- ❌ tailwind.config.js: Custom utilities for container-max

**COLLISION:** Multiple container definitions!

### Text Color Conflicts
- ❌ force-styles.css: Section-specific text color overrides
- ❌ globals.css: Base text color definitions
- ❌ design-tokens.css: Token definitions

**COLLISION:** Text color cascade conflicts!

## Critical Issues Identified

### 1. Triple Body Background Declaration
```
1. layout.tsx inline style: backgroundColor: 'transparent'
2. force-styles.css: background-color: #f8fafc !important
3. globals.css: background-color: #f8fafc
```

### 2. Duplicate Section Background Rules
```
1. force-styles.css: Multiple technology section selectors
2. globals.css: Same selectors at the end
```

### 3. CSS Loading Race Condition
```
force-styles.css (linked) vs globals.css (imported) loading order undefined
```

## Recommended Fixes (Without Hardcoding)

### Priority 1: Remove Duplicate Rules
1. Remove body background from force-styles.css (let globals.css handle it)
2. Remove duplicate section rules from one file
3. Remove inline style from layout.tsx body

### Priority 2: Consolidate Container Rules
1. Use single source of truth for .container-max
2. Remove conflicting definitions

### Priority 3: Fix Loading Order
1. Move critical styles to globals.css only
2. Use force-styles.css only for true emergency overrides
3. Establish clear CSS architecture

## Next Steps
1. ✅ Clean up duplicate rules first
2. ✅ Test after each cleanup
3. ✅ Only add new rules if cleanup doesn't work
4. ✅ Document final architecture
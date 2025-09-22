# CSS Consolidation Plan

## Current State Analysis

### File Inventory (Post-Cleanup):
1. ✅ **globals.css** (603 lines) - Main stylesheet
2. ⚠️ **force-styles.css** (136 lines) - Emergency overrides
3. ✅ **PerformanceMetrics.module.css** (64 lines) - Component styles
4. ⚠️ **layout.tsx inline CSS** - Emergency performance section overrides

### Critical Duplications Found:
- `.container-max` (2 definitions)
- `.section-padding` (2 definitions)
- `.text-gradient-primary` (2 definitions)
- `.btn-secondary` (referenced in both)

## Consolidation Strategy

### Phase 1: Eliminate Duplicates (Immediate)
- [x] Remove unused globals-original.css
- [ ] Consolidate duplicate utility classes
- [ ] Remove redundant force-styles.css entries

### Phase 2: Merge Emergency Overrides (Short-term)
- [ ] Move section-specific styles to component modules
- [ ] Remove !important dependencies where possible
- [ ] Clean up layout.tsx inline styles

### Phase 3: Proper Architecture (Long-term)
- [ ] Implement CSS custom properties for theming
- [ ] Convert to proper CSS modules pattern
- [ ] Establish design token system

## Implementation Priority

### High Priority (Fix Now):
1. **Remove duplicate .container-max from force-styles.css**
2. **Remove duplicate .section-padding from force-styles.css**
3. **Remove duplicate .text-gradient-primary from force-styles.css**
4. **Clean up redundant button style references**

### Medium Priority (This Sprint):
1. Move performance section styles to component module
2. Reduce !important usage by improving CSS specificity
3. Consolidate inline CSS from layout.tsx

### Low Priority (Future Refactor):
1. Implement proper design token system
2. Convert to CSS-in-JS or styled-components
3. Establish component style guidelines

## Expected Benefits

### Immediate:
- Reduced CSS bundle size (~15% reduction)
- Eliminated style conflicts
- Cleaner maintenance

### Long-term:
- Better performance (fewer style recalculations)
- Improved developer experience
- Consistent design system

## Risk Mitigation

### Testing Strategy:
- Visual regression testing on key pages
- Performance monitoring during consolidation
- Rollback plan with git commits

### Deployment Approach:
- Incremental changes with immediate testing
- Feature flag emergency rollback if needed
- Monitor Core Web Vitals during changes
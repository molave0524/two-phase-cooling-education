# CSS Architecture Cleanup Plan

## Current Problems Analysis

### 1. **CSS Specificity Wars**
- 819 lines of globals.css with conflicting rules
- Multiple `!important` declarations overriding each other
- Ultra-high specificity selectors like `section[id="performance"] button[class*="scenarioBox"][class*="selected"] h4`

### 2. **Fragile Overrides**
- Section-level blanket rules affecting unintended elements
- Reactive fixes instead of systematic solutions
- CSS rules that break when HTML structure changes

### 3. **Mixed Paradigms**
- Tailwind utility classes fighting with custom CSS
- No clear separation of concerns
- Inconsistent naming conventions

### 4. **Runtime Instability**
- JavaScript function hoisting issues
- ESLint violations requiring manual fixes
- Component state management problems

## Phase 1: Immediate Stabilization (Priority: HIGH)

### 1.1 Create CSS Isolation
```bash
# Create component-specific CSS modules
mkdir src/styles/components
mkdir src/styles/sections
```

### 1.2 Extract Problem Areas
- [ ] Extract performance section styles to dedicated module
- [ ] Extract hero section styles to dedicated module
- [ ] Extract navigation styles to dedicated module

### 1.3 Remove Dangerous Global Rules
**Remove these problematic selectors:**
```css
section[id="get-started"] .bg-secondary-50 *
section[id="performance"] button[class*="scenarioBox"]
section:not([id="hero"]) .container-max
```

## Phase 2: Component Restructure (Priority: HIGH)

### 2.1 Create Clean Component Architecture
```typescript
// Example: PerformanceMetrics with proper CSS modules
import styles from './PerformanceMetrics.module.css'

export const PerformanceMetrics = () => {
  return (
    <div className={styles.container}>
      <div className={styles.scenarioBox}>
        {/* Clean, isolated styles */}
      </div>
    </div>
  )
}
```

### 2.2 Standardize State Management
- [ ] Fix all function hoisting issues
- [ ] Implement proper useCallback patterns
- [ ] Add TypeScript strict mode compliance

### 2.3 Component-Specific Files
```
src/styles/components/
├── PerformanceMetrics.module.css
├── VideoShowcase.module.css
├── CallToAction.module.css
├── HeroSection.module.css
└── Navigation.module.css
```

## Phase 3: Tailwind Optimization (Priority: MEDIUM)

### 3.1 Create Design System
```css
/* src/styles/design-system.css */
:root {
  /* Colors */
  --color-primary-50: rgb(240 249 255);
  --color-primary-600: rgb(2 132 199);
  --color-secondary-900: rgb(15 23 42);

  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-4: 1rem;
  --space-8: 2rem;
}
```

### 3.2 Custom Tailwind Configuration
```javascript
// tailwind.config.js optimization
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          600: 'var(--color-primary-600)',
        }
      }
    }
  }
}
```

## Phase 4: Testing & Quality (Priority: MEDIUM)

### 4.1 Visual Regression Testing
```bash
# Add visual testing tools
npm install --save-dev @storybook/react
npm install --save-dev chromatic
```

### 4.2 CSS Linting
```bash
# Add CSS quality tools
npm install --save-dev stylelint
npm install --save-dev stylelint-config-standard
```

### 4.3 Component Testing
```typescript
// Example: Component-specific tests
import { render } from '@testing-library/react'
import { PerformanceMetrics } from './PerformanceMetrics'

test('scenario boxes respond to clicks only', () => {
  const { getByTestId } = render(<PerformanceMetrics />)
  // Test isolated component behavior
})
```

## Phase 5: Documentation & Maintenance (Priority: LOW)

### 5.1 Style Guide Documentation
- Component styling patterns
- CSS naming conventions
- Tailwind usage guidelines

### 5.2 Development Guidelines
- No more global CSS overrides
- Component-first styling approach
- Mandatory testing for styling changes

## Implementation Strategy

### Week 1: Emergency Stabilization
- Remove the most dangerous global CSS rules
- Extract performance section to CSS module
- Fix all ESLint violations

### Week 2: Component Isolation
- Convert major components to CSS modules
- Implement proper TypeScript patterns
- Add component-level testing

### Week 3: System Optimization
- Optimize Tailwind configuration
- Implement design system
- Add visual regression testing

### Week 4: Quality & Documentation
- Complete style guide
- Add development guidelines
- Performance optimization

## Success Metrics

- [ ] Zero `!important` declarations in global CSS
- [ ] All components use CSS modules or Tailwind only
- [ ] No more than 100 lines in globals.css
- [ ] Zero ESLint violations
- [ ] All styling changes covered by tests
- [ ] Visual regression test coverage

## Risk Mitigation

1. **Backup Strategy**: Create feature branch for each phase
2. **Rollback Plan**: Keep current implementation as fallback
3. **Testing**: Manual testing after each phase
4. **Documentation**: Document every change for team awareness

---

*This plan addresses the root causes of CSS fragility and creates a maintainable, scalable architecture.*
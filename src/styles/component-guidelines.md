# Component CSS Module Guidelines

## Design Token Usage

### ✅ Do This
```css
/* Use design tokens for consistent theming */
.button {
  color: var(--text-on-white);
  background-color: var(--color-primary-600);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: var(--transition-colors);
}

.button:hover {
  background-color: var(--color-primary-700);
}
```

### ❌ Don't Do This
```css
/* Avoid hardcoded values */
.button {
  color: #475569;
  background-color: #0284c7;
  padding: 12px 24px;
  border-radius: 8px;
}
```

## CSS Module Best Practices

### 1. Component Structure
```css
/* Component root with design token mappings */
.componentRoot {
  --local-primary: var(--color-primary-600);
  --local-secondary: var(--color-secondary-500);
}

/* Child elements using local tokens */
.element {
  color: var(--local-primary);
}

.elementVariant {
  color: var(--local-secondary);
}
```

### 2. State Management
```css
/* Base state */
.button {
  background-color: var(--color-primary-600);
  transition: var(--transition-colors);
}

/* Interactive states */
.button:hover {
  background-color: var(--color-primary-700);
}

.button:active {
  background-color: var(--color-primary-800);
}

.button:disabled {
  background-color: var(--color-secondary-300);
  cursor: not-allowed;
}

/* Variant states */
.button.secondary {
  background-color: var(--color-secondary-100);
  color: var(--color-secondary-900);
}
```

### 3. Responsive Design
```css
.container {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--space-12);
  }
}
```

## Component-Specific Tokens

### Performance Metrics Example
```css
.performanceSection {
  /* Map component-specific tokens to design tokens */
  --filter-inactive: var(--performance-filter-inactive);
  --filter-active: var(--performance-filter-active);
  --filter-bg-active: var(--performance-filter-bg-active);
}

.filterButton {
  color: var(--filter-inactive);
}

.filterButton.active {
  color: var(--filter-active);
  background-color: var(--filter-bg-active);
}
```

## Naming Conventions

### Class Names
- Use camelCase for CSS module class names
- Prefix variants with the base name
- Use semantic names, not presentational

```css
/* ✅ Good */
.navigationButton { }
.navigationButtonPrimary { }
.navigationButtonSecondary { }

/* ❌ Bad */
.blue-button { }
.big-text { }
.left-align { }
```

### CSS Custom Properties
- Use descriptive names
- Group related properties
- Inherit from design tokens

```css
/* ✅ Good */
.card {
  --card-bg: var(--color-secondary-50);
  --card-border: var(--color-secondary-200);
  --card-text: var(--color-secondary-900);
  --card-shadow: var(--shadow-md);
}

/* ❌ Bad */
.card {
  --bg: #f8fafc;
  --color1: #e2e8f0;
  --text: #0f172a;
}
```

## Performance Considerations

### CSS Specificity
- Use CSS modules to avoid specificity wars
- Minimize !important usage
- Use descendant selectors sparingly

### Bundle Size
- Import only needed tokens
- Use CSS custom properties for dynamic values
- Avoid duplicate declarations

## Dark Mode Support

### Preparation for Dark Mode
```css
.component {
  /* Use semantic tokens that adapt to theme */
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  border-color: var(--color-border);
}

/* Theme-specific overrides */
[data-theme="dark"] .component {
  --color-surface: var(--color-secondary-800);
  --color-on-surface: var(--color-secondary-100);
  --color-border: var(--color-secondary-700);
}
```
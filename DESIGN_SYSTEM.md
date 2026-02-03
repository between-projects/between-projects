# Design System

## Overview

This document outlines the design system and technical standards for between-projects. It serves as a reference for maintaining consistency across all digital work.

---

## Technology Stack

### Frontend

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **TypeScript** | Type-safe JavaScript | Catches errors early, improves code quality and maintainability |
| **Next.js** | React framework | Server-side rendering, file-based routing, optimized builds |
| **Tailwind CSS** | Utility-first CSS | Rapid prototyping, consistent spacing, minimal CSS overhead |
| **React** | UI library | Component-based architecture, large ecosystem |

### Content Management

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Sanity** | Headless CMS | Flexible content modeling, real-time collaboration, GROQ queries |
| **WordPress 6** | Full Site Editing | Block-based design, extensive plugin ecosystem, client familiarity |

### Infrastructure

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Node.js** | Runtime environment | JavaScript everywhere, extensive package ecosystem |
| **Git** | Version control | Collaboration, history tracking, deployment pipelines |

---

## Design Tokens

### Spacing Scale

Use consistent spacing based on a base unit of 4px:

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### Typography Scale

```
text-xs:   12px / 0.75rem
text-sm:   14px / 0.875rem
text-base: 16px / 1rem
text-lg:   18px / 1.125rem
text-xl:   20px / 1.25rem
text-2xl:  24px / 1.5rem
text-3xl:  30px / 1.875rem
text-4xl:  36px / 2.25rem
```

### Color Principles

- Use neutral bases with intentional accent colors
- Ensure WCAG 2.1 AA contrast ratios minimum
- Support both light and dark modes when applicable
- Limit palette to maintain visual cohesion

---

## Component Patterns

### Naming Conventions

- **Components:** PascalCase (`NavigationBar`, `CardGrid`)
- **Files:** kebab-case (`navigation-bar.tsx`, `card-grid.tsx`)
- **CSS Classes:** Tailwind utilities or BEM when custom CSS needed
- **Functions:** camelCase (`handleSubmit`, `formatDate`)

### Component Structure

```
components/
├── ui/              # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
├── layout/          # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── container.tsx
└── features/        # Feature-specific components
    ├── navigation/
    └── content/
```

### Component Principles

1. **Single Responsibility** — Each component does one thing well
2. **Composability** — Small components combine into larger patterns
3. **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation
4. **Responsiveness** — Mobile-first, progressive enhancement

---

## Code Standards

### TypeScript

```typescript
// Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions and primitives
type Status = 'active' | 'inactive' | 'pending';

// Always type function parameters and returns
function getUser(id: string): User | null {
  // implementation
}
```

### React/Next.js

```typescript
// Functional components with typed props
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <article className="rounded-lg border p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      {children}
    </article>
  );
}
```

### Tailwind CSS

```html
<!-- Use consistent ordering: layout, spacing, sizing, colors, effects -->
<div class="flex items-center gap-4 p-4 w-full bg-white rounded-lg shadow-sm">
  <!-- content -->
</div>
```

---

## Accessibility Standards

### Requirements

- **WCAG 2.1 Level AA** compliance minimum
- Semantic HTML elements (`nav`, `main`, `article`, `section`)
- Alt text for all meaningful images
- Focus indicators visible and consistent
- Skip links for keyboard navigation
- Form labels associated with inputs

### Testing

- Keyboard-only navigation testing
- Screen reader testing (VoiceOver, NVDA)
- Color contrast verification
- Automated tools (axe, Lighthouse)

---

## Performance Guidelines

### Targets

- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **Lighthouse Performance Score:** > 90

### Best Practices

- Optimize and lazy-load images
- Minimize JavaScript bundle size
- Use static generation where possible
- Implement proper caching strategies
- Avoid layout shifts from dynamic content

---

## Documentation Standards

### Code Comments

```typescript
// Use comments to explain "why", not "what"
// Good: Offset accounts for fixed header height
// Bad: Add 64 to scroll position
```

### README Requirements

Each project should include:
- Project description and purpose
- Setup instructions
- Available scripts
- Environment variables
- Deployment process

---

## Version Control

### Branch Naming

```
feature/add-contact-form
fix/navigation-mobile-bug
chore/update-dependencies
docs/api-documentation
```

### Commit Messages

Follow conventional commits:
```
feat: add contact form component
fix: resolve mobile navigation overflow
docs: update API documentation
chore: upgrade Next.js to 14
```

---

*This design system evolves with our practice. Update as patterns emerge and standards improve.*

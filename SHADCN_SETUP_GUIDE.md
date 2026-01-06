# shadcn/ui Setup Guide

## ✅ Setup Complete

shadcn/ui has been successfully configured for the D'Dreams Events frontend project.

## 📁 Files Created/Modified

### Created Files:

1. **`components.json`** - shadcn/ui configuration file
2. **`src/lib/utils.js`** - Utility function for merging Tailwind classes (`cn()`)

### Modified Files:

1. **`tailwind.config.js`** - Updated with shadcn/ui theme configuration
2. **`src/index.css`** - Added CSS variables for shadcn/ui theming
3. **`vite.config.js`** - Added path aliases for `@/` imports
4. **`package.json`** - Added dependencies:
   - `class-variance-authority`
   - `clsx`
   - `tailwind-merge`
   - `tailwindcss-animate`

## 🎨 Color Scheme Configuration

The color scheme has been configured to match your brand:

- **Primary**: Purple (`#5A45F2`) - matches your brand color
- **Secondary**: Indigo (`#6366F1`)
- **Accent**: Cyan (`#7ee5ff`)
- Full dark mode support

## 🚀 How to Use shadcn/ui

### Installing Components

To add a shadcn/ui component to your project:

```bash
npx shadcn-ui@latest add [component-name]
```

### Example: Adding a Button Component

```bash
npx shadcn-ui@latest add button
```

This will:

- Create the component in `src/components/ui/button.jsx`
- Make it available for import

### Using Components

```jsx
import { Button } from "@/components/ui/button";

function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  );
}
```

### Using the `cn()` Utility

The `cn()` function helps merge Tailwind classes:

```jsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className
)}>
```

## 📦 Available Components to Install

### Essential Components (Recommended First):

- `button` - Enhanced button component
- `input` - Form input component
- `card` - Card container
- `dialog` - Modal/dialog component
- `select` - Dropdown select
- `tabs` - Tab navigation
- `badge` - Status badges
- `avatar` - User avatars
- `skeleton` - Loading skeletons
- `toast` - Toast notifications

### Advanced Components:

- `table` - Data tables
- `calendar` - Date picker
- `slider` - Range slider
- `accordion` - Collapsible content
- `carousel` - Image carousel
- `command` - Command palette
- `dropdown-menu` - Dropdown menus
- `popover` - Popover tooltips
- `sheet` - Slide-out panels
- `form` - Form with validation

## 🎯 Next Steps

1. **Install Core Components**:

   ```bash
   npx shadcn-ui@latest add button input card dialog
   ```

2. **Replace Existing Components**:

   - Replace `Button.jsx` with shadcn/ui button
   - Replace `Input.jsx` with shadcn/ui input
   - Replace `Card.jsx` with shadcn/ui card

3. **Add New Features**:
   - Install `skeleton` for loading states
   - Install `toast` for notifications
   - Install `tabs` for organized content

## 📝 Path Aliases

The following path aliases are configured:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/components/ui` → `src/components/ui`
- `@/hooks` → `src/hooks` (create if needed)

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `src/index.css`:

```css
:root {
  --primary: 262.1 83.3% 57.8%; /* Your brand purple */
  /* ... */
}
```

### Changing Border Radius

Edit `--radius` in `src/index.css`:

```css
:root {
  --radius: 0.5rem; /* Default */
}
```

## ✅ Verification

The setup has been verified:

- ✅ Build successful
- ✅ CSS variables configured
- ✅ Path aliases working
- ✅ Tailwind config updated
- ✅ Dark mode support enabled

## 🔗 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Component Examples](https://ui.shadcn.com/docs/components)
- [Tailwind CSS Documentation](https://tailwindcss.com)

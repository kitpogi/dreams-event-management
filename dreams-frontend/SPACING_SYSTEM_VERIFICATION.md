# Spacing System Verification Guide

This guide helps you verify that the spacing system has been implemented correctly.

## Method 1: Browser DevTools (Easiest)

1. **Start the development server:**

   ```bash
   cd dreams-frontend
   npm run dev
   ```

2. **Open your browser** and navigate to the app (usually `http://localhost:5173`)

3. **Open DevTools** (F12 or Right-click → Inspect)

4. **Check CSS Variables:**

   - Go to the **Console** tab
   - Type: `getComputedStyle(document.documentElement).getPropertyValue('--spacing-component-md')`
   - Should return: `1rem` (or `16px`)
   - Try other variables:
     - `--spacing-component-sm` → `0.5rem`
     - `--spacing-section-md` → `4rem`
     - `--spacing-layout-md` → `2rem`

5. **Inspect Elements:**
   - Go to **Elements/Inspector** tab
   - Select any element
   - In the **Styles** panel, look for CSS variables starting with `--spacing-`

## Method 2: Test in Browser Console

Open browser console and run:

```javascript
// Check if CSS variables exist
const spacingVars = [
  "--spacing-component-xs",
  "--spacing-component-sm",
  "--spacing-component-md",
  "--spacing-section-md",
  "--spacing-layout-md",
];

spacingVars.forEach((varName) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    varName
  );
  console.log(`${varName}: ${value || "NOT FOUND"}`);
});
```

All should show values (not "NOT FOUND").

## Method 3: Create a Test Component

Create a test page or component to visually verify spacing:

```jsx
// Test component example
<div className="p-component-md border-2 border-primary">
  <div className="mb-component-sm">Component Small Margin Bottom</div>
  <div className="p-component-lg bg-muted">Component Large Padding</div>
  <div className="gap-component-md flex">
    <div className="p-component-sm bg-primary">Item 1</div>
    <div className="p-component-sm bg-primary">Item 2</div>
  </div>
  <div className="mt-section-md pt-section-sm border-t">
    Section Spacing Test
  </div>
</div>
```

## Method 4: Check Tailwind Config

1. **Verify Tailwind config:**

   - Open `tailwind.config.js`
   - Look for `spacing:` section in the `extend` object
   - Should contain entries like `'component-xs': 'var(--spacing-component-xs)'`

2. **Check if Tailwind is processing:**
   - In DevTools, inspect any element with a spacing class
   - The class should be applied and show the correct spacing value

## Method 5: Build Test

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Check for errors:**
   - If build succeeds without errors, Tailwind config is valid
   - Check `dist/` folder for compiled CSS

## Method 6: Quick Visual Test

Add this to any existing component temporarily:

```jsx
{
  /* Spacing System Test */
}
<div className="space-y-4 p-4 border">
  <div className="p-component-xs bg-blue-100">XS (4px)</div>
  <div className="p-component-sm bg-blue-200">SM (8px)</div>
  <div className="p-component-md bg-blue-300">MD (16px)</div>
  <div className="p-component-lg bg-blue-400">LG (24px)</div>
  <div className="p-component-xl bg-blue-500">XL (32px)</div>
</div>;
```

You should see different padding sizes visually.

## Expected Results

✅ **CSS Variables:** All `--spacing-*` variables should be defined in `:root`
✅ **Tailwind Classes:** Classes like `p-component-md`, `gap-section-lg` should work
✅ **No Build Errors:** `npm run build` should complete successfully
✅ **Visual Differences:** Different spacing sizes should be visually distinct

## Troubleshooting

If spacing classes don't work:

1. **Restart dev server:** Stop and restart `npm run dev`
2. **Clear cache:** Delete `node_modules/.vite` folder
3. **Check Tailwind config:** Ensure `content` paths include your component files
4. **Verify CSS import:** Ensure `index.css` is imported in `main.jsx`

## Available Spacing Classes

### Component Spacing

- `p-component-{xs|sm|md|lg|xl|2xl|3xl}` - Padding
- `m-component-{xs|sm|md|lg|xl|2xl|3xl}` - Margin
- `gap-component-{xs|sm|md|lg|xl|2xl|3xl}` - Gap
- `space-{x|y}-component-{xs|sm|md|lg|xl|2xl|3xl}` - Space between

### Section Spacing

- `py-section-{xs|sm|md|lg|xl|2xl}` - Vertical padding
- `my-section-{xs|sm|md|lg|xl|2xl}` - Vertical margin

### Layout Spacing

- `p-layout-{xs|sm|md|lg|xl}` - Padding
- `px-layout-{xs|sm|md|lg|xl}` - Horizontal padding
- `mx-layout-{xs|sm|md|lg|xl}` - Horizontal margin

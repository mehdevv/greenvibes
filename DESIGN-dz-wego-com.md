# Design System Inspired by Cheap Flights, Flight Booking & Airlin…

> Auto-extracted from `https://dz.wego.com/en/flights` on 2026-07-05

## 1. Visual Theme & Atmosphere

Friendly, approachable design with rounded shapes and generous whitespace.

The hero section leads with "Trusted by 83 million+ travellers worldwide" followed by "4.7243,779+ reviews4.6193,524+ reviews".

**Key Characteristics:**
- Inter as the heading font (custom web font loaded via @font-face)
- Inter as the body font for all running text
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#ff8000` used for CTAs and brand highlights
- 6 shadow level(s) detected — tinted shadows
- Rounded corners (8px+) creating a friendly, approachable feel
- Tags: light, rounded, colorful, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#ff8000`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#ff9800`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#bdbdbd`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#000000`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#bdbdbd`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#bdbdbd`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | block | large | text-dark |
| 2 | `#bdbdbd` | `--palette-2` | block | large | text-dark |
| 3 | `#1d1d1d` | `--palette-3` | section | large | text-light |
| 4 | `#f4f4f4` | `--palette-4` | button | small | text-dark |
| 5 | `#44b50c` | `--palette-5` | text-accent | small | text-dark |
| 6 | `#e7fddc` | `--palette-6` | button | small | text-dark |
| 7 | `#0000ee` | `--palette-7` | text-accent | small | text-light |
| 8 | `#ff8000` | `--palette-8` | badge | small | text-dark |
| 9 | `#ff9800` | `--palette-9` | text-accent | small | text-dark |
| 10 | `#188920` | `--palette-10` | text-accent | small | text-light |

## 3. Typography Rules

- **Heading Font:** `Inter` (web font)
- **Body Font:** `Inter` (web font)

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H2 | Inter | 30px | 600 | 36px | normal |
| H3 | Inter | 20px | 600 | 23.34px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `30px` | headings |
| H1 | `20px` | headings |
| H2 | `18.72px` | headings |
| H3 | `16px` | headings |
| H4 | `14px` | headings |
| Body L | `13.3333px` | body / supporting text |
| Body | `12px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: transparent;
  color: #ffffff;
  border-radius: 0px;
  padding: 0px 0px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```

### Pill Button

```css
.btn-pill {
  background: transparent;
  color: #ffffff;
  border-radius: 100px;
  padding: 9px 16px;
  font-size: 16px;
  font-weight: 600;
  border: 0.8px solid rgb(255, 255, 255);
  cursor: pointer;
}
```

### Pill Button 2

```css
.btn-pill-2 {
  background: #f4f4f4;
  color: #000000;
  border-radius: 100px;
  padding: 0px 16px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Pill Button 3

```css
.btn-pill-3 {
  background: #e7fddc;
  color: #188920;
  border-radius: 100px;
  padding: 0px 16px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: #000000;
  border-radius: 50px;
  padding: 1px 6px;
  font-size: 13.3333px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

## 5. Layout Principles

- **Base spacing unit:** `4px` — use multiples (8px, 12px, 16px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `4px` | element |
| spacing-2 | `8px` | element |
| spacing-3 | `1px` | element |
| spacing-4 | `24px` | card |
| spacing-5 | `10px` | element |
| spacing-6 | `16px` | element |
| spacing-7 | `30px` | card |
| spacing-8 | `64px` | section |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-button | `8px` | button |
| radius-card | `20px` | card |
| radius-card | `16px` | card |
| radius-subtle | `4px` | subtle |
| radius-pill | `100px` | pill |
| radius-subtle | `2px` | subtle |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Mid | `rgba(0, 0, 0, 0.1) 0px 0px 8px 2px` | Dropdowns, popovers |
| Mid | `rgba(0, 0, 0, 0.08) 0px 2px 8px 0px` | Dropdowns, popovers |
| Mid | `rgba(0, 0, 0, 0.2) 0px 8px 10px -5px, rgba(0, 0, 0, 0.14) 0px 16px 24px 2px, rgb...` | Dropdowns, popovers |
| High | `color(srgb 0.113725 0.113725 0.113725 / 0.08) 0px 0px 24px 2px` | Modals, floating elements |
| High | `rgba(0, 0, 0, 0.2) 0px 0px 24px 2px` | Modals, floating elements |


## 7. Do's and Don'ts

### Do
- Use `#ffffff` as the primary background color
- Use `Inter` for all headings and `Inter` for body text
- Use `#ff8000` as the single dominant accent/CTA color
- Maintain `4px` as the base spacing unit — all gaps should be multiples
- Use rounded corners (`8px`+) consistently for all interactive elements
- Embrace bold color combinations — playful energy is the point
- Apply the shadow system for elevation — use the extracted shadow values

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Inter/Inter with generic alternatives
- Don't use irregular spacing — stick to 4px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use pure black (#000000) for text — use `#000000` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette

## 8. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |

- Touch targets: minimum 44×44px on mobile
- Maintain 4px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #ffffff
Text:        #000000
Accent:      #ff8000
Secondary:   #ff9800
Border:      #bdbdbd
```

### Example Prompts

1. "Build a hero section with a `#ffffff` background, `Inter` heading in `#000000`, and a `#ff8000` CTA button with 100px radius."
2. "Create a pricing card using background `#bdbdbd`, border `#bdbdbd`, `Inter` for text, and 12px padding."
3. "Design a navigation bar — `#ffffff` background, `#000000` links, `#ff8000` for active state."
4. "Build a feature grid with 3 columns, 12px gap, each card using the card component style."
5. "Create a footer with `#000000` background, `#ffffff` text, and 8px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct

## 10. CSS Custom Properties

> 98 custom properties extracted from `:root` / `html` stylesheets.

### Color Variables

| Variable | Value |
|---|---|
| `--wp-bg-primary` | `#fff` |
| `--wp-bg-secondary` | `#fafafa` |
| `--wp-bg-tertiary` | `#f4f4f4` |
| `--wp-bg-surface` | `#fff` |
| `--wp-bg-active` | `#e7fddc` |
| `--wp-bg-highlight` | `#fdf5cb` |
| `--wp-bg-warning` | `#fff0e0` |
| `--wp-bg-destructive` | `#fee` |
| `--wp-bg-exception` | `#ebf5ff` |
| `--wp-bg-inverse` | `#1d1d1d` |
| `--wp-bg-inverse-still` | `#1d1d1d` |
| `--wp-bg-active-positive` | `#44b50c` |
| `--wp-bg-solid-positive` | `#188920` |
| `--wp-bg-solid-warning` | `#ff8000` |
| `--wp-bg-solid-destructive` | `#cf000f` |
| `--wp-bg-solid-exception` | `#016cd5` |
| `--wp-txt-primary` | `#1d1d1d` |
| `--wp-txt-secondary` | `#767676` |
| `--wp-txt-disabled` | `#bdbdbd` |
| `--wp-txt-active-primary` | `#44b50c` |
| `--wp-txt-active-secondary` | `#188920` |
| `--wp-txt-active-label` | `#188920` |
| `--wp-txt-warning` | `#d85d0d` |
| `--wp-txt-warning-inverse` | `#d85d0d` |
| `--wp-txt-destructive` | `#cf000f` |
| `--wp-txt-destructive-inverse` | `#cf000f` |
| `--wp-txt-inverse` | `#fff` |
| `--wp-txt-inverse-still` | `#fff` |
| `--wp-txt-link` | `#016cd5` |
| `--wp-txt-link-inverse` | `#016cd5` |
| ... | *(55 more)* |

### Spacing Variables

| Variable | Value |
|---|---|
| `--wp-regular` | `400` |
| `--wp-semi-bold` | `600` |
| `--wp-bold` | `700` |

### Typography Variables

| Variable | Value |
|---|---|
| `--wp-font-latin` | `"Inter", "Noto Sans", sans-serif` |
| `--wp-font-arabic` | `"Noto Naskh Arabic"` |
| `--wp-text-2xs` | `.625rem` |
| `--wp-text-xs` | `.75rem` |
| `--wp-text-sm` | `.875rem` |
| `--wp-text-base` | `1rem` |
| `--wp-text-lg` | `1.25rem` |
| `--wp-text-xl` | `1.5rem` |
| `--wp-text-2xl` | `1.875rem` |
| `--wp-text-3xl` | `2.25rem` |

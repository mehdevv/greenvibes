# Design System Inspired by Stripe

> Auto-extracted from `https://stripe.com/` on 2026-07-05

## 1. Visual Theme & Atmosphere

Clean, minimal, and product-focused with deliberate use of whitespace.

The hero section leads with "Financial infrastructure to grow your revenue. Accept payments, offer financial services, and implem" followed by "Get startedSign up with Google".

**Key Characteristics:**
- sohne-var as the heading font
- sohne-var as the body font for all running text
- Heading weight 300, letter-spacing -0.87552px
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#533afd` used for CTAs and brand highlights
- 8 shadow level(s) detected — tinted shadows
- Moderate border-radius (4px) — balanced and professional
- Tags: light, soft, accented, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#533afd`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#00d66f`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#e5edf5`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#000000`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#e5edf5`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | block | large | text-dark |
| 2 | `#e5edf5` | `--palette-2` | section | large | text-dark |
| 3 | `#533afd` | `--palette-3` | text-accent | medium | text-light |
| 4 | `#ffe5da` | `--palette-4` | badge | medium | text-dark |
| 5 | `#061b31` | `--palette-5` | text-accent | medium | text-light |
| 6 | `#00d66f` | `--palette-6` | button | medium | text-dark |
| 7 | `#2863b1` | `--palette-7` | button | small | text-light |
| 8 | `#f5f5f5` | `--palette-8` | button | small | text-dark |

## 3. Typography Rules

- **Heading Font:** `sohne-var`, sans-serif
- **Body Font:** `sohne-var`, sans-serif

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | sohne-var | 43.776px | 300 | 50.3424px | -0.87552px |
| H2 | sohne-var | 32px | 300 | 35.2px | -0.64px |
| H3 | sohne-var | 26px | 300 | 29.12px | -0.26px |
| H4 | sohne-var | 16px | 400 | 22.4px | normal |
| Body | sohne-var | 32px | 300 | 35.2px | -0.64px |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `56px` | headings |
| H1 | `48px` | headings |
| H2 | `43.776px` | headings |
| H3 | `32px` | headings |
| H4 | `26px` | headings |
| Body L | `22px` | body / supporting text |
| Body | `18px` | body / supporting text |
| Small | `16px` | body / supporting text |
| XS | `15px` | body / supporting text |
| Caption | `14px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: transparent;
  color: #533afd;
  border-radius: 0px;
  padding: 0px 0px;
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
  color: #061b31;
  border-radius: 4px;
  padding: 12px 0px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Outline Button

```css
.btn-outline {
  background: transparent;
  color: #533afd;
  border-radius: 4px;
  padding: 10.5px 20px;
  font-size: 14px;
  font-weight: 400;
  border: 0.8px solid rgb(255, 255, 255);
  cursor: pointer;
}
```

### Filled Button

```css
.btn-filled {
  background: #533afd;
  color: #ffffff;
  border-radius: 4px;
  padding: 15.5px 20px;
  font-size: 14px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Filled Button 2

```css
.btn-filled-2 {
  background: #ffffff;
  color: #533afd;
  border-radius: 4px;
  padding: 14.5px 24px;
  font-size: 16px;
  font-weight: 400;
  border: 0.8px solid rgb(185, 185, 249);
  cursor: pointer;
}
```

### Ghost Button 2

```css
.btn-ghost-2 {
  background: transparent;
  color: #000000;
  border-radius: 0px;
  padding: 0px 0px;
  font-size: 16px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Card

```css
.card {
  background: #e5edf5;
  border-radius: 6px;
  padding: 0px;
}
```

## 5. Layout Principles

- **Base spacing unit:** `6px` — use multiples (12px, 18px, 24px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `6px` | element |
| spacing-2 | `8px` | element |
| spacing-3 | `2px` | element |
| spacing-4 | `4px` | element |
| spacing-5 | `11px` | element |
| spacing-6 | `15.5px` | element |
| spacing-7 | `12px` | element |
| spacing-8 | `14.5px` | element |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-subtle | `4px` | subtle |
| radius-button | `6px` | button |
| radius-subtle | `1px` | subtle |
| radius-subtle | `5px` | subtle |
| radius-subtle | `2px` | subtle |
| radius-button | `8px` | button |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Low | `rgba(50, 50, 93, 0.12) 0px 13.5px 27px -12.4px, rgba(0, 0, 0, 0.05) 0px 8.1px 16...` | Cards, subtle elevation |
| Low | `rgba(0, 0, 0, 0.1) 0px 20.187px 40.374px -20.187px` | Cards, subtle elevation |
| Mid | `rgba(0, 0, 0, 0.1) 0px 2px 5px 0px` | Dropdowns, popovers |
| Deep | `rgba(23, 23, 23, 0.08) 0px 15px 35px 0px` | Hero sections, deep layers |
| Mid | `rgba(23, 23, 23, 0.06) 0px 3px 6px 0px` | Dropdowns, popovers |

> **Note:** This site uses chromatic (color-tinted) shadows rather than pure black — this is a deliberate brand choice that adds warmth to elevation.

## 7. Do's and Don'ts

### Do
- Use `#ffffff` as the primary background color
- Use `sohne-var` for all headings and `sohne-var` for body text
- Use `#533afd` as the single dominant accent/CTA color
- Maintain `6px` as the base spacing unit — all gaps should be multiples
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 300 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute sohne-var/sohne-var with generic alternatives
- Don't use irregular spacing — stick to 6px grid
- Don't use dark/black backgrounds — this is a light-themed design
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
- Maintain 6px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #ffffff
Text:        #000000
Accent:      #533afd
Secondary:   #00d66f
Border:      #e5edf5
```

### Example Prompts

1. "Build a hero section with a `#ffffff` background, `sohne-var` heading in `#000000`, and a `#533afd` CTA button with 4px radius."
2. "Create a pricing card using background `#e5edf5`, border `#e5edf5`, `sohne-var` for text, and 18px padding."
3. "Design a navigation bar — `#ffffff` background, `#000000` links, `#533afd` for active state."
4. "Build a feature grid with 3 columns, 18px gap, each card using the card component style."
5. "Create a footer with `#000000` background, `#ffffff` text, and 12px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct

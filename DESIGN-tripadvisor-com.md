# Design System Inspired by Tripadvisor

> Auto-extracted from `https://www.tripadvisor.com/Attractions-h3-Culture_Activities.html` on 2026-07-02

## 1. Visual Theme & Atmosphere

Friendly, approachable design with rounded shapes and generous whitespace.

The hero section leads with "Take in the culture".

**Key Characteristics:**
- Trip Sans VF as the heading font (custom web font loaded via @font-face)
- Trip Sans VF as the body font for all running text
- Heading weight 800, letter-spacing 0.56px
- Light/white background (#ffffff) as the primary canvas
- Primary accent `#0000ee` used for CTAs and brand highlights
- 3 shadow level(s) detected — tinted shadows
- Rounded corners (50px+) creating a friendly, approachable feel
- Tags: light, rounded, accented, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#0000ee`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Background** (`#ffffff`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#f7f7f7`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#002b11`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#f7f7f7`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#ffffff` | `--palette-1` | button | large | text-dark |
| 2 | `#f7f7f7` | `--palette-2` | badge | large | text-dark |
| 3 | `#eaeaea` | `--palette-3` | block | large | text-dark |
| 4 | `#002b11` | `--palette-4` | text-accent | medium | text-light |
| 5 | `#0000ee` | `--palette-5` | text-accent | small | text-light |
| 6 | `#1f442e` | `--palette-6` | text-accent | small | text-light |

## 3. Typography Rules

- **Heading Font:** `Trip Sans VF` (web font)
- **Body Font:** `Trip Sans VF` (web font)

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Trip Sans VF | 28px | 800 | 28px | 0.56px |
| H2 | Trip Sans VF | 28px | 800 | 34px | normal |
| H3 | Trip Sans VF | 18px | 700 | 22px | normal |
| Body | Trip Sans VF | 14px | 400 | 18px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `44px` | headings |
| H1 | `28px` | headings |
| H2 | `18px` | headings |
| H3 | `16px` | headings |
| H4 | `14px` | headings |
| Body L | `13.3333px` | body / supporting text |
| Body | `12px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: transparent;
  color: #002b11;
  border-radius: 0px;
  padding: 0px 0px;
  font-size: 13.3333px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Pill Button

```css
.btn-pill {
  background: #ffffff;
  color: #002b11;
  border-radius: 1000px;
  padding: 9.5px 16px;
  font-size: 13.3333px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Outline Button

```css
.btn-outline {
  background: transparent;
  color: #002b11;
  border-radius: 20px;
  padding: 6px 6px;
  font-size: 13.3333px;
  font-weight: 400;
  border: 0.8px solid rgba(0, 0, 0, 0);
  cursor: pointer;
}
```

### Filled Button

```css
.btn-filled {
  background: #ffffff;
  color: #ffffff;
  border-radius: 20px;
  padding: 6px 6px;
  font-size: 13.3333px;
  font-weight: 400;
  border: 0.8px solid rgba(0, 0, 0, 0);
  cursor: pointer;
}
```

### Filled Button 2

```css
.btn-filled-2 {
  background: #ffffff;
  color: #99aaa0;
  border-radius: 20px;
  padding: 6px 6px;
  font-size: 13.3333px;
  font-weight: 400;
  border: 0.8px solid rgb(153, 170, 160);
  cursor: pointer;
}
```

### Filled Button 3

```css
.btn-filled-3 {
  background: #ffffff;
  color: #002b11;
  border-radius: 50px;
  padding: 5px 5px;
  font-size: 13.3333px;
  font-weight: 400;
  border: 0.8px solid rgba(0, 0, 0, 0);
  cursor: pointer;
}
```

## 5. Layout Principles

- **Base spacing unit:** `5px` — use multiples (10px, 15px, 20px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `5px` | element |
| spacing-2 | `2px` | element |
| spacing-3 | `4px` | element |
| spacing-4 | `32px` | card |
| spacing-5 | `6px` | element |
| spacing-6 | `12px` | element |
| spacing-7 | `156px` | section |
| spacing-8 | `9.5px` | element |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-card | `50px` | card |
| radius-button | `6px` | button |
| radius-button | `8px` | button |
| radius-subtle | `4px` | subtle |
| radius-card | `20px` | card |
| radius-button | `12px` | button |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Mid | `rgba(0, 0, 0, 0.2) 0px 4px 8px 0px` | Dropdowns, popovers |
| Mid | `rgba(0, 0, 0, 0.16) 0px 2px 12px 0px` | Dropdowns, popovers |
| Low | `rgba(0, 0, 0, 0.16) 0px 2px 4px 0px` | Cards, subtle elevation |


## 7. Do's and Don'ts

### Do
- Use `#ffffff` as the primary background color
- Use `Trip Sans VF` for all headings and `Trip Sans VF` for body text
- Use `#0000ee` as the single dominant accent/CTA color
- Maintain `5px` as the base spacing unit — all gaps should be multiples
- Use rounded corners (`50px`+) consistently for all interactive elements
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 800 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Trip Sans VF/Trip Sans VF with generic alternatives
- Don't use irregular spacing — stick to 5px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use pure black (#000000) for text — use `#002b11` instead
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
- Maintain 5px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #ffffff
Text:        #002b11
Accent:      #0000ee
Border:      #f7f7f7
```

### Example Prompts

1. "Build a hero section with a `#ffffff` background, `Trip Sans VF` heading in `#002b11`, and a `#0000ee` CTA button with 1000px radius."
2. "Create a pricing card using background `#f7f7f7`, border `#f7f7f7`, `Trip Sans VF` for text, and 15px padding."
3. "Design a navigation bar — `#ffffff` background, `#002b11` links, `#0000ee` for active state."
4. "Build a feature grid with 3 columns, 15px gap, each card using the card component style."
5. "Create a footer with `#002b11` background, `#ffffff` text, and 10px padding."

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

> 683 custom properties extracted from `:root` / `html` stylesheets.

### Color Variables

| Variable | Value |
|---|---|
| `--sub-brands-trip-rewards` | `#b2ff1a` |
| `--sub-brands-trip-rewards-outline` | `#74a043` |
| `--sub-brands-on-inverse-trip-rewards` | `#b2ff1a` |
| `--sub-brands-inverse-trip-rewards-outline` | `#e9f0e1` |
| `--trip-ai-fixed-hover` | `#7346ae` |
| `--trip-ai-fixed-pressed` | `#663e9a` |
| `--trip-ai-fixed-disabled` | `#ccb8e6` |
| `--state-layer-outer-focused-fixed` | `#0000f5` |
| `--state-layer-inner-focus-fixed` | `#fff` |
| `--gai-button-outline-fixed` | `#8c61c2` |
| `--scheme-surface` | `#fff` |
| `--scheme-on-surface` | `#002b11` |
| `--scheme-on-surface-variant` | `#38443a` |
| `--scheme-inverse-surface` | `#000` |
| `--scheme-inverse-on-surface` | `#f7f7f7` |
| `--scheme-surface-dim` | `#eaeaea` |
| `--scheme-surface-bright` | `#fff` |
| `--scheme-surface-container-lowest` | `#fcfcfc` |
| `--scheme-surface-container-low` | `#f7f7f7` |
| `--scheme-surface-container` | `#eaeaea` |
| `--scheme-surface-container-high` | `#d7d6d6` |
| `--scheme-surface-container-highest` | `#b9b7b7` |
| `--scheme-primary` | `#002b11` |
| `--scheme-on-primary` | `#f7f7f7` |
| `--scheme-primary-container` | `#fff` |
| `--scheme-on-primary-container` | `#002b11` |
| `--scheme-inverse-primary` | `#dfe1df` |
| `--scheme-primary-fixed` | `#fff` |
| `--scheme-on-primary-fixed` | `#002b11` |
| `--scheme-primary-fixed-dim` | `#f7f7f7` |
| ... | *(364 more)* |

### Spacing Variables

| Variable | Value |
|---|---|
| `--trip-sans-regular` | `400` |
| `--trip-sans-medium` | `700` |
| `--trip-sans-bold` | `800` |
| `--trip-sans-ultra` | `900` |
| `--breakpointLarge` | `1184px` |
| `--breakpointMedium` | `1024px` |
| `--breakpointSmall` | `768px` |
| `--overlays` | `10104` |
| `--state-opacity-hover` | `0.8` |
| `--state-opacity-focused` | `0.8` |
| `--state-opacity-disabled` | `0.4` |
| `--state-opacity-pressed` | `0.7` |
| `--radius-small` | `4px` |
| `--radius-medium` | `6px` |
| `--radius-large` | `8px` |
| `--radius-xlarge` | `12px` |
| `--radius-full` | `1000px` |
| `--stroke-default` | `1px` |
| `--stroke-active` | `2px` |
| `--ghost-stroke-default` | `1.5px` |
| ... | *(158 more)* |

### Other Variables

| Variable | Value |
|---|---|
| `--trip-ease` | `cubic-bezier(0.25,0.1,0,1)` |
| `--ta-sans-serif` | `"Trip Sans VF","Trip Sans",Arial,sans-serif` |
| `--ta-serif` | `Georgia,"Times New Roman","Century Schoolbook L",serif` |
| `--ta-monospace` | `"Trip Sans Mono",Courier,monospace,Arial,sans-serif` |
| `--adaptive-display-10-large` | `normal 900 44px/48px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-10-small` | `normal 900 28px/31px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-30-large` | `normal 900 62px/68px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-30-small` | `normal 900 38px/42px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-large-desktop` | `normal 900 62px/68px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-large-mobile` | `normal 900 38px/42px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-small-desktop` | `normal 900 44px/48px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-display-small-mobile` | `normal 900 28px/32px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-title-40-large` | `normal 800 28px/34px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-title-40-small` | `normal 800 24px/29px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| `--adaptive-title-desktop` | `normal 800 28px/32px "Trip Sans VF","Trip Sans",arial,sans-serif` |
| ... | *(96 more)* |

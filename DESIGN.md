---
version: 1.0.0
name: Executive Obsidian & Burnished Amber
description: Authoritative, high-conviction design system for CV Matcher Studio — an executive-tier career intelligence and ATS matching suite.
colors:
  canvas: "#0B0C0E"
  surface-base: "#111317"
  surface-elevated: "#16191F"
  surface-interactive: "#1D222A"
  border-subtle: "#1E222A"
  border-default: "#272C37"
  border-highlight: "#D97706"
  brand: "#F59E0B"
  brand-hover: "#D97706"
  brand-subtle: "rgba(245, 158, 11, 0.08)"
  success: "#10B981"
  success-subtle: "rgba(16, 185, 129, 0.1)"
  warning: "#F59E0B"
  danger: "#EF4444"
  text-primary: "#F3F4F6"
  text-secondary: "#9CA3AF"
  text-muted: "#6B7280"
typography:
  font-sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-mono: "'JetBrains Mono', monospace"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  badge: "4px"
---

# CV Matcher Studio — Executive Design System

## Overview
CV Matcher Studio is engineered as an institutional-grade career intelligence and ATS matching cockpit. The aesthetic repudiates generic "AI startup" tropes (blurry glassmorphism, glowing cyan/purple aurora mesh gradients, childish 16px-32px rounded pill cards) in favor of the disciplined, high-conviction language of tier-1 startups (e.g., Ramp, Mercury, Linear, Carta).

## Colors
- **Canvas (`#0B0C0E`)**: Matte obsidian charcoal foundation with a faint 32px architectural micro-grid.
- **Surfaces**:
  - `surface-base` (`#111317`): Flat, solid primary cards and containers.
  - `surface-elevated` (`#16191F`): Inputs, active tabs, nested sub-sections.
  - `surface-interactive` (`#1D222A`): Hover state for list items and actionable cards.
- **Borders**:
  - `border-subtle` (`#1E222A`): Structural grid divisions.
  - `border-default` (`#272C37`): Card perimeters and input strokes.
  - `border-highlight` (`#D97706`): Focused inputs, active steps, and selection state.
- **Brand Accent (`#F59E0B` / `#D97706`)**: Burnished warm amber gold, delivering high prestige, confidence, and authority without saturated neon noise.
- **Semantic Accents**:
  - `success` (`#10B981`): Emerald verification for zero-hallucination badges and high ATS match scores.
  - `danger` (`#EF4444`): Controlled crimson for missing critical requirements and errors.

## Typography
- **Primary Interface**: Plus Jakarta Sans. Sentence case, tight tracking (`-0.015em`) on headlines, robust semi-bold (`600`) weights for actionable labels.
- **Metrics & Code**: JetBrains Mono with tabular figures (`font-variant-numeric: tabular-nums`) for match scores, ATS percentages, and terminal diagnostics.

## Layout & Geometry
- **Architectural Radii**:
  - Cards & Modals: `4px - 6px` (`rounded-md`).
  - Badges & Buttons: `4px` (`rounded`).
  - Dropdowns & Inputs: `4px` (`rounded`).
- **Precision Spacing**: Consistent 4px/8px modular scale, avoiding sprawling empty voids while maintaining breathing room for data density.

## Elevation & Depth
- **Zero Glassmorphism**: Eliminate performance-heavy `backdrop-filter: blur(16px)` and translucent floating layers.
- **Crisp Structural Layering**: Visual hierarchy is communicated through solid matte tone shifts (`#0B0C0E` → `#111317` → `#16191F`) and razor-sharp 1px stroke borders.
- **Tactile Feedback**:
  - Primary button: Solid burnished amber with micro-press physics (`active:translate-y-[1px]`).
  - Interactive cards: 1px border shift to `#374151` + subtle 1px upward lift on hover.

## Do's and Don'ts
- **DO** use sentence case on headers and badges.
- **DO** use `tabular-nums` for all quantitative ATS match numbers.
- **DON'T** use purple, indigo, or neon cyan gradients.
- **DON'T** use floating colored blur circles or aurora mesh backgrounds.
- **DON'T** use generic pill-shaped `rounded-full` badges for enterprise actions.

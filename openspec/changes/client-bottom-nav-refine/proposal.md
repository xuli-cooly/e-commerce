## Why

The bottom TabBar uses a teal `#01c2c3` active color with a top-edge dot indicator and icon scale-up animation — this is inconsistent with the European minimal redesign applied to the rest of the app (warm white background, dark charcoal accents, flat borders). The nav currently feels like a generic mobile app rather than a refined, minimal interface.

## What Changes

- Replace the teal `#01c2c3` active color with dark charcoal `#1a1a1a`
- Replace the top 3px dot `::before` indicator with a pill/capsule background behind the active icon
- Remove the icon scale-up animation (active icon stays same size)
- Slightly reduce inactive label opacity to create a clearer active/inactive contrast
- Keep `#01c2c3` for the cart badge count (semantic, small, not decorative)

## Capabilities

### New Capabilities

- `bottom-nav-active-style`: Active tab uses a small rounded pill background (`#1a1a1a` or warm dark) behind icon instead of a dot indicator + teal color

### Modified Capabilities

<!-- None — no spec-level behavior changes, purely visual -->

## Impact

- `apps/client/src/styles/global.css` — bottom-nav CSS block
- `apps/client/src/components/BottomNav.tsx` — may need inline style for pill background on active item

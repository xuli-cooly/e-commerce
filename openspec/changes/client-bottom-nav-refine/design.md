## Context

The app recently underwent a full European minimal redesign — warm off-white background (`#FAF8F5`), charcoal `#1a1a1a` accents, flat borders (`1px solid #EBEBEB`), no box-shadows, 8px border-radius throughout. The bottom TabBar was intentionally left with its `#01c2c3` active color since it is a semantic navigation element. Now the TabBar needs to align with the new design language.

Current state:
- Active color: `#01c2c3` (teal)
- Active indicator: 3px top-edge dot (`::before` pseudo-element)
- Active icon scale: 1.15× (spring animation)
- Inactive label color: `#b0b0b0`

## Goals / Non-Goals

**Goals:**
- Active tab uses charcoal `#1a1a1a` (icon + label)
- Active indicator becomes a small pill/capsule background behind the icon instead of a top dot
- Remove icon scale-up; let the pill background provide sufficient active emphasis
- Maintain `#01c2c3` for cart Badge count (semantic status indicator, not decorative)
- Keep tap press animation (`scale(0.88)`) for tactile feedback

**Non-Goals:**
- Changing tab order or tab count
- Modifying BottomNav component logic (routing, badge)
- Animated transitions between tabs
- Dark mode

## Decisions

**Active indicator: pill background instead of top dot**
- The dot indicator at the top edge is an older material-style pattern
- A pill/capsule (`border-radius: 12px`, ~40px wide, ~28px tall, `background: rgba(0,0,0,0.07)`) behind the icon provides subtle but clear active state without color
- Implemented via `::before` pseudo-element repositioned to wrap the icon, or via an inline background on the icon wrapper in the component
- Chosen approach: CSS-only — reuse `.bottom-nav-item.active::before` with new dimensions and centering relative to the icon

**Active color: #1a1a1a**
- Matches the global design token used for all active/selected states (category tabs, sort tabs)
- Inactive stays `#b0b0b0` (same, provides sufficient contrast)

**Icon scale: removed**
- The pill background is sufficient visual feedback; scale-up adds energy that conflicts with minimal aesthetic

## Risks / Trade-offs

- [Pill background visibility] On a white nav, `rgba(0,0,0,0.07)` may be too subtle → Use `rgba(0,0,0,0.08)` or `#EBEBEB` solid for clearer contrast
- [::before dimensions] The pseudo-element needs to be centered on the icon, not the full item — requires careful positioning

## Migration Plan

CSS-only change. No data migrations, no API changes. Deploy is a frontend Vite build.

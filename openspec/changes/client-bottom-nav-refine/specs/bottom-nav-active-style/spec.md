## ADDED Requirements

### Requirement: Active tab uses charcoal color
The active tab item SHALL display icon and label in `#1a1a1a` (charcoal) instead of teal `#01c2c3`.

#### Scenario: Active tab color
- **WHEN** a tab is the active route
- **THEN** its icon and label color SHALL be `#1a1a1a`

#### Scenario: Inactive tab color
- **WHEN** a tab is not the active route
- **THEN** its icon and label color SHALL be `#b0b0b0`

### Requirement: Active tab shows pill background indicator
The active tab item SHALL display a small rounded pill/capsule background behind the icon as the active indicator, replacing the top-edge dot.

#### Scenario: Pill background appears on active tab
- **WHEN** a tab is the active route
- **THEN** a pill-shaped background (`#EBEBEB`, `border-radius: 12px`, approx 40×28px) SHALL appear centered behind the tab's icon

#### Scenario: No top-edge dot on active tab
- **WHEN** a tab is the active route
- **THEN** no dot or bar indicator SHALL appear at the top edge of the nav

### Requirement: Active tab icon does not scale
The active tab icon SHALL NOT scale up (no transform scale animation on active state).

#### Scenario: Icon size stable on active tab
- **WHEN** a tab becomes active
- **THEN** the icon size SHALL remain the same as inactive tabs (no scale transform)

### Requirement: Cart badge color unchanged
The cart tab badge count SHALL remain `#01c2c3` (Ant Design default or explicit override) as a semantic status indicator.

#### Scenario: Cart badge visible with count
- **WHEN** cart has items
- **THEN** the badge count SHALL display in the existing accent color, not charcoal

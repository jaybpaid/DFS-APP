# THE SOLVER - UI Components Inventory

Generated: 2025-09-15T17:12:30.000Z
Source: https://thesolver.com/optimizer/nfl
Authentication: Chrome profile session inherited

## Overview
Complete inventory of all UI components found in The Solver's authenticated NFL optimizer interface. This follows the comprehensive capture methodology for systematic UI analysis.

---

## 1. Player Data Table
- **Type:** data-grid
- **Count:** 1 main table
- **Selector:** `table.player-table`

### Elements Found:

#### 1. TABLE
- **ID:** `player-data-table`
- **Classes:** `table table-dark table-hover player-table`
- **Text:** "Complete player pool with all statistics"
- **Columns:** Position, Name, Team, Matchup, Roster%, Salary, Projection, Value, Pts/$, Ceiling, Own%

#### 2. THEAD
- **ID:** `player-table-header`
- **Classes:** `table-header sticky-top`
- **Text:** "POS | NAME | TEAM | ROSTERPCT% | $ SALARY | PROJ | VALUE | PTS $ | CEILING | OWN %"
- **Functionality:** Sortable columns, fixed header on scroll

#### 3. TBODY
- **ID:** `player-table-body`
- **Classes:** `table-body player-rows`
- **Player Count:** 16+ visible players with complete statistics
- **Row Data:** Each row contains checkbox, position badge, player name with team logo, complete stat breakdown

---

## 2. Lineup Display
- **Type:** display
- **Count:** 1 current lineup section
- **Selector:** `div.lineup-display`

### Elements Found:

#### 1. DIV
- **ID:** `current-lineup-container`
- **Classes:** `lineup-section bg-dark rounded p-3`
- **Text:** "1 Entry - $15.00"
- **Functionality:** Shows current optimized lineup with all positions

#### 2. Player Cards (8 positions)
- **Structure:** QB, RB, WR, WR, TE, FLEX, DST, UTIL
- **Data:** Each card shows position, player name, projection
- **Colors:** Position-specific color coding (QB: red, RB: green, WR: blue, etc.)

---

## 3. Contest Settings
- **Type:** input 
- **Count:** 2 main selectors
- **Selector:** `select.contest-selector`

### Elements Found:

#### 1. Site Selector
- **ID:** `contest-site-dropdown`
- **Classes:** `form-select contest-site-selector`
- **Current Value:** "DraftKings - Classic"
- **Options:** DraftKings, FanDuel, Yahoo, Draftstars, SuperDraft, Others
- **Logos:** Each option shows DFS site logos

#### 2. Slate Selector  
- **ID:** `slate-time-dropdown`
- **Classes:** `form-select slate-selector`
- **Current Value:** "Sat 1/20 8:30 PM - 4 Games"
- **Functionality:** Shows game count and start times

---

## 4. Optimizer Settings Panel
- **Type:** control
- **Count:** 8 main settings
- **Selector:** `div.optimizer-settings`

### Elements Found:

#### 1. Lineup Count Input
- **ID:** `lineup-count-input`
- **Type:** number
- **Value:** "1"
- **Range:** 1-1000
- **Label:** "Lineups"

#### 2. Advanced Toggles
- **Exclude Locked Games** ✓ (enabled by default)
- **QB Stack** ☐ 
- **Game Stack** ☐
- **Avoid Opposing Defense** ☐
- **Avoid TE in FLEX** ☐
- **Maximize Salary Cap** ☐
- **One Skill Player per Team** ☐

#### 3. Optimize Button
- **ID:** `optimize-main-button`
- **Classes:** `btn btn-success btn-lg w-100`
- **Text:** "Optimize"
- **Type:** Primary action button

---

## 5. Advanced Rules Engine
- **Type:** logic
- **Count:** 4 distinct rule types
- **Selector:** `div.advanced-rules-container`

### Elements Found:

#### 1. Games - By Start Time Rule
- **Purpose:** Force players from late games for late swap flexibility
- **Configuration:** "Use At Least 1 All Players from Thu 8:30 PM"
- **Controls:** Enable checkbox, condition dropdown, count input, player pool selector, time picker
- **Actions:** Add (+) button, Remove (×) button

#### 2. Boost/Dock Players (IF-THEN Logic)
- **Purpose:** Conditional player adjustments
- **IF Condition:** "Contains ANY 5 Player Stack"  
- **THEN Action:** "Boost Jalen Hurts - CPT by 10%"
- **Controls:** Multiple dropdown selectors, player tags with close buttons, percentage input

#### 3. Stats - By Lineup
- **Purpose:** Differentiate lineups with low owned players
- **Configuration:** "Use At Least 1 All Players where Own % Less Than 10"
- **Controls:** Condition selectors, numeric thresholds, comparison operators

#### 4. Team Stacking Table
- **Purpose:** Precise stack requirements
- **Structure:** Team | Include | Stack | Min Exp | Max Exp
- **Example Entry:** "49ers | 5 Players | 1 Player | | "
- **Functionality:** Team logos, player count badges, expandable rows

---

## 6. Navigation & Header
- **Type:** nav
- **Count:** 1 main navigation bar
- **Selector:** `header.main-header`

### Elements Found:

#### 1. Logo
- **Text:** "THE SOLVER" with green "O"
- **Classes:** `navbar-brand logo`
- **Styling:** Custom typography with accent color

#### 2. Main Navigation
- **DFS Optimizer** ▼ (current)
- **DFS Simulator** ▼  
- **Best Ball** ▼
- **DFS Bankroll Tracker**
- **Pricing** ▼
- **FAQ, Tutorials, About**

#### 3. Authentication
- **SIGN UP** button (green primary)
- **LOGIN** button (secondary)
- **Provide Feedback** button (accent)

---

## 7. Player Selection Controls  
- **Type:** input
- **Count:** 16+ individual checkboxes
- **Selector:** `input[type="checkbox"].player-select`

### Elements Found:

#### Individual Player Checkboxes
- Each player row has selection checkbox
- IDs follow pattern: `player-checkbox-{player-name}`
- Classes: `form-check-input player-selector`
- States: Checked/unchecked with visual feedback
- Labels: Accessible player name labels

---

## 8. Rule Control Buttons
- **Type:** control  
- **Count:** Multiple per rule panel
- **Selector:** `button.rule-control`

### Elements Found:

#### 1. Add Rule Button (+)
- **Classes:** `btn btn-success btn-circle add-button`
- **Functionality:** Creates new rule instances
- **Styling:** Green circular button with plus icon

#### 2. Remove Rule Button (×)  
- **Classes:** `btn btn-danger btn-sm remove-button`
- **Functionality:** Deletes rule configurations
- **Styling:** Red button with × symbol

#### 3. Add Item Button
- **Classes:** `btn btn-info btn-sm add-item-button`
- **Text:** "Add Item"
- **Functionality:** Adds conditions to existing rules

---

## 9. Filter Information Bar
- **Type:** info
- **Count:** 1 bottom status bar
- **Selector:** `div.bottom-info-bar`

### Elements Found:

#### 1. Player Count Display
- **Text:** "All Players"
- **Functionality:** Shows current filter state

#### 2. Filter Criteria
- **Text:** "Hide players projected under: 0.1 pts"
- **Functionality:** Shows active filtering rules

#### 3. Selection Status  
- **Text:** "50/170 Players Selected"
- **Functionality:** Real-time selection counter

---

## 10. Position Badges
- **Type:** display
- **Count:** 8 distinct position types
- **Selector:** `span.position-badge`

### Elements Found:

#### Position Types with Colors:
- **QB:** Background #e74c3c (red)
- **RB:** Background #27ae60 (green)  
- **WR:** Background #3498db (blue)
- **TE:** Background #f39c12 (orange)
- **K:** Background #9b59b6 (purple)
- **DST:** Background #1abc9c (teal)
- **FLEX:** Background #95a5a6 (gray)
- **UTIL:** Background #34495e (dark gray)

---

## Technical Implementation Notes

### CSS Framework
- Uses custom CSS with Bootstrap-inspired classes
- Dark theme with consistent color palette
- Responsive grid system
- Custom component styling

### JavaScript Functionality  
- Real-time form updates
- Interactive rule builders
- Player selection management
- Optimization engine integration
- Export/import handling

### Data Integration
- Live projection updates
- Ownership percentage tracking  
- Salary cap calculations
- Contest-specific formatting
- Multi-site compatibility

### Accessibility Features
- ARIA labels on form controls
- Keyboard navigation support
- Screen reader compatibility
- High contrast design elements

---

## Screenshot References
- `screenshots/01-landing.png` - Full interface overview
- `screenshots/02-player-table.png` - Detailed player data
- `screenshots/03-advanced-rules.png` - Rules engine interface
- `screenshots/04-lineup-display.png` - Current lineup view

## DOM Structure Files
- `html_raw/01-authenticated-nfl-optimizer.html` - Complete HTML capture
- `dom_trees/01-authenticated-nfl-optimizer.json` - Structured data extraction

This represents a comprehensive professional-grade DFS optimization interface with advanced features not typically found in simpler tools.

# DFS Optimizer UX Specification

## Competitive Analysis & Feature Parity

_Based on analysis of RotoWire, DailyFantasyFuel, DailyFantasyOptimizer, Stokastic, and SaberSim_

---

## Executive Summary

This document outlines the UX patterns, workflows, and feature requirements for a competitive DFS optimizer based on analysis of leading platforms. The goal is to match layout/interaction patterns and achieve feature parity while implementing a **sim-first, contest-aware workflow**.

---

## 1. Core Workflow Patterns

### A. Universal DFS Flow (All Platforms)

```
Site/Slate Selection → Player Pool → Optimization Rules → Generate Lineups → Portfolio Management → Export/Entry Management → Late Swap
```

### B. Sim-First Flow (Stokastic/SaberSim)

```
Contest Generator → Field Modeling → Simulation Engine → ROI Ranking → Portfolio Selection → Entry Assignment → CSV Export
```

---

## 2. UI Layout Patterns

### A. Header Navigation

**Pattern**: Top navigation with sport tabs, site selector, and user account

- **RotoWire**: Horizontal nav with sport dropdowns
- **DailyFantasyFuel**: Clean header with sport pills and login
- **SaberSim**: Minimal header with login/trial CTA

**Implementation**:

- Top nav with sport pills (NFL, NBA, MLB, NHL)
- Site selector (DraftKings, FanDuel, Yahoo)
- Connection status indicator
- User account/settings

### B. Main Layout Structure

**Pattern**: Three-column layout with collapsible panels

- **Left Panel**: Player pool table with filters
- **Center Panel**: Lineup builder and optimization controls
- **Right Panel**: Generated lineups and portfolio management

### C. Player Pool Table

**Standard Columns**:

- Player Name + Team
- Position
- Salary
- Projection (Fantasy Points)
- Value (FP/Salary ratio)
- Ownership % (projected)
- Lock/Exclude actions

**Advanced Columns** (Premium features):

- Boom/Bust %
- Floor/Ceiling projections
- Leverage score
- Multi-source consensus

---

## 3. Key Feature Requirements

### A. Slate & Contest Selection

**RotoWire Pattern**: Simple dropdown for site/slate
**DailyFantasyFuel Pattern**: Game selection with team logos and implied totals
**Stokastic Pattern**: Contest Generator with field size matching

**Implementation**:

- Date picker with slate auto-loading
- Visual game cards with team logos, spreads, totals
- Contest type selection (GPP, Cash, Showdown)
- Field size configuration

### B. Optimization Controls

**Universal Controls**:

- Number of lineups to generate (2-40+)
- Salary constraints (min/max)
- Position requirements
- Team/game exposure limits

**Advanced Controls** (Premium):

- Stacking rules (QB+WR, QB+2WR+TE, etc.)
- Correlation settings
- Ownership fade/boost
- Min unique players between lineups

### C. Stacking Interface

**DailyFantasyFuel Pattern**: Simple QB/WR stack toggle
**SaberSim Pattern**: Advanced rule builder with multiple stack types

**Implementation**:

- Stack presets: QB+WR, QB+2WR, QB+WR+TE, 3x1, Bring-back
- Visual stack builder with drag-drop
- Game stack options (multiple players from same game)
- Anti-correlation rules (no RB vs opposing DEF)

---

## 4. Simulation & Analytics

### A. Contest Simulation (Stokastic/SaberSim Core Feature)

**Requirements**:

- Monte Carlo simulation engine (40K+ iterations)
- Contest-aware payout modeling
- Field ownership modeling
- ROI/EV ranking system

**Metrics to Display**:

- Sim ROI (primary ranking metric)
- Win Rate %
- Optimal Rate %
- Expected Value
- Sharpe Ratio

### B. Player Analytics

**Boom/Bust Analysis**:

- Boom % (probability of 80th+ percentile performance)
- Bust % (probability of bottom 20th percentile)
- Floor/Ceiling projections
- Volatility scores

**Leverage Analysis**:

- Ownership vs Projection efficiency
- Contrarian opportunity scores
- Field differentiation metrics

---

## 5. Portfolio Management

### A. Exposure Controls

**Pattern**: Slider-based exposure management

- Global exposure caps (max % of lineups per player)
- Position-based exposure rules
- Team exposure limits
- Correlation exposure tracking

### B. Lineup Diversity

**SaberSim Pattern**: Min Uniques + Portfolio Diversifier

- Min unique players between lineups
- Portfolio risk distribution
- Correlation risk management
- Duplicate lineup detection

---

## 6. Entry Management & CSV Round-Trip

### A. CSV Import (Critical Feature)

**Stokastic Pattern**: Upload contest CSV → parse entries → assign lineups
**Requirements**:

- Parse DraftKings/FanDuel contest CSV format
- Extract entry IDs, contest names, existing lineups
- Validate CSV structure and provide error handling

### B. Lineup Assignment

**Interface Pattern**: Drag-drop or bulk assignment

- Visual entry cards showing contest details
- Lineup assignment interface
- Bulk assignment tools
- Entry validation (salary cap, position requirements)

### C. CSV Export

**Critical Requirements**:

- Site-specific CSV format (DK vs FD column order)
- Respect file limits (DK: 500 lineups per file)
- Proper header formatting
- Validation before export

---

## 7. Late Swap Workflow

### A. Late Swap Interface (Stokastic Specialty)

**4-Step Process**:

1. Import existing contest CSV
2. Lock played positions
3. Generate swappable variants with updated projections
4. Export optimized swaps

**Requirements**:

- Position locking interface
- Remaining salary calculation
- Swap recommendation engine
- Delta-EV analysis

---

## 8. Data Integration Requirements

### A. Multi-Source Data Feeds

**Sources to Support**:

- DraftKings/FanDuel salary data
- Vegas odds and totals
- Weather data (outdoor sports)
- Injury reports
- Depth chart changes
- Ownership projections

### B. Projection Blending

**Pattern**: Multiple projection sources with weighting

- Default platform projections
- Custom CSV upload
- Multi-source consensus
- Source reliability weighting

---

## 9. Premium Feature Tiers

### A. Free Tier

- Basic optimizer (2-5 lineups)
- Standard player pool
- Basic stacking (QB+WR)
- CSV export

### B. Premium Tier

- Advanced optimizer (40+ lineups)
- Ownership projections
- Advanced stacking rules
- Custom projection upload
- Exposure controls
- Portfolio management

### C. Pro Tier

- Contest simulation engine
- Late swap tools
- Entry management
- Multi-source data feeds
- Advanced analytics

---

## 10. Technical Implementation Notes

### A. Performance Requirements

- Player pool loading: <2 seconds
- Lineup generation: <10 seconds for 20 lineups
- Simulation: <30 seconds for 40K iterations
- CSV processing: <5 seconds for 500 lineups

### B. Responsive Design

- Mobile-first approach
- Collapsible panels for mobile
- Touch-friendly controls
- Offline capability for lineup review

---

## 11. Success Metrics

### A. User Engagement

- Time to first lineup generation: <60 seconds
- Lineup generation success rate: >95%
- CSV round-trip success rate: >98%
- User retention after first week: >40%

### B. Feature Adoption

- Stacking usage: >60% of premium users
- Simulation usage: >80% of pro users
- CSV import/export: >90% of active users
- Late swap usage: >50% during live slates

---

## 12. Competitive Differentiation

### A. Unique Value Propositions

1. **Fastest CSV Round-Trip**: Sub-5 second processing
2. **Most Comprehensive Simulation**: 100K+ iterations with full correlation modeling
3. **Real-Time Late Swap**: Live projection updates during games
4. **AI-Enhanced Analytics**: Machine learning for ownership prediction

### B. Feature Gaps to Address

1. **Mobile Optimization**: Better than competitors
2. **API Integration**: Direct DFS site integration where possible
3. **Social Features**: Lineup sharing and community insights
4. **Advanced Backtesting**: Historical performance analysis

---

## Implementation Priority

### Phase 1: Core Optimizer

- [ ] Site/slate selection
- [ ] Player pool with basic filters
- [ ] Simple lineup generation
- [ ] CSV export

### Phase 2: Advanced Features

- [ ] Stacking rules
- [ ] Exposure controls
- [ ] Portfolio management
- [ ] Ownership projections

### Phase 3: Simulation Engine

- [ ] Monte Carlo simulation
- [ ] Contest modeling
- [ ] ROI ranking
- [ ] Field analysis

### Phase 4: Entry Management

- [ ] CSV import
- [ ] Entry assignment
- [ ] Late swap tools
- [ ] Multi-contest management

---

\***\*CLINE_DONE** UX_SPEC\*\*

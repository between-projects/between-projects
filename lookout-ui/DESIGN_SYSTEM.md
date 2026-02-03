# Lookout Design System

A minimal system derived from DESIGN_BRIEF.md.

---

## 1. Design Principles

1. The interface suggests; it never insists.
2. Today is the only default—the past does not accumulate visibly.
3. Calm is the measure of success, not speed or completion count.
4. Every element must earn its presence; nothing decorative, nothing urgent.
5. Silence is a feature—absence of notification is the baseline.
6. Progress is felt over time, not counted in the moment.
7. The system assumes humanity: fatigue, forgetting, and change are expected.
8. Complexity exists but is never imposed—depth is available, not demanded.
9. The interface should feel like weather: present, shifting, unobtrusive.
10. If a design choice creates anxiety, it is wrong.

---

## 2. Typography System

### Primary Typeface Role
- Helvetica Neue or equivalent simple grotesk
- Carries all headings, body text, and interface labels
- Neutral, unassertive, legible at rest
- Never bold for emphasis in running text; weight changes are structural only

### Secondary / Mono Role
- IBM Plex Mono
- Used for time, dates, data, and system-generated content
- Signals "information from elsewhere" — clock, weather, calendar data
- Creates subtle distinction between personal notation and system output

### Sizing Philosophy
- Few sizes, widely spaced in scale
- Large type for greeting and time-of-day orientation
- Medium type for section labels and questions
- Small type for metadata and ambient information
- No size should feel like it is shouting or whispering—all sizes coexist quietly

---

## 3. Color System

### Background Philosophy
- Blue gradient as default ground
- The background is environmental, not decorative—it sets tone, not brand
- Future: background may shift with time of day or sky conditions
- Background should feel like light in a room, not a surface to read against

### Gradient Usage Rules
- Gradients are reserved for background only
- No gradient on text, buttons, or modules
- Gradient transitions must be slow and soft—no hard stops, no dramatic shifts
- Gradient direction: vertical or radial, never diagonal slashes

### Contrast Rules
- Text floats on the gradient with enough contrast for legibility, no more
- Modules are muted, translucent, or softly bounded—not high-contrast cards
- Intentionally muted: secondary metadata, timestamps, system labels
- Intentionally clear: current time, greeting, the single next-action if shown
- No element should "pop"—clarity comes from hierarchy, not contrast violence

---

## 4. Spacing & Layout Philosophy

### Density Rules
- Space is default; content must justify its presence
- Generous margins around all modules
- Modules do not crowd each other—visual breathing room is mandatory
- Empty space is not wasted space; it is part of the calm
- If the screen feels full, something must be removed or hidden

### Grid Behavior
- Loose grid, not rigid
- Modules align but do not lock—slight asymmetry is acceptable
- No dense multi-column layouts for primary view
- Depth is accessed by moving into a module, not by displaying everything at once
- The grid should feel like objects on a desk, not cells in a spreadsheet

---

## 5. Motion & Interaction Rules

### What Animates
- Transitions between states (entering a module, returning to overview)
- Background gradient shifts over long durations (minutes, not seconds)
- Subtle fade when content updates (new day, new weather data)
- All animation is slow, eased, and ignorable

### What Must Never Animate
- Notifications or alerts (there are none)
- Task counts or progress indicators
- Anything that draws the eye reflexively
- Loading spinners visible longer than a breath
- No bounce, no shake, no pulse, no attention-grabbing motion

---

## 6. Information Hierarchy Rules

### What Is Allowed to Ask for Attention
- The greeting and current time (orientation to now)
- A single gentle prompt ("Would you like to...")
- The day-at-a-glance as a whole, not individual items within it
- Nothing else competes for attention

### What Must Remain Ambient
- Weather, location, date — present but not emphasized
- Task lists, note counts, appointment counts — never surfaced as numbers demanding action
- Progress signals — visible only on reflection, never on arrival
- Past-due items — either resolved quietly or not shown; never displayed as failure
- All metadata: timestamps, sources, tags — visible when sought, invisible otherwise

---

## Summary

This system exists to protect the calm. Every decision should be tested against the question: *Does this make the person using it feel more at ease, or less?*

If less, it does not belong.

# Lookout Primary View — Static Prototype Specification

Constrained by DESIGN_BRIEF.md and DESIGN_SYSTEM.md.

---

## 1. File Structure

```
lookout-ui/
├── index.html                  # Single page, primary view only
├── styles/
│   ├── base.css                # Reset, typography, gradient background
│   ├── layout.css              # Spacing, grid, module positioning
│   └── modules.css             # Individual module styling
├── assets/
│   └── fonts/                  # IBM Plex Mono (Helvetica Neue via system)
├── DESIGN_BRIEF.md
├── DESIGN_SYSTEM.md
├── PROTOTYPE_SPEC.md
└── README.md
```

No JavaScript in this phase. Static HTML and CSS only.

---

## 2. Component List

### Greeting Header
**Responsibility:** Orient the user to now — time of day, their name, current conditions.

- Displays greeting text exactly as specified:
  > Good Morning, Jonah. It's x:xx xM and xx°F outside.
- Time-of-day word changes: Morning / Afternoon / Evening
- Uses large type (primary typeface)
- Time and temperature rendered in IBM Plex Mono
- Always visible, always at the top
- No interaction beyond reading

### Prompt Line
**Responsibility:** Offer a single gentle question, not a command.

- Displays:
  > Would you like to do a deep dive on your appointments, tasks, semester goals or notes?
- Uses medium type
- The named areas (appointments, tasks, semester goals, notes) may be subtly interactive in future — for now, plain text
- Never changes based on state or urgency

### Day At A Glance Label
**Responsibility:** Name the organizing frame without demanding attention.

- Displays:
  > Here's your Day At A Glance
- Small/medium type, muted
- Signals transition from greeting to modules
- Not a heading that dominates — a quiet label

### Module: Time / Weather
**Responsibility:** Ambient environmental context.

- Current time (IBM Plex Mono, updates would be slow/minute-based in live version)
- Temperature and conditions (static placeholder for now)
- Location name, muted
- Smallest module visually — present but not emphasized
- No forecast, no multi-day view

### Module: Appointments
**Responsibility:** Show today's calendar without pressure.

- List of today's appointments only
- Each item: time (mono) + description (primary typeface)
- No "X appointments today" count
- No color-coding by urgency
- No past appointments shown as missed
- Placeholder: 2–3 sample appointments

### Module: Tasks / Next Actions
**Responsibility:** Surface what might be done, not what must be done.

- Short list of tasks relevant to today
- No counts, no percentages, no progress bars
- No overdue indicators
- May show a single suggested next action, gently
- Placeholder: 3–4 sample tasks, no hierarchy implied

### Module: Notes / Scratch Paper
**Responsibility:** A place for capture, not organization.

- Recent notes or a single scratch area
- No folder structure visible
- No timestamps unless sought
- Feels like a blank page waiting, not a backlog
- Placeholder: 1–2 sample note titles or a blank state

### Module: Links
**Responsibility:** Hold interesting things without demanding they be read.

- A few saved links
- Title only, source muted or hidden
- No "unread" state, no count
- Placeholder: 2–3 sample links

---

## 3. Empty States and Loading States

### Philosophy
Empty is not failure. Loading is not suspense. Both must feel like the system at rest.

### Empty States by Module

**Appointments — Empty:**
No text like "No appointments today!" Instead:
> Your day is open.

Single line, muted, same position as content would occupy. No icon, no illustration.

**Tasks — Empty:**
> Nothing pressing.

Or simply blank space where tasks would appear. The module remains present but unfilled.

**Notes — Empty:**
The module appears as a soft, empty container. No prompt to "add your first note." Silence.

**Links — Empty:**
> —

A simple dash or nothing at all. The space exists; it is not anxious to be filled.

### Loading States

Loading should be nearly invisible. Per the design system: no spinners visible longer than a breath.

- If content is not yet available, the module appears in its empty state
- When content arrives, it fades in softly (in live version)
- No skeleton screens with pulsing shapes
- No "Loading your tasks..." text
- The greeting and time appear immediately; modules may follow a moment later without announcement

If the system is slow, it simply looks calm and sparse until it isn't.

---

## 4. How This Screen Should Feel to Open

Opening Lookout should feel like entering a quiet room where someone has already drawn the curtains to let in soft light. The greeting knows your name and the time without asking anything of you. The day is laid out not as a series of obligations but as a loose arrangement of objects on a desk — appointments here, a few tasks there, some notes you made, a link you saved. Nothing blinks. Nothing counts down. Nothing reminds you of what you haven't done. The screen breathes. It says: here is today, and here you are. If you want to go deeper into any of it, you can. If you want to sit with this view for a while, that's fine too. The system is not waiting for you to act. It is simply present, like weather, like a clock on the wall, like the room itself.

---

## Constraints Honored

- Greeting text: exact per brief
- "Day At A Glance": present as organizing concept
- Modules: appointments, tasks, notes, links, time/weather — all present
- No notifications: none exist in any state
- No backlog: nothing from before today is surfaced
- Defaults to today: no navigation to past or future in this view
- No real data: all content is placeholder
- No responsiveness: single viewport assumed
- No additional navigation: this is the only view

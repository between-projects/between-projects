# CLAUDE.md

## Project Overview

**between-projects** is a design studio repository by Jonah Langenbeck. The primary project is **Lookout** — a calm, intentional daily dashboard that presents the day without pressure or anxiety. Lookout is explicitly *not* a productivity tracker; it is a "system at rest."

## Repository Structure

```
between-projects/
├── CLAUDE.md                  # This file
├── DESIGN_BRIEF.md            # Studio mission, values, philosophy
├── DESIGN_SYSTEM.md           # Studio-wide tech stack and standards
├── HARD_CONSTRAINTS.md        # Immutable rules protecting calm (FROZEN)
├── README.md                  # Studio about page
└── lookout-ui/                # Lookout dashboard application
    ├── index.html             # Single-page entry point
    ├── CODEX_KICKOFF.md       # Implementation mandate and scope
    ├── DESIGN_BRIEF.md        # Lookout-specific design brief
    ├── DESIGN_SYSTEM.md       # Lookout-specific design tokens
    ├── PROTOTYPE_SPEC.md      # UI/UX specification (FROZEN)
    ├── styles/
    │   ├── base.css           # Reset, CSS variables, typography
    │   ├── layout.css         # Grid, spacing, module positioning
    │   └── modules.css        # Per-module styling
    ├── scripts/
    │   ├── persistence.js     # Entry point — state management, localStorage, hydration
    │   ├── time.js            # Clock display, greeting text, minute-based updates
    │   ├── weather.js         # Open-Meteo API integration, 30-min cache
    │   ├── calendar.js        # Google Calendar OAuth2, 7-min cache
    │   ├── location.js        # Geolocation API, timezone detection
    │   ├── shutdown.js        # End-of-day reflection ritual, Google Drive export
    │   ├── task-edit.js       # Click-to-edit task list with completion state
    │   ├── notes-edit.js      # Click-to-edit multiline notes
    │   ├── links-edit.js      # Click-to-edit links list
    │   └── config.example.js  # Template for Google API credentials
    └── assets/
        └── fonts/             # IBM Plex Mono (empty, needs font files)
```

## Technology

- **Vanilla HTML/CSS/JavaScript** — no frameworks, no build tools, no npm
- **ES6 modules** — `<script type="module">` loaded from `persistence.js`
- **No dependencies** — zero third-party libraries
- **No build step** — serve `lookout-ui/` as static files directly
- **No tests** — no test framework or test files exist
- **No CI/CD** — no GitHub Actions or deployment pipelines

## Hard Constraints (Mandatory)

Every change must respect `HARD_CONSTRAINTS.md`. These override all other considerations:

1. **No notifications** of any kind (visual, audible, background)
2. **No numeric summaries**, counts, badges, or streaks in the primary view
3. **No backlog**, history, or past-due surfacing in the primary view
4. **No urgency coloring** (red/yellow/green) anywhere
5. **No gamification**, rewards, or habit enforcement mechanics
6. **No AI language** or AI presence in the user interface
7. **No feeds**, infinite scrolls, or engagement loops
8. **No reordering** content to drive behavior
9. **Primary view must remain sparse**; density increases are forbidden
10. **If a feature increases anxiety, it must be removed**

If an implementation choice violates any of the above, it is incorrect.

## Frozen Documents

These files are immutable source of truth. Do not modify them:

- `HARD_CONSTRAINTS.md`
- `lookout-ui/PROTOTYPE_SPEC.md`
- `lookout-ui/DESIGN_BRIEF.md` / `DESIGN_BRIEF.md`
- `lookout-ui/DESIGN_SYSTEM.md` / `DESIGN_SYSTEM.md`

When ambiguity arises, defer to calm, restraint, and absence.

## Architecture

### Entry Point

`lookout-ui/index.html` loads a single module script: `scripts/persistence.js`. That file imports all other modules, which self-initialize on load.

### Module Communication

Modules communicate via custom DOM events and shared localStorage:

| Event | Dispatched by | Purpose |
|---|---|---|
| `lookout:tasks-updated` | task-edit.js | Re-hydrate task list from storage |
| `lookout:location-updated` | location.js | Trigger weather refresh for new coords |

### Data Storage

All state lives in the browser:

| Key | Storage | Contents |
|---|---|---|
| `lookout:v1` | localStorage | Tasks, notes, links, location |
| `lookout:weather:v1` | localStorage | Cached weather data (30-min TTL) |
| `lookout:calendar:cache:v1` | localStorage | Cached calendar events (7-min TTL) |
| `lookout:calendar:token:v1` | sessionStorage | Google Calendar OAuth token |
| `lookout:shutdown:token:v1` | sessionStorage | Google Drive/Docs/Gmail OAuth token |

### External APIs

| API | Auth | Usage |
|---|---|---|
| Open-Meteo | None (free) | Current weather by coordinates |
| Google Calendar | OAuth2 (opt-in) | Today's events, read-only |
| Google Drive/Docs/Gmail | OAuth2 (opt-in) | End-of-day export |
| Geolocation | Browser permission | User location for weather/timezone |

### Error Handling Philosophy

**Silent failure.** All errors are silently caught and ignored to preserve calm. No error messages, no alerts, no console warnings to the user. If data cannot be fetched, the UI stays in its empty/placeholder state.

### Empty States

Empty is not failure. Each module has a calm empty state:

- **Appointments**: "Your day is open."
- **Tasks**: "Nothing pressing."
- **Notes**: Blank (silent empty container)
- **Links**: "—" (em dash)

## Development Workflow

### Running Locally

Serve the `lookout-ui/` directory with any static HTTP server:

```sh
cd lookout-ui
python3 -m http.server 8000
# or: npx serve .
```

Open `http://localhost:8000` in a browser.

### Optional: Google Calendar/Shutdown Setup

1. Copy `scripts/config.example.js` to `scripts/config.js`
2. Add your Google OAuth2 Client ID
3. Navigate to `?calendar_auth=1` to authorize calendar access
4. `config.js` is gitignored — never commit credentials

### Commit Message Convention

Follow conventional commits as specified in `DESIGN_SYSTEM.md`:

```
feat: add contact form component
fix: resolve mobile navigation overflow
docs: update API documentation
chore: upgrade dependencies
```

## Key Conventions for AI Assistants

### What You May Do

- Fix bugs in existing functionality
- Add persistence for tasks, notes, and links
- Integrate real data into existing modules (calendar, weather, time)
- Add background data fetching
- Write tests for correctness and regressions

### What You May NOT Do

- Add notifications
- Add counts, summaries, or progress bars
- Add navigation beyond the primary view
- Introduce new visual hierarchy or UI elements
- Change copy or wording
- Add secondary dashboards or views
- Surface past-due or historical information
- Add any feature that increases anxiety

### Implementation Principles

- **Execute, don't design.** The system is already designed. Implement what is specified.
- **Do not be clever.** Do not expand scope. Do not interpret intent.
- **Preserve calm.** If unsure whether a change respects the constraints, stop and ask.
- **Silent failures only.** Never surface errors to the user.
- **No new dependencies.** Keep the project dependency-free.
- **Progressive enhancement.** HTML provides structure, CSS provides styling, JS adds interactivity.

### CSS Variables

Defined in `lookout-ui/styles/base.css`:

```css
--bg-top: #6f89b8;
--bg-bottom: #2f446d;
--text-primary: #f2f5f8;
--text-muted: rgba(242, 245, 248, 0.65);
--module-bg: rgba(255, 255, 255, 0.08);
--module-border: rgba(255, 255, 255, 0.12);
--mono: "IBM Plex Mono", "SFMono-Regular", "Menlo", "Consolas", monospace;
--sans: "Helvetica Neue", "Helvetica", "Arial", sans-serif;
```

### File Naming

- CSS/HTML files: kebab-case (`base.css`, `index.html`)
- JS modules: kebab-case (`task-edit.js`, `notes-edit.js`)
- Documentation: UPPER_CASE with underscores (`HARD_CONSTRAINTS.md`, `DESIGN_BRIEF.md`)

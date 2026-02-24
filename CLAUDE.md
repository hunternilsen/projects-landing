# Interactive Project Portfolio

## Overview
Single-page interactive resume/portfolio for Hunter Nilsen. Static HTML/CSS/JS — no build step, no framework.

## File Structure
- `index.html` — Main page. All CSS is inline in a `<style>` block. References `app.js` externally.
- `app.js` — Client-side JS: role/category filtering, scroll progress bar, IntersectionObserver fade-in animations.
- `projects.md` — Source of truth for all content (experience, education, 15 projects with roles, tags, impact areas, key results).
- `manifest.json` — Domo Custom App manifest (needed if deploying inside Domo).

## Design System
- **Theme:** Dark mode, University of Utah colors
- **Colors:** Utah Red `#BE0000`, Gold `#FFB81D`, Deep Red `#890000`, Gray `#707271`, BG `#0A0A0C`, Surface `#151517`
- **Fonts:** Playfair Display (headings, 700/800) + DM Sans (body, 400/500/600) via Google Fonts
- **Cards:** Dark surface bg, left red-to-gold gradient border, hover lift + glow
- **Layout:** Responsive grid — 3 columns desktop, 2 tablet, 1 mobile

## Key Patterns
- Filters use `data-role` and `data-category` attributes on `.project-card` elements
- `data-filter-type` and `data-filter-value` on `.filter-btn` elements drive filtering
- Sections auto-hide when all their cards are filtered out (`updateSectionVisibility`)
- The Free Trial Growth Initiative card has class `.featured` (full-width, stats grid)
- Respects `prefers-reduced-motion`

## Deployment
- GitHub Pages: https://hunternilsen.github.io/projects-landing/
- Repo: https://github.com/hunternilsen/projects-landing
- Also deployable as a Domo Custom App via `manifest.json`

## Content Updates
When adding or editing projects, update both `projects.md` and `index.html`. Each card needs:
- `data-role` attribute (`revops` or `adops`)
- `data-category` attribute (`dashboards`, `automation`, `enablement`, or `strategic`)
- Role badge with matching class (`.role-badge.revops` or `.role-badge.adops`)
- Category tag from the project's Tags field in `projects.md`

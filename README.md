# Andry Andrianarivelo | Neuroscience

Personal academic website: https://andrianarivelo.github.io/

Static HTML, CSS and JavaScript. No build step or dependencies. GitHub Pages serves the `main` branch at `/ (root)` with Jekyll disabled by `.nojekyll`.

## Update the website

- `index.html`: research, biography, teaching, software cards and contact.
- `content.js`: publication references and DOI links.
- `site.js`: application dialogs, figure enlargement, publication filters, citation copying and navigation.
- `styles.css`: desktop and mobile layouts.
- `assets/`: photographs, supplied application logos, scientific figure, public CV and conceptual SVG illustrations.

## Preview locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/.

## Interactive features

Research-scale selector, expandable research methods, full-size experimental figure, four application detail sheets, publication filters by type/year/text, citation copying, reading progress and back-to-top navigation. Keyboard interaction, dialog Escape support and reduced-motion preferences are respected.

MAMIR is a private beta. NEMIR uses the author-supplied logo; its repository and technical description will be added when available. Public software links do not imply that every project is open source.

Source code and original abstract SVG illustrations: MIT. Supplied photographs, scientific figure, logos, scientific publications and linked software retain their respective rights. See LICENSE and SOURCES.md.

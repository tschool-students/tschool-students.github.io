# tschool-students.github.io

Static redirect site served by GitHub Pages from `main` / root. Every page redirects
silently — `location.replace` in `<head>`, `meta refresh` as a no-JS fallback, empty `<body>`.

| Path | Goes to |
|---|---|
| `/expo2026` (and anything under it) | the matching path on `tschoolsu.github.io` |
| everything else | an external video |

- `index.html` — root redirect
- `expo2026/index.html` — handles `/expo2026` and `/expo2026/`
- `404.html` — catch-all; forwards the `/expo2026/*` subtree, otherwise falls back to the video

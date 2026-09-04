# tschool-students.github.io

Forwarding shim. The account behind this site moved to `tschoolsu`, so every request here
is mirrored to the same path on `tschoolsu.github.io`:

    https://tschool-students.github.io/example  ->  https://tschoolsu.github.io/example

Served by GitHub Pages from `main` / root. Redirects happen silently — `location.replace`
in `<head>`, `meta refresh` as a no-JS fallback, empty `<body>`. Query strings and hashes
are carried over.

- `index.html` — the root
- `404.html` — catch-all; rebuilds the target from `location.pathname`, so any path works
  without needing a file for it
- `expo2026/index.html` — real file for `/expo2026`, so that path answers 200 instead of 404

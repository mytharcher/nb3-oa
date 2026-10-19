# NocoOA logos

Generated with [NocoSolution's official logo tool](https://github.com/nocobase/NocoSolution/tree/main/tools/logo), revision `b6d9e203cbad3672348f8e7ffc30d65b6840b085`, on 2026-10-19 (Asia/Singapore). The official mark and bold Noco geometry are unchanged; OA is Chivo Thin converted to paths. The font license is [chivo-OFL.txt](chivo-OFL.txt).

From the upstream `tools/logo/` directory:

```sh
uv run logo.py OA --small -o /path/to/app/public/assets/noco-oa-small.svg --tsx /path/to/app/client/components/brand-logo.tsx
uv run logo.py OA --color '#000000' -o /path/to/app/public/assets/noco-oa.svg
```

The application renders the small version as an inline SVG using `currentColor`, at 18px in the sidebar and 21.6px on authentication pages. Use the standard black SVG for documents, slides, and websites at larger sizes. To export white artwork, rerun the standard command with `--color '#FFFFFF'`.

The generated outlines require no browser font download. Existing PNG assets remain available to other consumers.

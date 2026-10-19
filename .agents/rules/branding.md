# OA branding in the application shell

The application uses NocoOA. Route navigation cannot configure the shell's brand, so `client/layouts/components/app-brand.tsx` composes the generated `client/components/brand-logo.tsx` directly.

- Regenerate the lockup with NocoSolution's `tools/logo/logo.py OA --small --tsx client/components/brand-logo.tsx`. Preserve the official mark and bold Noco paths; OA uses the script's Chivo outlines.
- Use `currentColor` for light and dark themes. The expanded sidebar logo is exactly 18px high; authentication pages pass the same logo as the split layout's `name` at 21.6px, without its boxed `logo` prop. Fixed pixel heights intentionally preserve the requested brand size across density presets.
- The collapsed sidebar shows only the existing official `brand-mark-geometry.ts` paths, within its existing 36px hit area. Keep the brand link to the workbench and its localized accessible name.
- Do not modify the reusable authentication extension or generated shadcn primitives for branding.
- `public/assets/noco-oa.svg` is the standard version for larger external uses; `noco-oa-small.svg` is the application version. Generation provenance and the Chivo license are beside these assets.

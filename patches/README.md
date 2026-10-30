# Narrow application dependency extensions

These patches retain the installed package versions. They are reviewed source
changes applied by pnpm, never edits to the shared dependency store.

- `@nocobase/app-plugin-authentication`: `lockUserForAdministration` accepts an
  optional `shared` mode. PostgreSQL uses FOR SHARE, never FOR KEY SHARE. Existing
  administration callers retain their default exclusive lock; SQLite and other
  dialects keep the previous behavior.
- `@nocobase/db`: `Repository.aggregateScoped` accepts named numeric metrics,
  each with a Filter Builder condition and a fixed operation (`count`, `sum`,
  `avg`, `median`, `p90`). Repository validates every field and condition with the
  bound read policy; the common input is intersected with the record scope once.
  The PostgreSQL adapter binds all fields, aliases and values and computes exact
  continuous median and discrete nearest-rank P90. Null samples are ignored.
  Other dialects use the application's existing reporting implementation.
- Scalar sorting omits the synthetic null-order CASE only when the collection's
  physical metadata declares the field non-null or a primary key. Nullable and
  relation sorting retain their existing null behavior.

Regression coverage: repair reporting T09–T12 and restricted-field probes;
shared-qualification concurrency/revocation; the isolated 100k capacity fixture.
No arbitrary SQL expressions are exposed to application callers.

# Request drawer loading handoff

Application request routes in `client/routing/client-route.tsx` display loading,
access failures and module failures in a visible RouteDrawer over the workbench.
Once the module loads, its business-owned drawer replaces that loading portal.
The route supplies `RouteOverlayHandoffContext` so the replacement panel and
backdrop do not replay their entrance animations. Ordinary routes retain their
animations; RouteOverlay resets the context for nested overlays.

Route metadata cannot express this loader-to-business-portal handoff. Preserve
this application shell customization during template upgrades, along with generic
denied/error messages and the workbench exit. Form ownership, close guards,
permissions and data loading remain with their existing components.

Views whose loading/error panels and ready form live in different component
subtrees use `RouteOverlaySequence`, keyed by their existing identity boundary.
The first mounted overlay enters normally; later replacements in that sequence
do not. RouteOverlay snapshots this decision on mount and marks entrance only
after commit. Nested overlays reset the context and retain their own entrance.

Task-center target resolution keeps its loading drawer mounted through Navigate.
It supplies a destination-path marker in navigation state; only the matching
TaskCenter outlet forwards the handoff. ClientRoute preserves drawer feedback
while the destination module loads. Unrelated paths and direct links start a new
entrance. This state carries presentation only, never authorization or record data.

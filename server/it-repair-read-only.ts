/** Compatibility artifact entry: retain the complete migration and authorization registry.
 * Stop active nodes and drain work before invoking this entry. This forces only
 * the repair module into readOnly; other application modules keep their config.
 */
import { startServer } from './standalone.js';
if (import.meta.main) {
  process.env.IT_REPAIR_MODE = 'readOnly';
  startServer();
}

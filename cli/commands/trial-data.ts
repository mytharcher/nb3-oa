import { AppCommand, CommandError } from '@nocobase/app-cli';

/** Keep a diagnostic for existing scripts instead of silently creating a second dataset. */
export default class TrialData extends AppCommand {
  static override summary =
    'Retired: OA demonstration data now uses db sample.';

  async run(): Promise<never> {
    throw new CommandError(
      'Use APP_SAMPLE_DATA=true pnpm nocobase db sample in a source checkout, or APP_SAMPLE_DATA=true on first installation. Inspect accounts with pnpm nocobase app sample-data --export-access.',
      { code: 'USE_DATABASE_SAMPLE' },
    );
  }
}

import { AppCommand } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';

export default class SampleData extends AppCommand {
  static override summary =
    'Inspect OA sample data or export its account access file.';
  static override description =
    'Generate samples with APP_SAMPLE_DATA=true pnpm nocobase db sample in a source checkout, or APP_SAMPLE_DATA=true on first installation.';
  static override flags = {
    'export-access': Flags.boolean({
      description:
        'Write existing sample credentials to a private local file; never print passwords.',
      default: false,
    }),
  };

  async run(): Promise<unknown> {
    const { flags } = await this.parse(SampleData);
    const { demoDataServiceToken } =
      await import('../../server/providers/demo-data/contract.js');
    const { exportOaSampleAccess } = await import('../../server/samples/oa.js');
    return this.withApp(async ({ app }) => {
      await app.start();
      const status = await app.container.resolve(demoDataServiceToken).status();
      const accessFile = flags['export-access']
        ? await exportOaSampleAccess(app)
        : undefined;
      this.log(`OA sample data: ${status.state}`);
      if (accessFile) this.log(`Account access file: ${accessFile}`);
      return { ...status, accessFile };
    });
  }
}

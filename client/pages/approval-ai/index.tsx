import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';

export default function ApprovalAiSettings() {
  const { t } = useTranslation();
  const models = useCan({
    resource: { type: 'settings', id: 'agents.services' },
    action: 'manage',
  });
  return (
    <PageContainer>
      <PageHeader
        title={t('approvalAi.configure')}
        description={t('approvalAi.nativeSettingsDescription')}
      />
      <Alert>
        <AlertDescription className='flex flex-col items-start gap-3'>
          <p>{t('approvalAi.nativeModelHint')}</p>
          <p>{t('approvalAi.nativeCoverageHint')}</p>
          {models.can && !models.isPending && !models.error && (
            <Button
              variant='outline'
              render={<Link to='/models' />}
              nativeButton={false}
            >
              {t('oa.navigation.models')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
}

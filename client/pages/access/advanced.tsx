import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { AccessTabs } from './ui.js';
export default function AdvancedAccess() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('access.advanced')} />
      <AccessTabs />
      <div className='flex flex-wrap gap-3'>
        {[
          ['permission-sets', 'permissionSets'],
          ['default-access', 'defaultAccess'],
          ['sharing-rules', 'sharingRules'],
          ['restriction-rules', 'restrictionRules'],
          ['inspector', 'inspector'],
        ].map(([path, key]) => (
          <Button
            key={path}
            variant='outline'
            nativeButton={false}
            render={<Link to={`/${path}`} />}
          >
            {t(`oa.navigation.${key}`)}
          </Button>
        ))}
      </div>
    </PageContainer>
  );
}

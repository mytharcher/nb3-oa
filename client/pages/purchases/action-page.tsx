import { useParams } from 'react-router';
import PricingPage from './pricing-page.js';
import ActionDialog from './action-dialog.js';
export default function PurchaseActionPage() {
  const { actionName } = useParams();
  return actionName === 'complete' || actionName === 'forceComplete' ? (
    <PricingPage />
  ) : (
    <ActionDialog />
  );
}

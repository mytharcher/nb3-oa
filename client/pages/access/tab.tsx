import { Outlet, useOutletContext } from 'react-router';
export default function AccessTab() {
  const context = useOutletContext();
  return <Outlet context={context} />;
}

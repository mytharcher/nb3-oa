import { Navigate, useLocation, useOutlet } from 'react-router';
export default function AccessPage() {
  const outlet = useOutlet();
  const location = useLocation();
  return outlet ?? <Navigate replace to={`/access/roles${location.search}`} />;
}

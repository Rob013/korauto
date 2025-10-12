const loaders: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/catalog': () => import('@/pages/Catalog'),
  '/contacts': () => import('@/pages/Contacts'),
  '/inspections': () => import('@/pages/InspectionServices'),
  '/tracking': () => import('@/pages/ShipmentTracking'),
  '/favorites': () => import('@/pages/FavoritesPage'),
  '/account': () => import('@/pages/MyAccount'),
  '/admin': () => import('@/pages/AdminDashboard'),
};

const inFlight: Record<string, Promise<unknown>> = {};

function normalize(path: string): string {
  if (!path) return '/';
  if (path === '/') return '/';
  const withoutQuery = path.split('?')[0];
  const withoutHash = withoutQuery.split('#')[0];
  // Find the longest matching prefix key
  let bestKey = '/';
  for (const key of Object.keys(loaders)) {
    if (withoutHash === key || withoutHash.startsWith(key + '/')) {
      if (key.length > bestKey.length) bestKey = key;
    }
  }
  return bestKey;
}

export function prefetchRoute(path: string): void {
  const key = normalize(path);
  const loader = loaders[key];
  if (!loader) return;
  if (inFlight[key]) return;
  inFlight[key] = loader().catch(() => {}).finally(() => {
    delete inFlight[key];
  });
}

export default prefetchRoute;

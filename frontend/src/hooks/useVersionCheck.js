import { useEffect, useState } from 'react';
import { api } from '../api.js';
import useAutoRefresh from './useAutoRefresh.js';

// Detects that a newer frontend build has been deployed while this tab stayed
// open. Polls /version.json (~60s and on tab focus) and compares it against the
// build id baked into this bundle (__APP_VERSION__). Returns true once they
// diverge — the UI then offers a reload. Best-effort: a failed/absent check
// never flips the flag.
export default function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const check = async () => {
    if (updateAvailable) return; // already flagged — stop polling work
    const deployed = await api.getDeployedVersion();
    if (deployed && deployed !== __APP_VERSION__) setUpdateAvailable(true);
  };

  // Check once on mount, then on the shared interval / focus cadence.
  useEffect(() => {
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useAutoRefresh(check, 60000);

  return updateAvailable;
}

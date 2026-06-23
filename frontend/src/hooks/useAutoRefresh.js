import { useEffect, useRef } from 'react';

// Calls `callback` on an interval, but only while the tab is visible, and also
// immediately whenever the tab regains focus. Used to keep read-only result views
// (leaderboard, group tables) live without a manual reload. The callback is held
// in a ref so changing it across renders doesn't restart the timer.
//
// Pass a stable-enough callback; it is invoked for its side effects (refetch).
export default function useAutoRefresh(callback, intervalMs = 60000) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') savedCallback.current();
    };

    const id = setInterval(tick, intervalMs);
    // Refetch the moment the user comes back to the tab, not just on the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') savedCallback.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [intervalMs]);
}

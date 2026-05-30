import { useState, useEffect } from 'react';

// Returns true when the viewport is at or below `breakpoint` px. Keeps responsive
// branching in JS so components styled with inline objects can switch layout/visibility
// (a plain CSS @media rule can't override an inline style).
export function useIsMobile(breakpoint = 680) {
  const query = `(max-width: ${breakpoint}px)`;
  // Lazy initializer (not called during render) keeps this side-effect-free per React rules.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}

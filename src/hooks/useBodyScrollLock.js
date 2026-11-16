import { useEffect } from 'react';

// Reference count to support multiple layered drawers/modals without premature unlocking
let lockCount = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';
let prevBodyPaddingRight = '';

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    prevBodyOverflow = document.body.style.overflow;
    prevHtmlOverflow = document.documentElement.style.overflow;
    prevBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width on desktop to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('body-scroll-locked');
  }
  lockCount++;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
    document.body.style.paddingRight = prevBodyPaddingRight;
    document.body.classList.remove('body-scroll-locked');
  }
}

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}

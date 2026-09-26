import { RefObject, useEffect } from 'react';

// Closes a popover when the user clicks outside it or presses Escape
export function useDismiss(ref: RefObject<HTMLElement | null>, isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, isOpen, close]);
}

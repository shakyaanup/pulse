import { useCallback, useEffect, useRef, useState } from 'react';

// Shared open/close behaviour for header dropdowns (notifications, profile):
// toggles from a trigger button, closes on a click outside or on Escape, and
// hands focus back to the trigger after Escape.
export const useDropdown = <
  TContainer extends HTMLElement = HTMLDivElement,
  TTrigger extends HTMLElement = HTMLButtonElement,
>() => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<TContainer>(null);
  const triggerRef = useRef<TTrigger>(null);

  const toggle = useCallback(() => setIsOpen((open) => !open), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus(); // give keyboard users their place back
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    // Cleanup runs when the dropdown closes or the component unmounts
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return { isOpen, toggle, close, containerRef, triggerRef };
};

import { useEffect, useRef, type RefObject } from "react";

export function dialogFocusableElements(dialog:HTMLElement){
 return Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])')).filter(element=>element.tabIndex>=0&&!element.closest('[inert], [hidden]')&&element.getClientRects().length>0&&window.getComputedStyle(element).visibility!=="hidden");
}

export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const close = useRef(onClose);

  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusables = () => dialogFocusableElements(dialog);
    dialog.querySelector<HTMLElement>(".modal-close")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;

      const controls = focusables();
      const first = controls[0];
      const last = controls.at(-1);
      if(!controls.length){event.preventDefault();return;}
      if(!dialog?.contains(document.activeElement)){event.preventDefault();first?.focus();return;}
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [ref]);
}

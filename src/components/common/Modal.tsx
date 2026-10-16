import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// Built on the native <dialog> element. showModal() gives us, for free:
// a backdrop, focus kept inside the dialog, Escape to close, the dialog
// rendered above everything else, and focus returned to the button that
// opened it when it closes.
const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // React owns isOpen; this effect keeps the real <dialog> in sync with it
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={titleId}
      // Escape fires "cancel". Let React decide instead of the browser
      // closing the dialog behind React's back.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // The dialog element itself is only "hit" by clicks on the backdrop,
      // because the content fills it
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {isOpen && (
        <div className="modal__content">
          <div className="modal__header">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <button
              type="button"
              className="modal__close"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
};

export default Modal;

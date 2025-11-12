import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Не рендерим на сервере или если document не доступен.
  if (typeof document === 'undefined') {
    return null;
  }
  
  const portalRoot = document.body;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bg-secondary/85 dark:bg-dark-secondary/85 backdrop-blur-2xl rounded-t-3xl shadow-soft-lg dark:shadow-dark-soft-lg border-t border-white/20 dark:border-white/10 max-w-2xl mx-auto w-full transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-heading"
      >
        <div className="w-16 h-1.5 bg-highlight dark:bg-dark-highlight rounded-full mx-auto my-3"></div>
        <div className="flex justify-between items-center px-6 pt-1 pb-4">
            <h3 id="bottom-sheet-heading" className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{title}</h3>
            <button
                onClick={onClose}
                className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary"
                aria-label="Закрыть"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">
            {children}
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default BottomSheet;
import { X, Keyboard } from 'lucide-react';
import './KeyboardShortcutsHelp.css';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: '/', description: 'Focus search bar' },
  { key: 'H', description: 'Go to home page' },
  { key: 'S', description: 'Go to search page' },
  { key: 'P', description: 'Go to profile page' },
  { key: 'T', description: 'Go to stats page' },
  { key: '?', description: 'Show this help dialog' },
  { key: 'Esc', description: 'Close modals and dialogs' },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="shortcuts-overlay" onClick={handleBackdropClick}>
      <div className="shortcuts-modal" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
        <div className="shortcuts-header">
          <div className="shortcuts-title-wrapper">
            <Keyboard size={24} className="shortcuts-icon" />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button
            className="shortcuts-close"
            onClick={onClose}
            aria-label="Close shortcuts help"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shortcuts-content">
          <p className="shortcuts-description">
            Use these keyboard shortcuts to navigate faster
          </p>
          <div className="shortcuts-list">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-description">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shortcuts-footer">
          <p className="shortcuts-note">
            <strong>Tip:</strong> Shortcuts don't work when typing in input fields
          </p>
        </div>
      </div>
    </div>
  );
}

import { Plus, Search, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type QuickActionId =
  | 'add-skill'
  | 'search-opportunities'
  | 'mentorship-request';

interface MobileQuickActionsProps {
  onQuickAction: (action: QuickActionId) => void;
}

const QUICK_ACTIONS: Array<{
  id: QuickActionId;
  label: string;
  hint: string;
  icon: typeof Plus;
  accent: 'teal' | 'burgundy';
}> = [
  {
    id: 'add-skill',
    label: 'Add Skill',
    hint: 'Skills Passport',
    icon: Plus,
    accent: 'teal',
  },
  {
    id: 'search-opportunities',
    label: 'Search Opportunities',
    hint: 'Browse fellowships',
    icon: Search,
    accent: 'teal',
  },
  {
    id: 'mentorship-request',
    label: 'Mentorship Request',
    hint: 'Connect with a mentor',
    icon: Send,
    accent: 'burgundy',
  },
];

export function MobileQuickActions({ onQuickAction }: MobileQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (actionId: QuickActionId) => {
    setIsOpen(false);
    onQuickAction(actionId);
  };

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          className="md:hidden print:hidden fixed inset-0 z-[39] bg-black/15 dark:bg-black/40 backdrop-blur-[1px]"
        />
      )}

      <div className="md:hidden print:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end">
        {isOpen && (
          <nav
            id="mobile-quick-actions-menu"
            aria-label="Quick actions"
            className="mb-2.5 flex flex-col items-end gap-2"
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleSelect(action.id)}
                  className="inline-flex items-center gap-3 pl-3.5 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] shadow-lg text-left hover:bg-[#FAF8F4] dark:hover:bg-[#232826] active:scale-[0.99] transition-all whitespace-nowrap cursor-pointer min-h-[46px]"
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      action.accent === 'burgundy'
                        ? 'bg-[#6E1E2E]/10 dark:bg-[#E58A9B]/15 text-[#6E1E2E] dark:text-[#E58A9B]'
                        : 'bg-[#0F6B6E]/10 dark:bg-[#56C7C4]/15 text-[#0F6B6E] dark:text-[#56C7C4]'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC] leading-tight">
                      {action.label}
                    </span>
                    <span className="text-[11px] text-[#525855] dark:text-[#B4BDB9] leading-tight mt-0.5">
                      {action.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="mobile-quick-actions-menu"
          aria-label={isOpen ? 'Close Quick Actions menu' : 'Open Quick Actions menu'}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer min-h-[46px] border ${
            isOpen
              ? 'bg-[#1E2220] dark:bg-[#2C3330] border-[#1E2220] dark:border-[#3D4542] text-white'
              : 'bg-[#6E1E2E] dark:bg-[#8A2A3D] border-[#561522] dark:border-[#9D3248] text-white hover:bg-[#561522] dark:hover:bg-[#9D3248]'
          }`}
        >
          {isOpen ? (
            <>
              <X className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Quick Actions</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

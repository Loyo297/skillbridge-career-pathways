import {
  Award,
  Bot,
  Briefcase,
  LayoutDashboard,
  Moon,
  RotateCcw,
  Sun,
  Users,
} from 'lucide-react';
import { NavTab } from '../types';

interface HeaderProps {
  activeTab: NavTab;
  theme: 'light' | 'dark';
  pendingTaskCount: number;
  onToggleTheme: () => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenAssistant: () => void;
  onRequestReset: () => void;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  mobileLabel: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', mobileLabel: 'Overview', icon: LayoutDashboard },
  {
    id: 'passport',
    label: 'My Skills Passport',
    mobileLabel: 'Passport',
    icon: Award,
  },
  {
    id: 'opportunities',
    label: 'Opportunities',
    mobileLabel: 'Opportunities',
    icon: Briefcase,
  },
  { id: 'mentorship', label: 'Mentorship', mobileLabel: 'Mentorship', icon: Users },
];

export function Header({
  activeTab,
  theme,
  pendingTaskCount,
  onToggleTheme,
  onSelectTab,
  onOpenAssistant,
  onRequestReset,
}: HeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FAF8F4]/95 dark:bg-[#131615]/95 backdrop-blur-sm border-b border-[#E3DDD2] dark:border-[#2F3533]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand wordmark (single line, no extra badges) */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#6E1E2E] dark:text-[#E58A9B] whitespace-nowrap shrink-0 cursor-pointer hover:text-[#561522] dark:hover:text-[#F0A8B6] transition-colors"
          >
            SkillBridge
          </button>

          {/* Zone 2: Primary navigation links (desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isActive
                      ? 'text-[#6E1E2E] dark:text-[#E58A9B] font-semibold'
                      : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#6E1E2E] dark:bg-[#E58A9B]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Task Assistant + Theme toggle + Reset utility */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenAssistant}
              aria-label="Open Task AI Assistant"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F6B6E] dark:bg-[#147E82] border border-[#0F6B6E] dark:border-[#147E82] rounded-lg hover:bg-[#0B5254] dark:hover:bg-[#199499] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <Bot className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Task AI</span>
              {pendingTaskCount > 0 && (
                <span className="font-mono text-[11px] bg-white/20 px-1.5 py-0.2 rounded tabular-nums">
                  {pendingTaskCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={theme === 'dark'}
              aria-label={
                theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-lg hover:bg-[#F2EEE7] dark:hover:bg-[#232826] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#56C7C4]" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#6E1E2E]" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onRequestReset}
              aria-label="Reset demo data"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-lg hover:bg-[#F2EEE7] dark:hover:bg-[#232826] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <RotateCcw
                className="w-3.5 h-3.5 text-[#525855] dark:text-[#B4BDB9]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Reset demo data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Bottom Navigation Bar (Mobile) */}
      <nav
        aria-label="Mobile primary navigation"
        className="md:hidden print:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F4]/95 dark:bg-[#131615]/95 backdrop-blur-md border-t border-[#E3DDD2] dark:border-[#2F3533] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 min-h-[60px] text-[11px] leading-tight transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#6E1E2E] dark:text-[#E58A9B] font-semibold'
                    : 'text-[#525855] dark:text-[#B4BDB9] font-medium hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-3 right-3 h-0.5 bg-[#6E1E2E] dark:bg-[#E58A9B]"
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}


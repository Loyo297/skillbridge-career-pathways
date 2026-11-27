import { Download, ShieldAlert } from 'lucide-react';
import { NavTab } from '../types';

export function DisclaimerBanner() {
  return (
    <div
      role="note"
      aria-label="Prototype disclaimer"
      className="bg-[#F2EEE7] dark:bg-[#1B1F1E] border-b border-[#E3DDD2] dark:border-[#2F3533]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-start sm:items-center gap-2.5 text-xs sm:text-[13px] text-[#353A37] dark:text-[#D5DDD9]">
        <ShieldAlert
          className="w-4 h-4 text-[#6E1E2E] dark:text-[#E58A9B] shrink-0 mt-0.5 sm:mt-0"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          <strong className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
            Prototype notice:
          </strong>{' '}
          SkillBridge is a prototype. Match scores and assessments are illustrative, not official
          credential verification, legal advice, or a promise of employment.
        </p>
      </div>
    </div>
  );
}

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onExportData: () => void;
  onRequestReset: () => void;
}

export function Footer({
  onSelectTab,
  onExportData,
  onRequestReset,
}: FooterProps) {
  return (
    <footer className="border-t border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 space-y-3">
            <p className="font-display text-lg font-semibold text-[#6E1E2E] dark:text-[#E58A9B]">
              SkillBridge
            </p>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9] max-w-2xl leading-relaxed">
              SkillBridge is a prototype. Match scores and assessments are illustrative, not official
              credential verification, legal advice, or a promise of employment. Candidates should
              confirm employment and work-authorization requirements with qualified local support.
            </p>
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
              All candidate records, sample organizations, opportunities, mentors, and impact metrics
              displayed in this prototype are fictional demo data stored locally in your browser.
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col sm:flex-row md:justify-end gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                Navigation
              </p>
              <ul className="space-y-1.5 text-[#525855] dark:text-[#B4BDB9]">
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTab('overview')}
                    className="hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer"
                  >
                    Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTab('passport')}
                    className="hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer"
                  >
                    My Skills Passport
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTab('opportunities')}
                    className="hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer"
                  >
                    Opportunities
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onSelectTab('mentorship')}
                    className="hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer"
                  >
                    Mentorship
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                Demo controls
              </p>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={onExportData}
                    className="inline-flex items-center gap-1.5 text-left text-[#0F6B6E] dark:text-[#56C7C4] font-medium hover:underline whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Export Data</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onRequestReset}
                    className="text-left text-[#6E1E2E] dark:text-[#E58A9B] font-medium hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Reset demo data
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

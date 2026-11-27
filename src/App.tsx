import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MentorshipSection } from './components/MentorshipSection';
import {
  MobileQuickActions,
  QuickActionId,
} from './components/MobileQuickActions';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { OverviewSection } from './components/OverviewSection';
import { SkillsPassportSection } from './components/SkillsPassportSection';
import { TaskAssistantDrawer } from './components/TaskAssistantDrawer';
import { DisclaimerBanner, Footer } from './components/TrustDisclaimer';
import { SAMPLE_MENTORS, SAMPLE_OPPORTUNITIES } from './data/seedData';
import {
  ActivityEntry,
  ActivityType,
  AssistantChatMessage,
  AssistantTask,
  CandidateProfile,
  MentorshipRequest,
  NavTab,
  Opportunity,
  SkillBridgeState,
  TaskCategory,
} from './types';
import { loadState, resetState, saveState } from './utils/storage';

function formatActivityTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function makeActivity(
  type: ActivityType,
  detail: string,
  targetTab: NavTab
): ActivityEntry {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    detail,
    timestamp: formatActivityTimestamp(),
    targetTab,
  };
}

const THEME_STORAGE_KEY = 'skillbridge_theme_v1';

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
  } catch {
    // Ignore storage access errors
  }
  return 'light';
}

export default function App() {
  const [state, setState] = useState<SkillBridgeState>(() => loadState());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [inspectOpportunityId, setInspectOpportunityId] = useState<string | null>(
    null
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [resetToast, setResetToast] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write errors
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectOpportunity = (opportunity: Opportunity) => {
    setInspectOpportunityId(opportunity.id);
    setActiveTab('opportunities');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAction = (action: QuickActionId) => {
    const targetByAction: Record<
      QuickActionId,
      { tab: NavTab; elementId: string }
    > = {
      'add-skill': { tab: 'passport', elementId: 'skill-input' },
      'search-opportunities': { tab: 'opportunities', elementId: 'opp-search' },
      'mentorship-request': { tab: 'mentorship', elementId: 'mentor-select' },
    };

    const { tab, elementId } = targetByAction[action];
    setActiveTab(tab);

    window.setTimeout(() => {
      const target = document.getElementById(elementId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }
      }
    }, 80);
  };

  const handleUpdateProfile = (nextProfile: CandidateProfile) => {
    setState((prev) => {
      const nextActivities: ActivityEntry[] = [];

      if (
        nextProfile.assessment &&
        nextProfile.assessment !== prev.profile.assessment
      ) {
        nextActivities.push(
          makeActivity(
            'Submitted Assessment',
            `${nextProfile.assessment.category} (${nextProfile.assessment.score}/${nextProfile.assessment.total} practice score)`,
            'passport'
          )
        );
      }

      if (
        nextProfile.linkedInImport &&
        nextProfile.linkedInImport !== prev.profile.linkedInImport
      ) {
        const addedSkillsCount = Math.max(
          0,
          nextProfile.skills.length - prev.profile.skills.length
        );
        nextActivities.push(
          makeActivity(
            'Updated Profile',
            addedSkillsCount > 0
              ? `Synced mock LinkedIn (${nextProfile.linkedInImport.handle} · +${addedSkillsCount} skills)`
              : `Synced mock LinkedIn summary (${nextProfile.linkedInImport.handle})`,
            'passport'
          )
        );
      } else {
        if (nextProfile.projects.length > prev.profile.projects.length) {
          const added = nextProfile.projects[nextProfile.projects.length - 1];
          nextActivities.push(
            makeActivity('Added Project Evidence', added.title, 'passport')
          );
        }

        if (nextProfile.skills.length > prev.profile.skills.length) {
          const addedSkill = nextProfile.skills[nextProfile.skills.length - 1];
          nextActivities.push(
            makeActivity(
              'Updated Profile',
              `Added skill: ${addedSkill.name} (${addedSkill.proficiency})`,
              'passport'
            )
          );
        } else if (nextProfile.skills.length === prev.profile.skills.length) {
          const changedSkill = nextProfile.skills.find((nextSkill) => {
            const prevSkill = prev.profile.skills.find(
              (s) => s.name === nextSkill.name
            );
            return prevSkill && prevSkill.proficiency !== nextSkill.proficiency;
          });
          if (changedSkill) {
            nextActivities.push(
              makeActivity(
                'Updated Profile',
                `Set ${changedSkill.name} proficiency to ${changedSkill.proficiency}`,
                'passport'
              )
            );
          }
        }
      }

      return {
        ...prev,
        profile: nextProfile,
        activityLog: [...nextActivities, ...prev.activityLog].slice(0, 20),
      };
    });
  };

  const handleProfileSaved = () => {
    setState((prev) => ({
      ...prev,
      activityLog: [
        makeActivity(
          'Updated Profile',
          `${prev.profile.preferredName || 'Candidate'} · ${
            prev.profile.location || 'Location updated'
          }`,
          'passport'
        ),
        ...prev.activityLog,
      ].slice(0, 20),
    }));
  };

  const handleToggleSaveOpportunity = (opportunityId: string) => {
    setState((prev) => {
      const exists = prev.savedOpportunityIds.includes(opportunityId);
      const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === opportunityId);
      const oppLabel = opp ? `${opp.title} — ${opp.location}` : opportunityId;
      const entry = makeActivity(
        exists ? 'Removed Saved Opportunity' : 'Saved Opportunity',
        oppLabel,
        'opportunities'
      );

      return {
        ...prev,
        savedOpportunityIds: exists
          ? prev.savedOpportunityIds.filter((id) => id !== opportunityId)
          : [...prev.savedOpportunityIds, opportunityId],
        activityLog: [entry, ...prev.activityLog].slice(0, 20),
      };
    });
  };

  const handleToggleSaveMentor = (mentorId: string) => {
    setState((prev) => {
      const exists = prev.savedMentorIds.includes(mentorId);
      const mentor = SAMPLE_MENTORS.find((m) => m.id === mentorId);
      const mentorLabel = mentor
        ? `${mentor.name} — ${mentor.role}`
        : mentorId;
      const entry = makeActivity(
        exists ? 'Removed Saved Mentor' : 'Saved Mentor',
        mentorLabel,
        'mentorship'
      );

      return {
        ...prev,
        savedMentorIds: exists
          ? prev.savedMentorIds.filter((id) => id !== mentorId)
          : [...prev.savedMentorIds, mentorId],
        activityLog: [entry, ...prev.activityLog].slice(0, 20),
      };
    });
  };

  const handleExpressInterest = (opportunityId: string, note: string) => {
    const submittedAt = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === opportunityId);
    const oppLabel = opp ? `${opp.title} — ${opp.location}` : opportunityId;

    setState((prev) => ({
      ...prev,
      applications: {
        ...prev.applications,
        [opportunityId]: {
          opportunityId,
          status: 'Demo interest recorded',
          submittedAt,
          note,
        },
      },
      activityLog: [
        makeActivity('Interest Recorded', oppLabel, 'opportunities'),
        ...prev.activityLog,
      ].slice(0, 20),
    }));
  };

  const handleWithdrawInterest = (opportunityId: string) => {
    const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === opportunityId);
    const oppLabel = opp ? `${opp.title} — ${opp.location}` : opportunityId;

    setState((prev) => {
      const nextApps = { ...prev.applications };
      delete nextApps[opportunityId];
      return {
        ...prev,
        applications: nextApps,
        activityLog: [
          makeActivity('Withdrew Interest', oppLabel, 'opportunities'),
          ...prev.activityLog,
        ].slice(0, 20),
      };
    });
  };

  const handleSubmitMentorshipRequest = (
    payload: Omit<MentorshipRequest, 'id' | 'status' | 'submittedAt'>
  ) => {
    const newRequest: MentorshipRequest = {
      ...payload,
      id: `mreq-${Date.now()}`,
      status: 'Demo request submitted',
      submittedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setState((prev) => ({
      ...prev,
      mentorshipRequests: [newRequest, ...prev.mentorshipRequests],
      activityLog: [
        makeActivity(
          'Request Sent',
          `${payload.mentorName} · ${payload.focusArea}`,
          'mentorship'
        ),
        ...prev.activityLog,
      ].slice(0, 20),
    }));
  };

  const handleDeleteMentorshipRequest = (id: string) => {
    setState((prev) => ({
      ...prev,
      mentorshipRequests: prev.mentorshipRequests.filter((r) => r.id !== id),
    }));
  };

  const handleClearActivity = () => {
    setState((prev) => ({
      ...prev,
      activityLog: [],
    }));
  };

  const handleAddAssistantTasks = (
    items: Array<{ title: string; category: TaskCategory; source: 'user' | 'ai' }>
  ) => {
    const createdAt = formatActivityTimestamp();
    setState((prev) => {
      const existingNormalized = new Set(
        prev.assistantTasks.map((t) => t.title.trim().toLowerCase())
      );
      const newTasks: AssistantTask[] = items
        .filter((item) => !existingNormalized.has(item.title.trim().toLowerCase()))
        .map((item, idx) => ({
          id: `task-${Date.now()}-${idx}`,
          title: item.title.trim(),
          category: item.category,
          completed: false,
          source: item.source,
          createdAt,
        }));
      if (newTasks.length === 0) return prev;
      return {
        ...prev,
        assistantTasks: [...newTasks, ...prev.assistantTasks],
      };
    });
  };

  const handleToggleAssistantTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      assistantTasks: prev.assistantTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleDeleteAssistantTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      assistantTasks: prev.assistantTasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleClearCompletedTasks = () => {
    setState((prev) => ({
      ...prev,
      assistantTasks: prev.assistantTasks.filter((t) => !t.completed),
    }));
  };

  const handleAppendAssistantMessages = (newMessages: AssistantChatMessage[]) => {
    setState((prev) => ({
      ...prev,
      assistantMessages: [...prev.assistantMessages, ...newMessages].slice(-40),
    }));
  };

  const handleClearAssistantMessages = () => {
    setState((prev) => ({
      ...prev,
      assistantMessages: [],
    }));
  };

  const handleExportData = () => {
    const payload = {
      prototypeNotice:
        'SkillBridge is a prototype. Exported records are illustrative demo data only, not official credential verification, legal advice, or a promise of employment.',
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      savedOpportunityIds: state.savedOpportunityIds,
      savedMentorIds: state.savedMentorIds,
      applications: Object.values(state.applications),
      mentorshipRequests: state.mentorshipRequests,
      activityLog: state.activityLog,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `skillbridge-data-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportToast(true);
    window.setTimeout(() => setExportToast(false), 3500);
  };

  const handleConfirmReset = () => {
    const fresh = resetState();
    setState(fresh);
    setShowResetConfirm(false);
    setInspectOpportunityId(null);
    setResetToast(true);
    window.setTimeout(() => setResetToast(false), 3500);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0 print:pb-0 bg-[#FAF8F4] text-[#1E2220] dark:bg-[#131615] dark:text-[#F5F2EC] transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#6E1E2E] focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <Header
        activeTab={activeTab}
        theme={theme}
        pendingTaskCount={
          state.assistantTasks.filter((t) => !t.completed).length
        }
        onToggleTheme={handleToggleTheme}
        onSelectTab={handleSelectTab}
        onOpenAssistant={() => setShowAssistant(true)}
        onRequestReset={() => setShowResetConfirm(true)}
      />

      <DisclaimerBanner />

      <main
        id="main-content"
        className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
      >
        {resetToast && (
          <div
            role="status"
            className="print:hidden mb-6 p-3.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs sm:text-sm text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Demo data has been restored to the initial prefilled candidate profile.
            </span>
          </div>
        )}

        {exportToast && (
          <div
            role="status"
            className="print:hidden mb-6 p-3.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs sm:text-sm text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Exported your SkillBridge profile and application history as a JSON file.
            </span>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewSection
            profile={state.profile}
            savedOpportunityIds={state.savedOpportunityIds}
            activityLog={state.activityLog}
            onClearActivity={handleClearActivity}
            onNavigate={handleSelectTab}
            onInspectOpportunity={handleInspectOpportunity}
          />
        )}

        {activeTab === 'passport' && (
          <SkillsPassportSection
            profile={state.profile}
            applications={state.applications}
            mentorshipRequests={state.mentorshipRequests}
            onUpdateProfile={handleUpdateProfile}
            onProfileSaved={handleProfileSaved}
            onNavigate={handleSelectTab}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesSection
            candidateSkills={state.profile.skills}
            savedOpportunityIds={state.savedOpportunityIds}
            applications={state.applications}
            initialSelectedOpportunityId={inspectOpportunityId}
            isDark={theme === 'dark'}
            onClearInitialSelected={() => setInspectOpportunityId(null)}
            onToggleSave={handleToggleSaveOpportunity}
            onExpressInterest={handleExpressInterest}
            onWithdrawInterest={handleWithdrawInterest}
          />
        )}

        {activeTab === 'mentorship' && (
          <MentorshipSection
            profile={state.profile}
            requests={state.mentorshipRequests}
            savedMentorIds={state.savedMentorIds}
            onToggleSaveMentor={handleToggleSaveMentor}
            onSubmitRequest={handleSubmitMentorshipRequest}
            onDeleteRequest={handleDeleteMentorshipRequest}
          />
        )}
      </main>

      <Footer
        onSelectTab={handleSelectTab}
        onExportData={handleExportData}
        onRequestReset={() => setShowResetConfirm(true)}
      />

      <MobileQuickActions onQuickAction={handleQuickAction} />

      <TaskAssistantDrawer
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        profile={state.profile}
        savedOpportunitiesCount={state.savedOpportunityIds.length}
        mentorshipRequestsCount={state.mentorshipRequests.length}
        activeTab={activeTab}
        tasks={state.assistantTasks}
        messages={state.assistantMessages}
        onAddTasks={handleAddAssistantTasks}
        onToggleTask={handleToggleAssistantTask}
        onDeleteTask={handleDeleteAssistantTask}
        onClearCompletedTasks={handleClearCompletedTasks}
        onAppendMessages={handleAppendAssistantMessages}
        onClearMessages={handleClearAssistantMessages}
        onNavigateTab={handleSelectTab}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2220]/50 dark:bg-black/70 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetConfirm(false);
          }}
        >
          <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2
              id="reset-dialog-title"
              className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Reset demo data?
            </h2>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              This will restore the prefilled sample candidate profile, clear your practice
              assessment result, and reset saved opportunities and demo mentorship requests in
              this browser.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] cursor-pointer min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[40px]"
              >
                Reset demo data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

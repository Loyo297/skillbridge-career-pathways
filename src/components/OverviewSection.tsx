import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Compass,
  Send,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import {
  PROTOTYPE_IMPACT_METRICS,
  SAMPLE_OPPORTUNITIES,
} from '../data/seedData';
import {
  ActivityEntry,
  ActivityType,
  CandidateProfile,
  NavTab,
  Opportunity,
} from '../types';
import {
  computeOpportunityMatch,
  computeProfileCompletion,
} from '../utils/matching';

interface OverviewSectionProps {
  profile: CandidateProfile;
  savedOpportunityIds: string[];
  activityLog: ActivityEntry[];
  onClearActivity: () => void;
  onNavigate: (tab: NavTab) => void;
  onInspectOpportunity: (opportunity: Opportunity) => void;
}

type ActivityCategoryFilter = 'all' | 'passport' | 'opportunities' | 'mentorship';

const ACTIVITY_FILTER_OPTIONS: Array<{
  id: ActivityCategoryFilter;
  label: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'passport', label: 'Passport' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'mentorship', label: 'Mentorship' },
];

function getActivityCategoryLabel(tab: ActivityCategoryFilter | NavTab): string {
  switch (tab) {
    case 'passport':
      return 'Passport';
    case 'opportunities':
      return 'Opportunities';
    case 'mentorship':
      return 'Mentorship';
    case 'all':
      return 'All';
    case 'overview':
    default:
      return 'Overview';
  }
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'Saved Opportunity':
    case 'Removed Saved Opportunity':
    case 'Saved Mentor':
    case 'Removed Saved Mentor':
      return Bookmark;
    case 'Submitted Assessment':
      return ClipboardCheck;
    case 'Request Sent':
      return Send;
    case 'Interest Recorded':
    case 'Withdrew Interest':
      return CheckCircle2;
    case 'Added Project Evidence':
    case 'Updated Profile':
    default:
      return UserCheck;
  }
}

export function OverviewSection({
  profile,
  savedOpportunityIds,
  activityLog,
  onClearActivity,
  onNavigate,
  onInspectOpportunity,
}: OverviewSectionProps) {
  const [heroImageError, setHeroImageError] = useState(false);
  const [activityFilter, setActivityFilter] =
    useState<ActivityCategoryFilter>('all');

  const filteredActivity =
    activityFilter === 'all'
      ? activityLog
      : activityLog.filter((entry) => entry.targetTab === activityFilter);

  const completion = computeProfileCompletion(profile);
  const featuredOpportunities = SAMPLE_OPPORTUNITIES.slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Welcome Hero Split */}
      <section
        aria-labelledby="overview-hero-heading"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        <div className="lg:col-span-7 bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-[#0F6B6E] dark:text-[#56C7C4]">
              Skills-first fellowship &amp; mentorship prototype
            </p>
            <h1
              id="overview-hero-heading"
              className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.15] text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Turn demonstrated skills into local mentorship and fellowships.
            </h1>
            <p className="text-base text-[#525855] dark:text-[#B4BDB9] leading-relaxed max-w-2xl">
              Welcome,{' '}
              <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                {profile.preferredName || 'Candidate'}
              </span>
              . SkillBridge helps displaced professionals present practical capabilities,
              work examples, and language strengths to local fellowship programs and mentors—even
              when formal certificates or academic transcripts are unavailable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('passport')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Build my skills profile</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] text-[#1E2220] dark:text-[#F5F2EC] text-sm font-medium hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Explore sample opportunities</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-[#E3DDD2] dark:border-[#2F3533] bg-[#F2EEE7] dark:bg-[#232826] min-h-[260px]">
          {!heroImageError ? (
            <img
              src="/src/assets/images/skillbridge_workspace_hero_1795771659723.jpg"
              alt="Two professionals collaborating over a laptop and notebooks in a sunlit community learning space"
              referrerPolicy="no-referrer"
              onError={() => setHeroImageError(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#6E1E2E]/10 via-[#F2EEE7] to-[#0F6B6E]/10 dark:from-[#8A2A3D]/20 dark:via-[#1B1F1E] dark:to-[#147E82]/20">
              <Compass
                className="w-10 h-10 text-[#0F6B6E] dark:text-[#56C7C4] mb-3"
                aria-hidden="true"
              />
              <p className="font-display text-lg font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                SkillBridge Community Hub
              </p>
              <p className="text-sm text-[#525855] dark:text-[#B4BDB9] mt-1 max-w-xs">
                Collaborative skills demonstration, local mentorship, and transparent opportunity matching.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Candidate Progress Card */}
      <section
        aria-labelledby="progress-heading"
        className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E3DDD2] dark:border-[#2F3533]">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
              Demo candidate progress · {profile.location || 'Location not set'}
            </p>
            <h2
              id="progress-heading"
              className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Your Skills Passport readiness
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="font-mono text-2xl font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                {completion.percentage}%
              </span>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                {completion.completedCount} of {completion.totalCount} steps complete
              </p>
            </div>
            <div className="w-32 sm:w-44 h-2.5 bg-[#F2EEE7] dark:bg-[#232826] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F6B6E] dark:bg-[#56C7C4] transition-all duration-300"
                style={{ width: `${completion.percentage}%` }}
                role="progressbar"
                aria-valuenow={completion.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion percentage"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
              Skills demonstrated
            </p>
            <p className="font-mono text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] tabular-nums">
              {profile.skills.length}
            </p>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9] truncate">
              {profile.skills.length > 0
                ? profile.skills
                    .map((s) => `${s.name} (${s.proficiency})`)
                    .join(' · ')
                : 'No skills added yet'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
              Practice assessment
            </p>
            <p className="font-mono text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] tabular-nums">
              {profile.assessment
                ? `${profile.assessment.score}/${profile.assessment.total}`
                : 'Pending'}
            </p>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9]">
              {profile.assessment
                ? `${profile.assessment.category} (self-check)`
                : '3 short practice questions available'}
            </p>
          </div>

          <div className="space-y-2 md:border-l md:border-[#E3DDD2] dark:md:border-[#2F3533] md:pl-6">
            <p className="text-xs font-medium text-[#6E1E2E] dark:text-[#E58A9B]">
              Next recommended step
            </p>
            <p className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
              {completion.nextStep.title}
            </p>
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              {completion.nextStep.description}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(completion.nextStep.targetTab)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F6B6E] dark:text-[#56C7C4] hover:text-[#0B5254] dark:hover:text-[#7ADAD7] hover:underline cursor-pointer pt-1"
            >
              <span>{completion.nextStep.actionLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Activity Panel */}
      <section
        aria-labelledby="recent-activity-heading"
        className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-5 transition-colors"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E3DDD2] dark:border-[#2F3533]">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
              Local session log · Click any category tag to filter
            </p>
            <h2
              id="recent-activity-heading"
              className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Recent Activity
            </h2>
          </div>

          {activityLog.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Filter recent activity by category"
                className="inline-flex items-center gap-1 p-1 bg-[#F2EEE7] dark:bg-[#232826] rounded-xl"
              >
                {ACTIVITY_FILTER_OPTIONS.map((opt) => {
                  const count =
                    opt.id === 'all'
                      ? activityLog.length
                      : activityLog.filter((e) => e.targetTab === opt.id).length;
                  const active = activityFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setActivityFilter(opt.id)}
                      aria-pressed={active}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                          : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                      }`}
                    >
                      {opt.label} ({count})
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setActivityFilter('all');
                  onClearActivity();
                }}
                className="text-xs font-semibold text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] whitespace-nowrap cursor-pointer"
              >
                Clear history
              </button>
            </div>
          )}
        </div>

        {activityLog.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]">
              No recent activity recorded yet
            </p>
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9] max-w-md mx-auto">
              Save a sample opportunity, complete the practice assessment, or submit a demo
              mentorship request to see your latest interactions here.
            </p>
          </div>
        ) : filteredActivity.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]">
              No {getActivityCategoryLabel(activityFilter)} activity recorded yet
            </p>
            <button
              type="button"
              onClick={() => setActivityFilter('all')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] cursor-pointer"
            >
              Show all activity
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[#E3DDD2] dark:divide-[#2F3533]">
            {filteredActivity.slice(0, 6).map((entry) => {
              const Icon = getActivityIcon(entry.type);
              const isPositiveAction =
                entry.type === 'Saved Opportunity' ||
                entry.type === 'Saved Mentor' ||
                entry.type === 'Submitted Assessment' ||
                entry.type === 'Interest Recorded' ||
                entry.type === 'Request Sent';
              const categoryLabel = getActivityCategoryLabel(entry.targetTab);
              const isCategorySelected = activityFilter === entry.targetTab;

              return (
                <li
                  key={entry.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isPositiveAction
                          ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                          : 'text-[#6E1E2E] dark:text-[#E58A9B]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm text-[#1E2220] dark:text-[#F5F2EC]">
                        <span
                          className={`font-semibold ${
                            isPositiveAction
                              ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                              : 'text-[#6E1E2E] dark:text-[#E58A9B]'
                          }`}
                        >
                          {entry.type}
                        </span>
                        <span
                          className="text-[#525855] dark:text-[#B4BDB9] mx-2"
                          aria-hidden="true"
                        >
                          ·
                        </span>
                        <span className="font-medium text-[#1E2220] dark:text-[#F5F2EC]">
                          {entry.detail}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 shrink-0">
                    {entry.targetTab !== 'overview' && (
                      <button
                        type="button"
                        onClick={() =>
                          setActivityFilter((prev) =>
                            prev === entry.targetTab
                              ? 'all'
                              : (entry.targetTab as ActivityCategoryFilter)
                          )
                        }
                        aria-pressed={isCategorySelected}
                        title={
                          isCategorySelected
                            ? `Showing ${categoryLabel} — click to show all`
                            : `Filter activity by ${categoryLabel}`
                        }
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isCategorySelected
                            ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/10 dark:bg-[#147E82]/25 text-[#0F6B6E] dark:text-[#56C7C4]'
                            : 'border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330]'
                        }`}
                      >
                        {categoryLabel}
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#525855] dark:text-[#B4BDB9] tabular-nums whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {entry.timestamp}
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigate(entry.targetTab)}
                      className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline whitespace-nowrap cursor-pointer"
                    >
                      Open
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Three Sample Opportunities with Live Match Scores */}
      <section aria-labelledby="featured-opps-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
              Illustrative skill matching · Sample demo records
            </p>
            <h2
              id="featured-opps-heading"
              className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Featured sample opportunities
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('opportunities')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>View all {SAMPLE_OPPORTUNITIES.length} sample opportunities</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredOpportunities.map((opp) => {
            const match = computeOpportunityMatch(profile.skills, opp);
            const isSaved = savedOpportunityIds.includes(opp.id);

            return (
              <article
                key={opp.id}
                className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 flex flex-col justify-between gap-5 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs text-[#525855] dark:text-[#B4BDB9]">
                    <span>Sample demo · {opp.location}</span>
                    {isSaved && (
                      <span className="text-[#0F6B6E] dark:text-[#56C7C4] font-semibold">
                        Saved
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] leading-snug">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-[#525855] dark:text-[#B4BDB9] mt-1">
                      {opp.organization}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533] space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                        Illustrative skill match
                      </span>
                      <span className="font-mono text-xl font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                        {match.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                      {match.explanation}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="text-[#1E2220] dark:text-[#F5F2EC]">
                      <span className="font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                        Matched:
                      </span>{' '}
                      {match.matchedRequired.length > 0
                        ? match.matchedRequired
                            .map((m) => `${m.name} (${m.proficiency})`)
                            .join(' · ')
                        : 'None yet'}
                    </p>
                    <p className="text-[#525855] dark:text-[#B4BDB9]">
                      <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                        To build:
                      </span>{' '}
                      {match.missingRequired.length > 0 ? (
                        match.missingRequired.join(' · ')
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#0F6B6E] dark:text-[#56C7C4]">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          All required skills listed
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onInspectOpportunity(opp)}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] transition-colors cursor-pointer min-h-[42px]"
                >
                  View opportunity details
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Prototype Impact Panel */}
      <section
        aria-labelledby="impact-heading"
        className="bg-[#F2EEE7] dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B]">
              Prototype data · Fictional demo figures
            </p>
            <h2
              id="impact-heading"
              className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-1"
            >
              Illustrative program snapshot
            </h2>
          </div>
          <p className="text-xs text-[#525855] dark:text-[#B4BDB9] max-w-md">
            Metrics below represent sample demonstration scenarios only and do not reflect live
            placement numbers or verified institutional partnerships.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
          {PROTOTYPE_IMPACT_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1 pt-2">
              <p className="font-mono text-3xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] tabular-nums">
                {metric.value}
              </p>
              <p className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                {metric.label}
              </p>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

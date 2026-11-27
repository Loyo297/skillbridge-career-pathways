import {
  Bookmark,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { SAMPLE_OPPORTUNITIES } from '../data/seedData';
import {
  ApplicationRecord,
  Opportunity,
  SkillEntry,
  SkillProficiency,
} from '../types';
import {
  computeOpportunityMatch,
  getMatchedSkill,
  PROFICIENCY_WEIGHTS,
} from '../utils/matching';

interface RadarSkillDatum {
  skill: string;
  requirementType: 'Required' | 'Helpful extra';
  target: number;
  candidate: number;
  matched: boolean;
  proficiency?: SkillProficiency;
}

interface RadarAngleTickProps {
  payload?: { value?: string | number };
  x?: number | string;
  y?: number | string;
  textAnchor?: string;
}

function renderRadarAngleTick(
  {
    payload,
    x,
    y,
    textAnchor,
  }: RadarAngleTickProps,
  isDark = false
) {
  const label = String(payload?.value ?? '');
  const words = label.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current && `${current} ${word}`.length > 14) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);

  const numX = typeof x === 'number' ? x : Number(x ?? 0);
  const numY = typeof y === 'number' ? y : Number(y ?? 0);
  const anchor: 'start' | 'middle' | 'end' | 'inherit' =
    textAnchor === 'start' ||
    textAnchor === 'middle' ||
    textAnchor === 'end' ||
    textAnchor === 'inherit'
      ? textAnchor
      : 'middle';

  return (
    <text
      x={numX}
      y={numY}
      textAnchor={anchor}
      fill={isDark ? '#F5F2EC' : '#1E2220'}
      fontSize={11}
      fontWeight={500}
    >
      {lines.slice(0, 2).map((line, index) => (
        <tspan key={`${label}-${index}`} x={numX} dy={index === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

interface RadarTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: RadarSkillDatum }>;
}

function RadarSkillTooltip({ active, payload }: RadarTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl px-3.5 py-2.5 shadow-sm text-xs space-y-1 max-w-[220px]">
      <p className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
        {datum.skill}
      </p>
      <p className="text-[#525855] dark:text-[#B4BDB9]">
        Role level:{' '}
        <span className="font-medium text-[#6E1E2E] dark:text-[#E58A9B]">
          {datum.requirementType} ({datum.target}%)
        </span>
      </p>
      <p
        className={
          datum.matched
            ? 'font-semibold text-[#0F6B6E] dark:text-[#56C7C4]'
            : 'font-medium text-[#6E1E2E] dark:text-[#E58A9B]'
        }
      >
        {datum.matched && datum.proficiency
          ? `Your profile: ${datum.proficiency} (${datum.candidate}%)`
          : 'Your profile: Not yet listed — focus area'}
      </p>
    </div>
  );
}

interface OpportunitiesSectionProps {
  candidateSkills: SkillEntry[];
  savedOpportunityIds: string[];
  applications: Record<string, ApplicationRecord>;
  initialSelectedOpportunityId?: string | null;
  onClearInitialSelected?: () => void;
  onToggleSave: (opportunityId: string) => void;
  onExpressInterest: (opportunityId: string, note: string) => void;
  onWithdrawInterest: (opportunityId: string) => void;
  isDark?: boolean;
}

export function OpportunitiesSection({
  candidateSkills,
  savedOpportunityIds,
  applications,
  initialSelectedOpportunityId,
  onClearInitialSelected,
  onToggleSave,
  onExpressInterest,
  onWithdrawInterest,
  isDark = false,
}: OpportunitiesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'saved' | 'applied'>('all');

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(() =>
      initialSelectedOpportunityId
        ? SAMPLE_OPPORTUNITIES.find((o) => o.id === initialSelectedOpportunityId) ?? null
        : null
    );
  const [interestNote, setInterestNote] = useState('');
  const [actionToast, setActionToast] = useState('');

  useEffect(() => {
    if (initialSelectedOpportunityId) {
      const found = SAMPLE_OPPORTUNITIES.find(
        (o) => o.id === initialSelectedOpportunityId
      );
      if (found) {
        setSelectedOpportunity(found);
      }
      onClearInitialSelected?.();
    }
  }, [initialSelectedOpportunityId, onClearInitialSelected]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedOpportunity) {
        setSelectedOpportunity(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOpportunity]);

  const roleOptions = useMemo(
    () => Array.from(new Set(SAMPLE_OPPORTUNITIES.map((o) => o.roleCategory))),
    []
  );

  const locationOptions = useMemo(
    () => Array.from(new Set(SAMPLE_OPPORTUNITIES.map((o) => o.location))),
    []
  );

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_OPPORTUNITIES.forEach((o) => {
      o.requiredSkills.forEach((s) => set.add(s));
      o.niceToHaveSkills.forEach((s) => set.add(s));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SAMPLE_OPPORTUNITIES.filter((opp) => {
      if (roleFilter !== 'all' && opp.roleCategory !== roleFilter) return false;
      if (locationFilter !== 'all' && opp.location !== locationFilter) return false;
      if (
        skillFilter !== 'all' &&
        !opp.requiredSkills.some((s) => s.toLowerCase() === skillFilter.toLowerCase()) &&
        !opp.niceToHaveSkills.some((s) => s.toLowerCase() === skillFilter.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter === 'saved' && !savedOpportunityIds.includes(opp.id)) {
        return false;
      }
      if (statusFilter === 'applied' && !applications[opp.id]) {
        return false;
      }
      if (query) {
        const haystack = `${opp.title} ${opp.organization} ${opp.location} ${opp.summary} ${opp.requiredSkills.join(' ')}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [
    searchQuery,
    roleFilter,
    locationFilter,
    skillFilter,
    statusFilter,
    savedOpportunityIds,
    applications,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    roleFilter !== 'all' ||
    locationFilter !== 'all' ||
    skillFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setLocationFilter('all');
    setSkillFilter('all');
    setStatusFilter('all');
  };

  const triggerToast = (message: string) => {
    setActionToast(message);
    window.setTimeout(() => setActionToast(''), 3500);
  };

  const handleInterestAction = (opp: Opportunity, note = '') => {
    onExpressInterest(opp.id, note);
    setInterestNote('');
    triggerToast(
      `Demo interest recorded for "${opp.title}". No real employer was contacted.`
    );
  };

  return (
    <div className="space-y-8">
      {/* Header + Primary View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0F6B6E] dark:text-[#56C7C4]">
            Sample demo fellowships · Transparent skill-overlap scoring
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
            Opportunities
          </h1>
          <p className="text-sm sm:text-base text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
            All listings below are fictional sample opportunities for prototype demonstration.
            Match percentages weight your Skills Passport proficiency levels (Beginner 50%,
            Intermediate 80%, Advanced 100%) against each opportunity’s required skills—no AI or
            employer verification is implied.
          </p>
        </div>

        <div
          role="group"
          aria-label="Toggle between All Opportunities and Saved Opportunities"
          className="inline-flex items-center gap-1 p-1.5 bg-[#F2EEE7] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl self-start lg:self-auto shrink-0"
        >
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            aria-pressed={statusFilter !== 'saved'}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
              statusFilter !== 'saved'
                ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
            }`}
          >
            All Opportunities ({SAMPLE_OPPORTUNITIES.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('saved')}
            aria-pressed={statusFilter === 'saved'}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
              statusFilter === 'saved'
                ? 'bg-white dark:bg-[#1B1F1E] text-[#0F6B6E] dark:text-[#56C7C4] shadow-xs'
                : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                statusFilter === 'saved'
                  ? 'fill-[#0F6B6E] dark:fill-[#56C7C4] text-[#0F6B6E] dark:text-[#56C7C4]'
                  : ''
              }`}
              aria-hidden="true"
            />
            <span>Saved Opportunities ({savedOpportunityIds.length})</span>
          </button>
        </div>
      </div>

      {actionToast && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs sm:text-sm text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            {actionToast}
          </span>
          <button
            type="button"
            onClick={() => setActionToast('')}
            aria-label="Dismiss notification"
            className="p-1 hover:bg-[#0F6B6E]/10 dark:hover:bg-[#56C7C4]/15 rounded cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <section
        aria-label="Filter sample opportunities"
        className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-5 space-y-4 transition-colors"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <label htmlFor="opp-search" className="sr-only">
              Search opportunities by role, skill, or city
            </label>
            <Search
              className="w-4 h-4 text-[#525855] dark:text-[#B4BDB9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="opp-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, skill, city, or sample org..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            />
          </div>

          <div className="lg:col-span-3">
            <label htmlFor="role-filter" className="sr-only">
              Filter by role category
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            >
              <option value="all">All role categories</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="location-filter" className="sr-only">
              Filter by location
            </label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            >
              <option value="all">All locations</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="skill-filter" className="sr-only">
              Filter by skill
            </label>
            <select
              id="skill-filter"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            >
              <option value="all">All skills</option>
              {skillOptions.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'applied' ? 'all' : 'applied'))
            }
            aria-pressed={statusFilter === 'applied'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              statusFilter === 'applied'
                ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/10 dark:bg-[#147E82]/25 text-[#0F6B6E] dark:text-[#56C7C4]'
                : 'border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              Interest recorded only ({Object.keys(applications).length})
            </span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Opportunity Cards */}
      {filteredOpportunities.length === 0 ? (
        <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-10 text-center space-y-3">
          <p className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
            {statusFilter === 'saved' && savedOpportunityIds.length === 0
              ? 'No saved opportunities yet'
              : 'No sample opportunities match these filters'}
          </p>
          <p className="text-sm text-[#525855] dark:text-[#B4BDB9] max-w-md mx-auto">
            {statusFilter === 'saved' && savedOpportunityIds.length === 0
              ? 'Save any fellowship from All Opportunities to bookmark it here for quick comparison.'
              : 'Try clearing your search query or switching back to all locations and skill tracks.'}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[42px]"
          >
            {statusFilter === 'saved' && savedOpportunityIds.length === 0
              ? 'Browse All Opportunities'
              : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOpportunities.map((opp) => {
            const match = computeOpportunityMatch(candidateSkills, opp);
            const isSaved = savedOpportunityIds.includes(opp.id);
            const application = applications[opp.id];

            return (
              <article
                key={opp.id}
                className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 flex flex-col justify-between gap-5 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                        Sample demo · {opp.location} · {opp.format}
                      </p>
                      <h2 className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] leading-snug">
                        {opp.title}
                      </h2>
                      <p className="text-sm font-medium text-[#525855] dark:text-[#B4BDB9]">
                        {opp.organization}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-2xl font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                        {match.percentage}%
                      </span>
                      <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                        skill match
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                    {opp.summary}
                  </p>

                  {/* Explainable Match Breakdown */}
                  <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-4 space-y-2 text-xs">
                    <p className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                      {match.explanation}
                    </p>
                    <p className="text-[#1E2220] dark:text-[#F5F2EC]">
                      <span className="font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                        Matched skills:
                      </span>{' '}
                      {match.matchedRequired.length > 0
                        ? match.matchedRequired
                            .map((m) => `${m.name} (${m.proficiency})`)
                            .join(' · ')
                        : 'None from your current list yet'}
                    </p>
                    <p className="text-[#525855] dark:text-[#B4BDB9]">
                      <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                        Missing / to build:
                      </span>{' '}
                      {match.missingRequired.length > 0
                        ? match.missingRequired.join(' · ')
                        : 'All required skills present'}
                    </p>
                  </div>

                  {application && (
                    <p className="text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {application.status} · {application.submittedAt}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(opp)}
                    className="px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs sm:text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                  >
                    Details
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSave(opp.id)}
                    aria-pressed={isSaved}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] transition-colors ${
                      isSaved
                        ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/10 dark:bg-[#147E82]/25 text-[#0F6B6E] dark:text-[#56C7C4]'
                        : 'border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#232826]'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isSaved ? 'fill-[#0F6B6E] dark:fill-[#56C7C4]' : ''
                      }`}
                      aria-hidden="true"
                    />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  {!application ? (
                    <button
                      type="button"
                      onClick={() => handleInterestAction(opp)}
                      className="ml-auto px-4 py-2 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-xs sm:text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] transition-colors"
                    >
                      Express interest
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onWithdrawInterest(opp.id);
                        triggerToast(`Removed local demo interest for "${opp.title}".`);
                      }}
                      className="ml-auto px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs font-medium text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                    >
                      Withdraw demo interest
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Opportunity Detail Dialog */}
      {selectedOpportunity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="opp-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2220]/50 dark:bg-black/70 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOpportunity(null);
            }
          }}
        >
          <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            {(() => {
              const opp = selectedOpportunity;
              const match = computeOpportunityMatch(candidateSkills, opp);
              const isSaved = savedOpportunityIds.includes(opp.id);
              const application = applications[opp.id];

              const seenSkills = new Set<string>();
              const radarData: RadarSkillDatum[] = [];
              opp.requiredSkills.forEach((skill) => {
                const key = skill.toLowerCase();
                if (seenSkills.has(key)) return;
                seenSkills.add(key);
                const matchedEntry = getMatchedSkill(candidateSkills, skill);
                const weight = matchedEntry
                  ? PROFICIENCY_WEIGHTS[matchedEntry.proficiency]
                  : 0;
                radarData.push({
                  skill,
                  requirementType: 'Required',
                  target: 100,
                  candidate: Math.round(100 * weight),
                  matched: Boolean(matchedEntry),
                  proficiency: matchedEntry?.proficiency,
                });
              });
              opp.niceToHaveSkills.forEach((skill) => {
                const key = skill.toLowerCase();
                if (seenSkills.has(key)) return;
                seenSkills.add(key);
                const matchedEntry = getMatchedSkill(candidateSkills, skill);
                const weight = matchedEntry
                  ? PROFICIENCY_WEIGHTS[matchedEntry.proficiency]
                  : 0;
                radarData.push({
                  skill,
                  requirementType: 'Helpful extra',
                  target: 70,
                  candidate: Math.round(70 * weight),
                  matched: Boolean(matchedEntry),
                  proficiency: matchedEntry?.proficiency,
                });
              });

              const metRadarSkills = radarData
                .filter((item) => item.matched)
                .map((item) => item.skill);
              const learningFocusSkills = radarData
                .filter((item) => !item.matched)
                .map((item) => item.skill);

              return (
                <>
                  <div className="flex items-start justify-between gap-4 border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B]">
                        {opp.demoNote}
                      </p>
                      <h2
                        id="opp-modal-title"
                        className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
                      >
                        {opp.title}
                      </h2>
                      <p className="text-sm text-[#525855] dark:text-[#B4BDB9]">
                        {opp.organization} · {opp.location} · {opp.duration}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOpportunity(null)}
                      aria-label="Close opportunity details"
                      className="p-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] cursor-pointer"
                    >
                      <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                      {opp.summary}
                    </p>
                    <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                      Format: {opp.format} · Support note: {opp.stipendNote}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                      Sample responsibilities
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#525855] dark:text-[#B4BDB9]">
                      {opp.responsibilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-4 sm:p-5 space-y-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E3DDD2] dark:border-[#2F3533]">
                      <div>
                        <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC] block">
                          Skill requirements fit
                        </span>
                        <span className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                          Shaded items and teal radar coverage match skills in your Skills Passport
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                        {match.percentage}% ({match.matchedRequired.length}/
                        {opp.requiredSkills.length})
                      </span>
                    </div>

                    {/* Recharts Skill Fit Radar */}
                    <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-3.5 sm:p-4 space-y-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                          Skill profile vs. fellowship requirements
                        </p>
                        <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                          Required target: 100% · Helpful extra: 70%
                        </p>
                      </div>

                      <div
                        className="w-full h-64 sm:h-72"
                        role="img"
                        aria-label={`Radar chart comparing your Skills Passport against ${opp.title} skill requirements`}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            outerRadius="65%"
                            data={radarData}
                            margin={{ top: 10, right: 28, bottom: 10, left: 28 }}
                          >
                            <PolarGrid stroke={isDark ? '#323836' : '#E3DDD2'} />
                            <PolarAngleAxis
                              dataKey="skill"
                              tick={(props) => renderRadarAngleTick(props, isDark)}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={false}
                              axisLine={false}
                            />
                            <Radar
                              name="Fellowship requirement"
                              dataKey="target"
                              stroke={isDark ? '#E58A9B' : '#6E1E2E'}
                              strokeWidth={1.75}
                              strokeDasharray="4 3"
                              fill={isDark ? '#E58A9B' : '#6E1E2E'}
                              fillOpacity={isDark ? 0.16 : 0.12}
                            />
                            <Radar
                              name="Your Skills Passport"
                              dataKey="candidate"
                              stroke={isDark ? '#56C7C4' : '#0F6B6E'}
                              strokeWidth={2.25}
                              fill={isDark ? '#56C7C4' : '#0F6B6E'}
                              fillOpacity={isDark ? 0.32 : 0.28}
                              dot={{
                                r: 3.5,
                                fill: isDark ? '#56C7C4' : '#0F6B6E',
                                strokeWidth: 0,
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: '12px',
                                paddingTop: '6px',
                                color: isDark ? '#F5F2EC' : '#1E2220',
                              }}
                            />
                            <Tooltip
                              content={(props) => (
                                <RadarSkillTooltip
                                  active={props.active}
                                  payload={props.payload as RadarTooltipProps['payload']}
                                />
                              )}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533] text-xs">
                        <div className="bg-[#0F6B6E]/8 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 rounded-lg px-3 py-2 space-y-0.5">
                          <p className="font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                            Requirements met ({metRadarSkills.length})
                          </p>
                          <p className="text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                            {metRadarSkills.length > 0
                              ? metRadarSkills.join(' · ')
                              : 'None of the listed skills are in your profile yet.'}
                          </p>
                        </div>
                        <div className="bg-[#6E1E2E]/6 dark:bg-[#8A2A3D]/20 border border-[#6E1E2E]/20 dark:border-[#E58A9B]/35 rounded-lg px-3 py-2 space-y-0.5">
                          <p className="font-semibold text-[#6E1E2E] dark:text-[#E58A9B]">
                            Focus for future learning ({learningFocusSkills.length})
                          </p>
                          <p className="text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                            {learningFocusSkills.length > 0
                              ? learningFocusSkills.join(' · ')
                              : 'All required and helpful skills are already listed.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                        Required skills
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {opp.requiredSkills.map((skill) => {
                          const matchedSkill = getMatchedSkill(candidateSkills, skill);
                          const matched = Boolean(matchedSkill);
                          return (
                            <li
                              key={skill}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                                matched
                                  ? 'bg-[#0F6B6E]/12 dark:bg-[#147E82]/25 border-[#0F6B6E]/35 dark:border-[#56C7C4]/45 text-[#0A4D50] dark:text-[#9CE4E2]'
                                  : 'bg-white dark:bg-[#1B1F1E] border-[#E3DDD2] dark:border-[#2F3533] text-[#525855] dark:text-[#B4BDB9]'
                              }`}
                            >
                              <span className="flex items-center gap-2 font-semibold">
                                {matched ? (
                                  <CheckCircle2
                                    className="w-3.5 h-3.5 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="w-3.5 h-3.5 rounded-full border border-[#CFC8BC] dark:border-[#4A534F] shrink-0"
                                  />
                                )}
                                <span
                                  className={
                                    matched
                                      ? 'text-[#0A4D50] dark:text-[#9CE4E2]'
                                      : 'text-[#1E2220] dark:text-[#F5F2EC]'
                                  }
                                >
                                  {skill}
                                </span>
                              </span>
                              <span
                                className={`text-[11px] font-medium whitespace-nowrap ${
                                  matched
                                    ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                                    : 'text-[#525855] dark:text-[#B4BDB9]'
                                }`}
                              >
                                {matchedSkill ? matchedSkill.proficiency : 'To build'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {opp.niceToHaveSkills.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                          Helpful extra skills
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {opp.niceToHaveSkills.map((skill) => {
                            const matchedSkill = getMatchedSkill(candidateSkills, skill);
                            const matched = Boolean(matchedSkill);
                            return (
                              <li
                                key={skill}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs transition-colors ${
                                  matched
                                    ? 'bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border-[#0F6B6E]/30 dark:border-[#56C7C4]/40 text-[#0A4D50] dark:text-[#9CE4E2]'
                                    : 'bg-white dark:bg-[#1B1F1E] border-[#E3DDD2] dark:border-[#2F3533] text-[#525855] dark:text-[#B4BDB9]'
                                }`}
                              >
                                <span className="flex items-center gap-2 font-medium">
                                  {matched ? (
                                    <CheckCircle2
                                      className="w-3.5 h-3.5 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <span
                                      aria-hidden="true"
                                      className="w-3.5 h-3.5 rounded-full border border-[#CFC8BC] dark:border-[#4A534F] shrink-0"
                                    />
                                  )}
                                  <span
                                    className={
                                      matched
                                        ? 'text-[#0A4D50] dark:text-[#9CE4E2]'
                                        : 'text-[#1E2220] dark:text-[#F5F2EC]'
                                    }
                                  >
                                    {skill}
                                  </span>
                                </span>
                                <span
                                  className={`text-[11px] font-medium whitespace-nowrap ${
                                    matched
                                      ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                                      : 'text-[#525855] dark:text-[#B4BDB9]'
                                  }`}
                                >
                                  {matchedSkill ? matchedSkill.proficiency : 'Optional extra'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#F2EEE7] dark:bg-[#232826] rounded-xl p-3.5 text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                    Demo workflow note: Expressing interest creates a local prototype status in
                    your browser and does not send data to a real employer. Always confirm work
                    authorization and eligibility rules with qualified local support.
                  </div>

                  {application ? (
                    <div className="p-4 rounded-xl border border-[#0F6B6E]/30 dark:border-[#56C7C4]/35 bg-[#0F6B6E]/8 dark:bg-[#147E82]/20 space-y-2">
                      <p className="text-sm font-semibold text-[#0F6B6E] dark:text-[#56C7C4] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {application.status} ({application.submittedAt})
                        </span>
                      </p>
                      {application.note && (
                        <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC]">
                          Your note: “{application.note}”
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="interest-note"
                        className="block text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                      >
                        Optional short note for your demo record
                      </label>
                      <input
                        id="interest-note"
                        type="text"
                        value={interestNote}
                        onChange={(e) => setInterestNote(e.target.value)}
                        placeholder="e.g., Available starting next month; built a community web schedule."
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E3DDD2] dark:border-[#2F3533]">
                    <button
                      type="button"
                      onClick={() => onToggleSave(opp.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer min-h-[42px] transition-colors ${
                        isSaved
                          ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/10 dark:bg-[#147E82]/25 text-[#0F6B6E] dark:text-[#56C7C4]'
                          : 'border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#232826]'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-[#0F6B6E] dark:fill-[#56C7C4]' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span>{isSaved ? 'Saved' : 'Save opportunity'}</span>
                    </button>

                    {!application ? (
                      <button
                        type="button"
                        onClick={() => handleInterestAction(opp, interestNote)}
                        className="px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[42px] transition-colors"
                      >
                        Express demo interest
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onWithdrawInterest(opp.id)}
                        className="px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] text-sm font-medium text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer min-h-[42px]"
                      >
                        Withdraw demo interest
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

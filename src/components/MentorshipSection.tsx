import {
  Bookmark,
  CheckCircle2,
  Compass,
  Lightbulb,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_MENTORS } from '../data/seedData';
import { CandidateProfile, Mentor, MentorshipRequest } from '../types';
import { containsSensitivePattern } from '../utils/matching';

interface MentorshipSectionProps {
  profile: CandidateProfile;
  requests: MentorshipRequest[];
  savedMentorIds: string[];
  onToggleSaveMentor: (mentorId: string) => void;
  onSubmitRequest: (request: Omit<MentorshipRequest, 'id' | 'status' | 'submittedAt'>) => void;
  onDeleteRequest: (id: string) => void;
}

const FOCUS_AREAS = [
  'Portfolio & project feedback',
  'Practical technical coaching',
  'Communication & interview practice',
  'Local fellowship pathway orientation',
];

const MEETING_FORMATS = [
  'Public library or community learning hub',
  'Organization-approved virtual video call',
  'Small-group workshop setting',
];

const MATCH_TIPS_BY_FOCUS: Record<
  string,
  {
    summary: string;
    talkingPoints: string[];
    questionsToAsk: string[];
    starterNote: string;
  }
> = {
  'Portfolio & project feedback': {
    summary:
      'Focus the first 20 minutes on one concrete work example rather than your whole career history.',
    talkingPoints: [
      'Explain the real problem your project or spreadsheet solved and who used it.',
      'Walk through one challenge you ran into and how you tested or fixed it.',
      'Note which parts you built independently versus with a team.',
    ],
    questionsToAsk: [
      '“What single improvement would make this project clearer to a fellowship coordinator?”',
      '“How can I present informal or community work so it demonstrates reliability?”',
    ],
    starterNote:
      'I would appreciate 20 minutes of feedback on one practical work sample and how to present it clearly without formal certificates.',
  },
  'Practical technical coaching': {
    summary:
      'Pick one specific skill gap from your target fellowship so your mentor can give hands-on exercises.',
    talkingPoints: [
      'Name 1–2 skills you already use confidently and 1 skill you want to build next.',
      'Share what tools or devices you currently have access to for practice.',
      'Mention how many hours per week you can dedicate to small practice tasks.',
    ],
    questionsToAsk: [
      '“What small 2-hour practice task would best build confidence in this skill?”',
      '“Which common mistakes do beginners make here, and how can I check my own work?”',
    ],
    starterNote:
      'I want to strengthen one practical technical skill needed for local fellowships and would value guidance on focused weekly exercises.',
  },
  'Communication & interview practice': {
    summary:
      'Practice turning hands-on experiences into concise, structured 90-second stories.',
    talkingPoints: [
      'Prepare one short example of solving a problem with limited resources or tight timelines.',
      'Practice explaining technical or data tasks in plain, everyday language.',
      'Note which languages you are most comfortable interviewing in.',
    ],
    questionsToAsk: [
      '“Can we run two short mock questions and review how clearly I explain my past work?”',
      '“How should I address missing academic documents calmly when asked about background?”',
    ],
    starterNote:
      'I would like to practice explaining my hands-on skills clearly in a short mock conversation and get feedback on my pacing.',
  },
  'Local fellowship pathway orientation': {
    summary:
      'Use this session to understand local team expectations, norms, and realistic next steps.',
    talkingPoints: [
      'Share your preferred county/city hub and whether hybrid or in-person works best.',
      'Highlight transferable skills (coordination, multilingual outreach, data quality).',
      'Clarify what kind of community support or learning workspace helps you succeed.',
    ],
    questionsToAsk: [
      '“What do local fellowship teams value most during the first two weeks?”',
      '“Which local community hubs or support organizations can help confirm formal eligibility?”',
    ],
    starterNote:
      'I am exploring local fellowship tracks in my region and would appreciate perspective on workplace expectations and next learning steps.',
  },
};

const MENTORSHIP_TOUR_STORAGE_KEY = 'skillbridge_mentorship_tour_seen_v1';

type MentorTourStepId = 'search' | 'filters' | 'bookmark' | 'saved-toggle';

const MENTORSHIP_TOUR_STEPS: Array<{
  id: MentorTourStepId;
  title: string;
  description: string;
}> = [
  {
    id: 'search',
    title: 'Search by skill, role, or city',
    description:
      'Type a tool like “Spreadsheets”, a city, or a mentor’s name to narrow down relevant practitioners right away.',
  },
  {
    id: 'filters',
    title: 'Filter by expertise & language',
    description:
      'Pair an expertise area with a language you are comfortable speaking so mentorship conversations feel natural from day one.',
  },
  {
    id: 'bookmark',
    title: 'Bookmark mentors to compare',
    description:
      'Save promising mentors while browsing so you can compare availability, meeting settings, and revisit them later without searching again.',
  },
  {
    id: 'saved-toggle',
    title: 'Switch to Saved Mentors anytime',
    description:
      'Use this toggle to jump straight to your shortlisted mentors whenever you are ready to draft a mentorship request.',
  },
];

interface TourTooltipProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  placement: 'below-left' | 'above-left' | 'below-responsive-right';
  onPrev: () => void;
  onNext: () => void;
  onDismiss: () => void;
}

function TourTooltip({
  stepIndex,
  totalSteps,
  title,
  description,
  placement,
  onPrev,
  onNext,
  onDismiss,
}: TourTooltipProps) {
  const isLast = stepIndex === totalSteps - 1;

  const positionClass =
    placement === 'above-left'
      ? 'bottom-full left-0 mb-3'
      : placement === 'below-responsive-right'
        ? 'top-full left-0 lg:left-auto lg:right-0 mt-3'
        : 'top-full left-0 mt-3';

  const caretClass =
    placement === 'above-left'
      ? '-bottom-[7px] left-6 border-b-2 border-r-2'
      : placement === 'below-responsive-right'
        ? '-top-[7px] left-8 lg:left-auto lg:right-8 border-t-2 border-l-2'
        : '-top-[7px] left-6 border-t-2 border-l-2';

  return (
    <div
      role="region"
      aria-label={`Mentorship guided tour step ${stepIndex + 1} of ${totalSteps}: ${title}`}
      className={`print:hidden absolute z-20 w-[min(20.5rem,calc(100vw-2.5rem))] bg-white dark:bg-[#1F2523] border-2 border-[#0F6B6E] dark:border-[#56C7C4] rounded-xl p-4 shadow-xl text-left ${positionClass}`}
    >
      <span
        aria-hidden="true"
        className={`absolute w-3 h-3 rotate-45 bg-white dark:bg-[#1F2523] border-[#0F6B6E] dark:border-[#56C7C4] ${caretClass}`}
      />

      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[11px] font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
          Quick tip · {stepIndex + 1} of {totalSteps}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close guided tour"
          className="p-0.5 rounded text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <h3 className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-1">
        {title}
      </h3>
      <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed mt-1">
        {description}
      </p>

      <div className="mt-3 pt-2.5 border-t border-[#E3DDD2] dark:border-[#2F3533] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIndex
                    ? 'w-4 bg-[#0F6B6E] dark:bg-[#56C7C4]'
                    : 'w-1.5 bg-[#E3DDD2] dark:bg-[#2F3533]'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] font-medium text-[#525855] dark:text-[#B4BDB9] hover:underline cursor-pointer"
          >
            Skip
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="px-2.5 py-1.5 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? onDismiss : onNext}
            className="px-3 py-1.5 rounded-lg bg-[#0F6B6E] dark:bg-[#147E82] text-white text-xs font-semibold hover:bg-[#0B5254] dark:hover:bg-[#189499] cursor-pointer"
          >
            {isLast ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MentorshipSection({
  profile,
  requests,
  savedMentorIds,
  onToggleSaveMentor,
  onSubmitRequest,
  onDeleteRequest,
}: MentorshipSectionProps) {
  const [selectedMentorId, setSelectedMentorId] = useState<string>(
    SAMPLE_MENTORS[0].id
  );
  const [focusArea, setFocusArea] = useState<string>(FOCUS_AREAS[0]);
  const [meetingFormat, setMeetingFormat] = useState<string>(MEETING_FORMATS[0]);
  const [message, setMessage] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Mentor filtering & saved toggle state
  const [mentorView, setMentorView] = useState<'all' | 'saved'>('all');
  const [mentorSearch, setMentorSearch] = useState<string>('');
  const [expertiseFilter, setExpertiseFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  // Non-intrusive guided tour state (auto-shows once on first visit)
  const [tourStepIndex, setTourStepIndex] = useState<number | null>(() => {
    try {
      return window.localStorage.getItem(MENTORSHIP_TOUR_STORAGE_KEY) === 'true'
        ? null
        : 0;
    } catch {
      return null;
    }
  });

  const formRef = useRef<HTMLFormElement>(null);
  const tourSearchRef = useRef<HTMLDivElement>(null);
  const tourFiltersRef = useRef<HTMLDivElement>(null);
  const tourBookmarkRef = useRef<HTMLDivElement>(null);
  const tourSavedToggleRef = useRef<HTMLDivElement>(null);

  const expertiseOptions = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_MENTORS.forEach((m) => m.expertise.forEach((e) => set.add(e)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_MENTORS.forEach((m) => m.languages.forEach((l) => set.add(l)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredMentors = useMemo(() => {
    const query = mentorSearch.trim().toLowerCase();
    return SAMPLE_MENTORS.filter((mentor) => {
      if (mentorView === 'saved' && !savedMentorIds.includes(mentor.id)) {
        return false;
      }
      if (
        expertiseFilter !== 'all' &&
        !mentor.expertise.some(
          (e) => e.toLowerCase() === expertiseFilter.toLowerCase()
        )
      ) {
        return false;
      }
      if (
        languageFilter !== 'all' &&
        !mentor.languages.some(
          (l) => l.toLowerCase() === languageFilter.toLowerCase()
        )
      ) {
        return false;
      }
      if (query) {
        const haystack = `${mentor.name} ${mentor.role} ${mentor.organization} ${mentor.location} ${mentor.bio} ${mentor.expertise.join(' ')} ${mentor.languages.join(' ')}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [mentorView, savedMentorIds, mentorSearch, expertiseFilter, languageFilter]);

  const hasMentorFilters =
    mentorSearch.trim() !== '' ||
    expertiseFilter !== 'all' ||
    languageFilter !== 'all';

  const clearMentorFilters = () => {
    setMentorSearch('');
    setExpertiseFilter('all');
    setLanguageFilter('all');
  };

  const activeTourStep =
    tourStepIndex !== null ? MENTORSHIP_TOUR_STEPS[tourStepIndex] : null;

  const markTourSeen = () => {
    try {
      window.localStorage.setItem(MENTORSHIP_TOUR_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage access errors
    }
  };

  const dismissTour = () => {
    setTourStepIndex(null);
    markTourSeen();
  };

  const scrollToTourTarget = (stepId: MentorTourStepId) => {
    window.setTimeout(() => {
      const targetMap: Record<MentorTourStepId, HTMLElement | null> = {
        search: tourSearchRef.current,
        filters: tourFiltersRef.current,
        bookmark: tourBookmarkRef.current,
        'saved-toggle': tourSavedToggleRef.current,
      };
      targetMap[stepId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 50);
  };

  const goToTourStep = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= MENTORSHIP_TOUR_STEPS.length) {
      dismissTour();
      return;
    }
    const nextStep = MENTORSHIP_TOUR_STEPS[nextIndex];
    if (nextStep.id === 'bookmark' && filteredMentors.length === 0) {
      setMentorView('all');
      clearMentorFilters();
    }
    setTourStepIndex(nextIndex);
    scrollToTourTarget(nextStep.id);
  };

  const startTour = () => {
    setMentorView('all');
    clearMentorFilters();
    setTourStepIndex(0);
    scrollToTourTarget('search');
  };

  useEffect(() => {
    if (tourStepIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTourStepIndex(null);
        try {
          window.localStorage.setItem(MENTORSHIP_TOUR_STORAGE_KEY, 'true');
        } catch {
          // Ignore storage access errors
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tourStepIndex]);

  const handleChooseMentor = (mentor: Mentor) => {
    setSelectedMentorId(mentor.id);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setFormError(
        'Share a brief note on what you would like to work on and your general availability.'
      );
      return;
    }

    const sensitive = containsSensitivePattern(message);
    if (sensitive) {
      setFormError(
        `Privacy check: Please remove any ${sensitive} from your message. Share only skills focus and general availability.`
      );
      return;
    }

    const chosenMentor =
      SAMPLE_MENTORS.find((m) => m.id === selectedMentorId)?.name ??
      'Any matching sample mentor';

    onSubmitRequest({
      mentorId: selectedMentorId,
      mentorName: chosenMentor,
      focusArea,
      meetingFormat,
      message: message.trim(),
    });

    setMessage('');
    setFormError('');
    setSuccessMessage(
      `Demo mentorship request submitted for ${chosenMentor}. Saved locally in your browser.`
    );
    window.setTimeout(() => setSuccessMessage(''), 4500);
  };

  return (
    <div className="space-y-10">
      {/* Header + All / Saved Mentors Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0F6B6E] dark:text-[#56C7C4]">
            Demo mentor directory · Fictional sample profiles
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
            Mentorship
          </h1>
          <p className="text-sm sm:text-base text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
            Connect with experienced practitioners for portfolio feedback, practical skills
            coaching, and local sector orientation. Bookmark mentors you want to revisit, or
            select one to prefill a request below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={startTour}
            className="print:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs sm:text-sm font-medium text-[#525855] dark:text-[#B4BDB9] hover:text-[#0F6B6E] dark:hover:text-[#56C7C4] hover:border-[#0F6B6E]/40 dark:hover:border-[#56C7C4]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
          >
            <Compass className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4]" aria-hidden="true" />
            <span>Quick tour</span>
          </button>

          <div ref={tourSavedToggleRef} className="relative">
            <div
              role="group"
              aria-label="Toggle between All Mentors and Saved Mentors"
              className={`inline-flex items-center gap-1 p-1.5 bg-[#F2EEE7] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl transition-shadow ${
                activeTourStep?.id === 'saved-toggle'
                  ? 'ring-2 ring-[#0F6B6E] dark:ring-[#56C7C4] ring-offset-2 ring-offset-[#FAF8F4] dark:ring-offset-[#131615]'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setMentorView('all')}
                aria-pressed={mentorView === 'all'}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  mentorView === 'all'
                    ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                    : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                }`}
              >
                All Mentors ({SAMPLE_MENTORS.length})
              </button>
              <button
                type="button"
                onClick={() => setMentorView('saved')}
                aria-pressed={mentorView === 'saved'}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                  mentorView === 'saved'
                    ? 'bg-white dark:bg-[#1B1F1E] text-[#0F6B6E] dark:text-[#56C7C4] shadow-xs'
                    : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    mentorView === 'saved'
                      ? 'fill-[#0F6B6E] dark:fill-[#56C7C4] text-[#0F6B6E] dark:text-[#56C7C4]'
                      : ''
                  }`}
                  aria-hidden="true"
                />
                <span>Saved Mentors ({savedMentorIds.length})</span>
              </button>
            </div>

            {activeTourStep?.id === 'saved-toggle' && tourStepIndex !== null && (
              <TourTooltip
                stepIndex={tourStepIndex}
                totalSteps={MENTORSHIP_TOUR_STEPS.length}
                title={activeTourStep.title}
                description={activeTourStep.description}
                placement="below-responsive-right"
                onPrev={() => goToTourStep(tourStepIndex - 1)}
                onNext={() => goToTourStep(tourStepIndex + 1)}
                onDismiss={dismissTour}
              />
            )}
          </div>
        </div>
      </div>

      {/* Safeguarding Guidance */}
      <section
        aria-labelledby="safeguarding-heading"
        className="bg-[#F2EEE7] dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-7 space-y-4"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="w-5 h-5 text-[#6E1E2E] dark:text-[#E58A9B] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2
              id="safeguarding-heading"
              className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Safeguarding &amp; safe mentorship guidelines
            </h2>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9]">
              SkillBridge follows minimal-disclosure principles to protect candidates.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533] text-xs sm:text-sm text-[#1E2220] dark:text-[#F5F2EC]">
          <li className="space-y-1">
            <p className="font-semibold">Share only what is needed</p>
            <p className="text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              Provide only your preferred name, city or county, learning goals, and general
              availability. Never share ID numbers or home addresses.
            </p>
          </li>
          <li className="space-y-1">
            <p className="font-semibold">Public or approved settings first</p>
            <p className="text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              First meetings should take place in a public library, community learning hub, or
              an organization-approved virtual session.
            </p>
          </li>
          <li className="space-y-1">
            <p className="font-semibold">Independent local guidance</p>
            <p className="text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              Mentors offer career feedback only—confirm work-authorization and employment
              requirements with qualified local support organizations.
            </p>
          </li>
        </ul>
      </section>

      {/* Sample Mentors Grid */}
      <section aria-labelledby="mentors-list-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="space-y-1">
            <h2
              id="mentors-list-heading"
              className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              {mentorView === 'saved' ? 'Saved mentors' : 'Sample demo mentors'}
            </h2>
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
              {mentorView === 'saved'
                ? 'Your bookmarked mentors for easy comparison and follow-up.'
                : 'Filter by expertise or language, bookmark favorites, or select a mentor to prefill the request form.'}
            </p>
          </div>
          <p className="font-mono text-xs text-[#525855] dark:text-[#B4BDB9] tabular-nums">
            Showing {filteredMentors.length} of{' '}
            {mentorView === 'saved' ? savedMentorIds.length : SAMPLE_MENTORS.length}{' '}
            {mentorView === 'saved' ? 'saved mentors' : 'mentors'}
          </p>
        </div>

        {/* Mentor Filtering Bar */}
        <div
          role="search"
          aria-label="Filter sample mentors by expertise or language"
          className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-4 sm:p-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div ref={tourSearchRef} className="sm:col-span-5 relative">
              <label htmlFor="mentor-search-input" className="sr-only">
                Search mentors by name, expertise, language, or location
              </label>
              <div
                className={`relative rounded-xl transition-shadow ${
                  activeTourStep?.id === 'search'
                    ? 'ring-2 ring-[#0F6B6E] dark:ring-[#56C7C4] ring-offset-2 ring-offset-white dark:ring-offset-[#1B1F1E]'
                    : ''
                }`}
              >
                <Search
                  className="w-4 h-4 text-[#525855] dark:text-[#B4BDB9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="mentor-search-input"
                  type="search"
                  value={mentorSearch}
                  onChange={(e) => setMentorSearch(e.target.value)}
                  placeholder="Search name, expertise, language, or city..."
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
                {mentorSearch && (
                  <button
                    type="button"
                    onClick={() => setMentorSearch('')}
                    aria-label="Clear mentor search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {activeTourStep?.id === 'search' && tourStepIndex !== null && (
                <TourTooltip
                  stepIndex={tourStepIndex}
                  totalSteps={MENTORSHIP_TOUR_STEPS.length}
                  title={activeTourStep.title}
                  description={activeTourStep.description}
                  placement="below-left"
                  onPrev={() => goToTourStep(tourStepIndex - 1)}
                  onNext={() => goToTourStep(tourStepIndex + 1)}
                  onDismiss={dismissTour}
                />
              )}
            </div>

            <div
              ref={tourFiltersRef}
              className={`sm:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-3 relative rounded-xl transition-shadow ${
                activeTourStep?.id === 'filters'
                  ? 'ring-2 ring-[#0F6B6E] dark:ring-[#56C7C4] ring-offset-2 ring-offset-white dark:ring-offset-[#1B1F1E]'
                  : ''
              }`}
            >
              <div className="sm:col-span-7">
                <label htmlFor="mentor-expertise-filter" className="sr-only">
                  Filter by mentor expertise
                </label>
                <select
                  id="mentor-expertise-filter"
                  value={expertiseFilter}
                  onChange={(e) => setExpertiseFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                >
                  <option value="all">All expertise areas</option>
                  {expertiseOptions.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label htmlFor="mentor-language-filter" className="sr-only">
                  Filter by mentor language
                </label>
                <select
                  id="mentor-language-filter"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                >
                  <option value="all">All languages</option>
                  {languageOptions.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {activeTourStep?.id === 'filters' && tourStepIndex !== null && (
                <TourTooltip
                  stepIndex={tourStepIndex}
                  totalSteps={MENTORSHIP_TOUR_STEPS.length}
                  title={activeTourStep.title}
                  description={activeTourStep.description}
                  placement="below-left"
                  onPrev={() => goToTourStep(tourStepIndex - 1)}
                  onNext={() => goToTourStep(tourStepIndex + 1)}
                  onDismiss={dismissTour}
                />
              )}
            </div>
          </div>

          {hasMentorFilters && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                Active filters:{' '}
                {[
                  mentorSearch.trim() ? `“${mentorSearch.trim()}”` : null,
                  expertiseFilter !== 'all' ? `Expertise: ${expertiseFilter}` : null,
                  languageFilter !== 'all' ? `Language: ${languageFilter}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <button
                type="button"
                onClick={clearMentorFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline whitespace-nowrap cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear filters</span>
              </button>
            </div>
          )}
        </div>

        {filteredMentors.length === 0 ? (
          <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-8 text-center space-y-3">
            <p className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
              {mentorView === 'saved' && savedMentorIds.length === 0
                ? 'No saved mentors yet'
                : 'No sample mentors match these filters'}
            </p>
            <p className="text-sm text-[#525855] dark:text-[#B4BDB9] max-w-md mx-auto">
              {mentorView === 'saved' && savedMentorIds.length === 0
                ? 'Bookmark any mentor from All Mentors to keep them handy here while comparing expertise or drafting your request.'
                : 'Try clearing one of your expertise or language filters, or select “Any available mentor matching my skills” in the request form below.'}
            </p>
            {mentorView === 'saved' && savedMentorIds.length === 0 ? (
              <button
                type="button"
                onClick={() => setMentorView('all')}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[42px]"
              >
                Browse All Mentors
              </button>
            ) : (
              <button
                type="button"
                onClick={clearMentorFilters}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[42px]"
              >
                Reset mentor filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMentors.map((mentor, index) => {
              const isSaved = savedMentorIds.includes(mentor.id);
              const isTourBookmarkTarget =
                index === 0 && activeTourStep?.id === 'bookmark';
              return (
                <article
                  key={mentor.id}
                  className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                          Demo mentor profile · {mentor.location}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-1">
                          {mentor.name}
                        </h3>
                        <p className="text-sm font-medium text-[#6E1E2E] dark:text-[#E58A9B]">
                          {mentor.role}
                        </p>
                        <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                          {mentor.organization}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                      {mentor.bio}
                    </p>

                    <dl className="space-y-2 pt-3 border-t border-[#E3DDD2] dark:border-[#2F3533] text-xs">
                      <div>
                        <dt className="font-semibold text-[#1E2220] dark:text-[#F5F2EC] inline">
                          Expertise:{' '}
                        </dt>
                        <dd className="text-[#525855] dark:text-[#B4BDB9] inline">
                          {mentor.expertise.join(' · ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#1E2220] dark:text-[#F5F2EC] inline">
                          Languages:{' '}
                        </dt>
                        <dd className="text-[#525855] dark:text-[#B4BDB9] inline">
                          {mentor.languages.join(' · ')}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#1E2220] dark:text-[#F5F2EC] inline">
                          Availability:{' '}
                        </dt>
                        <dd className="text-[#525855] dark:text-[#B4BDB9] inline">
                          {mentor.availability}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[#1E2220] dark:text-[#F5F2EC] inline">
                          Setting:{' '}
                        </dt>
                        <dd className="text-[#525855] dark:text-[#B4BDB9] inline">
                          {mentor.format}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
                    <div
                      ref={index === 0 ? tourBookmarkRef : undefined}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleSaveMentor(mentor.id)}
                        aria-pressed={isSaved}
                        aria-label={
                          isSaved
                            ? `Remove ${mentor.name} from saved mentors`
                            : `Save ${mentor.name} to saved mentors`
                        }
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer min-h-[42px] transition-all ${
                          isSaved
                            ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/10 dark:bg-[#147E82]/25 text-[#0F6B6E] dark:text-[#56C7C4]'
                            : 'border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#232826]'
                        } ${
                          isTourBookmarkTarget
                            ? 'ring-2 ring-[#0F6B6E] dark:ring-[#56C7C4] ring-offset-2 ring-offset-white dark:ring-offset-[#1B1F1E]'
                            : ''
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

                      {isTourBookmarkTarget && tourStepIndex !== null && (
                        <TourTooltip
                          stepIndex={tourStepIndex}
                          totalSteps={MENTORSHIP_TOUR_STEPS.length}
                          title={activeTourStep.title}
                          description={activeTourStep.description}
                          placement="above-left"
                          onPrev={() => goToTourStep(tourStepIndex - 1)}
                          onNext={() => goToTourStep(tourStepIndex + 1)}
                          onDismiss={dismissTour}
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChooseMentor(mentor)}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs sm:text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] transition-colors cursor-pointer min-h-[42px] whitespace-nowrap"
                    >
                      Request match with {mentor.name.split(' ')[0]}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Request Form + Submitted Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-5"
          noValidate
        >
          <div className="border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
            <h2 className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
              Request a demo mentorship match
            </h2>
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-1">
              Submitting as{' '}
              <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                {profile.preferredName || 'Candidate'}
              </span>{' '}
              ({profile.location || 'Location not set'}). Saved locally for prototype
              demonstration.
            </p>
          </div>

          {successMessage && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs sm:text-sm text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#6E1E2E]/8 dark:bg-[#E58A9B]/15 border border-[#6E1E2E]/25 dark:border-[#E58A9B]/35 text-xs sm:text-sm text-[#6E1E2E] dark:text-[#F2A7B5]"
            >
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="mentor-select"
              className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Preferred sample mentor
            </label>
            <select
              id="mentor-select"
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            >
              {SAMPLE_MENTORS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role} ({m.location})
                </option>
              ))}
              <option value="any">Any available mentor matching my skills</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="focus-area-select"
                className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Mentorship goal
              </label>
              <select
                id="focus-area-select"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
              >
                {FOCUS_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="meeting-format-select"
                className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Preferred safe meeting setting
              </label>
              <select
                id="meeting-format-select"
                value={meetingFormat}
                onChange={(e) => setMeetingFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
              >
                {MEETING_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="mentorship-message"
              className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
            >
              What would you like help with &amp; when are you free?
            </label>
            <textarea
              id="mentorship-message"
              rows={3}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="e.g., I would like feedback on my HTML/CSS schedule project and JavaScript practice steps. Free Tuesday evenings."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
            />
            <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
              Reminder: share only general availability and learning goals—no sensitive IDs or
              home addresses.
            </p>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] transition-colors cursor-pointer min-h-[44px]"
          >
            Submit demo mentorship request
          </button>
        </form>

        {/* Right Column: Dynamic Match Tips + Submitted Requests */}
        <div className="lg:col-span-5 space-y-6">
          {(() => {
            const activeTips =
              MATCH_TIPS_BY_FOCUS[focusArea] ?? MATCH_TIPS_BY_FOCUS[FOCUS_AREAS[0]];
            return (
              <aside
                aria-labelledby="match-tips-heading"
                className="bg-[#FAF8F4] dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-7 space-y-4"
              >
                <div className="flex items-start gap-2.5 border-b border-[#E3DDD2] dark:border-[#2F3533] pb-3.5">
                  <Lightbulb
                    className="w-5 h-5 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                      Match Tips · Updates with focus area
                    </p>
                    <h2
                      id="match-tips-heading"
                      className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-0.5"
                    >
                      Prepare for: {focusArea}
                    </h2>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                  {activeTips.summary}
                </p>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                    Talking points to prepare
                  </h3>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                    {activeTips.talkingPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-1">
                  <h3 className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                    Suggested questions to ask
                  </h3>
                  <ul className="space-y-1.5 text-xs text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                    {activeTips.questionsToAsk.map((q) => (
                      <li
                        key={q}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533]"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMessage((prev) =>
                      prev.trim()
                        ? `${prev.trim()} ${activeTips.starterNote}`
                        : activeTips.starterNote
                    );
                    if (formError) setFormError('');
                  }}
                  className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline cursor-pointer"
                >
                  Use starter note in request form
                </button>
              </aside>
            );
          })()}

          {/* Submitted Requests List */}
          <section
            aria-labelledby="submitted-requests-heading"
            className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-7 space-y-4"
          >
            <div className="border-b border-[#E3DDD2] dark:border-[#2F3533] pb-3">
              <h2
                id="submitted-requests-heading"
                className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Your demo mentorship requests
              </h2>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-1">
                Stored locally in your browser.
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]">
                  No mentorship requests submitted yet
                </p>
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                  Complete the form to simulate submitting a request and track its local demo
                  status here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E3DDD2] dark:divide-[#2F3533]">
                {requests.map((req) => (
                  <li key={req.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{req.status}</span>
                        </p>
                        <p className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-0.5">
                          {req.mentorName}
                        </p>
                        <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                          {req.focusArea} · {req.submittedAt}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteRequest(req.id)}
                        aria-label={`Remove demo request for ${req.mentorName}`}
                        className="p-2 rounded-lg text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                      Setting: {req.meetingFormat}
                    </p>
                    <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC] bg-[#FAF8F4] dark:bg-[#232826] rounded-lg p-2.5 border border-[#E3DDD2] dark:border-[#2F3533]">
                      “{req.message}”
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

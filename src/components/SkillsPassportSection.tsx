import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardCopy,
  Eye,
  FolderCheck,
  Layers,
  Link2,
  Linkedin,
  Loader2,
  Lock,
  Plus,
  Printer,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  ASSESSMENT_QUESTIONS,
  AVAILABILITY_OPTIONS,
  EXPERIENCE_OPTIONS,
  LOCATION_SUGGESTIONS,
  SKILL_CATEGORIES,
} from '../data/seedData';
import {
  ApplicationRecord,
  AssessmentCategory,
  CandidateProfile,
  MentorshipRequest,
  NavTab,
  ProjectEvidence,
  SkillEntry,
  SkillProficiency,
} from '../types';
import {
  computeMilestoneBadges,
  computeProfileCompletion,
  containsSensitivePattern,
  formatProfileSummaryText,
  MilestoneBadge,
  mockFetchLinkedInProfile,
  PROFICIENCY_LEVELS,
} from '../utils/matching';

interface SkillsPassportSectionProps {
  profile: CandidateProfile;
  applications: Record<string, ApplicationRecord>;
  mentorshipRequests: MentorshipRequest[];
  onUpdateProfile: (nextProfile: CandidateProfile) => void;
  onProfileSaved?: () => void;
  onNavigate: (tab: NavTab) => void;
}

const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  'Web Development',
  'Data & Operations',
  'Digital Facilitation & Training',
];

function getBadgeIcon(id: MilestoneBadge['id']) {
  switch (id) {
    case 'first-skill':
      return Award;
    case 'skill-builder':
      return Layers;
    case 'evidence-shared':
      return FolderCheck;
    case 'assessment-completed':
      return ClipboardCheck;
    case 'first-application':
      return Send;
    case 'mentorship-connected':
    default:
      return Users;
  }
}

export function SkillsPassportSection({
  profile,
  applications,
  mentorshipRequests,
  onUpdateProfile,
  onProfileSaved,
  onNavigate,
}: SkillsPassportSectionProps) {
  const [skillInput, setSkillInput] = useState('');
  const [skillProficiency, setSkillProficiency] =
    useState<SkillProficiency>('Intermediate');
  const [skillError, setSkillError] = useState('');
  const [skillLibrarySearch, setSkillLibrarySearch] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('All');
  const [languageInput, setLanguageInput] = useState('');

  // Project form state
  const [projectTitle, setProjectTitle] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [projectSkillsText, setProjectSkillsText] = useState('');
  const [projectError, setProjectError] = useState('');

  // Profile validation & feedback
  const [profileWarning, setProfileWarning] = useState('');
  const [profileSavedMessage, setProfileSavedMessage] = useState('');

  // Practical assessment state
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory>(
    profile.assessment?.category ?? 'Web Development'
  );
  const [answers, setAnswers] = useState<Record<number, number>>(() => {
    if (profile.assessment && profile.assessment.category === 'Web Development') {
      const initial: Record<number, number> = {};
      profile.assessment.selectedAnswers.forEach((ans, idx) => {
        initial[idx] = ans;
      });
      return initial;
    }
    return {};
  });
  const [assessmentError, setAssessmentError] = useState('');
  const [showAssessmentForm, setShowAssessmentForm] = useState(
    profile.assessment === null
  );

  // Shareable copy & Share Profile modal state
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareAudience, setShareAudience] = useState<'mentor' | 'fellowship'>(
    'mentor'
  );

  // Mock LinkedIn API import state
  const [isLinkingLinkedIn, setIsLinkingLinkedIn] = useState(false);
  const [linkedInStatusMessage, setLinkedInStatusMessage] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shareModalOpen) {
        setShareModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shareModalOpen]);

  const handleFieldChange = (
    field: keyof CandidateProfile,
    value: string
  ) => {
    const sensitive = containsSensitivePattern(value);
    if (sensitive) {
      setProfileWarning(
        `Privacy check: Please avoid entering a ${sensitive}. Use only your preferred name and general city or county.`
      );
    } else {
      setProfileWarning('');
    }
    onUpdateProfile({
      ...profile,
      [field]: value,
    });
    setProfileSavedMessage('');
  };

  const handleSaveProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!profile.preferredName.trim() || !profile.location.trim() || !profile.roleSought.trim()) {
      setProfileWarning(
        'Please complete preferred name, city or county, and role sought.'
      );
      return;
    }
    const combined = `${profile.preferredName} ${profile.location} ${profile.roleSought} ${profile.professionalSummary}`;
    const sensitive = containsSensitivePattern(combined);
    if (sensitive) {
      setProfileWarning(
        `Please remove any ${sensitive} before saving your demo Skills Passport.`
      );
      return;
    }
    setProfileWarning('');
    setProfileSavedMessage('Profile saved locally in this browser.');
    onProfileSaved?.();
    window.setTimeout(() => setProfileSavedMessage(''), 3500);
  };

  const handleLinkLinkedIn = async () => {
    if (isLinkingLinkedIn) return;
    setIsLinkingLinkedIn(true);
    setLinkedInStatusMessage('');

    try {
      const result = await mockFetchLinkedInProfile(profile);
      const existingNormalized = new Set(
        profile.skills.map((s) => s.name.trim().toLowerCase())
      );
      const newSkillTags = result.skillTags.filter(
        (tag) => !existingNormalized.has(tag.name.trim().toLowerCase())
      );

      const importedAt = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      onUpdateProfile({
        ...profile,
        professionalSummary: result.professionalSummary,
        skills: [...profile.skills, ...newSkillTags],
        linkedInImport: {
          handle: result.handle,
          importedAt,
          fetchedSkills: result.skillTags.map(
            (tag) => `${tag.name} (${tag.proficiency})`
          ),
        },
      });

      setLinkedInStatusMessage(
        newSkillTags.length > 0
          ? `Mock LinkedIn API synced (${result.handle}): populated your professional summary and added ${newSkillTags.length} new skill tags (${newSkillTags
              .map((t) => `${t.name} · ${t.proficiency}`)
              .join(', ')}).`
          : `Mock LinkedIn API synced (${result.handle}): updated your professional summary. All ${result.skillTags.length} fetched skill tags were already in your passport.`
      );
    } finally {
      setIsLinkingLinkedIn(false);
    }
  };

  const handleUnlinkLinkedIn = () => {
    onUpdateProfile({
      ...profile,
      linkedInImport: null,
    });
    setLinkedInStatusMessage(
      'Disconnected mock LinkedIn preview. Your imported summary and skill tags remain editable below.'
    );
  };

  const addSkill = (
    rawSkill: string,
    proficiency: SkillProficiency = skillProficiency
  ) => {
    const trimmed = rawSkill.trim();
    if (!trimmed) {
      setSkillError('Enter a skill name before adding.');
      return;
    }
    const exists = profile.skills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setSkillError(`"${trimmed}" is already on your Skills Passport.`);
      return;
    }
    setSkillError('');
    setSkillInput('');
    const nextEntry: SkillEntry = { name: trimmed, proficiency };
    onUpdateProfile({
      ...profile,
      skills: [...profile.skills, nextEntry],
    });
  };

  const updateSkillProficiency = (
    skillName: string,
    nextProficiency: SkillProficiency
  ) => {
    onUpdateProfile({
      ...profile,
      skills: profile.skills.map((s) =>
        s.name === skillName ? { ...s, proficiency: nextProficiency } : s
      ),
    });
  };

  const removeSkill = (skillToRemove: string) => {
    onUpdateProfile({
      ...profile,
      skills: profile.skills.filter((s) => s.name !== skillToRemove),
    });
  };

  const addLanguage = () => {
    const trimmed = languageInput.trim();
    if (!trimmed) return;
    if (
      profile.languages.some((l) => l.toLowerCase() === trimmed.toLowerCase())
    ) {
      setLanguageInput('');
      return;
    }
    onUpdateProfile({
      ...profile,
      languages: [...profile.languages, trimmed],
    });
    setLanguageInput('');
  };

  const removeLanguage = (lang: string) => {
    onUpdateProfile({
      ...profile,
      languages: profile.languages.filter((l) => l !== lang),
    });
  };

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !projectSummary.trim()) {
      setProjectError('Provide both a project title and a short description of what you did.');
      return;
    }
    if (projectUrl.trim()) {
      try {
        const parsed = new URL(projectUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setProjectError('Project link must start with https:// or http://');
          return;
        }
      } catch {
        setProjectError('Enter a valid URL (e.g., https://example.org/my-work) or leave the link blank.');
        return;
      }
    }
    const sensitive = containsSensitivePattern(`${projectTitle} ${projectSummary}`);
    if (sensitive) {
      setProjectError(`Privacy check: Please remove any ${sensitive} from project notes.`);
      return;
    }

    const newProject: ProjectEvidence = {
      id: `proj-${Date.now()}`,
      title: projectTitle.trim(),
      url: projectUrl.trim(),
      summary: projectSummary.trim(),
      skillsUsed: projectSkillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    onUpdateProfile({
      ...profile,
      projects: [...profile.projects, newProject],
    });

    setProjectTitle('');
    setProjectUrl('');
    setProjectSummary('');
    setProjectSkillsText('');
    setProjectError('');
  };

  const removeProject = (id: string) => {
    onUpdateProfile({
      ...profile,
      projects: profile.projects.filter((p) => p.id !== id),
    });
  };

  const currentQuestions = ASSESSMENT_QUESTIONS[selectedCategory];

  const handleCategoryChange = (category: AssessmentCategory) => {
    setSelectedCategory(category);
    setAnswers({});
    setAssessmentError('');
    setShowAssessmentForm(true);
  };

  const handleAssessmentSubmit = (e: FormEvent) => {
    e.preventDefault();
    const selectedAnswers: number[] = [];
    for (let i = 0; i < currentQuestions.length; i++) {
      if (answers[i] === undefined) {
        setAssessmentError(
          `Please answer all ${currentQuestions.length} practice questions before submitting.`
        );
        return;
      }
      selectedAnswers.push(answers[i]);
    }

    let score = 0;
    currentQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });

    setAssessmentError('');
    setShowAssessmentForm(false);
    onUpdateProfile({
      ...profile,
      assessment: {
        category: selectedCategory,
        score,
        total: currentQuestions.length,
        completedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        selectedAnswers,
      },
    });
  };

  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleCopySummary = async () => {
    await copyTextToClipboard(formatProfileSummaryText(profile));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3000);
  };

  const slugifyPart = (value: string, fallback: string) => {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned || fallback;
  };

  const mockShareUrl = `https://skillbridge-demo.example.org/passport/${slugifyPart(
    profile.preferredName,
    'candidate'
  )}-${slugifyPart(profile.location, 'local')}?for=${shareAudience}`;

  const handleCopyShareUrl = async () => {
    await copyTextToClipboard(mockShareUrl);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 3000);
  };

  const normalizedSkillQuery = skillLibrarySearch.trim().toLowerCase();
  const filteredCategoryGroups = SKILL_CATEGORIES.filter(
    (group) =>
      selectedSkillCategory === 'All' || group.category === selectedSkillCategory
  )
    .map((group) => ({
      category: group.category,
      skills: group.skills.filter((skill) => {
        const alreadyAdded = profile.skills.some(
          (s) => s.name.toLowerCase() === skill.toLowerCase()
        );
        if (alreadyAdded) return false;
        if (!normalizedSkillQuery) return true;
        return (
          skill.toLowerCase().includes(normalizedSkillQuery) ||
          group.category.toLowerCase().includes(normalizedSkillQuery)
        );
      }),
    }))
    .filter((group) => group.skills.length > 0);

  const milestones = computeMilestoneBadges(
    profile,
    applications,
    mentorshipRequests
  );
  const unlockedBadgesCount = milestones.filter((m) => m.unlocked).length;
  const badgeProgressPct = Math.round(
    (unlockedBadgesCount / milestones.length) * 100
  );

  const completion = computeProfileCompletion(profile);

  return (
    <div className="skills-passport-section space-y-8">
      {/* Section Header with Profile Completion Indicator */}
      <div className="passport-no-print bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#0F6B6E] dark:text-[#56C7C4]">
              Candidate workspace · Stored locally in your browser
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
              My Skills Passport
            </h1>
            <p className="text-sm sm:text-base text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
              Edit the prefilled demo profile or build your own skills summary. Changes update
              your opportunity match percentages immediately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleLinkLinkedIn}
              disabled={isLinkingLinkedIn}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#0F6B6E]/35 dark:border-[#56C7C4]/40 bg-[#FAF8F4] dark:bg-[#232826] text-[#0F6B6E] dark:text-[#56C7C4] text-sm font-semibold hover:bg-[#0F6B6E]/10 dark:hover:bg-[#147E82]/25 disabled:opacity-65 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
            >
              {isLinkingLinkedIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Fetching LinkedIn...</span>
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {profile.linkedInImport ? 'Re-sync LinkedIn' : 'Link LinkedIn'}
                  </span>
                </>
              )}
            </button>

            <div className="relative group">
              <button
                type="button"
                onClick={() => window.print()}
                aria-describedby="header-print-pdf-tooltip"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-[#1E2220] dark:text-[#F5F2EC] text-sm font-semibold hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
              >
                <Printer
                  className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4]"
                  aria-hidden="true"
                />
                <span>Print / Save PDF</span>
              </button>
              <div
                id="header-print-pdf-tooltip"
                role="tooltip"
                className="print:hidden pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute bottom-full left-0 md:left-auto md:right-0 mb-2 z-20 w-[min(17.5rem,calc(100vw-3rem))] rounded-xl border border-[#0F6B6E]/35 dark:border-[#56C7C4]/45 bg-[#1E2220] dark:bg-[#232826] text-[#FAF8F4] dark:text-[#F5F2EC] px-3 py-2 text-xs leading-relaxed shadow-lg"
              >
                Opens your browser print dialog to save a clean, PDF-formatted copy of your
                profile without navigation bars or backgrounds.
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F6B6E] dark:bg-[#147E82] text-white text-sm font-semibold hover:bg-[#0B5254] dark:hover:bg-[#199499] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
            >
              <span>See opportunity matches</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {(isLinkingLinkedIn || linkedInStatusMessage || profile.linkedInImport) && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl bg-[#0F6B6E]/8 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 px-4 py-3 text-xs text-[#1E2220] dark:text-[#F5F2EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            {isLinkingLinkedIn ? (
              <div className="flex items-start gap-2">
                <Loader2
                  className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4] animate-spin shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <p className="font-medium text-[#0A4D50] dark:text-[#9CE4E2]">
                    Simulating LinkedIn API import — fetching professional summary and suggested skill tags...
                  </p>
                  <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                    Local prototype mock request in progress; no external account is contacted.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#0A4D50] dark:text-[#9CE4E2]">
                      {linkedInStatusMessage ||
                        `Mock LinkedIn profile linked (${profile.linkedInImport?.handle}) · Synced at ${profile.linkedInImport?.importedAt}. Imported tags: ${profile.linkedInImport?.fetchedSkills.join(', ')}.`}
                    </p>
                    <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                      Simulated API preview only — no external LinkedIn login or live OAuth token is used.
                    </p>
                  </div>
                </div>
                {profile.linkedInImport && (
                  <button
                    type="button"
                    onClick={handleUnlinkLinkedIn}
                    className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    Unlink mock LinkedIn
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Visual Profile Completion Progress Indicator */}
        <div className="pt-5 border-t border-[#E3DDD2] dark:border-[#2F3533] space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                Profile completion
              </span>
              <span className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                ({completion.completedCount} of {completion.totalCount} key sections complete)
              </span>
            </div>
            <span className="font-mono text-xl font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
              {completion.percentage}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#F2EEE7] dark:bg-[#232826] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F6B6E] dark:bg-[#56C7C4] transition-all duration-300"
              style={{ width: `${completion.percentage}%` }}
              role="progressbar"
              aria-valuenow={completion.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="My Skills Passport profile completion percentage"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs pt-0.5">
            {completion.checklist.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 ${
                  item.done
                    ? 'text-[#0F6B6E] dark:text-[#56C7C4] font-medium'
                    : 'text-[#525855] dark:text-[#B4BDB9]'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-full border border-[#CFC8BC] dark:border-[#4A534F] shrink-0"
                  />
                )}
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div
        role="note"
        className="passport-no-print bg-[#F2EEE7] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-4 flex items-start gap-3 text-sm text-[#1E2220] dark:text-[#F5F2EC] transition-colors"
      >
        <ShieldCheck
          className="w-5 h-5 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="space-y-0.5">
          <p className="font-semibold">Privacy &amp; data minimization reminder</p>
          <p className="text-xs sm:text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
            Do not enter refugee case numbers, exact home addresses, sensitive identity
            documents, or legal-status details. A preferred name and county or city are all
            that is needed here.
          </p>
        </div>
      </div>

      {/* Milestones & Progress Badges */}
      <section
        aria-labelledby="milestones-heading"
        className="passport-no-print bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-7 space-y-5 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DDD2] dark:border-[#2F3533]">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#6E1E2E] dark:text-[#E58A9B]">
              Progress milestones · Illustrative demo tracker (not official credentials)
            </p>
            <h2
              id="milestones-heading"
              className="font-display text-xl sm:text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
            >
              Skills Passport milestones
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums whitespace-nowrap">
              {unlockedBadgesCount} of {milestones.length} unlocked
            </span>
            <div className="w-28 sm:w-36 h-2 bg-[#F2EEE7] dark:bg-[#232826] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F6B6E] dark:bg-[#56C7C4] transition-all duration-300"
                style={{ width: `${badgeProgressPct}%` }}
                role="progressbar"
                aria-valuenow={unlockedBadgesCount}
                aria-valuemin={0}
                aria-valuemax={milestones.length}
                aria-label="Unlocked milestone badges"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {milestones.map((badge) => {
            const Icon = getBadgeIcon(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                  badge.unlocked
                    ? 'bg-[#0F6B6E]/8 dark:bg-[#147E82]/20 border-[#0F6B6E]/30 dark:border-[#56C7C4]/35'
                    : 'bg-[#FAF8F4] dark:bg-[#232826] border-[#E3DDD2] dark:border-[#2F3533]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          badge.unlocked
                            ? 'bg-[#0F6B6E] dark:bg-[#147E82] text-white'
                            : 'bg-[#E3DDD2]/70 dark:bg-[#2F3533] text-[#525855] dark:text-[#B4BDB9]'
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          badge.unlocked
                            ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                            : 'text-[#525855] dark:text-[#B4BDB9]'
                        }`}
                      >
                        {badge.unlocked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Unlocked</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Locked</span>
                          </>
                        )}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-medium text-[#525855] dark:text-[#B4BDB9] tabular-nums">
                      {badge.progressText}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {!badge.unlocked && badge.targetTab && badge.actionLabel && (
                  <button
                    type="button"
                    onClick={() => onNavigate(badge.targetTab!)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline self-start cursor-pointer"
                  >
                    <span>{badge.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="skills-passport-grid grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Forms & Assessment */}
        <div className="passport-no-print lg:col-span-7 space-y-8">
          {/* Core Candidate Details Form */}
          <form
            onSubmit={handleSaveProfileSubmit}
            className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
            noValidate
          >
            <div className="border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
              <h2 className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                01. Profile details &amp; demonstrated skills
              </h2>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-1">
                All fields are editable and save automatically to localStorage.
              </p>
            </div>

            {profileWarning && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-[#6E1E2E]/8 dark:bg-[#8A2A3D]/20 border border-[#6E1E2E]/25 dark:border-[#E58A9B]/35 text-xs sm:text-sm text-[#6E1E2E] dark:text-[#F2A7B5]"
              >
                {profileWarning}
              </div>
            )}

            {profileSavedMessage && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs sm:text-sm text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{profileSavedMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="preferred-name"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Preferred name
                </label>
                <input
                  id="preferred-name"
                  type="text"
                  value={profile.preferredName}
                  onChange={(e) => handleFieldChange('preferredName', e.target.value)}
                  placeholder="e.g., Amina Hassan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="candidate-location"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Location (county or city only)
                </label>
                <input
                  id="candidate-location"
                  type="text"
                  list="county-city-list"
                  value={profile.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="e.g., Nairobi, Garissa, Turkana"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
                <datalist id="county-city-list">
                  {LOCATION_SUGGESTIONS.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="role-sought"
                className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Role or fellowship sought
              </label>
              <input
                id="role-sought"
                type="text"
                value={profile.roleSought}
                onChange={(e) => handleFieldChange('roleSought', e.target.value)}
                placeholder="e.g., Junior Web Developer or Community Data Fellow"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="years-experience"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Practical experience
                </label>
                <select
                  id="years-experience"
                  value={profile.yearsExperience}
                  onChange={(e) => handleFieldChange('yearsExperience', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                >
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="availability-select"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Availability
                </label>
                <select
                  id="availability-select"
                  value={profile.availability}
                  onChange={(e) => handleFieldChange('availability', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="professional-summary"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Professional summary
                </label>
                <button
                  type="button"
                  onClick={handleLinkLinkedIn}
                  disabled={isLinkingLinkedIn}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4] hover:underline disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  {isLinkingLinkedIn ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Fetching summary &amp; skills...</span>
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Populate via Link LinkedIn (mock API)</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="professional-summary"
                rows={3}
                value={profile.professionalSummary}
                onChange={(e) =>
                  handleFieldChange('professionalSummary', e.target.value)
                }
                placeholder="Write 2–3 sentences about your hands-on strengths, or click Link LinkedIn to mock-fetch a summary and skill tags."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] leading-relaxed focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
              />
            </div>

            {/* Languages Editor */}
            <div className="space-y-2.5 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
              <label
                htmlFor="language-input"
                className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Languages
              </label>
              <div className="flex gap-2">
                <input
                  id="language-input"
                  type="text"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLanguage();
                    }
                  }}
                  placeholder="Add a language (e.g., Arabic, French)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                >
                  Add language
                </button>
              </div>

              {profile.languages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile.languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      aria-label={`Remove language ${lang}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2EEE7] dark:bg-[#232826] text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#E3DDD2] dark:hover:bg-[#2C3330] transition-colors cursor-pointer"
                    >
                      <span>{lang}</span>
                      <X
                        className="w-3.5 h-3.5 text-[#525855] dark:text-[#B4BDB9]"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skills Editor */}
            <div className="space-y-3 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
              <div>
                <label
                  htmlFor="skill-input"
                  className="block text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Demonstrated skills &amp; proficiency
                </label>
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-0.5">
                  Select a proficiency level when adding skills or adjust existing levels anytime
                  to update opportunity match scores (Beginner 50% · Intermediate 80% · Advanced
                  100%).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="skill-input"
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    if (skillError) setSkillError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill (e.g., JavaScript, Facilitation)"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
                <div className="flex gap-2">
                  <label htmlFor="new-skill-proficiency" className="sr-only">
                    Proficiency level for new skill
                  </label>
                  <select
                    id="new-skill-proficiency"
                    value={skillProficiency}
                    onChange={(e) =>
                      setSkillProficiency(e.target.value as SkillProficiency)
                    }
                    className="px-3 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4] min-h-[42px]"
                  >
                    {PROFICIENCY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add skill</span>
                  </button>
                </div>
              </div>

              {skillError && (
                <p role="alert" className="text-xs text-[#6E1E2E] dark:text-[#F2A7B5]">
                  {skillError}
                </p>
              )}

              {profile.skills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {profile.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 bg-[#0F6B6E]/6 dark:bg-[#147E82]/20"
                    >
                      <span className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC] truncate">
                        {skill.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={skill.proficiency}
                          onChange={(e) =>
                            updateSkillProficiency(
                              skill.name,
                              e.target.value as SkillProficiency
                            )
                          }
                          aria-label={`Proficiency level for ${skill.name}`}
                          className="px-2 py-1 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-[11px] font-medium text-[#0F6B6E] dark:text-[#56C7C4] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4] cursor-pointer"
                        >
                          {PROFICIENCY_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.name)}
                          aria-label={`Remove skill ${skill.name}`}
                          className="p-1 rounded-md text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] hover:bg-white dark:hover:bg-[#1B1F1E] transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                  No skills listed yet. Add skills above to compute opportunity matches.
                </p>
              )}

              {/* Real-Time Skill Library Filter */}
              <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-4 space-y-3.5 mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="skill-library-filter"
                      className="block text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
                    >
                      Browse &amp; filter predefined skills by category
                    </label>
                    <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                      Filter in real time and click any skill to add it at the selected level (
                      <span className="font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                        {skillProficiency}
                      </span>
                      ).
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Search
                    className="w-4 h-4 text-[#525855] dark:text-[#B4BDB9] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="skill-library-filter"
                    type="search"
                    value={skillLibrarySearch}
                    onChange={(e) => setSkillLibrarySearch(e.target.value)}
                    placeholder="Filter predefined skills (e.g., JavaScript, Data, Facilitation)..."
                    className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs sm:text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                  />
                  {skillLibrarySearch && (
                    <button
                      type="button"
                      onClick={() => setSkillLibrarySearch('')}
                      aria-label="Clear skill filter"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div
                  role="group"
                  aria-label="Filter predefined skills by professional category"
                  className="flex flex-wrap gap-1.5"
                >
                  {['All', ...SKILL_CATEGORIES.map((c) => c.category)].map((category) => {
                    const active = selectedSkillCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedSkillCategory(category)}
                        aria-pressed={active}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white'
                            : 'bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                {filteredCategoryGroups.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {filteredCategoryGroups.map((group) => (
                      <div key={group.category} className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-[#525855] dark:text-[#B4BDB9]">
                          {group.category}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.skills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:border-[#0F6B6E] dark:hover:border-[#56C7C4] hover:bg-[#0F6B6E]/6 dark:hover:bg-[#147E82]/20 transition-colors cursor-pointer"
                            >
                              <Plus
                                className="w-3 h-3 text-[#0F6B6E] dark:text-[#56C7C4]"
                                aria-hidden="true"
                              />
                              <span>{skill}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-xs text-[#525855] dark:text-[#B4BDB9] space-y-2">
                    <p>
                      {normalizedSkillQuery
                        ? `No unadded predefined skills match "${skillLibrarySearch.trim()}".`
                        : 'All predefined skills in this category are already on your Skills Passport.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {normalizedSkillQuery &&
                        !profile.skills.some(
                          (s) => s.name.toLowerCase() === normalizedSkillQuery
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              addSkill(skillLibrarySearch);
                              setSkillLibrarySearch('');
                            }}
                            className="inline-flex items-center gap-1 font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add “{skillLibrarySearch.trim()}” as custom skill</span>
                          </button>
                        )}
                      {(skillLibrarySearch || selectedSkillCategory !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSkillLibrarySearch('');
                            setSelectedSkillCategory('All');
                          }}
                          className="font-semibold text-[#0F6B6E] dark:text-[#56C7C4] hover:underline cursor-pointer"
                        >
                          Reset skill filter
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] transition-colors cursor-pointer min-h-[42px]"
              >
                Save profile details
              </button>
            </div>
          </form>

          {/* Project & Work Evidence */}
          <section
            aria-labelledby="projects-heading"
            className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
          >
            <div className="border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
              <h2
                id="projects-heading"
                className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
              >
                02. Portfolio links &amp; practical evidence
              </h2>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-1">
                Document projects, community work, spreadsheets, or workshops even without
                formal employer letters.
              </p>
            </div>

            {profile.projects.length > 0 ? (
              <ul className="divide-y divide-[#E3DDD2] dark:divide-[#2F3533]">
                {profile.projects.map((proj) => (
                  <li key={proj.id} className="py-4 first:pt-0 last:pb-0 flex justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                        {proj.title}
                      </h3>
                      <p className="text-sm text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                        {proj.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#525855] dark:text-[#B4BDB9] pt-1">
                        {proj.url && (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0F6B6E] dark:text-[#56C7C4] font-medium hover:underline break-all"
                          >
                            {proj.url}
                          </a>
                        )}
                        {proj.url && proj.skillsUsed.length > 0 && (
                          <span aria-hidden="true">·</span>
                        )}
                        {proj.skillsUsed.length > 0 && (
                          <span>Skills: {proj.skillsUsed.join(' · ')}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeProject(proj.id)}
                      aria-label={`Remove project ${proj.title}`}
                      className="p-2 h-9 w-9 rounded-lg text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#525855] dark:text-[#B4BDB9]">
                No project evidence added yet. Use the form below to add one practical example.
              </p>
            )}

            <form
              onSubmit={handleAddProject}
              className="pt-4 border-t border-[#E3DDD2] dark:border-[#2F3533] space-y-4"
              noValidate
            >
              <p className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                Add project or work example
              </p>

              {projectError && (
                <p role="alert" className="text-xs text-[#6E1E2E] dark:text-[#F2A7B5]">
                  {projectError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="project-title"
                    className="block text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                  >
                    Project or work title
                  </label>
                  <input
                    id="project-title"
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., Clinic Stock Spreadsheet"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="project-url"
                    className="block text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                  >
                    Portfolio or sample link (optional)
                  </label>
                  <input
                    id="project-url"
                    type="url"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://example.org/work"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="project-summary"
                  className="block text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  What did you build or organize?
                </label>
                <textarea
                  id="project-summary"
                  rows={2}
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  placeholder="Briefly explain the task, tools used, and outcome."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="project-skills"
                  className="block text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Skills demonstrated (comma-separated, optional)
                </label>
                <input
                  id="project-skills"
                  type="text"
                  value={projectSkillsText}
                  onChange={(e) => setProjectSkillsText(e.target.value)}
                  placeholder="e.g., Spreadsheets, Data Quality"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add project evidence</span>
              </button>
            </form>
          </section>

          {/* Short Practical Assessment */}
          <section
            aria-labelledby="assessment-heading"
            className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-8 space-y-6 transition-colors"
          >
            <div className="border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4 space-y-1">
              <p className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B]">
                Practice assessment · Illustrative self-check only (not an accredited or
                verified credential)
              </p>
              <h2
                id="assessment-heading"
                className="font-display text-xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
              >
                03. Short practical self-check
              </h2>
              <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                Choose a role category, answer three scenario questions, and review
                explanations immediately.
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                Role category
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Assessment role category">
                {ASSESSMENT_CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
                        active
                          ? 'bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white'
                          : 'bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330]'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {showAssessmentForm || !profile.assessment || profile.assessment.category !== selectedCategory ? (
              <form onSubmit={handleAssessmentSubmit} className="space-y-6">
                {currentQuestions.map((question, qIndex) => (
                  <fieldset
                    key={question.id}
                    className="space-y-3 pb-5 border-b border-[#E3DDD2] dark:border-[#2F3533] last:border-b-0 last:pb-0"
                  >
                    <legend className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                      {qIndex + 1}. {question.prompt}
                    </legend>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const checked = answers[qIndex] === optIndex;
                        return (
                          <label
                            key={option}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#0F6B6E] dark:border-[#56C7C4] bg-[#0F6B6E]/6 dark:bg-[#147E82]/20 text-[#1E2220] dark:text-[#F5F2EC]'
                                : 'border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              checked={checked}
                              onChange={() => {
                                setAnswers((prev) => ({
                                  ...prev,
                                  [qIndex]: optIndex,
                                }));
                                if (assessmentError) setAssessmentError('');
                              }}
                              className="mt-1 accent-[#0F6B6E] dark:accent-[#56C7C4]"
                            />
                            <span className="leading-relaxed">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}

                {assessmentError && (
                  <p role="alert" className="text-xs text-[#6E1E2E] dark:text-[#F2A7B5] font-medium">
                    {assessmentError}
                  </p>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F6B6E] dark:bg-[#147E82] text-white text-sm font-semibold hover:bg-[#0B5254] dark:hover:bg-[#199499] transition-colors cursor-pointer min-h-[42px]"
                >
                  Submit practice assessment
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                      Practice assessment result · {profile.assessment.category}
                    </p>
                    <p className="font-mono text-2xl font-semibold text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                      {profile.assessment.score} / {profile.assessment.total} correct
                    </p>
                    <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                      Completed {profile.assessment.completedAt} · Self-check practice only,
                      not an official verification.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setShowAssessmentForm(true);
                    }}
                    className="px-4 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs sm:text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                  >
                    Retake practice check
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                    Transparent answer review
                  </p>
                  {currentQuestions.map((question, idx) => {
                    const userChoice = profile.assessment?.selectedAnswers[idx] ?? -1;
                    const isCorrect = userChoice === question.correctIndex;
                    return (
                      <div
                        key={question.id}
                        className="p-4 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]">
                            {idx + 1}. {question.prompt}
                          </p>
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              isCorrect
                                ? 'text-[#0F6B6E] dark:text-[#56C7C4]'
                                : 'text-[#6E1E2E] dark:text-[#E58A9B]'
                            }`}
                          >
                            {isCorrect ? 'Recommended choice' : 'Review note'}
                          </span>
                        </div>
                        <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                          Your answer: {question.options[userChoice] ?? 'Not recorded'}
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC] font-medium">
                            Stronger option: {question.options[question.correctIndex]}
                          </p>
                        )}
                        <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed pt-1 border-t border-[#E3DDD2] dark:border-[#2F3533]">
                          Why: {question.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Shareable Profile Card Preview */}
        <aside className="skills-passport-summary-card lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-6 sm:p-7 space-y-5 transition-colors">
            <div className="hidden skills-passport-print-header">
              <div>
                <p className="font-display text-lg font-semibold">SkillBridge</p>
                <p className="text-xs">Skills Passport Profile Summary (Demo)</p>
              </div>
              <p className="text-xs">
                Printed{' '}
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-start justify-between gap-4 border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
              <div>
                <p className="passport-no-print text-xs font-medium text-[#6E1E2E] dark:text-[#E58A9B]">
                  Shareable demo summary card
                </p>
                <h2 className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC] mt-1">
                  {profile.preferredName || 'Candidate Name'}
                </h2>
                <p className="text-sm text-[#525855] dark:text-[#B4BDB9] mt-0.5">
                  {profile.location || 'City / County'} · {profile.yearsExperience}
                </p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Role sought
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] font-medium mt-0.5">
                  {profile.roleSought || 'Not specified'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Professional summary
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5 leading-relaxed text-xs">
                  {profile.professionalSummary.trim()
                    ? profile.professionalSummary
                    : 'Not added yet — write one or click Link LinkedIn'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Availability
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5">
                  {profile.availability}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Languages
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5">
                  {profile.languages.length > 0
                    ? profile.languages.join(' · ')
                    : 'None listed'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Demonstrated skills ({profile.skills.length})
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5 leading-relaxed">
                  {profile.skills.length > 0
                    ? profile.skills
                        .map((s) => `${s.name} (${s.proficiency})`)
                        .join(' · ')
                    : 'Add skills on the left to populate your card'}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Work &amp; project evidence ({profile.projects.length})
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5 space-y-1.5">
                  {profile.projects.length > 0 ? (
                    profile.projects.map((p) => (
                      <div key={p.id} className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                        <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                          {p.title}:
                        </span>{' '}
                        {p.summary}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                      None added yet
                    </span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                  Practice assessment (self-check)
                </dt>
                <dd className="text-[#1E2220] dark:text-[#F5F2EC] mt-0.5 font-mono text-xs tabular-nums">
                  {profile.assessment
                    ? `${profile.assessment.category} — ${profile.assessment.score}/${profile.assessment.total} (Practice only)`
                    : 'Not yet completed'}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-[#E3DDD2] dark:border-[#2F3533] space-y-3">
              <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                Prototype note: Self-reported skills and practice check scores are illustrative
                only, not verified credentials or legal work-authorization proof.
              </p>

              <div className="passport-no-print grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] transition-colors whitespace-nowrap cursor-pointer min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>Share Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-[#1E2220] dark:text-[#F5F2EC] text-sm font-semibold hover:bg-[#F2EEE7] dark:hover:bg-[#2C3330] transition-colors whitespace-nowrap cursor-pointer min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check
                        className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4]"
                        aria-hidden="true"
                      />
                      <span>Copied summary</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy summary</span>
                    </>
                  )}
                </button>

                <div className="sm:col-span-2 relative group">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    aria-describedby="summary-print-pdf-tooltip"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] text-sm font-semibold hover:bg-[#F2EEE7] dark:hover:bg-[#232826] transition-colors whitespace-nowrap cursor-pointer min-h-[44px]"
                  >
                    <Printer
                      className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4]"
                      aria-hidden="true"
                    />
                    <span>Print / Save PDF summary</span>
                  </button>
                  <div
                    id="summary-print-pdf-tooltip"
                    role="tooltip"
                    className="print:hidden pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-[min(17.5rem,calc(100vw-3rem))] rounded-xl border border-[#0F6B6E]/35 dark:border-[#56C7C4]/45 bg-[#1E2220] dark:bg-[#232826] text-[#FAF8F4] dark:text-[#F5F2EC] px-3 py-2 text-xs leading-relaxed shadow-lg text-center"
                  >
                    Generates a clean, PDF-formatted version of your profile with navigation and
                    background colors hidden.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Share Profile Simulation Modal */}
      {shareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-profile-title"
          className="passport-no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2220]/50 dark:bg-black/70 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShareModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-[#1B1F1E] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-[#E3DDD2] dark:border-[#2F3533] pb-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                  Simulated profile sharing · Local prototype only
                </p>
                <h2
                  id="share-profile-title"
                  className="font-display text-2xl font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  Share Skills Passport
                </h2>
                <p className="text-xs sm:text-sm text-[#525855] dark:text-[#B4BDB9]">
                  Generate a mock demo URL or copy your formatted summary to share with
                  potential mentors or fellowship coordinators.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close share profile dialog"
                className="p-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Audience Selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#525855] dark:text-[#B4BDB9]">
                Simulate view for audience
              </p>
              <div
                role="group"
                aria-label="Share audience view"
                className="inline-flex items-center gap-1 p-1 bg-[#F2EEE7] dark:bg-[#232826] rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => setShareAudience('mentor')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    shareAudience === 'mentor'
                      ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                      : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                  }`}
                >
                  Potential Mentors
                </button>
                <button
                  type="button"
                  onClick={() => setShareAudience('fellowship')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    shareAudience === 'fellowship'
                      ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                      : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
                  }`}
                >
                  Fellowship Coordinators
                </button>
              </div>
            </div>

            {/* Mock Shareable URL */}
            <div className="space-y-2">
              <label
                htmlFor="mock-share-url"
                className="block text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Simulated demo share link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] min-w-0">
                  <Link2
                    className="w-4 h-4 text-[#525855] dark:text-[#B4BDB9] shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="mock-share-url"
                    type="text"
                    readOnly
                    value={mockShareUrl}
                    aria-label="Simulated SkillBridge passport URL"
                    className="w-full bg-transparent font-mono text-xs text-[#1E2220] dark:text-[#F5F2EC] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F6B6E] dark:bg-[#147E82] text-white text-xs sm:text-sm font-semibold hover:bg-[#0B5254] dark:hover:bg-[#199499] whitespace-nowrap shrink-0 cursor-pointer min-h-[42px]"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Link copied</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                Demo simulation only: this mock link stays in your browser and does not publish
                a live webpage.
              </p>
            </div>

            {/* Simulated Recipient Preview */}
            <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#E3DDD2] dark:border-[#2F3533] pb-2.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                  <Eye
                    className="w-3.5 h-3.5 text-[#0F6B6E] dark:text-[#56C7C4]"
                    aria-hidden="true"
                  />
                  <span>
                    {shareAudience === 'mentor'
                      ? 'Mentor preview'
                      : 'Fellowship coordinator preview'}
                  </span>
                </span>
                <span className="font-mono text-xs text-[#0F6B6E] dark:text-[#56C7C4] tabular-nums">
                  {completion.percentage}% complete
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-display text-lg font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                  {profile.preferredName || 'Candidate'}
                </p>
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                  {profile.location || 'Location not set'} · {profile.yearsExperience} ·{' '}
                  {profile.availability}
                </p>
                <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC] pt-1">
                  <span className="font-semibold">Seeking:</span>{' '}
                  {profile.roleSought || 'Not specified'}
                </p>
                {profile.professionalSummary.trim() && (
                  <p className="text-xs text-[#525855] dark:text-[#B4BDB9] leading-relaxed">
                    <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                      Summary:
                    </span>{' '}
                    {profile.professionalSummary}
                  </p>
                )}
                <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC]">
                  <span className="font-semibold">Skills:</span>{' '}
                  {profile.skills.length > 0
                    ? profile.skills
                        .map((s) => `${s.name} (${s.proficiency})`)
                        .join(' · ')
                    : 'None listed'}
                </p>
                <p className="text-xs text-[#1E2220] dark:text-[#F5F2EC]">
                  <span className="font-semibold">Languages:</span>{' '}
                  {profile.languages.length > 0
                    ? profile.languages.join(' · ')
                    : 'None listed'}
                </p>
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                  <span className="font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                    Practice self-check:
                  </span>{' '}
                  {profile.assessment
                    ? `${profile.assessment.category} (${profile.assessment.score}/${profile.assessment.total} illustrative score)`
                    : 'Not yet completed'}
                </p>
              </div>

              <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9] pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
                Shared with minimal details only—no IDs, case numbers, or exact addresses.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E3DDD2] dark:border-[#2F3533]">
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs sm:text-sm font-semibold text-[#1E2220] dark:text-[#F5F2EC] hover:bg-[#F2EEE7] dark:hover:bg-[#232826] cursor-pointer min-h-[42px]"
              >
                {copied ? (
                  <>
                    <Check
                      className="w-4 h-4 text-[#0F6B6E] dark:text-[#56C7C4]"
                      aria-hidden="true"
                    />
                    <span>Text summary copied</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="w-4 h-4" aria-hidden="true" />
                    <span>Copy full text summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-xs sm:text-sm font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] cursor-pointer min-h-[42px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

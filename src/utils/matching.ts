import {
  ApplicationRecord,
  CandidateProfile,
  MentorshipRequest,
  NavTab,
  Opportunity,
  SkillEntry,
  SkillProficiency,
} from '../types';

export const PROFICIENCY_LEVELS: SkillProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const PROFICIENCY_WEIGHTS: Record<SkillProficiency, number> = {
  Beginner: 0.5,
  Intermediate: 0.8,
  Advanced: 1.0,
};

export interface MilestoneBadge {
  id:
    | 'first-skill'
    | 'skill-builder'
    | 'evidence-shared'
    | 'assessment-completed'
    | 'first-application'
    | 'mentorship-connected';
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
  actionLabel?: string;
  targetTab?: NavTab;
}

export interface MatchedSkillDetail {
  name: string;
  proficiency: SkillProficiency;
  weight: number;
}

export interface OpportunityMatch {
  percentage: number;
  matchedRequired: MatchedSkillDetail[];
  missingRequired: string[];
  matchedNiceToHave: MatchedSkillDetail[];
  explanation: string;
}

export function normalizeSkill(skill: string): string {
  const cleaned = skill.trim().toLowerCase();
  if (cleaned === 'js') return 'javascript';
  if (cleaned === 'excel' || cleaned === 'google sheets') return 'spreadsheets';
  return cleaned;
}

export function getMatchedSkill(
  candidateSkills: SkillEntry[],
  targetSkill: string
): SkillEntry | undefined {
  const normalizedTarget = normalizeSkill(targetSkill);
  let best: SkillEntry | undefined;
  for (const entry of candidateSkills) {
    if (normalizeSkill(entry.name) === normalizedTarget) {
      if (
        !best ||
        PROFICIENCY_WEIGHTS[entry.proficiency] > PROFICIENCY_WEIGHTS[best.proficiency]
      ) {
        best = entry;
      }
    }
  }
  return best;
}

export function isSkillMatched(
  candidateSkills: SkillEntry[],
  targetSkill: string
): boolean {
  return Boolean(getMatchedSkill(candidateSkills, targetSkill));
}

export function computeOpportunityMatch(
  candidateSkills: SkillEntry[],
  opportunity: Opportunity
): OpportunityMatch {
  const matchedRequired: MatchedSkillDetail[] = [];
  const missingRequired: string[] = [];

  let weightedRequiredSum = 0;

  for (const req of opportunity.requiredSkills) {
    const match = getMatchedSkill(candidateSkills, req);
    if (match) {
      const weight = PROFICIENCY_WEIGHTS[match.proficiency];
      weightedRequiredSum += weight;
      matchedRequired.push({
        name: req,
        proficiency: match.proficiency,
        weight,
      });
    } else {
      missingRequired.push(req);
    }
  }

  const matchedNiceToHave: MatchedSkillDetail[] = [];
  let weightedBonusSum = 0;
  for (const extra of opportunity.niceToHaveSkills) {
    const match = getMatchedSkill(candidateSkills, extra);
    if (match) {
      const weight = PROFICIENCY_WEIGHTS[match.proficiency];
      weightedBonusSum += weight * 0.05;
      matchedNiceToHave.push({
        name: extra,
        proficiency: match.proficiency,
        weight,
      });
    }
  }

  const totalReq = opportunity.requiredSkills.length;
  const baseScore = totalReq === 0 ? 0 : (weightedRequiredSum / totalReq) * 100;
  // Helpful extra skills give a modest up to +10% proficiency-scaled boost, capped at 100%
  const percentage =
    totalReq === 0
      ? 0
      : Math.min(100, Math.round(baseScore + weightedBonusSum * 100));

  const explanation =
    totalReq === 0
      ? 'No required skills listed'
      : `${matchedRequired.length} of ${totalReq} required skills matched · Weighted by proficiency${
          matchedNiceToHave.length > 0
            ? ` (+${matchedNiceToHave.length} helpful bonus)`
            : ''
        }`;

  return {
    percentage,
    matchedRequired,
    missingRequired,
    matchedNiceToHave,
    explanation,
  };
}

export interface ProfileCompletion {
  percentage: number;
  completedCount: number;
  totalCount: number;
  checklist: Array<{ label: string; done: boolean }>;
  nextStep: {
    title: string;
    description: string;
    actionLabel: string;
    targetTab: NavTab;
  };
}

export function computeProfileCompletion(
  profile: CandidateProfile
): ProfileCompletion {
  const checks = [
    {
      label: 'Name',
      done: profile.preferredName.trim().length > 0,
      title: 'Add your preferred name',
      description: 'Share the name mentors and fellowship coordinators should use.',
      actionLabel: 'Edit profile details',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Location',
      done: profile.location.trim().length > 0,
      title: 'Set your city or county',
      description: 'Use a city or county only so nearby hubs appear first.',
      actionLabel: 'Add location',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Role',
      done: profile.roleSought.trim().length > 0,
      title: 'Describe the role you seek',
      description: 'Specify the fellowship or mentorship track you want to pursue.',
      actionLabel: 'Set target role',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Summary',
      done: profile.professionalSummary.trim().length > 0,
      title: 'Add a short professional summary',
      description: 'Write a 2-sentence overview or link LinkedIn to populate one.',
      actionLabel: 'Add summary',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Experience',
      done: profile.yearsExperience.trim().length > 0,
      title: 'Select practical experience',
      description: 'Indicate your years of hands-on experience in your field.',
      actionLabel: 'Set experience',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Skills',
      done: profile.skills.length >= 3,
      title: 'List at least 3 demonstrated skills',
      description: 'Skills power transparent match scores across sample opportunities.',
      actionLabel: 'Add skills',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Languages',
      done: profile.languages.length >= 1,
      title: 'Add your working languages',
      description: 'Help mentors connect with you in your strongest languages.',
      actionLabel: 'Add languages',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Projects',
      done: profile.projects.length >= 1,
      title: 'Add project or work evidence',
      description: 'Describe one practical piece of work or link to show skills in action.',
      actionLabel: 'Add project evidence',
      targetTab: 'passport' as NavTab,
    },
    {
      label: 'Assessment',
      done: profile.assessment !== null,
      title: 'Complete a 3-question practice assessment',
      description: 'Try a short self-check to preview your Skills Passport readiness.',
      actionLabel: 'Start practice assessment',
      targetTab: 'passport' as NavTab,
    },
  ];

  const completedCount = checks.filter((c) => c.done).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const firstMissing = checks.find((c) => !c.done);

  const nextStep = firstMissing
    ? {
        title: firstMissing.title,
        description: firstMissing.description,
        actionLabel: firstMissing.actionLabel,
        targetTab: firstMissing.targetTab,
      }
    : {
        title: 'Explore matched sample fellowships',
        description:
          'Your demo Skills Passport is complete. Review opportunities or request a mentor introduction.',
        actionLabel: 'Browse opportunities',
        targetTab: 'opportunities' as NavTab,
      };

  return {
    percentage,
    completedCount,
    totalCount,
    checklist: checks.map(({ label, done }) => ({ label, done })),
    nextStep,
  };
}

export function formatProfileSummaryText(profile: CandidateProfile): string {
  const lines = [
    'SKILLBRIDGE DEMO SKILLS PASSPORT',
    `Candidate: ${profile.preferredName || 'Not specified'}`,
    `Location (City/County): ${profile.location || 'Not specified'}`,
    `Role Sought: ${profile.roleSought || 'Not specified'}`,
    `Experience: ${profile.yearsExperience || 'Not specified'}`,
    `Availability: ${profile.availability || 'Not specified'}`,
    ...(profile.professionalSummary.trim()
      ? [`Professional Summary: ${profile.professionalSummary.trim()}`]
      : []),
    `Languages: ${profile.languages.length > 0 ? profile.languages.join(', ') : 'None listed'}`,
    `Demonstrated Skills: ${
      profile.skills.length > 0
        ? profile.skills.map((s) => `${s.name} (${s.proficiency})`).join(', ')
        : 'None listed'
    }`,
  ];

  if (profile.projects.length > 0) {
    lines.push('', 'Project & Work Evidence:');
    profile.projects.forEach((p, idx) => {
      lines.push(`${idx + 1}. ${p.title}${p.url ? ` (${p.url})` : ''} — ${p.summary}`);
    });
  }

  if (profile.assessment) {
    lines.push(
      '',
      `Practice Assessment (Self-Check Only): ${profile.assessment.category} — ${profile.assessment.score}/${profile.assessment.total}`
    );
  }

  lines.push(
    '',
    'Disclaimer: SkillBridge is a prototype. Match scores and practice assessments are illustrative only, not official credential verification, legal advice, or a promise of employment.'
  );

  return lines.join('\n');
}

export function containsSensitivePattern(text: string): string | null {
  const lower = text.toLowerCase();
  const patterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /\b(case\s*(no|number|#)|unhcr\s*id|alien\s*id)\b/i, label: 'case or registration number' },
    { regex: /\b(passport\s*(no|number|#)|national\s*id)\b/i, label: 'identity document number' },
    { regex: /\b(street|plot\s*no|house\s*no|apartment|apt\s*#)\b/i, label: 'exact street or home address' },
  ];

  for (const item of patterns) {
    if (item.regex.test(lower)) {
      return item.label;
    }
  }
  return null;
}

export function computeMilestoneBadges(
  profile: CandidateProfile,
  applications: Record<string, ApplicationRecord>,
  mentorshipRequests: MentorshipRequest[]
): MilestoneBadge[] {
  const skillCount = profile.skills.length;
  const projectCount = profile.projects.length;
  const assessmentDone = profile.assessment !== null;
  const applicationCount = Object.keys(applications).length;
  const mentorshipCount = mentorshipRequests.length;

  return [
    {
      id: 'first-skill',
      title: 'First skill added',
      description: 'Add at least 1 demonstrated skill to your Skills Passport.',
      unlocked: skillCount >= 1,
      progressText: `${Math.min(skillCount, 1)} / 1`,
    },
    {
      id: 'skill-builder',
      title: 'Five skills cataloged',
      description: 'List 5 or more skills to unlock broader fellowship matches.',
      unlocked: skillCount >= 5,
      progressText: `${Math.min(skillCount, 5)} / 5`,
    },
    {
      id: 'evidence-shared',
      title: 'Work evidence shared',
      description: 'Document at least 1 project or practical work example.',
      unlocked: projectCount >= 1,
      progressText: `${Math.min(projectCount, 1)} / 1`,
    },
    {
      id: 'assessment-completed',
      title: 'Assessment completed',
      description: 'Finish a 3-question practice self-check in any role track.',
      unlocked: assessmentDone,
      progressText: assessmentDone ? '1 / 1' : '0 / 1',
    },
    {
      id: 'first-application',
      title: 'First application submitted',
      description: 'Express demo interest in at least 1 sample fellowship.',
      unlocked: applicationCount >= 1,
      progressText: `${Math.min(applicationCount, 1)} / 1`,
      actionLabel: 'Browse opportunities',
      targetTab: 'opportunities',
    },
    {
      id: 'mentorship-connected',
      title: 'Mentorship requested',
      description: 'Submit a demo mentorship match request.',
      unlocked: mentorshipCount >= 1,
      progressText: `${Math.min(mentorshipCount, 1)} / 1`,
      actionLabel: 'Find a mentor',
      targetTab: 'mentorship',
    },
  ];
}

export interface MockLinkedInResponse {
  handle: string;
  professionalSummary: string;
  skillTags: SkillEntry[];
}

export async function mockFetchLinkedInProfile(
  profile: CandidateProfile
): Promise<MockLinkedInResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 850));

  const nameSlug =
    profile.preferredName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'candidate';

  const roleLower = profile.roleSought.toLowerCase();

  if (roleLower.includes('facilitat') || roleLower.includes('mentor') || roleLower.includes('educat')) {
    return {
      handle: `linkedin.com/in/${nameSlug}-demo`,
      professionalSummary:
        'Community digital educator and workshop facilitator experienced in guiding adult learners through practical spreadsheet, online safety, and mobile web skills in multilingual cohorts.',
      skillTags: [
        { name: 'Facilitation', proficiency: 'Advanced' },
        { name: 'Curriculum Planning', proficiency: 'Intermediate' },
        { name: 'Digital Literacy', proficiency: 'Advanced' },
        { name: 'Community Outreach', proficiency: 'Intermediate' },
        { name: 'Communication', proficiency: 'Advanced' },
      ],
    };
  }

  if (roleLower.includes('logistic') || roleLower.includes('operation')) {
    return {
      handle: `linkedin.com/in/${nameSlug}-demo`,
      professionalSummary:
        'Operations and records coordinator with hands-on experience tracking community supply inventories, validating dispatch spreadsheets, and writing clear weekly status updates.',
      skillTags: [
        { name: 'Inventory Tracking', proficiency: 'Intermediate' },
        { name: 'Spreadsheets', proficiency: 'Advanced' },
        { name: 'Data Quality', proficiency: 'Intermediate' },
        { name: 'Reporting', proficiency: 'Intermediate' },
        { name: 'Team Coordination', proficiency: 'Advanced' },
      ],
    };
  }

  return {
    handle: `linkedin.com/in/${nameSlug}-demo`,
    professionalSummary:
      'Hands-on front-end builder and community data practitioner experienced in mobile-friendly HTML/CSS interfaces, spreadsheet quality checks, and facilitating beginner digital literacy sessions.',
    skillTags: [
      { name: 'JavaScript', proficiency: 'Intermediate' },
      { name: 'Git', proficiency: 'Intermediate' },
      { name: 'Responsive Design', proficiency: 'Advanced' },
      { name: 'Data Quality', proficiency: 'Intermediate' },
      { name: 'Reporting', proficiency: 'Beginner' },
      { name: 'Team Coordination', proficiency: 'Intermediate' },
    ],
  };
}


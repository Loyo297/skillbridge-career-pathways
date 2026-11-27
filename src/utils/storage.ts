import { INITIAL_STATE } from '../data/seedData';
import { SkillBridgeState, SkillEntry, SkillProficiency } from '../types';

const STORAGE_KEY = 'skillbridge_prototype_state_v1';
const VALID_PROFICIENCIES: SkillProficiency[] = ['Beginner', 'Intermediate', 'Advanced'];

function normalizeLoadedSkills(raw: unknown): SkillEntry[] {
  if (!Array.isArray(raw)) {
    return INITIAL_STATE.profile.skills;
  }
  const normalized: SkillEntry[] = [];
  for (const item of raw) {
    if (typeof item === 'string' && item.trim()) {
      normalized.push({ name: item.trim(), proficiency: 'Intermediate' });
    } else if (
      item &&
      typeof item === 'object' &&
      'name' in item &&
      typeof (item as { name: unknown }).name === 'string'
    ) {
      const name = (item as { name: string }).name.trim();
      if (!name) continue;
      const rawLevel = (item as { proficiency?: unknown }).proficiency;
      const proficiency: SkillProficiency = VALID_PROFICIENCIES.includes(
        rawLevel as SkillProficiency
      )
        ? (rawLevel as SkillProficiency)
        : 'Intermediate';
      normalized.push({ name, proficiency });
    }
  }
  return normalized;
}

function cloneInitialState(): SkillBridgeState {
  return JSON.parse(JSON.stringify(INITIAL_STATE)) as SkillBridgeState;
}

export function loadState(): SkillBridgeState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = cloneInitialState();
      saveState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<SkillBridgeState>;
    if (!parsed || !parsed.profile) {
      const seeded = cloneInitialState();
      saveState(seeded);
      return seeded;
    }
    return {
      profile: {
        ...INITIAL_STATE.profile,
        ...parsed.profile,
        professionalSummary:
          typeof parsed.profile.professionalSummary === 'string'
            ? parsed.profile.professionalSummary
            : INITIAL_STATE.profile.professionalSummary,
        skills: normalizeLoadedSkills(parsed.profile.skills),
        languages: Array.isArray(parsed.profile.languages)
          ? parsed.profile.languages
          : INITIAL_STATE.profile.languages,
        projects: Array.isArray(parsed.profile.projects)
          ? parsed.profile.projects
          : INITIAL_STATE.profile.projects,
        assessment: parsed.profile.assessment ?? null,
        linkedInImport: parsed.profile.linkedInImport ?? null,
      },
      savedOpportunityIds: Array.isArray(parsed.savedOpportunityIds)
        ? parsed.savedOpportunityIds
        : [],
      savedMentorIds: Array.isArray(parsed.savedMentorIds)
        ? parsed.savedMentorIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : [],
      applications:
        parsed.applications && typeof parsed.applications === 'object'
          ? parsed.applications
          : {},
      mentorshipRequests: Array.isArray(parsed.mentorshipRequests)
        ? parsed.mentorshipRequests
        : [],
      activityLog: Array.isArray(parsed.activityLog)
        ? parsed.activityLog
        : INITIAL_STATE.activityLog,
      assistantTasks: Array.isArray(parsed.assistantTasks)
        ? parsed.assistantTasks.filter(
            (t) =>
              t &&
              typeof t === 'object' &&
              typeof t.id === 'string' &&
              typeof t.title === 'string'
          )
        : INITIAL_STATE.assistantTasks,
      assistantMessages: Array.isArray(parsed.assistantMessages)
        ? parsed.assistantMessages.filter(
            (m) =>
              m &&
              typeof m === 'object' &&
              typeof m.id === 'string' &&
              typeof m.text === 'string' &&
              (m.role === 'user' || m.role === 'assistant')
          )
        : [],
    };
  } catch {
    return cloneInitialState();
  }
}

export function saveState(state: SkillBridgeState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted preview modes
  }
}

export function resetState(): SkillBridgeState {
  const fresh = cloneInitialState();
  saveState(fresh);
  return fresh;
}

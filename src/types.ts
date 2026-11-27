export type NavTab = 'overview' | 'passport' | 'opportunities' | 'mentorship';

export type AssessmentCategory =
  | 'Web Development'
  | 'Data & Operations'
  | 'Digital Facilitation & Training';

export interface ProjectEvidence {
  id: string;
  title: string;
  url: string;
  summary: string;
  skillsUsed: string[];
}

export interface AssessmentResult {
  category: AssessmentCategory;
  score: number;
  total: number;
  completedAt: string;
  selectedAnswers: number[];
}

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SkillEntry {
  name: string;
  proficiency: SkillProficiency;
}

export interface LinkedInImportInfo {
  handle: string;
  importedAt: string;
  fetchedSkills: string[];
}

export interface CandidateProfile {
  preferredName: string;
  location: string;
  roleSought: string;
  yearsExperience: string;
  professionalSummary: string;
  skills: SkillEntry[];
  languages: string[];
  availability: string;
  projects: ProjectEvidence[];
  assessment: AssessmentResult | null;
  linkedInImport: LinkedInImportInfo | null;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  roleCategory: string;
  format: string;
  duration: string;
  stipendNote: string;
  summary: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  responsibilities: string[];
  demoNote: string;
}

export interface ApplicationRecord {
  opportunityId: string;
  status: 'Demo interest recorded';
  submittedAt: string;
  note: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  organization: string;
  location: string;
  expertise: string[];
  languages: string[];
  availability: string;
  format: string;
  bio: string;
}

export interface MentorshipRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  focusArea: string;
  meetingFormat: string;
  message: string;
  status: 'Demo request submitted';
  submittedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type ActivityType =
  | 'Saved Opportunity'
  | 'Removed Saved Opportunity'
  | 'Saved Mentor'
  | 'Removed Saved Mentor'
  | 'Interest Recorded'
  | 'Withdrew Interest'
  | 'Submitted Assessment'
  | 'Request Sent'
  | 'Added Project Evidence'
  | 'Updated Profile';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  detail: string;
  timestamp: string;
  targetTab: NavTab;
}

export type TaskCategory = 'Passport' | 'Opportunities' | 'Mentorship' | 'General';

export interface AssistantTask {
  id: string;
  title: string;
  category: TaskCategory;
  completed: boolean;
  source: 'user' | 'ai';
  createdAt: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: string;
}

export interface SkillBridgeState {
  profile: CandidateProfile;
  savedOpportunityIds: string[];
  savedMentorIds: string[];
  applications: Record<string, ApplicationRecord>;
  mentorshipRequests: MentorshipRequest[];
  activityLog: ActivityEntry[];
  assistantTasks: AssistantTask[];
  assistantMessages: AssistantChatMessage[];
}

import {
  Bot,
  Check,
  CheckSquare,
  ListPlus,
  Loader2,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  AssistantChatMessage,
  AssistantTask,
  CandidateProfile,
  NavTab,
  TaskCategory,
} from '../types';
import { containsSensitivePattern } from '../utils/matching';

interface TaskAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CandidateProfile;
  savedOpportunitiesCount: number;
  mentorshipRequestsCount: number;
  activeTab: NavTab;
  tasks: AssistantTask[];
  messages: AssistantChatMessage[];
  onAddTasks: (
    items: Array<{ title: string; category: TaskCategory; source: 'user' | 'ai' }>
  ) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearCompletedTasks: () => void;
  onAppendMessages: (newMessages: AssistantChatMessage[]) => void;
  onClearMessages: () => void;
  onNavigateTab: (tab: NavTab) => void;
}

const STARTER_PROMPTS = [
  'Build a 3-step action plan to strengthen my Skills Passport this week.',
  'How should I prioritize skills to match more local fellowships?',
  'Help me prepare focused questions for a 20-minute mentorship session.',
];

const TASK_CATEGORIES: TaskCategory[] = [
  'Passport',
  'Opportunities',
  'Mentorship',
  'General',
];

function categoryToTab(category: TaskCategory): NavTab | null {
  switch (category) {
    case 'Passport':
      return 'passport';
    case 'Opportunities':
      return 'opportunities';
    case 'Mentorship':
      return 'mentorship';
    case 'General':
    default:
      return null;
  }
}

export function TaskAssistantDrawer({
  isOpen,
  onClose,
  profile,
  savedOpportunitiesCount,
  mentorshipRequestsCount,
  activeTab,
  tasks,
  messages,
  onAddTasks,
  onToggleTask,
  onDeleteTask,
  onClearCompletedTasks,
  onAppendMessages,
  onClearMessages,
  onNavigateTab,
}: TaskAssistantDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<'chat' | 'tasks'>('chat');
  const [selectedModel, setSelectedModel] = useState<
    'gemini-4-hydrogen' | 'gemini-3.1-flash-lite'
  >('gemini-4-hydrogen');
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [convertingMessageId, setConvertingMessageId] = useState<string | null>(
    null
  );
  const [taskToast, setTaskToast] = useState('');

  // Tasks tab state
  const [goalInput, setGoalInput] = useState('');
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [manualTaskTitle, setManualTaskTitle] = useState('');
  const [manualTaskCategory, setManualTaskCategory] =
    useState<TaskCategory>('General');

  const threadEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const completedTasksCount = tasks.length - pendingTasksCount;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && drawerTab === 'chat') {
      window.setTimeout(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [isOpen, drawerTab, messages.length, isSending]);

  useEffect(() => {
    if (isOpen && drawerTab === 'chat') {
      window.setTimeout(() => {
        chatInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, drawerTab]);

  if (!isOpen) return null;

  const buildContextPayload = () => ({
    preferredName: profile.preferredName,
    roleSought: profile.roleSought,
    location: profile.location,
    yearsExperience: profile.yearsExperience,
    skills: profile.skills,
    languages: profile.languages,
    savedOpportunitiesCount,
    mentorshipRequestsCount,
    activeTab,
    tasks: tasks.map((t) => ({
      title: t.title,
      category: t.category,
      completed: t.completed,
    })),
  });

  const formatTime = () =>
    new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    const sensitive = containsSensitivePattern(trimmed);
    if (sensitive) {
      setChatError(
        `Privacy check: Please remove any ${sensitive} before sending. Share only skills, goals, and general availability.`
      );
      return;
    }

    const userMsg: AssistantChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: trimmed,
      timestamp: formatTime(),
    };

    const nextThread = [...messages, userMsg];
    onAppendMessages([userMsg]);
    setChatInput('');
    setChatError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextThread.map((m) => ({ role: m.role, text: m.text })),
          context: buildContextPayload(),
          model: selectedModel,
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        model?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || 'Unable to reach the Task AI Assistant right now.'
        );
      }

      const assistantMsg: AssistantChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        text: data.reply,
        timestamp: formatTime(),
        model: data.model ?? selectedModel,
      };
      onAppendMessages([assistantMsg]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : 'Unable to reach the Task AI Assistant right now.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(chatInput);
  };

  const requestSuggestedTasks = async (goalText: string) => {
    const sensitive = containsSensitivePattern(goalText);
    if (sensitive) {
      const msg = `Privacy check: Please remove any ${sensitive} from your goal before generating tasks.`;
      setTaskError(msg);
      setChatError(msg);
      return [];
    }

    const response = await fetch('/api/assistant/suggest-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: goalText,
        context: buildContextPayload(),
      }),
    });

    const data = (await response.json()) as {
      tasks?: Array<{ title: string; category: string }>;
      error?: string;
    };

    if (!response.ok || !Array.isArray(data.tasks)) {
      throw new Error(
        data.error || 'Could not generate suggested tasks right now.'
      );
    }

    return data.tasks.map((item) => {
      const category: TaskCategory = TASK_CATEGORIES.includes(
        item.category as TaskCategory
      )
        ? (item.category as TaskCategory)
        : 'General';
      return {
        title: item.title,
        category,
        source: 'ai' as const,
      };
    });
  };

  const handleTurnReplyIntoTasks = async (msg: AssistantChatMessage) => {
    if (convertingMessageId) return;
    setConvertingMessageId(msg.id);
    setChatError('');
    setTaskToast('');
    try {
      const excerpt = msg.text.slice(0, 600);
      const generated = await requestSuggestedTasks(
        `Turn these assistant recommendations into concrete checklist tasks: ${excerpt}`
      );
      if (generated.length > 0) {
        onAddTasks(generated);
        setTaskToast(
          `Added ${generated.length} task${generated.length === 1 ? '' : 's'} to Action Tasks.`
        );
        window.setTimeout(() => setTaskToast(''), 4500);
      }
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : 'Could not extract tasks from this reply.'
      );
    } finally {
      setConvertingMessageId(null);
    }
  };

  const handleGenerateTasksFromGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (isGeneratingTasks) return;
    setIsGeneratingTasks(true);
    setTaskError('');
    setTaskToast('');
    try {
      const goal =
        goalInput.trim() ||
        `Prepare for ${profile.roleSought || 'local fellowships'} and strengthen my Skills Passport`;
      const generated = await requestSuggestedTasks(goal);
      if (generated.length > 0) {
        onAddTasks(generated);
        setGoalInput('');
        setTaskToast(
          `Added ${generated.length} AI-suggested task${generated.length === 1 ? '' : 's'}.`
        );
        window.setTimeout(() => setTaskToast(''), 4500);
      }
    } catch (error) {
      setTaskError(
        error instanceof Error
          ? error.message
          : 'Unable to generate tasks right now.'
      );
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleAddManualTask = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualTaskTitle.trim();
    if (!trimmed) return;
    const sensitive = containsSensitivePattern(trimmed);
    if (sensitive) {
      setTaskError(
        `Privacy check: Please remove any ${sensitive} from your task title.`
      );
      return;
    }
    setTaskError('');
    onAddTasks([
      {
        title: trimmed,
        category: manualTaskCategory,
        source: 'user',
      },
    ]);
    setManualTaskTitle('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-assistant-title"
      className="print:hidden fixed inset-0 z-50 flex justify-end bg-[#1E2220]/45 dark:bg-black/65 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:w-[450px] max-w-full h-full bg-white dark:bg-[#1B1F1E] border-l border-[#E3DDD2] dark:border-[#2F3533] shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E3DDD2] dark:border-[#2F3533] space-y-3.5 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#56C7C4]/15 text-[#0F6B6E] dark:text-[#56C7C4] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="task-assistant-title"
                  className="font-display text-lg font-semibold text-[#1E2220] dark:text-[#F5F2EC] leading-tight"
                >
                  Task AI Assistant
                </h2>
                <p className="text-xs text-[#525855] dark:text-[#B4BDB9] mt-0.5">
                  Plan next steps across your passport, fellowships &amp; mentorship
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Task AI Assistant"
              className="p-2 rounded-lg text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div
            role="tablist"
            aria-label="Task Assistant views"
            className="grid grid-cols-2 gap-1.5 p-1 bg-[#F2EEE7] dark:bg-[#232826] rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === 'chat'}
              onClick={() => setDrawerTab('chat')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
                drawerTab === 'chat'
                  ? 'bg-white dark:bg-[#1B1F1E] text-[#1E2220] dark:text-[#F5F2EC] shadow-xs'
                  : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Assistant Chat</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={drawerTab === 'tasks'}
              onClick={() => setDrawerTab('tasks')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
                drawerTab === 'tasks'
                  ? 'bg-white dark:bg-[#1B1F1E] text-[#0F6B6E] dark:text-[#56C7C4] shadow-xs'
                  : 'text-[#525855] dark:text-[#B4BDB9] hover:text-[#1E2220] dark:hover:text-[#F5F2EC]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Action Tasks ({pendingTasksCount})</span>
            </button>
          </div>
        </div>

        {taskToast && (
          <div
            role="status"
            className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-[#0F6B6E]/10 dark:bg-[#147E82]/20 border border-[#0F6B6E]/25 dark:border-[#56C7C4]/35 text-xs text-[#0F6B6E] dark:text-[#56C7C4] font-medium flex items-center justify-between gap-2 shrink-0"
          >
            <span>{taskToast}</span>
            {drawerTab === 'chat' && (
              <button
                type="button"
                onClick={() => setDrawerTab('tasks')}
                className="font-semibold underline whitespace-nowrap cursor-pointer"
              >
                View tasks
              </button>
            )}
          </div>
        )}

        {drawerTab === 'chat' ? (
          <>
            {/* Model & Thread Toolbar */}
            <div className="px-4 py-2.5 border-b border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#161A19] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <label
                  htmlFor="assistant-model-select"
                  className="text-[11px] font-medium text-[#525855] dark:text-[#B4BDB9] whitespace-nowrap"
                >
                  Mode:
                </label>
                <select
                  id="assistant-model-select"
                  value={selectedModel}
                  onChange={(e) =>
                    setSelectedModel(
                      e.target.value as
                        | 'gemini-4-hydrogen'
                        | 'gemini-3.1-flash-lite'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC]"
                >
                  <option value="gemini-4-hydrogen">Balanced (Gemini 4 Hydrogen)</option>
                  <option value="gemini-3.1-flash-lite">Fast (Gemini 3.1 Flash Lite)</option>
                </select>
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearMessages();
                    setChatError('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Clear chat</span>
                </button>
              )}
            </div>

            {/* Scrollable Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4]">
                      Tailored to {profile.preferredName || 'your profile'}
                    </p>
                    <p className="text-sm text-[#1E2220] dark:text-[#F5F2EC] leading-relaxed">
                      Ask me to break down your next Skills Passport milestones, plan a
                      learning sprint for an opportunity skill gap, or prep for a mentor
                      chat.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#525855] dark:text-[#B4BDB9]">
                      Quick prompts
                    </p>
                    <div className="space-y-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs font-medium text-[#1E2220] dark:text-[#F5F2EC] hover:border-[#0F6B6E] dark:hover:border-[#56C7C4] hover:bg-[#FAF8F4] dark:hover:bg-[#232826] transition-colors cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isUser ? 'items-end' : 'items-start'
                      } space-y-1`}
                    >
                      <div
                        className={`max-w-[90%] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white rounded-2xl rounded-br-sm'
                            : 'bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] text-[#1E2220] dark:text-[#F5F2EC] rounded-2xl rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>

                      <div className="flex items-center gap-3 px-1">
                        <span className="font-mono text-[10px] text-[#525855] dark:text-[#B4BDB9] tabular-nums">
                          {isUser ? 'You' : 'Task AI'} · {msg.timestamp}
                        </span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => void handleTurnReplyIntoTasks(msg)}
                            disabled={convertingMessageId !== null}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6B6E] dark:text-[#56C7C4] hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {convertingMessageId === msg.id ? (
                              <>
                                <Loader2
                                  className="w-3 h-3 animate-spin"
                                  aria-hidden="true"
                                />
                                <span>Extracting tasks...</span>
                              </>
                            ) : (
                              <>
                                <ListPlus className="w-3 h-3" aria-hidden="true" />
                                <span>Turn into tasks</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {isSending && (
                <div
                  role="status"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] text-xs text-[#525855] dark:text-[#B4BDB9]"
                >
                  <Loader2
                    className="w-3.5 h-3.5 text-[#0F6B6E] dark:text-[#56C7C4] animate-spin"
                    aria-hidden="true"
                  />
                  <span>Planning next steps...</span>
                </div>
              )}

              {chatError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-[#6E1E2E]/10 dark:bg-[#E58A9B]/15 border border-[#6E1E2E]/25 dark:border-[#E58A9B]/35 text-xs text-[#6E1E2E] dark:text-[#F2A7B5] flex items-start justify-between gap-2"
                >
                  <span>{chatError}</span>
                  <button
                    type="button"
                    onClick={() => setChatError('')}
                    aria-label="Dismiss error"
                    className="p-0.5 hover:opacity-75 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              <div ref={threadEndRef} />
            </div>

            {/* Chat Input Composer */}
            <form
              onSubmit={handleChatSubmit}
              className="p-4 border-t border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] space-y-2 shrink-0"
            >
              <div className="flex items-end gap-2">
                <label htmlFor="task-assistant-chat-input" className="sr-only">
                  Ask the Task AI Assistant
                </label>
                <textarea
                  ref={chatInputRef}
                  id="task-assistant-chat-input"
                  rows={2}
                  value={chatInput}
                  onChange={(e) => {
                    setChatInput(e.target.value);
                    if (chatError) setChatError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(chatInput);
                    }
                  }}
                  placeholder="Ask for a study plan, next step, or mentor prep..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs sm:text-sm text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893] resize-none focus:bg-white dark:focus:bg-[#1B1F1E] focus:border-[#0F6B6E] dark:focus:border-[#56C7C4]"
                />
                <button
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  aria-label="Send message"
                  className="px-3.5 py-2.5 rounded-xl bg-[#0F6B6E] dark:bg-[#147E82] text-white text-xs font-semibold hover:bg-[#0B5254] dark:hover:bg-[#199499] disabled:opacity-50 transition-colors cursor-pointer min-h-[44px] inline-flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-[11px] text-[#525855] dark:text-[#B4BDB9]">
                Reminder: never share personal ID numbers or exact home addresses.
              </p>
            </form>
          </>
        ) : (
          /* Action Tasks Tab */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* AI Goal-to-Tasks Generator */}
            <form
              onSubmit={handleGenerateTasksFromGoal}
              className="bg-[#FAF8F4] dark:bg-[#232826] border border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-4 space-y-2.5"
            >
              <label
                htmlFor="ai-goal-input"
                className="block text-xs font-semibold text-[#0F6B6E] dark:text-[#56C7C4]"
              >
                Break a goal into action tasks (AI)
              </label>
              <div className="flex gap-2">
                <input
                  id="ai-goal-input"
                  type="text"
                  value={goalInput}
                  onChange={(e) => {
                    setGoalInput(e.target.value);
                    if (taskError) setTaskError('');
                  }}
                  placeholder="e.g., Build JavaScript skills for Nairobi fellowship"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-white dark:bg-[#1B1F1E] text-xs text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893]"
                />
                <button
                  type="submit"
                  disabled={isGeneratingTasks}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F6B6E] dark:bg-[#147E82] text-white text-xs font-semibold hover:bg-[#0B5254] dark:hover:bg-[#199499] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
                >
                  {isGeneratingTasks ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Planning...</span>
                    </>
                  ) : (
                    <>
                      <ListPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Suggest tasks</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Manual Task Adder */}
            <form onSubmit={handleAddManualTask} className="space-y-2">
              <label
                htmlFor="manual-task-input"
                className="block text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]"
              >
                Add a personal task
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="manual-task-input"
                  type="text"
                  value={manualTaskTitle}
                  onChange={(e) => {
                    setManualTaskTitle(e.target.value);
                    if (taskError) setTaskError('');
                  }}
                  placeholder="Write a concrete next step..."
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs text-[#1E2220] dark:text-[#F5F2EC] placeholder:text-[#525855] dark:placeholder:text-[#8E9893]"
                />
                <div className="flex gap-2">
                  <label htmlFor="manual-task-category" className="sr-only">
                    Task category
                  </label>
                  <select
                    id="manual-task-category"
                    value={manualTaskCategory}
                    onChange={(e) =>
                      setManualTaskCategory(e.target.value as TaskCategory)
                    }
                    className="px-2.5 py-2 rounded-lg border border-[#E3DDD2] dark:border-[#2F3533] bg-[#FAF8F4] dark:bg-[#232826] text-xs text-[#1E2220] dark:text-[#F5F2EC]"
                  >
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#6E1E2E] dark:bg-[#8A2A3D] text-white text-xs font-semibold hover:bg-[#561522] dark:hover:bg-[#9D3248] whitespace-nowrap cursor-pointer min-h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>

            {taskError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#6E1E2E]/10 dark:bg-[#E58A9B]/15 border border-[#6E1E2E]/25 dark:border-[#E58A9B]/35 text-xs text-[#6E1E2E] dark:text-[#F2A7B5]"
              >
                {taskError}
              </div>
            )}

            {/* Task Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#1E2220] dark:text-[#F5F2EC]">
                  Your checklist ({pendingTasksCount} remaining)
                </p>
                {completedTasksCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearCompletedTasks}
                    className="text-xs font-semibold text-[#6E1E2E] dark:text-[#E58A9B] hover:underline cursor-pointer"
                  >
                    Clear completed ({completedTasksCount})
                  </button>
                )}
              </div>

              {tasks.length === 0 ? (
                <div className="border border-dashed border-[#E3DDD2] dark:border-[#2F3533] rounded-xl p-6 text-center space-y-1.5">
                  <p className="text-sm font-medium text-[#1E2220] dark:text-[#F5F2EC]">
                    No action tasks yet
                  </p>
                  <p className="text-xs text-[#525855] dark:text-[#B4BDB9]">
                    Use “Suggest tasks” above or ask the assistant in chat to build your next
                    checklist.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((task) => {
                    const targetTab = categoryToTab(task.category);
                    return (
                      <li
                        key={task.id}
                        className={`p-3 rounded-xl border transition-colors flex items-start gap-2.5 ${
                          task.completed
                            ? 'bg-[#FAF8F4] dark:bg-[#161A19] border-[#E3DDD2] dark:border-[#2F3533] opacity-75'
                            : 'bg-white dark:bg-[#1B1F1E] border-[#E3DDD2] dark:border-[#2F3533]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          aria-pressed={task.completed}
                          aria-label={
                            task.completed
                              ? `Mark "${task.title}" incomplete`
                              : `Mark "${task.title}" complete`
                          }
                          className="mt-0.5 text-[#0F6B6E] dark:text-[#56C7C4] shrink-0 cursor-pointer"
                        >
                          {task.completed ? (
                            <Check className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Square
                              className="w-4 h-4 text-[#525855] dark:text-[#B4BDB9]"
                              aria-hidden="true"
                            />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p
                            className={`text-xs sm:text-sm leading-snug ${
                              task.completed
                                ? 'line-through text-[#525855] dark:text-[#B4BDB9]'
                                : 'font-medium text-[#1E2220] dark:text-[#F5F2EC]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {targetTab ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateTab(targetTab);
                                  onClose();
                                }}
                                className="px-2 py-0.5 rounded-md bg-[#F2EEE7] dark:bg-[#232826] text-[#0F6B6E] dark:text-[#56C7C4] font-semibold hover:underline cursor-pointer"
                              >
                                {task.category}
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-[#F2EEE7] dark:bg-[#232826] text-[#525855] dark:text-[#B4BDB9] font-medium">
                                {task.category}
                              </span>
                            )}
                            {task.source === 'ai' && (
                              <span className="text-[#525855] dark:text-[#B4BDB9]">
                                AI suggested
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete task "${task.title}"`}
                          className="p-1 rounded text-[#525855] dark:text-[#B4BDB9] hover:text-[#6E1E2E] dark:hover:text-[#E58A9B] cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

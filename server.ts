import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

type AllowedModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';

interface IncomingChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

interface CandidateTaskContext {
  preferredName?: string;
  roleSought?: string;
  location?: string;
  yearsExperience?: string;
  skills?: Array<{ name: string; proficiency: string }>;
  languages?: string[];
  savedOpportunitiesCount?: number;
  mentorshipRequestsCount?: number;
  activeTab?: string;
  tasks?: Array<{ title: string; category: string; completed: boolean }>;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error(
      'Gemini API key is not configured. Please check the Settings > Secrets panel.'
    );
    (err as Error & { statusCode?: number }).statusCode = 500;
    throw err;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildSystemInstruction(context?: CandidateTaskContext): string {
  const skillsSummary =
    context?.skills && context.skills.length > 0
      ? context.skills.map((s) => `${s.name} (${s.proficiency})`).join(', ')
      : 'None listed yet';

  const tasksSummary =
    context?.tasks && context.tasks.length > 0
      ? context.tasks
          .slice(0, 12)
          .map(
            (t) =>
              `- [${t.completed ? 'x' : ' '}] (${t.category}) ${t.title}`
          )
          .join('\n')
      : 'No personal tasks added yet.';

  return [
    'You are the SkillBridge Task AI Assistant, a practical, encouraging career-readiness and task-planning coach helping displaced professionals turn demonstrated skills into local mentorship and fellowship opportunities.',
    'Focus on concrete, actionable next steps, clear checklists, skill-building micro-plans, portfolio phrasing, and mentorship preparation.',
    'Follow data-minimization safeguarding principles: never ask for or repeat sensitive personal ID numbers, refugee case numbers, or exact home addresses.',
    'Keep responses concise, structured with short headings or numbered/bulleted steps, and grounded in the candidate context below (note that SkillBridge listings and mentors are demo/illustrative prototype items).',
    '',
    'Current Candidate Context:',
    `- Preferred Name: ${context?.preferredName || 'Candidate'}`,
    `- Target Role: ${context?.roleSought || 'Not specified'}`,
    `- General Location: ${context?.location || 'Not specified'}`,
    `- Experience: ${context?.yearsExperience || 'Not specified'}`,
    `- Listed Skills: ${skillsSummary}`,
    `- Languages: ${
      context?.languages && context.languages.length > 0
        ? context.languages.join(', ')
        : 'Not specified'
    }`,
    `- Saved Opportunities: ${context?.savedOpportunitiesCount ?? 0}`,
    `- Mentorship Requests: ${context?.mentorshipRequestsCount ?? 0}`,
    `- Active Workspace Section: ${context?.activeTab || 'overview'}`,
    '',
    'Candidate Action Task List:',
    tasksSummary,
  ].join('\n');
}

function mapGeminiError(error: unknown): { status: number; message: string } {
  const rawMessage =
    error instanceof Error ? error.message : 'Unexpected assistant error.';
  const statusCode =
    typeof (error as { status?: unknown; statusCode?: unknown })?.status ===
    'number'
      ? ((error as { status: number }).status)
      : typeof (error as { statusCode?: unknown })?.statusCode === 'number'
        ? ((error as { statusCode: number }).statusCode)
        : 500;

  if (
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    statusCode === 403
  ) {
    return {
      status: 403,
      message:
        'Unable to authenticate with Gemini. Please verify your API key in the Settings > Secrets panel.',
    };
  }

  if (
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    statusCode === 429
  ) {
    return {
      status: 429,
      message:
        'Rate limit reached for the Gemini API. Please wait a moment and try again.',
    };
  }

  if (rawMessage.includes('not configured')) {
    return {
      status: 500,
      message: rawMessage,
    };
  }

  return {
    status: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
    message: rawMessage,
  };
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const body = req.body as {
        messages?: IncomingChatMessage[];
        context?: CandidateTaskContext;
        model?: string;
      };

      const incoming = Array.isArray(body?.messages) ? body.messages : [];
      const sanitized = incoming
        .filter(
          (m): m is IncomingChatMessage =>
            !!m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.text === 'string' &&
            m.text.trim().length > 0
        )
        .slice(-20);

      if (sanitized.length === 0) {
        res.status(400).json({ error: 'Please enter a message to continue.' });
        return;
      }

      const lastMessage = sanitized[sanitized.length - 1];
      if (lastMessage.role !== 'user') {
        res
          .status(400)
          .json({ error: 'The latest message in the thread must be from the user.' });
        return;
      }

      const model: AllowedModel =
        body?.model === 'gemini-3.1-flash-lite'
          ? 'gemini-3.1-flash-lite'
          : 'gemini-4-hydrogen';

      const ai = getGeminiClient();
      const history = sanitized.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      }));

      const chat = ai.chats.create({
        model,
        history,
        config: {
          systemInstruction: buildSystemInstruction(body?.context),
          ...(model === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      const response = await chat.sendMessage({
        message: lastMessage.text.trim(),
      });

      const replyText = (response.text ?? '').trim();
      if (!replyText) {
        res.status(502).json({
          error: 'The assistant returned an empty response. Please try again.',
        });
        return;
      }

      res.json({ reply: replyText, model });
    } catch (error) {
      const mapped = mapGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/assistant/suggest-tasks', async (req, res) => {
    try {
      const body = req.body as {
        goal?: string;
        context?: CandidateTaskContext;
      };

      const goalText =
        typeof body?.goal === 'string' && body.goal.trim().length > 0
          ? body.goal.trim()
          : 'Strengthen my Skills Passport, prepare for local fellowships, and plan mentorship outreach.';

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Generate 3 to 4 concise, actionable, realistic tasks for this candidate goal: "${goalText}". Avoid repeating tasks already on the candidate's task list.`,
        config: {
          systemInstruction: buildSystemInstruction(body?.context),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description:
                    'Actionable task title under 85 characters starting with a verb.',
                },
                category: {
                  type: Type.STRING,
                  description:
                    'One of: Passport, Opportunities, Mentorship, General',
                },
              },
              required: ['title', 'category'],
            },
          },
        },
      });

      const jsonText = (response.text ?? '[]').trim();
      const parsed = JSON.parse(jsonText) as Array<{
        title?: unknown;
        category?: unknown;
      }>;

      const allowedCategories = new Set([
        'Passport',
        'Opportunities',
        'Mentorship',
        'General',
      ]);

      const tasks = Array.isArray(parsed)
        ? parsed
            .filter(
              (item) =>
                item &&
                typeof item.title === 'string' &&
                item.title.trim().length > 0
            )
            .slice(0, 4)
            .map((item) => {
              const rawCat =
                typeof item.category === 'string' ? item.category.trim() : '';
              return {
                title: (item.title as string).trim().slice(0, 110),
                category: allowedCategories.has(rawCat) ? rawCat : 'General',
              };
            })
        : [];

      res.json({ tasks });
    } catch (error) {
      const mapped = mapGeminiError(error);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();

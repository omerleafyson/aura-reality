import { GoogleGenAI, Type, Schema as GeminiSchema } from '@google/genai';
import { Reality, RealityEvent, ImpactCategory, RealityEntity } from '../src/types/index.js';
import crypto from 'crypto';
import { z } from 'zod';

// Initialize the GoogleGenAI client with the server-side key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.8-flash,gemini-3.1-flash-lite')
  .split(',')
  .map(model => model.trim())
  .filter(Boolean);

const generateId = (prefix: string) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

const realityZodSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  summary: z.string(),
  categories: z.array(z.string()),
  timelineRange: z.string(),
  overview: z.array(z.string()),
  events: z.array(z.object({
    year: z.string(),
    title: z.string(),
    explanation: z.string(),
    impactIndicators: z.array(z.string())
  })),
  impacts: z.array(z.object({
    domain: z.string(),
    level: z.enum(['low', 'medium', 'high', 'extreme']),
    direction: z.enum(['positive', 'negative', 'neutral', 'transformative']),
    explanation: z.string()
  })),
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['organization', 'person', 'region', 'technology', 'concept']),
    impactDescription: z.string()
  })),
  assumptions: z.array(z.string()).optional()
});

// Define schema for Gemini to return structured output
const realitySchema: GeminiSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A catchy title for the alternate reality.' },
    prompt: { type: Type.STRING, description: 'The rewritten, normalized scenario prompt.' },
    summary: { type: Type.STRING, description: 'A concise summary of this alternate reality.' },
    categories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Categories applying to this reality (e.g. History, Technology, Society).'
    },
    timelineRange: { type: Type.STRING, description: 'The time range of the scenario, e.g., "1999 - 2032" or "2007 - 2035".' },
    overview: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3-5 major consequences forming an overview of the divergence.'
    },
    events: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.STRING, description: 'The year or date of the event.' },
          title: { type: Type.STRING, description: 'A short title for the event.' },
          explanation: { type: Type.STRING, description: 'A clear explanation of what happens and why.' },
          impactIndicators: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Short tags indicating impacts (e.g. "Geopolitical shift", "Tech stagnation").'
          }
        },
        required: ['year', 'title', 'explanation', 'impactIndicators']
      },
      description: '8-14 significant timeline events forming a causal chain.'
    },
    impacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          domain: { type: Type.STRING, description: 'The impacted domain (e.g. Technology, Economy, Culture).' },
          level: { type: Type.STRING, enum: ['low', 'medium', 'high', 'extreme'], description: 'Level of impact.' },
          direction: { type: Type.STRING, enum: ['positive', 'negative', 'neutral', 'transformative'], description: 'Direction of impact.' },
          explanation: { type: Type.STRING, description: 'Explanation of how the domain changed.' }
        },
        required: ['domain', 'level', 'direction', 'explanation']
      }
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the entity.' },
          type: { type: Type.STRING, enum: ['organization', 'person', 'region', 'technology', 'concept'] },
          impactDescription: { type: Type.STRING, description: 'How this entity was uniquely affected.' }
        },
        required: ['name', 'type', 'impactDescription']
      }
    },
    assumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key assumptions or speculative notes made while generating this timeline.'
    }
  },
  required: ['title', 'prompt', 'summary', 'categories', 'timelineRange', 'overview', 'events', 'impacts', 'entities']
};

export async function invokeGeminiWithFallback(instructions: string, schema: GeminiSchema) {
  const uniqueModels = Array.from(new Set([MODEL_NAME, ...FALLBACK_MODELS]));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: instructions,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7,
        }
      });
      if (response.text) return response.text;
      lastError = new Error(`Model ${model} returned an empty response`);
    } catch (e: any) {
      const message = e?.message || String(e);
      console.warn(`Model ${model} failed: ${message}`);
      lastError = e;

      // Auth/config/input failures will also fail on every fallback, so fail fast.
      if (/401|403|api key|permission|invalid argument/i.test(message)) throw e;
      // Quota/capacity/model-specific failures continue to the next configured model.
    }
  }

  throw lastError || new Error('All configured Gemini models failed to generate content');
}


export async function invokeGeminiWithRepair(instructions: string, schema: GeminiSchema, zodSchema: any): Promise<any> {
  let responseText = await invokeGeminiWithFallback(instructions, schema);
  let rawResult;
  try {
    rawResult = JSON.parse(responseText);
    return zodSchema.parse(rawResult);
  } catch (err: any) {
    console.warn("Validation failed, attempting repair pass:", err.message);
    const repairInstructions = `You are a strict JSON repair engine.
The following JSON failed validation against its schema.
Error: ${err.message}
Invalid JSON:
${responseText}

Fix the JSON so it perfectly matches the schema. Output ONLY valid JSON.`;
    responseText = await invokeGeminiWithFallback(repairInstructions, schema);
    rawResult = JSON.parse(responseText);
    return zodSchema.parse(rawResult);
  }
}

export async function generateReality(prompt: string, mode: string, authorId: string = 'anonymous'): Promise<Reality> {
  const instructions = `You are the AURA REALITY ENGINE.
Your task is to generate a deeply thoughtful, structurally coherent, and highly premium speculative alternate reality based on the user's prompt.
Mode: ${mode}
User Prompt: "${prompt}"

Guidelines:
1. Scenario divergence must be logical and causal. Create a timeline (8-14 events) showing cause and effect.
2. Maintain a premium, serious tone. This is an elite simulation engine.
3. Clearly identify facts prior to divergence. All subsequent events are speculative.
4. Output strict JSON matching the schema.
5. Create realistic domains, impacts, and affected entities.

Generate the reality now.`;

  const result = await invokeGeminiWithRepair(instructions, realitySchema, realityZodSchema);

  // Fill in system-controlled fields
  const realityId = generateId('rly');
  
  const finalReality: Reality = {
    ...result,
    id: realityId,
    createdAt: new Date().toISOString(),
    authorId: authorId,
    events: result.events.map((e: any, idx: number) => ({
      ...e,
      id: generateId(`evt_${idx}`)
    })),
    impacts: result.impacts.map((i: any, idx: number) => ({
      ...i,
      id: generateId(`imp_${idx}`)
    })),
    entities: result.entities.map((en: any, idx: number) => ({
      ...en,
      id: generateId(`ent_${idx}`)
    })),
    categories: result.categories as any,
    forks: [],
    branches: [],
    isPublic: false,
    visibility: 'private',
    views: 0,
    forkCount: 0,
    savedCount: 0
  };

  return finalReality;
}

export async function generateFork(parentReality: Reality, forkType: 'root' | 'event', forkEvent: RealityEvent | null, newPrompt: string, authorId: string = 'anonymous'): Promise<Reality> {
  // Extract prior events to enforce history integrity
  const forkEventIndex = forkEvent ? parentReality.events.findIndex(e => e.id === forkEvent.id) : -1;
  const priorEvents = forkEventIndex > 0 ? parentReality.events.slice(0, forkEventIndex) : [];
  
  const instructions = forkType === 'root' 
    ? `You are the AURA REALITY ENGINE.
The user is creating a new root-level branch of an existing alternate reality.
Parent Reality Base Prompt/Scenario: ${parentReality.prompt}
Parent Reality Title: ${parentReality.title}
User's New Root Divergence: "${newPrompt}"

Your task is to generate a NEW alternate reality timeline from scratch based on the parent's base scenario mixed with the user's new divergence.
1. Create a full timeline (8-14 events) showing cause and effect.
2. Keep the premium, serious tone.
3. Output strict JSON matching the schema.

Generate the new forked reality now.`
    : `You are the AURA REALITY ENGINE.
The user is forking an existing alternate reality.
Parent Reality: ${parentReality.title}
Fork Point Event: [${forkEvent!.year}] ${forkEvent!.title} - ${forkEvent!.explanation}
User's New Divergence: "${newPrompt}"

Your task is to generate a NEW timeline branch that splits from the parent reality EXACTLY AT the fork point event.
1. DO NOT generate the events before the fork point. Only generate the new divergence event and the subsequent cascading consequences.
2. The timeline must show cause and effect based on the new divergence.
3. Keep the premium, serious tone.
4. Output strict JSON matching the schema.

Generate the new forked reality now.`;

  const result = await invokeGeminiWithRepair(instructions, realitySchema, realityZodSchema);

  const realityId = generateId('rly');
  
  // Enforce history: priorEvents + new events
  const newEvents = result.events.map((e: any, idx: number) => ({
    ...e,
    id: generateId(`evt_new_${idx}`)
  }));
  
  const mergedEvents = forkType === 'root' ? newEvents : [...priorEvents, ...newEvents];

  const finalReality: Reality = {
    ...result,
    id: realityId,
    createdAt: new Date().toISOString(),
    authorId: authorId,
    events: mergedEvents,
    impacts: result.impacts.map((i: any, idx: number) => ({
      ...i,
      id: generateId(`imp_${idx}`)
    })),
    entities: result.entities.map((en: any, idx: number) => ({
      ...en,
      id: generateId(`ent_${idx}`)
    })),
    categories: result.categories as any,
    forks: [],
    branches: [],
    isPublic: false,
    visibility: 'private',
    views: 0,
    forkCount: 0,
    savedCount: 0,
    parentRealityId: parentReality.id,
    forkSourceEventId: forkEvent ? forkEvent.id : undefined
  } as any;

  return finalReality;
}

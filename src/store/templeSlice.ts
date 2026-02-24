import type { TempleReflection } from '@/types/domain'

export type TempleOrb = 'Clarity' | 'Empathy' | 'Resolve'

export interface OrbState {
  energy: number
  attunement: number
}

export interface TempleSession {
  id: string
  orb: TempleOrb
  startedAt: string
  endedAt: string | null
  entries: number
}

export interface InsightProfile {
  clarity: number
  empathy: number
  resolve: number
}

export interface TempleState {
  activeOrb: TempleOrb
  reflections: TempleReflection[]
  sessions: TempleSession[]
  verseDraft: string
  threadDraft: string
  orbStates: Record<TempleOrb, OrbState>
  insightProfile: InsightProfile
}

export type TempleAction =
  | { type: 'temple/set-orb'; payload: { orb: TempleOrb } }
  | { type: 'temple/set-drafts'; payload: { verseDraft: string; threadDraft: string } }
  | { type: 'temple/open-session'; payload: { orb: TempleOrb } }
  | { type: 'temple/close-session'; payload: { sessionId: string } }
  | { type: 'temple/add-reflection'; payload: { reflection: TempleReflection } }
  | { type: 'temple/delete-reflection'; payload: { id: string } }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const INITIAL_ORB_STATES: Record<TempleOrb, OrbState> = {
  Clarity: { energy: 52, attunement: 48 },
  Empathy: { energy: 54, attunement: 50 },
  Resolve: { energy: 50, attunement: 46 },
}

export const initialTempleState: TempleState = {
  activeOrb: 'Clarity',
  reflections: [],
  sessions: [],
  verseDraft: '',
  threadDraft: '',
  orbStates: INITIAL_ORB_STATES,
  insightProfile: {
    clarity: 50,
    empathy: 50,
    resolve: 50,
  },
}

function withInsightBoost(profile: InsightProfile, orb: TempleOrb): InsightProfile {
  if (orb === 'Clarity') return { ...profile, clarity: clamp(profile.clarity + 3, 0, 100) }
  if (orb === 'Empathy') return { ...profile, empathy: clamp(profile.empathy + 3, 0, 100) }
  return { ...profile, resolve: clamp(profile.resolve + 3, 0, 100) }
}

export function templeReducer(state: TempleState, action: TempleAction): TempleState {
  switch (action.type) {
    case 'temple/set-orb':
      return { ...state, activeOrb: action.payload.orb }

    case 'temple/set-drafts':
      return {
        ...state,
        verseDraft: action.payload.verseDraft,
        threadDraft: action.payload.threadDraft,
      }

    case 'temple/open-session': {
      const session: TempleSession = {
        id: createId('temple-session'),
        orb: action.payload.orb,
        startedAt: new Date().toISOString(),
        endedAt: null,
        entries: 0,
      }
      return {
        ...state,
        activeOrb: action.payload.orb,
        sessions: [session, ...state.sessions].slice(0, 40),
      }
    }

    case 'temple/close-session': {
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, endedAt: new Date().toISOString() }
            : session,
        ),
      }
    }

    case 'temple/add-reflection': {
      const { reflection } = action.payload
      const nextOrb = reflection.orb
      const nextOrbState = state.orbStates[nextOrb]

      const orbStates: Record<TempleOrb, OrbState> = {
        ...state.orbStates,
        [nextOrb]: {
          energy: clamp(nextOrbState.energy + 4, 0, 100),
          attunement: clamp(nextOrbState.attunement + 3, 0, 100),
        },
      }

      const sessions = state.sessions.map(session =>
        session.endedAt === null ? { ...session, entries: session.entries + 1 } : session,
      )

      return {
        ...state,
        reflections: [reflection, ...state.reflections].slice(0, 80),
        verseDraft: '',
        threadDraft: '',
        orbStates,
        sessions,
        insightProfile: withInsightBoost(state.insightProfile, nextOrb),
      }
    }

    case 'temple/delete-reflection':
      return {
        ...state,
        reflections: state.reflections.filter(item => item.id !== action.payload.id),
      }
  }
}

import { CONSENSUS_SNAPSHOTS } from '@/data/chronomapSeed'

export type DirectiveStatus = 'stable' | 'watch' | 'critical'

export interface TopicSignal {
  topic: string
  consensus: number
  disagreement: number
  dissonance: number
  momentum: number
  updatedAt: string
}

export interface InsightFlag {
  id: string
  challengeId: string
  type: 'cognitive-dissonance' | 'polarization' | 'factual-gap'
  severity: 'low' | 'medium' | 'high'
  message: string
  createdAt: string
}

export interface CouncilDirective {
  id: string
  title: string
  status: DirectiveStatus
  note: string
}

export interface InsightState {
  topicSignals: Record<string, TopicSignal>
  disagreementRadar: number[]
  factualConsensusGauge: number
  forumGlobalPulse: number
  dissonanceFlags: InsightFlag[]
  councilDirectives: CouncilDirective[]
  lastSyncedAt: string | null
}

export interface SyncInsightPayload {
  challengeId: string
  topic: string
  consensus: number
  disagreement: number
  dissonance: number
  factualConsensus: number
  unresolvedAppeals: number
  abusiveEvents: number
}

export type InsightAction =
  | { type: 'insight/sync'; payload: SyncInsightPayload }
  | { type: 'insight/clear-flags'; payload: { challengeId?: string } }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function latestSignals(): Record<string, TopicSignal> {
  const byTopic = new Map<string, TopicSignal>()
  for (const snapshot of CONSENSUS_SNAPSHOTS) {
    const existing = byTopic.get(snapshot.topic)
    const momentum = existing ? clamp(snapshot.consensus - existing.consensus + 50, 0, 100) : 50
    byTopic.set(snapshot.topic, {
      topic: snapshot.topic,
      consensus: snapshot.consensus,
      disagreement: snapshot.disagreement,
      dissonance: snapshot.dissonance,
      momentum,
      updatedAt: snapshot.timestamp,
    })
  }
  return Object.fromEntries(byTopic)
}

const DEFAULT_DIRECTIVES: CouncilDirective[] = [
  {
    id: 'directive-04',
    title: 'Tier-1 Receipts for Quantitative Claims',
    status: 'stable',
    note: 'Primary source reinforcement remains healthy.',
  },
  {
    id: 'directive-09',
    title: 'Steelman Requirement Before Rebuttal',
    status: 'watch',
    note: 'Active monitoring for tone drift and strawman shortcuts.',
  },
  {
    id: 'directive-12',
    title: 'Appeal Rationale Transparency',
    status: 'stable',
    note: 'Appeal outcomes are visible and traceable.',
  },
]

export const initialInsightState: InsightState = {
  topicSignals: latestSignals(),
  disagreementRadar: [],
  factualConsensusGauge: 58,
  forumGlobalPulse: 55,
  dissonanceFlags: [],
  councilDirectives: DEFAULT_DIRECTIVES,
  lastSyncedAt: null,
}

function mergeFlags(previous: InsightFlag[], incoming: InsightFlag[]): InsightFlag[] {
  const merged = [...incoming]
  for (const flag of previous) {
    const duplicate = merged.some(item => item.challengeId === flag.challengeId && item.type === flag.type)
    if (!duplicate) merged.push(flag)
  }
  return merged.slice(0, 24)
}

export function insightReducer(state: InsightState, action: InsightAction): InsightState {
  switch (action.type) {
    case 'insight/sync': {
      const payload = action.payload
      const now = new Date().toISOString()
      const key = payload.topic || 'General'
      const previousSignal = state.topicSignals[key]
      const momentum = clamp(payload.consensus - (previousSignal?.consensus ?? payload.consensus) + 50, 0, 100)

      const nextTopicSignals: Record<string, TopicSignal> = {
        ...state.topicSignals,
        [key]: {
          topic: key,
          consensus: payload.consensus,
          disagreement: payload.disagreement,
          dissonance: payload.dissonance,
          momentum,
          updatedAt: now,
        },
      }

      const topicValues = Object.values(nextTopicSignals)
      const forumGlobalPulse = clamp(
        Math.round(topicValues.reduce((sum, signal) => sum + signal.consensus + signal.momentum * 0.22, 0) / Math.max(1, topicValues.length)),
        0,
        100,
      )

      const disagreementRadar = [...state.disagreementRadar, payload.disagreement].slice(-20)
      const factualConsensusGauge = clamp(Math.round(state.factualConsensusGauge * 0.55 + payload.factualConsensus * 0.45), 0, 100)

      const generatedFlags: InsightFlag[] = []
      if (payload.disagreement >= 68) {
        generatedFlags.push({
          id: createId('flag'),
          challengeId: payload.challengeId,
          type: 'polarization',
          severity: payload.disagreement >= 82 ? 'high' : 'medium',
          message: 'Audience disagreement radar crossed strategic threshold.',
          createdAt: now,
        })
      }
      if (payload.dissonance >= 62 || payload.abusiveEvents >= 2) {
        generatedFlags.push({
          id: createId('flag'),
          challengeId: payload.challengeId,
          type: 'cognitive-dissonance',
          severity: payload.dissonance >= 78 ? 'high' : 'medium',
          message: 'Cognitive dissonance signal rising across argument clusters.',
          createdAt: now,
        })
      }
      if (payload.factualConsensus <= 48 || payload.unresolvedAppeals >= 2) {
        generatedFlags.push({
          id: createId('flag'),
          challengeId: payload.challengeId,
          type: 'factual-gap',
          severity: payload.factualConsensus <= 35 ? 'high' : 'low',
          message: 'Factual consensus gauge indicates unresolved evidence gaps.',
          createdAt: now,
        })
      }

      const directives = state.councilDirectives.map(item => {
        if (item.id === 'directive-04') {
          return {
            ...item,
            status: factualConsensusGauge < 45 ? ('critical' as const) : factualConsensusGauge < 60 ? ('watch' as const) : ('stable' as const),
          }
        }
        if (item.id === 'directive-09') {
          return {
            ...item,
            status: payload.dissonance > 70 ? ('critical' as const) : payload.dissonance > 56 ? ('watch' as const) : ('stable' as const),
          }
        }
        if (item.id === 'directive-12') {
          return {
            ...item,
            status: payload.unresolvedAppeals >= 3 ? ('critical' as const) : payload.unresolvedAppeals > 0 ? ('watch' as const) : ('stable' as const),
          }
        }
        return item
      })

      return {
        ...state,
        topicSignals: nextTopicSignals,
        disagreementRadar,
        factualConsensusGauge,
        forumGlobalPulse,
        dissonanceFlags: mergeFlags(state.dissonanceFlags, generatedFlags),
        councilDirectives: directives,
        lastSyncedAt: now,
      }
    }

    case 'insight/clear-flags': {
      if (!action.payload.challengeId) {
        return { ...state, dissonanceFlags: [] }
      }
      return {
        ...state,
        dissonanceFlags: state.dissonanceFlags.filter(flag => flag.challengeId !== action.payload.challengeId),
      }
    }
  }
}

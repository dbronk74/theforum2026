import type { GauntletTrialResult } from '@/types/domain'

export interface TrialRuleCard {
  id: string
  title: string
  detail: string
  penalty: string
}

export interface TrialModule {
  id: string
  title: string
  objective: string
  difficulty: 'Initiate' | 'Vanguard' | 'Master'
  ruleCards: TrialRuleCard[]
}

export interface ChallengeReasoningProfile {
  challengeId: string
  stability: number
  heat: number
  spectatorPulse: number
  badges: string[]
  relics: string[]
  heatmap: number[][]
  completedTrials: string[]
  lastResult: GauntletTrialResult | null
}

export interface ReasoningState {
  modules: TrialModule[]
  byChallenge: Record<string, ChallengeReasoningProfile>
}

export interface RunTrialPayload {
  challengeId: string
  moduleId: string
  evidenceQuality: number
  civility: number
  coherence: number
  crowdMomentum: number
}

export interface SyncChallengePayload {
  challengeId: string
  civilityScore: number
  factualScore: number
  coherenceScore: number
  penalties: number
  audienceScore: number
}

export type ReasoningAction =
  | { type: 'reasoning/ensure-challenge'; payload: { challengeId: string } }
  | { type: 'reasoning/run-trial'; payload: RunTrialPayload }
  | { type: 'reasoning/sync-from-challenge'; payload: SyncChallengePayload }
  | { type: 'reasoning/reset-challenge'; payload: { challengeId: string } }

export const TRIAL_MODULES: TrialModule[] = [
  {
    id: 'trial-signal-forge',
    title: 'Signal Forge',
    objective: 'Strengthen evidence chain before opening claim.',
    difficulty: 'Initiate',
    ruleCards: [
      {
        id: 'sf-1',
        title: 'Receipt First',
        detail: 'Open with at least one verifiable receipt before rhetorical framing.',
        penalty: 'No receipt: -8 stability.',
      },
      {
        id: 'sf-2',
        title: 'Single Claim Discipline',
        detail: 'Keep one falsifiable claim per turn.',
        penalty: 'Claim stacking: +6 heat.',
      },
    ],
  },
  {
    id: 'trial-steelman-gauntlet',
    title: 'Steelman Gauntlet',
    objective: 'Demonstrate fair representation of opposing position.',
    difficulty: 'Vanguard',
    ruleCards: [
      {
        id: 'sg-1',
        title: 'Opponent First',
        detail: 'Summarize the strongest opposing argument before rebuttal.',
        penalty: 'Missing steelman: -10 coherence.',
      },
      {
        id: 'sg-2',
        title: 'No Tone Drift',
        detail: 'Maintain neutral language while attacking argument structure only.',
        penalty: 'Tone drift: +10 heat.',
      },
    ],
  },
  {
    id: 'trial-factual-surge',
    title: 'Factual Surge',
    objective: 'Convert disputed claims into verifiable consensus territory.',
    difficulty: 'Vanguard',
    ruleCards: [
      {
        id: 'fs-1',
        title: 'Tiered Evidence',
        detail: 'Escalate from primary to secondary sources with clear attribution.',
        penalty: 'Weak source chain: -9 factual influence.',
      },
      {
        id: 'fs-2',
        title: 'Counterfactual Check',
        detail: 'Name one scenario that would invalidate your claim.',
        penalty: 'No counterfactual: -6 stability.',
      },
    ],
  },
  {
    id: 'trial-consensus-bridge',
    title: 'Consensus Bridge',
    objective: 'Lower conflict heat while preserving factual rigor.',
    difficulty: 'Master',
    ruleCards: [
      {
        id: 'cb-1',
        title: 'Bridge Statement',
        detail: 'Explicitly identify one area of agreement and one unresolved gap.',
        penalty: 'No bridge statement: +8 dissonance proxy heat.',
      },
      {
        id: 'cb-2',
        title: 'Actionable End State',
        detail: 'Close with a testable next step, not a slogan.',
        penalty: 'Slogan ending: -8 stability.',
      },
    ],
  },
]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function createHeatmap(size: number): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0))
}

function createChallengeProfile(challengeId: string): ChallengeReasoningProfile {
  return {
    challengeId,
    stability: 52,
    heat: 46,
    spectatorPulse: 50,
    badges: [],
    relics: [],
    heatmap: createHeatmap(TRIAL_MODULES.length),
    completedTrials: [],
    lastResult: null,
  }
}

function upsertBadge(list: string[], badge: string): string[] {
  return list.includes(badge) ? list : [...list, badge]
}

function upsertRelic(list: string[], relic: string): string[] {
  return list.includes(relic) ? list : [...list, relic]
}

export const initialReasoningState: ReasoningState = {
  modules: TRIAL_MODULES,
  byChallenge: {},
}

function applyAwards(profile: ChallengeReasoningProfile, payload: RunTrialPayload): { badges: string[]; relics: string[] } {
  let badges = [...profile.badges]
  let relics = [...profile.relics]

  if (payload.evidenceQuality >= 82) badges = upsertBadge(badges, 'Receipt Smith')
  if (payload.civility >= 80) badges = upsertBadge(badges, 'Steel Temper')
  if (payload.coherence >= 78) badges = upsertBadge(badges, 'Argument Architect')
  if (profile.stability >= 74 && profile.heat <= 48) badges = upsertBadge(badges, 'Stability Warden')

  if (profile.completedTrials.length >= 2 && profile.stability >= 68) {
    relics = upsertRelic(relics, 'Relic of Rhetoric I')
  }
  if (profile.stability >= 84 && profile.heat <= 38 && profile.badges.length >= 3) {
    relics = upsertRelic(relics, 'Relic of Equilibrium')
  }

  return { badges, relics }
}

export function reasoningReducer(state: ReasoningState, action: ReasoningAction): ReasoningState {
  switch (action.type) {
    case 'reasoning/ensure-challenge': {
      const { challengeId } = action.payload
      if (state.byChallenge[challengeId]) return state
      return {
        ...state,
        byChallenge: {
          ...state.byChallenge,
          [challengeId]: createChallengeProfile(challengeId),
        },
      }
    }

    case 'reasoning/run-trial': {
      const payload = action.payload
      const profile = state.byChallenge[payload.challengeId] ?? createChallengeProfile(payload.challengeId)

      const stabilityDelta = Math.round((payload.evidenceQuality * 0.36 + payload.civility * 0.34 + payload.coherence * 0.3 - 50) / 10)
      const heatDelta = Math.round((100 - payload.civility) * 0.14 + payload.crowdMomentum * 0.06 - payload.evidenceQuality * 0.1)
      const spectatorDelta = Math.round((payload.coherence + payload.civility + payload.evidenceQuality - 168) / 8 + payload.crowdMomentum * 0.1)

      const stability = clamp(profile.stability + stabilityDelta, 0, 100)
      const heat = clamp(profile.heat + heatDelta, 0, 100)
      const spectatorPulse = clamp(profile.spectatorPulse + spectatorDelta, 0, 100)

      const moduleIndex = Math.max(0, state.modules.findIndex(module => module.id === payload.moduleId))
      const heatmap = profile.heatmap.map((row, rowIndex) =>
        row.map((cell, columnIndex) => {
          if (rowIndex !== moduleIndex && columnIndex !== moduleIndex) return cell
          const boost = rowIndex === moduleIndex && columnIndex === moduleIndex ? 12 : 4
          return clamp(cell + boost + Math.round((100 - payload.civility) / 12), 0, 100)
        }),
      )

      const completedTrials = profile.completedTrials.includes(payload.moduleId)
        ? profile.completedTrials
        : [...profile.completedTrials, payload.moduleId]

      const provisional: ChallengeReasoningProfile = {
        ...profile,
        stability,
        heat,
        spectatorPulse,
        heatmap,
        completedTrials,
      }

      const awards = applyAwards(provisional, payload)

      const result: GauntletTrialResult = {
        challengeId: payload.challengeId,
        stability,
        heat,
        badgesAwarded: awards.badges,
        relicsUnlocked: awards.relics,
        spectatorPulseDelta: spectatorDelta,
      }

      return {
        ...state,
        byChallenge: {
          ...state.byChallenge,
          [payload.challengeId]: {
            ...provisional,
            badges: awards.badges,
            relics: awards.relics,
            lastResult: result,
          },
        },
      }
    }

    case 'reasoning/sync-from-challenge': {
      const payload = action.payload
      const profile = state.byChallenge[payload.challengeId] ?? createChallengeProfile(payload.challengeId)

      const baselineStability = clamp(
        Math.round(52 + payload.civilityScore * 1.1 + payload.factualScore * 1.2 + payload.coherenceScore - payload.penalties * 1.5),
        0,
        100,
      )
      const baselineHeat = clamp(Math.round(46 + payload.penalties * 2 + Math.abs(payload.audienceScore) * 0.3 - payload.civilityScore * 0.5), 0, 100)

      return {
        ...state,
        byChallenge: {
          ...state.byChallenge,
          [payload.challengeId]: {
            ...profile,
            stability: Math.round(profile.stability * 0.68 + baselineStability * 0.32),
            heat: Math.round(profile.heat * 0.64 + baselineHeat * 0.36),
          },
        },
      }
    }

    case 'reasoning/reset-challenge': {
      const { challengeId } = action.payload
      const next = { ...state.byChallenge }
      delete next[challengeId]
      return { ...state, byChallenge: next }
    }
  }
}

export function selectReasoningProfile(state: ReasoningState, challengeId: string | null | undefined): ChallengeReasoningProfile | null {
  if (!challengeId) return null
  return state.byChallenge[challengeId] ?? null
}

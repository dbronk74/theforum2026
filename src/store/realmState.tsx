import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { getTotalScore, useForum } from '@/state/forumState'
import {
  chronoMapReducer,
  initialChronoMapState,
  type ChronoMapAction,
  type ChronoMapState,
  type ChronoTimeWindow,
} from '@/store/chronoMapSlice'
import {
  initialReasoningState,
  reasoningReducer,
  type ReasoningAction,
  type ReasoningState,
  type RunTrialPayload,
  type SyncChallengePayload,
} from '@/store/reasoningSlice'
import {
  initialInsightState,
  insightReducer,
  type InsightAction,
  type InsightState,
  type SyncInsightPayload,
} from '@/store/insightSlice'
import {
  initialTempleState,
  templeReducer,
  type TempleAction,
  type TempleOrb,
  type TempleState,
} from '@/store/templeSlice'
import type { TempleReflection } from '@/types/domain'

interface RealmState {
  chronoMap: ChronoMapState
  reasoning: ReasoningState
  insight: InsightState
  temple: TempleState
}

type RealmAction = ChronoMapAction | ReasoningAction | InsightAction | TempleAction

interface RealmContextValue {
  state: RealmState
  setChronoTimeWindow: (window: ChronoTimeWindow) => void
  selectChronoNode: (nodeId: string) => void
  pulseChronoNode: (nodeId: string, label?: string, intensity?: number) => void
  resetChronoPulses: () => void
  runGauntletTrial: (payload: RunTrialPayload) => void
  syncReasoningFromChallenge: (payload: SyncChallengePayload) => void
  syncInsight: (payload: SyncInsightPayload) => void
  clearInsightFlags: (challengeId?: string) => void
  setTempleOrb: (orb: TempleOrb) => void
  setTempleDrafts: (verseDraft: string, threadDraft: string) => void
  openTempleSession: (orb: TempleOrb) => void
  closeTempleSession: (sessionId: string) => void
  addTempleReflection: (reflection: TempleReflection) => void
  deleteTempleReflection: (id: string) => void
}

const STORAGE_KEY = 'forum2026-realm-state-v2'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function inferTopic(claim: string): string {
  const lowered = claim.toLowerCase()
  if (lowered.includes('tariff')) return 'Tariffs'
  if (lowered.includes('moderation') || lowered.includes('civility')) return 'Moderation'
  return 'General'
}

function initialRealmState(): RealmState {
  return {
    chronoMap: initialChronoMapState,
    reasoning: initialReasoningState,
    insight: initialInsightState,
    temple: initialTempleState,
  }
}

function loadRealmState(): RealmState {
  if (typeof window === 'undefined') return initialRealmState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialRealmState()
    const parsed = JSON.parse(raw) as Partial<RealmState>
    const base = initialRealmState()

    return {
      chronoMap: parsed.chronoMap
        ? {
            ...base.chronoMap,
            ...parsed.chronoMap,
            nodes: parsed.chronoMap.nodes ?? base.chronoMap.nodes,
            edges: parsed.chronoMap.edges ?? base.chronoMap.edges,
            pulses: parsed.chronoMap.pulses ?? base.chronoMap.pulses,
          }
        : base.chronoMap,
      reasoning: parsed.reasoning
        ? {
            ...base.reasoning,
            ...parsed.reasoning,
            modules: parsed.reasoning.modules ?? base.reasoning.modules,
            byChallenge: parsed.reasoning.byChallenge ?? base.reasoning.byChallenge,
          }
        : base.reasoning,
      insight: parsed.insight
        ? {
            ...base.insight,
            ...parsed.insight,
            topicSignals: parsed.insight.topicSignals ?? base.insight.topicSignals,
            disagreementRadar: parsed.insight.disagreementRadar ?? base.insight.disagreementRadar,
            dissonanceFlags: parsed.insight.dissonanceFlags ?? base.insight.dissonanceFlags,
            councilDirectives: parsed.insight.councilDirectives ?? base.insight.councilDirectives,
          }
        : base.insight,
      temple: parsed.temple
        ? {
            ...base.temple,
            ...parsed.temple,
            reflections: parsed.temple.reflections ?? base.temple.reflections,
            sessions: parsed.temple.sessions ?? base.temple.sessions,
            orbStates: parsed.temple.orbStates ?? base.temple.orbStates,
            insightProfile: parsed.temple.insightProfile ?? base.temple.insightProfile,
          }
        : base.temple,
    }
  } catch {
    return initialRealmState()
  }
}

function reducer(state: RealmState, action: RealmAction): RealmState {
  if (action.type.startsWith('chronomap/')) {
    return { ...state, chronoMap: chronoMapReducer(state.chronoMap, action as ChronoMapAction) }
  }
  if (action.type.startsWith('reasoning/')) {
    return { ...state, reasoning: reasoningReducer(state.reasoning, action as ReasoningAction) }
  }
  if (action.type.startsWith('insight/')) {
    return { ...state, insight: insightReducer(state.insight, action as InsightAction) }
  }
  if (action.type.startsWith('temple/')) {
    return { ...state, temple: templeReducer(state.temple, action as TempleAction) }
  }
  return state
}

const RealmContext = createContext<RealmContextValue | null>(null)

export function RealmProvider({ children }: { children: ReactNode }) {
  const { state: forumState } = useForum()
  const [state, dispatch] = useReducer(reducer, undefined, loadRealmState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const activeChallenge =
      forumState.challenges.find(challenge => challenge.id === forumState.activeChallengeId) ?? forumState.challenges[0]
    if (!activeChallenge) return

    const challengeEvidence = forumState.evidence.filter(item => item.challengeId === activeChallenge.id)
    const acceptedEvidence = challengeEvidence.filter(item => item.verdict === 'accepted').length
    const rejectedEvidence = challengeEvidence.filter(item => item.verdict === 'rejected').length

    const challengeComments = forumState.comments.filter(item => item.challengeId === activeChallenge.id)
    const abusiveComments = challengeComments.filter(item => item.tone === 'abusive').length

    const challengeDecisions = forumState.aiDecisions.filter(item => item.challengeId === activeChallenge.id)
    const activePenalties = challengeDecisions.filter(item => item.kind === 'penalty' && item.status !== 'overturned').length

    const unresolvedAppeals = forumState.appeals.filter(
      appeal => appeal.challengeId === activeChallenge.id && appeal.resolution === null,
    ).length

    const challengerTotal = getTotalScore(activeChallenge.scores.challenger)
    const opponentTotal = getTotalScore(activeChallenge.scores.opponent)
    const scoreGap = Math.abs(challengerTotal - opponentTotal)
    const denominator = Math.abs(challengerTotal) + Math.abs(opponentTotal) + 22

    const supportGap = Math.abs(activeChallenge.support.challenger - activeChallenge.support.opponent)
    const disagreement = clamp(Math.round((scoreGap / denominator) * 100 + supportGap * 3), 0, 100)

    const combinedPenalties = activeChallenge.scores.challenger.penalties + activeChallenge.scores.opponent.penalties
    const combinedCivility = activeChallenge.scores.challenger.civility + activeChallenge.scores.opponent.civility
    const combinedFactual = activeChallenge.scores.challenger.factual + activeChallenge.scores.opponent.factual
    const combinedCoherence = activeChallenge.scores.challenger.coherence + activeChallenge.scores.opponent.coherence

    const civilitySignal = clamp(50 + combinedCivility * 1.3 - combinedPenalties * 1.2 - abusiveComments * 5, 0, 100)
    const factualConsensus = clamp(50 + combinedFactual * 1.6 + acceptedEvidence * 5 - rejectedEvidence * 4, 0, 100)
    const consensus = clamp(Math.round(factualConsensus * 0.62 + civilitySignal * 0.38 - disagreement * 0.24), 0, 100)
    const dissonance = clamp(Math.round(100 - consensus + unresolvedAppeals * 8 + activePenalties * 4), 0, 100)

    dispatch({
      type: 'insight/sync',
      payload: {
        challengeId: activeChallenge.id,
        topic: inferTopic(activeChallenge.claim),
        consensus,
        disagreement,
        dissonance,
        factualConsensus,
        unresolvedAppeals,
        abusiveEvents: abusiveComments + activePenalties,
      },
    })

    dispatch({
      type: 'reasoning/sync-from-challenge',
      payload: {
        challengeId: activeChallenge.id,
        civilityScore: civilitySignal,
        factualScore: factualConsensus,
        coherenceScore: clamp(50 + combinedCoherence * 1.4, 0, 100),
        penalties: combinedPenalties,
        audienceScore: activeChallenge.support.challenger - activeChallenge.support.opponent,
      },
    })
  }, [forumState])

  const value = useMemo<RealmContextValue>(
    () => ({
      state,
      setChronoTimeWindow: window => dispatch({ type: 'chronomap/set-time-window', payload: window }),
      selectChronoNode: nodeId => dispatch({ type: 'chronomap/select-node', payload: { nodeId } }),
      pulseChronoNode: (nodeId, label, intensity) =>
        dispatch({ type: 'chronomap/pulse-node', payload: { nodeId, label, intensity } }),
      resetChronoPulses: () => dispatch({ type: 'chronomap/reset-pulses' }),
      runGauntletTrial: payload => dispatch({ type: 'reasoning/run-trial', payload }),
      syncReasoningFromChallenge: payload => dispatch({ type: 'reasoning/sync-from-challenge', payload }),
      syncInsight: payload => dispatch({ type: 'insight/sync', payload }),
      clearInsightFlags: challengeId => dispatch({ type: 'insight/clear-flags', payload: { challengeId } }),
      setTempleOrb: orb => dispatch({ type: 'temple/set-orb', payload: { orb } }),
      setTempleDrafts: (verseDraft, threadDraft) => dispatch({ type: 'temple/set-drafts', payload: { verseDraft, threadDraft } }),
      openTempleSession: orb => dispatch({ type: 'temple/open-session', payload: { orb } }),
      closeTempleSession: sessionId => dispatch({ type: 'temple/close-session', payload: { sessionId } }),
      addTempleReflection: reflection => dispatch({ type: 'temple/add-reflection', payload: { reflection } }),
      deleteTempleReflection: id => dispatch({ type: 'temple/delete-reflection', payload: { id } }),
    }),
    [state],
  )

  return <RealmContext.Provider value={value}>{children}</RealmContext.Provider>
}

export function useRealm(): RealmContextValue {
  const context = useContext(RealmContext)
  if (!context) {
    throw new Error('useRealm must be used inside RealmProvider')
  }
  return context
}

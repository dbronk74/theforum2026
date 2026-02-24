import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

export type Side = 'challenger' | 'opponent'
export type ChallengeStatus = 'open' | 'accepted' | 'declined' | 'no_show' | 'in_prep' | 'live' | 'completed'
export type Tone = 'civil' | 'heated' | 'abusive'
export type FactVerdict = 'verified' | 'needs-evidence' | 'disputed'
export type EvidenceTier = 1 | 2 | 3
export type Outcome = 'challenger_win' | 'opponent_win' | 'draw' | 'declined' | 'no_show'
export type AIDecisionStatus = 'active' | 'appealed' | 'upheld' | 'overturned'

export interface SideScore {
  civility: number
  factual: number
  coherence: number
  audience: number
  penalties: number
}

export interface ChallengeRules {
  prepMinutes: number
  turnSeconds: number
  maxLifelines: number
  injectionCost: number
  stake: number
}

export interface ChallengeEconomy {
  challenger: number
  opponent: number
  viewerPool: number
}

export interface Challenge {
  id: string
  claim: string
  challenger: string
  opponent: string
  status: ChallengeStatus
  createdAt: string
  acceptedAt: string | null
  completedAt: string | null
  rules: ChallengeRules
  lifelines: Record<Side, string[]>
  activeSpeaker: Side
  prepEndsAt: number | null
  turnEndsAt: number | null
  scores: Record<Side, SideScore>
  support: Record<Side, number>
  violations: Record<Side, number>
  economy: ChallengeEconomy
  outcome: Outcome | null
}

export interface TranscriptEntry {
  id: string
  challengeId: string
  speaker: Side
  text: string
  steelman: boolean
  tone: Tone
  factVerdict: FactVerdict
  createdAt: string
}

export interface EvidenceReceipt {
  id: string
  challengeId: string
  side: Side
  submittedBy: 'viewer' | 'lifeline' | 'debater'
  source: string
  note: string
  tier: EvidenceTier
  verdict: 'accepted' | 'rejected'
  reason: string
  createdAt: string
  cost: number
}

export interface AIDecision {
  id: string
  challengeId: string
  kind: 'moderation' | 'fact-check' | 'evidence' | 'penalty'
  subjectSide: Side | null
  targetId: string | null
  summary: string
  rationale: string
  penaltyCredits: number
  status: AIDecisionStatus
  createdAt: string
}

export interface CommentEntry {
  id: string
  challengeId: string
  author: string
  text: string
  tone: Tone
  fine: number
  createdAt: string
}

export interface Appeal {
  id: string
  challengeId: string
  decisionId: string
  requestedBy: string
  statement: string
  createdAt: string
  resolvedAt: string | null
  resolution: 'upheld' | 'overturned' | null
}

export interface LedgerRecord {
  id: string
  challengeId: string
  claim: string
  challenger: string
  opponent: string
  outcome: Outcome
  reason: string
  challengerTotal: number
  opponentTotal: number
  stakesTransferred: number
  timestamp: string
}

export interface ForumState {
  challenges: Challenge[]
  activeChallengeId: string | null
  transcripts: TranscriptEntry[]
  evidence: EvidenceReceipt[]
  aiDecisions: AIDecision[]
  comments: CommentEntry[]
  appeals: Appeal[]
  ledger: LedgerRecord[]
  communityCredits: number
  commenterCredits: Record<string, number>
}

interface CreateChallengeInput {
  challenger: string
  opponent: string
  claim: string
  prepMinutes: number
  turnSeconds: number
  stake: number
  injectionCost: number
}

interface SubmitStatementInput {
  challengeId: string
  side: Side
  text: string
  steelman: boolean
}

interface SubmitEvidenceInput {
  challengeId: string
  side: Side
  submittedBy: 'viewer' | 'lifeline' | 'debater'
  source: string
  note: string
  tier: EvidenceTier
}

type Action =
  | { type: 'create-challenge'; payload: CreateChallengeInput }
  | { type: 'set-active'; payload: { challengeId: string } }
  | { type: 'accept-challenge'; payload: { challengeId: string } }
  | { type: 'decline-challenge'; payload: { challengeId: string; reason: string } }
  | { type: 'mark-no-show'; payload: { challengeId: string; reason: string } }
  | { type: 'start-prep'; payload: { challengeId: string } }
  | { type: 'add-lifeline'; payload: { challengeId: string; side: Side; name: string } }
  | { type: 'start-arena'; payload: { challengeId: string } }
  | { type: 'next-turn'; payload: { challengeId: string } }
  | { type: 'submit-statement'; payload: SubmitStatementInput }
  | { type: 'submit-evidence'; payload: SubmitEvidenceInput }
  | { type: 'add-support'; payload: { challengeId: string; side: Side; delta: number } }
  | { type: 'post-comment'; payload: { challengeId: string; author: string; text: string } }
  | { type: 'request-appeal'; payload: { decisionId: string; requestedBy: string; statement: string } }
  | { type: 'resolve-appeal'; payload: { appealId: string; uphold: boolean } }
  | { type: 'complete-challenge'; payload: { challengeId: string; outcome: Outcome; reason: string } }

interface ForumContextValue {
  state: ForumState
  activeChallenge: Challenge | null
  createChallenge: (input: CreateChallengeInput) => void
  setActiveChallenge: (challengeId: string) => void
  acceptChallenge: (challengeId: string) => void
  declineChallenge: (challengeId: string, reason: string) => void
  markNoShow: (challengeId: string, reason: string) => void
  startPrep: (challengeId: string) => void
  addLifeline: (challengeId: string, side: Side, name: string) => void
  startArena: (challengeId: string) => void
  nextTurn: (challengeId: string) => void
  submitStatement: (input: SubmitStatementInput) => void
  submitEvidence: (input: SubmitEvidenceInput) => void
  addSupport: (challengeId: string, side: Side, delta?: number) => void
  postComment: (challengeId: string, author: string, text: string) => void
  requestAppeal: (decisionId: string, requestedBy: string, statement: string) => void
  resolveAppeal: (appealId: string, uphold: boolean) => void
  completeChallenge: (challengeId: string, outcome: Outcome, reason: string) => void
}

const STORAGE_KEY = 'forum2026-state-v3'
const ABUSIVE_TERMS = [
  'idiot',
  'stupid',
  'moron',
  'hate you',
  'shut up',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'trash',
]

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function emptyScore(): SideScore {
  return { civility: 0, factual: 0, coherence: 0, audience: 0, penalties: 0 }
}

function totalScore(score: SideScore): number {
  return score.civility + score.factual + score.coherence + score.audience - score.penalties
}

export function getTotalScore(score: SideScore): number {
  return totalScore(score)
}

function analyzeTone(text: string): Tone {
  const lowered = text.toLowerCase()
  if (ABUSIVE_TERMS.some(term => lowered.includes(term))) return 'abusive'

  const onlyLetters = text.replace(/[^a-z]/gi, '')
  const upperCount = onlyLetters.replace(/[^A-Z]/g, '').length
  const uppercaseRatio = onlyLetters.length > 0 ? upperCount / onlyLetters.length : 0
  const exclamations = (text.match(/!/g) || []).length

  if (uppercaseRatio > 0.45 || exclamations >= 2) return 'heated'
  return 'civil'
}

function analyzeFact(text: string): FactVerdict {
  const cited = /(https?:\/\/|www\.|\.gov|\.edu|study|report|data|according to|census|bls)/i.test(text)
  if (cited) return 'verified'
  if (/\d/.test(text)) return 'needs-evidence'
  if (/(always|never|everyone|nobody|all of them|every single)/i.test(text)) return 'disputed'
  return 'verified'
}

function evaluateEvidence(source: string, note: string, tier: EvidenceTier): { verdict: 'accepted' | 'rejected'; reason: string } {
  const hasUrl = /(https?:\/\/|www\.)/i.test(source)
  const trusted = /(\.gov|\.edu|reuters|apnews|who\.int|census\.gov|bls\.gov)/i.test(source)

  if (tier === 1 && (trusted || hasUrl)) {
    return { verdict: 'accepted', reason: 'Primary or institution-grade source accepted.' }
  }
  if (tier === 2 && hasUrl) {
    return { verdict: 'accepted', reason: 'Secondary source accepted with traceable citation.' }
  }
  if (tier === 3 && hasUrl && note.trim().length >= 50) {
    return { verdict: 'accepted', reason: 'Opinion source accepted with full contextual note.' }
  }
  return { verdict: 'rejected', reason: 'Insufficient citation quality for factual receipt window.' }
}

function finalizeChallenge(
  state: ForumState,
  challenge: Challenge,
  outcome: Outcome,
  reason: string,
  stakesTransferred: number,
): ForumState {
  const existing = state.ledger.some(record => record.challengeId === challenge.id)
  if (existing) return state

  const challengerTotal = totalScore(challenge.scores.challenger)
  const opponentTotal = totalScore(challenge.scores.opponent)
  const entry: LedgerRecord = {
    id: createId('ledger'),
    challengeId: challenge.id,
    claim: challenge.claim,
    challenger: challenge.challenger,
    opponent: challenge.opponent,
    outcome,
    reason,
    challengerTotal,
    opponentTotal,
    stakesTransferred,
    timestamp: nowIso(),
  }
  return { ...state, ledger: [entry, ...state.ledger] }
}

function initialState(): ForumState {
  const seed: Challenge = {
    id: 'challenge-seed-1',
    claim: 'Should national policy debates require public evidence receipts and AI civility enforcement?',
    challenger: 'CivicTorch',
    opponent: 'CivicMirror',
    status: 'open',
    createdAt: nowIso(),
    acceptedAt: null,
    completedAt: null,
    rules: { prepMinutes: 12, turnSeconds: 90, maxLifelines: 3, injectionCost: 2, stake: 30 },
    lifelines: { challenger: [], opponent: [] },
    activeSpeaker: 'challenger',
    prepEndsAt: null,
    turnEndsAt: null,
    scores: { challenger: emptyScore(), opponent: emptyScore() },
    support: { challenger: 0, opponent: 0 },
    violations: { challenger: 0, opponent: 0 },
    economy: { challenger: 120, opponent: 120, viewerPool: 300 },
    outcome: null,
  }

  return {
    challenges: [seed],
    activeChallengeId: seed.id,
    transcripts: [],
    evidence: [],
    aiDecisions: [],
    comments: [],
    appeals: [],
    ledger: [],
    communityCredits: 600,
    commenterCredits: {},
  }
}

function loadState(): ForumState {
  if (typeof window === 'undefined') return initialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as ForumState
    if (!parsed || !Array.isArray(parsed.challenges)) return initialState()
    return parsed
  } catch {
    return initialState()
  }
}

function reducer(state: ForumState, action: Action): ForumState {
  switch (action.type) {
    case 'create-challenge': {
      const payload = action.payload
      const challenge: Challenge = {
        id: createId('challenge'),
        claim: payload.claim.trim(),
        challenger: payload.challenger.trim(),
        opponent: payload.opponent.trim(),
        status: 'open',
        createdAt: nowIso(),
        acceptedAt: null,
        completedAt: null,
        rules: {
          prepMinutes: payload.prepMinutes,
          turnSeconds: payload.turnSeconds,
          maxLifelines: 3,
          injectionCost: payload.injectionCost,
          stake: payload.stake,
        },
        lifelines: { challenger: [], opponent: [] },
        activeSpeaker: 'challenger',
        prepEndsAt: null,
        turnEndsAt: null,
        scores: { challenger: emptyScore(), opponent: emptyScore() },
        support: { challenger: 0, opponent: 0 },
        violations: { challenger: 0, opponent: 0 },
        economy: { challenger: 120, opponent: 120, viewerPool: 300 },
        outcome: null,
      }
      return { ...state, challenges: [challenge, ...state.challenges], activeChallengeId: challenge.id }
    }

    case 'set-active':
      return { ...state, activeChallengeId: action.payload.challengeId }

    case 'accept-challenge': {
      const { challengeId } = action.payload
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId || challenge.status !== 'open') return challenge
        const stake = challenge.rules.stake
        return {
          ...challenge,
          status: 'accepted' as const,
          acceptedAt: nowIso(),
          economy: {
            ...challenge.economy,
            challenger: Math.max(0, challenge.economy.challenger - stake),
            opponent: Math.max(0, challenge.economy.opponent - stake),
          },
        }
      })
      return { ...state, challenges, activeChallengeId: challengeId }
    }

    case 'decline-challenge': {
      const { challengeId, reason } = action.payload
      const changed = state.challenges.find(c => c.id === challengeId)
      if (!changed) return state
      const challenges = state.challenges.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, status: 'declined' as const, completedAt: nowIso(), outcome: 'declined' as const }
          : challenge,
      )
      return finalizeChallenge(
        { ...state, challenges },
        { ...changed, status: 'declined', outcome: 'declined', completedAt: nowIso() },
        'declined',
        reason,
        0,
      )
    }

    case 'mark-no-show': {
      const { challengeId, reason } = action.payload
      const changed = state.challenges.find(c => c.id === challengeId)
      if (!changed) return state
      const challenges = state.challenges.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, status: 'no_show' as const, completedAt: nowIso(), outcome: 'no_show' as const }
          : challenge,
      )
      return finalizeChallenge(
        { ...state, challenges, activeChallengeId: state.activeChallengeId === challengeId ? null : state.activeChallengeId },
        { ...changed, status: 'no_show', outcome: 'no_show', completedAt: nowIso() },
        'no_show',
        reason,
        changed.rules.stake,
      )
    }

    case 'start-prep': {
      const { challengeId } = action.payload
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId || (challenge.status !== 'accepted' && challenge.status !== 'in_prep')) return challenge
        return {
          ...challenge,
          status: 'in_prep' as const,
          prepEndsAt: Date.now() + challenge.rules.prepMinutes * 60_000,
        }
      })
      return { ...state, challenges, activeChallengeId: challengeId }
    }

    case 'add-lifeline': {
      const { challengeId, side, name } = action.payload
      const trimmed = name.trim()
      if (!trimmed) return state
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId) return challenge
        const existing = challenge.lifelines[side]
        if (existing.includes(trimmed) || existing.length >= challenge.rules.maxLifelines) return challenge
        return {
          ...challenge,
          lifelines: {
            ...challenge.lifelines,
            [side]: [...existing, trimmed],
          },
        }
      })
      return { ...state, challenges }
    }

    case 'start-arena': {
      const { challengeId } = action.payload
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId || (challenge.status !== 'in_prep' && challenge.status !== 'accepted' && challenge.status !== 'live')) {
          return challenge
        }
        return {
          ...challenge,
          status: 'live' as const,
          turnEndsAt: Date.now() + challenge.rules.turnSeconds * 1000,
          prepEndsAt: challenge.prepEndsAt,
          activeSpeaker: challenge.activeSpeaker ?? 'challenger',
        }
      })
      return { ...state, challenges, activeChallengeId: challengeId }
    }

    case 'next-turn': {
      const { challengeId } = action.payload
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId || challenge.status !== 'live') return challenge
        const nextSpeaker: Side = challenge.activeSpeaker === 'challenger' ? 'opponent' : 'challenger'
        return {
          ...challenge,
          activeSpeaker: nextSpeaker,
          turnEndsAt: Date.now() + challenge.rules.turnSeconds * 1000,
        }
      })
      return { ...state, challenges }
    }

    case 'submit-statement': {
      const { challengeId, side, text, steelman } = action.payload
      const body = text.trim()
      if (!body) return state
      const challenge = state.challenges.find(item => item.id === challengeId)
      if (!challenge || challenge.status !== 'live') return state
      if (challenge.violations[side] >= 3) return state

      const tone = analyzeTone(body)
      const factVerdict = analyzeFact(body)
      const timestamp = nowIso()
      const transcript: TranscriptEntry = {
        id: createId('line'),
        challengeId,
        speaker: side,
        text: body,
        steelman,
        tone,
        factVerdict,
        createdAt: timestamp,
      }

      const civilityDelta = tone === 'civil' ? 2 : tone === 'heated' ? -2 : -8
      const factualDelta = factVerdict === 'verified' ? 2 : factVerdict === 'needs-evidence' ? 0 : -2
      const coherenceDelta = steelman ? 2 : -1
      const penaltyDelta = tone === 'abusive' ? 8 : 0
      const penaltyCredits = tone === 'abusive' ? 8 : 0

      const decisions: AIDecision[] = []
      if (tone !== 'civil') {
        decisions.push({
          id: createId('decision'),
          challengeId,
          kind: tone === 'abusive' ? 'penalty' : 'moderation',
          subjectSide: side,
          targetId: transcript.id,
          summary: tone === 'abusive' ? 'Abusive language detected. Credit fine applied.' : 'Heated tone detected. Formal warning issued.',
          rationale: 'Civility policy requires argument-focused language and disallows personal attacks.',
          penaltyCredits,
          status: 'active',
          createdAt: timestamp,
        })
      }
      if (factVerdict !== 'verified') {
        decisions.push({
          id: createId('decision'),
          challengeId,
          kind: 'fact-check',
          subjectSide: side,
          targetId: transcript.id,
          summary: factVerdict === 'needs-evidence' ? 'Claim requires citation before it can influence consensus.' : 'Claim marked disputed pending stronger evidence.',
          rationale: 'Quantitative or universal claims require verifiable receipts.',
          penaltyCredits: 0,
          status: 'active',
          createdAt: timestamp,
        })
      }

      const challenges = state.challenges.map(item => {
        if (item.id !== challengeId) return item
        const updated = { ...item }
        const updatedScores = {
          ...updated.scores[side],
          civility: updated.scores[side].civility + civilityDelta,
          factual: updated.scores[side].factual + factualDelta,
          coherence: updated.scores[side].coherence + coherenceDelta,
          penalties: updated.scores[side].penalties + penaltyDelta,
        }
        const nextViolations = updated.violations[side] + (tone === 'abusive' ? 1 : 0)
        const nextCredits = Math.max(0, updated.economy[side] - penaltyCredits)
        return {
          ...updated,
          scores: { ...updated.scores, [side]: updatedScores },
          violations: { ...updated.violations, [side]: nextViolations },
          economy: { ...updated.economy, [side]: nextCredits },
        }
      })

      return {
        ...state,
        challenges,
        transcripts: [transcript, ...state.transcripts],
        aiDecisions: [...decisions, ...state.aiDecisions],
      }
    }

    case 'submit-evidence': {
      const { challengeId, side, submittedBy, source, note, tier } = action.payload
      const challenge = state.challenges.find(item => item.id === challengeId)
      if (!challenge) return state
      const evaluated = evaluateEvidence(source, note, tier)
      const cost = submittedBy === 'viewer' ? challenge.rules.injectionCost : Math.max(1, challenge.rules.injectionCost - 1)
      const receipt: EvidenceReceipt = {
        id: createId('receipt'),
        challengeId,
        side,
        submittedBy,
        source: source.trim(),
        note: note.trim(),
        tier,
        verdict: evaluated.verdict,
        reason: evaluated.reason,
        createdAt: nowIso(),
        cost,
      }

      const challenges = state.challenges.map(item => {
        if (item.id !== challengeId) return item
        const next = { ...item }
        const sideScore = { ...next.scores[side] }
        const nextEconomy = { ...next.economy }

        if (submittedBy === 'viewer') {
          nextEconomy.viewerPool = Math.max(0, nextEconomy.viewerPool - cost)
        } else {
          nextEconomy[side] = Math.max(0, nextEconomy[side] - cost)
        }

        if (evaluated.verdict === 'accepted') {
          sideScore.factual += tier === 1 ? 3 : tier === 2 ? 2 : 1
          sideScore.coherence += 1
        } else {
          sideScore.penalties += 1
          if (submittedBy !== 'viewer') {
            nextEconomy[side] = Math.max(0, nextEconomy[side] - 1)
          }
        }

        return {
          ...next,
          scores: { ...next.scores, [side]: sideScore },
          economy: nextEconomy,
        }
      })

      const decision: AIDecision = {
        id: createId('decision'),
        challengeId,
        kind: 'evidence',
        subjectSide: side,
        targetId: receipt.id,
        summary: evaluated.verdict === 'accepted' ? 'Evidence accepted into public receipt window.' : 'Evidence rejected for low source quality.',
        rationale: evaluated.reason,
        penaltyCredits: 0,
        status: 'active',
        createdAt: nowIso(),
      }

      return {
        ...state,
        challenges,
        evidence: [receipt, ...state.evidence],
        aiDecisions: [decision, ...state.aiDecisions],
        communityCredits: submittedBy === 'viewer' ? Math.max(0, state.communityCredits - cost) : state.communityCredits,
      }
    }

    case 'add-support': {
      const { challengeId, side, delta } = action.payload
      const challenges = state.challenges.map(challenge => {
        if (challenge.id !== challengeId) return challenge
        return {
          ...challenge,
          support: { ...challenge.support, [side]: challenge.support[side] + delta },
          scores: {
            ...challenge.scores,
            [side]: { ...challenge.scores[side], audience: challenge.scores[side].audience + delta },
          },
        }
      })
      return { ...state, challenges }
    }

    case 'post-comment': {
      const { challengeId, author, text } = action.payload
      const commentText = text.trim()
      const poster = author.trim()
      if (!commentText || !poster) return state
      const tone = analyzeTone(commentText)
      const fine = tone === 'abusive' ? 5 : tone === 'heated' ? 2 : 0
      const nextBalance = Math.max(0, (state.commenterCredits[poster] ?? 25) - fine)
      const comment: CommentEntry = {
        id: createId('comment'),
        challengeId,
        author: poster,
        text: commentText,
        tone,
        fine,
        createdAt: nowIso(),
      }
      const aiDecisions = fine > 0
        ? [
            {
              id: createId('decision'),
              challengeId,
              kind: 'penalty',
              subjectSide: null,
              targetId: comment.id,
              summary: `Comment fine issued to ${poster}: -${fine} credits.`,
              rationale: 'Comment stream requires civil and evidence-oriented language.',
              penaltyCredits: fine,
              status: 'active',
              createdAt: nowIso(),
            } satisfies AIDecision,
            ...state.aiDecisions,
          ]
        : state.aiDecisions

      return {
        ...state,
        comments: [comment, ...state.comments],
        aiDecisions,
        communityCredits: state.communityCredits + fine,
        commenterCredits: { ...state.commenterCredits, [poster]: nextBalance },
      }
    }

    case 'request-appeal': {
      const { decisionId, requestedBy, statement } = action.payload
      const decision = state.aiDecisions.find(item => item.id === decisionId)
      if (!decision || decision.status !== 'active') return state

      const appeals = [
        {
          id: createId('appeal'),
          challengeId: decision.challengeId,
          decisionId,
          requestedBy,
          statement: statement.trim(),
          createdAt: nowIso(),
          resolvedAt: null,
          resolution: null,
        } satisfies Appeal,
        ...state.appeals,
      ]
      const aiDecisions = state.aiDecisions.map(item => (item.id === decisionId ? { ...item, status: 'appealed' as const } : item))
      return { ...state, aiDecisions, appeals }
    }

    case 'resolve-appeal': {
      const { appealId, uphold } = action.payload
      const appeal = state.appeals.find(item => item.id === appealId)
      if (!appeal || appeal.resolution) return state

      const decision = state.aiDecisions.find(item => item.id === appeal.decisionId)
      if (!decision) return state

      let challenges = state.challenges
      if (!uphold && decision.subjectSide && decision.penaltyCredits > 0) {
        challenges = state.challenges.map(challenge => {
          if (challenge.id !== decision.challengeId) return challenge
          const side = decision.subjectSide as Side
          return {
            ...challenge,
            economy: { ...challenge.economy, [side]: challenge.economy[side] + decision.penaltyCredits },
            scores: {
              ...challenge.scores,
              [side]: {
                ...challenge.scores[side],
                penalties: Math.max(0, challenge.scores[side].penalties - decision.penaltyCredits),
              },
            },
            violations: {
              ...challenge.violations,
              [side]: Math.max(0, challenge.violations[side] - 1),
            },
          }
        })
      }

      const aiDecisions = state.aiDecisions.map(item =>
        item.id === decision.id ? { ...item, status: uphold ? ('upheld' as const) : ('overturned' as const) } : item,
      )
      const appeals = state.appeals.map(item =>
        item.id === appealId
          ? { ...item, resolution: uphold ? ('upheld' as const) : ('overturned' as const), resolvedAt: nowIso() }
          : item,
      )
      return { ...state, challenges, aiDecisions, appeals }
    }

    case 'complete-challenge': {
      const { challengeId, outcome, reason } = action.payload
      const challenge = state.challenges.find(item => item.id === challengeId)
      if (!challenge) return state

      const pool = challenge.rules.stake * 2
      const challenges = state.challenges.map(item => {
        if (item.id !== challengeId) return item
        const next = {
          ...item,
          status: 'completed' as const,
          completedAt: nowIso(),
          turnEndsAt: null,
          prepEndsAt: item.prepEndsAt,
          outcome,
          economy: { ...item.economy },
        }
        if (outcome === 'challenger_win') {
          next.economy.challenger += pool
        } else if (outcome === 'opponent_win') {
          next.economy.opponent += pool
        } else if (outcome === 'draw') {
          next.economy.challenger += item.rules.stake
          next.economy.opponent += item.rules.stake
        }
        return next
      })

      const nextState: ForumState = {
        ...state,
        challenges,
        activeChallengeId: state.activeChallengeId === challengeId ? null : state.activeChallengeId,
      }
      const finalizedChallenge = challenges.find(item => item.id === challengeId)
      if (!finalizedChallenge) return nextState
      return finalizeChallenge(nextState, finalizedChallenge, outcome, reason, pool)
    }
  }
}

const ForumContext = createContext<ForumContextValue | null>(null)

export function ForumProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const activeChallenge = useMemo(
    () => state.challenges.find(challenge => challenge.id === state.activeChallengeId) ?? null,
    [state.activeChallengeId, state.challenges],
  )

  const value = useMemo<ForumContextValue>(
    () => ({
      state,
      activeChallenge,
      createChallenge: input => dispatch({ type: 'create-challenge', payload: input }),
      setActiveChallenge: challengeId => dispatch({ type: 'set-active', payload: { challengeId } }),
      acceptChallenge: challengeId => dispatch({ type: 'accept-challenge', payload: { challengeId } }),
      declineChallenge: (challengeId, reason) => dispatch({ type: 'decline-challenge', payload: { challengeId, reason } }),
      markNoShow: (challengeId, reason) => dispatch({ type: 'mark-no-show', payload: { challengeId, reason } }),
      startPrep: challengeId => dispatch({ type: 'start-prep', payload: { challengeId } }),
      addLifeline: (challengeId, side, name) => dispatch({ type: 'add-lifeline', payload: { challengeId, side, name } }),
      startArena: challengeId => dispatch({ type: 'start-arena', payload: { challengeId } }),
      nextTurn: challengeId => dispatch({ type: 'next-turn', payload: { challengeId } }),
      submitStatement: input => dispatch({ type: 'submit-statement', payload: input }),
      submitEvidence: input => dispatch({ type: 'submit-evidence', payload: input }),
      addSupport: (challengeId, side, delta = 1) => dispatch({ type: 'add-support', payload: { challengeId, side, delta } }),
      postComment: (challengeId, author, text) => dispatch({ type: 'post-comment', payload: { challengeId, author, text } }),
      requestAppeal: (decisionId, requestedBy, statement) =>
        dispatch({ type: 'request-appeal', payload: { decisionId, requestedBy, statement } }),
      resolveAppeal: (appealId, uphold) => dispatch({ type: 'resolve-appeal', payload: { appealId, uphold } }),
      completeChallenge: (challengeId, outcome, reason) =>
        dispatch({ type: 'complete-challenge', payload: { challengeId, outcome, reason } }),
    }),
    [activeChallenge, state],
  )

  return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>
}

export function useForum(): ForumContextValue {
  const context = useContext(ForumContext)
  if (!context) {
    throw new Error('useForum must be used inside ForumProvider')
  }
  return context
}


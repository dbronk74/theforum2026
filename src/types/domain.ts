export type NodeKind = 'claim' | 'rebuttal' | 'evidence' | 'consensus'

export interface MoralCoordinate {
  evidence: number
  civility: number
}

export interface ChronoNode {
  id: string
  title: string
  excerpt: string
  kind: NodeKind
  topic: string
  author: string
  createdAt: string
  timelineIndex: number
  position: {
    x: number
    y: number
  }
  moral: MoralCoordinate
  resonance: number
  confidence: number
}

export interface ChronoEdge {
  id: string
  from: string
  to: string
  relation: 'supports' | 'rebuts' | 'clarifies'
  weight: number
}

export interface PulseEvent {
  id: string
  nodeId: string
  label: string
  intensity: number
  timestamp: string
}

export interface GauntletTrialResult {
  challengeId: string
  stability: number
  heat: number
  badgesAwarded: string[]
  relicsUnlocked: string[]
  spectatorPulseDelta: number
}

export interface ConsensusSnapshot {
  id: string
  topic: string
  consensus: number
  disagreement: number
  dissonance: number
  timestamp: string
}

export interface TempleReflection {
  id: string
  orb: 'Clarity' | 'Empathy' | 'Resolve'
  verse: string
  thread: string
  createdAt: string
}


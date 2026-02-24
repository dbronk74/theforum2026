import { CHRONOMAP_EDGES, CHRONOMAP_NODES } from '@/data/chronomapSeed'
import type { ChronoEdge, ChronoNode, PulseEvent } from '@/types/domain'

export type ChronoTimeWindow = 'all' | 'tariffs' | 'moderation'

export interface ChronoMapState {
  nodes: ChronoNode[]
  edges: ChronoEdge[]
  timeWindow: ChronoTimeWindow
  selectedNodeId: string
  pulses: PulseEvent[]
  lastInteractionAt: string | null
}

export type ChronoMapAction =
  | { type: 'chronomap/set-time-window'; payload: ChronoTimeWindow }
  | { type: 'chronomap/select-node'; payload: { nodeId: string } }
  | { type: 'chronomap/pulse-node'; payload: { nodeId: string; label?: string; intensity?: number } }
  | { type: 'chronomap/reset-pulses' }

const MAX_PULSES = 16

function createPulseId(): string {
  return `pulse-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeTopic(topic: string): ChronoTimeWindow {
  const lowered = topic.toLowerCase()
  if (lowered.includes('tariff')) return 'tariffs'
  if (lowered.includes('moderation')) return 'moderation'
  return 'all'
}

function defaultNodeId(): string {
  return CHRONOMAP_NODES[0]?.id ?? ''
}

export const initialChronoMapState: ChronoMapState = {
  nodes: CHRONOMAP_NODES,
  edges: CHRONOMAP_EDGES,
  timeWindow: 'all',
  selectedNodeId: defaultNodeId(),
  pulses: [],
  lastInteractionAt: null,
}

export function chronoMapReducer(state: ChronoMapState, action: ChronoMapAction): ChronoMapState {
  switch (action.type) {
    case 'chronomap/set-time-window':
      return { ...state, timeWindow: action.payload }

    case 'chronomap/select-node':
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
        lastInteractionAt: new Date().toISOString(),
      }

    case 'chronomap/pulse-node': {
      const node = state.nodes.find(item => item.id === action.payload.nodeId)
      if (!node) return state

      const pulse: PulseEvent = {
        id: createPulseId(),
        nodeId: node.id,
        label: action.payload.label ?? `Pulse from ${node.author}`,
        intensity: action.payload.intensity ?? Math.max(8, Math.round(node.resonance)),
        timestamp: new Date().toISOString(),
      }

      return {
        ...state,
        selectedNodeId: node.id,
        pulses: [pulse, ...state.pulses].slice(0, MAX_PULSES),
        lastInteractionAt: pulse.timestamp,
      }
    }

    case 'chronomap/reset-pulses':
      return { ...state, pulses: [] }
  }
}

export function getFilteredChronoNodes(state: ChronoMapState): ChronoNode[] {
  if (state.timeWindow === 'all') return state.nodes
  return state.nodes.filter(node => normalizeTopic(node.topic) === state.timeWindow)
}

export function getFilteredChronoEdges(state: ChronoMapState): ChronoEdge[] {
  const nodeIds = new Set(getFilteredChronoNodes(state).map(node => node.id))
  return state.edges.filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to))
}

export function getSelectedChronoNode(state: ChronoMapState): ChronoNode | undefined {
  return state.nodes.find(node => node.id === state.selectedNodeId)
}

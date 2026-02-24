import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import { getFilteredChronoEdges, getFilteredChronoNodes, getSelectedChronoNode } from '@/store/chronoMapSlice'
import { useRealm } from '@/store/realmState'
import type { ChronoNode } from '@/types/domain'

type IntroPhase = 'intro' | 'flash' | 'live'

function relationColor(relation: 'supports' | 'rebuts' | 'clarifies'): string {
  if (relation === 'supports') return 'rgba(72, 255, 214, 0.8)'
  if (relation === 'rebuts') return 'rgba(255, 120, 120, 0.8)'
  return 'rgba(140, 180, 255, 0.8)'
}

function nodeColor(kind: ChronoNode['kind']): string {
  if (kind === 'claim') return 'from-cyan-500/80 to-sky-700/80'
  if (kind === 'rebuttal') return 'from-rose-500/80 to-orange-700/80'
  if (kind === 'evidence') return 'from-emerald-500/80 to-teal-700/80'
  return 'from-violet-500/80 to-indigo-700/80'
}

export default function ChronoMap() {
  const navigate = useNavigate()
  const {
    state: realmState,
    setChronoTimeWindow,
    pulseChronoNode,
  } = useRealm()

  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')
  const [needleHistory, setNeedleHistory] = useState<Array<{ evidence: number; civility: number }>>([])

  const chronoMap = realmState.chronoMap
  const filteredNodes = useMemo(() => getFilteredChronoNodes(chronoMap), [chronoMap])
  const filteredEdges = useMemo(() => getFilteredChronoEdges(chronoMap), [chronoMap])
  const selectedNode = getSelectedChronoNode(chronoMap) ?? filteredNodes[0]

  useEffect(() => {
    if (introPhase !== 'flash') return
    const timer = window.setTimeout(() => setIntroPhase('live'), 700)
    return () => window.clearTimeout(timer)
  }, [introPhase])

  useEffect(() => {
    if (!selectedNode) return
    setNeedleHistory(previous => {
      const next = [...previous, selectedNode.moral]
      return next.slice(-12)
    })
  }, [selectedNode?.id])

  useEffect(() => {
    if (!selectedNode && filteredNodes[0]) {
      pulseChronoNode(filteredNodes[0].id)
    }
  }, [filteredNodes, pulseChronoNode, selectedNode])

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        {introPhase === 'intro' ? (
          <>
            <video
              src="/videos/chronomap-intro.mp4"
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('flash')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,9,18,0.72)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Opening ChronoMap Chamber
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('flash')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(160,245,255,0.96),rgba(20,200,255,0.86)_52%,rgba(2,10,30,0.95)_100%)]" />
        )}
      </div>
    )
  }

  if (!selectedNode) {
    return (
      <div className="page space-y-4">
        <h1 className="text-3xl font-display neon-text text-cyan-300">ChronoMap Chamber</h1>
        <Card>
          <CardBody>
            <p className="text-gray-300">No ChronoMap nodes are available yet.</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  function triggerPulse(node: ChronoNode) {
    pulseChronoNode(node.id, `Pulse from ${node.author}`, Math.round(node.resonance))
  }

  const globalSignals = Object.values(realmState.insight.topicSignals)

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">ChronoMap Chamber</h1>
        <p className="text-sm text-gray-300">
          Navigate argument evolution over time with pulse glow events, resonance rings, and semantic route handoffs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-base text-cyan-200">Time Window</div>
            <div className="flex gap-2">
              <Button variant={chronoMap.timeWindow === 'all' ? 'muted' : 'ghost'} onClick={() => setChronoTimeWindow('all')}>All Threads</Button>
              <Button variant={chronoMap.timeWindow === 'tariffs' ? 'muted' : 'ghost'} onClick={() => setChronoTimeWindow('tariffs')}>Tariffs</Button>
              <Button variant={chronoMap.timeWindow === 'moderation' ? 'muted' : 'ghost'} onClick={() => setChronoTimeWindow('moderation')}>Moderation</Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="relative h-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_35%_20%,rgba(0,212,255,0.24),rgba(5,8,18,0.95)_72%)]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {filteredEdges.map(edge => {
                const from = chronoMap.nodes.find(node => node.id === edge.from)
                const to = chronoMap.nodes.find(node => node.id === edge.to)
                if (!from || !to) return null
                return (
                  <line
                    key={edge.id}
                    x1={from.position.x}
                    y1={from.position.y}
                    x2={to.position.x}
                    y2={to.position.y}
                    stroke={relationColor(edge.relation)}
                    strokeWidth={Math.max(0.3, edge.weight * 0.7)}
                    strokeDasharray={edge.relation === 'clarifies' ? '2 1.5' : undefined}
                    opacity={0.9}
                  />
                )
              })}
            </svg>

            {filteredNodes.map(node => {
              const active = node.id === selectedNode.id
              return (
                <button
                  key={node.id}
                  onClick={() => triggerPulse(node)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }}
                >
                  <span className={`block rounded-2xl border px-3 py-2 text-left text-xs text-white shadow-xl backdrop-blur ${active ? 'border-cyan-200/90' : 'border-white/20'} bg-gradient-to-br ${nodeColor(node.kind)}`}>
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-cyan-100/90">{node.kind}</span>
                    <span className="mt-1 block max-w-[160px]">{node.title}</span>
                  </span>
                  {active ? (
                    <>
                      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-cyan-200/70 animate-ping" />
                      <span className="pointer-events-none absolute -inset-2 rounded-3xl border border-cyan-300/40" />
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </CardBody>
        <CardFooter>
          <div className="text-xs text-gray-400">
            Click any node to trigger pulse glow, update moral needle trajectory, and open semantic thread view.
          </div>
        </CardFooter>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Semantic Thread Lens</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-cyan-100">{selectedNode.title}</div>
            <p className="mt-2 text-xs text-gray-300">{selectedNode.excerpt}</p>
            <div className="mt-3 grid gap-2 text-xs text-gray-400">
              <div>Author: {selectedNode.author}</div>
              <div>Topic: {selectedNode.topic}</div>
              <div>Resonance: {selectedNode.resonance}</div>
              <div>Confidence: {selectedNode.confidence}</div>
            </div>
          </CardBody>
          <CardFooter>
            <Button onClick={() => navigate(`/forum/${selectedNode.id}`)}>Open /forum/{selectedNode.id}</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Compass Moral Coordinate</div>
          </CardHeader>
          <CardBody>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-gray-400">Moral Needle</div>
              <div className="mt-1 text-sm text-cyan-100">
                Evidence {selectedNode.moral.evidence} / Civility {selectedNode.moral.civility}
              </div>
              <svg viewBox="0 0 100 60" className="mt-3 h-20 w-full">
                <polyline
                  fill="none"
                  stroke="rgba(0,212,255,0.9)"
                  strokeWidth="2"
                  points={needleHistory
                    .map((item, index) => `${(index / Math.max(1, needleHistory.length - 1)) * 98 + 1},${58 - (item.evidence + item.civility) / 4}`)
                    .join(' ')}
                />
              </svg>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-gray-400">Insight Wheel</div>
              <div
                className="mt-3 h-28 w-28 rounded-full border border-cyan-300/40"
                style={{
                  background: `conic-gradient(
                    rgba(0,212,255,0.75) 0deg ${selectedNode.moral.evidence * 1.8}deg,
                    rgba(255,90,150,0.7) ${selectedNode.moral.evidence * 1.8}deg ${(selectedNode.moral.evidence + selectedNode.moral.civility) * 1.8}deg,
                    rgba(120,255,184,0.7) ${(selectedNode.moral.evidence + selectedNode.moral.civility) * 1.8}deg ${selectedNode.resonance * 3.6}deg,
                    rgba(255,212,110,0.7) ${selectedNode.resonance * 3.6}deg 360deg
                  )`,
                }}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Pulse + Consensus Feed</div>
          </CardHeader>
          <CardBody>
            <div className="max-h-[230px] space-y-2 overflow-auto pr-1">
              {chronoMap.pulses.length === 0 ? <div className="text-sm text-gray-500">No pulse events yet.</div> : null}
              {chronoMap.pulses.map(event => (
                <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs">
                  <div className="text-gray-200">{event.label}</div>
                  <div className="text-gray-500">Intensity {event.intensity}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
              <div className="text-cyan-100">Forum Global Pulse: {realmState.insight.forumGlobalPulse}</div>
              {globalSignals.slice(0, 3).map(signal => (
                <div key={signal.topic} className="mt-2 text-gray-300">
                  {signal.topic}: consensus {signal.consensus} | disagreement {signal.disagreement} | dissonance {signal.dissonance}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

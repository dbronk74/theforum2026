import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { CHRONOMAP_EDGES, CHRONOMAP_NODES } from '@/data/chronomapSeed'
import { useForum } from '@/state/forumState'

type Lens = 'balanced' | 'evidence' | 'civility' | 'coherence'

function scoreForLens(base: number, lens: Lens): number {
  if (lens === 'evidence') return Math.min(100, base + 9)
  if (lens === 'civility') return Math.min(100, base + 6)
  if (lens === 'coherence') return Math.min(100, base + 4)
  return base
}

export default function ForumThread() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { activeChallenge, addSupport } = useForum()
  const [lens, setLens] = useState<Lens>('balanced')
  const [analysisNote, setAnalysisNote] = useState('')

  const node = CHRONOMAP_NODES.find(item => item.id === id) ?? null

  const linkedNodes = useMemo(() => {
    if (!node) return []
    const linkedIds = CHRONOMAP_EDGES
      .filter(edge => edge.from === node.id || edge.to === node.id)
      .flatMap(edge => [edge.from, edge.to])
      .filter(value => value !== node.id)
    return CHRONOMAP_NODES.filter(item => linkedIds.includes(item.id))
  }, [node])

  if (!node) {
    return (
      <div className="page space-y-4">
        <h1 className="text-3xl font-display neon-text text-cyan-300">Semantic Thread Lens</h1>
        <Card>
          <CardBody>
            <p className="text-gray-300">Thread not found.</p>
            <div className="mt-3">
              <Button onClick={() => navigate('/chronomap')}>Back to ChronoMap</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const evidenceScore = scoreForLens(node.moral.evidence, lens)
  const civilityScore = scoreForLens(node.moral.civility, lens)
  const coherenceScore = scoreForLens(Math.round((node.confidence + node.resonance) / 2), lens)

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Semantic Thread Lens</h1>
        <p className="text-sm text-gray-300">Thread ID: {node.id}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg text-cyan-200">{node.title}</div>
              <div className="text-xs text-gray-400">{node.excerpt}</div>
            </div>
            <span className="rounded-2xl bg-white/10 px-2 py-1 text-xs">{node.kind}</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            <Button variant={lens === 'balanced' ? 'muted' : 'ghost'} onClick={() => setLens('balanced')}>Balanced Lens</Button>
            <Button variant={lens === 'evidence' ? 'muted' : 'ghost'} onClick={() => setLens('evidence')}>Evidence Lens</Button>
            <Button variant={lens === 'civility' ? 'muted' : 'ghost'} onClick={() => setLens('civility')}>Civility Lens</Button>
            <Button variant={lens === 'coherence' ? 'muted' : 'ghost'} onClick={() => setLens('coherence')}>Coherence Lens</Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MetricCard label="Evidence Quality" value={evidenceScore} />
            <MetricCard label="Civility Signal" value={civilityScore} />
            <MetricCard label="Rebuttal Coherence" value={coherenceScore} />
          </div>

          <textarea
            value={analysisNote}
            onChange={event => setAnalysisNote(event.target.value)}
            placeholder="Annotate this thread's strongest argument and weak point."
            className="mt-4 w-full min-h-[110px] rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
          />
        </CardBody>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (activeChallenge) {
                  addSupport(activeChallenge.id, 'challenger', 1)
                }
                navigate('/arena')
              }}
            >
              Feed Signal to Arena HUD
            </Button>
            <Button variant="ghost" onClick={() => navigate('/chronomap')}>Back to ChronoMap</Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-base text-cyan-200">Linked Arguments</div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {linkedNodes.length === 0 ? <div className="text-sm text-gray-500">No linked arguments.</div> : null}
            {linkedNodes.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(`/forum/${item.id}`)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-gray-200 hover:border-cyan-300/60"
              >
                <div className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">{item.kind}</div>
                <div className="mt-1">{item.title}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-cyan-200">{value}</div>
      <div className="mt-2 h-2 rounded-full bg-black/50">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}


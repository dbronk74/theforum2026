import { useEffect, useMemo, useState } from 'react'
import Button from '@/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import { useRealm } from '@/store/realmState'

const TONES = ['Stoic', 'Mystical', 'Modern Therapist', 'Strategist'] as const
type Tone = (typeof TONES)[number]
type IntroPhase = 'intro' | 'flash' | 'live'

function transform(text: string, tone: Tone) {
  if (!text) return ''
  switch (tone) {
    case 'Stoic':
      return `Focus on what you can control. ${text} Accept uncertainty without surrendering reason.`
    case 'Mystical':
      return `Within the watchtower winds, ${text}. Follow the signal that increases clarity for all.`
    case 'Modern Therapist':
      return `You are noticing that ${text}. Pause, validate feeling, then anchor to evidence before reacting.`
    case 'Strategist':
      return `Frame the claim, map opposing incentives, identify strongest receipts, then advance with disciplined tone: ${text}`
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export default function Oracle() {
  const { state: realmState } = useRealm()
  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')
  const [input, setInput] = useState('')
  const [tone, setTone] = useState<Tone>('Stoic')
  const [output, setOutput] = useState('')
  const [topic, setTopic] = useState<string>('Tariffs')

  const availableTopics = useMemo(() => {
    const topics = Object.keys(realmState.insight.topicSignals)
    return topics.length > 0 ? topics : ['Tariffs', 'Moderation']
  }, [realmState.insight.topicSignals])

  const pulse = realmState.insight.topicSignals[topic] ?? Object.values(realmState.insight.topicSignals)[0]

  const forecast = useMemo(() => {
    if (!pulse) return { convergence: 50, turbulence: 50 }
    const convergence = clamp(Math.round(pulse.consensus - pulse.disagreement * 0.22 + pulse.momentum * 0.18), 0, 100)
    const turbulence = clamp(Math.round(pulse.disagreement + pulse.dissonance * 0.34), 0, 100)
    return { convergence, turbulence }
  }, [pulse])

  useEffect(() => {
    if (introPhase !== 'flash') return
    const timer = window.setTimeout(() => setIntroPhase('live'), 700)
    return () => window.clearTimeout(timer)
  }, [introPhase])

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        {introPhase === 'intro' ? (
          <>
            <video
              src="/videos/oracle-intro.mp4"
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('flash')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,8,18,0.72)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Oracle Watchtower Awakening
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('flash')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(210,230,255,0.95),rgba(87,140,255,0.86)_52%,rgba(7,14,32,0.95)_100%)]" />
        )}
      </div>
    )
  }

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Oracle Watchtower</h1>
        <p className="text-sm text-gray-300">Predictive overlays, directive tracking, and perspective translation before entering conflict-heavy channels.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Council Directive Tracker</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 text-xs">
              {realmState.insight.councilDirectives.map(directive => (
                <div key={directive.id} className="rounded-xl border border-white/10 bg-black/20 p-2 text-gray-200">
                  <div>{directive.title}</div>
                  <div className="mt-1 text-gray-400">{directive.note}</div>
                  <div className="mt-1">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${
                        directive.status === 'critical'
                          ? 'bg-rose-500/25 text-rose-200'
                          : directive.status === 'watch'
                            ? 'bg-amber-500/25 text-amber-200'
                            : 'bg-emerald-500/25 text-emerald-200'
                      }`}
                    >
                      {directive.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Topic Signal Radar</div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map(item => (
                <Button key={item} variant={topic === item ? 'muted' : 'ghost'} onClick={() => setTopic(item)}>
                  {item}
                </Button>
              ))}
            </div>
            {pulse ? (
              <>
                <div className="mt-3 text-xs text-gray-300">
                  Consensus: {pulse.consensus} | Disagreement: {pulse.disagreement} | Dissonance: {pulse.dissonance} | Momentum: {pulse.momentum}
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${pulse.consensus}%` }} />
                </div>
                <div className="mt-2 h-2 rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400" style={{ width: `${pulse.disagreement}%` }} />
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-gray-500">No signal data yet.</div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Oracle Forecast</div>
          </CardHeader>
          <CardBody>
            <div className="text-xs text-gray-300">Convergence Probability</div>
            <div className="text-2xl text-cyan-200">{forecast.convergence}%</div>
            <div className="mt-3 text-xs text-gray-300">Turbulence Forecast</div>
            <div className="text-2xl text-rose-200">{forecast.turbulence}%</div>
            <div className="mt-3 text-xs text-gray-400">ForumGlobalPulse: {realmState.insight.forumGlobalPulse}</div>
            <div className="mt-1 text-xs text-gray-400">FactualConsensus Gauge: {realmState.insight.factualConsensusGauge}</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg text-cyan-200">Timeless Translator</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3">
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Paste a statement, challenge, or internal conflict..."
              className="w-full min-h-[150px] rounded-2xl border border-white/10 bg-black/40 p-3 outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {TONES.map(item => (
                <Button key={item} variant={item === tone ? 'muted' : 'ghost'} onClick={() => setTone(item)}>
                  {item}
                </Button>
              ))}
            </div>
            <Button onClick={() => setOutput(transform(input, tone))}>Translate Signal</Button>
            <textarea
              readOnly
              value={output}
              className="w-full min-h-[150px] rounded-2xl border border-white/10 bg-black/40 p-3 text-cyan-200 outline-none"
            />
          </div>
        </CardBody>
        <CardFooter>
          <div className="text-xs text-gray-400">Translator output can be copied into Round Table prep notes or Arena opening statements.</div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-base text-cyan-200">Cognitive Dissonance Flag Stream</div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {realmState.insight.dissonanceFlags.length === 0 ? <div className="text-sm text-gray-500">No flags currently active.</div> : null}
            {realmState.insight.dissonanceFlags.slice(0, 8).map(flag => (
              <div key={flag.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                <div className="text-gray-200">{flag.type.replace('-', ' ')}</div>
                <div className="mt-1 text-gray-400">{flag.message}</div>
                <div className="mt-1 text-cyan-200">Challenge: {flag.challengeId} | Severity: {flag.severity}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

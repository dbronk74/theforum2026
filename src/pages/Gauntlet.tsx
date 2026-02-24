import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { getTotalScore, useForum, type Challenge } from '@/state/forumState'
import { TRIAL_MODULES, selectReasoningProfile } from '@/store/reasoningSlice'
import { useRealm } from '@/store/realmState'
import { assetPath } from '@/utils/assetPath'

type ContractForm = {
  challenger: string
  opponent: string
  claim: string
  prepMinutes: number
  turnSeconds: number
  stake: number
  injectionCost: number
}
type IntroPhase = 'intro' | 'flash' | 'live'

const DEFAULT_FORM: ContractForm = {
  challenger: 'Debater Alpha',
  opponent: 'Debater Beta',
  claim: '',
  prepMinutes: 12,
  turnSeconds: 90,
  stake: 30,
  injectionCost: 2,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function statusClass(status: Challenge['status']): string {
  switch (status) {
    case 'open':
      return 'bg-white/10 text-gray-100'
    case 'accepted':
    case 'in_prep':
      return 'bg-cyan-500 text-black'
    case 'live':
      return 'bg-emerald-500 text-black'
    case 'declined':
    case 'no_show':
      return 'bg-rose-500 text-white'
    case 'completed':
      return 'bg-violet-500 text-white'
  }
}

export default function Gauntlet() {
  const navigate = useNavigate()
  const {
    state,
    createChallenge,
    setActiveChallenge,
    acceptChallenge,
    declineChallenge,
    markNoShow,
  } = useForum()
  const { state: realmState, runGauntletTrial } = useRealm()

  const [form, setForm] = useState<ContractForm>(DEFAULT_FORM)
  const [error, setError] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('')
  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')

  const queue = useMemo(
    () => [...state.challenges].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))),
    [state.challenges],
  )
  const liveCount = queue.filter(challenge => challenge.status === 'live').length
  const openCount = queue.filter(challenge => challenge.status === 'open').length

  const selectedChallenge = queue.find(challenge => challenge.id === selectedChallengeId) ?? queue[0] ?? null
  const reasoningProfile = selectReasoningProfile(realmState.reasoning, selectedChallenge?.id)

  useEffect(() => {
    if (!selectedChallengeId && queue[0]) {
      setSelectedChallengeId(queue[0].id)
      return
    }
    if (selectedChallengeId && queue.some(challenge => challenge.id === selectedChallengeId)) return
    if (queue[0]) setSelectedChallengeId(queue[0].id)
  }, [queue, selectedChallengeId])

  useEffect(() => {
    if (introPhase !== 'flash') return
    const timer = window.setTimeout(() => setIntroPhase('live'), 700)
    return () => window.clearTimeout(timer)
  }, [introPhase])

  function createContract(event: FormEvent) {
    event.preventDefault()
    if (!form.claim.trim()) {
      setError('Claim is required before issuing the challenge.')
      return
    }
    if (!form.challenger.trim() || !form.opponent.trim()) {
      setError('Both challenger and opponent names are required.')
      return
    }

    createChallenge({
      challenger: form.challenger,
      opponent: form.opponent,
      claim: form.claim,
      prepMinutes: Math.max(5, form.prepMinutes),
      turnSeconds: Math.max(45, form.turnSeconds),
      stake: Math.max(5, form.stake),
      injectionCost: Math.max(1, form.injectionCost),
    })
    setForm({ ...DEFAULT_FORM, challenger: form.challenger, opponent: form.opponent })
    setError('')
  }

  function enterRoute(challengeId: string, route: '/round-table' | '/arena' | '/ledger') {
    setActiveChallenge(challengeId)
    navigate(route)
  }

  function runTrialModule(moduleId: string) {
    if (!selectedChallenge) return

    const combinedPenalties = selectedChallenge.scores.challenger.penalties + selectedChallenge.scores.opponent.penalties
    const combinedFactual = selectedChallenge.scores.challenger.factual + selectedChallenge.scores.opponent.factual
    const combinedCivility = selectedChallenge.scores.challenger.civility + selectedChallenge.scores.opponent.civility
    const combinedCoherence = selectedChallenge.scores.challenger.coherence + selectedChallenge.scores.opponent.coherence

    const evidenceQuality = clamp(Math.round(58 + combinedFactual * 1.8 - combinedPenalties * 1.2), 15, 100)
    const civility = clamp(Math.round(62 + combinedCivility * 1.5 - combinedPenalties * 1.7), 10, 100)
    const coherence = clamp(Math.round(56 + combinedCoherence * 1.7), 15, 100)
    const crowdMomentum = Math.abs(selectedChallenge.support.challenger - selectedChallenge.support.opponent) * 3

    runGauntletTrial({
      challengeId: selectedChallenge.id,
      moduleId,
      evidenceQuality,
      civility,
      coherence,
      crowdMomentum,
    })
  }

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        {introPhase === 'intro' ? (
          <>
            <video
              src={assetPath('videos/gauntlet-intro.mp4')}
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('live')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,9,18,0.72)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Entering Gauntlet Trials
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('live')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(130,230,255,0.95),rgba(46,124,255,0.88)_52%,rgba(4,10,30,0.95)_100%)]" />
        )}
      </div>
    )
  }

  return (
    <div className="page space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-sm uppercase tracking-widest text-cyan-300">Gauntlet Live Ops</div>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-display neon-text text-cyan-300">{liveCount}</div>
            <div className="text-xs text-gray-300 mt-1">Active arena sessions</div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm uppercase tracking-widest text-cyan-300">Challenge Queue</div>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-display neon-text text-cyan-300">{openCount}</div>
            <div className="text-xs text-gray-300 mt-1">Open contracts awaiting response</div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm uppercase tracking-widest text-cyan-300">Accountability</div>
          </CardHeader>
          <CardBody>
            <div className="text-3xl font-display neon-text text-cyan-300">{state.ledger.length}</div>
            <div className="text-xs text-gray-300 mt-1">Published outcomes in public ledger</div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <div className="text-xl font-display text-cyan-300 neon-text">Challenge Contract Desk</div>
            <div className="text-xs text-gray-400">Issue claims with explicit rules, stake, and evidence economics.</div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={createContract} className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.challenger}
                onChange={event => setForm(prev => ({ ...prev, challenger: event.target.value }))}
                placeholder="Challenger"
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
              />
              <input
                value={form.opponent}
                onChange={event => setForm(prev => ({ ...prev, opponent: event.target.value }))}
                placeholder="Opponent"
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
              />
            </div>
            <textarea
              value={form.claim}
              onChange={event => setForm(prev => ({ ...prev, claim: event.target.value }))}
              placeholder="Single claim to be defended (example: 'Tariff policy lowered inflation in 2025')."
              className="w-full min-h-[96px] bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
            />
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-xs text-gray-300">
                Prep Minutes
                <input
                  type="number"
                  min={5}
                  value={form.prepMinutes}
                  onChange={event => setForm(prev => ({ ...prev, prepMinutes: Number(event.target.value) }))}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                />
              </label>
              <label className="text-xs text-gray-300">
                Turn Seconds
                <input
                  type="number"
                  min={45}
                  value={form.turnSeconds}
                  onChange={event => setForm(prev => ({ ...prev, turnSeconds: Number(event.target.value) }))}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                />
              </label>
              <label className="text-xs text-gray-300">
                Stake (credits)
                <input
                  type="number"
                  min={5}
                  value={form.stake}
                  onChange={event => setForm(prev => ({ ...prev, stake: Number(event.target.value) }))}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                />
              </label>
              <label className="text-xs text-gray-300">
                Injection Cost
                <input
                  type="number"
                  min={1}
                  value={form.injectionCost}
                  onChange={event => setForm(prev => ({ ...prev, injectionCost: Number(event.target.value) }))}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                />
              </label>
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Issue Challenge</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(DEFAULT_FORM)}>
                Reset Contract
              </Button>
              <Button type="button" variant="muted" onClick={() => navigate('/ledger')}>
                Open Accountability Ledger
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
          <CardHeader>
            <div className="text-xl font-display text-cyan-300 neon-text">Challenge Queue</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {queue.map(challenge => {
                const challengerTotal = getTotalScore(challenge.scores.challenger)
                const opponentTotal = getTotalScore(challenge.scores.opponent)
                const isSelected = selectedChallenge?.id === challenge.id
                return (
                  <div
                    key={challenge.id}
                    className={`rounded-2xl border bg-black/20 p-4 ${isSelected ? 'border-cyan-300/60' : 'border-white/10'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm text-gray-200">
                        <span className="font-semibold">{challenge.challenger}</span> vs <span className="font-semibold">{challenge.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-2xl text-xs ${statusClass(challenge.status)}`}>{challenge.status}</span>
                        <Button variant="ghost" onClick={() => setSelectedChallengeId(challenge.id)}>Select</Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 mt-2">{challenge.claim}</p>

                    <div className="mt-3 grid gap-2 text-xs text-gray-400 md:grid-cols-4">
                      <div>Prep: {challenge.rules.prepMinutes}m</div>
                      <div>Turn: {challenge.rules.turnSeconds}s</div>
                      <div>Stake: {challenge.rules.stake} credits</div>
                      <div>Injection Cost: {challenge.rules.injectionCost}</div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-gray-300 md:grid-cols-2">
                      <div>Score {challenge.challenger}: {challengerTotal}</div>
                      <div>Score {challenge.opponent}: {opponentTotal}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {challenge.status === 'open' ? (
                        <>
                          <Button onClick={() => acceptChallenge(challenge.id)}>Accept Contract</Button>
                          <Button variant="muted" onClick={() => declineChallenge(challenge.id, 'Opponent declined public challenge contract.')}>Decline</Button>
                          <Button variant="ghost" onClick={() => markNoShow(challenge.id, 'Challenge unclaimed in response window (no-show).')}>
                            Mark No-Show
                          </Button>
                        </>
                      ) : null}

                      {challenge.status === 'accepted' || challenge.status === 'in_prep' ? (
                        <Button onClick={() => enterRoute(challenge.id, '/round-table')}>Enter Round Table</Button>
                      ) : null}

                      {challenge.status === 'live' ? (
                        <Button onClick={() => enterRoute(challenge.id, '/arena')}>Enter Arena</Button>
                      ) : null}

                      {challenge.status === 'completed' || challenge.status === 'declined' || challenge.status === 'no_show' ? (
                        <Button variant="muted" onClick={() => enterRoute(challenge.id, '/ledger')}>
                          View Ledger Entry
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Gauntlet Trial System</div>
          </CardHeader>
          <CardBody>
            {!selectedChallenge ? (
              <div className="text-sm text-gray-400">Select a challenge to run trials.</div>
            ) : (
              <>
                <div className="text-xs text-gray-400">Target Challenge</div>
                <div className="text-sm text-cyan-200 mt-1">{selectedChallenge.claim}</div>
                <div className="mt-3 grid gap-2 text-xs">
                  <Metric label="Rebuttal Stability" value={reasoningProfile?.stability ?? 52} />
                  <Metric label="Argument Heat" value={reasoningProfile?.heat ?? 46} tone="heat" />
                  <Metric label="Spectator Pulse" value={reasoningProfile?.spectatorPulse ?? 50} />
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-400">Achievement Badges</div>
                  <div className="mt-1 text-xs text-gray-200">
                    {(reasoningProfile?.badges.length ?? 0) > 0 ? reasoningProfile?.badges.join(' · ') : 'No badges unlocked yet'}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-400">Relics of Rhetoric</div>
                  <div className="mt-1 text-xs text-cyan-200">
                    {(reasoningProfile?.relics.length ?? 0) > 0 ? reasoningProfile?.relics.join(' · ') : 'No relics forged yet'}
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-lg text-cyan-200">Trial Modules</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-2">
            {TRIAL_MODULES.map(module => (
              <div key={module.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-cyan-200">{module.title}</div>
                  <span className="rounded-2xl bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-200">{module.difficulty}</span>
                </div>
                <div className="mt-2 text-xs text-gray-300">{module.objective}</div>
                <div className="mt-3 space-y-2">
                  {module.ruleCards.map(card => (
                    <div key={card.id} className="rounded-xl border border-white/10 bg-black/30 p-2 text-xs">
                      <div className="text-gray-200">{card.title}</div>
                      <div className="mt-1 text-gray-400">{card.detail}</div>
                      <div className="mt-1 text-rose-300">{card.penalty}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Button onClick={() => runTrialModule(module.id)} disabled={!selectedChallenge}>Run Trial Simulation</Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
        <CardFooter>
          <p className="text-xs text-gray-400">
            Trial runs update the stability meter, heatmap pressure, spectator pulse, badges, and relic unlock paths.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function Metric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'heat' }) {
  const clamped = clamp(value, 0, 100)
  const gradient = tone === 'heat' ? 'from-rose-400 to-orange-500' : 'from-cyan-400 to-emerald-400'

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2">
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span>{label}</span>
        <span className="text-cyan-200">{clamped}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-black/60">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

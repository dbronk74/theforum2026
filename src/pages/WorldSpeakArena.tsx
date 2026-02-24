import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { getTotalScore, useForum, type EvidenceTier, type Outcome, type Side } from '@/state/forumState'
import { TRIAL_MODULES, selectReasoningProfile } from '@/store/reasoningSlice'
import { useRealm } from '@/store/realmState'

function msToClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function sideLabel(side: Side, challenger: string, opponent: string): string {
  return side === 'challenger' ? challenger : opponent
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function estimateEvidenceQuality(text: string): number {
  if (/(https?:\/\/|www\.|\.gov|\.edu|study|dataset|report|bls|census)/i.test(text)) return 88
  if (/\d/.test(text)) return 64
  return 44
}

function estimateCivility(text: string): number {
  const abusive = /(idiot|moron|stupid|hate you|fuck|bitch|asshole|trash)/i.test(text)
  if (abusive) return 24
  const exclamationCount = (text.match(/!/g) || []).length
  const alpha = text.replace(/[^a-z]/gi, '')
  const upper = alpha.replace(/[^A-Z]/g, '').length
  const upperRatio = alpha.length > 0 ? upper / alpha.length : 0
  const penalty = exclamationCount * 8 + upperRatio * 36
  return clamp(Math.round(88 - penalty), 18, 100)
}

function estimateCoherence(text: string, steelman: boolean): number {
  const wordCount = text.trim().split(/\\s+/).filter(Boolean).length
  const structure = /(because|therefore|however|if|then|evidence|source|data)/i.test(text) ? 18 : 8
  const steelmanBonus = steelman ? 18 : 0
  const lengthScore = clamp(wordCount, 8, 46)
  return clamp(24 + structure + steelmanBonus + lengthScore, 20, 100)
}

type ArenaIntroPhase = 'intro' | 'flash' | 'live'

export default function WorldSpeakArena() {
  const navigate = useNavigate()
  const { state: realmState, runGauntletTrial, clearInsightFlags } = useRealm()
  const {
    state,
    activeChallenge,
    setActiveChallenge,
    startArena,
    nextTurn,
    submitStatement,
    submitEvidence,
    addSupport,
    postComment,
    requestAppeal,
    completeChallenge,
  } = useForum()

  const challenge = useMemo(() => {
    if (activeChallenge) return activeChallenge
    return state.challenges.find(item => item.status === 'live' || item.status === 'in_prep' || item.status === 'accepted') ?? null
  }, [activeChallenge, state.challenges])

  const transcripts = useMemo(
    () => (challenge ? state.transcripts.filter(item => item.challengeId === challenge.id) : []),
    [challenge, state.transcripts],
  )
  const evidence = useMemo(
    () => (challenge ? state.evidence.filter(item => item.challengeId === challenge.id) : []),
    [challenge, state.evidence],
  )
  const aiDecisions = useMemo(
    () => (challenge ? state.aiDecisions.filter(item => item.challengeId === challenge.id) : []),
    [challenge, state.aiDecisions],
  )
  const comments = useMemo(
    () => (challenge ? state.comments.filter(item => item.challengeId === challenge.id) : []),
    [challenge, state.comments],
  )
  const profile = selectReasoningProfile(realmState.reasoning, challenge?.id ?? null)
  const challengeFlags = useMemo(
    () => (challenge ? realmState.insight.dissonanceFlags.filter(flag => flag.challengeId === challenge.id) : []),
    [challenge, realmState.insight.dissonanceFlags],
  )

  const [nowTick, setNowTick] = useState(Date.now())
  const [statementText, setStatementText] = useState('')
  const [steelman, setSteelman] = useState(true)
  const [viewerEvidence, setViewerEvidence] = useState({
    submittedBy: 'viewer' as 'viewer' | 'lifeline' | 'debater',
    side: 'challenger' as Side,
    source: '',
    note: '',
    tier: 1 as EvidenceTier,
  })
  const [commentAuthor, setCommentAuthor] = useState('CitizenObserver')
  const [commentText, setCommentText] = useState('')
  const [arenaNotice, setArenaNotice] = useState('')
  const introVideoRef = useRef<HTMLVideoElement | null>(null)
  const introAudioRef = useRef<HTMLAudioElement | null>(null)
  const [introPhase, setIntroPhase] = useState<ArenaIntroPhase>('intro')
  const [resolution, setResolution] = useState({
    outcome: 'challenger_win' as Outcome,
    reason: 'Debate finished under contract rules and scorecard review.',
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    return () => {
      const audio = introAudioRef.current
      if (!audio) return
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (introPhase !== 'intro') return
    const video = introVideoRef.current
    const audio = introAudioRef.current

    if (video) {
      video.currentTime = 0
      void video.play().catch(() => {})
    }
    if (audio) {
      audio.currentTime = 0
      audio.volume = 0.08
      void audio.play().catch(() => {})
    }
  }, [introPhase])

  useEffect(() => {
    if (introPhase !== 'flash') return
    const timer = window.setTimeout(() => setIntroPhase('live'), 700)
    return () => window.clearTimeout(timer)
  }, [introPhase])

  useEffect(() => {
    if (challenge && challenge.id !== state.activeChallengeId) {
      setActiveChallenge(challenge.id)
    }
  }, [challenge, setActiveChallenge, state.activeChallengeId])

  function finishArenaIntro() {
    const audio = introAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIntroPhase('flash')
  }

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        <audio ref={introAudioRef} src="/audio/arena_croud_chant.mp3" preload="auto" />
        {introPhase === 'intro' ? (
          <>
            <video
              ref={introVideoRef}
              src="/videos/arena-intro.mp4"
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={finishArenaIntro}
              onError={finishArenaIntro}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(5,9,18,0.72)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Entering WorldSpeak Arena
              </div>
              <Button variant="ghost" onClick={finishArenaIntro}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(128,224,255,0.96),rgba(21,112,255,0.88)_50%,rgba(3,14,36,0.95)_100%)]" />
        )}
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="page space-y-4">
        <h1 className="text-3xl font-display neon-text text-cyan-300">WorldSpeak Arena</h1>
        <Card>
          <CardBody>
            <p className="text-gray-300">No active challenge is ready for the arena.</p>
            <div className="mt-3">
              <Button onClick={() => navigate('/gauntlet')}>Open Gauntlet</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const current = challenge
  const turnRemaining = current.turnEndsAt ? Math.max(0, current.turnEndsAt - nowTick) : current.rules.turnSeconds * 1000
  const activeSpeakerName = sideLabel(current.activeSpeaker, current.challenger, current.opponent)
  const speakerSuspended = current.violations[current.activeSpeaker] >= 3
  const currentTopic = /tariff/i.test(current.claim)
    ? 'Tariffs'
    : /moderation|civility/i.test(current.claim)
      ? 'Moderation'
      : 'General'
  const topicSignal = realmState.insight.topicSignals[currentTopic] ?? realmState.insight.topicSignals.General ?? null

  function sendStatement(event: FormEvent) {
    event.preventDefault()
    if (!statementText.trim()) return
    if (speakerSuspended) {
      setArenaNotice(`${activeSpeakerName} is suspended after repeated abusive violations.`)
      return
    }

    submitStatement({
      challengeId: current.id,
      side: current.activeSpeaker,
      text: statementText,
      steelman,
    })

    const activeModule = TRIAL_MODULES[transcripts.length % TRIAL_MODULES.length]
    runGauntletTrial({
      challengeId: current.id,
      moduleId: activeModule.id,
      evidenceQuality: estimateEvidenceQuality(statementText),
      civility: estimateCivility(statementText),
      coherence: estimateCoherence(statementText, steelman),
      crowdMomentum: Math.abs(current.support.challenger - current.support.opponent) * 3,
    })

    setStatementText('')
    setSteelman(true)
    nextTurn(current.id)
    setArenaNotice('')
  }

  function sendEvidence(event: FormEvent) {
    event.preventDefault()
    if (!viewerEvidence.source.trim()) return
    submitEvidence({
      challengeId: current.id,
      side: viewerEvidence.side,
      submittedBy: viewerEvidence.submittedBy,
      source: viewerEvidence.source,
      note: viewerEvidence.note,
      tier: viewerEvidence.tier,
    })
    setViewerEvidence(prev => ({ ...prev, source: '', note: '' }))
  }

  function sendComment(event: FormEvent) {
    event.preventDefault()
    if (!commentAuthor.trim() || !commentText.trim()) return
    postComment(current.id, commentAuthor, commentText)
    setCommentText('')
  }

  const challengerTotal = getTotalScore(current.scores.challenger)
  const opponentTotal = getTotalScore(current.scores.opponent)
  const heatmap =
    profile?.heatmap ??
    Array.from({ length: TRIAL_MODULES.length }, () => Array.from({ length: TRIAL_MODULES.length }, () => 0))
  const radarWindow = realmState.insight.disagreementRadar.slice(-10)

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">WorldSpeak Arena</h1>
        <p className="text-gray-300 text-sm">AI-moderated debate loop with factual receipts, civility penalties, appeals, and scorecard settlement.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg text-cyan-200">{current.challenger} vs {current.opponent}</div>
              <div className="text-xs text-gray-400">{current.claim}</div>
            </div>
            <span className="px-3 py-1 rounded-2xl text-xs bg-white/10 text-gray-100">{current.status}</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-4 text-sm">
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs text-gray-400">Active Speaker</div>
              <div className="text-cyan-300">{activeSpeakerName}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs text-gray-400">Turn Clock</div>
              <div className="text-cyan-300">{msToClock(turnRemaining)}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs text-gray-400">Community Credits</div>
              <div className="text-cyan-300">{state.communityCredits}</div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs text-gray-400">Viewer Injection Pool</div>
              <div className="text-cyan-300">{current.economy.viewerPool}</div>
            </div>
          </div>
          {arenaNotice ? <p className="mt-3 text-sm text-rose-300">{arenaNotice}</p> : null}
        </CardBody>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            {current.status !== 'live' ? (
              <Button onClick={() => startArena(current.id)}>
                Start Arena Session
              </Button>
            ) : null}
            <Button variant="muted" onClick={() => nextTurn(current.id)}>
              Yield Turn
            </Button>
            <Button variant="ghost" onClick={() => navigate('/round-table')}>
              Return to Round Table
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-base text-cyan-200">Live Statement Console</div>
              <div className="text-xs text-gray-400">{activeSpeakerName} speaking</div>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={sendStatement} className="space-y-3">
              <textarea
                value={statementText}
                onChange={event => setStatementText(event.target.value)}
                placeholder={`Current speaker: ${activeSpeakerName}. State evidence and reasoning.`}
                className="w-full min-h-[120px] bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={steelman} onChange={event => setSteelman(event.target.checked)} />
                Include steelman summary before rebuttal
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={current.status !== 'live'}>
                  Submit Turn
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStatementText('')}>
                  Clear
                </Button>
              </div>
            </form>
          </CardBody>
          <CardFooter>
            <div className="text-xs text-gray-400">Automatic penalties: heated tone warning, abusive tone fine, and suspension at three severe violations.</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Scoreboard + Audience Pressure</div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-cyan-400/30 bg-black/30 p-3">
                <div className="text-sm text-cyan-300">{current.challenger}</div>
                <div className="text-xs text-gray-300 mt-1">Total: {challengerTotal}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Civility {current.scores.challenger.civility} | Factual {current.scores.challenger.factual} | Coherence {current.scores.challenger.coherence}
                </div>
                <div className="text-xs text-gray-400 mt-1">Audience {current.scores.challenger.audience} | Penalties {current.scores.challenger.penalties}</div>
                <div className="text-xs text-gray-400 mt-1">Credits: {current.economy.challenger}</div>
                <div className="mt-2">
                  <Button variant="muted" onClick={() => addSupport(current.id, 'challenger')}>Support</Button>
                </div>
              </div>
              <div className="rounded-xl border border-pink-400/30 bg-black/30 p-3">
                <div className="text-sm text-pink-300">{current.opponent}</div>
                <div className="text-xs text-gray-300 mt-1">Total: {opponentTotal}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Civility {current.scores.opponent.civility} | Factual {current.scores.opponent.factual} | Coherence {current.scores.opponent.coherence}
                </div>
                <div className="text-xs text-gray-400 mt-1">Audience {current.scores.opponent.audience} | Penalties {current.scores.opponent.penalties}</div>
                <div className="text-xs text-gray-400 mt-1">Credits: {current.economy.opponent}</div>
                <div className="mt-2">
                  <Button variant="muted" onClick={() => addSupport(current.id, 'opponent')}>Support</Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Rebuttal Stability Meter</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <Metric label="Stability" value={profile?.stability ?? 52} />
              <Metric label="Argument Heat" value={profile?.heat ?? 46} tone="heat" />
              <Metric label="Spectator Pulse" value={profile?.spectatorPulse ?? 50} />
            </div>

            <div className="mt-4 text-xs text-gray-400">Achievement Badges</div>
            <div className="mt-1 text-xs text-gray-200">
              {(profile?.badges.length ?? 0) > 0 ? profile?.badges.join(' · ') : 'No badges unlocked yet'}
            </div>

            <div className="mt-3 text-xs text-gray-400">Relics of Rhetoric</div>
            <div className="mt-1 text-xs text-cyan-200">
              {(profile?.relics.length ?? 0) > 0 ? profile?.relics.join(' · ') : 'No relics forged yet'}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Argument Heatmap</div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-4 gap-1">
              {heatmap.flatMap((row, rowIndex) =>
                row.map((cell, columnIndex) => (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className="h-8 rounded-md border border-white/10"
                    style={{
                      background: `rgba(255, 130, 90, ${Math.max(0.08, cell / 100)})`,
                    }}
                    title={`Heat ${cell}`}
                  />
                )),
              )}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Module pressure map from gauntlet trial outcomes and live statement quality.
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Data-Intelligence Overlays</div>
          </CardHeader>
          <CardBody>
            <div className="text-xs text-gray-400">FactualConsensus Gauge</div>
            <Metric label="Consensus" value={realmState.insight.factualConsensusGauge} />

            <div className="mt-3 text-xs text-gray-400">Audience Disagreement Radar</div>
            <div className="mt-1 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }).map((_, index) => {
                const value = radarWindow[index] ?? 0
                return (
                  <div key={index} className="h-12 rounded-md border border-white/10 bg-black/30">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-rose-500 to-orange-400"
                      style={{ height: `${Math.max(8, value)}%`, marginTop: `${100 - Math.max(8, value)}%` }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-3 text-xs text-gray-400">Global Pulse</div>
            <div className="text-sm text-cyan-200">ForumGlobalPulse: {realmState.insight.forumGlobalPulse}</div>
            {topicSignal ? (
              <div className="mt-2 text-xs text-gray-300">
                {currentTopic}: consensus {topicSignal.consensus} · disagreement {topicSignal.disagreement} · dissonance {topicSignal.dissonance}
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-base text-cyan-200">Council Directive Tracker + Dissonance Flags</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {realmState.insight.councilDirectives.map(directive => (
                <div key={directive.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">{directive.title}</div>
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
            <div className="space-y-2">
              {challengeFlags.length === 0 ? <div className="text-sm text-gray-500">No active dissonance flags.</div> : null}
              {challengeFlags.map(flag => (
                <div key={flag.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">{flag.type.replace('-', ' ')}</div>
                  <div className="mt-1 text-gray-400">{flag.message}</div>
                  <div className="mt-1 text-cyan-200">Severity: {flag.severity}</div>
                </div>
              ))}
              <div className="pt-1">
                <Button variant="ghost" onClick={() => clearInsightFlags(current.id)}>Clear Flags for This Debate</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Evidence Injection Gateway</div>
          </CardHeader>
          <CardBody>
            <form onSubmit={sendEvidence} className="space-y-3">
              <div className="grid gap-2 md:grid-cols-3">
                <select
                  value={viewerEvidence.submittedBy}
                  onChange={event => setViewerEvidence(prev => ({ ...prev, submittedBy: event.target.value as 'viewer' | 'lifeline' | 'debater' }))}
                  className="bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                >
                  <option value="viewer">Viewer Injection</option>
                  <option value="lifeline">Lifeline Injection</option>
                  <option value="debater">Debater Receipt</option>
                </select>
                <select
                  value={viewerEvidence.side}
                  onChange={event => setViewerEvidence(prev => ({ ...prev, side: event.target.value as Side }))}
                  className="bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                >
                  <option value="challenger">Support Challenger</option>
                  <option value="opponent">Support Opponent</option>
                </select>
                <select
                  value={viewerEvidence.tier}
                  onChange={event => setViewerEvidence(prev => ({ ...prev, tier: Number(event.target.value) as EvidenceTier }))}
                  className="bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
                >
                  <option value={1}>Tier 1 Primary</option>
                  <option value={2}>Tier 2 Secondary</option>
                  <option value={3}>Tier 3 Commentary</option>
                </select>
              </div>
              <input
                value={viewerEvidence.source}
                onChange={event => setViewerEvidence(prev => ({ ...prev, source: event.target.value }))}
                placeholder="Source URL or citation reference"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
              />
              <textarea
                value={viewerEvidence.note}
                onChange={event => setViewerEvidence(prev => ({ ...prev, note: event.target.value }))}
                placeholder="Explain why this evidence matters to the claim."
                className="w-full min-h-[90px] bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
              />
              <Button type="submit">Submit Evidence</Button>
            </form>
          </CardBody>
          <CardFooter>
            <div className="text-xs text-gray-400">Accepted receipts raise factual score. Rejected receipts increase penalty pressure.</div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Civil Comment Channel</div>
          </CardHeader>
          <CardBody>
            <form onSubmit={sendComment} className="space-y-2">
              <input
                value={commentAuthor}
                onChange={event => setCommentAuthor(event.target.value)}
                placeholder="Display handle"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
              />
              <textarea
                value={commentText}
                onChange={event => setCommentText(event.target.value)}
                placeholder="Comment with sources or concise reasoning."
                className="w-full min-h-[80px] bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
              />
              <Button type="submit">Post Comment</Button>
              <p className="text-xs text-gray-400">
                Heated and abusive comments are fined automatically. Current balance for {commentAuthor}: {state.commenterCredits[commentAuthor] ?? 25} credits.
              </p>
            </form>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Transcript</div>
          </CardHeader>
          <CardBody>
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {transcripts.length === 0 ? <div className="text-sm text-gray-500">No turns submitted yet.</div> : null}
              {transcripts.map(entry => (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">
                    <span className="font-semibold">{sideLabel(entry.speaker, current.challenger, current.opponent)}:</span> {entry.text}
                  </div>
                  <div className="mt-1 text-gray-400">Tone: {entry.tone} | Fact: {entry.factVerdict} | Steelman: {entry.steelman ? 'yes' : 'no'}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">AI Oversight + Appeals</div>
          </CardHeader>
          <CardBody>
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {aiDecisions.length === 0 ? <div className="text-sm text-gray-500">No AI actions yet.</div> : null}
              {aiDecisions.map(decision => (
                <div key={decision.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">{decision.summary}</div>
                  <div className="mt-1 text-gray-400">{decision.rationale}</div>
                  <div className="mt-1 text-gray-500">Status: {decision.status}</div>
                  {decision.status === 'active' ? (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        onClick={() => requestAppeal(decision.id, 'Arena Tribunal', 'Requesting review for context and calibration check.')}
                      >
                        Appeal
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Receipt Window + Comment Feed</div>
          </CardHeader>
          <CardBody>
            <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
              {evidence.map(item => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">
                    {item.verdict.toUpperCase()} | Tier {item.tier} | {item.submittedBy}
                  </div>
                  <div className="text-gray-400 mt-1">{item.source}</div>
                  <div className="text-gray-500 mt-1">{item.reason}</div>
                </div>
              ))}
              {comments.map(entry => (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                  <div className="text-gray-200">{entry.author}: {entry.text}</div>
                  <div className="text-gray-500 mt-1">Tone {entry.tone}{entry.fine > 0 ? ` | Fine -${entry.fine}` : ''}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="text-base text-cyan-200">Finalize Outcome</div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={resolution.outcome}
              onChange={event => setResolution(prev => ({ ...prev, outcome: event.target.value as Outcome }))}
              className="bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
            >
              <option value="challenger_win">{current.challenger} Wins</option>
              <option value="opponent_win">{current.opponent} Wins</option>
              <option value="draw">Draw</option>
            </select>
            <input
              value={resolution.reason}
              onChange={event => setResolution(prev => ({ ...prev, reason: event.target.value }))}
              className="md:col-span-2 bg-black/40 border border-white/10 rounded-xl p-2 outline-none"
              placeholder="Why this outcome was assigned"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                completeChallenge(current.id, resolution.outcome, resolution.reason.trim() || 'Outcome recorded by arena host.')
                navigate('/ledger')
              }}
            >
              Publish to Accountability Ledger
            </Button>
            <Button variant="ghost" onClick={() => navigate('/ledger')}>Open Ledger</Button>
          </div>
        </CardBody>
      </Card>

      <details className="glass p-4">
        <summary className="cursor-pointer text-sm text-gray-200">Legacy Arena Simulation (for visual reference)</summary>
        <div className="mt-3 rounded-2xl overflow-hidden border border-white/10">
          <iframe title="Legacy WorldSpeak Arena Prototype" src="/prototypes/WorldSpeakArena_demo.html" className="w-full h-[68vh]" />
        </div>
      </details>
    </div>
  )
}

function Metric({ label, value, tone = 'normal' }: { label: string; value: number; tone?: 'normal' | 'heat' }) {
  const clamped = clamp(value, 0, 100)
  const gradient = tone === 'heat' ? 'from-rose-400 to-orange-500' : 'from-cyan-400 to-emerald-400'
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span>{label}</span>
        <span className="text-cyan-200">{clamped}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-black/60">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

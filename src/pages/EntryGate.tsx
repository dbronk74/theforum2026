import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/ui/Button'

type Phase = 'oath' | 'portal' | 'flash'
type Briefing = 'idle' | 'speaking' | 'done'

const OATH_TEXT =
  'Welcome to The Forum. This space is built for civil argument, factual rigor, and mutual respect. ' +
  'No insults, threats, or harassment. Claims should be supported by evidence. ' +
  'By entering, you agree to uphold these laws and accept moderation for the protection of reasoned dialogue.'

export default function EntryGate() {
  const navigate = useNavigate()
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)
  const hasAutoNarrated = useRef(false)

  const [phase, setPhase] = useState<Phase>('oath')
  const [briefing, setBriefing] = useState<Briefing>('idle')
  const [agreed, setAgreed] = useState(false)
  const [narrationOff, setNarrationOff] = useState(false)

  const canEnter = useMemo(
    () => agreed && (narrationOff || briefing === 'done'),
    [agreed, narrationOff, briefing],
  )

  useEffect(() => {
    return () => {
      const audio = narrationAudioRef.current
      if (!audio) return
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (phase !== 'flash') return
    const timer = window.setTimeout(() => navigate('/nexus'), 900)
    return () => window.clearTimeout(timer)
  }, [phase, navigate])

  function playBriefing() {
    const audio = narrationAudioRef.current
    if (!audio) {
      setBriefing('done')
      return
    }
    setBriefing('speaking')
    audio.pause()
    audio.currentTime = 0
    audio.volume = 0.82
    void audio.play().catch(() => setBriefing('done'))
  }

  useEffect(() => {
    if (phase !== 'oath') return
    if (narrationOff) return
    if (hasAutoNarrated.current) return
    hasAutoNarrated.current = true
    playBriefing()
  }, [phase, narrationOff])

  function toggleNarration() {
    const audio = narrationAudioRef.current
    if (narrationOff) {
      setNarrationOff(false)
      playBriefing()
      return
    }
    setNarrationOff(true)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setBriefing('done')
  }

  function beginPortalEntry() {
    if (!canEnter) return
    const audio = narrationAudioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPhase('portal')
  }

  if (phase === 'portal') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black">
        <video
          src="/videos/sentinel_gate.mp4"
          className="h-screen w-screen object-cover"
          autoPlay
          controls={false}
          playsInline
          onEnded={() => setPhase('flash')}
          onError={() => setPhase('flash')}
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.5)_90%)]" />
        <button
          className="absolute right-4 top-4 rounded-xl border border-white/30 bg-black/60 px-3 py-2 text-xs text-white"
          onClick={() => setPhase('flash')}
        >
          Skip Portal
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-forum-bg">
      <audio
        ref={narrationAudioRef}
        src="/audio/ForumEnter.mp3"
        preload="auto"
        onPlay={() => setBriefing('speaking')}
        onEnded={() => setBriefing('done')}
        onError={() => setBriefing('done')}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(64,207,255,0.3),transparent_55%),radial-gradient(circle_at_50%_74%,rgba(255,233,164,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,18,0.78)_0%,rgba(2,8,18,0.95)_78%)]" />

      <div className="relative page py-14 md:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/15 bg-black/50 p-6 md:p-10 shadow-2xl backdrop-blur">
          <div className="text-center">
            <p className="text-xs tracking-[0.32em] uppercase text-cyan-200/85">Sentinel Gate</p>
            <h1 className="mt-3 text-5xl md:text-7xl font-display text-white tracking-wide">THE FORUM</h1>
            <p className="mt-3 text-gray-300">Enter with honor. Speak with reason.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/5 p-4">
              <div className="text-sm text-cyan-100">Forum Agreement</div>
              <p className="mt-2 text-sm text-gray-300 leading-relaxed">{OATH_TEXT}</p>
              <label className="mt-4 flex items-start gap-2 text-sm text-gray-200">
                <input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1" />
                <span>I agree to these laws and accept moderation for civil discourse.</span>
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-sm text-cyan-100">Sentinel Voice Briefing</div>
              <p className="mt-2 text-sm text-gray-400">
                Narration auto-plays with your custom voice track. You can disable it and proceed by reading.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="muted" onClick={playBriefing}>
                  {briefing === 'speaking' ? 'Narration In Progress...' : 'Replay Narration'}
                </Button>
                <Button variant="ghost" onClick={toggleNarration}>
                  {narrationOff ? 'Narration ON' : 'Narration OFF'}
                </Button>
              </div>

              <div className="mt-5 text-xs text-gray-400">
                Status:{' '}
                <span
                  className={
                    narrationOff
                      ? 'text-emerald-300'
                      : briefing === 'done'
                        ? 'text-emerald-300'
                        : briefing === 'speaking'
                          ? 'text-cyan-200'
                          : 'text-amber-200'
                  }
                >
                  {narrationOff
                    ? 'Narration disabled by user'
                    : briefing === 'done'
                      ? 'Briefing complete'
                      : briefing === 'speaking'
                        ? 'Reading agreement'
                        : 'Awaiting briefing'}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">Voice source: ForumEnter.mp3</div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={beginPortalEntry} disabled={!canEnter}>ENTER</Button>
            <Button variant="ghost" onClick={() => navigate('/nexus')}>Skip to Nexus</Button>
          </div>
        </div>
      </div>

      {phase === 'flash' ? (
        <div className="pointer-events-none fixed inset-0 animate-pulse bg-white" />
      ) : null}
    </div>
  )
}


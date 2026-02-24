import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/ui/Button'
import { useForum } from '@/state/forumState'
import { useRealm } from '@/store/realmState'

type Portal = {
  id: string
  label: string
  subtitle: string
  to: string
  hue: number
}

const PORTALS: Portal[] = [
  { id: 'chronomap', label: 'ChronoMap', subtitle: 'Thread timeline and semantic route lens', to: '/chronomap', hue: 198 },
  { id: 'gauntlet', label: 'Gauntlet', subtitle: 'Challenge contracts and public callouts', to: '/gauntlet', hue: 188 },
  { id: 'round-table', label: 'Round Table', subtitle: 'Prep window and lifeline assembly', to: '/round-table', hue: 46 },
  { id: 'arena', label: 'WorldSpeak Arena', subtitle: 'Live AI moderated debate theater', to: '/arena', hue: 12 },
  { id: 'ledger', label: 'Accountability Ledger', subtitle: 'Outcomes, receipts, and appeals', to: '/ledger', hue: 148 },
  { id: 'inner-temple', label: 'Inner Temple', subtitle: 'Reflection branch and recalibration', to: '/inner-temple', hue: 278 },
  { id: 'oracle', label: 'Oracle', subtitle: 'Interpreter and perspective reframing', to: '/oracle', hue: 208 },
  { id: 'vault', label: 'Vault', subtitle: 'Credit economy and reward history', to: '/vault', hue: 330 },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeDeg(value: number): number {
  const wrapped = value % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

function angleDiff(a: number, b: number): number {
  const base = Math.abs(normalizeDeg(a) - normalizeDeg(b))
  return Math.min(base, 360 - base)
}

export default function Nexus() {
  const navigate = useNavigate()
  const { state: forumState } = useForum()
  const { state: realmState } = useRealm()
  const [yaw, setYaw] = useState(-24)
  const [pitch, setPitch] = useState(10)
  const [dragging, setDragging] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)
  const [autoOrbit, setAutoOrbit] = useState(true)

  const portals = useMemo(
    () =>
      PORTALS.map((portal, index) => ({
        ...portal,
        angle: (360 / PORTALS.length) * index,
      })),
    [],
  )

  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        id: index,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.2,
        alpha: 0.25 + Math.random() * 0.7,
      })),
    [],
  )

  const facingAngle = normalizeDeg(-yaw + 90)
  const focused = useMemo(() => {
    const sorted = [...portals].sort((left, right) => angleDiff(left.angle, facingAngle) - angleDiff(right.angle, facingAngle))
    return sorted[0] ?? portals[0]
  }, [facingAngle, portals])

  const hudStats = useMemo(() => {
    const liveChallenges = forumState.challenges.filter(challenge => challenge.status === 'live').length
    const openChallenges = forumState.challenges.filter(challenge => challenge.status === 'open').length
    const activeAppeals = forumState.appeals.filter(appeal => appeal.resolution === null).length
    return {
      liveChallenges,
      openChallenges,
      activeAppeals,
      pulse: Math.max(15, Math.round(realmState.insight.forumGlobalPulse * 0.7 + (40 + liveChallenges * 12 - activeAppeals * 5) * 0.3)),
      citizensOnline: 120 + forumState.comments.length * 3 + forumState.transcripts.length * 2,
    }
  }, [
    forumState.appeals,
    forumState.challenges,
    forumState.comments.length,
    forumState.transcripts.length,
    realmState.insight.forumGlobalPulse,
  ])

  useEffect(() => {
    if (!autoOrbit || dragging) return
    const tick = window.setInterval(() => {
      setYaw(previous => previous - 0.24)
    }, 24)
    return () => window.clearInterval(tick)
  }, [autoOrbit, dragging])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        setAutoOrbit(false)
        setYaw(previous => previous + 6)
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        setAutoOrbit(false)
        setYaw(previous => previous - 6)
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        setAutoOrbit(false)
        setPitch(previous => clamp(previous + 2, -2, 18))
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        setAutoOrbit(false)
        setPitch(previous => clamp(previous - 2, -2, 18))
      }
      if (event.key === 'Enter') {
        navigate(focused.to)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focused.to, navigate])

  function startDrag(x: number, y: number) {
    setDragging(true)
    setLastPoint({ x, y })
    setAutoOrbit(false)
  }

  function moveDrag(x: number, y: number) {
    if (!dragging || !lastPoint) return
    const dx = x - lastPoint.x
    const dy = y - lastPoint.y
    setYaw(previous => previous - dx * 0.24)
    setPitch(previous => clamp(previous - dy * 0.08, -2, 18))
    setLastPoint({ x, y })
  }

  function endDrag() {
    setDragging(false)
    setLastPoint(null)
  }

  return (
    <div className="page space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display neon-text text-cyan-300">Nexus Portal Chamber</h1>
          <p className="text-sm text-gray-300">Prototype 3D world hub: rotate view, scan portals, then enter any branch realm.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={autoOrbit ? 'solid' : 'ghost'} onClick={() => setAutoOrbit(previous => !previous)}>
            {autoOrbit ? 'Auto Orbit On' : 'Auto Orbit Off'}
          </Button>
          <Button variant="muted" onClick={() => navigate(focused.to)}>Enter {focused.label}</Button>
        </div>
      </div>

      <div
        className={`relative h-[76vh] overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ perspective: '1600px' }}
        onMouseDown={event => startDrag(event.clientX, event.clientY)}
        onMouseMove={event => moveDrag(event.clientX, event.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={event => {
          const point = event.touches[0]
          startDrag(point.clientX, point.clientY)
        }}
        onTouchMove={event => {
          const point = event.touches[0]
          moveDrag(point.clientX, point.clientY)
        }}
        onTouchEnd={endDrag}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(45,184,255,0.25),rgba(7,10,18,0.92)_55%)]" />
        <div className="pointer-events-none absolute inset-0">
          {stars.map(star => (
            <span
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.alpha,
              }}
            />
          ))}
        </div>

        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`,
            transition: dragging ? 'none' : 'transform 140ms linear',
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[1700px] w-[1700px] rounded-full border border-cyan-400/10"
            style={{
              transform: 'translate3d(-50%, -50%, -260px) rotateX(90deg)',
              background:
                'radial-gradient(circle at center, rgba(0,212,255,0.16) 0%, rgba(0,0,0,0.06) 48%, rgba(0,0,0,0.82) 100%)',
              boxShadow: '0 0 80px rgba(0, 212, 255, 0.14) inset',
            }}
          />

          <div
            className="absolute left-1/2 top-1/2 h-28 w-28 rounded-full border border-cyan-300/50"
            style={{
              transform: 'translate3d(-50%, -50%, 0)',
              background: 'radial-gradient(circle, rgba(0,212,255,0.7), rgba(0,212,255,0.12) 70%)',
              boxShadow: '0 0 70px rgba(0, 212, 255, 0.55)',
            }}
          />

          {portals.map(portal => {
            const angleRad = (portal.angle * Math.PI) / 180
            const radius = 510
            const x = Math.cos(angleRad) * radius
            const z = Math.sin(angleRad) * radius
            const y = -54
            const glow = `hsla(${portal.hue}, 100%, 65%, 0.56)`
            const isFocused = portal.id === focused.id

            const style: CSSProperties = {
              transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${portal.angle + 180}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow: isFocused ? `0 0 48px ${glow}` : `0 0 26px ${glow}`,
              borderColor: isFocused ? `hsla(${portal.hue}, 100%, 70%, 0.95)` : `hsla(${portal.hue}, 100%, 70%, 0.48)`,
              background: `linear-gradient(165deg, hsla(${portal.hue}, 82%, 44%, 0.3), rgba(5,8,16,0.9))`,
            }

            return (
              <button
                key={portal.id}
                onClick={() => navigate(portal.to)}
                className="absolute left-1/2 top-1/2 h-52 w-44 rounded-2xl border px-3 py-4 text-left text-white backdrop-blur outline-none transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-cyan-300"
                style={style}
                aria-label={`Enter ${portal.label}`}
              >
                <div className="text-xs uppercase tracking-[0.24em] text-gray-200/85">Portal</div>
                <div className="mt-2 font-display text-xl text-white">{portal.label}</div>
                <div className="mt-2 text-xs text-gray-300">{portal.subtitle}</div>
                <div className="mt-4 text-xs text-cyan-200">{portal.to}</div>
              </button>
            )
          })}
        </div>

        <div className="absolute left-3 top-3 max-w-sm rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Portal Board</div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {portals.map(portal => (
              <li key={portal.id}>
                <button
                  onClick={() => navigate(portal.to)}
                  className={`w-full rounded-lg px-2 py-1 text-left transition ${
                    portal.id === focused.id ? 'bg-cyan-500/20 text-cyan-200' : 'text-gray-200 hover:bg-white/10'
                  }`}
                >
                  {portal.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute bottom-3 right-3 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-xs text-gray-200 backdrop-blur">
          <div>Focus: <span className="text-cyan-200">{focused.label}</span></div>
          <div className="mt-1 text-gray-400">Drag to look around. Keys: A/D rotate, W/S tilt, Enter enter portal.</div>
        </div>

        <div className="absolute right-3 top-3 max-w-[240px] rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-gray-200 backdrop-blur">
          <div className="uppercase tracking-[0.18em] text-cyan-200">Locator HUD</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-white/5 px-2 py-1">Live Arenas: {hudStats.liveChallenges}</div>
            <div className="rounded-lg bg-white/5 px-2 py-1">Open Calls: {hudStats.openChallenges}</div>
            <div className="rounded-lg bg-white/5 px-2 py-1">Appeals: {hudStats.activeAppeals}</div>
            <div className="rounded-lg bg-white/5 px-2 py-1">Citizens: {hudStats.citizensOnline}</div>
          </div>
          <div className="mt-3 text-gray-400">Global Pulse</div>
          <div className="mt-1 h-2 rounded-full bg-black/50">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${hudStats.pulse}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

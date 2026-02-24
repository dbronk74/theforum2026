import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { useForum, type Side } from '@/state/forumState'
import { assetPath } from '@/utils/assetPath'

type TableRoom = {
  id: string
  title: string
  topic: string
  seats: number
  maxSeats: number
  mode: 'Open' | 'Moderated' | 'Evidence Sprint'
  aiModerator: string
  whiteboard: boolean
  fileDrop: boolean
  archiveCost: number
}
type IntroPhase = 'intro' | 'flash' | 'live'

type UploadItem = {
  id: string
  fileName: string
  sizeKb: number
  status: 'accepted' | 'blocked'
  reason: string
}

const ROOM_SEED: TableRoom[] = [
  {
    id: 'rt-1',
    title: 'Round Table Alpha',
    topic: 'Tariff policy and consumer impact',
    seats: 4,
    maxSeats: 8,
    mode: 'Moderated',
    aiModerator: 'Athena-R1',
    whiteboard: true,
    fileDrop: true,
    archiveCost: 6,
  },
  {
    id: 'rt-2',
    title: 'Round Table Beacon',
    topic: 'AI regulation and civil liberties',
    seats: 6,
    maxSeats: 8,
    mode: 'Evidence Sprint',
    aiModerator: 'Veritas-R2',
    whiteboard: true,
    fileDrop: true,
    archiveCost: 8,
  },
  {
    id: 'rt-3',
    title: 'Round Table Cinder',
    topic: 'Energy transition and grid reliability',
    seats: 3,
    maxSeats: 6,
    mode: 'Open',
    aiModerator: 'Helios-R3',
    whiteboard: false,
    fileDrop: true,
    archiveCost: 4,
  },
]

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export default function RoundTable() {
  const navigate = useNavigate()
  const {
    state,
    activeChallenge,
    setActiveChallenge,
    acceptChallenge,
    startPrep,
    addLifeline,
    startArena,
  } = useForum()

  const challenge = useMemo(() => {
    if (activeChallenge) return activeChallenge
    return state.challenges.find(item => item.status === 'accepted' || item.status === 'in_prep' || item.status === 'live') ?? null
  }, [activeChallenge, state.challenges])

  const [nowTick, setNowTick] = useState(Date.now())
  const [lifelineDraft, setLifelineDraft] = useState<Record<Side, string>>({ challenger: '', opponent: '' })
  const [contractChecks, setContractChecks] = useState({
    civility: false,
    evidence: false,
    noInterruption: false,
  })
  const [rooms, setRooms] = useState<TableRoom[]>(ROOM_SEED)
  const [joinedRooms, setJoinedRooms] = useState<string[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [whiteboardDraft, setWhiteboardDraft] = useState('')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

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

  function joinRoom(roomId: string) {
    if (joinedRooms.includes(roomId)) return
    setRooms(previous =>
      previous.map(room =>
        room.id === roomId && room.seats < room.maxSeats
          ? { ...room, seats: room.seats + 1 }
          : room,
      ),
    )
    setJoinedRooms(previous => [...previous, roomId])
  }

  function leaveRoom(roomId: string) {
    if (!joinedRooms.includes(roomId)) return
    setRooms(previous =>
      previous.map(room =>
        room.id === roomId && room.seats > 0
          ? { ...room, seats: room.seats - 1 }
          : room,
      ),
    )
    setJoinedRooms(previous => previous.filter(id => id !== roomId))
  }

  function openRoom(roomId: string) {
    setJoinedRooms(previous => (previous.includes(roomId) ? previous : [...previous, roomId]))
    setActiveRoomId(roomId)
  }

  const activeRoom = rooms.find(room => room.id === activeRoomId) ?? null

  function evaluateUpload(file: File): UploadItem {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowed = ['pdf', 'txt', 'md', 'docx', 'png', 'jpg', 'jpeg', 'webp']
    const suspiciousName = /(nsfw|gore|violence|hate|extremist)/i.test(file.name)
    const tooLarge = file.size > 6_000_000

    if (!allowed.includes(extension)) {
      return {
        id: createId('upload'),
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        status: 'blocked',
        reason: 'Unsupported file type for Round Table review.',
      }
    }
    if (suspiciousName) {
      return {
        id: createId('upload'),
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        status: 'blocked',
        reason: 'File name matched restricted content policy keywords.',
      }
    }
    if (tooLarge) {
      return {
        id: createId('upload'),
        fileName: file.name,
        sizeKb: Math.round(file.size / 1024),
        status: 'blocked',
        reason: 'File exceeds prototype upload limit (6MB).',
      }
    }
    return {
      id: createId('upload'),
      fileName: file.name,
      sizeKb: Math.round(file.size / 1024),
      status: 'accepted',
      reason: 'Accepted into chamber file shelf.',
    }
  }

  function handleFileDrop(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    const decisions = files.map(evaluateUpload)
    setUploads(previous => [...decisions, ...previous].slice(0, 24))
    event.target.value = ''
  }

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        {introPhase === 'intro' ? (
          <>
            <video
              src={assetPath('videos/round-table-intro.mp4')}
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('live')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(7,10,18,0.72)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Entering Round Table Chamber
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('live')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(152,236,255,0.95),rgba(72,164,255,0.86)_52%,rgba(5,12,30,0.95)_100%)]" />
        )}
      </div>
    )
  }

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Round Table Chamber</h1>
        <p className="text-gray-300 text-sm">
          Browse active table boards, join open seats, collaborate with embedded AI moderators, then escalate to formal arena debate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="text-xl font-display text-cyan-300 neon-text">Round Table Directory Board</div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {rooms.map(room => {
              const openSeats = Math.max(0, room.maxSeats - room.seats)
              const joined = joinedRooms.includes(room.id)
              return (
                <div key={room.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm text-cyan-200">{room.title}</div>
                      <div className="text-xs text-gray-400">{room.topic}</div>
                    </div>
                    <span className="rounded-2xl bg-white/10 px-2 py-1 text-xs text-gray-200">{room.mode}</span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-gray-400 md:grid-cols-4">
                    <div>Seats: {room.seats}/{room.maxSeats}</div>
                    <div>Open Seats: {openSeats}</div>
                    <div>AI Moderator: {room.aiModerator}</div>
                    <div>Archive Cost: {room.archiveCost} credits</div>
                  </div>

                  <div className="mt-2 grid gap-2 text-xs text-gray-300 md:grid-cols-2">
                    <div>Shared Whiteboard: {room.whiteboard ? 'Enabled' : 'Disabled'}</div>
                    <div>File/PDF Upload Scan: {room.fileDrop ? 'Enabled' : 'Disabled'}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {joined ? (
                      <Button variant="muted" onClick={() => leaveRoom(room.id)}>
                        Leave Seat
                      </Button>
                    ) : (
                      <Button onClick={() => joinRoom(room.id)} disabled={openSeats <= 0}>
                        {openSeats <= 0 ? 'Table Full' : 'Join Seat'}
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => openRoom(room.id)}>
                      Enter Room Realm
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
        <CardFooter>
          <p className="text-xs text-gray-400">
            Round table rooms can be archived later as paid knowledge artifacts. Live voice/video can be layered after avatar sync is added.
          </p>
        </CardFooter>
      </Card>

      {activeRoom ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xl font-display text-cyan-300 neon-text">{activeRoom.title} Realm</div>
                <div className="text-xs text-gray-400">{activeRoom.topic}</div>
              </div>
              <Button variant="ghost" onClick={() => setActiveRoomId(null)}>Exit Room</Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-cyan-200">Chamber View (Realm Prototype)</div>
                <div className="mt-3 h-64 rounded-xl border border-cyan-300/25 bg-[radial-gradient(circle_at_50%_30%,rgba(0,212,255,0.22),rgba(5,8,18,0.95)_70%)]">
                  <div className="grid h-full grid-cols-4 place-items-center">
                    {Array.from({ length: activeRoom.maxSeats }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-10 w-10 rounded-full border ${
                          index < activeRoom.seats ? 'border-cyan-300 bg-cyan-500/30' : 'border-white/20 bg-white/5'
                        }`}
                        title={index < activeRoom.seats ? `Seat ${index + 1}: occupied avatar` : `Seat ${index + 1}: open`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  Live chamber supports AI moderation, shared whiteboard, and file scanning gates. Voice/video sync can be attached after avatar networking.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-cyan-200">Room HUD</div>
                <div className="mt-3 space-y-2 text-xs text-gray-300">
                  <div>Mode: {activeRoom.mode}</div>
                  <div>Seats Occupied: {activeRoom.seats}/{activeRoom.maxSeats}</div>
                  <div>AI Moderator: {activeRoom.aiModerator}</div>
                  <div>Whiteboard: {activeRoom.whiteboard ? 'Enabled' : 'Disabled'}</div>
                  <div>File Scan: {activeRoom.fileDrop ? 'Enabled' : 'Disabled'}</div>
                  <div>Archive Cost: {activeRoom.archiveCost} credits</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="muted" onClick={() => navigate('/arena')}>Escalate to Arena</Button>
                  <Button variant="ghost" onClick={() => navigate('/ledger')}>Open Ledger</Button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-cyan-200">Shared Whiteboard</div>
                <textarea
                  value={whiteboardDraft}
                  onChange={event => setWhiteboardDraft(event.target.value)}
                  placeholder="Co-author argument structure, evidence links, and prep notes."
                  className="mt-3 min-h-[170px] w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm outline-none"
                />
                <div className="mt-2 text-xs text-gray-400">
                  AI moderator {activeRoom.aiModerator} can summarize this board into turn-ready talking points.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm text-cyan-200">File/PDF Drop + Safety Scan</div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileDrop}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 p-2 text-xs"
                />
                <div className="mt-3 max-h-[190px] space-y-2 overflow-auto pr-1">
                  {uploads.length === 0 ? <div className="text-xs text-gray-500">No files scanned in this room yet.</div> : null}
                  {uploads.map(item => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs">
                      <div className="text-gray-200">{item.fileName} ({item.sizeKb} KB)</div>
                      <div className={`mt-1 ${item.status === 'accepted' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {item.status.toUpperCase()}
                      </div>
                      <div className="mt-1 text-gray-400">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="text-xl font-display text-cyan-300 neon-text">Arena Staging Contract</div>
        </CardHeader>
        <CardBody>
          {!challenge ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-gray-300">No accepted challenge is waiting in staging.</p>
              <div className="mt-3">
                <Button onClick={() => navigate('/gauntlet')}>Open Gauntlet Queue</Button>
              </div>
            </div>
          ) : (
            <StagingBlock
              nowTick={nowTick}
              challenge={challenge}
              contractChecks={contractChecks}
              setContractChecks={setContractChecks}
              lifelineDraft={lifelineDraft}
              setLifelineDraft={setLifelineDraft}
              addLifeline={addLifeline}
              acceptChallenge={acceptChallenge}
              startPrep={startPrep}
              startArena={startArena}
              onOpenArena={() => navigate('/arena')}
              onBack={() => navigate('/gauntlet')}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function StagingBlock(props: {
  nowTick: number
  challenge: NonNullable<ReturnType<typeof useForum>['activeChallenge']>
  contractChecks: { civility: boolean; evidence: boolean; noInterruption: boolean }
  setContractChecks: Dispatch<SetStateAction<{ civility: boolean; evidence: boolean; noInterruption: boolean }>>
  lifelineDraft: Record<Side, string>
  setLifelineDraft: Dispatch<SetStateAction<Record<Side, string>>>
  addLifeline: (challengeId: string, side: Side, name: string) => void
  acceptChallenge: (challengeId: string) => void
  startPrep: (challengeId: string) => void
  startArena: (challengeId: string) => void
  onOpenArena: () => void
  onBack: () => void
}) {
  const {
    nowTick,
    challenge,
    contractChecks,
    setContractChecks,
    lifelineDraft,
    setLifelineDraft,
    addLifeline,
    acceptChallenge,
    startPrep,
    startArena,
    onOpenArena,
    onBack,
  } = props

  const prepRemaining = challenge.prepEndsAt ? Math.max(0, challenge.prepEndsAt - nowTick) : challenge.rules.prepMinutes * 60_000
  const prepReady = challenge.status === 'in_prep' && prepRemaining <= 0
  const liveAlready = challenge.status === 'live'
  const allRulesAcknowledged = Object.values(contractChecks).every(Boolean)

  function addLifelineFor(side: Side) {
    const candidate = lifelineDraft[side].trim()
    if (!candidate) return
    addLifeline(challenge.id, side, candidate)
    setLifelineDraft(previous => ({ ...previous, [side]: '' }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-base text-cyan-200">{challenge.challenger} vs {challenge.opponent}</div>
          <div className="text-xs text-gray-400">{challenge.claim}</div>
        </div>
        <span className="rounded-2xl bg-white/10 px-3 py-1 text-xs text-gray-100">{challenge.status}</span>
      </div>

      <div className="grid gap-3 text-xs text-gray-300 md:grid-cols-4">
        <div>Prep Window: {challenge.rules.prepMinutes} minutes</div>
        <div>Turn Time: {challenge.rules.turnSeconds} seconds</div>
        <div>Stake Locked: {challenge.rules.stake} credits each</div>
        <div>Injection Cost: {challenge.rules.injectionCost} credits</div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm text-gray-300">Prep Countdown</div>
        <div className="mt-1 text-4xl font-display text-cyan-300 neon-text">{formatCountdown(prepRemaining)}</div>
        <div className="mt-1 text-xs text-gray-500">Countdown starts when contract terms are acknowledged and prep is activated.</div>
      </div>

      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={contractChecks.civility}
            onChange={event => setContractChecks(previous => ({ ...previous, civility: event.target.checked }))}
          />
          <span>No insults, threats, or ad hominem attacks during debate and comments.</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={contractChecks.evidence}
            onChange={event => setContractChecks(previous => ({ ...previous, evidence: event.target.checked }))}
          />
          <span>Quantitative claims must include receipts from verifiable sources.</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={contractChecks.noInterruption}
            onChange={event => setContractChecks(previous => ({ ...previous, noInterruption: event.target.checked }))}
          />
          <span>One active speaker per turn. Rebuttal only after turn handoff.</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">{challenge.challenger} Lifelines</div>
          </CardHeader>
          <CardBody>
            <div className="mb-2 text-xs text-gray-400">
              {challenge.lifelines.challenger.length}/{challenge.rules.maxLifelines} registered
            </div>
            <ul className="space-y-2">
              {challenge.lifelines.challenger.map(name => (
                <li key={name} className="rounded-xl bg-white/5 px-3 py-2 text-sm">{name}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={lifelineDraft.challenger}
                onChange={event => setLifelineDraft(previous => ({ ...previous, challenger: event.target.value }))}
                placeholder="Add lifeline"
                className="w-full rounded-xl border border-white/10 bg-black/40 p-2 outline-none"
              />
              <Button
                onClick={() => addLifelineFor('challenger')}
                disabled={challenge.lifelines.challenger.length >= challenge.rules.maxLifelines}
              >
                Add
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">{challenge.opponent} Lifelines</div>
          </CardHeader>
          <CardBody>
            <div className="mb-2 text-xs text-gray-400">
              {challenge.lifelines.opponent.length}/{challenge.rules.maxLifelines} registered
            </div>
            <ul className="space-y-2">
              {challenge.lifelines.opponent.map(name => (
                <li key={name} className="rounded-xl bg-white/5 px-3 py-2 text-sm">{name}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={lifelineDraft.opponent}
                onChange={event => setLifelineDraft(previous => ({ ...previous, opponent: event.target.value }))}
                placeholder="Add lifeline"
                className="w-full rounded-xl border border-white/10 bg-black/40 p-2 outline-none"
              />
              <Button
                onClick={() => addLifelineFor('opponent')}
                disabled={challenge.lifelines.opponent.length >= challenge.rules.maxLifelines}
              >
                Add
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {challenge.status === 'open' ? <Button onClick={() => acceptChallenge(challenge.id)}>Accept Contract</Button> : null}
        {challenge.status === 'accepted' ? (
          <Button onClick={() => startPrep(challenge.id)} disabled={!allRulesAcknowledged}>
            Begin Prep Window
          </Button>
        ) : null}
        {challenge.status === 'in_prep' ? (
          <Button onClick={() => startArena(challenge.id)} disabled={!prepReady && !allRulesAcknowledged}>
            Open Portal to Arena
          </Button>
        ) : null}
        {liveAlready ? <Button onClick={onOpenArena}>Enter Live Arena</Button> : null}
        <Button variant="ghost" onClick={onBack}>Back to Gauntlet</Button>
      </div>
    </div>
  )
}

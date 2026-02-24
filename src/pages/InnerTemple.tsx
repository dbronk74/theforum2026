import { useMemo, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { useRealm } from '@/store/realmState'
import type { TempleOrb } from '@/store/templeSlice'
import { assetPath } from '@/utils/assetPath'

type Phase = 'gate' | 'intro' | 'temple'

function weaveThread(orb: TempleOrb, verse: string): string {
  const seed = verse.trim() || 'I seek better dialogue.'
  switch (orb) {
    case 'Clarity':
      return `Define one claim precisely: "${seed.slice(0, 100)}". Name one source that could falsify it.`
    case 'Empathy':
      return `State the strongest opposite view of "${seed.slice(0, 90)}" in two fair sentences before rebuttal.`
    case 'Resolve':
      return `Pick one civil action for the next debate round based on "${seed.slice(0, 90)}".`
  }
}

function createId(): string {
  return Math.random().toString(36).slice(2, 9)
}

export default function InnerTemple() {
  const {
    state: realmState,
    setTempleOrb,
    setTempleDrafts,
    openTempleSession,
    closeTempleSession,
    addTempleReflection,
    deleteTempleReflection,
  } = useRealm()

  const [phase, setPhase] = useState<Phase>('gate')
  const [acceptedLaw, setAcceptedLaw] = useState(false)

  const temple = realmState.temple
  const orb = temple.activeOrb
  const verse = temple.verseDraft
  const thread = temple.threadDraft

  const recent = useMemo(() => temple.reflections.slice(0, 8), [temple.reflections])
  const activeSession = temple.sessions.find(session => session.endedAt === null) ?? null

  function generateThread() {
    setTempleDrafts(verse, weaveThread(orb, verse))
  }

  function saveReflection() {
    const trimmedVerse = verse.trim()
    const trimmedThread = thread.trim()
    if (!trimmedVerse || !trimmedThread) return

    addTempleReflection({
      id: createId(),
      orb,
      verse: trimmedVerse,
      thread: trimmedThread,
      createdAt: new Date().toISOString(),
    })
  }

  function enterTemple() {
    if (!activeSession) {
      openTempleSession(orb)
    }
    setPhase('temple')
  }

  function exitTempleToGate() {
    if (activeSession) {
      closeTempleSession(activeSession.id)
    }
    setPhase('gate')
  }

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Inner Temple</h1>
        <p className="text-gray-300 text-sm">A reflective branch for calm recalibration before or after public debate.</p>
      </div>

      {phase === 'gate' ? (
        <Card>
          <CardHeader>
            <div className="text-lg text-cyan-200">Temple Gate Oath</div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-300">
              Enter only if you agree to speak with discipline, verify claims before certainty, and leave contempt outside this space.
            </p>
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-200">
              <input type="checkbox" checked={acceptedLaw} onChange={event => setAcceptedLaw(event.target.checked)} />
              I agree to The Forum laws of civility and factual integrity.
            </label>
          </CardBody>
          <CardFooter>
            <Button disabled={!acceptedLaw} onClick={() => setPhase('intro')}>
              Grant Access
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {phase === 'intro' ? (
        <Card>
          <CardHeader>
            <div className="text-lg text-cyan-200">Portal Sequence: Inner Temple</div>
          </CardHeader>
          <CardBody>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/30">
              <video
                src={assetPath('videos/inner-temple-intro.mp4')}
                className="w-full h-[56vh] object-cover"
                autoPlay
                muted
                playsInline
                controls={false}
                onEnded={enterTemple}
              />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              This branch stores meditation artifacts and ties them to your insight profile.
            </p>
          </CardBody>
          <CardFooter>
            <div className="flex flex-wrap gap-2">
              <Button onClick={enterTemple}>Enter Inner Temple</Button>
              <Button variant="ghost" onClick={() => setPhase('gate')}>Back to Gate</Button>
            </div>
          </CardFooter>
        </Card>
      ) : null}

      {phase === 'temple' ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="text-base text-cyan-200">Sacred Orbs</div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {(['Clarity', 'Empathy', 'Resolve'] as TempleOrb[]).map(item => (
                    <button
                      key={item}
                      onClick={() => setTempleOrb(item)}
                      className={`w-full text-left rounded-xl px-3 py-2 border ${orb === item ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/5 text-gray-300'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-2 text-xs text-gray-300">
                  <div>Clarity: {temple.insightProfile.clarity}</div>
                  <div>Empathy: {temple.insightProfile.empathy}</div>
                  <div>Resolve: {temple.insightProfile.resolve}</div>
                </div>
              </CardBody>
              <CardFooter>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setPhase('intro')}>Replay Intro Clip</Button>
                  <Button variant="muted" onClick={exitTempleToGate}>Close Session</Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-base text-cyan-200">Meditation Verse Canvas</div>
              </CardHeader>
              <CardBody>
                <textarea
                  value={verse}
                  onChange={event => setTempleDrafts(event.target.value, thread)}
                  placeholder="Write what you are trying to understand before your next debate."
                  className="w-full min-h-[170px] bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
                />
                <div className="mt-2 text-xs text-gray-400">Active orb: {orb}</div>
              </CardBody>
              <CardFooter>
                <Button onClick={generateThread}>Weave Mystic Thread</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-base text-cyan-200">Mystic Thread Weaver</div>
              </CardHeader>
              <CardBody>
                <textarea
                  value={thread}
                  onChange={event => setTempleDrafts(verse, event.target.value)}
                  placeholder="Generated reflection prompt appears here."
                  className="w-full min-h-[170px] bg-black/40 border border-white/10 rounded-2xl p-3 outline-none"
                />
              </CardBody>
              <CardFooter>
                <div className="flex gap-2">
                  <Button onClick={saveReflection}>Archive Reflection</Button>
                  <Button variant="ghost" onClick={() => setTempleDrafts('', '')}>Clear</Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="text-base text-cyan-200">Recent Temple Archives</div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {recent.length === 0 ? <div className="text-sm text-gray-500">No archived reflections yet.</div> : null}
                  {recent.map(entry => (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                      <div className="text-cyan-200">{entry.orb}</div>
                      <div className="text-gray-300 mt-1">{entry.verse}</div>
                      <div className="text-gray-500 mt-1">{entry.thread}</div>
                      <div className="mt-2">
                        <Button variant="ghost" onClick={() => deleteTempleReflection(entry.id)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-base text-cyan-200">Temple Session State</div>
              </CardHeader>
              <CardBody>
                {activeSession ? (
                  <div className="space-y-2 text-xs text-gray-300">
                    <div>Session: {activeSession.id}</div>
                    <div>Orb: {activeSession.orb}</div>
                    <div>Entries: {activeSession.entries}</div>
                    <div>Started: {new Date(activeSession.startedAt).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No active temple session.</div>
                )}

                <div className="mt-4 grid gap-2 text-xs text-gray-300">
                  <div className="rounded-xl bg-white/5 px-3 py-2">
                    Clarity Orb Energy: {temple.orbStates.Clarity.energy} | Attunement: {temple.orbStates.Clarity.attunement}
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-2">
                    Empathy Orb Energy: {temple.orbStates.Empathy.energy} | Attunement: {temple.orbStates.Empathy.attunement}
                  </div>
                  <div className="rounded-xl bg-white/5 px-3 py-2">
                    Resolve Orb Energy: {temple.orbStates.Resolve.energy} | Attunement: {temple.orbStates.Resolve.attunement}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { useForum } from '@/state/forumState'

type Filter = 'all' | 'challenger_win' | 'opponent_win' | 'draw' | 'declined' | 'no_show'
type IntroPhase = 'intro' | 'flash' | 'live'

export default function Ledger() {
  const navigate = useNavigate()
  const { state, setActiveChallenge, resolveAppeal } = useForum()
  const [filter, setFilter] = useState<Filter>('all')
  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')

  const filteredRecords = useMemo(
    () => state.ledger.filter(record => (filter === 'all' ? true : record.outcome === filter)),
    [filter, state.ledger],
  )

  const openAppeals = useMemo(
    () => state.appeals.filter(appeal => appeal.resolution === null),
    [state.appeals],
  )

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
              src="/videos/ledger-intro.mp4"
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('live')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(6,10,18,0.74)_85%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Opening Accountability Ledger
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('live')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(140,224,255,0.95),rgba(54,142,255,0.87)_52%,rgba(4,10,28,0.95)_100%)]" />
        )}
      </div>
    )
  }

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Public Accountability Ledger</h1>
        <p className="text-gray-300 text-sm">Transparent record of challenged claims, outcomes, and moderation governance.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-base text-cyan-200">Outcome Records</div>
            <select
              value={filter}
              onChange={event => setFilter(event.target.value as Filter)}
              className="bg-black/40 border border-white/10 rounded-xl p-2 text-sm outline-none"
            >
              <option value="all">All outcomes</option>
              <option value="challenger_win">Challenger wins</option>
              <option value="opponent_win">Opponent wins</option>
              <option value="draw">Draws</option>
              <option value="declined">Declined challenges</option>
              <option value="no_show">No-show challenges</option>
            </select>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {filteredRecords.length === 0 ? <div className="text-sm text-gray-500">No records for this filter yet.</div> : null}
            {filteredRecords.map(record => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-gray-200">
                    <span className="font-semibold">{record.challenger}</span> vs <span className="font-semibold">{record.opponent}</span>
                  </div>
                  <span className="px-2 py-1 rounded-2xl text-xs bg-white/10">{record.outcome}</span>
                </div>
                <div className="mt-2 text-sm text-gray-300">{record.claim}</div>
                <div className="mt-2 grid gap-2 text-xs text-gray-400 md:grid-cols-3">
                  <div>Score {record.challenger}: {record.challengerTotal}</div>
                  <div>Score {record.opponent}: {record.opponentTotal}</div>
                  <div>Stake Transfer: {record.stakesTransferred} credits</div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{record.reason}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveChallenge(record.challengeId)
                      navigate('/arena')
                    }}
                  >
                    Review Arena Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-base text-cyan-200">Appeal Queue</div>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {openAppeals.length === 0 ? <div className="text-sm text-gray-500">No pending appeals.</div> : null}
            {openAppeals.map(appeal => {
              const decision = state.aiDecisions.find(item => item.id === appeal.decisionId)
              return (
                <div key={appeal.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-gray-200">Requested by {appeal.requestedBy}</div>
                  <div className="text-xs text-gray-500 mt-1">{appeal.statement || 'No statement provided.'}</div>
                  <div className="text-xs text-gray-400 mt-2">{decision?.summary ?? 'Decision not found.'}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="muted" onClick={() => resolveAppeal(appeal.id, true)}>Uphold AI Decision</Button>
                    <Button onClick={() => resolveAppeal(appeal.id, false)}>Overturn AI Decision</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@/ui/Card'
import Button from '@/ui/Button'
import { useForum } from '@/state/forumState'
import { useRealm } from '@/store/realmState'
import { assetPath } from '@/utils/assetPath'

type Entry = { id: number; type: 'Ad' | 'Bet' | 'Tip' | 'Archive'; amount: number; note?: string }
type IntroPhase = 'intro' | 'flash' | 'live'

function totalUpTo(list: Entry[], index: number): number {
  return list.slice(0, index + 1).reduce((sum, item) => sum + item.amount, 0)
}

export default function Vault() {
  const { state } = useForum()
  const { state: realmState } = useRealm()
  const [introPhase, setIntroPhase] = useState<IntroPhase>('intro')
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, type: 'Ad', amount: 1.25, note: '15s view credit' },
    { id: 2, type: 'Bet', amount: -2.0, note: 'Lost on UBI debate' },
    { id: 3, type: 'Tip', amount: 4.5, note: 'Supporter tip' },
  ])

  useEffect(() => {
    if (introPhase !== 'flash') return
    const timer = window.setTimeout(() => setIntroPhase('live'), 700)
    return () => window.clearTimeout(timer)
  }, [introPhase])

  const total = entries.reduce((sum, item) => sum + item.amount, 0)
  const points = useMemo(() => {
    const trend = entries.map((entry, index) => ({ x: index, y: totalUpTo(entries, index) }))
    const max = Math.max(1, ...trend.map(point => point.y))
    const min = Math.min(0, ...trend.map(point => point.y))
    const span = max - min || 1
    return trend.map(point => `${10 + point.x * 30},${40 - ((point.y - min) / span) * 30}`).join(' ')
  }, [entries])

  const addEntry = (type: Entry['type'], amount: number, note?: string) =>
    setEntries(previous => [...previous, { id: previous.length + 1, type, amount, note }])

  const openAppeals = state.appeals.filter(appeal => appeal.resolution === null).length
  const recentSettlements = state.ledger.slice(0, 5)
  const richestCommenters = Object.entries(state.commenterCredits)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)

  const profileTotals = useMemo(() => {
    const profiles = Object.values(realmState.reasoning.byChallenge)
    return {
      badges: profiles.reduce((sum, profile) => sum + profile.badges.length, 0),
      relics: profiles.reduce((sum, profile) => sum + profile.relics.length, 0),
      pulseAverage:
        profiles.length > 0 ? Math.round(profiles.reduce((sum, profile) => sum + profile.spectatorPulse, 0) / profiles.length) : 0,
    }
  }, [realmState.reasoning.byChallenge])

  if (introPhase !== 'live') {
    return (
      <div className="fixed inset-0 z-[80] overflow-hidden bg-black">
        {introPhase === 'intro' ? (
          <>
            <video
              src={assetPath('videos/vault-intro.mp4')}
              className="h-screen w-screen object-cover"
              autoPlay
              muted
              playsInline
              controls={false}
              onEnded={() => setIntroPhase('flash')}
              onError={() => setIntroPhase('live')}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_32%,rgba(5,8,18,0.74)_84%)]" />
            <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-cyan-300/30 bg-black/60 px-4 py-2 text-xs text-cyan-100">
                Entering Resource Vault
              </div>
              <Button variant="ghost" onClick={() => setIntroPhase('live')}>Skip Intro</Button>
            </div>
          </>
        ) : (
          <div className="h-screen w-screen animate-pulse bg-[radial-gradient(circle_at_center,rgba(120,214,255,0.95),rgba(42,122,230,0.9)_56%,rgba(5,12,32,0.96)_100%)]" />
        )}
      </div>
    )
  }

  return (
    <div className="page space-y-6">
      <div>
        <h1 className="text-3xl font-display neon-text text-cyan-300">Relics + Resource Vault</h1>
        <p className="text-sm text-gray-300">Credit flow, archive costs, settlement tracking, and system treasury status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader><div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Wallet</div></CardHeader>
          <CardBody><div className={total >= 0 ? 'text-2xl text-emerald-300' : 'text-2xl text-rose-300'}>{total.toFixed(2)}</div></CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Community Treasury</div></CardHeader>
          <CardBody><div className="text-2xl text-cyan-200">{state.communityCredits}</div></CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Badges</div></CardHeader>
          <CardBody><div className="text-2xl text-cyan-200">{profileTotals.badges}</div></CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Relics</div></CardHeader>
          <CardBody><div className="text-2xl text-cyan-200">{profileTotals.relics}</div></CardBody>
        </Card>
        <Card>
          <CardHeader><div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Appeal Queue</div></CardHeader>
          <CardBody><div className="text-2xl text-amber-200">{openAppeals}</div></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-lg text-cyan-200">Credit Ledger</div>
            <div className={total >= 0 ? 'text-emerald-300' : 'text-rose-300'}>Balance: {total.toFixed(2)} credits</div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Entries</div>
              <ul className="max-h-[260px] space-y-2 overflow-auto pr-2">
                {entries.map(entry => (
                  <li key={entry.id} className="rounded-xl bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{entry.type}</span>
                      <span className={entry.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {entry.amount >= 0 ? '+' : ''}
                        {entry.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{entry.note}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-400">Balance Trend</div>
              <svg viewBox="0 0 200 50" className="h-24 w-full">
                <polyline fill="none" stroke="currentColor" className="text-cyan-300" strokeWidth="2" points={points} />
              </svg>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addEntry('Ad', 0.75, 'View credit')}>+ Ad +0.75</Button>
                <Button variant="muted" onClick={() => addEntry('Bet', -1.0, 'Wager lost')}>- Bet -1.00</Button>
                <Button variant="ghost" onClick={() => addEntry('Tip', 2.0, 'Fan tip')}>+ Tip +2.00</Button>
                <Button variant="ghost" onClick={() => addEntry('Archive', -3.0, 'Round table archive fee')}>- Archive -3.00</Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Recent Settlement Transfers</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {recentSettlements.length === 0 ? <div className="text-sm text-gray-500">No settlements published yet.</div> : null}
              {recentSettlements.map(settlement => (
                <div key={settlement.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                  <div className="text-gray-200">{settlement.claim}</div>
                  <div className="mt-1 text-gray-400">Outcome: {settlement.outcome} | Transfer: {settlement.stakesTransferred} credits</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="text-base text-cyan-200">Top Commenter Balances</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {richestCommenters.length === 0 ? <div className="text-sm text-gray-500">No commenter balances recorded yet.</div> : null}
              {richestCommenters.map(([name, balance]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                  <span className="text-gray-200">{name}</span>
                  <span className="text-cyan-200">{balance} credits</span>
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <div className="text-xs text-gray-400">
              Spectator Pulse average across challenges: {profileTotals.pulseAverage}. Civility fines and rewards route through this scoreboard.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

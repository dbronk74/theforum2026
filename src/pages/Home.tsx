import { motion } from 'framer-motion'
import Button from '@/ui/Button'
import Badge from '@/ui/Badge'
import FeatureCard from '@/components/FeatureCard'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <div className="grid md:grid-cols-2 gap-6 items-center mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="space-y-4">
          <Badge>Forum 2026 Prototype</Badge>
          <h1 className="text-5xl font-display neon-text text-cyan-300 leading-tight">Debate Journey Engine</h1>
          <p className="text-gray-300">
            Public challenges become accountable debates through a structured flow: contract, staging, live arena, and immutable outcome ledger.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/nexus')}>Enter Nexus</Button>
            <Button variant="muted" onClick={() => navigate('/chronomap')}>Open ChronoMap</Button>
            <Button onClick={() => navigate('/gauntlet')}>Issue Challenge</Button>
            <Button variant="ghost" onClick={() => navigate('/round-table')}>Enter Round Table</Button>
            <Button variant="muted" onClick={() => navigate('/arena')}>Open Arena</Button>
            <Button variant="ghost" onClick={() => navigate('/inner-temple')}>Inner Temple</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, delay: .1 }} className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <img src="/images/shared/arena_poster.svg" alt="Arena Poster" className="w-full h-full object-cover" />
        </motion.div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-9 gap-4 mt-10">
        <FeatureCard title="Nexus" subtitle="3D portal chamber · world navigation prototype" to="/nexus" />
        <FeatureCard title="ChronoMap" subtitle="Argument timeline graph · pulse and resonance events" to="/chronomap" />
        <FeatureCard title="Gauntlet" subtitle="Challenge contracts · acceptance · no-show tracking" to="/gauntlet" />
        <FeatureCard title="Round Table" subtitle="Rule lock-in · prep timer · lifeline assembly" to="/round-table" />
        <FeatureCard title="Arena" subtitle="AI moderation · evidence receipts · scorecards" to="/arena" />
        <FeatureCard title="Ledger" subtitle="Public accountability + appeal governance" to="/ledger" />
        <FeatureCard title="Inner Temple" subtitle="Portal intro · reflection archive · mystic thread" to="/inner-temple" />
        <FeatureCard title="Oracle" subtitle="Directive tracker · signal radar · perspective translation" to="/oracle" />
        <FeatureCard title="Vault" subtitle="Treasury, relic economy, and settlement transfer history" to="/vault" />
      </div>
    </div>
  )
}

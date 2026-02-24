import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
export default function FeatureCard({ title, subtitle, to }: { title:string, subtitle:string, to:string }) {
  const nav = useNavigate()
  return (
    <motion.button
      onClick={() => nav(to)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: .45 }}
      className="text-left glass w-full p-5 rounded-3xl border border-white/10 hover:border-cyan-400/60 shadow-glow"
    >
      <div className="text-xl font-display text-cyan-300 neon-text">{title}</div>
      <div className="text-sm text-gray-300 mt-1">{subtitle}</div>
    </motion.button>
  )
}

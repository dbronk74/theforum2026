import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/home', label: 'Home' },
  { to: '/nexus', label: 'Nexus' },
  { to: '/chronomap', label: 'ChronoMap' },
  { to: '/gauntlet', label: 'Gauntlet' },
  { to: '/round-table', label: 'Round Table' },
  { to: '/arena', label: 'Arena' },
  { to: '/ledger', label: 'Ledger' },
  { to: '/inner-temple', label: 'Inner Temple' },
  { to: '/oracle', label: 'Oracle' },
  { to: '/vault', label: 'Vault' },
  { to: '/about', label: 'About' },
]

export default function BranchHeader() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-black/70 to-black/30 backdrop-blur border-b border-white/10">
      <div className="page py-4 flex items-center justify-between">
        <div className="text-2xl font-display text-cyan-300 neon-text">The Forum 2026</div>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {nav.map(i => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-2xl transition outline-none ${isActive ? 'bg-white/10 ring-2 ring-cyan-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

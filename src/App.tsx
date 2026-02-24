import { Outlet, useLocation } from 'react-router-dom'
import BranchHeader from './ui/BranchHeader'

export default function App() {
  const location = useLocation()
  const isEntryGate = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {isEntryGate ? null : <BranchHeader />}
      <main className={isEntryGate ? 'flex-1' : 'flex-1 pt-6 pb-16'}>
        <Outlet />
      </main>
      {isEntryGate ? null : (
        <footer className="page text-sm text-gray-400 py-10">
          <div className="border-t border-white/10 pt-4">
            © {new Date().getFullYear()} The Forum 2026 — Nexus · ChronoMap · Gauntlet · Round Table · Arena · Ledger · Inner Temple · Oracle · Vault
          </div>
        </footer>
      )}
    </div>
  )
}

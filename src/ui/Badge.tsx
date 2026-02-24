export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block text-xs px-2 py-1 rounded-2xl bg-white/10 text-gray-200">{children}</span>
}

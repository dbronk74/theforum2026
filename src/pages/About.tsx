export default function About() {
  return (
    <div className="page space-y-4">
      <h1 className="text-3xl font-display neon-text text-cyan-300">About This Build (Forum 2026)</h1>
      <p className="text-gray-300">
        This iteration adds a full realm flow: sentinel entry gate, Nexus portal hub, ChronoMap semantic graph, challenge lifecycle branches,
        intro transitions, and governance tooling for moderated debate outcomes.
      </p>
      <ul className="list-disc ml-6 text-gray-300">
        <li>Entry gate: <code>/</code> with custom narration track and sentinel portal transition</li>
        <li>3D world seed: <code>/nexus</code> portal chamber with camera-look controls and branch entry points</li>
        <li>Map intelligence: <code>/chronomap</code> and <code>/forum/:id</code> semantic thread lens route</li>
        <li>Flow routes: <code>/gauntlet</code> {'->'} <code>/round-table</code> {'->'} <code>/arena</code> {'->'} <code>/ledger</code></li>
        <li>Reflection branch: <code>/inner-temple</code> with gate oath, intro portal video, and local reflection archive</li>
        <li>State model: <code>src/state/forumState.tsx</code> plus realm slices in <code>src/store/</code> for ChronoMap, reasoning, insight, and temple systems</li>
        <li>Legacy Arena visual retained via embedded <code>/prototypes/WorldSpeakArena_demo.html</code> inside the Arena page</li>
      </ul>
    </div>
  )
}

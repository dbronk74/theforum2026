export function Card({ children }: { children: React.ReactNode }) { return <div className="glass p-5 shadow-glow">{children}</div> }
export function CardHeader({ children }: { children: React.ReactNode }) { return <div className="mb-3 pb-3 border-b border-white/10">{children}</div> }
export function CardBody({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function CardFooter({ children }: { children: React.ReactNode }) { return <div className="mt-3 pt-3 border-t border-white/10">{children}</div> }

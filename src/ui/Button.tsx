import { PropsWithChildren } from 'react'
type Variant = 'solid' | 'ghost' | 'muted'
export default function Button({ children, variant='solid', ...rest }: PropsWithChildren<{ variant?: Variant } & React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  const base = 'px-4 py-2 rounded-2xl focus:outline-none focus-visible:ring-2 ring-cyan-400 transition'
  const variants: Record<Variant,string> = {
    solid:'bg-cyan-500 hover:bg-cyan-400 text-black',
    ghost:'bg-transparent hover:bg-white/10 text-cyan-300',
    muted:'bg-white/10 hover:bg-white/20 text-white'
  }
  return <button className={`shadow-glow ${base} ${variants[variant]}`} {...rest}>{children}</button>
}

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Ghost, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ThemeContext = createContext({ halloween: false, toggle: () => {} });
export const usePartyTheme = () => useContext(ThemeContext);

export function PartyThemeProvider({ children }: { children: ReactNode }) {
  const [halloween, setHalloween] = useState(() => localStorage.getItem('quiz-social-theme') === 'halloween');
  const toggle = () => setHalloween(previous => {
    localStorage.setItem('quiz-social-theme', previous ? 'party' : 'halloween');
    return !previous;
  });
  return <ThemeContext.Provider value={{ halloween, toggle }}><div data-theme={halloween ? 'halloween' : 'party'} className="min-h-screen bg-background text-foreground">{children}</div></ThemeContext.Provider>;
}

export function Brand() {
  return <Link to="/" aria-label="Quiz Social home" className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary"><Zap className="h-5 w-5 fill-white text-white" /></span><span className="display-font text-xl font-bold tracking-tight">quiz<span className="text-primary">social</span><span className="text-accent">.</span></span></Link>;
}

export function HowToPlay({ children }: { children: ReactNode }) {
  return <Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="rounded-2xl bg-card p-7"><DialogHeader><DialogTitle className="text-2xl">Your next great game night</DialogTitle></DialogHeader><div className="space-y-5 py-3">{[['01', 'Host sets the stage', 'Open the host preview to explore the dashboard. Real accounts and saved games are planned for Phase 2.'], ['02', 'Friends bring their phones', 'Try room 482913 in the player preview. No email or account is needed for the join flow.'], ['03', 'Let the trivia begin', 'Explore question, reveal, and leaderboard layouts. These previews are independent; live multiplayer is not connected yet.']].map(([number, title, text]) => <div key={number} className="flex gap-4"><span className="display-font text-xl text-primary">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div></div>)}</div><Button asChild className="party-button"><Link to="/host">Explore the host preview <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></DialogContent></Dialog>;
}

export function PartyLayout({ children }: { children: ReactNode }) {
  const { halloween, toggle } = usePartyTheme();
  return <><header className="border-b border-border/70"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8"><Brand /><nav className="hidden items-center gap-8 text-sm font-medium md:flex"><NavLink to="/" className={({ isActive }) => isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}>Home</NavLink><HowToPlay><button className="text-muted-foreground hover:text-foreground">How to play</button></HowToPlay><NavLink to="/host" className="text-muted-foreground hover:text-foreground">Host dashboard</NavLink></nav><div className="flex items-center gap-3"><Button variant="ghost" onClick={toggle} aria-label={halloween ? 'Switch to party theme' : 'Switch to Halloween theme'} className="rounded-xl border border-border text-muted-foreground"><Ghost className="h-4 w-4" /><span className="ml-2 hidden sm:inline">{halloween ? 'Halloween on' : 'Halloween mode'}</span></Button><Button asChild className="hidden rounded-xl bg-primary/15 text-primary hover:bg-primary/25 sm:inline-flex"><Link to="/join">Join a game <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div></div></header>{children}<footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-border/70 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:px-8"><Brand /><p>Good friends. Questionable answers. Great nights.</p><span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Phase 1 · Interface preview</span></footer></>;
}

export function PreviewNotice({ className = '' }: { className?: string }) {
  return <p className={`rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground ${className}`}><span className="font-semibold text-primary">Interface preview.</span> Sample data only. No live room, authentication, database, or device synchronization is connected.</p>;
}

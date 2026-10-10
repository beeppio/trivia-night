import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Ghost, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function PartyLayout({ children }: { children: ReactNode }) {
  const { halloween, toggle } = usePartyTheme();
  return <>
    <header className="border-b border-border/70">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Brand />
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}>Home</NavLink>
            <NavLink to="/host" className="text-muted-foreground hover:text-foreground">Host</NavLink>
          </nav>
          <Button variant="ghost" onClick={toggle} aria-label={halloween ? 'Switch to party theme' : 'Switch to Halloween theme'} className="rounded-xl border border-border text-muted-foreground">
            <Ghost className="h-4 w-4" /><span className="ml-2 hidden sm:inline">{halloween ? 'Halloween on' : 'Halloween mode'}</span>
          </Button>
        </div>
      </div>
    </header>
    {children}
    <footer className="mx-auto max-w-7xl border-t border-border/70 px-5 py-7 text-center text-xs text-muted-foreground sm:px-8">
      Phase 1 · Interface preview
    </footer>
  </>;
}

export function PreviewNotice({ className = '' }: { className?: string }) {
  return <p className={`rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground ${className}`}><span className="font-semibold text-primary">Interface preview.</span> Sample data only. No live room, authentication, database, or device synchronization is connected.</p>;
}

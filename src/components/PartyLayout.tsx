import { createContext, useContext, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { PREVIEW_ROOM } from '@/lib/preview-data';

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

export function Brand({ large = false }: { large?: boolean }) {
  return <Link to="/" aria-label="285's Trivia Night home" className={`flex shrink-0 items-center justify-center bg-primary/15 text-primary ${large ? 'mx-auto mb-6 h-20 w-20 rounded-3xl' : 'h-10 w-10 rounded-xl'}`}><Brain aria-hidden="true" className={large ? 'h-12 w-12' : 'h-6 w-6'} strokeWidth={1.7} /></Link>;
}

export function PartyLayout({ children, showHeaderLogo = true }: { children: ReactNode; showHeaderLogo?: boolean }) {
  return <>
    <header className="border-b border-border/70">
      <div className={`mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-4 px-5 py-4 sm:px-8 ${showHeaderLogo ? 'justify-between' : 'justify-end'}`}>
        {showHeaderLogo && <Brand />}
        <div className="flex items-center gap-4 sm:gap-6">
          <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}>Home</NavLink>
            <NavLink to="/host" className="text-muted-foreground hover:text-foreground">Host</NavLink>
            <NavLink to={`/player/${PREVIEW_ROOM}?preview=1`} className="text-muted-foreground hover:text-foreground">Player</NavLink>
          </nav>
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
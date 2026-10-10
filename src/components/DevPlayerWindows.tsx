import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Gamepad2, GripHorizontal, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionQuestion } from '@/components/SessionQuestion';
import type { Team } from '@/components/TeamAnswers';
import type { PlayerSubmission, PublicSession } from '@/hooks/use-local-session';
import { PlayerGameView } from '@/components/PlayerGameView';

function PlayerWindow({ team, session, onSubmit, onMinimize, order, onFocus }: { team: Team; session: PublicSession | null; onSubmit: (submission: PlayerSubmission) => void; onMinimize: () => void; order: number; onFocus: () => void }) {
  const [position, setPosition] = useState({ x: Math.max(8, window.innerWidth - 380 - (order % 4) * 25), y: 80 + (order % 4) * 25 });
  const element = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const clamp = (x: number, y: number) => ({ x: Math.max(0, Math.min(x, window.innerWidth - (element.current?.offsetWidth || 340))), y: Math.max(0, Math.min(y, window.innerHeight - 110)) });
  useEffect(() => {
    const resize = () => setPosition(previous => clamp(previous.x, previous.y));
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
    onFocus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y };
  };
  return <div ref={element} role="region" aria-label={`${team.name} player preview`} onPointerDown={onFocus} style={{ left: position.x, top: position.y, zIndex: 50 + order }} className="fixed w-[350px] max-w-[calc(100vw-16px)] overflow-hidden rounded-2xl border border-primary/50 bg-card shadow-2xl">
    <div onPointerDown={startDrag} onPointerMove={event => { if (drag.current) setPosition(clamp(drag.current.left + event.clientX - drag.current.x, drag.current.top + event.clientY - drag.current.y)); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} className="flex touch-none select-none items-center gap-2 border-b border-primary/25 bg-secondary px-4 py-3 cursor-grab active:cursor-grabbing">
      <Gamepad2 className="h-4 w-4 text-primary" /><h2 className="flex-1 text-sm font-semibold">{team.name}</h2><GripHorizontal aria-hidden="true" className="h-4 w-4 text-muted-foreground" /><Button variant="ghost" size="icon" aria-label={`Minimize ${team.name}`} className="h-7 w-7 rounded-lg hover:bg-primary/15" onClick={onMinimize}><Minus className="h-4 w-4" /></Button>
    </div>
    <div className="max-h-[min(65svh,600px)] overflow-y-auto px-4">
      <PlayerGameView profile={team} session={session} onSubmit={answer => { if (session) onSubmit({ runId: session.runId, teamId: team.id, name: team.name, answer }); }} />
    </div>
  </div>;
}

export function DevPlayerWindows({ teams, session, onAdd, onSubmit }: { teams: Team[]; session: PublicSession | null; onAdd: () => void; onSubmit: (submission: PlayerSubmission) => void }) {
  const [minimized, setMinimized] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const focus = (id: string) => setStack(previous => [...previous.filter(item => item !== id), id]);
  return <>
    {teams.map((team, index) => <div key={team.id} className={minimized.includes(team.id) ? 'hidden' : ''}><PlayerWindow team={team} session={session} onSubmit={onSubmit} onMinimize={() => setMinimized(previous => [...previous, team.id])} order={stack.includes(team.id) ? teams.length + stack.indexOf(team.id) : index} onFocus={() => focus(team.id)} /></div>)}
    <div className="fixed inset-x-0 bottom-0 z-[1000] flex items-center gap-2 overflow-x-auto border-t border-primary/30 bg-card px-4 py-3 shadow-xl">
      <Button className="shrink-0 rounded-xl text-white" onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Add player</Button>
      {teams.map(team => <Button key={team.id} variant="outline" aria-pressed={!minimized.includes(team.id)} className={`shrink-0 rounded-xl ${!minimized.includes(team.id) ? 'border-primary/50 bg-primary/10 text-primary' : 'bg-transparent'}`} onClick={() => { setMinimized(previous => previous.filter(id => id !== team.id)); focus(team.id); }}><Gamepad2 className="mr-2 h-4 w-4" />{team.name}</Button>)}
      <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">Dev player previews</span>
    </div>
  </>;
}
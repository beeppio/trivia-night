import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatSeconds } from '@/hooks/use-local-session';

export function Buzzer({ duration, remaining, running, countdownDuration, deadline, onChange }: { duration: number; remaining: number; running: boolean; countdownDuration: number; deadline: number | null; onChange: (seconds: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(duration));
  const save = () => {
    const value = Number(draft);
    if (Number.isFinite(value) && value >= 5 && value <= 3600) onChange(Math.round(value));
    setEditing(false);
  };
  return <section className="panel p-5">
    <h2 className="eyebrow">Buzzer</h2>
    <div className="my-4 flex items-center justify-center gap-3">
      {editing ? <Input autoFocus aria-label="Seconds per question" type="number" min="5" max="3600" value={draft} onChange={event => setDraft(event.target.value)} onFocus={event => event.target.select()} onBlur={save} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setEditing(false); }} className="h-16 w-40 rounded-xl bg-transparent text-center text-3xl" /> : <button type="button" title="Double-click to edit seconds per question" aria-label={`Buzzer ${formatSeconds(remaining)}. Double-click to edit duration.`} onDoubleClick={() => { setDraft(String(duration)); setEditing(true); }} className="display-font rounded-xl px-2 py-2 text-5xl font-bold tabular-nums text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{formatSeconds(remaining)}</button>}
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="icon" aria-label="Add 5 seconds" disabled={duration >= 3600} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/15" onClick={() => onChange(Math.min(3600, duration + 5))}><ChevronUp className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label="Remove 5 seconds" disabled={duration <= 5} className="h-8 w-8 rounded-lg text-primary hover:bg-primary/15" onClick={() => onChange(Math.max(5, duration - 5))}><ChevronDown className="h-5 w-5" /></Button>
      </div>
    </div>
    <div role="progressbar" aria-label="Buzzer time remaining" aria-valuemin={0} aria-valuemax={running ? countdownDuration : duration} aria-valuenow={remaining} className="mb-4 h-2.5 overflow-hidden rounded-full bg-secondary"><div style={{ width: `${Math.max(0, Math.min(100, (deadline ? Math.max(0, (deadline - Date.now()) / 1000) : duration) / (running ? countdownDuration : duration) * 100))}%` }} className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear motion-reduce:transition-none" /></div>
    <p className="text-center text-xs text-muted-foreground">{duration} seconds per question{running ? ' · changes apply next question' : ''}</p>
  </section>;
}
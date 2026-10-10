import { Check, CircleSlash, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type Team = { id: string; name: string };
export type TeamAnswer = { teamId: string; answer: string; grade?: number };

export function TeamAnswers({ teams, answers, points, onPointsChange, onGrade }: { teams: Team[]; answers: TeamAnswer[]; points: number; onPointsChange: (points: number) => void; onGrade: (teamId: string, grade: number) => void }) {
  return <section className="mt-7 space-y-4 border-t-2 border-dotted border-primary/60 pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-primary">Team answers</h2><label className="flex items-center gap-2 text-xs text-muted-foreground">Full points<Input aria-label="Full points for this question" type="number" min="1" max="1000" step="1" value={points} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= 1000) onPointsChange(value); }} className="h-9 w-20 rounded-lg bg-transparent text-center" /></label></div>
    {teams.length === 0 ? <p className="text-sm text-muted-foreground">Add a test player below to submit team answers.</p> : <ul className="space-y-3">{teams.map(team => {
      const submission = answers.find(answer => answer.teamId === team.id);
      return <li key={team.id} className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{team.name}</h3>{submission?.grade !== undefined && <span className="text-sm font-semibold text-primary">{submission.grade * points} points</span>}</div>
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{submission?.answer || 'Waiting for an answer…'}</p>
        <div className="flex flex-wrap gap-2">{[{ label: 'Incorrect', fraction: 0, Icon: CircleSlash }, { label: 'Half correct', fraction: 0.5, Icon: Circle }, { label: 'Correct', fraction: 1, Icon: Check }].map(({ label, fraction, Icon }) => <Button key={label} variant="outline" size="sm" disabled={!submission} aria-pressed={submission?.grade === fraction} onClick={() => onGrade(team.id, fraction)} className={`h-auto rounded-lg px-3 py-2 text-xs ${submission?.grade === fraction ? 'border-primary bg-primary/20 text-primary hover:bg-primary/25' : 'bg-transparent'}`}><Icon className="mr-1.5 h-3.5 w-3.5" />{label} · {points * fraction}</Button>)}</div>
      </li>;
    })}</ul>}
  </section>;
}

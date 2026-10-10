import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NewGameDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (title: string) => boolean }) {
  const [title, setTitle] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    if (onCreate(title.trim())) {
      setTitle('');
      onOpenChange(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-card p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a new game</DialogTitle>
          <DialogDescription className="pt-2 leading-6">Name your game to create a draft. Drafts are saved only in this browser. Question editing and online storage aren’t connected yet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-3 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-game-title">Game name</Label>
            <Input id="new-game-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. 285’s Trivia Night" maxLength={80} required className="h-12 rounded-xl bg-background" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()} className="rounded-xl">Create game</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

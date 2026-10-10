import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Copy, Crown, Eye, Monitor, Pencil, Play, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PartyLayout } from '@/components/PartyLayout';
import { NewGameDialog } from '@/components/NewGameDialog';
import { GameMediaList } from '@/components/GameMedia';
import { HostPlayers } from '@/components/HostPlayers';
import { DevPlayerWindows } from '@/components/DevPlayerWindows';
import { TeamAnswers, type Team, type TeamAnswer } from '@/components/TeamAnswers';
import { Buzzer } from '@/components/Buzzer';
import { QuestionMedia } from '@/components/QuestionMedia';
import { PREVIEW_ROOM } from '@/lib/preview-data';
import { loadGames, readLegacyDrafts, saveGame, deleteGame, type LocalGame } from '@/lib/local-games';
import { useRoundMusic } from '@/hooks/use-round-music';
import { useHostSession, useRemainingSeconds, type PlayerSubmission, type PublicSession } from '@/hooks/use-local-session';
import { useTVPreview } from '@/hooks/use-tv-preview';
import { PlayerLobby } from '@/components/PlayerLobby';

type Stage = 'lobby' | 'waiting' | 'preparing' | 'question' | 'closed' | 'reveal' | 'ended';

export default function Host() {
  const [games, setGames] = useState<LocalGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [editor, setEditor] = useState<{ game?: LocalGame } | null>(null);
  const [activeGame, setActiveGame] = useState<LocalGame | null>(null);
  const [stage, setStage] = useState<Stage>('lobby');
  const [index, setIndex] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [duration, setDuration] = useState(() => {
    const saved = Number(localStorage.getItem('285-buzzer-seconds') || 30);
    return Number.isInteger(saved) && saved >= 5 && saved <= 3600 ? saved : 30;
  });
  const [questionDuration, setQuestionDuration] = useState(duration);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [imagesRevealed, setImagesRevealed] = useState(false);
  const [videoStartedAt, setVideoStartedAt] = useState<number | null>(null);
  const [runId, setRunId] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [answers, setAnswers] = useState<Record<string, TeamAnswer[]>>({});
  const [points, setPoints] = useState<Record<string, number>>({});
  const [publishedResults, setPublishedResults] = useState<Record<string, TeamAnswer[]>>({});
  const [answerMediaStartedAt, setAnswerMediaStartedAt] = useState<number | null>(null);
  const [questionRuns, setQuestionRuns] = useState<Record<number, string>>({});
  const [mediaPausedAt, setMediaPausedAt] = useState<number | null>(null);
  const [answerMediaPausedAt, setAnswerMediaPausedAt] = useState<number | null>(null);
  const remaining = useRemainingSeconds(deadline, deadline ? questionDuration : duration);
  const music = useRoundMusic();

  useEffect(() => { if (deadline && remaining === 0 && stage === 'question') closeQuestion(); }, [deadline, remaining, stage]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        const stored = await loadGames();
        const legacy = readLegacyDrafts();
        const migrated = legacy.filter(game => !stored.some(existing => existing.id === game.id));
        for (const game of migrated) await saveGame(game);
        if (legacy.length) localStorage.removeItem('285-trivia-drafts');
        if (!cancelled) setGames([...stored, ...migrated]);
      } catch {
        if (!cancelled) { setStorageError(true); toast.error('Unable to load local games. Check browser storage permissions.'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  const persistGame = async (game: LocalGame) => {
    try {
      await saveGame(game);
      setGames(previous => previous.some(item => item.id === game.id) ? previous.map(item => item.id === game.id ? game : item) : [...previous, game]);
      setStorageError(false);
      toast.success('Game and attachments saved in this browser');
      return true;
    } catch { toast.error('Unable to save. Browser storage may be full or unavailable.'); return false; }
  };
  const removeGame = async (id: string) => {
    try {
      await deleteGame(id);
      setGames(previous => previous.filter(game => game.id !== id));
      toast.success('Game deleted from this browser');
      return true;
    } catch { toast.error('Unable to delete the game. Please try again.'); return false; }
  };

  const changeDuration = (seconds: number) => { setDuration(seconds); localStorage.setItem('285-buzzer-seconds', String(seconds)); };

  const questions = useMemo(() => activeGame?.rounds.flatMap((round, roundIndex) => round.questions.map((question, questionIndex) => ({ ...question, roundName: round.name, roundDescription: round.description, roundIndex, questionIndex }))) || [], [activeGame]);
  const question = questions[index];
  const fullPoints = points[runId] ?? question?.points ?? 10;
  const scoredTeams = useMemo(() => teams.map(team => ({ ...team, score: Object.entries(publishedResults).reduce((total, [id, submissions]) => total + (submissions.find(answer => answer.teamId === team.id)?.grade ?? 0) * (points[id] ?? 10), 0) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), [teams, publishedResults, points]);
  const publicSession = useMemo<PublicSession | null>(() => !activeGame || !question || stage === 'lobby' ? null : ({
    runId, title: activeGame.title, waiting: stage === 'waiting', preparing: stage === 'preparing', questionPoints: fullPoints, mediaPausedAt, answerMediaPausedAt, roundName: stage === 'waiting' ? '' : question.roundName, roundDescription: question.roundDescription?.trim() || undefined, roundIndex: question.roundIndex, questionIndex: question.questionIndex,
    text: stage === 'waiting' || stage === 'preparing' ? '' : question.text, media: stage === 'waiting' || stage === 'preparing' ? [] : question.questionMedia, imagesRevealed, videoStartedAt, answerMediaStartedAt, deadline, duration: deadline ? questionDuration : duration,
    open: stage === 'question' && deadline !== null, ended: stage === 'ended', rankings: scoredTeams,
    submittedTeamIds: (answers[runId] || []).filter(answer => answer.submitted !== false).map(answer => answer.teamId),
    ...(stage === 'reveal' ? { answer: question.answer, answerMedia: question.answerMedia, results: (publishedResults[runId] || []).map(result => ({ ...result, points: (result.grade ?? 0) * fullPoints })) } : {}),
  }), [activeGame, question, stage, runId, imagesRevealed, videoStartedAt, mediaPausedAt, answerMediaPausedAt, answerMediaStartedAt, deadline, questionDuration, duration, scoredTeams, publishedResults, fullPoints, answers]);

  const tvSession = useMemo<PublicSession>(() => publicSession ?? {
    runId: '', title: '', waiting: true, roundName: '', roundIndex: 0, questionIndex: 0,
    text: '', media: [], imagesRevealed: false, videoStartedAt: null, answerMediaStartedAt: null,
    deadline: null, duration, open: false, ended: false,
    rankings: scoredTeams.map(team => ({ ...team, score: 0 })),
  }, [publicSession, duration, scoredTeams]);

  const openTVPreview = useTVPreview(tvSession);

  function receiveSubmission(submission: PlayerSubmission) {
    if (submission.runId !== runId || stage !== 'question' || !deadline || Date.now() >= deadline) return;
    setTeams(previous => previous.some(team => team.id === submission.teamId) ? previous : [...previous, { id: submission.teamId, name: submission.name }]);
    setAnswers(previous => {
      const existing = previous[runId] || [];
      if (existing.some(answer => answer.teamId === submission.teamId)) return previous;
      return { ...previous, [runId]: [...existing, { teamId: submission.teamId, answer: submission.answer }] };
    });
  }
  const registerTeam = (profile: Team) => setTeams(previous => {
    const existing = previous.find(team => team.id === profile.id);
    if (existing?.name === profile.name && existing?.avatarUrl === profile.avatarUrl && existing?.ready === profile.ready && JSON.stringify(existing?.frames) === JSON.stringify(profile.frames)) return previous;
    return existing ? previous.map(team => team.id === profile.id ? profile : team) : [...previous, profile];
  });
  useHostSession(publicSession, receiveSubmission, registerTeam);
  const gradeAnswer = (teamId: string, grade: number) => {
    setAnswers(previous => ({ ...previous, [runId]: (previous[runId] || []).map(answer => answer.teamId === teamId ? { ...answer, grade } : answer) }));
    if (stage === 'reveal') setPublishedResults(previous => ({ ...previous, [runId]: (previous[runId] || []).map(answer => answer.teamId === teamId ? { ...answer, grade } : answer) }));
  };
  function completeAnswers() {
    const submitted = answers[runId] || [];
    return [...submitted, ...teams.filter(team => !submitted.some(answer => answer.teamId === team.id)).map(team => ({ teamId: team.id, answer: 'No Answer', grade: 0, submitted: false }))];
  }
  function closeQuestion() {
    setAnswers(previous => ({ ...previous, [runId]: completeAnswers() }));
    setStage('closed');
  }
  const revealAnswer = () => { const completed = completeAnswers(); setAnswers(previous => ({ ...previous, [runId]: completed })); setPublishedResults(previous => ({ ...previous, [runId]: completed.map(answer => ({ ...answer })) })); setStage('reveal'); };

  const addPlayer = () => setTeams(previous => [...previous, { id: crypto.randomUUID(), name: `Player ${previous.filter(team => /^Player \d+$/.test(team.name)).length + 1}`, ready: false }]);

  const playable = (game: LocalGame) => game.rounds.every(round => round.questions.length > 0 && round.questions.every(item => item.text.trim() && item.answer.trim()));
  const resetQuestion = () => {
    const nextRun = crypto.randomUUID();
    setAnswers(previous => { const updated = { ...previous }; delete updated[runId]; return updated; });
    setPublishedResults(previous => { const updated = { ...previous }; delete updated[runId]; return updated; });
    setPoints(previous => ({ ...previous, [nextRun]: fullPoints }));
    setAnswerMediaStartedAt(null); setMediaPausedAt(null); setAnswerMediaPausedAt(null);
    setQuestionRuns(previous => ({ ...previous, [index]: nextRun }));
    setStage('question'); setQuestionDuration(duration); setDeadline(Date.now() + duration * 1000); setImagesRevealed(true); setVideoStartedAt(null); setRunId(nextRun);
  };
  const chooseGame = (game: LocalGame) => {
    const firstRun = crypto.randomUUID();
    setAnswers({}); setPublishedResults({}); setPoints({ [firstRun]: game.rounds[0].questions[0].points ?? 10 }); setAnswerMediaStartedAt(null); setQuestionRuns({ 0: firstRun }); setRunId(firstRun);
    setActiveGame(game); setIndex(0); setStage('waiting'); setDeadline(null); setImagesRevealed(false); setVideoStartedAt(null); setMediaPausedAt(null); setAnswerMediaPausedAt(null);
  };
  const allReady = teams.length > 0 && teams.every(team => team.ready && team.name.trim());
  const startGame = () => {
    if (!allReady || !activeGame || stage !== 'waiting') return;
    setStage('preparing');
    music.switchTrack(activeGame.rounds[0].music);
  };
  const startRound = () => {
    if (stage !== 'preparing') return;
    setStage('question'); setImagesRevealed(true); setQuestionDuration(duration); setDeadline(Date.now() + duration * 1000);
  };
  const playVideo = () => { setMediaPausedAt(null); setVideoStartedAt(Date.now()); };
  const toggleQuestionMedia = () => {
    if (!videoStartedAt) { playVideo(); return; }
    if (mediaPausedAt !== null) { setVideoStartedAt(videoStartedAt + Date.now() - mediaPausedAt); setMediaPausedAt(null); }
    else setMediaPausedAt(Date.now());
  };
  const toggleAnswerMedia = () => {
    if (!answerMediaStartedAt) { setAnswerMediaPausedAt(null); setAnswerMediaStartedAt(Date.now()); return; }
    if (answerMediaPausedAt !== null) { setAnswerMediaStartedAt(answerMediaStartedAt + Date.now() - answerMediaPausedAt); setAnswerMediaPausedAt(null); }
    else setAnswerMediaPausedAt(Date.now());
  };
  const changeQuestion = (next: number) => {
    if (next > index && (deadline === null || Date.now() < deadline)) return;
    const differentRound = questions[next].roundIndex !== question.roundIndex;
    if (differentRound) music.switchTrack(activeGame?.rounds[questions[next].roundIndex].music);
    const previousRun = questionRuns[next];
    const nextRun = previousRun || crypto.randomUUID();
    const isReview = Boolean(previousRun && (publishedResults[nextRun] || answers[nextRun]?.length));
    const showRoundIntro = differentRound && !isReview;
    setIndex(next);
    setQuestionRuns(previous => ({ ...previous, [next]: nextRun }));
    setPoints(previous => ({ ...previous, [nextRun]: previous[nextRun] ?? questions[next].points ?? 10 }));
    setAnswerMediaStartedAt(null); setMediaPausedAt(null); setAnswerMediaPausedAt(null); setRunId(nextRun);
    setStage(isReview ? publishedResults[nextRun] ? 'reveal' : 'closed' : showRoundIntro ? 'preparing' : 'question');
    setQuestionDuration(duration);
    setDeadline(showRoundIntro ? null : isReview ? Date.now() : Date.now() + duration * 1000);
    setImagesRevealed(!showRoundIntro); setVideoStartedAt(null);
  };
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(PREVIEW_ROOM); toast.success('Preview room code copied'); }
    catch { toast.error(`Clipboard unavailable. The preview code is ${PREVIEW_ROOM}.`); }
  };

  return <PartyLayout>
    <main className="mx-auto max-w-7xl px-5 pb-28 pt-9 sm:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-primary sm:text-3xl"><Crown aria-hidden="true" className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />Host Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl"><Link to={`/player/${PREVIEW_ROOM}?preview=1`} target="_blank" rel="noopener noreferrer"><Eye className="mr-2 h-4 w-4" /> Player preview</Link></Button>
          <Button variant="outline" className="rounded-xl border-primary/40 bg-primary/10 text-primary" onClick={openTVPreview}><Monitor className="mr-2 h-4 w-4" /> Dev TV preview</Button>
          <Button asChild className="rounded-xl"><Link to={`/display/${PREVIEW_ROOM}`} target="_blank" rel="noopener noreferrer"><Monitor className="mr-2 h-4 w-4" /> Open display</Link></Button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="panel p-5 sm:p-7">
          {stage !== 'lobby' && <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
            <div className="min-w-0 flex-1">{activeGame && <p className="break-words text-lg font-semibold text-primary">{activeGame.title}</p>}{question && stage !== 'waiting' && <p className="mt-1 text-xs text-muted-foreground">Round {question.roundIndex + 1} · {question.roundName} · Question {question.questionIndex + 1}</p>}</div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">{stage}</span>
          </div>}
          {stage === 'lobby' ? loading ? <p role="status" className="py-12 text-center text-muted-foreground">Loading your games…</p> : storageError ? <p role="alert" className="py-12 text-center text-destructive">Local game storage is unavailable. Allow browser storage and refresh to retry.</p> : <div className="py-5">
            <h2 className="mb-4 text-lg font-semibold">Your games</h2>
            <div className="space-y-4">{games.map(game => <article key={game.id} className="rounded-2xl border border-border bg-secondary/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0"><h3 className="break-words text-lg font-semibold text-primary">{game.title || 'Untitled game'}</h3><p className="mt-2 text-xs text-muted-foreground">{game.rounds.length} rounds · {game.rounds.reduce((total, round) => total + round.questions.length, 0)} questions</p></div>
                <div className="flex items-center gap-2">
                  <Button className="rounded-xl text-white" disabled={!playable(game)} onClick={() => chooseGame(game)}><Play className="mr-2 h-4 w-4 fill-white text-white" /> Choose game</Button>
                  <Button variant="ghost" size="icon" aria-label={`Edit ${game.title || 'untitled game'}`} title="Edit game" className="rounded-xl border-0 bg-transparent text-primary hover:bg-transparent hover:text-foreground" onClick={() => setEditor({ game })}><Pencil className="h-4 w-4" /></Button>
                </div>
              </div>
              {!playable(game) && <p className="mt-3 text-xs text-muted-foreground">Add questions and answers in Edit before starting.</p>}
            </article>)}
              <Button variant="outline" onClick={() => setEditor({})} className="h-12 w-full gap-3 rounded-2xl border-2 border-dotted border-primary/50 bg-transparent px-5 text-sm text-primary hover:border-primary hover:bg-primary/10 hover:text-primary"><Plus aria-hidden="true" className="h-5 w-5" /> Add new game</Button>
            </div>
          </div> : stage === 'waiting' ? <div className="space-y-6"><PlayerLobby teams={scoredTeams} /><Button className="h-12 w-full rounded-2xl text-white" disabled={!allReady} onClick={startGame}><Play className="mr-2 h-4 w-4" />Start game</Button><p className="text-center text-sm text-muted-foreground">{allReady ? 'Everyone is ready. Time to play!' : 'At least one team must join, and every team must be ready.'}</p><Button variant="ghost" className="rounded-xl text-primary" onClick={() => { setActiveGame(null); setStage('lobby'); }}>Choose a different game</Button></div> : stage === 'preparing' ? <section className="flex min-h-80 flex-col items-center justify-center gap-6 py-10 text-center"><p className="eyebrow text-primary">Round {(question?.roundIndex ?? 0) + 1}</p><h2 className="break-words text-4xl font-bold text-primary sm:text-5xl">{question?.roundName}</h2>{question?.roundDescription?.trim() && <p className="max-w-xl whitespace-pre-wrap break-words text-lg text-foreground">{question.roundDescription}</p>}<Button className="h-12 rounded-2xl px-8 text-white" onClick={startRound}>Start round</Button></section> : stage === 'ended' ? <div className="py-12 text-center"><h2 className="text-3xl font-bold">Game complete</h2><p className="mt-3 text-primary">{activeGame?.title}</p><Button className="party-button mt-6" onClick={() => { setActiveGame(null); setStage('lobby'); setDeadline(null); }}>Back to games</Button></div> : question ? <div className="space-y-6">
            <p className="w-fit rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">{fullPoints} points</p>
            <h2 className="whitespace-pre-wrap break-words text-2xl font-bold leading-tight text-white sm:text-3xl">{question.text}</h2>
            <QuestionMedia key={runId} media={question.questionMedia} imagesRevealed={imagesRevealed} videoStartedAt={videoStartedAt} pausedAt={mediaPausedAt} onToggle={toggleQuestionMedia} onReplay={playVideo} />
            <section className="space-y-4 border-t-2 border-dotted border-primary/60 pt-6">
              <h3 className="text-sm font-semibold text-primary">Answer</h3>
              <p className="whitespace-pre-wrap break-words font-semibold text-white">{question.answer}</p>
              <QuestionMedia key={`${runId}-answer`} media={question.answerMedia} imagesRevealed videoStartedAt={answerMediaStartedAt} pausedAt={answerMediaPausedAt} onToggle={toggleAnswerMedia} onReplay={() => { setAnswerMediaPausedAt(null); setAnswerMediaStartedAt(Date.now()); }} controlsDisabled={stage !== 'reveal'} />
              {question.hostNotes?.trim() && <div className="space-y-2"><h3 className="text-sm font-semibold text-primary">Host notes</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{question.hostNotes}</p></div>}
            </section>
            <TeamAnswers teams={teams} answers={answers[runId] || []} points={fullPoints} rightAnswer={question.answer} onGrade={gradeAnswer} />
            {stage === 'closed' && <p role="status" className="text-sm text-accent">Answers locked. Move to the next question to unlock them.</p>}
            {stage === 'reveal' && <p role="status" className="text-sm text-primary">Answer revealed to connected browser tabs.</p>}
          </div> : null}
          {question && stage !== 'lobby' && stage !== 'waiting' && stage !== 'preparing' && stage !== 'ended' && <div className="mt-7 flex flex-wrap gap-2 border-t border-border pt-5">
            {stage !== 'reveal' && <Button className="rounded-xl" disabled={deadline !== null && remaining > 0} onClick={revealAnswer}>Reveal answer</Button>}
            <Button variant="outline" className="rounded-xl" disabled={index === 0 || (deadline !== null && remaining > 0)} onClick={() => changeQuestion(index - 1)}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
            <Button variant="outline" className="rounded-xl disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60" disabled={index === questions.length - 1 || deadline === null || remaining > 0} onClick={() => changeQuestion(index + 1)}>Next question <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button variant="ghost" className="rounded-xl" onClick={resetQuestion}><RotateCcw className="mr-2 h-4 w-4" /> Replay</Button>
          </div>}
        </section>
        <aside className="space-y-5">
          <section className="panel p-5"><p className="eyebrow">ROOM CODE</p><div className="mt-3 flex items-center justify-between"><span className="display-font text-4xl font-bold tracking-[.15em] text-primary">{PREVIEW_ROOM}</span><Button variant="ghost" size="icon" aria-label="Copy room code" className="rounded-xl" onClick={copyCode}><Copy className="h-4 w-4" /></Button></div></section>
          <HostPlayers players={scoredTeams} showReadiness={stage === 'lobby' || stage === 'waiting'} showAnswers={stage === 'question' || stage === 'closed'} submittedTeamIds={publicSession?.submittedTeamIds} />
          <Buzzer duration={duration} remaining={remaining} running={deadline !== null} countdownDuration={questionDuration} deadline={deadline} onChange={changeDuration} />
          {activeGame && stage !== 'ended' && <section className="panel space-y-4 p-5"><h2 className="font-semibold">Round music</h2><Button variant="outline" className="w-full rounded-xl" onClick={() => music.toggleMusic(activeGame.rounds[question.roundIndex].music)}>{music.enabled ? 'Mute music' : 'Enable music'}</Button><label className="flex items-center gap-3 text-xs text-muted-foreground">Volume<input aria-label="Round music volume" type="range" min="0" max="1" step="0.05" value={music.volume} onChange={event => music.changeVolume(Number(event.target.value))} className="w-full accent-primary" /></label></section>}
          <Button variant="outline" className="w-full rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={stage === 'lobby' || stage === 'ended'} onClick={() => setConfirmEnd(true)}>End game</Button>
        </aside>
      </div>
    </main>
    <DevPlayerWindows teams={teams} session={publicSession} onAdd={addPlayer} onSubmit={receiveSubmission} onProfileChange={registerTeam} onTVPreview={openTVPreview} />
    {editor && <NewGameDialog initialGame={editor.game} onClose={() => setEditor(null)} onSave={persistGame} onDelete={removeGame} />}
    <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>End this game?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Your saved questions and files will be kept.</p><div className="mt-4 flex justify-end gap-3"><Button variant="outline" className="rounded-xl" onClick={() => setConfirmEnd(false)}>Keep playing</Button><Button className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => { music.switchTrack(); setStage('ended'); setDeadline(null); setConfirmEnd(false); }}>End game</Button></div></DialogContent></Dialog>
  </PartyLayout>;
}
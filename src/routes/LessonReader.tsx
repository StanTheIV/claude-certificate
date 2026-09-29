import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { LESSONS, REPEAT_LESSONS, getLesson, isRepeatLessonId, quickChecksFor } from '../content';
import { useProgress } from '../store/useProgress';
import { EmptyState } from '../components/EmptyState';
import { Markdown } from '../components/Markdown';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard, type StudyAnswerResult } from '../components/QuestionCard';

export function LessonReader() {
  const { lessonId } = useParams();
  if (!lessonId) return <Navigate to="/learn" replace />;
  return <LessonReaderInner key={lessonId} lessonId={lessonId} />;
}

function LessonReaderInner({ lessonId }: { lessonId: string }) {
  const { state, dispatch } = useProgress();
  const lesson = getLesson(lessonId);

  const startChunk = Math.min(state.lessonProgress[lessonId]?.chunkIndex ?? 0, (lesson?.chunks.length ?? 1) - 1);
  const [chunkIndex, setChunkIndex] = useState(Math.max(0, startChunk));
  const [qcIndex, setQcIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(!!state.lessonProgress[lessonId]?.done);

  if (!lesson) {
    return (
      <div className="space-y-4">
        <Link to="/learn" className="text-sm underline">
          Back to Learn
        </Link>
        <EmptyState title="This lesson isn't written yet." body="Check back soon, or pick another task statement from Learn." />
      </div>
    );
  }

  const totalChunks = lesson.chunks.length;
  const isRepeat = isRepeatLessonId(lessonId);
  // Task statement lessons flow into the Repeat unit after the last one.
  const sequence = isRepeat ? REPEAT_LESSONS : [...LESSONS, ...REPEAT_LESSONS];
  const nextLesson = sequence[sequence.findIndex((l) => l.id === lessonId) + 1];
  if (totalChunks === 0) {
    return (
      <div className="space-y-4">
        <Link to="/learn" className="text-sm underline">
          Back to Learn
        </Link>
        <EmptyState title="This lesson has no content yet." body="Check back soon, or pick another task statement from Learn." />
      </div>
    );
  }
  const chunk = lesson.chunks[chunkIndex];
  const quickChecks = quickChecksFor(lessonId, chunkIndex);
  const qcDone = qcIndex >= quickChecks.length;

  function handleAnswered(result: StudyAnswerResult) {
    const q = quickChecks[qcIndex];
    dispatch({
      type: 'RECORD_QUESTION_ATTEMPT',
      questionId: q.id,
      correct: result.correct,
      confidence: result.confidence,
      mode: 'quickcheck',
      updateSrs: true,
    });
  }

  const isLastChunk = chunkIndex >= totalChunks - 1;
  const nextSectionLabel = isLastChunk ? 'Finish lesson' : 'Next section';

  /** After the last quick check of a chunk, go straight to the next chunk. */
  function advanceQc() {
    if (qcIndex + 1 >= quickChecks.length) handleContinue();
    else setQcIndex((i) => i + 1);
  }

  /** Once a lesson is done it stays done, so redoing it doesn't drop it from the completed count in Learn. */
  function goToChunk(next: number, done: boolean) {
    dispatch({ type: 'SET_LESSON_CHUNK', lessonId, chunkIndex: next, done: done || !!state.lessonProgress[lessonId]?.done });
  }

  function handleRedo() {
    goToChunk(0, false);
    setChunkIndex(0);
    setQcIndex(0);
    setQuizStarted(false);
    setShowSummary(false);
    document.getElementById('scroll-root')?.scrollTo({ top: 0 });
  }

  function handleContinue() {
    if (isLastChunk) {
      goToChunk(chunkIndex, true);
      setShowSummary(true);
    } else {
      goToChunk(chunkIndex + 1, false);
      setChunkIndex((c) => c + 1);
      setQcIndex(0);
      setQuizStarted(false);
      document.getElementById('scroll-root')?.scrollTo({ top: 0 });
    }
  }

  if (showSummary) {
    return (
      <div className="prose-page mx-auto space-y-4 text-center">
        <h1 className="text-xl font-bold">Lesson complete: {lesson.title}</h1>
        <p className="text-muted">You've read all {totalChunks} chunks of {lessonId}.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {isRepeat ? (
            <Link to="/exam" className="btn btn-primary">
              Take a mock exam
            </Link>
          ) : (
            <>
              <Link to={`/practice?mode=taskStatement&ts=${lessonId}`} className="btn btn-primary">
                Practice this task statement
              </Link>
              <Link to={`/notes?ts=${lessonId}`} className="btn">
                Compact notes for {lessonId}
              </Link>
            </>
          )}
          {nextLesson ? (
            <Link to={`/learn/${nextLesson.id}`} className="btn">
              Next lesson: {nextLesson.id} →
            </Link>
          ) : (
            <Link to="/learn" className="btn btn-ghost">
              Back to Learn
            </Link>
          )}
          <button type="button" className="btn btn-ghost" onClick={handleRedo}>
            Redo lesson
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="prose-page mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/learn" className="text-sm underline">
          Back to Learn
        </Link>
        {isRepeat ? (
          <Link to="/cheatsheet" className="text-sm underline">
            Cheat sheet
          </Link>
        ) : (
          <Link to={`/notes?ts=${lessonId}`} className="text-sm underline">
            Compact notes for {lessonId}
          </Link>
        )}
      </div>
      <h1 className="text-xl font-bold">{lesson.title}</h1>
      <ProgressBar value={chunkIndex + 1} max={totalChunks} label={chunk.title} />

      <div key={chunkIndex} className="section-enter">
        <Markdown>{chunk.body}</Markdown>
      </div>

      {quickChecks.length > 0 && !qcDone && !quizStarted && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6">
          <p className="text-sm">
            Quick check: {quickChecks.length} {quickChecks.length === 1 ? 'question' : 'questions'} on this section.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setQuizStarted(true)}>
            Start quiz
          </button>
        </div>
      )}

      {quickChecks.length > 0 && !qcDone && quizStarted && (
        <QuestionCard
          key={quickChecks[qcIndex].id}
          mode="study"
          question={quickChecks[qcIndex]}
          detectiveMode={false}
          confidenceEnabled={state.settings.confidenceEnabled}
          shuffleOptions={state.settings.shuffleOptions}
          allowSkip
          continueLabel={qcIndex + 1 >= quickChecks.length ? nextSectionLabel : 'Next question'}
          questionNumber={qcIndex + 1}
          totalQuestions={quickChecks.length}
          onAnswered={handleAnswered}
          onContinue={advanceQc}
        />
      )}

      <div className="flex justify-end">
        {qcDone ? (
          <button type="button" className="btn btn-primary" onClick={handleContinue}>
            {isLastChunk ? 'Finish lesson' : 'Continue'}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={handleContinue}>
            Skip questions
          </button>
        )}
      </div>
    </div>
  );
}

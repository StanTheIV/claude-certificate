import { HashRouter, Route, Routes } from 'react-router-dom';
import { ProgressProvider } from './store/ProgressContext';
import { useProgress } from './store/useProgress';
import { useThemeEffect } from './lib/useTheme';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { Dashboard } from './routes/Dashboard';
import { Learn } from './routes/Learn';
import { LessonReader } from './routes/LessonReader';
import { Practice } from './routes/Practice';
import { Exam } from './routes/Exam';
import { Review } from './routes/Review';
import { Flashcards } from './routes/Flashcards';
import { DomainNotes } from './routes/DomainNotes';
import { Cheatsheet } from './routes/Cheatsheet';
import { Settings } from './routes/Settings';
import { NotFound } from './routes/NotFound';

function Shell() {
  const { state } = useProgress();
  useThemeEffect(state.settings.theme);

  return (
    <div className="flex h-full flex-col">
      <Nav />
      {/* Only the body scrolls; the header stays in place above it. Bottom padding on mobile clears the fixed bottom bar. */}
      <div id="scroll-root" className="flex flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 focus:outline-none">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:lessonId" element={<LessonReader />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/review" element={<Review />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/notes" element={<DomainNotes />} />
            <Route path="/cheatsheet" element={<Cheatsheet />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </ProgressProvider>
  );
}

import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { DailyPage } from './pages/DailyPage';
import { GamePlayPage, GamesPage } from './pages/GamesPage';
import { HanziDetailPage, HanziPage } from './pages/HanziPage';
import { HomePage } from './pages/HomePage';
import { PhrasesPage } from './pages/PhrasesPage';
import { PinyinLessonPage, PinyinPage } from './pages/PinyinPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewPage } from './pages/ReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { WordTopicPage, WordsPage } from './pages/WordsPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="daily" element={<DailyPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="pinyin" element={<PinyinPage />} />
        <Route path="pinyin/:id" element={<PinyinLessonPage />} />
        <Route path="words" element={<WordsPage />} />
        <Route path="words/:topic" element={<WordTopicPage />} />
        <Route path="hanzi" element={<HanziPage />} />
        <Route path="hanzi/:id" element={<HanziDetailPage />} />
        <Route path="phrases" element={<PhrasesPage />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:kind" element={<GamePlayPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

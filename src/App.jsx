import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EditorPage } from './pages/EditorPage';
import { VivaPage } from './pages/VivaPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/viva" element={<VivaPage />} />
      </Routes>
    </BrowserRouter>
  );
}
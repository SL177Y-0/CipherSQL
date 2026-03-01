import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AssignmentPage from './pages/AssignmentPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/assignment/:id" element={<AssignmentPage />} />
    </Routes>
  );
}

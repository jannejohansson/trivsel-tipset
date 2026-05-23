import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Matches from './pages/Matches.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import SetupProfile from './pages/SetupProfile.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<AuthGuard><SetupProfile /></AuthGuard>} />
          <Route path="/matches" element={<AuthGuard><Matches /></AuthGuard>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Matches from './pages/Matches.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import UserPredictions from './pages/UserPredictions.jsx';
import Regler from './pages/Regler.jsx';
import SetupProfile from './pages/SetupProfile.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<AuthGuard><SetupProfile /></AuthGuard>} />
          <Route path="/matches" element={<AuthGuard><Matches view="group" /></AuthGuard>} />
          <Route path="/slutspel" element={<AuthGuard><Matches view="playoff" /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><Admin /></AuthGuard>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/predictions/:userId" element={<AuthGuard><UserPredictions /></AuthGuard>} />
          <Route path="/regler" element={<Regler />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

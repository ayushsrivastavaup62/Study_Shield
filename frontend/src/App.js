import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import StudyInterface from './pages/StudyInterface';
import Dashboard from './pages/Dashboard';
import MyNotes from './pages/MyNotes';
import MyQuizzes from './pages/MyQuizzes';
import { AuthProvider } from './context/AuthContext';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/study" element={<StudyInterface />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notes" element={<MyNotes />} />
        <Route path="/quizzes" element={<MyQuizzes />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

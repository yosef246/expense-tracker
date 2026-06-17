import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

function RequireName({ children }: { children: React.ReactNode }) {
  const hasName = Boolean(localStorage.getItem('userName'));
  return hasName ? <>{children}</> : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/"        element={<RequireName><HomeScreen /></RequireName>} />
        <Route path="/add"     element={<RequireName><AddExpenseScreen /></RequireName>} />
        <Route path="/settings" element={<RequireName><SettingsScreen /></RequireName>} />
        <Route path="/history"  element={<RequireName><HistoryScreen /></RequireName>} />
      </Routes>
    </BrowserRouter>
  );
}

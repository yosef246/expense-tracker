import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/add" element={<AddExpenseScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

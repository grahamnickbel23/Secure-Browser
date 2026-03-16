import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { StudentLoginPage } from './pages/ExamCodePage';
import { ExamPage } from './pages/ExamPage';

const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student" element={<StudentLoginPage />} />
        </Route>
        <Route path="/exam" element={<ExamPage />} />
      </Routes>
    </BrowserRouter>
  );
}

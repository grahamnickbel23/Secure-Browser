import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateExam from './pages/CreateExam';
import EditExam from './pages/EditExam';
import ExamClassroom from './pages/ExamClassroom';
import StudentMonitor from './pages/StudentMonitor';
import Profile from './pages/Profile';
import OtherProfiles from './pages/OtherProfiles';
import OtherProfileDetail from './pages/OtherProfileDetail';
import Layout from './components/Layout';
import { SidebarProvider } from './context/SidebarContext';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route
          element={
            <SidebarProvider>
              <Layout />
            </SidebarProvider>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upcoming-exams" element={<Dashboard filter="Scheduled" />} />
          <Route path="/completed-exams" element={<Dashboard filter="Completed" />} />
          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/edit-exam/:id" element={<EditExam />} />
          <Route path="/classroom/:id" element={<ExamClassroom />} />
          <Route path="/monitor" element={<StudentMonitor />} />
          <Route path="/monitor/:id" element={<StudentMonitor />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/other-profiles" element={<OtherProfiles />} />
          <Route path="/other-profiles/:id" element={<OtherProfileDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

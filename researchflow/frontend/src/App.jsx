import React, { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { SessionProvider, RequireAuth, useSession } from './lib/session';
import { ToastProvider } from './lib/toast';
import { WorkProvider } from './lib/work';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Otp from './pages/Otp';
import Forgot from './pages/Forgot';
import { PrivacyPolicy, Terms } from './pages/Legal';
import { Forbidden, NotFound, ServerError } from './pages/Errors';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const Overview = lazy(() => import('./pages/Overview'));
const TasksBoard = lazy(() => import('./pages/TasksBoard'));
const Milestones = lazy(() => import('./pages/Milestones'));
const Documents = lazy(() => import('./pages/Documents'));
const Experiments = lazy(() => import('./pages/Experiments'));
const Findings = lazy(() => import('./pages/Findings'));
const Team = lazy(() => import('./pages/Team'));
const Discussions = lazy(() => import('./pages/Discussions'));
const Meetings = lazy(() => import('./pages/Meetings'));
const ProjectAnalytics = lazy(() => import('./pages/ProjectAnalytics'));
const Activity = lazy(() => import('./pages/Activity'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const ResearchAI = lazy(() => import('./pages/ResearchAI'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Researchers = lazy(() => import('./pages/Researchers'));
const Reports = lazy(() => import('./pages/Reports'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelectorAll('main[data-scroll]').forEach((m) => m.scrollTo(0, 0));
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function FB() {
  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-3xl animate-pulse space-y-4">
        <div className="h-8 w-64 rounded-lg bg-ink/8" />
        <div className="h-40 rounded-xl bg-ink/5" />
        <div className="h-40 rounded-xl bg-ink/5" />
      </div>
    </div>
  );
}

const P = ({ children }) => <Suspense fallback={<FB />}>{children}</Suspense>;

function Gate({ roles, children }) {
  const { session } = useSession();
  if (!roles.includes(session?.role)) return <Forbidden />;
  return <P>{children}</P>;
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <WorkProvider>
            <ScrollReset />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/otp" element={<Otp />} />
              <Route path="/forgot-password" element={<Forgot />} />

              <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
                <Route index element={<P><Dashboard /></P>} />
                <Route path="projects" element={<P><Projects /></P>} />
                <Route path="projects/:id" element={<P><ProjectWorkspace /></P>}>
                  <Route index element={<P><Overview /></P>} />
                  <Route path="tasks" element={<P><TasksBoard /></P>} />
                  <Route path="milestones" element={<P><Milestones /></P>} />
                  <Route path="documents" element={<P><Documents /></P>} />
                  <Route path="experiments" element={<P><Experiments /></P>} />
                  <Route path="findings" element={<P><Findings /></P>} />
                  <Route path="team" element={<P><Team /></P>} />
                  <Route path="discussions" element={<P><Discussions /></P>} />
                  <Route path="meetings" element={<P><Meetings /></P>} />
                  <Route path="analytics" element={<P><ProjectAnalytics /></P>} />
                  <Route path="activity" element={<P><Activity /></P>} />
                </Route>
                <Route path="tasks" element={<P><MyTasks /></P>} />
                <Route path="documents" element={<P><Documents scope="global" /></P>} />
                <Route path="experiments" element={<P><Experiments scope="global" /></P>} />
                <Route path="findings" element={<P><Findings scope="global" /></P>} />
                <Route path="team" element={<P><Team global /></P>} />
                <Route path="discussions" element={<P><Discussions global /></P>} />
                <Route path="meetings" element={<P><Meetings global /></P>} />
                <Route path="analytics" element={<P><ProjectAnalytics scope="global" /></P>} />
                <Route path="ai" element={<P><ResearchAI /></P>} />
                <Route path="notifications" element={<P><NotificationsPage /></P>} />
                <Route path="profile" element={<P><Profile /></P>} />
                <Route path="settings" element={<P><Settings /></P>} />
                <Route path="researchers" element={<Gate roles={['supervisor', 'admin']}><Researchers /></Gate>} />
                <Route path="reviews" element={<Gate roles={['supervisor', 'admin']}><Reviews /></Gate>} />
                <Route path="reports" element={<Gate roles={['supervisor', 'admin']}><Reports /></Gate>} />
                <Route path="admin/users" element={<Gate roles={['admin']}><AdminUsers /></Gate>} />
                <Route path="admin/activity" element={<Gate roles={['admin']}><AdminActivity /></Gate>} />
                <Route path="admin/settings" element={<Gate roles={['admin']}><AdminSettings /></Gate>} />
              </Route>

              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/server-error" element={<ServerError />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </WorkProvider>
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

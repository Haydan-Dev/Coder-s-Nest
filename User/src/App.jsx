// needed imports
import React, { useState } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"

// component imports
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"

// pages import
import LandingPage from "./pages/Landing-Page"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import ResetPassword from "./pages/Forgot-Password"
import VerifyOTP from "./pages/Verify-Otp"
import ProfileSetup from "./pages/Profile-Setup"
import DashboardMain from "./pages/Dashboard"
import ProjectPage from "./pages/Project"
import BinPage from "./pages/Bin"
import TeamPage from "./pages/Team"
import Workspace from "./pages/Workspace"
import AIAssistant from "./pages/AI-Assistant"
import Settings from "./pages/Settings"
import ViewProfile from "./pages/View-Profile"
import Notifications from "./pages/Notifications"
import Messages from "./pages/Messages"
import UserAdminPanel from "./pages/Admin-Panel"
import AdminDashboard from "./pages/Admin-Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"

//  css imports
import "./css/style.css"

function DashboardLayout({ children, isSidebarOpen, toggleSidebar }) {
  return (
    <div className="dashboard-page">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      ></div>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="dashboard-main">
        <Header toggleSidebar={toggleSidebar} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes without Sidebar and Header */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile-setup" element={<ProfileSetup />} />
            
            {/* Dashboard Routes with Sidebar and Header layout */}
            <Route path="/dashboard" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <DashboardMain />
              </DashboardLayout>
            } />
            <Route path="/projects" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <ProjectPage />
              </DashboardLayout>
            } />
            <Route path="/bin" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <BinPage />
              </DashboardLayout>
            } />
            <Route path="/Teams" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <TeamPage />
              </DashboardLayout>
            } />
            <Route path="/workspace" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hideHeader={true}>
                <Workspace />
              </DashboardLayout>
            } />
            <Route path="/workspace/:projectId" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hideHeader={true}>
                <Workspace />
              </DashboardLayout>
            } />
            <Route path="/view-profile" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <ViewProfile />
              </DashboardLayout>
            } />
            <Route path="/ai-assistant" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hideHeader={true}>
                <AIAssistant />
              </DashboardLayout>
            } />
            <Route path="/settings" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <Settings />
              </DashboardLayout>
            } />
            <Route path="/notifications" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <Notifications />
              </DashboardLayout>
            } />
            <Route path="/messages" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <Messages />
              </DashboardLayout>
            } />
            <Route path="/UserAdminPanel" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <UserAdminPanel />
              </DashboardLayout>
            } />
            <Route path="/useradmindashboard" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <AdminDashboard />
              </DashboardLayout>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

// needed imports
import React, { useState, useEffect } from "react"
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
import ProjectDetails from "./pages/Project-Details"
import BinPage from "./pages/Bin"

import Workspace from "./pages/Workspace"
import AIAssistant from "./pages/AI-Assistant"
import Settings from "./pages/Settings"
import ViewProfile from "./pages/View-Profile"
import Notifications from "./pages/Notifications"
import Messages from "./pages/Messages"
import UserAdminPanel from "./pages/Admin-Panel"
import Activity from "./pages/Activity"
import ProtectedRoute from "./components/ProtectedRoute"

//  css imports
import "./css/style.css"

function DashboardLayout({ children, isSidebarOpen, toggleSidebar, hideHeader, isMini }) {
  const miniState = isMini !== undefined ? isMini : !isSidebarOpen;

  return (
    <div className="app-bento-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      ></div>

      <div className={`bento-sidebar-wrapper ${miniState ? 'mini' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMini={miniState} />
      </div>

      <div className="bento-main-wrapper">
        {!hideHeader && (
          <div className="bento-pill-header">
            <Header toggleSidebar={toggleSidebar} />
          </div>
        )}
        <div className="bento-content-panel">
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

import api from "./utils/api"

function GlobalSettingsWrapper({ children }) {
  const [settings, setSettings] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const promises = [api.get('/settings/public')];
        if (sessionStorage.getItem('cn-access-token')) {
          promises.push(api.get('/users/me'));
        }
        
        const results = await Promise.allSettled(promises);
        
        if (results[0].status === 'fulfilled') {
          setSettings(results[0].value.data);
          if (localStorage.getItem('cn-dismissed-banner') === results[0].value.data.announcement_text) {
             setBannerDismissed(true);
          } else {
             // If the text changed, un-dismiss it
             setBannerDismissed(false);
          }
        }
        
        if (results.length > 1 && results[1].status === 'fulfilled') {
          setUserRole(results[1].value.data.role);
        }
      } catch(e) {
        console.error("Failed to load global settings", e);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitial();
    
    // Listen for real-time setting refresh events pushed via websockets
    const handleSettingsRefresh = () => {
      loadInitial();
    };
    
    window.addEventListener('SETTINGS_REFRESH', handleSettingsRefresh);
    return () => window.removeEventListener('SETTINGS_REFRESH', handleSettingsRefresh);
  }, []);

  if (loading) {
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh', backgroundColor:'var(--bg-color)'}}>
        <div className="skeleton sk-card" style={{width:'200px',height:'40px',borderRadius:'8px'}}></div>
      </div>
    );
  }

  const getBannerColor = (type) => {
    switch(type) {
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'info':
      default: return '#3b82f6';
    }
  };

  // Pass settings and role down to children via cloneElement or React Context.
  // The easiest way is to pass them as props to children, but children is `<BrowserRouter>`.
  // Instead of passing, let's create a contextual wrapper or just an interceptor inside App.
  return (
    <>
      {settings?.announcement_banner && !bannerDismissed && (
        <div style={{
          padding: '12px 20px', 
          backgroundColor: getBannerColor(settings.announcement_type),
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 999999,
          fontWeight: 500,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{flex: 1, textAlign: 'center'}}>{settings.announcement_text}</div>
          <button style={{background:'transparent',border:'none',color:'white',cursor:'pointer',fontSize:'1.2rem',padding:'0 10px'}} onClick={() => {
            setBannerDismissed(true);
            localStorage.setItem('cn-dismissed-banner', settings.announcement_text);
          }}>✕</button>
        </div>
      )}
      <MaintenanceBlocker settings={settings} userRole={userRole}>
        {children}
      </MaintenanceBlocker>
    </>
  )
}

function MaintenanceBlocker({ settings, userRole, children }) {
  const location = useLocation();
  const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/verify-otp'];
  
  if (settings?.maintenance_mode && userRole !== 'admin' && !publicPaths.includes(location.pathname)) {
    
    // Format the date if it exists
    let formattedDate = "";
    if (settings.maintenance_end_time) {
      const d = new Date(settings.maintenance_end_time);
      if (!isNaN(d.getTime())) {
        formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).format(d);
      }
    }

    return (
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',height:'100vh',textAlign:'center',backgroundColor:'var(--bg-color)',color:'var(--text-color)',padding:'20px'}}>
        <h1 style={{fontSize:'3rem',marginBottom:'1rem',color:'var(--accent-color)'}}>⚠ Maintenance Mode</h1>
        <p style={{fontSize:'1.2rem',opacity:0.8,maxWidth:'600px', marginBottom: formattedDate ? '24px' : '0'}}>{settings.maintenance_message || "We are currently undergoing maintenance. Please check back later."}</p>
        
        {formattedDate && (
          <div style={{
            background: 'var(--card-bg, rgba(255,255,255,0.05))',
            padding: '16px 24px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '24px' }}>⏱</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Estimated Completion</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--accent-color)', marginTop: '2px' }}>{formattedDate}</div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cn-theme') || 'light';
    document.body.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      <GlobalSettingsWrapper>
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

            <Route path="/project/:id" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <ProjectDetails />
              </DashboardLayout>
            } />
            <Route path="/workspace" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hideHeader={true} isMini={true}>
                <Workspace />
              </DashboardLayout>
            } />
            <Route path="/workspace/:projectId" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} hideHeader={true} isMini={true}>
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
            <Route path="/activity" element={
              <DashboardLayout isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar}>
                <Activity />
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
          </Route>
        </Routes>
      </GlobalSettingsWrapper>
    </BrowserRouter>
  )
}
export default App

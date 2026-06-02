import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// conponenets imports 
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";

// pages imports
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Projects from "./pages/Projects.jsx";
import Billing from "./pages/Billing.jsx";
import Security from "./pages/Security.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";

// css imports
import "./css/shared.css" ;
import "./css/dashboard.css"; 
import "./css/users.css"
import "./css/projects.css"
import "./css/billing.css"
import "./css/security.css"
import "./css/analytics.css"
import "./css/settings.css"
import "./css/login.css"


// js imports
import "./js/shared.jsx";


function App() {
  return (
    <>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <div className="main-wrap">
            <Header />
            <Routes>
              <Route path="/" element={<Login/>}></Route>
              <Route path="/dashboard" element={<Dashboard/>}></Route>
              <Route path="/users" element={<Users/>}></Route>
              <Route path="/projects" element={<Projects/>}></Route>
              <Route path="/billing" element={<Billing/>}></Route>
              <Route path="/security" element={<Security/>}></Route>
              <Route path="/analytics" element={<Analytics/>}></Route>
              <Route path="/settings" element={<Settings/>}></Route>
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;

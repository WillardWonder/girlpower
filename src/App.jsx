import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import CreateTeam from "./pages/CreateTeam.jsx";
import JoinTeam from "./pages/JoinTeam.jsx";
import TeamHome from "./pages/TeamHome.jsx";
import Today from "./pages/Today.jsx";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import CoachAthlete from "./pages/CoachAthlete.jsx";

function Layout({ children }) {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Link to="/">GirlPower</Link>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/create-team" element={<Layout><CreateTeam /></Layout>} />
      <Route path="/join" element={<Layout><JoinTeam /></Layout>} />
      <Route path="/team/:teamId" element={<Layout><TeamHome /></Layout>} />
      <Route path="/team/:teamId/today" element={<Layout><Today /></Layout>} />
      <Route path="/team/:teamId/coach" element={<Layout><CoachDashboard /></Layout>} />
      <Route path="/team/:teamId/coach/athlete/:uid" element={<Layout><CoachAthlete /></Layout>} />
      <Route path="*" element={<Layout><div className="card">Not found</div></Layout>} />
    </Routes>
  );
}

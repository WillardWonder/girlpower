import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";

export default function Home() {
  const { user, loading } = useAuthUser();
  const nav = useNavigate();
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function ensureUserDoc() {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email || "",
          name: user.displayName || "",
          createdAt: serverTimestamp(),
          lastTeamId: null
        });
      }
    }
    ensureUserDoc();
  }, [user]);

  async function goToLastTeam() {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    const lastTeamId = snap.exists() ? snap.data().lastTeamId : null;
    if (lastTeamId) nav(`/team/${lastTeamId}`);
    else setStatus("No team saved yet. Join or create a team.");
  }

  if (loading) return <div className="card">Loading...</div>;

  if (!user) {
    return (
      <div className="card">
        <h1>GirlPower Check-In</h1>
        <p className="muted">Fast daily check-ins for athletes, simple dashboards for coaches.</p>
        <div className="row">
          <Link className="btn" to="/login">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row space">
        <div>
          <h2>Welcome</h2>
          <p className="muted">{user.email}</p>
        </div>
        <button className="btn secondary" onClick={() => signOut(auth)}>Sign out</button>
      </div>

      <div className="stack">
        <button className="btn" onClick={goToLastTeam}>Go to my team</button>
        <Link className="btn secondary" to="/join">Join a team</Link>
        <Link className="btn secondary" to="/create-team">Create a team (coach)</Link>
      </div>

      {status ? <p className="muted">{status}</p> : null}

      <div className="divider" />
      <p className="muted small">
        If you already know your team link, you can go directly to <code>/team/TEAM_ID</code>.
      </p>
    </div>
  );
}

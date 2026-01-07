import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";

export default function JoinTeam() {
  const { user, loading } = useAuthUser();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="card">Loading...</div>;

  if (!user) {
    return (
      <div className="card">
        Please <Link to="/login">login</Link>.
      </div>
    );
  }

  async function join() {
    setBusy(true);
    setStatus("");

    const joinCode = code.trim().toUpperCase();
    if (!joinCode) {
      setStatus("Enter a join code.");
      setBusy(false);
      return;
    }

    try {
      const codeRef = doc(db, "joinCodes", joinCode);
      const codeSnap = await getDoc(codeRef);
      if (!codeSnap.exists() || codeSnap.data().isActive !== true) {
        throw new Error("Invalid join code.");
      }

      const { teamId } = codeSnap.data();
      if (!teamId) throw new Error("Join code is missing teamId.");

      // Create membership doc as athlete
      await setDoc(doc(db, "teams", teamId, "members", user.uid), {
        role: "athlete",
        name: user.displayName || "",
        email: user.email || "",
        isActive: true,
        joinedAt: serverTimestamp(),
        joinCodeUsed: joinCode
      });

      // Save lastTeamId
      await setDoc(doc(db, "users", user.uid), { lastTeamId: teamId }, { merge: true });

      nav(`/team/${teamId}`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row space">
        <h2>Join Team</h2>
        <Link className="btn secondary" to="/">Back</Link>
      </div>

      <label>
        Join code
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" />
      </label>

      <div className="row">
        <button className="btn" onClick={join} disabled={busy}>
          {busy ? "Joining..." : "Join"}
        </button>
      </div>

      {status ? <p className={status.startsWith("Error") ? "error" : "muted"}>{status}</p> : null}
    </div>
  );
}

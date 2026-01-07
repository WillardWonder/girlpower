import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";
import { generateJoinCode } from "../lib/joinCode";

export default function CreateTeam() {
  const { user, loading } = useAuthUser();
  const nav = useNavigate();
  const [teamName, setTeamName] = useState("");
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

  async function create() {
    setBusy(true);
    setStatus("");

    const name = teamName.trim();
    if (!name) {
      setStatus("Enter a team name.");
      setBusy(false);
      return;
    }

    try {
      // Generate a unique join code (retry a few times if collision)
      let joinCode = "";
      let tries = 0;
      while (tries < 8) {
        const candidate = generateJoinCode(6);
        const codeRef = doc(db, "joinCodes", candidate);
        const codeSnap = await getDoc(codeRef);
        if (!codeSnap.exists()) {
          joinCode = candidate;
          break;
        }
        tries++;
      }
      if (!joinCode) throw new Error("Could not generate join code. Try again.");

      // Create teamId
      const teamId = crypto.randomUUID();

      // 1) teams/{teamId}
      await setDoc(doc(db, "teams", teamId), {
        name,
        joinCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        isActive: true
      });

      // 2) joinCodes/{joinCode}
      await setDoc(doc(db, "joinCodes", joinCode), {
        teamId,
        joinCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        isActive: true
      });

      // 3) membership for coach
      await setDoc(doc(db, "teams", teamId, "members", user.uid), {
        role: "coach",
        name: user.displayName || "",
        email: user.email || "",
        isActive: true,
        joinedAt: serverTimestamp()
      });

      // 4) save lastTeamId on user
      await setDoc(doc(db, "users", user.uid), { lastTeamId: teamId }, { merge: true });

      setStatus(`Team created. Join code: ${joinCode}`);
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
        <h2>Create Team</h2>
        <Link className="btn secondary" to="/">Back</Link>
      </div>

      <label>
        Team name
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="GirlPower Wrestling" />
      </label>

      <div className="row">
        <button className="btn" onClick={create} disabled={busy}>
          {busy ? "Creating..." : "Create team"}
        </button>
      </div>

      {status ? <p className={status.startsWith("Error") ? "error" : "success"}>{status}</p> : null}

      <p className="muted small">
        This creates a team, generates a join code, and adds you as coach.
      </p>
    </div>
  );
}

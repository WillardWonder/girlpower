import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";

export default function TeamHome() {
  const { teamId } = useParams();
  const { user, loading } = useAuthUser();
  const [team, setTeam] = useState(null);
  const [member, setMember] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !teamId) return;

      try {
        const teamSnap = await getDoc(doc(db, "teams", teamId));
        const memSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
        if (!cancelled) {
          setTeam(teamSnap.exists() ? teamSnap.data() : null);
          setMember(memSnap.exists() ? memSnap.data() : null);
          setStatus("");
        }
      } catch (e) {
        if (!cancelled) setStatus(`Error: ${e.message}`);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, teamId]);

  if (loading) return <div className="card">Loading...</div>;
  if (!user) return <div className="card">Please <Link to="/login">login</Link>.</div>;
  if (!team) return <div className="card">Team not found.</div>;
  if (!member) return <div className="card">You are not a member of this team. <Link to="/join">Join</Link></div>;

  return (
    <div className="card">
      <div className="row space">
        <div>
          <h2>{team.name}</h2>
          <p className="muted">Role: {member.role}</p>
        </div>
        <Link className="btn secondary" to="/">Home</Link>
      </div>

      <div className="stack">
        <Link className="btn" to={`/team/${teamId}/today`}>Today check-in</Link>
        {member.role === "coach" ? (
          <Link className="btn secondary" to={`/team/${teamId}/coach`}>Coach dashboard</Link>
        ) : null}
      </div>

      {member.role === "coach" ? (
        <>
          <div className="divider" />
          <p className="muted small">Join code: <code>{team.joinCode}</code></p>
        </>
      ) : null}

      {status ? <p className="error">{status}</p> : null}
    </div>
  );
}

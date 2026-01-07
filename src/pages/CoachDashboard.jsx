import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDoc, getDocs, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";
import { localDateKey } from "../lib/date";

export default function CoachDashboard() {
  const { teamId } = useParams();
  const { user, loading } = useAuthUser();
  const dateKey = useMemo(() => localDateKey(), []);
  const [member, setMember] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMember() {
      if (!user || !teamId) return;
      const memSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
      if (!cancelled) setMember(memSnap.exists() ? memSnap.data() : null);
    }
    loadMember();
    return () => { cancelled = true; };
  }, [user, teamId]);

  if (loading) return <div className="card">Loading...</div>;
  if (!user) return <div className="card">Please <Link to="/login">login</Link>.</div>;
  if (!member) return <div className="card">Not a team member.</div>;
  if (member.role !== "coach") return <div className="card">Coach access only.</div>;

  return <CoachDashboardInner teamId={teamId} dateKey={dateKey} />;
}

function CoachDashboardInner({ teamId, dateKey }) {
  const [members, setMembers] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const membersSnap = await getDocs(collection(db, "teams", teamId, "members"));
      const allMembers = membersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const athletes = allMembers.filter((m) => m.role === "athlete");

      const q = query(collection(db, "teams", teamId, "checkIns"), where("dateKey", "==", dateKey));
      const checkinsSnap = await getDocs(q);
      const todays = checkinsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (!cancelled) {
        setMembers(athletes);
        setCheckins(todays);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [teamId, dateKey]);

  const doneSet = useMemo(() => new Set(checkins.map((c) => c.uid)), [checkins]);
  const missing = useMemo(() => members.filter((m) => !doneSet.has(m.uid)), [members, doneSet]);

  const missedPractice = useMemo(() => checkins.filter((c) => c.practice?.attended === false), [checkins]);
  const lowSleep = useMemo(() => checkins.filter((c) => ["lt6", "6to7"].includes(c.habits?.sleepBucket)), [checkins]);

  if (loading) return <div className="card">Loading dashboard...</div>;

  return (
    <div className="card">
      <div className="row space">
        <div>
          <h2>Coach dashboard</h2>
          <p className="muted">{dateKey}</p>
        </div>
        <Link className="btn secondary" to={`/team/${teamId}`}>Back</Link>
      </div>

      <div className="grid3">
        <Stat title="Athletes" value={members.length} />
        <Stat title="Completed today" value={checkins.length} />
        <Stat title="Missing today" value={missing.length} />
      </div>

      <div className="divider" />

      <h3>Flags</h3>
      <div className="grid2">
        <div>
          <h4 className="muted">Missed practice</h4>
          {missedPractice.length === 0 ? <p className="muted">None</p> : (
            <ul className="list">
              {missedPractice.map((c) => (
                <li key={c.id}>
                  <Link to={`/team/${teamId}/coach/athlete/${c.uid}`}>{c.uid}</Link>
                  <span className="muted small"> ({c.practice?.missReason || "no reason"})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="muted">Low sleep</h4>
          {lowSleep.length === 0 ? <p className="muted">None</p> : (
            <ul className="list">
              {lowSleep.map((c) => (
                <li key={c.id}>
                  <Link to={`/team/${teamId}/coach/athlete/${c.uid}`}>{c.uid}</Link>
                  <span className="muted small"> ({c.habits?.sleepBucket})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="divider" />

      <h3>Missing check-ins</h3>
      {missing.length === 0 ? <p className="muted">Everyone checked in.</p> : (
        <ul className="list">
          {missing.map((m) => (
            <li key={m.uid}>{m.name || m.email || m.uid}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat">
      <div className="muted small">{title}</div>
      <div className="big">{value}</div>
    </div>
  );
}

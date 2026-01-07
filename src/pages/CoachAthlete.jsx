import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDoc, getDocs, doc, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";

export default function CoachAthlete() {
  const { teamId, uid } = useParams();
  const { user, loading } = useAuthUser();
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
  if (!member || member.role !== "coach") return <div className="card">Coach access only.</div>;

  return <CoachAthleteInner teamId={teamId} uid={uid} />;
}

function CoachAthleteInner({ teamId, uid }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const q = query(
        collection(db, "teams", teamId, "checkIns"),
        where("uid", "==", uid),
        orderBy("dateKey", "desc"),
        limit(14)
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!cancelled) {
        setItems(rows);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [teamId, uid]);

  if (loading) return <div className="card">Loading athlete...</div>;

  return (
    <div className="card">
      <div className="row space">
        <div>
          <h2>Athlete</h2>
          <p className="muted">{uid}</p>
        </div>
        <Link className="btn secondary" to={`/team/${teamId}/coach`}>Back</Link>
      </div>

      {items.length === 0 ? <p className="muted">No check-ins yet.</p> : (
        <div className="stack">
          {items.map((c) => (
            <div key={c.id} className="mini">
              <div className="row space">
                <div className="pill">{c.dateKey}</div>
                <div className="muted small">practice: {c.practice?.attended === false ? "missed" : "yes"}</div>
              </div>
              <div className="muted small">
                sleep {c.habits?.sleepBucket || "-"} • efforts W/D/L {c.practice?.effortWeights ?? "-"} / {c.practice?.effortDrilling ?? "-"} / {c.practice?.effortLive ?? "-"}
              </div>
              {c.mindset?.techFocus ? <div className="muted small">focus: {c.mindset.techFocus}</div> : null}
              {c.reflection?.wentWell ? <div className="muted small">win: {c.reflection.wentWell}</div> : null}
              {c.reflection?.improveTomorrow ? <div className="muted small">next: {c.reflection.improveTomorrow}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

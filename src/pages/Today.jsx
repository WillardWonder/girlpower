import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthUser } from "../auth/useAuthUser";
import { localDateKey } from "../lib/date";

const sleepOptions = [
  ["lt6", "<6"],
  ["6to7", "6–7"],
  ["7to8", "7–8"],
  ["8plus", "8+"]
];

export default function Today() {
  const { teamId } = useParams();
  const { user, loading } = useAuthUser();
  const dateKey = useMemo(() => localDateKey(), []);
  const [member, setMember] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(defaultForm());

  const checkInId = user ? `${user.uid}_${dateKey}` : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user || !teamId || !checkInId) return;

      const memSnap = await getDoc(doc(db, "teams", teamId, "members", user.uid));
      if (!memSnap.exists()) {
        if (!cancelled) setMember(null);
        return;
      }
      if (!cancelled) setMember(memSnap.data());

      const ref = doc(db, "teams", teamId, "checkIns", checkInId);
      const snap = await getDoc(ref);
      if (!cancelled && snap.exists()) {
        const data = snap.data();
        setForm({
          habits: { ...defaultForm().habits, ...(data.habits || {}) },
          practice: { ...defaultForm().practice, ...(data.practice || {}) },
          mindset: { ...defaultForm().mindset, ...(data.mindset || {}) },
          reflection: { ...defaultForm().reflection, ...(data.reflection || {}) }
        });
        setStatus("Loaded today’s check-in.");
      } else if (!cancelled) {
        setStatus("");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, teamId, checkInId]);

  function update(path, value) {
    setForm((prev) => {
      const next = structuredClone(prev);
      const [a, b] = path.split(".");
      next[a][b] = value;
      if (path === "practice.attended" && value === true) next.practice.missReason = null;
      if (path === "habits.fellAsleepFast" && value === true) next.habits.sleepBlocker = null;
      return next;
    });
  }

  async function submit() {
    if (!user || !teamId || !checkInId) return;
    setSaving(true);
    setStatus("");

    const payload = {
      uid: user.uid,
      dateKey,
      submittedAt: serverTimestamp(),
      habits: form.habits,
      practice: form.practice,
      mindset: form.mindset,
      reflection: {
        wentWell: (form.reflection.wentWell || "").slice(0, 240),
        improveTomorrow: (form.reflection.improveTomorrow || "").slice(0, 240)
      }
    };

    try {
      await setDoc(doc(db, "teams", teamId, "checkIns", checkInId), payload, { merge: true });
      setStatus("Saved. Nice work.");
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="card">Loading...</div>;
  if (!user) return <div className="card">Please <Link to="/login">login</Link>.</div>;
  if (!member) return <div className="card">Not a team member. <Link to="/join">Join</Link></div>;

  return (
    <div className="card">
      <div className="row space">
        <div>
          <h2>Today</h2>
          <p className="muted">{dateKey}</p>
        </div>
        <Link className="btn secondary" to={`/team/${teamId}`}>Back</Link>
      </div>

      <section className="section">
        <h3>Habits</h3>

        <label>
          Sleep
          <select value={form.habits.sleepBucket} onChange={(e) => update("habits.sleepBucket", e.target.value)}>
            {sleepOptions.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </label>

        <label>
          Bedtime
          <select value={form.habits.bedtimeBucket} onChange={(e) => update("habits.bedtimeBucket", e.target.value)}>
            <option value="onTime">On time</option>
            <option value="late">Late</option>
            <option value="veryLate">Very late</option>
          </select>
        </label>

        <label>
          Fell asleep within 20 minutes?
          <select value={String(form.habits.fellAsleepFast)} onChange={(e) => update("habits.fellAsleepFast", e.target.value === "true")}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        {form.habits.fellAsleepFast === false ? (
          <label>
            What got in the way?
            <select value={form.habits.sleepBlocker || ""} onChange={(e) => update("habits.sleepBlocker", e.target.value || null)}>
              <option value="">Select</option>
              <option value="stress">Stress</option>
              <option value="screens">Screens</option>
              <option value="latePractice">Late practice</option>
              <option value="pain">Pain</option>
              <option value="other">Other</option>
            </select>
          </label>
        ) : null}

        <label>
          Hydration
          <select value={form.habits.hydration} onChange={(e) => update("habits.hydration", e.target.value)}>
            <option value="low">Low</option>
            <option value="ok">Okay</option>
            <option value="good">Good</option>
          </select>
        </label>

        <div className="grid2">
          <Toggle label="Fruit" value={form.habits.fruit} onChange={(v) => update("habits.fruit", v)} />
          <Toggle label="Vegetable" value={form.habits.veg} onChange={(v) => update("habits.veg", v)} />
        </div>
      </section>

      <section className="section">
        <h3>Practice</h3>

        <label>
          Attended practice?
          <select value={String(form.practice.attended)} onChange={(e) => update("practice.attended", e.target.value === "true")}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        {form.practice.attended === false ? (
          <label>
            Reason missed
            <select value={form.practice.missReason || ""} onChange={(e) => update("practice.missReason", e.target.value || null)}>
              <option value="">Select</option>
              <option value="sick">Sick</option>
              <option value="injury">Injury</option>
              <option value="family">Family</option>
              <option value="transport">Transportation</option>
              <option value="school">School</option>
              <option value="other">Other</option>
            </select>
          </label>
        ) : null}

        <label>Effort (1–5)</label>
        <div className="grid3">
          <SmallSelect label="Weights" value={form.practice.effortWeights} onChange={(v) => update("practice.effortWeights", v)} max={5} />
          <SmallSelect label="Drilling" value={form.practice.effortDrilling} onChange={(v) => update("practice.effortDrilling", v)} max={5} />
          <SmallSelect label="Live" value={form.practice.effortLive} onChange={(v) => update("practice.effortLive", v)} max={5} />
        </div>

        <div className="grid3">
          <SmallSelect label="Matches" value={form.practice.matches} onChange={(v) => update("practice.matches", v)} max={6} allowZero />
          <SmallSelect label="Warmups" value={form.practice.warmups} onChange={(v) => update("practice.warmups", v)} max={6} allowZero />
          <SmallSelect label="Cooldowns" value={form.practice.cooldowns} onChange={(v) => update("practice.cooldowns", v)} max={6} allowZero />
        </div>
      </section>

      <section className="section">
        <h3>Mindset</h3>

        <label>
          Tech focus
          <input value={form.mindset.techFocus} onChange={(e) => update("mindset.techFocus", e.target.value)} placeholder="Hand fighting" />
        </label>

        <div className="grid2">
          <Toggle label="Attempted main shot" value={!!form.mindset.mainShotAttempted} onChange={(v) => update("mindset.mainShotAttempted", v)} />
          <Toggle label="Used reset word" value={form.mindset.resetUsed} onChange={(v) => update("mindset.resetUsed", v)} />
        </div>

        <label>
          Mantra word
          <select value={form.mindset.mantraWord} onChange={(e) => update("mindset.mantraWord", e.target.value)}>
            {["Resilient","Relentless","Respectful","Grateful","Composed","Consistent","Disciplined"].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>

        <label>
          What went well? (optional)
          <input value={form.reflection.wentWell} onChange={(e) => update("reflection.wentWell", e.target.value)} placeholder="One quick win" />
        </label>

        <label>
          Improve tomorrow (optional)
          <input value={form.reflection.improveTomorrow} onChange={(e) => update("reflection.improveTomorrow", e.target.value)} placeholder="One quick target" />
        </label>
      </section>

      <div className="sticky">
        <button className="btn" onClick={submit} disabled={saving}>
          {saving ? "Saving..." : "Submit"}
        </button>
        {status ? <p className={status.startsWith("Error") ? "error" : "muted"}>{status}</p> : null}
      </div>
    </div>
  );
}

function defaultForm() {
  return {
    habits: {
      sleepBucket: "7to8",
      bedtimeBucket: "onTime",
      fellAsleepFast: true,
      hydration: "ok",
      fruit: false,
      veg: false,
      sleepBlocker: null
    },
    practice: {
      attended: true,
      missReason: null,
      effortWeights: 3,
      effortDrilling: 3,
      effortLive: 3,
      matches: 0,
      warmups: 0,
      cooldowns: 0
    },
    mindset: {
      techFocus: "",
      mainShotAttempted: false,
      resetUsed: false,
      mantraWord: "Grateful"
    },
    reflection: {
      wentWell: "",
      improveTomorrow: ""
    }
  };
}

function Toggle({ label, value, onChange }) {
  return (
    <button type="button" className={`toggle ${value ? "on" : ""}`} onClick={() => onChange(!value)}>
      <span>{label}</span>
      <span className="dot">{value ? "Yes" : "No"}</span>
    </button>
  );
}

function SmallSelect({ label, value, onChange, max = 5, allowZero = false }) {
  const options = allowZero ? [0, ...Array.from({ length: max }, (_, i) => i + 1)] : Array.from({ length: max }, (_, i) => i + 1);
  return (
    <label className="small">
      {label}
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
}

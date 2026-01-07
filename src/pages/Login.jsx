import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function handleEmailLogin(e) {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      nav("/");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function handleEmailSignup(e) {
    e.preventDefault();
    setErr("");
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pw);
      nav("/");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function handleGoogle() {
    setErr("");
    try {
      await signInWithPopup(auth, googleProvider);
      nav("/");
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="card">
      <h2>Login</h2>
      <p className="muted">Use Google or email/password.</p>

      <div className="row">
        <button className="btn" onClick={handleGoogle}>Continue with Google</button>
      </div>

      <div className="divider" />

      <form className="stack" onSubmit={handleEmailLogin}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mapsedu.org" />
        </label>
        <label>
          Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </label>
        <div className="row">
          <button className="btn" type="submit">Login</button>
          <button className="btn secondary" onClick={handleEmailSignup}>Sign up</button>
          <Link className="btn secondary" to="/">Back</Link>
        </div>
      </form>

      {err ? <p className="error">{err}</p> : null}
    </div>
  );
}

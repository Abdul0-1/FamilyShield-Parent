import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function register(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/register", form);
      localStorage.setItem("parentToken", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data || "Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={register}>
        <h1>FamilyShield</h1>
        <p>Create Parent Account</p>

        <input
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          required
        />

        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          minLength={6}
          required
        />

        {error && <div className="error">{error}</div>}

        <button>Create Account</button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

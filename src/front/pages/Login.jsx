import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showResetMessage = new URLSearchParams(location.search).get('reset') === 'true';

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null); // { type: "success" | "danger", message: string }

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null); // Clear previous alerts
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.Token);
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
        setAlert({ type: "success", message: "Login successful! Redirecting..." });
        setTimeout(() => navigate("/private"), 200);
      } else {
        setAlert({ type: "danger", message: data.msg || "Incorrect credentials" });
      }
    } catch (err) {
      console.error("Error during login:", err);
      setAlert({ type: "danger", message: "Server error. Please try again later." });
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <form onSubmit={handleLogin} className="p-4 border rounded" style={{ maxWidth: 400, width: "100%" }}>
        <h3 className="mb-3">Login</h3>

        {showResetMessage && (
          <div className="alert alert-success p-2">Password reset successfully. Please log in.</div>
        )}

        {alert && (
          <div className={`alert alert-${alert.type} p-2`} role="alert">
            {alert.message}
          </div>
        )}

        <div className="mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">Log in</button>

        <div className="mt-3">
          <p className="mb-1">Don't have an account?</p>
          <Link to="/register">Register here</Link>
        </div>

        <div className="mt-2">
          <Link to="/request-reset-password">Forgot your password?</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;

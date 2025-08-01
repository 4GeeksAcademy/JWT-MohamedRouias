import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "danger"

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please verify both fields.");
      setMessageType("danger");
      return;
    }

    try {
      const res = await fetch(BASE_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("User registered successfully! Redirecting...");
        setMessageType("success");
        setTimeout(() => {
          setEmail("");
          setName("");
          setPassword("");
          setConfirmPassword("");
          navigate("/login");
        }, 1500);
      } else {
        setMessage(data.msg || "Registration failed.");
        setMessageType("danger");
      }
    } catch (err) {
      setMessage("Could not connect to the server.");
      setMessageType("danger");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <form
        onSubmit={handleRegister}
        className="p-4 border rounded"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <h3 className="mb-3 fw-bold text-center">Create an Account 🚀</h3>

        {message && (
          <div className={`alert alert-${messageType} p-2`} role="alert">
            {message}
          </div>
        )}

        <div className="mb-3">
          <input
            className="form-control"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            className="form-control"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            className="form-control"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            className="form-control"
            type="password"
            placeholder="Repeat Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 fw-bold"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;

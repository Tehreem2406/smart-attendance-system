import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Both fields are required");
      return;
    }

    setError("");

    try {
      const res = await fetch(`http://localhost:5000/api/login/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect based on role
        if (role === "admin") navigate("/admin-dashboard");
        else if (role === "teacher") navigate("/teacher-dashboard");
        else navigate("/student-dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2>Login as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button type="submit" style={{ padding: "10px 20px" }}>Login</button>
      </form>
    </div>
  );
};

export default Login;

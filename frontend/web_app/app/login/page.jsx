"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../src/services/api";
import { useAuth } from "../../src/hooks/useAuth";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState("student"); // student, teacher, admin
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [savedUsernames, setSavedUsernames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Load saved usernames from localStorage on mount (safe for non-sensitive data)
  useEffect(() => {
    const saved = localStorage.getItem("smart_attendance_usernames");
    if (saved) {
      try {
        setSavedUsernames(JSON.parse(saved));
      } catch {
        setSavedUsernames([]);
      }
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleBiometricLogin() {
    setScanning(true);
    setError("");
    
    // Simulate fingerprint scan
    setTimeout(async () => {
      // For demo purposes, we'll use a simulated fingerprint. 
      // In a real system, this would come from the sensor.
      // For testing, we'll just prompt for a simulated ID or use a fixed one.
      const simulatedFingerprint = prompt("Enter simulated fingerprint ID (e.g. fingerprint_test):") || "fingerprint_test";
      
      const res = await loginUser(null, null, role, simulatedFingerprint);
      setScanning(false);
      
      if (res.error || res.detail) {
        setError(res.error || res.detail || "Fingerprint match failed");
      } else {
        // Use our login function that saves to sessionStorage (tab-isolated!)
        login(res);
        if (res.category === "admin") router.push("/admin");
        else if (res.category === "teacher") router.push("/teacher");
        else router.push("/student");
      }
    }, 1500);
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setError("");
    const res = await loginUser(username, password, "admin");
    if (res.error || res.detail) {
      setError(res.error || res.detail || "Login failed");
    } else {
      // Save username to localStorage if not already there (safe for non-sensitive data)
      const updatedUsernames = [...savedUsernames];
      if (!updatedUsernames.includes(username)) {
        updatedUsernames.push(username);
        localStorage.setItem("smart_attendance_usernames", JSON.stringify(updatedUsernames));
        setSavedUsernames(updatedUsernames);
      }

      // Use our login function that saves to sessionStorage (tab-isolated!)
      login(res);
      router.push("/admin");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-2 text-center text-green-600">Smart Attendance</h1>
        <p className="text-gray-500 text-center mb-8">Biometric Login System</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-8 bg-gray-100 p-1.5 rounded-xl">
          {["student", "teacher", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                role === r ? "bg-white shadow-md text-green-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {role === "admin" ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Admin Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Enter admin username"
                onFocus={() => setShowSuggestions(true)}
                required
              />
              {/* Suggestions Dropdown */}
              {showSuggestions && savedUsernames.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  {savedUsernames.filter(u => 
                    u.toLowerCase().includes(username.toLowerCase())
                  ).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setUsername(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all duration-200 font-semibold"
            >
              Login as Admin
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                scanning ? "bg-green-100 animate-pulse" : "bg-white shadow-sm"
              }`}>
                <svg className={`w-10 h-10 ${scanning ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                {scanning ? "Scanning fingerprint..." : `Ready to scan ${role} fingerprint`}
              </p>
            </div>
            <button
              onClick={handleBiometricLogin}
              disabled={scanning}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                scanning ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-100"
              }`}
            >
              {scanning ? "Processing..." : "Scan & Login"}
            </button>
            <p className="text-xs text-gray-400">Place your finger on the sensor to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}

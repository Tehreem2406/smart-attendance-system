"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../src/services/api";

export default function Login() {
  const router = useRouter();

  const login = (userData) => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.setItem(
      "smart_attendance_user",
      JSON.stringify(userData)
    );

    if (userData?.access_token) {
      sessionStorage.setItem(
        "smart_attendance_token",
        userData.access_token
      );
    } else if (userData?.token) {
      sessionStorage.setItem(
        "smart_attendance_token",
        userData.token
      );
    }

    if (userData?.category) {
      sessionStorage.setItem(
        "smart_attendance_role",
        userData.category
      );
    }
  };

  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [savedUsernames, setSavedUsernames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(
      "smart_attendance_usernames"
    );

    if (saved) {
      try {
        setSavedUsernames(JSON.parse(saved));
      } catch {
        setSavedUsernames([]);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const redirectUser = (category) => {
    if (category === "admin") {
      router.push("/admin");
      return;
    }

    if (category === "teacher") {
      router.push("/teacher");
      return;
    }

    router.push("/student");
  };

  async function handleBiometricLogin() {
    setScanning(true);
    setError("");

    setTimeout(async () => {
      try {
        const simulatedFingerprint =
          prompt(
            "Enter simulated fingerprint ID, for example fingerprint_test:"
          ) || "fingerprint_test";

        const res = await loginUser(
          null,
          null,
          role,
          simulatedFingerprint
        );

        if (res?.error || res?.detail) {
          setError(
            res.error ||
              res.detail ||
              "Fingerprint match failed"
          );
          return;
        }

        login(res);
        redirectUser(res?.category || role);
      } catch (err) {
        console.error("Biometric login error:", err);

        setError(
          "Unable to connect to the server. Please try again."
        );
      } finally {
        setScanning(false);
      }
    }, 1500);
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setError("");

    try {
      const res = await loginUser(
        username,
        password,
        "admin"
      );

      if (res?.error || res?.detail) {
        setError(
          res.error ||
            res.detail ||
            "Login failed"
        );
        return;
      }

      const updatedUsernames = [...savedUsernames];

      if (!updatedUsernames.includes(username)) {
        updatedUsernames.push(username);

        localStorage.setItem(
          "smart_attendance_usernames",
          JSON.stringify(updatedUsernames)
        );

        setSavedUsernames(updatedUsernames);
      }

      login(res);
      redirectUser(res?.category || "admin");
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-3xl font-bold text-green-600">
          Smart Attendance
        </h1>

        <p className="mb-8 text-center text-gray-500">
          Biometric Login System
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 flex justify-center gap-2 rounded-xl bg-gray-100 p-1.5">
          {["student", "teacher", "admin"].map(
            (currentRole) => (
              <button
                key={currentRole}
                type="button"
                onClick={() => {
                  setRole(currentRole);
                  setError("");
                }}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  role === currentRole
                    ? "bg-white text-green-600 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {currentRole.charAt(0).toUpperCase() +
                  currentRole.slice(1)}
              </button>
            )
          )}
        </div>

        {role === "admin" ? (
          <form
            onSubmit={handleAdminLogin}
            className="space-y-4"
          >
            <div
              className="relative"
              ref={suggestionsRef}
            >
              <label className="mb-1 ml-1 block text-sm font-medium text-gray-700">
                Admin Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                onFocus={() =>
                  setShowSuggestions(true)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter admin username"
                autoComplete="username"
                required
              />

              {showSuggestions &&
                savedUsernames.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                    {savedUsernames
                      .filter((savedUsername) =>
                        savedUsername
                          .toLowerCase()
                          .includes(
                            username.toLowerCase()
                          )
                      )
                      .map(
                        (
                          suggestion,
                          index
                        ) => (
                          <button
                            key={`${suggestion}-${index}`}
                            type="button"
                            onClick={() => {
                              setUsername(
                                suggestion
                              );
                              setShowSuggestions(
                                false
                              );
                            }}
                            className="w-full px-4 py-2 text-left text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            {suggestion}
                          </button>
                        )
                      )}
                  </div>
                )}
            </div>

            <div>
              <label className="mb-1 ml-1 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white shadow-lg shadow-green-100 transition-all duration-200 hover:bg-green-700"
            >
              Login as Admin
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8">
              <div
                className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                  scanning
                    ? "animate-pulse bg-green-100"
                    : "bg-white shadow-sm"
                }`}
              >
                <svg
                  className={`h-10 w-10 ${
                    scanning
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-gray-600">
                {scanning
                  ? "Scanning fingerprint..."
                  : `Ready to scan ${role} fingerprint`}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={scanning}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-xl transition-all duration-200 ${
                scanning
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-green-600 shadow-green-100 hover:bg-green-700"
              }`}
            >
              {scanning
                ? "Processing..."
                : "Scan & Login"}
            </button>

            <p className="text-xs text-gray-400">
              Place your finger on the sensor to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
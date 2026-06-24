"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, requestPasswordReset, confirmPasswordReset, verifyResetCode } from "../src/services/api";

export default function Home() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetInfo, setResetInfo] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);

  function RoleIcon({ role, label }) {
     const initial =
       role === "Student"
         ? "/images/Student.png"
         : role === "Teacher"
           ? "/images/Teacher.png"
           : role === "Admin"
             ? "/images/Admin.png"
             : "/images/FinanceAdministrator.png";
     const [src, setSrc] = useState(initial);
     const [attempt, setAttempt] = useState(0);
     function handleError() {
       if (attempt === 0) {
         const alt1 = `/api/images/${role}.png`;
         setSrc(alt1);
         setAttempt(1);
       } else if (attempt === 1) {
         setSrc(`/images/${role.toLowerCase()}.svg`);
         setAttempt(2);
       }
     }
     return (
       <div className="w-full h-full flex items-center justify-center p-5">
         <img
           src={src}
           alt={label}
           className={`w-full h-full object-contain transition-all duration-300 ${
             role === "Finance" ? "scale-[2.3] -translate-y-3" : 
             role === "Teacher" ? "scale-[1.3] translate-x-2" : "scale-[1.3]"
           }`}
           onError={handleError}
         />
       </div>
     );
   }

  const ringStyles = {
    Student: {
      outer: "#2f4f55",
      inner: "#3a646c",
    },
    Teacher: {
      outer: "#8b2c28",
      inner: "#b23a33",
    },
    Admin: {
      outer: "#caa428",
      inner: "#d4af37",
    },
    Finance: {
      outer: "#374151",
      inner: "#4b5563",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await loginUser(form.username, form.password, role);

    if (response.error) {
      alert(response.error);
      return;
    }

    if (!response.access_token) {
      alert("Invalid username or password");
      return;
    }

    localStorage.setItem("token", response.access_token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", response.username || form.username);

    if (role === "Admin") {
      window.location.href = "/admin";
    } else if (role === "Teacher") {
      window.location.href = "/teacher";
    } else if (role === "Student") {
      window.location.href = "/student";
    } else if (role === "Finance") {
      window.location.href = "/finance";
    }
  };

  const roleDescriptions = {
    Student: "Access your attendance, grades, and academic records.",
    Teacher: "Manage class attendance, student performance, and schedules.",
    Admin: "Oversee system operations, user management, and global settings.",
    Finance: "Handle financial records, fee management, and payroll processes.",
  };

  const roles = [
    {
      name: "Student",
      label: "Student Portal",
    },
    {
      name: "Teacher",
      label: "Teacher Portal",
    },
    {
      name: "Admin",
      label: "Administrator Portal",
    },
    {
      name: "Finance",
      label: "Finance Administrator",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3e5d8] p-6">

      <div className="p-10 w-full max-w-7xl text-center">

        {/* Title */}
        {step === 1 && (
          <div className="mb-20">
            <h1 className="text-4xl font-bold text-[#8b2c28]">
              EduSync Management System
            </h1>
            <p className="text-gray-500 mt-2 text-sm">Select your role to continue</p>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {roles.map((r) => (
              <div key={r.name} className="flex flex-col items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setRole(r.name);
                    setStep(2);
                  }}
                  className="rounded-full p-3 transition-all duration-300 hover:scale-105 group"
                  style={{ 
                    backgroundColor: `${ringStyles[r.name].outer}15`,
                  }}
                  aria-label={r.label}
                >
                  <div 
                    className={`w-36 h-36 rounded-full flex items-center justify-center relative shadow-xl transition-all duration-300 group-hover:shadow-[0_0_50px_10px_rgba(0,0,0,0.2)]`} 
                    style={{ 
                      backgroundColor: ringStyles[r.name].outer,
                      boxShadow: `0 0 50px 10px ${ringStyles[r.name].outer}25`
                    }}
                  >
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center`} style={{ backgroundColor: ringStyles[r.name].inner }}>
                      <RoleIcon role={r.name} label={r.label} />
                    </div>
                  </div>
                </motion.button>
                <p className="mt-4 text-[#8b2c28] text-lg font-semibold">{r.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Login Form */}
        <AnimatePresence>
          {step === 2 && (
            <div
              className="mt-8"
            >
              <div className="w-full max-w-5xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                    {/* Left: Form Side */}
                    <div className="p-10 lg:p-14 flex flex-col justify-center">
                      <div className="text-left mb-8">
                        <h2 className="text-3xl font-bold text-[#8b2c28] mb-2">
                          {role} Login
                        </h2>
                        <p className="text-gray-600">
                          Please enter your details to sign in
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 text-left">
                          <label className="text-sm text-[#8b2c28] font-semibold">
                            Username
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your username"
                            required
                            className="w-full p-4 border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                            onChange={(e) =>
                              setForm({ ...form, username: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2 text-left">
                          <label className="text-sm text-[#8b2c28] font-semibold">
                            Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter your password"
                            required
                            className="w-full p-4 border border-gray-200 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                            onChange={(e) =>
                              setForm({ ...form, password: e.target.value })
                            }
                          />
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setShowReset(true);
                                setResetStep(1);
                                setResetInfo("");
                              }}
                              className="text-sm text-[#8b2c28] hover:text-[#6d221f]"
                            >
                              Forgot password?
                            </button>
                          </div>
                        </div>

                        {!showReset && (
                          <button
                            type="submit"
                            className="w-full bg-[#8b2c28] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#6d221f] hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                          >
                            Login
                          </button>
                        )}

                        {showReset && (
                          <div className="mt-4 space-y-4">
                            {role === "Student" ? (
                              <p className="text-sm text-gray-600">
                                Please contact the Admin to reset your password.
                              </p>
                            ) : resetStep === 1 ? (
                                <div className="space-y-3">
                                <input
                                  type="email"
                                  placeholder="Enter your email"
                                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                                  onChange={(e) => setResetEmail(e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await requestPasswordReset(form.username, role, resetEmail);
                                    if (res.error || res.detail) {
                                      setResetInfo(res.error || res.detail);
                                    } else {
                                      setResetInfo("Reset code sent to your email.");
                                      if (res.dev_code) setResetInfo(`Reset code: ${res.dev_code}`);
                                      setResetStep(2);
                                      setCodeVerified(false);
                                      setResetCode("");
                                      setResetNewPassword("");
                                    }
                                  }}
                                  className="w-full bg-[#8b2c28] text-white py-3 rounded-xl font-semibold hover:bg-[#6d221f] transition"
                                >
                                  Send reset code
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <label className="block text-left text-sm text-[#8b2c28] font-semibold">
                                  Enter 6-digit reset code
                                </label>
                                <input
                                  type="text"
                                  placeholder="Enter 6-digit reset code"
                                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={6}
                                  onChange={async (e) => {
                                    const val = e.target.value.trim();
                                    setResetCode(val);
                                    if (val.length === 6) {
                                      const res = await verifyResetCode(form.username, role, val);
                                      if (res.error || res.detail) {
                                        setResetInfo(res.error || res.detail);
                                        setCodeVerified(false);
                                      } else {
                                        setResetInfo("Code verified. Enter a new password.");
                                        setCodeVerified(true);
                                      }
                                    } else {
                                      setCodeVerified(false);
                                    }
                                  }}
                                />
                                <input
                                  type="password"
                                  placeholder="Enter new password"
                                  className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                                  onChange={(e) => setResetNewPassword(e.target.value)}
                                  disabled={!codeVerified}
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await confirmPasswordReset(form.username, role, resetCode, resetNewPassword);
                                    if (res.error || res.detail) {
                                      setResetInfo(res.error || res.detail);
                                    } else {
                                      setResetInfo("Password reset successful. You can now log in.");
                                      setShowReset(false);
                                      setResetStep(1);
                                      setResetCode("");
                                      setResetNewPassword("");
                                      setCodeVerified(false);
                                    }
                                  }}
                                  className="w-full bg-[#8b2c28] text-white py-3 rounded-xl font-semibold hover:bg-[#6d221f] transition"
                                  disabled={!codeVerified}
                                >
                                  Reset password
                                </button>
                              </div>
                            )}
                            {resetInfo && (
                              <p className="text-sm text-red-600">{resetInfo}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowReset(false);
                                setResetStep(1);
                                setResetInfo("");
                                setCodeVerified(false);
                              }}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Back to login
                            </button>
                          </div>
                        )}
                      </form>

                      <button
                        onClick={() => setStep(1)}
                        className="mt-8 text-[#8b2c28] hover:text-[#6d221f] font-medium text-sm flex items-center gap-2 group"
                      >
                        <span className="group-hover:-translate-x-1 transition-transform">
                          ←
                        </span>{" "}
                        Back to Role Selection
                      </button>
                    </div>

                    {/* Right: Graphic Side */}
                    <div className="hidden lg:flex flex-col items-center justify-center bg-linear-to-br from-[#8b2c28]/5 to-[#8b2c28]/10 p-12 relative overflow-hidden">
                      {/* Decorative circles */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b2c28]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8b2c28]/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                      {/* Portal Icon in Circle */}
                        <div className="relative z-10 text-center">
                          <div 
                            className="rounded-full p-3 shadow-sm mb-6 mx-auto inline-block"
                            style={{ 
                              backgroundColor: `${ringStyles[role].outer}15`,
                            }}
                          >
                            <div 
                              className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-2xl" 
                              style={{ 
                                backgroundColor: ringStyles[role].outer,
                                boxShadow: `0 0 60px 15px ${ringStyles[role].outer}33`
                              }}
                            >
                              <div className="w-36 h-36 rounded-full flex items-center justify-center" style={{ backgroundColor: ringStyles[role].inner }}>
                                <RoleIcon role={role} label={role} />
                              </div>
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-[#8b2c28] uppercase tracking-wider mb-2">
                            {role} Portal
                          </h3>
                          <p className="text-gray-600 max-w-xs mx-auto mb-2 text-sm italic">
                            {roleDescriptions[role]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}

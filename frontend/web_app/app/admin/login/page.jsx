"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser, requestPasswordReset, confirmPasswordReset, verifyResetCode } from "../../../src/services/api";

export default function Home() {
  const router = useRouter();

  const login = (userData) => {
    if (typeof window === "undefined") return;

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

    const userRole =
      userData?.category ||
      userData?.role ||
      role;

    if (userRole) {
      sessionStorage.setItem(
        "smart_attendance_role",
        userRole
      );
    }
  };
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
  const [savedUsernames, setSavedUsernames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Load saved usernames from localStorage on mount
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await loginUser(form.username, form.password, role);

    console.log("Login response:", response);

    if (response.error) {
      alert(response.error);
      return;
    }

    if (
      response.error ||
      response.detail ||
      response.message !== "Login successful"
    ) {
      alert(
        response.error ||
          response.detail ||
          "Invalid username or password"
      );
      return;
    }

    // Save username to localStorage if not already there
    const updatedUsernames = [...savedUsernames];
    if (!updatedUsernames.includes(form.username)) {
      updatedUsernames.push(form.username);
      localStorage.setItem("smart_attendance_usernames", JSON.stringify(updatedUsernames));
      setSavedUsernames(updatedUsernames);
    }

    // Use our login function
    login(response);

    // Redirect
    if (role === "Admin") {
      router.push("/admin");
    } else if (role === "Teacher") {
      router.push("/teacher");
    } else if (role === "Student") {
      router.push("/student");
    } else if (role === "Finance") {
      router.push("/finance");
    }
  };

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
          className="w-full h-full object-contain scale-[1.3] transition-all duration-300"
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

  const roles = [
    {
      name: "Student",
      label: "Student Portal",
      img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL4AAACUCAMAAAAanWP/AAAAZlBMVEX///8AAAD+/v4EBAQlJSXh4eH7+/tjY2Ps7OzGxsYyMjLe3t5xcXHn5+f19fXMzMydnZ13d3e+vr6urq7U1NRcXFyUlJRWVlY4ODgfHx89PT2Li4sYGBioqKiDg4MTExNFRUVOTk7DVyWkAAAKbklEQVR4nO2cC5eqOAyAoUApUN5vEJD//ye3SQviqKPeRWDOMXt2xjvy+FqSNG0TNO0rD4WQvQn+UQCcEEIJiAb//SlBbvkR2kD3pXlHEBt5g6QtkgD+RegfagAI9dLc0IUYeZr9EXapMCTws+KsL+RchH4wqT85nklLQwUq6mdpf8WuWtCnIYOnAHYg/j9SA4hGKQV2Kym4e8suxeVFYkFDp6YeRRAmyCI+IruhG8aS2wCRLRh54aExH6r7NS0rcvPCfEU/t0F+MMsi2xVVGiiI8IeEBl5qP1KYR5InXkCnq2w8qhHVBgJOJozsGjv3zQaYdiTcEV4I7WZbQW0P07a81owXRR1etmkWzB2yqfhOwZvTP6Aj/nTaqeGF438cdqHt8NFK47OrQO7DI53RNEtzVg39aeHmGKc+3oOqgINoK4/TEhyNTTjI8ml/Y6taRglrh2HBK7v9zullhGokwAOMVNfGx5+Bl8Tmsud+U4+UpDFPg8AL06K3x8ocHh0ppY6FO5Lj9/q9TwPL6XizvOdvLTD0MijgA49SJ/Msy8uctGh5fnbrm2ONaaCreOf4AV3dkxKNdef5+SP4M4stWD0dUzd23HZJ6DHGvDDpirh0F2cD/UWnyoitP0EgEM+MDx773d6P6fXhRu2eS9EM8TAsxnxQKV66lwbIq40taNDa+GBLQn+yrnyFHb82LF+o2ph0fDSX3wy1eS7jIs1YQAJmhWlfntRXYL8UHNDqykNx3io+saQ/my95niojzKe+L05kntO1dlOZp6szK16kMPSy2DDPfcLwRhiIrIxP1bwbJ300FLHl6RH5hG/oQ5x28aBXeR8JvfcZs7IkKoT1VlfWa5aOH4V4YXD85FPhNF5VXliEaUUOiqu8xs3jMH6o11CVvAUnZFl+htZrn93Jk3Ls9/ku2hZRBPXDjiPA7Iyei9mUdl+kDj4LbAUYhs0+TvtD5PAe+M69meEDhZpcrXEyq+acdwF4Axbugg+rNxgAsSw6n57b8rWCDWORMZhjivhpD3w5Zc3iLoMJuJ/Go/tkJJ6HO1eEaIKXsqyLQ03z9sEHcUzdzAsx0GjEdyJ+HhTntTEsAs3hbEcOA9NPCluc7OyLj6NmPcZdGIAapUU56PrPZzDFAzVMTwQpC7tYOl53d3yp00aVtzDsUJg83leevAh9iiuHeTV5zL3xK/3iUU6u3cE6DmUJn6LqaXUhTgCdeJ3tnhZf7I1/syY1tiEsIQRZO0rQkzu2MBMRAdPPkO+A+NjVHWi45gl3VMYpLOowEZiZt0ZxNPx5NY1HiUU1agmVoV4ScRVf/JwnHg3/8tMsxUOggSecTL00gyPjX8upKsvq/gT3L+A/lyPjvzAhPjK+/jN4+Fv4xo/ffwz/Bfnif/FfnekeDT+sJPw0Wb8NC67EmNYfpsOqPWdbhPj2Nf4TufgihW/7e/Y+0aLhH7a15qYMkbjErvioDjxqY7s8u/VpuRdxSzwMJ7VOK6dkRiEuke2n+1qLXKmGC7iwbJykUdtzuxzPTeWadW26VTOOpc0FcopLhQEuYKZ4Yks0yoUJ7LTRSy741xIwKwudJE0TJ8x8xn4s+pELvgeP7/YCmwjtkSLR5D7vlD91cxy5iPynluCJPdWYqS6wuRASxBf8JSWsYVEplwQMecQVfhyIT/XQ7uQ4Z/yrRe0FriYzYOYMnht88XW+l+prl95/a0V7ia8FtbGL7mjr4Pu63u2UHbMGviMsOPgU4O9CZ/y3dqPI5DiF59GK/Y",
      outer: "bg-[#2f4f55]",
      inner: "bg-[#3a646c]",
    },
    {
      name: "Teacher",
      label: "Teacher Portal",
      img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAACUCAMAAADyHdbUAAAAaVBMVEX///8AAAD4+Pj19fX7+/uSkpLExMQxMTHw8PDZ2dm0tLTm5uZ6enrg4ODIyMjd3d0gICAYGBjT09MQEBCtra1jY2M5OTmlpaVRUVFtbW1MTEy9vb2KioqdnZ1AQEBzc3MqKipaWlqCgoJ+xEIRAAAKYklEQVR4nO1cibaiuhIVCBpGZVAUBIH//8iXAaRQCCHEq/3W2XfddbrtI1Sl5gF2uz/84Q9/+L+A5R3jtLT9x8O3MzcOPOvbFK2BF6Z+ZYxQtW6Iv02XJJzynBgTiG7Z8du0ScB5PXuI3Pa+Td8S7qd58ilq99sUCuFM6s4Y1981Z5QuHH8nBOfbhM7ALKXoN4xD+G1Sp1FK6A/HJf42rVNwZcknqH4wJHgr6DeMB/o2va8wL6sYMH7Om8obAEfyY840uK6j3zDsb5M8RraW/h+zY++2moEk+zbREOFKC6C4/ZIjWq9BJDP9oWiG12sQQfptsgd4tQoDP+SHAhX6jcfv+KG9EgPX4Nt0P6Fiw6Qu+B0rvisxYPxMWYBW5xEc+28T3gOp0W8U3ya8B/7XGYj/dQaKf52BNdUwxBYj9tws3WtKB0NFJ2T46lVZcSbfr29aGpVYlf4N6dz+wC9Q6WAgjZQZOCjecsh+7xoYaJXpNwxFHRqMLtdgBv4GBtTmBaD80FBZo8cGBtSyIZD85tu7M/89A+Z5uMBtM/3bVEip0R5vvcALthixqXJD0MQ8a6B/lym0VDokKveDAtAyNAyVKnr1A2yG7+uwgN3OEkwlF6ASiUMQNzXVpEpNIQYVDQBOb0MuNYKjSr8KAQVQWG01tWI2lygQYAKn3WobMQSS08kX3BUIAB6j1lgPFSp23Cok8xZo4NyUgsgMnPWGrGSBwNxOeqds63tzKn1FBASgpZYZsHpGliuQPxrl6m7rre0uKt0fxADNAiAiWJdQKAhg3EDT31ddJwKljgqIAblOF8RhrqH/plIJQiF/oi+8whFFSgoABHD+xHAHyUezu4oCxOD6n2lKSg+LK6U6xAYC+MzqoClpx4lSQy6+bLyABLyzgOwBSnUUAibWfGy8uZcKBkqX9g7DBUrNZAOky2aQqOlvOVyh0h8DeiBoadOo97uhnYmQKdnbhEH4sysKC12iOgUUm6ZlSXIADib6EOU9UUJXdEqB+BGyTPKfDAcIqOan94xMkRaNihBkUhFIMQCuWX94w8I0d9nsxGPcyUScA4mLYtBN/PSSDj3RsJmiPoIJjEl1HyFMVEjiokAA1Uf39xHaYaoS3p147YTrbffDuGZW738QOXtivUwC/FsI9f8wdVkPlHuftQCi0YQBQhcK7ySmRYmRRElEfhhVdiREM32nZJvMfE1ixTtEvkT+yDiZsQgQhPOPbr5jSpXFnOPOOqZPRUpurseoZk6TUMnVhiqRidjH7LM5m/aARn5iy8v0nLDI7PYa3ZkK0eMlh0nEgMPUvttujKm2UK1hPtMyg/xwa213HzqYscJlQs9/0iTAHD3X+hAO9uLyDLMfKt8nA5irRUcfVReMqGjIQafQtvPWDQgfHQMT9Hv58Ms6pqo9nPS1mZWQQoUpQ6fZTOGZnlCBcBKJ6Zp0RfAUJQn5P+JNyUtbeGhHNQnRH+MbAQHU+lyQYx+MNySnPaJHTRmg5hA7R4fBo0Ix8Y6fMS0NIwrCw4nwkCQkcJxTzDggiofHHIAYoE0AZjZZPiZGhYmZMk0nbOBLzlGVFpPAjnkbrkDRiTqnU0RYYT+S5BbvmAgwHtkxXIXR1Y7G85PV0dDo+WkGSAoOPbcvzJNEb+pmwMhaTfQHomcdYLHxtD5QgwtXQ+z3TB+u8mjKgrCwaElAx6b3NqCIN8VT5TcOYKvD1rMeBL3aFC5DrMT8V5NBg8xS/OW3QAVWYU56grBA/zs0g6+Lqb4k7S",
      outer: "bg-[#8b2c28]",
      inner: "bg-[#b23a33]",
    },
    {
      name: "Admin",
      label: "Administrator Portal",
      img: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAmwMBIgACEQEDEQH/xAAcAAEAAwEAAwEAAAAAAAAAAAAAAQcIBgMEBQL/xAA7EAABBAECBAQDBgQEBwAAAAABAAIDBAUGEQcSITETQWFxUYGhFCIyQlKRFXKxwQgjstEzNFNigpKU/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ALxREQEREBEUboJRcfrXiJgtIsLLcxs3fKnXIL/d3X7o91UGV46aksyn+HVaVKLyBYZXfMk7fRBo9FmGLjRrKN/M61VkH6X1m7fTZdrpPjnXszR19TURVLiG/aq25jB+LmnqB7boLpRevSu1r9aOzSnjngkG7JI3BzXD3C9hAREQEREBERAREQEREBERAXCcX9XS6U0w51KQMyFx/g13Eb8n6nbeg7epC7tZ3/xG3nS6qx9Hf/Lr0/EH8z3Hf6NCCqZ5pJpnyzPdJI8lznvduXE+ZPmV4lKhAUgkKEQWDwg1nY01qOvTmmccXekEc0ZO4Y49GvHw69/RahB3WHgSCCCQR2Wz9MXTktOYu8TubFSKQn1LASg+miIgIiICIiAiIgIiICIiAsq8ZcxWzWu7stQuMddraxcfNzCQ4j03WqljfWtSWjq7M1phs9l2X9i4kfQoPiIiICIiCR3WrODuYgy2gsc2Dm56TBVlDvJzQPpsQVlMd1o//DxTkg0XZsyDZtm690fq0Na3+oKC00REBERAREQEREBERAREQFTHHrRUM1GTVNFrxZh5GW2NG4ezfYP9xuB7K51692pBdpzVbUYkgmYWSMI6OaehQYlKhdNr7SdnSOoZsdO1xru3fVmI6Sxnt8x2K5ooIRFICD7WjdPy6m1JRxMRc1s7/wDMkaN+Rg6uP7LXWExlXC4qtjaEfh1q0YYwefTzPqfNVxwM0S/B4x2byMZbevsHhRuHWKLuPm7ofYBWqOiAiIgIiICIiAiIgIiICIo5gBuegQSo6L4uX1dp7DMLsll6cO35fFDnH/xHVVZrHjkxrH1tJ1S9xH/OWW7Afys8/n+yCz9ZaUxmrsUaOSj6j70M7B9+J3xB/t5rOOquGOpdPTyH7C+9UH4LNVvMCPVvdpX2NDcYMpgnyw5pkmUqzSmVz3P2lY499j2I9OitKjxk0bZY3xbliq4/llru6fMAhBnWjpvN3rDYKuIvSSOOwAgd/cK4+GvB91GxDldVsjdMzZ0NAbOa0/F57E+g6LsZuLGiIW838ZDvRkEhP+lczqLjpiYIXswNGe5OfwyTjw4x67dz7dEFvAAdtgpWXdN8W9R4fJ2LFqQZCvalMstaYkBpPfwz+X26j0V8aH11i9ZV5X46OxHLCG+NHLGdmE+XN2KDql+XvZG0vkc1rR3LjsAq21HxjweF1CMWyCW5FG7ls2YXDlid5gD823nsuW406/wua05XxeDyP2iSSwyWfw2uA8MNd0JPnzcvT0QXay7Ue4NZahc49gJASV51iOrO6tYisQktkieHtcDsQQd+hWlb/GTS9bBMvVrDrdtw2FNjC14d58246D1QWOi5TQWucZrOg+apvBbi6T1Hu3dH8CPiD8V1Y6oCIiAiIg4biprsaLxEf2ZjJslbJbXjeN2tA7vd6DcdPMrOOb1bn85K9+Ty1qYOP/D8QtYPQNHRdVx4yb72v7Fbc+HRhjiaD23LQ8kf+23yVcoJJ37puVCIJ3Tc/FQiCd03KhEEjury4LxTZLh9qDC1H",
      outer: "bg-[#caa428]",
      inner: "bg-[#eadfd0]",
    },
    {
      name: "Finance",
      label: "Finance Administrator",
      img: "/images/FinanceAdministrator.png",
      outer: "bg-[#374151]",
      inner: "bg-[#4b5563]",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="p-10 w-full max-w-6xl text-center">
        {/* Title */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-4xl font-bold text-green-600">
              Smart Attendance System
            </h1>
            <p className="text-gray-50 mt-2">Select your role to continue</p>
          </motion.div>
        )}

        {/* Role Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
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
                    className="w-36 h-36 rounded-full flex items-center justify-center relative shadow-xl transition-all duration-300 group-hover:shadow-[0_0_50px_10px_rgba(0,0,0,0.2)]"
                    style={{
                      background: ringStyles[r.name].outer,
                      boxShadow: `0 0 50px 10px ${ringStyles[r.name].outer}25`,
                    }}
                  >
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center"
                      style={{ background: ringStyles[r.name].inner }}
                    >
                      <RoleIcon role={r.name} label={r.label} />
                    </div>
                  </div>
                </motion.button>
                <p className="mt-4 text-[#8b2c28] text-lg font-semibold">
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Login Form */}
        <AnimatePresence>
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              {/* ADMIN: two-column layout (left form, right graphic) */}
              {role === "Admin" ? (
                <div className="w-full max-w-5xl mx-auto">
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
                      {/* Left: Form Side */}
                      <div className="p-10 lg:p-14 flex flex-col justify-center">
                        <div className="text-left mb-8">
                          <h2 className="text-3xl font-bold text-[#8b2c28] mb-2">
                            Admin Login
                          </h2>
                          <p className="text-gray-600">
                            Please enter your details to sign in
                          </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="space-y-2 text-left relative" ref={suggestionsRef}>
                            <label className="text-sm text-[#8b2c28] font-semibold ml-1">
                              Username
                            </label>
                            <input
                              type="text"
                              placeholder="Enter your username"
                              required
                              value={form.username}
                              className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                              onChange={(e) =>
                                setForm({ ...form, username: e.target.value })
                              }
                              onFocus={() => setShowSuggestions(true)}
                            />
                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                              {showSuggestions && savedUsernames.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10, height: 0 }}
                                  animate={{ opacity: 1, y: 0, height: "auto" }}
                                  exit={{ opacity: 0, y: -10, height: 0 }}
                                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                                >
                                  {savedUsernames.filter(u => 
                                    u.toLowerCase().includes(form.username.toLowerCase())
                                  ).map((username, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        setForm({ ...form, username: username });
                                        setShowSuggestions(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                                    >
                                      {username}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="space-y-2 text-left">
                            <label className="text-sm text-[#8b2c28] font-semibold ml-1">
                              Password
                            </label>
                            <input
                              type="password"
                              placeholder="Enter your password"
                              required
                              className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#8b2c28]/20 focus:border-[#8b2c28] transition-all"
                              onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                              }
                            />
                          </div>

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
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none"
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
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                                  >
                                    Send reset code
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <label className="block text-left text-sm text-green-600 font-semibold ml-1">
                                    Enter 6-digit reset code
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Enter 6-digit reset code"
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none"
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
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-600/20 focus:border-green-600 outline-none"
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
                                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                                    disabled={!codeVerified}
                                  >
                                    Update Password
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

                        <div className="relative z-10 text-center">
                          <div className="bg-white/40 p-8 rounded-full mb-8 backdrop-blur-sm shadow-sm inline-block">
                            <img
                              src="/images/Admin.png"
                              alt="Admin"
                              className="w-48 h-48 object-contain drop-shadow-md"
                              onError={(e) => {
                                const adminRole = roles.find(
                                  (x) => x.name === "Admin"
                                );
                                if (adminRole?.img)
                                  e.currentTarget.src = adminRole.img;
                              }}
                            />
                          </div>
                          <h3 className="text-2xl font-bold text-green-600 mb-3">
                            Welcome, Admin
                          </h3>
                          <p className="text-gray-600 max-w-xs mx-auto leading-relaxed">
                            Manage users, attendance, and generate reports from
                            your dedicated dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* NON-ADMIN: keep your existing centered layout */
                <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                  <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">
                    {role} Login
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-left relative" ref={suggestionsRef}>
                      <label className="text-sm text-green-600 font-semibold ml-1">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        required
                        value={form.username}
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        onFocus={() => setShowSuggestions(true)}
                      />
                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions && savedUsernames.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                          >
                            {savedUsernames.filter(u => 
                              u.toLowerCase().includes(form.username.toLowerCase())
                            ).map((username, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, username: username });
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                              >
                                {username}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-sm text-green-600 font-semibold ml-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        required
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                      />
                    </div>

                    {!showReset && (
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                      >
                        Login
                      </button>
                    )}
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset(true);
                        setResetStep(1);
                        setResetInfo("");
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {showReset && (
                    <div className="mt-6 space-y-4">
                      {role === "Student" ? (
                        <p className="text-sm text-gray-600 text-center">
                          Please contact the Admin to reset your password.
                        </p>
                      ) : resetStep === 1 ? (
                        <div className="space-y-3">
                          <input
                            type="email"
                            placeholder="Enter your registered email"
                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
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
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                          >
                            Send reset code
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="block text-left text-sm text-green-600 font-semibold ml-1">
                            Enter 6-digit reset code
                          </label>
                          <input
                            type="text"
                            placeholder="Enter 6-digit reset code"
                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
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
                            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all"
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
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
                            disabled={!codeVerified}
                          >
                            Reset password
                          </button>
                        </div>
                      )}
                      {resetInfo && (
                        <p className="text-sm text-red-600 text-center">{resetInfo}</p>
                      )}
                      <div className="text-center">
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
                    </div>
                  )}

                  <button
                    onClick={() => setStep(1)}
                    className="mt-6 text-green-600 hover:text-green-700 font-medium text-sm flex items-center justify-center gap-2 group w-full"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">
                      ←
                    </span>{" "}
                    Back to Role Selection
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
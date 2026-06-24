import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa";

const RoleSelect = () => {
  const navigate = useNavigate();

  const roles = [
    {
      label: "Administrator Portal",
      icon: <FaUserShield />,
      color: "#facc15", // yellow
      path: "admin",
    },
    {
      label: "Teacher Portal",
      icon: <FaChalkboardTeacher />,
      color: "#ef4444", // red
      path: "teacher",
    },
    {
      label: "Student Portal",
      icon: <FaUserGraduate />,
      color: "#16a34a", // green
      path: "student",
    },
  ];

  const handleRoleSelect = (role) => {
    navigate(`/login/${role}`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <h1 style={styles.heading}>Select Your Role</h1>
        <p style={styles.subheading}>Choose the role that best describes you to continue</p>

        <div style={styles.grid}>
          {roles.map((role) => (
            <div
              key={role.label}
              onClick={() => handleRoleSelect(role.path)}
              style={{ ...styles.card, backgroundColor: role.color }}
            >
              <div style={styles.icon}>{role.icon}</div>
              <span style={styles.label}>{role.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    textAlign: "center",
    maxWidth: "900px",
    width: "100%",
    padding: "20px",
  },
  heading: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    color: "#1f2937",
  },
  subheading: {
    fontSize: "1rem",
    marginBottom: "2rem",
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "2rem",
    width: "100%",
  },
  card: {
    cursor: "pointer",
    borderRadius: "50%",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
    transition: "transform 0.3s ease",
  },
  icon: {
    fontSize: "3rem",
    marginBottom: "1rem",
  },
  label: {
    fontWeight: "600",
    fontSize: "1.1rem",
  },
};

export default RoleSelect;
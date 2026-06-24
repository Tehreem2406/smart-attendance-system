"use client";

export default function Navbar({ role }) {
  return (
    <nav className="bg-[#eadfd0] px-6 py-4 flex justify-between items-center shadow">
      <h1 className="text-2xl font-bold tracking-wide text-[#8b2c28]">EduSync Management System</h1>
      <div className="flex items-center gap-4">
        <span className="font-medium">{role} Dashboard</span>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.clear();
              window.location.href = "/";
            }
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

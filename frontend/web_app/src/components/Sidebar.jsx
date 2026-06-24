"use client";
import Link from 'next/link';

export default function Sidebar({ role }) {
  let menuItems = [];

  if (role === "Admin") {
    menuItems = [
      { name: "Dashboard", path: "/admin" },
      { name: "Users", path: "/admin/users" },
      { name: "Settings", path: "/admin/settings" }
    ];
  }
  if (role === "Teacher") {
    menuItems = [
      { name: "Dashboard", path: "/teacher" },
      { name: "Classes", path: "/teacher/classes" },
      { name: "Attendance", path: "/teacher/attendance" },
      { name: "Assignments", path: "/teacher/assignments" },
      { name: "Assignment Record", path: "/teacher/records" },
      { name: "Marks Record", path: "/teacher/marks" }
    ];
  }
  if (role === "Student") {
    menuItems = [
      { name: "Dashboard", path: "/student" },
      { name: "Attendance", path: "/student/attendance" },
      { name: "Assignments", path: "/student/assignments" }
    ];
  }
  if (role === "Finance") {
    menuItems = [
      { name: "Dashboard", path: "/finance" },
      { name: "Fee Structures", path: "/finance/fees" },
      { name: "Student Payments", path: "/finance/payments" },
      { name: "Teacher Salaries", path: "/finance/salaries" }
    ];
  }

  return (
    <div className="w-64 bg-white shadow-xl h-screen p-6 sticky top-0 border-r border-gray-100">
      <div className="mb-10 pb-4 border-b border-gray-100">
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">Portal Access</p>
        <h2 className="text-xl font-black text-[#8b2c28] uppercase tracking-tighter">{role} Menu</h2>
      </div>
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link 
              href={item.path} 
              className="block px-4 py-3 rounded-lg text-sm font-bold text-gray-600 hover:bg-[#2d5a27]/5 hover:text-[#2d5a27] transition-all border border-transparent hover:border-[#2d5a27]/10"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

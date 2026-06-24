"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { studentClasses, getAssignments, getSubmissions } from "../../src/services/api";

export default function Sidebar({ role }) {
  const [username, setUsername] = useState("");
  const [assignmentCount, setAssignmentCount] = useState(0);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("username") || "";
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    if (role === "Student" && username) {
      async function fetchAssignmentCount() {
        try {
          const classes = await studentClasses(username);
          if (!Array.isArray(classes)) return;

          let pendingCount = 0;
          
          for (const cls of classes) {
            const assignments = await getAssignments(cls.id);
            if (!Array.isArray(assignments)) continue;

            for (const assign of assignments) {
              const submissions = await getSubmissions(assign.id);
              const isSubmitted = Array.isArray(submissions) && 
                submissions.some(s => s.student_username === username);
              
              if (!isSubmitted) {
                pendingCount++;
              }
            }
          }
          setAssignmentCount(pendingCount);
        } catch (error) {
          console.error("Error fetching assignment count:", error);
        }
      }

      fetchAssignmentCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchAssignmentCount, 30000);
      return () => clearInterval(interval);
    }
  }, [role, username]);

  const isFinance = role === "Finance";
  const isAdmin = role === "Admin";
  const isTeacher = role === "Teacher";
  const isStudent = role === "Student";
  
  return (
    <aside className="w-64 bg-white shadow-xl h-screen p-6 sticky top-0 border-r border-gray-100">
      <div className="mb-10 pb-4 border-b border-gray-100">
        <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">Portal Access</p>
        <h2 className="text-xl font-black text-[#8b2c28] uppercase tracking-tighter">{role} Menu</h2>
      </div>

      <ul className="space-y-2">
        {isFinance && (
          <>
            <SidebarLink href="/finance" label="Dashboard" />
            <SidebarLink href="/finance/fees" label="Fee Structures" />
            <SidebarLink href="/finance/salaries" label="Teacher Salaries" />
            <SidebarLink href="/finance/payments" label="Student Payments" />
            <SidebarLink href="/finance/ledger" label="Financial Ledger" />
            <SidebarLink href="/finance/reports" label="Financial Reports" />
          </>
        )}
        {isAdmin && (
          <>
            <SidebarLink href="/admin" label="Dashboard" />
            <SidebarLink href="/admin/users" label="Manage Users" />
            <SidebarLink href="/admin/classes" label="Manage Classes" />
            <SidebarLink href="/admin/reports" label="Attendance Reports" />
          </>
        )}
        {isTeacher && (
          <>
            <SidebarLink href="/teacher" label="Dashboard" />
            <SidebarLink href="/teacher/classes" label="My Classes" />
            <SidebarLink href="/teacher/attendance" label="Attendance Records" />
            <SidebarLink href="/teacher/assignments" label="Manage Assignments" />
            <SidebarLink href="/teacher/records" label="Assignment Records" />
            <SidebarLink href="/teacher/marks" label="Marks Record" />
          </>
        )}
        {isStudent && (
          <>
            <SidebarLink href="/student" label="Dashboard" />
            <SidebarLink href="/student/attendance" label="Attendance" />
            <SidebarLink 
              href="/student/assignments" 
              label="My Assignments" 
              notification={assignmentCount} 
            />
          </>
        )}
      </ul>
    </aside>
  );
}

function SidebarLink({ href, label, notification }) {
  return (
    <li>
      <Link 
        href={href} 
        className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold text-gray-600 hover:bg-[#2d5a27]/5 hover:text-[#2d5a27] transition-all border border-transparent hover:border-[#2d5a27]/10"
      >
        <span>{label}</span>
        {notification > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-[10px] font-black text-white bg-red-500 rounded-full shadow-sm animate-in fade-in zoom-in duration-300">
            {notification}
          </span>
        )}
      </Link>
    </li>
  );
}

"use client";
import { use, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { listAttendance, studentClasses } from "../../../src/services/api";

export default function StudentDashboard({ params }) {
  const unwrappedParams = use(params);
  const studentId = unwrappedParams.id;
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    async function loadData() {
      const cls = await studentClasses(studentId);
      setClasses(cls || []);
      const att = await listAttendance(studentId);
      setAttendance(att || []);
    }
    loadData();
  }, [studentId]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Student" />
      <div className="flex flex-1">
        <Sidebar role="Student" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Student Profile: {studentId}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Enrolled Classes</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {classes.map(c => (
                    <li key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-semibold text-gray-700">
                      {c.name}
                    </li>
                  ))}
                  {classes.length === 0 && <li className="text-gray-400 italic">No classes found.</li>}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Attendance History</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {attendance.map(a => (
                    <li key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="font-semibold text-gray-700">{new Date(a.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                    </li>
                  ))}
                  {attendance.length === 0 && <li className="text-gray-400 italic">No attendance records found.</li>}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

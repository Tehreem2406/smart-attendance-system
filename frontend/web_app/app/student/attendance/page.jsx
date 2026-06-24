"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { listAttendance, studentClasses } from "../../../src/services/api";

export default function StudentAttendance() {
  const [username, setUsername] = useState("");
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("username") || "";
      setUsername(storedUser);
    }
  }, []);

  useEffect(() => {
    if (username) {
      async function loadData() {
        try {
          const [cls, att] = await Promise.all([
            studentClasses(username),
            listAttendance(username)
          ]);
          setClasses(cls || []);
          setAttendance(att || []);
        } catch (error) {
          console.error("Error loading attendance data:", error);
        }
      }
      loadData();
    }
  }, [username]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Student" />
      <div className="flex flex-1">
        <Sidebar role="Student" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">My Attendance History</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Enrolled Classes</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {classes.map(c => (
                    <li key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-gray-700 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#2d5a27]"></div>
                      {c.name}
                    </li>
                  ))}
                  {classes.length === 0 && (
                    <li className="text-gray-400 italic text-center py-4">No classes found.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Attendance Logs</h3>
                <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {attendance.length} Records
                </span>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {attendance.map(a => {
                    const dateObj = new Date(a.timestamp);
                    return (
                      <li key={a.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#2d5a27] font-black text-xs">
                            {dateObj.getDate()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#2d5a27] text-lg">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase">Present</span>
                        </div>
                      </li>
                    );
                  })}
                  {attendance.length === 0 && (
                    <li className="text-gray-400 italic text-center py-8">No attendance records found.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getClassAttendance } from "../../../src/services/api";

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(0);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const data = await getClasses();
        const safeData = Array.isArray(data) ? data : [];
        const currentUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;
        if (currentUsername) {
          setClasses(safeData.filter(c => c.teacher_username?.toLowerCase() === currentUsername.toLowerCase()));
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    }
    loadClasses();
  }, []);

  async function handleSelectClass(e) {
    const id = parseInt(e.target.value);
    setSelectedClass(id);
    if (id) {
      const data = await getClassAttendance(id);
      setAttendance(data || []);
    } else {
      setAttendance([]);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Attendance Records</h2>

          <div className="bg-white rounded-xl shadow-md p-8 mb-10">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Filter by Class</h3>
            <div className="max-w-md">
              <select
                value={selectedClass}
                onChange={handleSelectClass}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
              >
                <option value={0}>Select a Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClass !== 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Attendance Logs</h3>
                <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold">
                  {attendance.length} Records Found
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Student</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Date</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-gray-500 italic">
                          No attendance records found for this class.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((rec) => {
                        const dateObj = new Date(rec.timestamp);
                        return (
                          <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[#2d5a27] font-bold text-xs">
                                  {rec.student_username[0].toUpperCase()}
                                </div>
                                <span className="font-semibold text-gray-800 capitalize">{rec.student_username}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-700 font-medium">{dateObj.toLocaleDateString()}</td>
                            <td className="py-4 px-6 text-gray-500 text-sm">{dateObj.toLocaleTimeString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

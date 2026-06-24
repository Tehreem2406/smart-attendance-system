"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getAttendanceReport, exportAttendanceReport } from "../../../src/services/api";

export default function ReportsPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(0);
  const [month, setMonth] = useState("");
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function load() {
      const cls = await getClasses();
      setClasses(Array.isArray(cls) ? cls : []);
      const data = await getAttendanceReport(undefined, undefined);
      setReports(Array.isArray(data) ? data : []);
    }
    load();
  }, []);

  async function handleFilter() {
    const cid = selectedClass || undefined;
    const m = month || undefined;
    const data = await getAttendanceReport(cid, m);
    setReports(Array.isArray(data) ? data : []);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Admin" />
      <div className="flex flex-1">
        <Sidebar role="Admin" />

        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8 text-[#2d5a27]">Attendance Reports</h1>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Class</label>
                <select 
                  value={selectedClass} 
                  onChange={(e) => setSelectedClass(parseInt(e.target.value))} 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                >
                  <option value={0}>All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Month</label>
                <input 
                  type="month" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)} 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all" 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleFilter} 
                  className="px-8 py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md active:scale-95"
                >
                  Filter
                </button>
                <button 
                  onClick={() => exportAttendanceReport(selectedClass || undefined, month || undefined)} 
                  className="px-6 py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Report Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">ID</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">Student</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">Class</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">Date</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {reports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[#2d5a27]/5 transition-colors group">
                      <td className="p-4 text-sm font-medium text-gray-500">#{rep.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-800 group-hover:text-[#2d5a27] transition-colors">{rep.student}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{rep.class}</td>
                      <td className="p-4 text-sm text-gray-500">{rep.date}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          rep.status === "Present" ? "bg-[#2d5a27]/10 text-[#2d5a27]" : "bg-red-100 text-red-700"
                        }`}>
                          {rep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!reports.length && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                        No records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

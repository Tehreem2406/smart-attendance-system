"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, createClass, enrollStudent } from "../../../src/services/api";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState({ name: "", teacher_username: "" });
  const [enroll, setEnroll] = useState({ class_id: 0, student_username: "" });

  useEffect(() => {
    async function load() {
      const data = await getClasses();
      setClasses(data);
    }
    load();
  }, []);

  async function handleAddClass(e) {
    e.preventDefault();
    const created = await createClass(newClass);
    setClasses((prev) => [...prev, created]);
    setNewClass({ name: "", teacher_username: "" });
  }

  async function handleEnroll(e) {
    e.preventDefault();
    await enrollStudent(enroll);
    setEnroll({ class_id: 0, student_username: "" });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Admin" />
      <div className="flex flex-1">
        <Sidebar role="Admin" />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8 text-[#2d5a27]">Manage Classes</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Add Class Form */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Create New Class</h2>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <input
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                    placeholder="Class Name (e.g., BSCS-VII)"
                    required
                  />
                  <input
                    value={newClass.teacher_username}
                    onChange={(e) => setNewClass({ ...newClass, teacher_username: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                    placeholder="Teacher Username"
                    required
                  />
                </div>
                <button className="w-full py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md active:scale-95">
                  Create Class
                </button>
              </form>
              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Templates</p>
                <div className="flex flex-wrap gap-2">
                  {["BSCS", "BSCH", "BSPH", "MCS"].map((template) => (
                    <button 
                      key={template}
                      className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-full border border-gray-100 hover:border-[#2d5a27] hover:text-[#2d5a27] transition-all" 
                      onClick={() => setNewClass({ ...newClass, name: template })}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enroll Student Form */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">Enroll Student</h2>
              <form onSubmit={handleEnroll} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <select
                    value={enroll.class_id}
                    onChange={(e) => setEnroll({ ...enroll, class_id: parseInt(e.target.value) })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                  >
                    <option value={0}>Select a Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    value={enroll.student_username}
                    onChange={(e) => setEnroll({ ...enroll, student_username: e.target.value })}
                    className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                    placeholder="Student Username"
                    required
                  />
                </div>
                <button className="w-full py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md active:scale-95">
                  Enroll Student
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Active Classes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">ID</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">Class Name</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest">Teacher</th>
                    <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-widest text-center">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-[#2d5a27]/5 transition-colors group">
                      <td className="p-4 text-sm font-medium text-gray-500">#{cls.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-800 group-hover:text-[#2d5a27] transition-colors">{cls.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#2d5a27]/10 flex items-center justify-center text-[#2d5a27] font-bold text-xs">
                            {cls.teacher_username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-600">{cls.teacher_username}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

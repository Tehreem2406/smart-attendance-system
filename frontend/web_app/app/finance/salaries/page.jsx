"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getUsers, createSalary, getSalaries, updateSalaryStatus } from "../../../src/services/api";

export default function TeacherSalaries() {
  const [teachers, setTeachers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersData = await getUsers();
      const teachersList = usersData.filter(u => u.category === "teacher");
      const salariesData = await getSalaries();
      setTeachers(teachersList);
      setSalaries(salariesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSetSalary = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !amount || !month) return;

    setLoading(true);
    setMessage("");
    try {
      await createSalary({
        teacher_username: selectedTeacher,
        amount: parseInt(amount),
        month: month
      });
      setMessage("Salary recorded successfully!");
      fetchData();
    } catch (error) {
      setMessage("Error recording salary.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (salaryId, newStatus) => {
    try {
      await updateSalaryStatus(salaryId, newStatus);
      fetchData();
    } catch (error) {
      console.error("Error updating salary status:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Teacher Salaries Management</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Assign Teacher Salary</h3>
              
              {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-[#2d5a27]/10 text-[#2d5a27]"}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSetSalary} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Teacher</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                  >
                    <option value="">Choose a teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.username}>{t.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Amount ($)</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
                  <input
                    type="month"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#244b1f] transition-colors disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Assign Salary"}
                </button>
              </form>
            </div>

            {/* List Section */}
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Salary Records</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 font-semibold text-gray-600">Teacher</th>
                      <th className="py-4 font-semibold text-gray-600">Month</th>
                      <th className="py-4 font-semibold text-gray-600">Amount</th>
                      <th className="py-4 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-4 text-gray-800 font-medium capitalize">{s.teacher_username}</td>
                        <td className="py-4 text-gray-800">{s.month}</td>
                        <td className="py-4 text-gray-800 font-bold">${s.amount}</td>
                        <td className="py-4">
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer border-none focus:ring-2 focus:ring-[#2d5a27]/20 ${
                              s.status === "paid" ? "bg-[#2d5a27]/10 text-[#2d5a27]" : "bg-red-100 text-red-700"
                            }`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {salaries.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                          No salary records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

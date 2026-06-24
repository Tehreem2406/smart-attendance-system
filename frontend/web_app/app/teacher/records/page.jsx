"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getAssignments, getClassSubmissions, downloadSubmission, checkAssignment } from "../../../src/services/api";

export default function AssignmentRecord() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [selectedAssignmentNo, setSelectedAssignmentNo] = useState("");
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    const loadClasses = async () => {
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
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadData();
    }
  }, [selectedClass]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignData, subData] = await Promise.all([
        getAssignments(selectedClass),
        getClassSubmissions(selectedClass)
      ]);
      setAssignments(assignData || []);
      setSubmissions(subData || []);
    } catch (error) {
      console.error("Error loading records:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentTopic = (id) => {
    const found = assignments.find(a => a.id === id);
    if (!found) return "Unknown Topic";
    const index = assignments.indexOf(found);
    return `Assignment ${found.item_no || index + 1}: ${found.topic}`;
  };

  const handleCheck = async (submissionId) => {
    setCheckingId(submissionId);
    try {
      const result = await checkAssignment(submissionId);
      setCheckResult(result);
      // Update the submissions state to show results in real-time
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...result } : s));
    } catch (error) {
      console.error("Check Error:", error);
      alert("Failed to check assignment metrics.");
    } finally {
      setCheckingId(null);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (!selectedAssignmentNo) return true;
    const found = assignments.find(a => a.id === sub.assignment_id);
    if (!found) return false;
    const itemNo = found.item_no || (assignments.indexOf(found) + 1);
    return String(itemNo) === String(selectedAssignmentNo);
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Assignment Submission Records</h2>

          <div className="bg-white p-8 rounded-xl shadow-md mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Class</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Select a Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assignment No.</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                  value={selectedAssignmentNo}
                  onChange={(e) => setSelectedAssignmentNo(e.target.value)}
                >
                  <option value="">All Assignments</option>
                  {[...new Set(assignments.map((a, i) => a.item_no || i + 1))].sort((a, b) => a - b).map(no => (
                    <option key={no} value={no}>Assignment {no}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Submission Logs</h3>
              <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold">
                {filteredSubmissions.length} Submissions Found
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Student</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Assignment Topic</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Submission Date</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-500 font-medium">Fetching records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-[#2d5a27] font-bold text-xs">
                              {sub.student_username[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800 capitalize">{sub.student_username}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-700 font-medium">{getAssignmentTopic(sub.assignment_id)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-500 text-sm">{new Date(sub.submitted_at).toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => downloadSubmission(sub.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2d5a27]/10 text-[#2d5a27] rounded-lg hover:bg-[#2d5a27]/20 transition-colors font-bold text-xs border border-[#2d5a27]/20"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download PDF
                            </button>
                            <button
                              onClick={() => handleCheck(sub.id)}
                              disabled={checkingId === sub.id}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold text-xs border ${
                                sub.ai_score !== undefined && sub.ai_score !== null
                                  ? "bg-[#2d5a27]/10 text-[#2d5a27] border-[#2d5a27]/20"
                                  : "bg-[#2d5a27]/10 text-[#2d5a27] border-[#2d5a27]/20 hover:bg-[#2d5a27]/20"
                              }`}
                            >
                              {checkingId === sub.id ? (
                                <div className="w-4 h-4 border-2 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {sub.ai_score !== undefined && sub.ai_score !== null ? "Re-Check" : "Check AI"}
                            </button>
                          </div>
                          
                          {sub.ai_score !== undefined && sub.ai_score !== null && (
                            <div className="mt-3 grid grid-cols-3 gap-2 px-2 py-2 bg-gray-50 rounded-lg border border-gray-100 shadow-inner">
                              <div className="text-center">
                                <p className="text-[9px] uppercase font-black text-gray-400">AI Score</p>
                                <p className={`text-xs font-bold ${sub.ai_score > 60 ? "text-red-600" : "text-[#2d5a27]"}`}>
                                  {sub.ai_score}%
                                </p>
                              </div>
                              <div className="text-center border-x border-gray-200">
                                <p className="text-[9px] uppercase font-black text-gray-400">Words</p>
                                <p className="text-xs font-bold text-[#2d5a27]">{sub.word_count}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] uppercase font-black text-gray-400">Pasted</p>
                                <p className={`text-xs font-bold ${sub.paste_count > 5 ? "text-red-600" : "text-[#2d5a27]"}`}>
                                  {sub.paste_count}x
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-gray-500 italic">
                        {selectedClass ? "No matching submissions found." : "Please select a class to view records."}
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

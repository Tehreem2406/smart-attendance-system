"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, createAssignment, getAssignments, getSubmissions, downloadSubmission, checkAssignment } from "../../../src/services/api";

// Helper function to get next item number for assignments
const getNextAssignmentItemNumber = (assignmentsArray) => {
  if (assignmentsArray.length === 0) return 1;
  const itemNos = assignmentsArray.map(a => {
    const no = Number(a.item_no);
    return isNaN(no) ? 0 : no;
  }).filter(no => no > 0);
  if (itemNos.length === 0) return 1;
  const maxItemNo = Math.max(...itemNos);
  return maxItemNo + 1;
};

export default function TeacherAssignments() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [topic, setTopic] = useState("");
  const [itemNo, setItemNo] = useState(1);
  const [totalMarks, setTotalMarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

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
      loadAssignments();
    }
  }, [selectedClass]);

  const loadAssignments = async () => {
    const data = await getAssignments(selectedClass);
    const safeData = Array.isArray(data) ? data : [];
    setAssignments(safeData);
    const nextItemNo = getNextAssignmentItemNumber(safeData);
    setItemNo(nextItemNo);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createAssignment({
        class_id: parseInt(selectedClass),
        topic,
        item_no: parseInt(itemNo),
        total_marks: parseInt(totalMarks),
        due_date: new Date(dueDate).toISOString()
      });
      if (res.id) {
        setMessage("Assignment created successfully!");
        setTopic("");
        setTotalMarks("");
        setDueDate("");
        loadAssignments();
      } else {
        setMessage("Error creating assignment");
      }
    } catch (error) {
      setMessage("Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  const viewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    const data = await getSubmissions(assignment.id);
    setSubmissions(data || []);
  };

  const handleCheckAI = async (submissionId) => {
    setCheckingId(submissionId);
    try {
      const result = await checkAssignment(submissionId);
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, ...result } : s));
    } catch (error) {
      console.error("AI Check Error:", error);
      alert("Failed to perform AI check.");
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Assignment Management</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Create New Assignment</h3>
              {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-[#2d5a27]/10 text-[#2d5a27]"}`}>
                  {message}
                </div>
              )}
              <form onSubmit={handleCreateAssignment} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                  >
                    <option value="">Choose a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter assignment topic"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Number</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-200 cursor-not-allowed text-gray-600"
                    value={itemNo}
                    disabled
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Marks</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    placeholder="Enter total marks"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !selectedClass}
                  className="w-full py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#244b1f] transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Assignment"}
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Assignments List</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 font-semibold text-gray-600">Topic</th>
                      <th className="py-4 font-semibold text-gray-600">Marks</th>
                      <th className="py-4 font-semibold text-gray-600">Due Date</th>
                      <th className="py-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assign, index) => (
                      <tr key={assign.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-800 font-medium">
                          Assignment {assign.item_no || index + 1}: {assign.topic}
                        </td>
                        <td className="py-4 text-gray-800 font-bold">{assign.total_marks}</td>
                        <td className="py-4 text-gray-800 text-sm">
                          {new Date(assign.due_date).toLocaleString()}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => viewSubmissions(assign)}
                            className="text-[#2d5a27] hover:underline font-semibold"
                          >
                            View Submissions
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                          {selectedClass ? "No assignments found for this class." : "Please select a class to view assignments."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {selectedAssignment && (
            <div className="mt-12 bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-[#2d5a27]">
                Submissions for: Assignment {selectedAssignment.item_no || assignments.indexOf(selectedAssignment) + 1}: {selectedAssignment.topic}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 font-semibold text-gray-600">Student Username</th>
                      <th className="py-4 font-semibold text-gray-600">Submitted At</th>
                      <th className="py-4 font-semibold text-gray-600">AI Analysis</th>
                      <th className="py-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-800 font-medium capitalize">{sub.student_username}</td>
                        <td className="py-4 text-gray-800 text-sm">
                          {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td className="py-4">
                          {sub.ai_score !== undefined && sub.ai_score !== null ? (
                            <div className="flex gap-4">
                              <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-400">AI</p>
                                <p className={`text-sm font-bold ${sub.ai_score > 60 ? "text-red-600" : "text-[#2d5a27]"}`}>
                                  {sub.ai_score}%
                                </p>
                              </div>
                              <div className="text-center border-x px-3">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Words</p>
                                <p className="text-sm font-bold text-[#2d5a27]">{sub.word_count}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Pasted</p>
                                <p className={`text-sm font-bold ${sub.paste_count > 5 ? "text-red-600" : "text-[#2d5a27]"}`}>
                                  {sub.paste_count}x
                                </p>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckAI(sub.id)}
                              disabled={checkingId === sub.id}
                              className="text-xs font-bold text-[#2d5a27] bg-[#2d5a27]/10 px-3 py-1 rounded hover:bg-[#2d5a27]/20 transition-colors flex items-center gap-1"
                            >
                              {checkingId === sub.id ? (
                                <div className="w-3 h-3 border-2 border-[#2d5a27] border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                "Check AI"
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => downloadSubmission(sub.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#2d5a27]/10 text-[#2d5a27] rounded-lg hover:bg-[#2d5a27]/20 transition-colors font-bold text-xs"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                          No submissions yet.
                        </td>
                      </tr>
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

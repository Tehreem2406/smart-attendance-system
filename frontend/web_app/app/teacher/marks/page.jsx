"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getClassMarks, saveMark, getEnrollments, deleteMark, getNextItemNumber } from "../../../src/services/api";

export default function MarksRecordPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classEnrollments, setClassEnrollments] = useState([]);
  const [marks, setMarks] = useState([]);
  const [editingMark, setEditingMark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState("");
  const [teacherClasses, setTeacherClasses] = useState([]);

  const [newMark, setNewMark] = useState({
    student_username: "",
    type: "Quiz",
    item_no: 1,
    score: 0,
    total: 10
  });

  // Helper to fetch next item number from API
  const fetchNextItemNo = async (classId, type) => {
    if (!classId) return;
    const nextNo = await getNextItemNumber(classId, type);
    setNewMark(prev => ({
      ...prev,
      item_no: nextNo
    }));
  };

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setTeacherId(username);
      loadInitialData(username);
    }
  }, []);

  async function loadInitialData(username) {
    try {
      const classData = await getClasses();
      const safeData = Array.isArray(classData) ? classData : [];
      const myClasses = username ? safeData.filter(c => c.teacher_username?.toLowerCase() === username.toLowerCase()) : [];
      setTeacherClasses(myClasses);
      if (myClasses.length > 0) {
        setSelectedClassId(String(myClasses[0].id)); // Store as string
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  // Update item number when marks load, class changes, or type changes
  useEffect(() => {
    if (!editingMark && selectedClassId) {
      fetchNextItemNo(selectedClassId, newMark.type);
    }
  }, [selectedClassId, newMark.type, editingMark]);

  async function loadClassData(classId) {
    try {
      const [markData, enrollmentData] = await Promise.all([
        getClassMarks(classId),
        getEnrollments()
      ]);
      setMarks(markData || []);
      const enrolled = Array.isArray(enrollmentData) 
        ? enrollmentData.filter(e => e.class_id === parseInt(classId))
        : [];
      setClassEnrollments(enrolled);
      
      // Update newMark.item_no immediately with fresh data
      if (!editingMark) {
        await fetchNextItemNo(classId, newMark.type);
      }
    } catch (error) {
      console.error("Error loading class data:", error);
    }
  }

  const handleSaveMark = async (e) => {
    e.preventDefault();
    const scoreNum = parseInt(newMark.score);
    const totalNum = parseInt(newMark.total);

    if (scoreNum > totalNum) {
      alert("Obtained marks cannot be greater than total marks.");
      return;
    }

    try {
      // When creating a new mark, don't send item_no so backend calculates it
      const payload = {
        ...newMark,
        class_id: selectedClassId,
        score: scoreNum,
        total: totalNum
      };
      
      // If editing, keep item_no, otherwise omit it
      if (!editingMark) {
        delete payload.item_no;
      }
      
      await saveMark(payload);
      setEditingMark(null);
      // Reload marks first so next item calculation uses latest data
      const [markData, enrollmentData] = await Promise.all([
        getClassMarks(selectedClassId),
        getEnrollments()
      ]);
      setMarks(markData || []);
      const enrolled = Array.isArray(enrollmentData) 
        ? enrollmentData.filter(e => e.class_id === parseInt(selectedClassId))
        : [];
      setClassEnrollments(enrolled);
      // THEN reset form with next item number based on fresh data from API
      await fetchNextItemNo(selectedClassId, "Quiz");
      setNewMark({ student_username: "", type: "Quiz", item_no: 1, score: 0, total: 10 });
    } catch (error) {
      alert("Error saving marks");
    }
  };

  const handleDeleteMark = async (markId) => {
    if (window.confirm("Are you sure you want to delete this mark record?")) {
      try {
        await deleteMark(markId);
        loadClassData(selectedClassId);
      } catch (error) {
        alert("Error deleting mark");
      }
    }
  };

  const startEdit = (mark) => {
    setEditingMark(mark.id);
    setNewMark({
      student_username: mark.student_username,
      type: mark.type,
      item_no: mark.item_no,
      score: mark.score,
      total: mark.total
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#2d5a27]">Marks Record</h2>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm font-bold text-gray-500 uppercase px-2">Select Class:</span>
              <select 
                value={selectedClassId || ""} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-md p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
              >
                {teacherClasses.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* Marks Record Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Assignment & Quiz Marks</h3>
                <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold">
                  {marks.length} Records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Assessment</th>
                      <th className="px-6 py-4">Marks</th>
                      <th className="px-6 py-4">Percentage</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {marks.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold text-[10px]">
                              {m.student_username[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-700">{m.student_username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            m.type === 'Quiz' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {m.type} #{m.item_no}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">
                          {m.score} <span className="text-gray-400 font-normal">/ {m.total}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                            <div 
                              className={`h-full rounded-full ${
                                (m.score/m.total) >= 0.5 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, (m.score/m.total)*100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 mt-1 block">
                            {Math.round((m.score/m.total)*100)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <button 
                              onClick={() => startEdit(m)}
                              className="text-[#2d5a27] hover:text-[#1e3d1a] font-bold text-xs flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteMark(m.id)}
                              className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {marks.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                          No marks recorded for this class yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {editingMark && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-100 w-full max-w-md animate-in zoom-in-95">
                <h3 className="text-xl font-bold mb-6 text-[#2d5a27] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Student Marks
                </h3>
                
                
                <form onSubmit={handleSaveMark} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student</label>
                    <input
                      type="text"
                      value={newMark.student_username}
                      className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg outline-none text-gray-500 font-bold"
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                      <select
                        value={newMark.type}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          if (!editingMark && selectedClassId) {
                            const nextItemNo = await getNextItemNumber(selectedClassId, newType);
                            setNewMark({
                              ...newMark,
                              type: newType,
                              item_no: nextItemNo
                            });
                          } else {
                            setNewMark({
                              ...newMark,
                              type: newType
                            });
                          }
                        }}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                      >
                        <option value="Quiz">Quiz</option>
                        <option value="Assignment">Assignment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Number</label>
                      <input
                        type="number"
                        min="1"
                        value={newMark.item_no}
                        disabled={!editingMark}
                        onChange={(e) => setNewMark({...newMark, item_no: Number(e.target.value)})}
                        className={`w-full p-3 border border-gray-200 rounded-lg outline-none ${!editingMark ? 'bg-gray-200 cursor-not-allowed text-gray-600' : 'bg-gray-50 focus:ring-2 focus:ring-[#2d5a27]/20'}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Obtained</label>
                      <input
                        type="number"
                        min="0"
                        value={newMark.score}
                        onChange={(e) => setNewMark({...newMark, score: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total</label>
                      <input
                        type="number"
                        min="1"
                        value={newMark.total}
                        onChange={(e) => setNewMark({...newMark, total: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex-1 bg-[#2d5a27] text-white py-3 rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md"
                    >
                      Update Marks
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setEditingMark(null);
                        if (selectedClassId) {
                          await fetchNextItemNo(selectedClassId, "Quiz");
                        }
                        setNewMark({ student_username: "", type: "Quiz", item_no: 1, score: 0, total: 10 });
                      }}
                      className="px-6 bg-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

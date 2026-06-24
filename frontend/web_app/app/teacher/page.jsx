"use client";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getClasses, createSession, getActiveSession, addMark, classStudents, endSession, sessionAttendance, getClassMarks } from "../../src/services/api";

// Helper function to get next item number for a given type
const getNextItemNumber = (marksArray, type) => {
  const filteredMarks = marksArray.filter(m => m.type && m.type.toLowerCase() === type.toLowerCase());
  if (filteredMarks.length === 0) return 1;
  const itemNos = filteredMarks.map(m => {
    const no = Number(m.item_no);
    return isNaN(no) ? 0 : no;
  }).filter(no => no > 0);
  if (itemNos.length === 0) return 1;
  const maxItemNo = Math.max(...itemNos);
  return maxItemNo + 1;
};

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [bulkMarks, setBulkMarks] = useState({});
  const [marks, setMarks] = useState([]);
  const [markForm, setMarkForm] = useState({ class_id: 0, type: "assignment", item_no: 1, total: "" });
  const [meetingUrl, setMeetingUrl] = useState("");
  const [showMeetingField, setShowMeetingField] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    async function load() {
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
    load();
  }, []);

  async function handleCreateSession() {
    if (!selectedClass) return;
    const sess = await createSession(selectedClass, meetingUrl);
    setActiveSession({ ...sess, code: typeof sess.code === "string" ? sess.code : String(sess.code || "") });
    const list = await classStudents(selectedClass);
    setStudents(list);
    try {
      const recs = await sessionAttendance(sess.id);
      setAttendanceRecords(Array.isArray(recs) ? recs : []);
    } catch {}
    setShowMeetingField(false);
    setMeetingUrl("");
  }

  async function handleSelectClass(e) {
    const id = parseInt(e.target.value);
    setSelectedClass(id);
    setMarkForm(prev => ({ ...prev, class_id: id }));
    if (id) {
      try {
        setActiveSession(null);
        const sess = await getActiveSession(id);
        setActiveSession(sess);
        const list = await classStudents(id);
        const markData = await getClassMarks(id);
        const safeMarkData = Array.isArray(markData) ? markData : [];
        setMarks(safeMarkData);
        
        // Deduplicate students by username
        const uniqueStudents = [];
        const seen = new Set();
        (list || []).forEach(s => {
          if (!seen.has(s.student_username)) {
            seen.add(s.student_username);
            uniqueStudents.push(s);
          }
        });
        setStudents(uniqueStudents);
        
        // Initialize bulk marks state for all unique students
        const initialMarks = {};
        uniqueStudents.forEach(s => {
          initialMarks[s.student_username] = "";
        });
        setBulkMarks(initialMarks);
        
        // Calculate and set next item number
        const nextItemNo = getNextItemNumber(safeMarkData, markForm.type);
        setMarkForm(prev => ({ ...prev, item_no: nextItemNo }));

        try {
          if (sess && sess.id) {
            const recs = await sessionAttendance(sess.id);
            setAttendanceRecords(Array.isArray(recs) ? recs : []);
          }
        } catch {}
      } catch {}
    } else {
      setActiveSession(null);
      setStudents([]);
      setAttendanceRecords([]);
      setBulkMarks({});
      setMarks([]);
    }
  }

  async function handleAddMark(e) {
    e.preventDefault();
    if (!selectedClass) return;
    const totalNum = parseInt(String(markForm.total), 10);
    const itemNoNum = parseInt(String(markForm.item_no), 10);
    
    if (isNaN(totalNum) || isNaN(itemNoNum)) {
      alert("Please enter valid total marks and item number.");
      return;
    }

    try {
      const savePromises = Object.entries(bulkMarks).map(([username, score]) => {
        const scoreNum = parseInt(String(score), 10);
        if (isNaN(scoreNum)) return null;

        const payload = {
          student_username: username,
          class_id: selectedClass,
          type: markForm.type,
          item_no: itemNoNum,
          score: scoreNum,
          total: totalNum
        };
        return addMark(payload);
      }).filter(p => p !== null);

      if (savePromises.length === 0) {
        alert("Please enter marks for at least one student.");
        return;
      }

      await Promise.all(savePromises);
      alert("Marks added successfully!");
      
      // Refresh marks and calculate next item number
      const freshMarks = await getClassMarks(selectedClass);
      const safeFreshMarks = Array.isArray(freshMarks) ? freshMarks : [];
      setMarks(safeFreshMarks);
      const nextItemNo = getNextItemNumber(safeFreshMarks, markForm.type);
      
      // Reset scores only
      const resetMarks = {};
      students.forEach(s => {
        resetMarks[s.student_username] = "";
      });
      setBulkMarks(resetMarks);
      setMarkForm(prev => ({ ...prev, item_no: nextItemNo }));
    } catch (error) {
      console.error("Error saving bulk marks:", error);
      alert("Error saving marks. Please try again.");
    }
  }

  useEffect(() => {
    let timer;
    async function poll() {
      if (activeSession && activeSession.id) {
        try {
          const recs = await sessionAttendance(activeSession.id);
          setAttendanceRecords(Array.isArray(recs) ? recs : []);
        } catch {}
      }
    }
    if (activeSession && activeSession.id) {
      poll();
      timer = setInterval(poll, 5000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeSession]);
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Teacher Dashboard</h2>

          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Create Live Session</h3>
            <div className="flex gap-4 items-center">
              <select 
                value={selectedClass} 
                onChange={handleSelectClass} 
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
              >
                <option value={0}>Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowMeetingField(true)} 
                className="px-6 py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#244b1f] transition-colors shadow-sm"
              >
                Start Session
              </button>
            </div>
            {showMeetingField && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-100 flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                  placeholder="Enter Zoom meeting URL or ID"
                />
                <button 
                  onClick={handleCreateSession} 
                  className="px-6 py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#1e3d1a] transition-colors shadow-sm"
                >
                  Confirm & Create
                </button>
              </div>
            )}
            {activeSession && activeSession.code && (
              <div className="mt-8 p-6 bg-[#2d5a27]/5 rounded-xl border border-[#2d5a27]/10">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <p className="text-[10px] uppercase font-black text-gray-400 mb-1">Session Code</p>
                      <p className="text-2xl font-black text-[#2d5a27] tracking-widest">{String(activeSession.code)}</p>
                    </div>
                    {activeSession.meeting_url && (
                      <a 
                        href={activeSession.meeting_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-4 py-2 bg-[#2d5a27] text-white rounded-lg font-bold text-sm hover:bg-[#1e3d1a] transition-colors shadow-sm"
                      >
                        Open Meeting
                      </a>
                    )}
                  </div>
                  {activeSession.id && (
                    <button 
                      onClick={async () => { await endSession(selectedClass); setActiveSession(null); setAttendanceRecords([]); }} 
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
                    >
                      End Session
                    </button>
                  )}
                </div>
                
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Live Attendance</h4>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-[#2d5a27] animate-pulse"></span>
                      <span className="text-xs font-bold text-[#2d5a27] uppercase tracking-wider">Active</span>
                      <button 
                        onClick={async () => { const recs = await sessionAttendance(activeSession.id); setAttendanceRecords(Array.isArray(recs) ? recs : []); }} 
                        className="ml-4 px-3 py-1 bg-[#2d5a27] text-white text-[10px] font-bold rounded uppercase hover:bg-[#1e3d1a] transition-colors"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {attendanceRecords.map((a) => (
                      <div key={a.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#2d5a27] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                          {a.student_username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-800 truncate capitalize">{a.student_username}</span>
                          {a.latitude && a.longitude ? (
                            <a 
                              href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#2d5a27] hover:underline font-black flex items-center gap-1"
                            >
                              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              View Location
                            </a>
                          ) : (
                            <span className="text-[9px] text-gray-400 font-bold italic flex items-center gap-1">
                              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              No GPS Signal
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {!attendanceRecords.length && (
                      <div className="col-span-full py-8 text-center text-gray-400 text-sm italic bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                        Waiting for students to join...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">Add Student Marks</h3>
            <form onSubmit={handleAddMark} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select
                    value={selectedClass}
                    onChange={handleSelectClass}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                    required
                  >
                    <option value={0}>Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select
                    value={markForm.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const nextItemNo = getNextItemNumber(marks, newType);
                      setMarkForm({ ...markForm, type: newType, item_no: nextItemNo });
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Item Number</label>
                  <input
                    type="number"
                    value={markForm.item_no}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-200 cursor-not-allowed text-gray-600 outline-none"
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Marks</label>
                  <input
                    type="number"
                    value={markForm.total}
                    onChange={(e) => setMarkForm({ ...markForm, total: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5a27]/20 outline-none"
                    placeholder="Total"
                    required
                  />
                </div>
              </div>

              {selectedClass !== 0 && students.length > 0 && (
                <div className="mt-8 border-t pt-8">
                  <div className="flex items-center justify-between mb-6 px-4">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Student Name</span>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Obtained Marks</span>
                  </div>
                  <div className="space-y-3">
                    {students.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#2d5a27] font-black text-xs group-hover:bg-[#2d5a27] group-hover:text-white transition-colors">
                            {s.student_username[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-700">{s.student_username}</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            max={markForm.total || undefined}
                            value={bulkMarks[s.student_username] || ""}
                            onChange={(e) => setBulkMarks({ ...bulkMarks, [s.student_username]: e.target.value })}
                            className="w-full p-2 text-center bg-white border border-gray-200 rounded-lg font-black text-[#2d5a27] outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27]"
                            placeholder="-"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#244b1f] transition-colors shadow-sm"
                    >
                      Save All Marks
                    </button>
                  </div>
                </div>
              )}

              {selectedClass !== 0 && students.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No students found in this class.
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

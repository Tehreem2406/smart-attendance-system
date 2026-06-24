"use client";
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { listAttendance, listMarks, studentActiveSession, joinSession, getVouchers, getClasses } from "../../src/services/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import jsPDF from "jspdf";
import { toJpeg } from 'html-to-image';

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showVoucher, setShowVoucher] = useState(null);
  const [username] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("username") || "" : ""));
  const voucherRef = useRef(null);

  useEffect(() => {
    async function load() {
      if (username) {
        const att = await listAttendance(username);
        setAttendance(att);
        const mk = await listMarks(username);
        setMarks(mk);
        const cls = await getClasses();
        setClasses(cls);
        const vch = await getVouchers(username);
        setVouchers(vch);
      }
    }
    load();
  }, [username]);

  useEffect(() => {
    let timer;
    async function checkSession() {
      if (!username) return;
      try {
        const sess = await studentActiveSession(username);
        if (sess && sess.id && sess.code) {
          setActiveSession(sess);
        } else {
          setActiveSession(null);
        }
      } catch {
        setActiveSession(null);
      }
    }
    
    if (username) {
      checkSession();
      timer = setInterval(checkSession, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [username]);

  const downloadVoucherPDF = async (studentUsername) => {
    const element = voucherRef.current;
    if (!element) return;
    
    try {
      // Increase timeout to ensure full render
      await new Promise(resolve => setTimeout(resolve, 500));

      const imgData = await toJpeg(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      if (!imgData || imgData.length < 1000) {
        throw new Error("Image capture failed or produced a blank image.");
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = element.scrollWidth;
      const canvasHeight = element.scrollHeight;
      const ratio = canvasHeight / canvasWidth;
      const width = pdfWidth - 20;
      const height = width * ratio;
      pdf.addImage(imgData, "JPEG", 10, 10, width, height);
      pdf.save(`Voucher_${studentUsername}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    }
  };

  async function handleSelectClass() {}

  async function handleJoinSession() {
    if (!activeSession || !username) return;

    let latitude = null;
    let longitude = null;

    // Capture Geo-location
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.warn("Geolocation error:", error);
      }
    }

    const resp = await joinSession(activeSession.code, username, latitude, longitude);
    if (resp && resp.meeting_url) {
      try {
        window.open(resp.meeting_url, "_blank");
      } catch {}
    }
    const att = await listAttendance(username);
    setAttendance(att);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Student" />
      <div className="flex flex-1">
        <Sidebar role="Student" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Student Dashboard</h2>

          {/* Live Session Status */}
          <div className={`rounded-xl p-8 mb-8 border-l-4 transition-all duration-700 ${
            activeSession 
              ? "bg-white border-[#2d5a27] shadow-2xl scale-[1.01] ring-4 ring-[#2d5a27]/5" 
              : "bg-[#f9fafb] border-[#8ca38a]/30 shadow-sm"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {activeSession && (
                  <div className="p-4 rounded-full bg-[#2d5a27]/10 text-[#2d5a27] transition-all duration-700">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className={`text-xl font-black transition-all duration-700 ${
                      activeSession ? "text-[#2d5a27] uppercase tracking-tight" : "text-gray-500 font-bold"
                    }`}>
                      {activeSession ? "LIVE SESSION IS ACTIVE!" : "Live Session is Active!"}
                    </h3>
                    {activeSession && (
                      <span className="flex h-3 w-3 rounded-full bg-red-500 shadow-sm"></span>
                    )}
                  </div>
                  <p className={`text-sm font-medium transition-all duration-700 ${
                    activeSession ? "text-gray-600" : "text-gray-400/80"
                  }`}>
                    Your teacher has started a live attendance session.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleJoinSession} 
                disabled={!activeSession}
                className={`px-10 py-4 rounded-xl font-black transition-all duration-500 transform active:scale-95 ${
                  activeSession 
                    ? "bg-[#2d5a27] text-white hover:bg-[#1e3a1a] shadow-xl hover:shadow-[#2d5a27]/30 uppercase tracking-widest text-sm" 
                    : "bg-[#8ca38a] text-white/90 cursor-not-allowed shadow-none"
                }`}
              >
                {activeSession ? "JOIN NOW" : "Join Now"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vouchers Section */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-2">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">My Fee Vouchers</h3>
                <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold">
                  {vouchers.length} Vouchers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Program/Class</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase">Status/Fee</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-800">
                          {classes.find(c => c.id === v.class_id)?.name || `Class ${v.class_id}`}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            v.status === "paid" ? "bg-[#2d5a27]/10 text-[#2d5a27]" : "bg-red-100 text-red-700"
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setShowVoucher(v)}
                            className="text-[#2d5a27] hover:underline font-bold text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {vouchers.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-gray-400 italic">
                          No fee vouchers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Attendance History</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {attendance.map((a) => (
                    <li key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#2d5a27]"></div>
                        <span className="font-semibold text-gray-700">{new Date(a.timestamp).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                    </li>
                  ))}
                  {!attendance.length && (
                    <li className="text-center py-8 text-gray-400 italic">No attendance records yet.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Academic Performance</h3>
              </div>
              <div className="p-6">
                <div className="h-64 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marks.map((m, idx) => ({ name: `${m.type} ${m.item_no ?? (idx+1)}`, percent: m.total ? Math.round((m.score / m.total) * 100) : m.score, type: m.type }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        cursor={{fill: '#f9fafb'}}
                        formatter={(value) => [`${value}%`, 'Score']} 
                      />
                      <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                        {marks.map((m, idx) => (
                          <Cell key={`cell-${idx}`} fill={m.type === 'assignment' ? '#2d5a27' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-3 font-bold text-gray-400 uppercase text-[10px]">Type</th>
                        <th className="py-3 font-bold text-gray-400 uppercase text-[10px]">Score</th>
                        <th className="py-3 font-bold text-gray-400 uppercase text-[10px]">Total</th>
                        <th className="py-3 font-bold text-gray-400 uppercase text-[10px] text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {marks.map((m, idx) => (
                        <tr key={idx}>
                          <td className="py-3 capitalize font-bold text-gray-700">{m.type} {m.item_no}</td>
                          <td className="py-3 font-medium text-gray-600">{m.score}</td>
                          <td className="py-3 font-medium text-gray-600">{m.total ?? '-'}</td>
                          <td className="py-3 text-right">
                            <span className="font-black text-[#2d5a27]">
                              {m.total ? Math.round((m.score / m.total) * 100) + '%' : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Voucher Preview Modal */}
      {showVoucher && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-2xl max-w-2xl w-full my-8 overflow-hidden relative border border-gray-300">
            <button
              onClick={() => setShowVoucher(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black z-20 print:hidden bg-white/80 rounded-full p-1 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-8">
              {/* Download Button moved to top for better accessibility */}
              <div className="flex justify-end mb-6 print:hidden">
                <button
                  onClick={() => downloadVoucherPDF(showVoucher.student_username)}
                  className="px-6 py-2 bg-[#2d5a27] text-white rounded font-bold hover:bg-[#1e3a1a] transition-colors flex items-center gap-2 shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download (PDF)
                </button>
              </div>

              <div ref={voucherRef} className="bg-white p-10 border-2 border-black" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-4 mb-6">
                  <div className="flex justify-center mb-2">
                    <img src="/images/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                  </div>
                  <h3 className="text-2xl font-bold uppercase tracking-widest" style={{ color: '#000000' }}>Fee Challan</h3>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>EDUSYNC MANAGEMENT SYSTEM</p>
                </div>

                {/* Content */}
                <div className="space-y-6" style={{ color: '#000000' }}>
                  <div className="flex items-center gap-4 border-b border-gray-400 pb-2">
                    <span className="font-bold text-sm uppercase min-w-[120px]">Challan No:</span>
                    <span className="font-mono text-sm underline decoration-dotted font-bold">{showVoucher.challan_no}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 border-b border-gray-400 pb-2">
                    <span className="font-bold text-sm uppercase min-w-[120px]">Name:</span>
                    <span className="font-bold text-sm capitalize underline decoration-dotted">{showVoucher.student_username}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-4 border-b border-gray-400 pb-2">
                      <span className="font-bold text-sm uppercase min-w-[80px]">Month:</span>
                      <span className="font-bold text-sm underline decoration-dotted">{showVoucher.month}</span>
                    </div>
                    <div className="flex items-center gap-4 border-b border-gray-400 pb-2">
                      <span className="font-bold text-sm uppercase min-w-[80px]">Program:</span>
                      <span className="font-bold text-sm underline decoration-dotted">
                        {classes.find(c => c.id === showVoucher.class_id)?.name}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4 pt-4 border-t-2 border-black">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Tuition Fee (Total):</span>
                      <span className="font-bold">${showVoucher.base_amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm italic">
                      <span>Discount Applied:</span>
                      <span className="font-bold">-${showVoucher.discount_amount}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-black">
                      <span className="font-black text-lg uppercase">Total Payable:</span>
                      <span className="font-black text-2xl underline decoration-double">${showVoucher.total_amount}</span>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-400">
                    <div>
                      <p className="text-xs font-bold uppercase mb-1">Due Date:</p>
                      <p className="text-sm font-black underline">{showVoucher.due_date}</p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block border-2 border-black px-4 py-1 font-black text-sm uppercase">
                        {showVoucher.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 flex justify-between items-end" style={{ color: '#000000' }}>
                  <div className="text-center">
                    <div className="w-32 border-b border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase">Cashier Signature</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-black mb-1"></div>
                    <p className="text-[10px] font-bold uppercase">Admin Signature</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-4 print:hidden">
                <button
                  onClick={() => downloadVoucherPDF(showVoucher.student_username)}
                  className="px-8 py-3 bg-[#2d5a27] text-white rounded font-bold hover:bg-[#1e3a1a] transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download (PDF)
                </button>
                <button
                  onClick={() => setShowVoucher(null)}
                  className="px-8 py-3 bg-gray-200 text-black rounded font-bold hover:bg-gray-300 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

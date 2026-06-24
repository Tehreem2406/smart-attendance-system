"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, createFeeStructure, getFeeStructures, getVouchers, updateVoucherStatus } from "../../../src/services/api";
import jsPDF from "jspdf";
import { toJpeg } from 'html-to-image';

export default function FeeStructures() {
  const [classes, setClasses] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [month, setMonth] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showVoucher, setShowVoucher] = useState(null);
  const voucherRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const classesData = await getClasses();
      const feeData = await getFeeStructures();
      setClasses(Array.isArray(classesData) ? classesData : []);
      setFeeStructures(Array.isArray(feeData) ? feeData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchVouchers();
    } else {
      setVouchers([]);
    }
  }, [selectedClass]);

  const fetchVouchers = async () => {
    try {
      const vData = await getVouchers();
      const filtered = vData.filter(v => v.class_id === parseInt(selectedClass));
      setVouchers(filtered);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const handleSetFee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createFeeStructure({
        class_id: parseInt(selectedClass),
        fee_amount: parseFloat(feeAmount),
        discount_percentage: parseInt(discount),
        month: month,
        due_date: dueDate
      });
      setMessage("Fee structure created and vouchers generated successfully!");
      fetchData();
      fetchVouchers();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (voucherId, newStatus) => {
    try {
      await updateVoucherStatus(voucherId, newStatus);
      fetchVouchers();
    } catch (error) {
      console.error("Error updating voucher status:", error);
    }
  };

  const downloadVoucherPDF = async (studentUsername) => {
    const element = voucherRef.current;
    if (!element) {
      alert("Voucher element not found.");
      return;
    }
    
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
      
      const width = pdfWidth - 20; // 10mm margins
      const height = width * ratio;
      
      pdf.addImage(imgData, "JPEG", 10, 10, width, height);
      pdf.save(`Challan_${studentUsername}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Fee Management</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Generate Class Vouchers</h3>
              {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-[#2d5a27]/10 text-[#2d5a27]"}`}>
                  {message}
                </div>
              )}
              <form onSubmit={handleSetFee} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Program (Class)</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Fee ($)</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="Enter fee amount"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 40, 50].map(val => (
                        <option key={val} value={val}>{val}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                    <input
                      type="month"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2d5a27] text-white rounded-lg font-bold hover:bg-[#244b1f] transition-colors disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Vouchers"}
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Fee Structures</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 font-semibold text-gray-600">Program</th>
                      <th className="py-4 font-semibold text-gray-600">Fee</th>
                      <th className="py-4 font-semibold text-gray-600">Discount</th>
                      <th className="py-4 font-semibold text-gray-600">Month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeStructures.map((fs) => {
                      const cls = classes.find(c => c.id === fs.class_id);
                      return (
                        <tr key={fs.id} className="border-b last:border-0">
                          <td className="py-4 text-gray-800 font-medium">{cls ? cls.name : `Class ${fs.class_id}`}</td>
                          <td className="py-4 text-gray-800 font-bold">${fs.fee_amount}</td>
                          <td className="py-4 text-gray-800">{fs.discount_percentage}%</td>
                          <td className="py-4 text-gray-800 text-sm">{fs.month}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {selectedClass && (
            <div className="mt-12 bg-white p-8 rounded-xl shadow-md">
              <h3 className="text-2xl font-bold mb-6 text-[#2d5a27]">
                Student Vouchers for {classes.find(c => c.id === parseInt(selectedClass))?.name}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 font-semibold text-gray-600">Challan No</th>
                      <th className="py-4 font-semibold text-gray-600">Name</th>
                      <th className="py-4 font-semibold text-gray-600">Total Amount</th>
                      <th className="py-4 font-semibold text-gray-600">Status</th>
                      <th className="py-4 font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr key={v.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-gray-800 font-mono text-xs">{v.challan_no}</td>
                        <td className="py-4 text-gray-800 font-medium capitalize">{v.student_username}</td>
                        <td className="py-4 text-gray-800 font-bold">${v.total_amount}</td>
                        <td className="py-4">
                          <select
                            value={v.status}
                            onChange={(e) => handleStatusChange(v.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer border-none focus:ring-2 focus:ring-[#2d5a27]/20 ${
                              v.status === "paid" ? "bg-[#2d5a27]/10 text-[#2d5a27]" : "bg-red-100 text-red-700"
                            }`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td className="py-4">
                          <button onClick={() => setShowVoucher(v)} className="text-[#2d5a27] hover:underline font-semibold">
                            View & Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showVoucher && (
            <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded shadow-2xl max-w-2xl w-full my-8 overflow-hidden relative border border-gray-300">
                <button onClick={() => setShowVoucher(null)} className="absolute top-4 right-4 text-gray-500 hover:text-black z-20 bg-white/80 rounded-full p-1 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="p-8">
                  <div className="flex justify-end mb-6">
                    <button onClick={() => downloadVoucherPDF(showVoucher.student_username)} className="px-6 py-2 bg-[#2d5a27] text-white rounded font-bold hover:bg-[#244b1f] transition-colors flex items-center gap-2 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download (PDF)
                    </button>
                  </div>
                  <div ref={voucherRef} className="bg-white p-10 border-2 border-black" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                      <div className="flex justify-center mb-2">
                        <img src="/images/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                      </div>
                      <h3 className="text-2xl font-bold uppercase tracking-widest" style={{ color: '#000000' }}>Fee Challan</h3>
                      <p className="text-sm font-semibold mt-1" style={{ color: '#000000' }}>EDUSYNC MANAGEMENT SYSTEM</p>
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

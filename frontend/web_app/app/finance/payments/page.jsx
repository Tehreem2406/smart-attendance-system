"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getVouchers, updateVoucherStatus } from "../../../src/services/api";
import jsPDF from "jspdf";
import { toJpeg } from 'html-to-image';

export default function StudentPayments() {
  const [vouchers, setVouchers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showVoucher, setShowVoucher] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");
  const voucherRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const vData = await getVouchers();
      const cData = await getClasses();
      setVouchers(Array.isArray(vData) ? vData : []);
      setClasses(Array.isArray(cData) ? cData : []);
    } catch (error) {
      console.error("Error fetching payments data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVouchers = selectedClass === "all" 
    ? vouchers 
    : vouchers.filter(v => v.class_id.toString() === selectedClass);

  const handleStatusChange = async (voucherId, newStatus) => {
    try {
      await updateVoucherStatus(voucherId, newStatus);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error updating voucher status:", error);
    }
  };

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
      const errorMsg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
      alert(`Failed to generate PDF: ${errorMsg}`);
    }
  };

  const downloadAllVouchersPDF = async () => {
    if (!filteredVouchers || filteredVouchers.length === 0) {
      alert("No vouchers available for this class.");
      return;
    }

    setDownloadingAll(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let pagesAdded = 0;
      
      // Wait a bit longer initially to ensure hidden container is mounted
      await new Promise(resolve => setTimeout(resolve, 1000));

      for (let i = 0; i < filteredVouchers.length; i++) {
        const voucher = filteredVouchers[i];
        const elementId = `voucher-to-print-${voucher.id}`;
        const element = document.getElementById(elementId);
        
        if (!element) {
          console.error(`Voucher element NOT FOUND: ${elementId} for student ${voucher.student_username}`);
          continue;
        }

        // Individual element wait
        await new Promise(resolve => setTimeout(resolve, 500));

        let imgData;
        try {
            imgData = await toJpeg(element, {
              quality: 0.85,
              backgroundColor: '#ffffff',
              cacheBust: true,
              pixelRatio: 1.5, // Balanced quality/memory
            });
          } catch (err) {
            console.error(`Capture error for ${voucher.student_username}:`, err);
            continue;
          }

        if (!imgData || imgData.length < 500) {
          console.warn(`Captured image too small for ${voucher.student_username}`);
          continue;
        }

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = element.scrollWidth || 800; 
        const canvasHeight = element.scrollHeight || 1100; 
        const ratio = canvasHeight / canvasWidth;
        
        const width = pdfWidth - 20;
        const height = width * ratio;

        if (pagesAdded > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, "JPEG", 10, 10, width, height);
        pagesAdded++;
      }

      if (pagesAdded === 0) {
        alert("System was unable to render the vouchers for download. Please try again in a few moments or refresh the page.");
      } else {
        const className = selectedClass === "all" ? "All" : (classes.find(c => c.id.toString() === selectedClass)?.name || selectedClass);
        pdf.save(`Vouchers_${className}_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Batch PDF Error:", error);
      alert("An error occurred while generating the PDF. Please check your connection and try again.");
    } finally {
      setDownloadingAll(false);
    }
  };

  const VoucherContent = ({ voucher, isModal = false }) => {
    const clsName = classes.find(c => c.id === voucher.class_id)?.name;
    return (
      <div 
        id={!isModal ? `voucher-to-print-${voucher.id}` : undefined}
        ref={isModal ? voucherRef : undefined}
        style={{ 
          backgroundColor: '#ffffff', 
          color: '#000000', 
          border: '2px solid #000000', 
          fontFamily: 'sans-serif',
          width: '600px', // Consistent width for better JPEG capture
          padding: '40px',
          margin: isModal ? '0' : '20px auto',
          visibility: 'visible',
          display: 'block'
        }}
      >
        {/* Header */}
        <div className="text-center pb-4 mb-6" style={{ borderBottom: '2px solid #000000' }}>
          <div className="flex justify-center mb-2">
            <img src="/images/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
          </div>
          <h3 className="text-2xl font-bold uppercase tracking-widest" style={{ color: '#000000', margin: '0' }}>Fee Challan</h3>
          <p className="text-sm font-semibold mt-1" style={{ color: '#000000', margin: '4px 0 0 0' }}>EDUSYNC MANAGEMENT SYSTEM</p>
        </div>

        {/* Content */}
        <div className="space-y-6" style={{ color: '#000000' }}>
          <div className="flex items-center gap-4 pb-2" style={{ borderBottom: '1px solid #cccccc' }}>
            <span className="font-bold text-sm uppercase min-w-[120px]" style={{ color: '#000000' }}>Challan No:</span>
            <span className="font-mono text-sm underline decoration-dotted font-bold" style={{ color: '#000000' }}>{voucher.challan_no}</span>
          </div>
          
          <div className="flex items-center gap-4 pb-2" style={{ borderBottom: '1px solid #cccccc' }}>
            <span className="font-bold text-sm uppercase min-w-[120px]" style={{ color: '#000000' }}>Name:</span>
            <span className="font-bold text-sm capitalize underline decoration-dotted" style={{ color: '#000000' }}>{voucher.student_username}</span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center gap-4 pb-2" style={{ borderBottom: '1px solid #cccccc' }}>
              <span className="font-bold text-sm uppercase min-w-[80px]" style={{ color: '#000000' }}>Month:</span>
              <span className="font-bold text-sm underline decoration-dotted" style={{ color: '#000000' }}>{voucher.month}</span>
            </div>
            <div className="flex items-center gap-4 pb-2" style={{ borderBottom: '1px solid #cccccc' }}>
              <span className="font-bold text-sm uppercase min-w-[80px]" style={{ color: '#000000' }}>Program:</span>
              <span className="font-bold text-sm underline decoration-dotted" style={{ color: '#000000' }}>
                {clsName}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-4 pt-4" style={{ borderTop: '2px solid #000000' }}>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium" style={{ color: '#000000' }}>Tuition Fee (Total):</span>
              <span className="font-bold" style={{ color: '#000000' }}>${voucher.base_amount}</span>
            </div>
            <div className="flex justify-between items-center text-sm italic">
              <span style={{ color: '#000000' }}>Discount Applied:</span>
              <span className="font-bold" style={{ color: '#000000' }}>-${voucher.discount_amount}</span>
            </div>
            <div className="flex justify-between items-center pt-2" style={{ borderTop: '2px solid #000000' }}>
              <span className="font-black text-lg uppercase" style={{ color: '#000000' }}>Total Payable:</span>
              <span className="font-black text-2xl underline decoration-double" style={{ color: '#000000' }}>${voucher.total_amount}</span>
            </div>
          </div>

          <div className="mt-10 flex justify-between items-center pt-6" style={{ borderTop: '1px solid #cccccc' }}>
            <div>
              <p className="text-xs font-bold uppercase mb-1" style={{ color: '#000000', margin: '0 0 4px 0' }}>Due Date:</p>
              <p className="text-sm font-black underline" style={{ color: '#000000', margin: '0' }}>{voucher.due_date}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-1 font-black text-sm uppercase" style={{ border: '2px solid #000000', color: '#000000' }}>
                {voucher.status}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 flex justify-between items-end" style={{ color: '#000000' }}>
          <div className="text-center">
            <div className="w-32 mb-1" style={{ borderBottom: '1px solid #000000' }}></div>
            <p className="text-[10px] font-bold uppercase" style={{ color: '#000000', margin: '0' }}>Cashier Signature</p>
          </div>
          <div className="text-center">
            <div className="w-32 mb-1" style={{ borderBottom: '1px solid #000000' }}></div>
            <p className="text-[10px] font-bold uppercase" style={{ color: '#000000', margin: '0' }}>Admin Signature</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#2d5a27]">Student Payments</h2>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-white border border-[#2d5a27] text-[#2d5a27] rounded hover:bg-[#2d5a27] hover:text-white transition-colors text-sm font-bold"
            >
              Refresh Data
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">All Student Vouchers</h3>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-6">
                {filteredVouchers.length > 0 && (
                  <button
                    onClick={downloadAllVouchersPDF}
                    disabled={downloadingAll}
                    className="px-4 py-2 bg-[#2d5a27] text-white rounded text-xs font-bold hover:bg-[#244b1f] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {downloadingAll ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download {filteredVouchers.length} {filteredVouchers.length === 1 ? 'Voucher' : 'Vouchers'} (PDF)
                      </>
                    )}
                  </button>
                )}
                <div className="flex gap-4">
                  <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 bg-[#2d5a27] rounded-full"></span> Paid</span>
                  <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Unpaid</span>
                </div>
              </div>
            </div>

            {/* Container for all filtered vouchers to be captured in PDF - Hidden but rendered */}
            <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', pointerEvents: 'none' }}>
              {filteredVouchers.map(v => (
                <VoucherContent key={v.id} voucher={v} />
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold border-b border-gray-100">
                    <th className="px-6 py-4">Challan No</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Program</th>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{v.challan_no}</td>
                      <td className="px-6 py-4 font-bold text-gray-800 capitalize">{v.student_username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {classes.find(c => c.id === v.class_id)?.name || `Class ${v.class_id}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{v.month}</td>
                      <td className="px-6 py-4 font-black text-[#2d5a27]">${v.total_amount}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setShowVoucher(v)}
                          className="text-[#2d5a27] hover:underline font-bold text-sm"
                        >
                          View & Download
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vouchers.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-400 italic">
                        No payment records found. Generate vouchers first in Fee Structures.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                        Loading payment data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  <div className="flex justify-end mb-6 print:hidden">
                    <button
                      onClick={() => downloadVoucherPDF(showVoucher.student_username)}
                      className="px-6 py-2 bg-[#2d5a27] text-white rounded font-bold hover:bg-[#244b1f] transition-colors flex items-center gap-2 shadow-md"
                    >
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
                      className="px-8 py-3 bg-[#2d5a27] text-white rounded font-bold hover:bg-[#244b1f] transition-colors flex items-center gap-2"
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
        </main>
      </div>
    </div>
  );
}

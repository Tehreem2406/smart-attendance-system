"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import DashboardCard from "../../components/Dashboardcard";
import { getVouchers, getSalaries, getClasses } from "../../../src/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

const COLORS = ["#2d5a27", "#8b2c28", "#caa428", "#2f4f55"];

export default function FinancialReports() {
  const [vouchers, setVouchers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vData, sData, cData] = await Promise.all([
          getVouchers(),
          getSalaries(),
          getClasses()
        ]);
        setVouchers(vData || []);
        setSalaries(sData || []);
        setClasses(cData || []);
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. Summary Statistics
  const totalRevenue = vouchers.reduce((acc, v) => acc + (v.status === "paid" ? v.total_amount : 0), 0);
  const pendingFees = vouchers.reduce((acc, v) => acc + (v.status === "unpaid" ? v.total_amount : 0), 0);
  const totalSalaries = salaries.reduce((acc, s) => acc + s.amount, 0);
  const netIncome = totalRevenue - totalSalaries;

  // 2. Collection vs Pending (Pie Chart)
  const collectionData = [
    { name: "Collected", value: totalRevenue },
    { name: "Pending", value: pendingFees }
  ];

  // 3. Monthly Revenue Trend (Line Chart)
  const monthlyDataMap = vouchers.reduce((acc, v) => {
    if (v.status === "paid") {
      const month = v.month || "Unknown";
      acc[month] = (acc[month] || 0) + v.total_amount;
    }
    return acc;
  }, {});
  const monthlyTrendData = Object.keys(monthlyDataMap).map(month => ({
    name: month,
    revenue: monthlyDataMap[month]
  })).sort((a, b) => a.name.localeCompare(b.name));

  // 4. Revenue by Class (Bar Chart)
  const classRevenueMap = vouchers.reduce((acc, v) => {
    if (v.status === "paid") {
      const cls = classes.find(c => c.id === v.class_id);
      const className = cls ? cls.name : `Class ${v.class_id}`;
      acc[className] = (acc[className] || 0) + v.total_amount;
    }
    return acc;
  }, {});
  const classRevenueData = Object.keys(classRevenueMap).map(name => ({
    name,
    amount: classRevenueMap[name]
  }));

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar role="Finance" />
        <div className="flex flex-1">
          <Sidebar role="Finance" />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-xl font-bold text-[#2d5a27]">Loading Reports...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Financial Reports</h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard title="Total Collected" count={`$${totalRevenue.toLocaleString()}`} className="text-[#2d5a27]" />
            <DashboardCard title="Total Pending" count={`$${pendingFees.toLocaleString()}`} className="text-red-600" />
            <DashboardCard title="Total Expenses" count={`$${totalSalaries.toLocaleString()}`} className="text-gray-800" />
            <DashboardCard 
              title="Net Income" 
              count={`$${netIncome.toLocaleString()}`} 
              className={netIncome >= 0 ? "text-[#2d5a27]" : "text-red-600"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Monthly Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Revenue Trend (Monthly)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" padding={{ left: 10, right: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#2d5a27" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection vs Pending Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Fee Collection Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={collectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {collectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class-wise Revenue Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Revenue by Class</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classRevenueData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" padding={{ left: 10, right: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#2d5a27" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Stats Table */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Financial Summary by Class</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm">
                      <th className="py-3 font-semibold text-gray-600">Class Name</th>
                      <th className="py-3 font-semibold text-gray-600 text-right">Paid Amount</th>
                      <th className="py-3 font-semibold text-gray-600 text-right">Unpaid Amount</th>
                      <th className="py-3 font-semibold text-gray-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {classes.map((cls) => {
                      const classVouchers = vouchers.filter(v => v.class_id === cls.id);
                      const paid = classVouchers.filter(v => v.status === "paid").reduce((acc, v) => acc + v.total_amount, 0);
                      const unpaid = classVouchers.filter(v => v.status === "unpaid").reduce((acc, v) => acc + v.total_amount, 0);
                      const total = paid + unpaid;
                      if (total === 0) return null;
                      return (
                        <tr key={cls.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-3 text-gray-800 font-medium">{cls.name}</td>
                          <td className="py-3 text-[#2d5a27] font-bold text-right">${paid.toLocaleString()}</td>
                          <td className="py-3 text-red-600 font-bold text-right">${unpaid.toLocaleString()}</td>
                          <td className="py-3 text-gray-800 font-bold text-right">${total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
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

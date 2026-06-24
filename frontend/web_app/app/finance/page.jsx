"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DashboardCard from "../components/Dashboardcard";
import ActionBox from "../components/ActionBox";
import { getFinanceStats } from "../../src/services/api";

export default function FinanceDashboard() {
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_fees: 0,
    paid_students: 0,
    late_payments: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getFinanceStats();
        if (data && !data.error) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch finance stats:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Finance Overview</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard title="Total Revenue" count={`$${stats.total_revenue.toLocaleString()}`} className="border-l-4 border-[#2d5a27] text-gray-800 pl-4 ml-2" />
            <DashboardCard title="Pending Fees" count={`$${stats.pending_fees.toLocaleString()}`} className="border-l-4 border-[#2d5a27] text-gray-800 pl-4 ml-2" />
            <DashboardCard title="Paid Students" count={stats.paid_students} className="border-l-4 border-[#2d5a27] text-gray-800 pl-4 ml-2" />
            <DashboardCard title="Late Payments" count={stats.late_payments} className="border-l-4 border-[#2d5a27] text-gray-800 pl-4 ml-2" />
          </div>

          {/* Quick Actions */}
          <h3 className="text-2xl font-bold mb-6 text-[#2d5a27]">Financial Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionBox title="Fee Structures" link="/finance/fees" className="hover:border-[#2d5a27]" />
            <ActionBox title="Teacher Salaries" link="/finance/salaries" className="hover:border-[#2d5a27]" />
            <ActionBox title="Student Payments" link="/finance/payments" className="hover:border-[#2d5a27]" />
            <ActionBox title="Financial Reports" link="/finance/reports" className="hover:border-[#2d5a27]" />
          </div>
        </main>
      </div>
    </div>
  );
}

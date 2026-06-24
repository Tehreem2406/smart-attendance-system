"use client";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import {
  getLedger,
  getLedgerStats,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from "../../../src/services/api";

// Define more specific categories
const CATEGORIES = {
  fee_payment: { label: "Fee Payment", color: "bg-green-100 text-green-800", isExpense: false },
  salary_payment: { label: "Salary Payment", color: "bg-red-100 text-red-800", isExpense: true },
  office_supplies: { label: "Office Supplies", color: "bg-blue-100 text-blue-800", isExpense: true },
  utilities: { label: "Utilities (Electricity/Water)", color: "bg-purple-100 text-purple-800", isExpense: true },
  maintenance: { label: "Maintenance", color: "bg-orange-100 text-orange-800", isExpense: true },
  educational_materials: { label: "Educational Materials", color: "bg-cyan-100 text-cyan-800", isExpense: true },
  transportation: { label: "Transportation", color: "bg-yellow-100 text-yellow-800", isExpense: true },
  discount: { label: "Discount", color: "bg-pink-100 text-pink-800", isExpense: true },
  other: { label: "Other", color: "bg-gray-100 text-gray-800", isExpense: true }
};

export default function LedgerPage() {
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState({
    total_debit: 0,
    total_credit: 0,
    balance: 0
  });
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [budgetMonth, setBudgetMonth] = useState(new Date().getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    type: "other",
    description: "",
    debit: 0,
    credit: 0,
    related_user: "",
    attachment_url: ""
  });
  const [budgetFormData, setBudgetFormData] = useState({
    category: "office_supplies",
    limit_amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  async function fetchData() {
    const [ledgerData, statsData, budgetsData] = await Promise.all([
      getLedger(filterUser || null, filterType || null),
      getLedgerStats(),
      getBudgets(budgetMonth, budgetYear)
    ]);
    let filtered = Array.isArray(ledgerData) ? ledgerData : [];
    
    // Apply date range filter
    if (filterStartDate) {
      const start = new Date(filterStartDate);
      filtered = filtered.filter((e) => new Date(e.date) >= start);
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate);
      filtered = filtered.filter((e) => new Date(e.date) <= end);
    }
    
    // Sort by date ascending for running balance
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setLedger(filtered);
    if (statsData && !statsData.error) {
      setStats(statsData);
    }
    setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
  }

  useEffect(() => {
    fetchData();
  }, [filterType, filterUser, filterStartDate, filterEndDate, budgetMonth, budgetYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateLedgerEntry(editingEntry.id, formData);
      } else {
        await createLedgerEntry(formData);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error saving entry!");
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { limit_amount: budgetFormData.limit_amount });
      } else {
        await createBudget(budgetFormData);
      }
      resetBudgetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error saving budget!");
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      description: entry.description,
      debit: entry.debit,
      credit: entry.credit,
      related_user: entry.related_user || "",
      attachment_url: entry.attachment_url || ""
    });
    setShowForm(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetFormData({
      category: budget.category,
      limit_amount: budget.limit_amount,
      month: budget.month,
      year: budget.year
    });
    setShowBudgetForm(true);
  };

  const handleDelete = async (entryId) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteLedgerEntry(entryId);
        fetchData();
      } catch (error) {
        console.error(error);
        alert("Error deleting entry!");
      }
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      try {
        await deleteBudget(budgetId);
        fetchData();
      } catch (error) {
        console.error(error);
        alert("Error deleting budget!");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      type: "other",
      description: "",
      debit: 0,
      credit: 0,
      related_user: "",
      attachment_url: ""
    });
  };

  const resetBudgetForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
    setBudgetFormData({
      category: "office_supplies",
      limit_amount: 0,
      month: budgetMonth,
      year: budgetYear
    });
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Description", "Related User", "Debit", "Credit", "Running Balance"];
    let balance = 0;
    const rows = ledger.map((entry) => {
      balance += entry.credit - entry.debit;
      return [
        new Date(entry.date).toLocaleDateString(),
        CATEGORIES[entry.type]?.label || entry.type,
        entry.description,
        entry.related_user || "-",
        entry.debit,
        entry.credit,
        balance
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Calculate running balance
  const ledgerWithBalance = () => {
    let balance = 0;
    return ledger.map((entry) => {
      balance += entry.credit - entry.debit;
      return { ...entry, runningBalance: balance };
    });
  };

  // Get progress bar color
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Finance" />

      <div className="flex flex-1">
        <Sidebar role="Finance" />

        <main className="flex-1 p-8">
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#2d5a27]">Financial Ledger</h2>
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-[#2d5a27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#244b1f] transition-colors"
              >
                + Add Entry
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h4 className="text-sm text-gray-500 font-semibold uppercase mb-2">Total Debit</h4>
              <p className="text-2xl font-bold text-red-600">${stats.total_debit.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h4 className="text-sm text-gray-500 font-semibold uppercase mb-2">Total Credit</h4>
              <p className="text-2xl font-bold text-green-600">${stats.total_credit.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <h4 className="text-sm text-gray-500 font-semibold uppercase mb-2">Net Balance</h4>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-[#2d5a27]" : "text-red-600"}`}>
                ${stats.balance.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Budget Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-[#2d5a27]">Budget Tracking</h3>
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <select
                    value={budgetMonth}
                    onChange={(e) => setBudgetMonth(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select
                    value={budgetYear}
                    onChange={(e) => setBudgetYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    resetBudgetForm();
                    setShowBudgetForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  + Add Budget
                </button>
              </div>
            </div>
            {budgets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No budgets set for this period</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className={`border-2 p-4 rounded-lg ${budget.is_over_budget ? "border-red-300" : "border-gray-200"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{CATEGORIES[budget.category]?.label || budget.category}</h4>
                        {budget.is_over_budget && <span className="text-xs text-red-600 font-bold">⚠️ Over Budget!</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditBudget(budget)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button onClick={() => handleDeleteBudget(budget.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      ${budget.current_spent.toLocaleString()} / ${budget.limit_amount.toLocaleString()}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(budget.percentage_spent)}`}
                        style={{ width: `${Math.min(budget.percentage_spent, 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">{budget.percentage_spent.toFixed(1)}% spent</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Form */}
          {showBudgetForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-[#2d5a27]">
                {editingBudget ? "Edit Budget" : "Add Budget"}
              </h3>
              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select
                      value={budgetFormData.category}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, category: e.target.value })}
                      disabled={!!editingBudget}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    >
                      {Object.entries(CATEGORIES).filter(([_, c]) => c.isExpense).map(([key, cat]) => (
                        <option key={key} value={key}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Budget Limit ($)</label>
                    <input
                      type="number"
                      required
                      value={budgetFormData.limit_amount}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, limit_amount: parseInt(e.target.value || 0) })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetBudgetForm}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#2d5a27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#244b1f] transition-colors"
                  >
                    {editingBudget ? "Update Budget" : "Save Budget"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-[#2d5a27]">Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                >
                  <option value="">All Types</option>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Filter by User</label>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                />
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-[#2d5a27]">
                {editingEntry ? "Edit Ledger Entry" : "Add Ledger Entry"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    >
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Related User (optional)</label>
                    <input
                      type="text"
                      value={formData.related_user}
                      onChange={(e) => setFormData({ ...formData, related_user: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Debit (Money Out)</label>
                    <input
                      type="number"
                      value={formData.debit}
                      onChange={(e) => setFormData({ ...formData, debit: parseInt(e.target.value || 0) })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Credit (Money In)</label>
                    <input
                      type="number"
                      value={formData.credit}
                      onChange={(e) => setFormData({ ...formData, credit: parseInt(e.target.value || 0) })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Attachment URL (optional)</label>
                    <input
                      type="text"
                      placeholder="https://example.com/receipt.pdf"
                      value={formData.attachment_url}
                      onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#2d5a27] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#244b1f] transition-colors"
                  >
                    {editingEntry ? "Update Entry" : "Save Entry"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Ledger Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase">Date</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase">Type</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase">Description</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase">Related User</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase text-right">Debit</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase text-right">Credit</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase text-right">Running Balance</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerWithBalance().length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No ledger entries found!
                    </td>
                  </tr>
                ) : (
                  ledgerWithBalance().map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-700">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${CATEGORIES[entry.type]?.color || CATEGORIES.other.color}`}>
                          {CATEGORIES[entry.type]?.label || entry.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {entry.description}
                        {entry.attachment_url && (
                          <a
                            href={entry.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 text-sm hover:underline"
                          >
                            📎 Attachment
                          </a>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{entry.related_user || "-"}</td>
                      <td className="py-4 px-6 text-right text-red-600 font-semibold">
                        {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="py-4 px-6 text-right text-green-600 font-semibold">
                        {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : "-"}
                      </td>
                      <td className={`py-4 px-6 text-right font-bold ${entry.runningBalance >= 0 ? "text-[#2d5a27]" : "text-red-600"}`}>
                        ${entry.runningBalance.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

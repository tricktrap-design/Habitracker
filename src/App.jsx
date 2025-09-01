import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckSquare,
  BarChart3,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------- Utilities ----------
const STORAGE_KEY = "habit-tracker-v1";
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PASTELS = [
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-sky-100 text-sky-900 border-sky-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-violet-100 text-violet-900 border-violet-200",
  "bg-teal-100 text-teal-900 border-teal-200",
  "bg-indigo-100 text-indigo-900 border-indigo-200",
];
const PASTEL_SOLID = [
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#f43f5e", // rose-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Dates
function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  return d;
}
function getStartOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return getStartOfMonth(d);
}
function daysInMonthCount(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return d.getDate();
}
function dateKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function fmtShort(date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(
    date
  );
}
function fmtWeekRange(weekStart) {
  const start = fmtShort(weekStart);
  const end = fmtShort(addDays(weekStart, 6));
  return `${start} – ${end}`;
}
function fmtMonth(date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

// ---------- UI primitives ----------
function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 ${
        active
          ? "bg-slate-900 text-white shadow"
          : "text-slate-700 hover:bg-slate-100"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </button>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div role="group" aria-label="View mode" className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 ${
            value === opt.value ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ---------- Main App ----------
export default function HabitTrackerApp() {
  const [view, setView] = useState("track");
  const [prevView, setPrevView] = useState("track");
  const go = (next) => { setPrevView(view); setView(next); };

  // Data
  const [habits, setHabits] = useState([]); // {id, name, emoji, colorIx}
  const [checks, setChecks] = useState({}); // { [dateKey]: { [habitId]: true } }
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));
  const [monthStart, setMonthStart] = useState(getStartOfMonth(new Date()));
  const [mode, setMode] = useState(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}-mode`);
      return raw === "month" ? "month" : "week";
    } catch {
      return "week";
    }
  }); // "week" | "month"

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setHabits(parsed.habits || []);
        setChecks(parsed.checks || {});
      }
    } catch {}
  }, []);
  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ hab_

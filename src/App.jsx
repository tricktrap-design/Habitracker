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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, checks }));
  }, [habits, checks]);
  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_KEY}-mode`, mode); } catch {}
  }, [mode]);

  // Derived dates by mode
  const periodDates = useMemo(() => {
    if (mode === "week") return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const days = daysInMonthCount(monthStart);
    return Array.from({ length: days }, (_, i) => addDays(monthStart, i));
  }, [mode, weekStart, monthStart]);
  const periodKeys = useMemo(() => periodDates.map(dateKey), [periodDates]);

  const toggleCheck = (habitId, dKey) => {
    setChecks((prev) => {
      const day = { ...(prev[dKey] || {}) };
      day[habitId] = !day[habitId];
      return { ...prev, [dKey]: day };
    });
  };

  const deleteHabit = (habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setChecks((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (next[k] && habitId in next[k]) {
          const clone = { ...next[k] };
          delete clone[habitId];
          next[k] = clone;
        }
      }
      return next;
    });
  };

  // Stats for Results over current period
  const dayCounts = useMemo(() => {
    return periodKeys.map((k) => {
      const day = checks[k] || {};
      return habits.reduce((acc, h) => acc + (day[h.id] ? 1 : 0), 0);
    });
  }, [periodKeys, checks, habits]);

  const topDayIndex = useMemo(() => {
    let idx = 0;
    let max = -Infinity;
    dayCounts.forEach((c, i) => { if (c > max) { max = c; idx = i; } });
    return idx;
  }, [dayCounts]);

  const perHabitCounts = useMemo(() => {
    const map = {};
    for (const h of habits) map[h.id] = 0;
    periodKeys.forEach((k) => {
      const day = checks[k] || {};
      for (const h of habits) if (day[h.id]) map[h.id]++;
    });
    return map; // {habitId: 0..N}
  }, [periodKeys, checks, habits]);

  // Navigation handlers based on mode
  const prevHandler = () => {
    if (mode === "week") setWeekStart((d) => addDays(d, -7));
    else setMonthStart((d) => addMonths(d, -1));
  };
  const nextHandler = () => {
    if (mode === "week") setWeekStart((d) => addDays(d, 7));
    else setMonthStart((d) => addMonths(d, 1));
  };
  const thisPeriodHandler = () => {
    if (mode === "week") setWeekStart(getStartOfWeek(new Date()));
    else setMonthStart(getStartOfMonth(new Date()));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-800">
      {/* App shell */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-2 text-white shadow">
              <CheckSquare className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Habit Flow</h1>
              <p className="text-xs text-slate-500">Fast, simple habit tracking</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <NavBtn active={view === "track"} onClick={() => go("track")}>
              <CheckSquare className="mr-2 h-4 w-4" /> Track
            </NavBtn>
            <NavBtn active={view === "results"} onClick={() => go("results")}>
              <BarChart3 className="mr-2 h-4 w-4" /> Results
            </NavBtn>
            <NavBtn active={view === "create"} onClick={() => go("create")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create
            </NavBtn>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        {view === "track" && (
          <TrackView
            habits={habits}
            checks={checks}
            mode={mode}
            onModeChange={setMode}
            weekStart={weekStart}
            monthStart={monthStart}
            periodDates={periodDates}
            periodKeys={periodKeys}
            onPrev={prevHandler}
            onNext={nextHandler}
            onThisPeriod={thisPeriodHandler}
            onToggle={toggleCheck}
            onDeleteHabit={deleteHabit}
          />
        )}

        {view === "results" && (
          <ResultsView
            habits={habits}
            mode={mode}
            onModeChange={setMode}
            weekStart={weekStart}
            monthStart={monthStart}
            periodDates={periodDates}
            onPrev={prevHandler}
            onNext={nextHandler}
            onThisPeriod={thisPeriodHandler}
            dayCounts={dayCounts}
            topDayIndex={topDayIndex}
            perHabitCounts={perHabitCounts}
          />
        )}

        {view === "create" && (
          <CreateView
            onCreate={(h) => {
              setHabits((prev) => [...prev, h]);
              go("track");
            }}
            onCancel={() => go(prevView)}
          />
        )}

        {habits.length === 0 && view === "track" && (
          <EmptyHint onSeed={() => seedHabits(setHabits)} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-3 text-center text-xs text-slate-500">
        Built with ♥ for focused, weekly/monthly momentum.
      </footer>
    </div>
  );
}

// ---------- Views ----------
function TrackView({
  habits,
  checks,
  mode,
  onModeChange,
  weekStart,
  monthStart,
  periodDates,
  periodKeys,
  onPrev,
  onNext,
  onThisPeriod,
  onToggle,
  onDeleteHabit,
}) {
  const title =
    mode === "week"
      ? `Weekly tracker (${fmtWeekRange(weekStart)})`
      : `Monthly tracker (${fmtMonth(monthStart)})`;
  const periodLabel = mode === "week" ? "This week" : "This month";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <Segmented
            value={mode}
            onChange={onModeChange}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
          <button
            onClick={onPrev}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            aria-label={`Previous ${mode}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            aria-label={`Next ${mode}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={onThisPeriod}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
          >
            {periodLabel}
          </button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-separate border-spacing-0">
            <caption className="sr-only">
              {mode === "week" ? "Weekly" : "Monthly"} habit tracker table
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-56 rounded-l-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Habit
                </th>
                {mode === "week" &&
                  periodDates.map((d, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`truncate border border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                        i === 6 ? "rounded-r-xl" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span
                          aria-hidden
                          className="text-[11px] text-slate-500"
                        >
                          {DAY_LABELS[i]}
                        </span>
                        <span className="text-sm font-medium">
                          {new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d)}
                        </span>
                      </div>
                    </th>
                  ))}
                {mode === "month" &&
                  periodDates.map((d, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`truncate border border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 ${
                        i === periodDates.length - 1 ? "rounded-r-xl" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span
                          aria-hidden
                          className="text-[11px] text-slate-500"
                        >
                          {new Intl.DateTimeFormat("en", { weekday: "short" }).format(d)}
                        </span>
                        <span className="text-sm font-medium">
                          {new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d)}
                        </span>
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => (
                <tr key={h.id} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 truncate border border-slate-200 bg-white p-3 text-left align-middle group-hover:bg-slate-50"
                  >
                    <div className="relative flex items-center gap-2">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border text-base ${
                          PASTELS[h.colorIx % PASTELS.length]
                        }`}
                        aria-hidden
                      >
                        {h.emoji}
                      </span>
                      <span className="font-medium text-slate-800">
                        {h.name}
                      </span>
                      <button
                        onClick={() => onDeleteHabit(h.id)}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 opacity-0 transition duration-150 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 hover:bg-slate-50 hover:scale-105 active:scale-95 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                        aria-label={`Remove habit ${h.name}`}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </th>

                  {periodKeys.map((k, idx) => {
                    const checked = Boolean(checks[k]?.[h.id]);
                    return (
                      <td
                        key={k}
                        className="border border-slate-200 p-0 text-center align-middle"
                      >
                        <label className="flex h-12 cursor-pointer items-center justify-center">
                          <input
                            aria-label={`Mark ${h.name} as done on ${fmtShort(periodDates[idx])}`}
                            type="checkbox"
                            className="peer sr-only"
                            checked={checked}
                            onChange={() => onToggle(h.id, k)}
                          />
                          <span
                            className={`pointer-events-none inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-400/50 ${
                              checked
                                ? `scale-95 bg-slate-900 text-white`
                                : "bg-white text-slate-300 hover:bg-slate-50"
                            }`}
                            aria-hidden
                          >
                            ✓
                          </span>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-slate-500">
                    No habits yet. Create your first one in <strong>Create</strong> →
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {habits.length > 0 && (
        <div className="flex items-center justify-end">
          <p className="text-xs text-slate-500">
            Tip: Use <kbd className="rounded bg-slate-100 px-1">Tab</kbd> to move between cells and
            <kbd className="ml-1 rounded bg-slate-100 px-1">Space</kbd> to toggle.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultsView({
  habits,
  mode,
  onModeChange,
  weekStart,
  monthStart,
  periodDates,
  onPrev,
  onNext,
  onThisPeriod,
  dayCounts,
  topDayIndex,
  perHabitCounts,
}) {
  const chartData = useMemo(() => {
    if (mode === "week") {
      return DAY_LABELS.map((label, i) => ({ day: label, count: dayCounts[i] || 0 }));
    }
    return periodDates.map((d, i) => ({
      day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d),
      count: dayCounts[i] || 0
    }));
  }, [mode, periodDates, dayCounts]);

  const highlightColor = "#0ea5e9";
  const defaultColor = "#cbd5e1";
  const title =
    mode === "week"
      ? `Results (${fmtWeekRange(weekStart)})`
      : `Results (${fmtMonth(monthStart)})`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <Segmented
            value={mode}
            onChange={onModeChange}
            options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]}
          />
          <button onClick={onPrev} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50" aria-label={`Previous ${mode}`}><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={onNext} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50" aria-label={`Next ${mode}`}><ChevronRight className="h-4 w-4" /></button>
          <button onClick={onThisPeriod} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">{mode === "week" ? "This week" : "This month"}</button>
        </div>
      </div>

      {/* Habit performance at top, each with a mini progress bar */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-slate-600">
          Habit performance this {mode}
        </h3>
        {habits.length === 0 ? (
          <p className="text-slate-500">No habits to analyze yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {habits.map((h) => {
              const count = perHabitCounts[h.id] || 0;
              const total = mode === "week" ? 7 : periodDates.length;
              const pct = Math.round((count / total) * 100);
              return (
                <li key={h.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 h-2 w-full rounded-full bg-slate-100" aria-hidden>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PASTEL_SOLID[h.colorIx % PASTEL_SOLID.length],
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border text-base ${PASTELS[h.colorIx % PASTELS.length]}`} aria-hidden>
                        {h.emoji}
                      </span>
                      <span className="font-medium text-slate-800">{h.name}</span>
                    </div>
                    <span className="text-sm tabular-nums text-slate-700">
                      {count} / {total}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide text-slate-600">
            {mode === "week" ? "Most productive day (Mon–Sun)" : "Daily completions this month"}
          </h3>
          <p className="text-xs text-slate-500">Higher bar = more completed habits</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap={10}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={idx === topDayIndex ? highlightColor : defaultColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {mode === "week" && (
          <p className="mt-2 text-sm text-slate-700">Top day: <strong>{DAY_LABELS[topDayIndex]}</strong></p>
        )}
      </Card>
    </div>
  );
}

function CreateView({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ id: uid(), name: trimmed, emoji: emoji || "✅", colorIx: Math.floor(Math.random() * PASTELS.length) });
    setName("");
    setEmoji("✅");
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Create a habit</h2>
        <form onSubmit={submit} className="space-y-4" aria-label="Create habit form">
          <div>
            <label htmlFor="habit-name" className="mb-1 block text-sm font-medium text-slate-700">
              Habit name
            </label>
            <input
              id="habit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink water"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Emoji</label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add habit
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function EmptyHint({ onSeed }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-slate-700">Start by creating a few habits you want to track each week.</p>
        <div className="flex gap-2">
          <button
            onClick={onSeed}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
          >
            Add sample habits
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

function EmojiPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const EMOJIS = [
    { c: "✅", k: "done, check, complete, task" },
    { c: "💧", k: "water, drink, hydrate" },
    { c: "🏃", k: "run, exercise, cardio" },
    { c: "📚", k: "read, study, learn" },
    { c: "🧘", k: "meditate, calm, breathe" },
    { c: "🍎", k: "fruit, diet, healthy" },
    { c: "📝", k: "journal, write, notes" },
    { c: "🛏️", k: "sleep, rest, bedtime" },
    { c: "☀️", k: "sun, morning, wake" },
    { c: "🥤", k: "drink, soda, water" },
    { c: "🥗", k: "salad, diet" },
    { c: "🚶", k: "walk, steps" },
    { c: "🏋️", k: "lift, gym, weights" },
    { c: "🧴", k: "skincare, sunscreen" },
    { c: "🦷", k: "floss, teeth" },
    { c: "💤", k: "sleep, nap" },
    { c: "🧠", k: "brain, learn" },
    { c: "🧹", k: "clean, tidy" },
    { c: "🧼", k: "wash, hygiene" },
    { c: "📵", k: "no-phone, focus" },
    { c: "⏳", k: "pomodoro, focus" },
    { c: "🎧", k: "audio, podcast" },
    { c: "🎯", k: "target, focus" },
    { c: "🧩", k: "puzzle, brain" },
    { c: "🪥", k: "brush, teeth" },
    { c: "🥛", k: "milk, drink" },
    { c: "🍵", k: "tea, drink" },
    { c: "☕", k: "coffee, drink" },
    { c: "🍋", k: "lemon, vitamin" },
    { c: "🍊", k: "orange, vitamin" },
    { c: "🍌", k: "banana, fruit" },
    { c: "🏊", k: "swim, exercise" },
    { c: "🚴", k: "bike, exercise" },
    { c: "🧗", k: "climb, exercise" },
    { c: "🪑", k: "posture, sit" },
    { c: "📖", k: "book, reading" },
    { c: "🎹", k: "piano, practice" },
    { c: "🎨", k: "art, draw" },
  ];
  const list = EMOJIS.filter((e) =>
    !query ? true : e.k.toLowerCase().includes(query.toLowerCase()) || e.c.includes(query)
  );
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search emoji…"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
        aria-label="Search emojis"
      />
      <div className="mt-2 grid max-h-40 grid-cols-8 gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
        {list.map((e) => {
          const selected = value === e.c;
          return (
            <button
              type="button"
              key={e.c}
              onClick={() => onChange(e.c)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-2xl transition ${
                selected ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white hover:bg-slate-50"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50`}
              aria-pressed={selected}
              aria-label={e.k}
              title={e.k}
            >
              <span>{e.c}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-500">Tip: click an emoji or keep typing to filter.</p>
    </div>
  );
}

function seedHabits(setHabits) {
  const samples = [
    { name: "Drink water", emoji: "💧" },
    { name: "Exercise", emoji: "🏃" },
    { name: "Read 20 min", emoji: "📚" },
  ];
  setHabits((prev) => [
    ...prev,
    ...samples.map((s, i) => ({ id: uid(), name: s.name, emoji: s.emoji, colorIx: i })),
  ]);
}

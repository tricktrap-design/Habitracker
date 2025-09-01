import React, { useEffect, useMemo, useState } from "react";
function CreateView({ onCreate, onCancel }) {
const [name, setName] = useState("");
const [emoji, setEmoji] = useState("✅");
function submit(e) { e.preventDefault(); const trimmed = name.trim(); if (!trimmed) return; onCreate({ id: uid(), name: trimmed, emoji: emoji || "✅", colorIx: Math.floor(Math.random() * PASTELS.length) }); setName(""); setEmoji("✅"); }
return (
<div className="mx-auto max-w-xl">
<Card>
<h2 className="mb-4 text-xl font-semibold tracking-tight">Create a habit</h2>
<form onSubmit={submit} className="space-y-4" aria-label="Create habit form">
<div>
<label htmlFor="habit-name" className="mb-1 block text-sm font-medium text-slate-700">Habit name</label>
<input id="habit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Drink water" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50" required />
</div>
<div>
<label className="mb-1 block text-sm font-medium text-slate-700">Emoji</label>
<EmojiPicker value={emoji} onChange={setEmoji} />
</div>
<div className="flex items-center justify-end gap-2">
<button type="button" onClick={onCancel} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">Cancel</button>
<button type="submit" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"><PlusCircle className="mr-2 h-4 w-4" /> Add habit</button>
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
<div className="flex gap-2"><button onClick={onSeed} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">Add sample habits</button></div>
</Card>
</motion.div>
);
}


function EmojiPicker({ value, onChange }) {
const [query, setQuery] = useState("");
const EMOJIS = [
{ c: "✅", k: "done, check, complete, task" }, { c: "💧", k: "water, drink, hydrate" }, { c: "🏃", k: "run, exercise, cardio" }, { c: "📚", k: "read, study, learn" }, { c: "🧘", k: "meditate, calm, breathe" }, { c: "🍎", k: "fruit, diet, healthy" }, { c: "📝", k: "journal, write, notes" }, { c: "🛏️", k: "sleep, rest, bedtime" }, { c: "☀️", k: "sun, morning, wake" }, { c: "🥤", k: "drink, soda, water" }, { c: "🥗", k: "salad, diet" }, { c: "🚶", k: "walk, steps" }, { c: "🏋️", k: "lift, gym, weights" }, { c: "🧴", k: "skincare, sunscreen" }, { c: "🦷", k: "floss, teeth" }, { c: "💤", k: "sleep, nap" }, { c: "🧠", k: "brain, learn" }, { c: "🧹", k: "clean, tidy" }, { c: "🧼", k: "wash, hygiene" }, { c: "📵", k: "no-phone, focus" }, { c: "⏳", k: "pomodoro, focus" }, { c: "🎧", k: "audio, podcast" }, { c: "🎯", k: "target, focus" }, { c: "🧩", k: "puzzle, brain" }, { c: "🪥", k: "brush, teeth" }, { c: "🥛", k: "milk, drink" }, { c: "🍵", k: "tea, drink" }, { c: "☕", k: "coffee, drink" }, { c: "🍋", k: "lemon, vitamin" }, { c: "🍊", k: "orange, vitamin" }, { c: "🍌", k: "banana, fruit" }, { c: "🏊", k: "swim, exercise" }, { c: "🚴", k: "bike, exercise" }, { c: "🧗", k: "climb, exercise" }, { c: "🪑", k: "posture, sit" }, { c: "📖", k: "book, reading" }, { c: "🎹", k: "piano, practice" }, { c: "🎨", k: "art, draw" },
];
const list = EMOJIS.filter((e) => (!query ? true : e.k.toLowerCase().includes(query.toLowerCase()) || e.c.includes(query)));
return (
<div>
<input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emoji…" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50" aria-label="Search emojis" />
<div className="mt-2 grid max-h-40 grid-cols-8 gap-2 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
{list.map((e) => { const selected = value === e.c; return (
<button type="button" key={e.c} onClick={() => onChange(e.c)} className={`flex h-10 w-10 items-center justify-center rounded-lg border text-2xl transition ${selected ? "border-slate-900 bg-slate-900/5" : "border-slate-200 bg-white hover:bg-slate-50"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50`} aria-pressed={selected} aria-label={e.k} title={e.k}>
<span>{e.c}</span>
</button>
); })}
</div>
<p className="mt-1 text-xs text-slate-500">Tip: click an emoji or keep typing to filter.</p>
</div>
);
}


function seedHabits(setHabits) {
const samples = [ { name: "Drink water", emoji: "💧" }, { name: "Exercise", emoji: "🏃" }, { name: "Read 20 min", emoji: "📚" } ];
setHabits((prev) => [ ...prev, ...samples.map((s, i) => ({ id: uid(), name: s.name, emoji: s.emoji, colorIx: i })) ]);
}

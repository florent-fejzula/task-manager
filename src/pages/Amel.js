import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

// ⬅️ set this to your real UID (same as routing & rules)
const OWNER_UID = "J89IeSZy3nMy9J3adoGMv2eUr7S2";

export default function Amel() {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.uid === OWNER_UID;
  const [items, setItems] = useState([]);

  // Snapshot WITHOUT multi-orderBy (no index needed)
  useEffect(() => {
    if (!isOwner) return;
    const q = collection(db, "users", OWNER_UID, "amels");
    const unsub = onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [isOwner]);

  // Sort client-side: category ASC, order ASC, createdAt ASC tie-breaker
  const groups = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const ca = (a.category || "Other").localeCompare(b.category || "Other");
      if (ca !== 0) return ca;
      const oa = (a.order ?? 9999) - (b.order ?? 9999);
      if (oa !== 0) return oa;
      const ta = a.createdAt?.seconds ?? 0;
      const tb = b.createdAt?.seconds ?? 0;
      return ta - tb;
    });

    const map = new Map();
    for (const it of sorted) {
      const key = it.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-2">Amel</h2>
        <p className="text-sm text-gray-500">This page is private.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-semibold">Amel</h2>
        <p className="text-sm text-gray-600">
          Turn knowledge into action. Mark what you did and track your streaks.
        </p>
      </header>

      {groups.length === 0 && (
        <p className="text-sm text-gray-500">
          No actions yet. Add your first Amel above.
        </p>
      )}

      {groups.map(([cat, list]) => (
        <section key={cat}>
          <h3 className="text-lg font-semibold mb-3">{cat}</h3>
          <div className="space-y-3">
            {list.map((item) => (
              <AmelItem key={item.id} ownerUid={OWNER_UID} item={item} />
            ))}
          </div>
        </section>
      ))}

      {/* Create Amel */}
      <CreateAmelForm ownerUid={OWNER_UID} />
    </div>
  );
}

function CreateAmelForm({ ownerUid }) {
  // Preset categories you mentioned; free text allowed as well
  const presets = ["Worship", "Character", "Family", "Knowledge", "Service"];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(presets[0]);
  const [customCat, setCustomCat] = useState("");
  const [order, setOrder] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cat = (customCat || category || "Other").trim();
    const t = title.trim();
    const d = description.trim();
    const ord = Number(order) || 1;

    if (!t) {
      setError("Title is required.");
      return;
    }
    if (!cat) {
      setError("Category is required.");
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, "users", ownerUid, "amels"), {
        title: t,
        description: d,
        category: cat,
        order: ord,
        count: 0,
        streak: 0,
        bestStreak: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // reset
      setTitle("");
      setDescription("");
      setCustomCat("");
      setOrder(ord + 1);
    } catch (err) {
      console.error(err);
      setError("Could not create. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border bg-white p-4 shadow-sm"
    >
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2"
          placeholder="e.g., Attend Fajr in congregation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">
          How to apply (1–2 sentences)
        </label>
        <textarea
          className="w-full rounded border border-neutral-300 px-3 py-2"
          rows={2}
          placeholder="Short, practical instruction you can act on today"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full rounded border border-neutral-300 px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {presets.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
            <option value="">Custom…</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Custom category
          </label>
          <input
            className="w-full rounded border border-neutral-300 px-3 py-2"
            placeholder="Optional: if not using a preset"
            value={customCat}
            onChange={(e) => setCustomCat(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Order</label>
        <input
          type="number"
          className="w-32 rounded border border-neutral-300 px-3 py-2"
          min={1}
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded bg-neutral-800 text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create Amel"}
      </button>
    </form>
  );
}

function AmelItem({ item, ownerUid }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tTitle, setTTitle] = useState(item.title);
  const [tDesc, setTDesc] = useState(item.description || "");

  // Keep local drafts in sync if Firestore updates while not editing
  useEffect(() => {
    if (!editing) {
      setTTitle(item.title);
      setTDesc(item.description || "");
    }
  }, [item.title, item.description, editing]);

  async function bump(doneConsecutive) {
    try {
      setBusy(true);
      const ref = doc(db, "users", ownerUid, "amels", item.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const cur = snap.data();

      const next = {
        count: (cur.count || 0) + 1,
        updatedAt: serverTimestamp(),
      };
      if (doneConsecutive) {
        const newStreak = (cur.streak || 0) + 1;
        next.streak = newStreak;
        next.bestStreak = Math.max(newStreak, cur.bestStreak || 0);
      }
      await updateDoc(ref, next);
    } finally {
      setBusy(false);
    }
  }

  async function resetStreak() {
    try {
      setBusy(true);
      const ref = doc(db, "users", ownerUid, "amels", item.id);
      await updateDoc(ref, { streak: 0, updatedAt: serverTimestamp() });
    } finally {
      setBusy(false);
    }
  }

  async function saveEdits() {
    const title = tTitle.trim();
    const description = tDesc.trim();
    if (!title) return; // keep simple: require title
    try {
      setBusy(true);
      const ref = doc(db, "users", ownerUid, "amels", item.id);
      await updateDoc(ref, {
        title,
        description,
        updatedAt: serverTimestamp(),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  function cancelEdits() {
    setTTitle(item.title);
    setTDesc(item.description || "");
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {!editing ? (
            <>
              <div className="font-medium">{item.title}</div>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
            </>
          ) : (
            <>
              <input
                className="w-full rounded border border-neutral-300 px-3 py-2 mb-2"
                value={tTitle}
                onChange={(e) => setTTitle(e.target.value)}
                placeholder="Title"
                autoFocus
              />
              <textarea
                className="w-full rounded border border-neutral-300 px-3 py-2"
                rows={2}
                value={tDesc}
                onChange={(e) => setTDesc(e.target.value)}
                placeholder="How to apply (1–2 sentences)"
              />
            </>
          )}
        </div>

        <div className="text-right text-sm shrink-0">
          <div>
            Count: <span className="font-semibold">{item.count || 0}</span>
          </div>
          <div>
            Streak: <span className="font-semibold">{item.streak || 0}</span>
          </div>
          {typeof item.bestStreak === "number" && (
            <div className="text-gray-500">Best: {item.bestStreak}</div>
          )}

          {/* Edit / Save controls */}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-gray-600 hover:text-black"
              title="Edit"
            >
              {/* Pencil icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="currentColor"
                />
                <path
                  d="M14.06 4.94l3.75 3.75 1.77-1.77a1.5 1.5 0 0 0 0-2.12l-1.63-1.63a1.5 1.5 0 0 0-2.12 0l-1.77 1.77z"
                  fill="currentColor"
                />
              </svg>
              Edit
            </button>
          ) : (
            <div className="mt-2 flex flex-col gap-1 items-end">
              <button
                onClick={saveEdits}
                disabled={busy}
                className="px-2 py-1 rounded bg-neutral-800 text-white text-xs hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={cancelEdits}
                disabled={busy}
                className="text-xs text-gray-600 underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {!editing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => bump(false)}
            disabled={busy}
            className="px-3 py-1.5 rounded bg-neutral-800 text-white hover:opacity-90 disabled:opacity-50"
          >
            Done
          </button>
          <button
            onClick={() => bump(true)}
            disabled={busy}
            className="px-3 py-1.5 rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50"
            title="Counts + Streak +1 (you confirm it's consecutive)"
          >
            Consecutive Done
          </button>
          <button
            onClick={resetStreak}
            disabled={busy}
            className="px-3 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reset Streak
          </button>
        </div>
      )}
    </div>
  );
}

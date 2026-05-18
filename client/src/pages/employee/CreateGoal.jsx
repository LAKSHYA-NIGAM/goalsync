import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import AISuggestionModal from "../../components/goals/AISuggestionModal";

/* ── Constants ─────────────────────────────────────────────────────────── */
const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Experience",
  "Compliance",
  "Product",
  "Operations",
  "People",
];

const UOM_OPTIONS = [
  { value: "min",      label: "Minimum",     desc: "Higher is better",    icon: "📈" },
  { value: "max",      label: "Maximum",     desc: "Lower is better",     icon: "📉" },
  { value: "zero",     label: "Zero Defect", desc: "Zero is success",     icon: "🎯" },
  { value: "timeline", label: "Timeline",    desc: "Date-based target",   icon: "📅" },
];

/* ── Icons ─────────────────────────────────────────────────────────────── */
const ArrowLeft = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>);
const SaveIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>);
const SparkleIcon = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.278 1.272L12 21l-1.91-5.818a2 2 0 00-1.272-1.272L3 12l5.818-1.91a2 2 0 001.272-1.278L12 3z"/></svg>);

export default function CreateGoal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    thrustArea: "",
    title: "",
    description: "",
    uomType: "min",
    target: "",
    deadline: "",
    weightage: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [weightBudget, setWeightBudget] = useState(100);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiSource, setAiSource] = useState("");
  const [aiImproved, setAiImproved] = useState(false);

  /* ── Load existing goal (edit mode) + weight budget ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get("/goals/my");
        const goals = data.goals || [];

        if (isEdit) {
          const goal = goals.find((g) => g._id === id);
          if (!goal) { navigate("/employee/goals"); return; }
          if (goal.status !== "draft") { navigate("/employee/goals"); return; }

          setForm({
            thrustArea: goal.thrustArea || "",
            title: goal.title || "",
            description: goal.description || "",
            uomType: goal.uomType || "min",
            target: goal.target != null ? String(goal.target) : "",
            deadline: goal.deadline ? goal.deadline.slice(0, 10) : "",
            weightage: goal.weightage != null ? String(goal.weightage) : "",
          });

          const otherWeight = goals
            .filter((g) => g._id !== id)
            .reduce((s, g) => s + (g.weightage || 0), 0);
          setWeightBudget(100 - otherWeight);
        } else {
          const totalWeight = goals.reduce((s, g) => s + (g.weightage || 0), 0);
          setWeightBudget(100 - totalWeight);
        }
      } catch {
        setApiError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  /* ── Helpers ── */
  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.thrustArea) e.thrustArea = "Select a thrust area";
    if (!form.uomType) e.uomType = "Select a UoM type";

    if (form.uomType === "timeline") {
      if (!form.deadline) e.deadline = "Deadline is required for timeline goals";
    } else {
      if (form.target === "") e.target = "Target value is required";
    }

    const w = Number(form.weightage);
    if (!form.weightage || isNaN(w)) e.weightage = "Weightage is required";
    else if (w < 10) e.weightage = "Minimum weightage is 10%";
    else if (w > weightBudget) e.weightage = `Exceeds remaining budget of ${weightBudget}%`;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── AI improve handler ── */
  const handleAIImprove = async () => {
    if (!form.title.trim()) { setErrors(e => ({ ...e, title: "Enter a title first" })); return; }
    setAiLoading(true);
    setApiError("");
    try {
      const { data } = await API.post("/ai/improve-goal", {
        title: form.title, description: form.description, thrustArea: form.thrustArea, uomType: form.uomType,
      });
      setAiSuggestion(data);
      setAiSource(data.source || "smart-engine");
      setAiModal(true);
    } catch (err) {
      setApiError(err.response?.data?.message || "AI service unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError("");

    const payload = {
      thrustArea: form.thrustArea,
      title: form.title.trim(),
      description: form.description.trim(),
      uomType: form.uomType,
      target: form.uomType === "timeline" ? null : Number(form.target),
      deadline: form.uomType === "timeline" ? form.deadline : form.deadline || null,
      weightage: Number(form.weightage),
      aiImproved,
    };

    try {
      if (isEdit) {
        await API.put(`/goals/${id}`, payload);
      } else {
        await API.post("/goals", payload);
      }
      navigate("/employee/goals");
    } catch (err) {
      setApiError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
      </div>
    );
  }

  const currentWeight = Number(form.weightage) || 0;
  const weightOk = currentWeight >= 10 && currentWeight <= weightBudget;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Back link ── */}
      <button onClick={() => navigate("/employee/goals")} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-5 transition">
        <ArrowLeft className="w-4 h-4"/> Back to My Goals
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{isEdit ? "Edit Goal" : "Create New Goal"}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">FY 2025 · Remaining weightage budget: <strong className={weightBudget > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>{weightBudget}%</strong></p>
        </div>

        {/* API error */}
        {apiError && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Thrust Area ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thrust Area <span className="text-red-500">*</span></label>
            <select value={form.thrustArea} onChange={(e) => set("thrustArea", e.target.value)}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.thrustArea ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}>
              <option value="">Select thrust area…</option>
              {THRUST_AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
            {errors.thrustArea && <p className="text-xs text-red-500 mt-1">{errors.thrustArea}</p>}
          </div>

          {/* ── Title ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal Title <span className="text-red-500">*</span></label>
              <button type="button" onClick={handleAIImprove} disabled={aiLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm transition disabled:opacity-50">
                {aiLoading ? (
                  <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> Improving…</>
                ) : (
                  <><SparkleIcon className="w-3.5 h-3.5"/> Improve with AI</>
                )}
              </button>
            </div>
            <input type="text" value={form.title} onChange={(e) => { set("title", e.target.value); setAiImproved(false); }} placeholder="e.g. Increase Sales Revenue"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.title ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}/>
            {aiImproved && <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-1 flex items-center gap-1"><SparkleIcon className="w-3 h-3"/> Enhanced with AI</p>}
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe the goal in detail…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"/>
          </div>

          {/* ── UoM Type (radio cards) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Measurement Type <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {UOM_OPTIONS.map((opt) => {
                const selected = form.uomType === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => set("uomType", opt.value)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition text-center
                      ${selected ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950"}`}>
                    <span className="text-xl">{opt.icon}</span>
                    <span className={`text-xs font-semibold ${selected ? "text-indigo-700 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"}`}>{opt.label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
                    {selected && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"/>}
                  </button>
                );
              })}
            </div>
            {errors.uomType && <p className="text-xs text-red-500 mt-1">{errors.uomType}</p>}
          </div>

          {/* ── Target / Deadline ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.uomType === "timeline" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deadline <span className="text-red-500">*</span></label>
                <input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.deadline ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}/>
                {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Value <span className="text-red-500">*</span></label>
                <input type="number" value={form.target} onChange={(e) => set("target", e.target.value)} placeholder="e.g. 1000000" min={0}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.target ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}/>
                {errors.target && <p className="text-xs text-red-500 mt-1">{errors.target}</p>}
              </div>
            )}

            {/* ── Weightage ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Weightage (%) <span className="text-red-500">*</span></label>
              <input type="number" value={form.weightage} onChange={(e) => set("weightage", e.target.value)} placeholder="10–100" min={10} max={100}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${errors.weightage ? "border-red-400" : "border-gray-300 dark:border-gray-700"}`}/>
              {errors.weightage ? (
                <p className="text-xs text-red-500 mt-1">{errors.weightage}</p>
              ) : (
                <p className={`text-xs mt-1 ${weightOk ? "text-emerald-500" : "text-gray-400"}`}>
                  {currentWeight > 0 ? `${weightBudget - currentWeight}% remaining after this goal` : `${weightBudget}% available`}
                </p>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => navigate("/employee/goals")} className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-50">
              <SaveIcon className="w-4 h-4"/>
              {saving ? "Saving…" : isEdit ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {aiModal && (
          <AISuggestionModal
            open={aiModal}
            onClose={() => setAiModal(false)}
            original={{ title: form.title, description: form.description }}
            suggestion={aiSuggestion}
            source={aiSource}
            onApply={(newTitle, newDesc) => {
              set("title", newTitle);
              set("description", newDesc);
              setAiImproved(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

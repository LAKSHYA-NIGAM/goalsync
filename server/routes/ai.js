const express = require("express");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

/* ── SMART goal improvement patterns (mock engine) ───────────────────── */
const SMART_PATTERNS = [
  {
    match: /increase|improve|grow|boost|raise|expand/i,
    transform: (title, desc, thrustArea, uomType) => {
      const metric = title.replace(/^(increase|improve|grow|boost|raise|expand)\s*/i, "").trim() || "key metric";
      return {
        improvedTitle: `Increase ${metric} by 15% in Q2-Q4 FY2025 through targeted initiatives`,
        improvedDescription: `Drive a measurable 15% improvement in ${metric} by implementing data-driven strategies. Track progress monthly using ${uomType === "min" ? "growth metrics" : "efficiency benchmarks"}, with milestone reviews at the end of each quarter. Success criteria: verified ${metric} improvement documented in the analytics dashboard.`,
        reasoning: `The original goal "${title}" lacked specificity. The SMART rewrite adds: (S) specific metric and method, (M) 15% target, (A) realistic quarterly timeline, (R) aligned to ${thrustArea || "business"} objectives, (T) Q2-Q4 FY2025 deadline.`,
      };
    },
  },
  {
    match: /reduce|decrease|lower|minimize|cut/i,
    transform: (title, desc, thrustArea, uomType) => {
      const metric = title.replace(/^(reduce|decrease|lower|minimize|cut)\s*/i, "").trim() || "target metric";
      return {
        improvedTitle: `Reduce ${metric} by 20% by end of Q3 FY2025 through process optimization`,
        improvedDescription: `Achieve a 20% reduction in ${metric} by identifying root causes and implementing systematic process improvements. Conduct bi-weekly reviews to track deviation from baseline. Establish automated monitoring to sustain gains post-implementation.`,
        reasoning: `The original goal "${title}" was directional but not actionable. The SMART rewrite adds: (S) 20% reduction target with clear method, (M) baseline + target comparison, (A) process optimization approach, (R) supports ${thrustArea || "operational"} efficiency, (T) Q3 FY2025 deadline.`,
      };
    },
  },
  {
    match: /complete|deliver|launch|ship|deploy|release|implement/i,
    transform: (title, desc, thrustArea, uomType) => {
      const what = title.replace(/^(complete|deliver|launch|ship|deploy|release|implement)\s*/i, "").trim() || "project deliverable";
      return {
        improvedTitle: `Successfully deliver ${what} with 100% feature coverage by 30-Sep-2025`,
        improvedDescription: `Complete end-to-end delivery of ${what} including requirements finalization, development, QA testing, UAT sign-off, and production deployment. Achieve zero critical defects at launch. Conduct post-launch review within 2 weeks to validate success metrics.`,
        reasoning: `The original goal "${title}" lacked success criteria and timeline. The SMART rewrite adds: (S) full delivery lifecycle defined, (M) 100% feature coverage + zero critical defects, (A) phased delivery approach, (R) aligned to ${thrustArea || "product"} roadmap, (T) 30-Sep-2025 hard deadline.`,
      };
    },
  },
  {
    match: /ensure|maintain|sustain|achieve/i,
    transform: (title, desc, thrustArea, uomType) => {
      const what = title.replace(/^(ensure|maintain|sustain|achieve)\s*/i, "").trim() || "compliance target";
      return {
        improvedTitle: `Maintain ${what} at ≥95% compliance rate throughout FY2025`,
        improvedDescription: `Sustain ${what} performance at or above 95% compliance rate across all quarters. Implement automated monitoring dashboards and monthly audit reviews. Address any deviation within 48 hours of detection with documented corrective action plans.`,
        reasoning: `The original goal "${title}" needed quantifiable standards. The SMART rewrite adds: (S) 95% compliance threshold, (M) automated monitoring + audit trail, (A) existing processes as foundation, (R) supports ${thrustArea || "governance"} requirements, (T) continuous through FY2025.`,
      };
    },
  },
];

function mockImprove(title, description, thrustArea, uomType) {
  for (const pattern of SMART_PATTERNS) {
    if (pattern.match.test(title)) {
      return pattern.transform(title, description, thrustArea, uomType);
    }
  }

  // Default fallback
  return {
    improvedTitle: `Achieve measurable improvement in "${title}" by 15% before Q4 FY2025`,
    improvedDescription: `${description || title}. Define clear baseline metrics at the start of the cycle, set monthly milestones, and conduct data-driven reviews. Document all progress in the GoalSync portal for transparent tracking and manager visibility.`,
    reasoning: `The original goal "${title}" was too vague for effective performance tracking. The SMART rewrite adds specific metrics (15%), a clear timeline (Q4 FY2025), and an action framework (monthly reviews + documentation). This ensures both employee and manager can objectively evaluate progress.`,
  };
}

/* ── OpenAI integration (when API key is available) ──────────────────── */
async function openAIImprove(title, description, thrustArea, uomType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are an enterprise HR performance coach. Rewrite the user\'s vague goal into a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound). Return JSON only: { "improvedTitle": "string", "improvedDescription": "string", "reasoning": "string" }',
          },
          {
            role: "user",
            content: `Thrust Area: ${thrustArea || "General"}, UoM: ${uomType || "min"}, Original: ${title} — ${description || "No description provided"}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON from response (handle markdown code blocks)
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── POST /api/ai/improve-goal ───────────────────────────────────────────
router.post("/improve-goal", verifyToken, async (req, res) => {
  try {
    const { title, description, thrustArea, uomType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Goal title is required" });
    }

    // Try OpenAI first, fall back to mock
    let result = await openAIImprove(title, description, thrustArea, uomType);

    if (!result) {
      result = mockImprove(title, description || "", thrustArea || "", uomType || "min");
    }

    return res.json({
      improvedTitle: result.improvedTitle,
      improvedDescription: result.improvedDescription,
      reasoning: result.reasoning,
      source: process.env.OPENAI_API_KEY ? "openai" : "smart-engine",
    });
  } catch (err) {
    return res.status(500).json({ message: "AI service temporarily unavailable" });
  }
});

module.exports = router;

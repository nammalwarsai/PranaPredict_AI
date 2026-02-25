import { useState, useMemo } from "react";

// ─────────────────────────────────────────────
// All health tips keyed by age bracket & category
// ─────────────────────────────────────────────

const TIPS_DATA = {
  "15-25": {
    title: "Youth & Young Adult",
    subtitle: "Build a strong foundation for lifelong health",
    icon: "🌱",
    color: "#22c55e",
    categories: [
      {
        name: "Nutrition",
        icon: "🥗",
        tips: [
          "Eat at least 5 servings of seasonal fruits & vegetables daily — favour local Indian produce like drumstick (moringa), spinach (palak), guava, and papaya.",
          "Include protein at every meal: dal, paneer, eggs, chicken, or sprouted pulses.",
          "Limit ultra-processed foods (packaged chips, instant noodles, sugary sodas) — they spike blood sugar and increase acne.",
          "Stay hydrated with 2.5–3 L of water; add cumin (jeera) water or buttermilk (chaas) for digestion.",
          "Have a handful of soaked almonds & walnuts each morning — excellent for brain development.",
        ],
      },
      {
        name: "Exercise",
        icon: "🏃",
        tips: [
          "Get 45–60 min of activity daily — sports, running, cycling, swimming, or gym workouts.",
          "Practice Surya Namaskar (12 rounds) every morning — builds flexibility, strength & cardiovascular fitness simultaneously.",
          "Avoid sitting for more than 1 hour at a stretch; stand, stretch, or walk for 5 minutes.",
          "Join a team sport or fitness group — social accountability helps consistency.",
          "Learn proper form for bodyweight exercises (push-ups, squats, planks) to prevent injuries.",
        ],
      },
      {
        name: "Ayurveda & Tradition",
        icon: "🪷",
        tips: [
          "Start the day with warm lemon-honey water or Triphala water on an empty stomach to detoxify.",
          "Use Chyawanprash (1 tsp daily) during winter for immunity — a time-tested Rasayana.",
          "Apply cold-pressed coconut or sesame oil to hair and scalp weekly (Abhyanga for head).",
          "Eat your largest meal at lunch (Pitta peak) when digestive fire (Agni) is strongest.",
          "Avoid ice-cold drinks during meals — they weaken Agni according to Ayurveda.",
        ],
      },
      {
        name: "Mental Health",
        icon: "🧘",
        tips: [
          "Limit social media to 1 hour/day — excessive scrolling is linked to anxiety and sleep issues.",
          "Practice 10 minutes of Pranayama (Anulom-Vilom) daily for focus and calm.",
          "Maintain a regular sleep schedule: 7–8 hours with screens off 30 min before bed.",
          "Talk to a trusted person or counsellor when stressed — don't bottle it up.",
          "Journal 3 things you're grateful for every night — builds resilience and positivity.",
        ],
      },
      {
        name: "Preventive Health",
        icon: "🩺",
        tips: [
          "Get an annual blood test (CBC, Vitamin D, B12, thyroid) — deficiencies are common in Indian youth.",
          "Maintain dental hygiene: brush twice, floss, and visit a dentist every 6 months.",
          "Use sunscreen (SPF 30+) even on cloudy days — Indian sun is strong year-round.",
          "Ensure all vaccinations are up to date (Hepatitis B, HPV for eligible age groups).",
          "Avoid tobacco and limit alcohol — the damage starts now, even if symptoms show later.",
        ],
      },
    ],
  },
  "26-35": {
    title: "Prime Adult Years",
    subtitle: "Sustain peak performance & prevent lifestyle diseases",
    icon: "⚡",
    color: "#2563eb",
    categories: [
      {
        name: "Nutrition",
        icon: "🥗",
        tips: [
          "Focus on a balanced Indian plate: 50% vegetables, 25% whole grains (roti/brown rice), 25% protein (dal/chicken/fish).",
          "Reduce sugar intake — Indians consume 2× the recommended amount; swap sweets for jaggery or dates.",
          "Include fermented foods daily: yoghurt (dahi), idli, dosa, kanji — they boost gut health.",
          "Track iron and calcium intake, especially women — include ragi, sesame seeds, and leafy greens.",
          "Cook in cold-pressed mustard, coconut, or groundnut oil — avoid repeated reheating of cooking oils.",
        ],
      },
      {
        name: "Exercise",
        icon: "🏃",
        tips: [
          "Combine strength training (3×/week) with cardio (150 min/week) — protects heart and bones into old age.",
          "Practice Yoga asanas: Bhujangasana, Setu Bandhasana, Virabhadrasana for desk-worker posture issues.",
          "Walk 8,000–10,000 steps daily; use stairs whenever possible.",
          "Do 5-minute micro-stretches every 2 hours during work to prevent back and neck pain.",
          "Maintain flexibility with weekly sessions of Yoga or dynamic stretching.",
        ],
      },
      {
        name: "Ayurveda & Tradition",
        icon: "🪷",
        tips: [
          "Take Ashwagandha (300–600 mg) after consulting a doctor — it reduces cortisol and stress.",
          "Practice Abhyanga (warm oil self-massage) weekly with sesame oil to calm Vata and improve circulation.",
          "Drink golden milk (haldi doodh) before bed — turmeric is a powerful anti-inflammatory.",
          "Follow seasonal Ritucharya: light food in summer, warm soups in winter, astringent tastes in monsoon.",
          "Use Amla (Indian gooseberry) — eat fresh, or as murabba or powder — richest Vitamin C source.",
        ],
      },
      {
        name: "Mental Health",
        icon: "🧘",
        tips: [
          "Meditate 15 minutes daily — guided apps like Headspace can help beginners.",
          "Set boundaries between work and personal life; avoid checking emails after hours.",
          "Take at least 1 full day off per week with no work — mental recovery is non-negotiable.",
          "Pursue a hobby unrelated to your career — painting, music, gardening — it reduces burnout.",
          "If you feel persistent sadness or anxiety for 2+ weeks, consult a mental health professional.",
        ],
      },
      {
        name: "Preventive Health",
        icon: "🩺",
        tips: [
          "Annual health check: lipid profile, HbA1c, liver function, kidney function, Vitamin D, B12.",
          "Monitor blood pressure at home if family history exists — hypertension is rising in Indian 30-year-olds.",
          "Get an eye test annually — screen time has dramatically increased myopia rates.",
          "Women: do a breast self-exam monthly and Pap smear every 3 years from age 25.",
          "Men: check testicular health and discuss heart risk factors with your doctor.",
        ],
      },
    ],
  },
  "36-50": {
    title: "Midlife Vitality",
    subtitle: "Proactive care to stay ahead of chronic conditions",
    icon: "🛡️",
    color: "#7c3aed",
    categories: [
      {
        name: "Nutrition",
        icon: "🥗",
        tips: [
          "Reduce refined carbs (maida, white rice) — switch to millets (bajra, jowar, ragi) gaining popularity across India.",
          "Increase fibre to 25–30 g/day: oats dalia, flaxseed, vegetables, and whole pulses.",
          "Limit salt to <5 g/day — Indian cuisine is often salt-heavy; use lemon, herbs, and spices instead.",
          "Eat fatty fish (sardine, mackerel) 2×/week or supplement omega-3 — protects heart and brain.",
          "Avoid late-night heavy meals — finish dinner 2–3 hours before sleep as Ayurveda recommends.",
        ],
      },
      {
        name: "Exercise",
        icon: "🏃",
        tips: [
          "Prioritise joint-friendly exercise: brisk walking, swimming, cycling, or elliptical trainers.",
          "Strength train at least 2–3×/week — muscle loss (sarcopenia) begins now; resistance work reverses it.",
          "Include balance exercises (tree pose, single-leg stands) to prevent falls in future decades.",
          "Stretch hamstrings, hip flexors, and shoulders daily — common tightness zones after 35.",
          "If you have knee or back issues, consult a physiotherapist before starting a new routine.",
        ],
      },
      {
        name: "Ayurveda & Tradition",
        icon: "🪷",
        tips: [
          "Take Triphala (½ tsp) at bedtime — supports digestion, detox, and gentle bowel regularity.",
          "Use Brahmi (Bacopa) for cognitive support — studies show it improves memory and focus.",
          "Apply warm sesame oil to joints weekly — reduces Vata-driven stiffness and pain.",
          "Practice Nasya (2 drops sesame oil in each nostril) mornings — Ayurvedic sinus and allergy care.",
          "Follow a Panchakarma detox annually if possible — a deep Ayurvedic renewal programme.",
        ],
      },
      {
        name: "Mental Health",
        icon: "🧘",
        tips: [
          "Address midlife stress proactively — career plateaus, children's education, and elder care pile up.",
          "Practice Yoga Nidra (guided body-scan relaxation) for 20 min — equals 2 hours of deep sleep in benefits.",
          "Stay socially connected — loneliness at this stage strongly predicts future health decline.",
          "Reassess life goals every few years; purpose protects against depression.",
          "Limit alcohol to ≤2 drinks/week — liver recovery slows significantly after 40.",
        ],
      },
      {
        name: "Preventive Health",
        icon: "🩺",
        tips: [
          "Full annual checkup: ECG, lipid profile, HbA1c, thyroid, liver, kidney, Vitamin D, B12, PSA (men).",
          "Get screened for diabetes — India is the diabetes capital; early HbA1c detection saves lives.",
          "Colonoscopy screening from age 45 — colorectal cancer is rising in urban India.",
          "Women: mammogram every 1–2 years; bone density scan (DEXA) after menopause.",
          "Keep a blood-pressure monitor at home and check weekly; note trends for your doctor.",
        ],
      },
    ],
  },
  "51-65": {
    title: "Active Ageing",
    subtitle: "Smart strategies to maintain independence & energy",
    icon: "🌿",
    color: "#f59e0b",
    categories: [
      {
        name: "Nutrition",
        icon: "🥗",
        tips: [
          "Increase protein to 1–1.2 g/kg body weight — dal, paneer, eggs, fish — to fight age-related muscle loss.",
          "Boost calcium (1200 mg/day) and Vitamin D (supplement if <30 ng/mL) — critical for bones.",
          "Eat anti-oxidant-rich Indian foods: turmeric, amla, pomegranate, green tea, walnuts.",
          "Smaller, frequent meals work better now — 3 main meals + 2 healthy snacks.",
          "Stay hydrated even without thirst — thirst sensation diminishes with age; set reminders.",
        ],
      },
      {
        name: "Exercise",
        icon: "🏃",
        tips: [
          "Walk briskly for 30–45 min daily — the single most impactful exercise for this age group.",
          "Include resistance bands or light weights 2–3×/week — preserves bone density and functional strength.",
          "Practice Tai Chi or gentle Yoga — proven to improve balance and reduce fall risk by 40%.",
          "Do Kegel exercises to strengthen pelvic floor — prevents urinary incontinence issues.",
          "Warm up for 10 min before any exercise and cool down after — injury risk is higher now.",
        ],
      },
      {
        name: "Ayurveda & Tradition",
        icon: "🪷",
        tips: [
          "Take Ashwagandha + Shatavari combination for vitality and hormonal balance (consult Vaidya).",
          "Daily Abhyanga with Mahanarayan oil for joint nourishment and pain relief.",
          "Drink warm water infused with cumin, coriander, and fennel seeds — digestive tonic.",
          "Use Haritaki (one of Triphala ingredients) as a Rasayana for longevity and colon health.",
          "Follow Dinacharya (daily routine): wake early, oil pull, tongue scrape, and gentle exercise.",
        ],
      },
      {
        name: "Mental Health",
        icon: "🧘",
        tips: [
          "Stay mentally active: read, solve puzzles, learn a new language or instrument.",
          "Maintain strong social ties — visit family, join community groups, or social clubs.",
          "Practice gratitude meditation — 5 minutes morning and night.",
          "Accept life transitions (retirement, children moving out) as natural; seek counselling if adjustment is hard.",
          "Volunteer — giving back is one of the most powerful antidotes to post-retirement aimlessness.",
        ],
      },
      {
        name: "Preventive Health",
        icon: "🩺",
        tips: [
          "Comprehensive annual checkup: cardiac stress test, HbA1c, lipid+LDL, creatinine, PSA, TSH.",
          "Eye exam annually — glaucoma and cataract screening is essential after 50.",
          "Hearing test every 2 years — early intervention with aids preserves cognitive function.",
          "Monitor blood sugar and BP at home; maintain a log for your physician.",
          "Discuss cancer screening schedule with your doctor: colon, breast, cervical, prostate.",
        ],
      },
    ],
  },
  "66-100": {
    title: "Golden Years",
    subtitle: "Graceful ageing with comfort, dignity & wellness",
    icon: "🌅",
    color: "#ef4444",
    categories: [
      {
        name: "Nutrition",
        icon: "🥗",
        tips: [
          "Choose soft, easily digestible foods: khichdi, daliya, soups, steamed vegetables, curd rice.",
          "Ensure adequate protein (1.2 g/kg) — muscle wasting accelerates after 65; add paneer, eggs, dals.",
          "Supplement Vitamin D (1000–2000 IU) and Calcium as per doctor's advice — fracture prevention.",
          "Eat small, frequent meals every 3 hours — large meals burden a slower digestive system.",
          "Include probiotic foods daily: fresh dahi, buttermilk — gut health affects immunity and mood.",
        ],
      },
      {
        name: "Exercise",
        icon: "🏃",
        tips: [
          "Gentle walking: 20–30 min in morning or evening — fresh air and sunlight boost mood and Vitamin D.",
          "Chair exercises and seated Yoga if mobility is limited — staying active is what matters.",
          "Practice balance exercises daily (hold a wall, stand on one foot) — fall prevention saves lives.",
          "Light stretching for 10 min every morning — eases stiffness and improves circulation.",
          "Avoid high-impact activities; opt for swimming or water aerobics if joints hurt.",
        ],
      },
      {
        name: "Ayurveda & Tradition",
        icon: "🪷",
        tips: [
          "Take Chyawanprash (1 tsp daily) — the classic Rasayana for immunity and vitality in seniors.",
          "Gentle Abhyanga with Bala oil — nourishes Vata, which naturally dominates in old age.",
          "Sip warm ginger-tulsi tea 2–3 times a day — respiratory support and digestion aid.",
          "Use Triphala or Isabgol for gentle bowel regulation — avoid harsh laxatives.",
          "Practice Shavasana (corpse pose) with deep breathing for 15 min daily — deeply restorative.",
        ],
      },
      {
        name: "Mental Health",
        icon: "🧘",
        tips: [
          "Stay socially engaged — isolation is a leading risk factor for cognitive decline.",
          "Spend time with grandchildren or younger family — intergenerational bonds uplift spirits.",
          "Maintain hobbies: reading, gardening, temple visits, music, or light cooking.",
          "If memory lapses are frequent, get a cognitive screening — early intervention helps.",
          "Accept help gracefully; using a walking stick or grab bars is smart, not weak.",
        ],
      },
      {
        name: "Preventive Health",
        icon: "🩺",
        tips: [
          "See your doctor every 3–6 months — proactive monitoring catches issues early.",
          "Review medications annually with your physician — polypharmacy interactions are common.",
          "Annual flu shot and pneumonia vaccine — infections hit harder after 65.",
          "Fall-proof the home: non-slip mats, grab rails, good lighting, remove loose rugs.",
          "Keep emergency contacts and medical ID easily accessible at all times.",
        ],
      },
    ],
  },
};

function getBracket(age) {
  if (age >= 15 && age <= 25) return "15-25";
  if (age >= 26 && age <= 35) return "26-35";
  if (age >= 36 && age <= 50) return "36-50";
  if (age >= 51 && age <= 65) return "51-65";
  if (age >= 66 && age <= 100) return "66-100";
  return null;
}

function HealthTips() {
  const [age, setAge] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const bracket = useMemo(() => (age ? getBracket(Number(age)) : null), [age]);
  const data = bracket ? TIPS_DATA[bracket] : null;

  const handleAgeChange = (e) => {
    const val = e.target.value;
    if (val === "" || (/^\d{1,3}$/.test(val) && Number(val) <= 100)) {
      setAge(val);
      setActiveCategory(0);
    }
  };

  return (
    <div className="ht-page">
      {/* Header */}
      <div className="ht-header">
        <span className="ht-header-icon">🌿</span>
        <h1 className="ht-title">Health &amp; Wellness Tips</h1>
        <p className="ht-subtitle">
          Personalised guidance blending modern medicine with ancient Indian
          Ayurveda — tailored to your age
        </p>
      </div>

      {/* Age Input */}
      <div className="ht-input-section">
        <div className="ht-input-card">
          <label className="ht-input-label" htmlFor="htAge">
            Enter your age to get personalised tips
          </label>
          <div className="ht-input-row">
            <input
              id="htAge"
              type="number"
              min={15}
              max={100}
              placeholder="e.g. 28"
              value={age}
              onChange={handleAgeChange}
              className="ht-age-input"
            />
            <span className="ht-input-hint">Ages 15–100</span>
          </div>

          {age !== "" && !data && (
            <p className="ht-input-error">
              Please enter an age between 15 and 100.
            </p>
          )}
        </div>
      </div>

      {/* Tips content */}
      {data && (
        <div className="ht-content">
          {/* Bracket banner */}
          <div className="ht-bracket-banner" style={{ "--ht-accent": data.color }}>
            <span className="ht-bracket-icon">{data.icon}</span>
            <div>
              <h2 className="ht-bracket-title">{data.title}</h2>
              <p className="ht-bracket-sub">{data.subtitle}</p>
            </div>
            <span className="ht-bracket-age">{bracket} yrs</span>
          </div>

          {/* Category tabs */}
          <div className="ht-tabs">
            {data.categories.map((cat, idx) => (
              <button
                key={cat.name}
                className={`ht-tab ${idx === activeCategory ? "ht-tab--active" : ""}`}
                onClick={() => setActiveCategory(idx)}
                style={
                  idx === activeCategory
                    ? { "--ht-accent": data.color }
                    : undefined
                }
              >
                <span className="ht-tab-icon">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Active tips list */}
          <div className="ht-tips-container">
            <div className="ht-category-header">
              <span className="ht-category-icon">
                {data.categories[activeCategory].icon}
              </span>
              <h3>{data.categories[activeCategory].name}</h3>
            </div>

            <ul className="ht-tips-list">
              {data.categories[activeCategory].tips.map((tip, i) => (
                <li key={i} className="ht-tip-item">
                  <span
                    className="ht-tip-num"
                    style={{ backgroundColor: data.color }}
                  >
                    {i + 1}
                  </span>
                  <span className="ht-tip-text">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* All categories quick view */}
          <div className="ht-all-grid">
            {data.categories.map((cat, idx) => {
              if (idx === activeCategory) return null;
              return (
                <button
                  key={cat.name}
                  className="ht-all-card"
                  onClick={() => setActiveCategory(idx)}
                >
                  <span className="ht-all-card-icon">{cat.icon}</span>
                  <span className="ht-all-card-name">{cat.name}</span>
                  <span className="ht-all-card-count">
                    {cat.tips.length} tips →
                  </span>
                </button>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="ht-disclaimer">
            <strong>Disclaimer:</strong> These tips are for general wellness
            information only. Always consult a qualified physician or Ayurvedic
            practitioner before making significant changes to your diet,
            exercise, or supplement routine.
          </div>
        </div>
      )}

      {/* Illustration when no age entered */}
      {!data && age === "" && (
        <div className="ht-empty">
          <div className="ht-empty-artwork">🧬</div>
          <p>Enter your age above to unlock tailored wellness recommendations</p>
          <div className="ht-empty-tags">
            <span>🥗 Nutrition</span>
            <span>🏃 Exercise</span>
            <span>🪷 Ayurveda</span>
            <span>🧘 Mental Health</span>
            <span>🩺 Preventive Care</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthTips;

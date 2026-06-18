import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, get, remove } from "firebase/database";

const MONTHS = [
  { name: "April", year: 2027, days: 30, startDay: 4 }, // April 1, 2027 = Thursday
  { name: "May", year: 2027, days: 31, startDay: 6 },   // May 1, 2027 = Saturday
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STORAGE_KEY = "trip-unavailable-dates-2027";

function CalendarMonth({ name: month, year, days, startDay, blockedDates, onToggle }) {
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const key = (d) => `${year}-${month}-${d}`;

  return (
    <div style={{
      background: "#FAFAF7",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 2px 24px rgba(27,43,74,0.08)",
      flex: "1",
      minWidth: "280px",
    }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "26px",
        color: "#1B2B4A",
        marginBottom: "20px",
        letterSpacing: "-0.3px",
        fontWeight: 700,
        textAlign: "center",
      }}>
        {month} <span style={{ color: "#E8634A" }}>{year}</span>
      </h2>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            color: "#9BA3B0",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "4px 0",
            fontFamily: "'Inter', sans-serif",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} />;
            const isBlocked = blockedDates.has(key(day));
            return (
              <button
                key={di}
                onClick={() => onToggle(key(day))}
                title={isBlocked ? `Remove ${month} ${day}` : `Block ${month} ${day}`}
                style={{
                  aspectRatio: "1",
                  border: isBlocked ? "2px solid #E8634A" : "2px solid transparent",
                  borderRadius: "10px",
                  background: isBlocked ? "#FDE8E3" : "#EEF2F8",
                  color: isBlocked ? "#C0402A" : "#1B2B4A",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                  fontWeight: isBlocked ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  transition: "all 0.15s ease",
                  position: "relative",
                  padding: 0,
                  lineHeight: 1,
                }}
                onMouseEnter={e => {
                  if (!isBlocked) e.currentTarget.style.background = "#D8E4F2";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isBlocked ? "#FDE8E3" : "#EEF2F8";
                }}
              >
                <span>{day}</span>
                {isBlocked && (
                  <span style={{ fontSize: "9px", marginTop: "1px", color: "#C0402A", fontWeight: 700 }}>✕</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [destinations, setDestinations] = useState(["", "", ""]);
  const [budgetMax, setBudgetMax] = useState("");
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserKey, setCurrentUserKey] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [view, setView] = useState("submit"); // "submit" | "results"
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [resultsUnlocked, setResultsUnlocked] = useState(false);
  const [showResultsGate, setShowResultsGate] = useState(false);
  const [resultsPasswordInput, setResultsPasswordInput] = useState("");
  const [resultsPasswordError, setResultsPasswordError] = useState(false);

  const RESULTS_PASSWORD = "959699";

  // Load all responses on mount
  useEffect(() => {
    loadAllResponses();
  }, []);

  async function loadAllResponses() {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, "responses"));
      const all = {};
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          all[child.key] = child.val();
        });
      }
      setResponses(all);
    } catch (e) {
      console.error("Load error:", e);
    }
    setLoading(false);
  }

  function toggleDate(dateKey) {
    setBlockedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    const storageKey = `resp:${name.trim().toLowerCase().replace(/\s+/g, "_")}`;
    const payload = {
      name: name.trim(),
      blockedDates: [...blockedDates],
      destinations: destinations.map(d => d.trim()).filter(Boolean),
      budgetMax: budgetMax.trim(),
      submittedAt: new Date().toISOString(),
    };
    try {
      await set(ref(db, "responses/" + storageKey.replace("resp:", "")), payload);
      setCurrentUserKey(storageKey);
      setSubmitted(true);
      setSaveError(null);
      await loadAllResponses();
    } catch (e) {
      setSaveError("Couldn't save your response. Please try again.");
    }
  }

  function handleStartOver() {
    setName("");
    setNameInput("");
    setBlockedDates(new Set());
    setDestinations(["", "", ""]);
    setBudgetMax("");
    setSubmitted(false);
    setCurrentUserKey(null);
  }

  // Compute aggregated conflict data
  const allBlocked = {};
  Object.values(responses).forEach(r => {
    (r.blockedDates || []).forEach(d => {
      allBlocked[d] = (allBlocked[d] || []).concat(r.name);
    });
  });

  const totalRespondents = Object.keys(responses).length;

  // Best dates = dates with 0 conflicts
  const allDates = [];
  MONTHS.forEach(({ name: mn, year, days }) => {
    for (let d = 1; d <= days; d++) {
      allDates.push(`${year}-${mn}-${d}`);
    }
  });
  const availableDates = allDates.filter(d => !allBlocked[d]);
  const highConflictDates = Object.entries(allBlocked)
    .filter(([, names]) => names.length >= totalRespondents * 0.5 && totalRespondents > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  function formatDate(key) {
    const parts = key.split("-");
    return `${parts[1]} ${parts[2]}`;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5EFE0",
        fontFamily: "'Inter', sans-serif",
        color: "#1B2B4A",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✈️</div>
          <div style={{ fontSize: "16px", color: "#7A8494" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1B2B4A 0%, #2C4270 40%, #1B2B4A 100%)",
        fontFamily: "'Inter', sans-serif",
        padding: "0 0 60px 0",
      }}>

        {/* Header */}
        <div style={{
          textAlign: "center",
          padding: "52px 24px 36px",
        }}>
          <div style={{
            display: "inline-block",
            background: "rgba(232,99,74,0.15)",
            border: "1px solid rgba(232,99,74,0.3)",
            borderRadius: "100px",
            padding: "6px 18px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#E8634A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}>
            ✈ Trip Planning 2027
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(32px, 6vw, 54px)",
            color: "#F5EFE0",
            margin: "0 0 14px",
            lineHeight: 1.1,
            letterSpacing: "-1px",
          }}>
            When can't you make it?
          </h1>
          <p style={{
            color: "rgba(245,239,224,0.65)",
            fontSize: "17px",
            maxWidth: "480px",
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}>
            Mark the days in April & May 2027 that don't work for you. We'll find the perfect window for everyone.
          </p>

          {/* Tab switcher */}
          <div style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "4px",
          }}>
            <button onClick={() => setView("submit")} style={{
              background: view === "submit" ? "#F5EFE0" : "transparent",
              color: view === "submit" ? "#1B2B4A" : "rgba(245,239,224,0.65)",
              border: "none",
              borderRadius: "9px",
              padding: "9px 22px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}>
              Mark My Dates
            </button>
            <button onClick={() => {
              if (resultsUnlocked) {
                setView("results");
              } else {
                setShowResultsGate(true);
              }
            }} style={{
              background: view === "results" ? "#F5EFE0" : "transparent",
              color: view === "results" ? "#1B2B4A" : "rgba(245,239,224,0.65)",
              border: "none",
              borderRadius: "9px",
              padding: "9px 22px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              🔒 Results
            </button>
          </div>

          {/* Results password gate modal */}
          {showResultsGate && (
            <div style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,18,35,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "16px",
            }}
              onClick={e => { if (e.target === e.currentTarget) { setShowResultsGate(false); setResultsPasswordInput(""); setResultsPasswordError(false); } }}
            >
              <div style={{
                background: "#FAFAF7",
                borderRadius: "20px",
                padding: "36px 32px",
                maxWidth: "380px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 8px 48px rgba(0,0,0,0.3)",
              }}>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#1B2B4A",
                  fontSize: "22px",
                  marginBottom: "8px",
                }}>Results are private</h2>
                <p style={{ color: "#7A8494", fontSize: "14px", marginBottom: "24px", lineHeight: 1.5 }}>
                  Enter the password to view everyone's submissions.
                </p>
                <input
                  type="password"
                  placeholder="Password"
                  value={resultsPasswordInput}
                  autoFocus
                  onChange={e => { setResultsPasswordInput(e.target.value); setResultsPasswordError(false); }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (resultsPasswordInput === RESULTS_PASSWORD) {
                        setResultsUnlocked(true);
                        setShowResultsGate(false);
                        setView("results");
                        setResultsPasswordInput("");
                        setResultsPasswordError(false);
                      } else {
                        setResultsPasswordError(true);
                      }
                    }
                  }}
                  style={{
                    width: "100%",
                    border: resultsPasswordError ? "2px solid #E8634A" : "2px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "16px",
                    fontFamily: "'Inter', sans-serif",
                    color: "#1B2B4A",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "8px",
                    textAlign: "center",
                    letterSpacing: "0.15em",
                  }}
                />
                {resultsPasswordError && (
                  <p style={{ color: "#E8634A", fontSize: "13px", marginBottom: "8px", marginTop: "0" }}>
                    Incorrect password. Try again.
                  </p>
                )}
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button onClick={() => {
                    setShowResultsGate(false);
                    setResultsPasswordInput("");
                    setResultsPasswordError(false);
                  }} style={{
                    flex: 1,
                    background: "transparent",
                    border: "2px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#7A8494",
                    cursor: "pointer",
                  }}>Cancel</button>
                  <button onClick={() => {
                    if (resultsPasswordInput === RESULTS_PASSWORD) {
                      setResultsUnlocked(true);
                      setShowResultsGate(false);
                      setView("results");
                      setResultsPasswordInput("");
                      setResultsPasswordError(false);
                    } else {
                      setResultsPasswordError(true);
                    }
                  }} style={{
                    flex: 1,
                    background: "#1B2B4A",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#F5EFE0",
                    cursor: "pointer",
                  }}>Unlock</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>

          {view === "submit" && !submitted && (
            <>
              {/* Name input */}
              <div style={{
                background: "#FAFAF7",
                borderRadius: "16px",
                padding: "24px 28px",
                marginBottom: "20px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.15)",
              }}>
                <label style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#7A8494",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}>Your name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah"
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); setName(e.target.value); }}
                  style={{
                    width: "100%",
                    border: "2px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "16px",
                    fontFamily: "'Inter', sans-serif",
                    color: "#1B2B4A",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#FAFAF7",
                    transition: "border 0.15s",
                  }}
                  onFocus={e => e.target.style.border = "2px solid #E8634A"}
                  onBlur={e => e.target.style.border = "2px solid #E2E8F0"}
                />
              </div>

              {/* Destinations */}
              <div style={{
                background: "#FAFAF7",
                borderRadius: "16px",
                padding: "24px 28px",
                marginBottom: "20px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.15)",
              }}>
                <label style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#7A8494",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                }}>Top 3 destination wishes</label>
                <p style={{ color: "#9BA3B0", fontSize: "13px", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Where would you love to go? List up to 3 places.
                </p>
                {destinations.map((dest, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "#E8634A",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>{i + 1}</span>
                    <input
                      type="text"
                      placeholder={["e.g. Barcelona", "e.g. Tokyo", "e.g. Costa Rica"][i]}
                      value={dest}
                      onChange={e => {
                        const next = [...destinations];
                        next[i] = e.target.value;
                        setDestinations(next);
                      }}
                      style={{
                        flex: 1,
                        border: "2px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "11px 14px",
                        fontSize: "15px",
                        fontFamily: "'Inter', sans-serif",
                        color: "#1B2B4A",
                        outline: "none",
                        background: "#FAFAF7",
                        transition: "border 0.15s",
                      }}
                      onFocus={e => e.target.style.border = "2px solid #E8634A"}
                      onBlur={e => e.target.style.border = "2px solid #E2E8F0"}
                    />
                  </div>
                ))}
              </div>

              {/* Budget */}
              <div style={{
                background: "#FAFAF7",
                borderRadius: "16px",
                padding: "24px 28px",
                marginBottom: "20px",
                boxShadow: "0 2px 24px rgba(0,0,0,0.15)",
              }}>
                <label style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#7A8494",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                }}>Maximum budget (per person)</label>
                <p style={{ color: "#9BA3B0", fontSize: "13px", margin: "0 0 14px", lineHeight: 1.5 }}>
                  What's the most you'd want to spend per person?
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "120px" }}>
                    <span style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9BA3B0",
                      fontWeight: 600,
                      fontSize: "15px",
                      pointerEvents: "none",
                    }}>$</span>
                    <input
                      type="number"
                      placeholder="e.g. 3000"
                      value={budgetMax}
                      onChange={e => setBudgetMax(e.target.value)}
                      style={{
                        width: "100%",
                        border: "2px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "11px 14px 11px 28px",
                        fontSize: "15px",
                        fontFamily: "'Inter', sans-serif",
                        color: "#1B2B4A",
                        outline: "none",
                        background: "#FAFAF7",
                        boxSizing: "border-box",
                        transition: "border 0.15s",
                      }}
                      onFocus={e => e.target.style.border = "2px solid #E8634A"}
                      onBlur={e => e.target.style.border = "2px solid #E2E8F0"}
                    />
                  </div>
                </div>
              </div>

              {/* Instruction */}
              <div style={{
                textAlign: "center",
                color: "rgba(245,239,224,0.6)",
                fontSize: "14px",
                marginBottom: "20px",
              }}>
                Click any date below to mark it as unavailable — click again to unmark
              </div>

              {/* Calendars */}
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "24px" }}>
                {MONTHS.map(m => (
                  <CalendarMonth
                    key={m.name}
                    {...m}
                    blockedDates={blockedDates}
                    onToggle={toggleDate}
                  />
                ))}
              </div>

              {/* Summary of selected */}
              {blockedDates.size > 0 && (
                <div style={{
                  background: "rgba(232,99,74,0.12)",
                  border: "1px solid rgba(232,99,74,0.25)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  color: "#F5EFE0",
                  fontSize: "14px",
                }}>
                  <span style={{ fontWeight: 700, color: "#E8A090" }}>
                    {blockedDates.size} date{blockedDates.size !== 1 ? "s" : ""} marked as unavailable
                  </span>
                  {" — "}
                  {[...blockedDates].sort().map(formatDate).join(", ")}
                </div>
              )}

              {saveError && (
                <div style={{ color: "#E8634A", fontSize: "14px", textAlign: "center", marginBottom: "12px" }}>{saveError}</div>
              )}

              {/* Submit */}
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  style={{
                    background: name.trim() ? "#E8634A" : "#9BA3B0",
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "16px 48px",
                    fontSize: "16px",
                    fontWeight: 700,
                    fontFamily: "'Inter', sans-serif",
                    cursor: name.trim() ? "pointer" : "not-allowed",
                    letterSpacing: "0.02em",
                    transition: "all 0.2s",
                    boxShadow: name.trim() ? "0 4px 20px rgba(232,99,74,0.35)" : "none",
                  }}
                  onMouseEnter={e => { if (name.trim()) e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Submit My Availability →
                </button>
                {!name.trim() && (
                  <p style={{ color: "rgba(245,239,224,0.45)", fontSize: "13px", marginTop: "10px" }}>
                    Enter your name above to submit
                  </p>
                )}
              </div>
            </>
          )}

          {view === "submit" && submitted && (
            <div style={{
              background: "#FAFAF7",
              borderRadius: "20px",
              padding: "48px 32px",
              textAlign: "center",
              boxShadow: "0 2px 24px rgba(0,0,0,0.15)",
            }}>
              <div style={{ fontSize: "52px", marginBottom: "16px" }}>🌍</div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "30px",
                color: "#1B2B4A",
                marginBottom: "10px",
              }}>You're all set, {name}!</h2>
              <p style={{ color: "#7A8494", fontSize: "16px", marginBottom: "28px", lineHeight: 1.6 }}>
                {blockedDates.size === 0
                  ? "Looks like you're fully flexible — every day works for you!"
                  : `We've saved your ${blockedDates.size} unavailable date${blockedDates.size !== 1 ? "s" : ""}.`}
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { if (resultsUnlocked) { setView("results"); } else { setShowResultsGate(true); } }} style={{
                  background: "#1B2B4A",
                  color: "#F5EFE0",
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 28px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                  View Group Results
                </button>
                <button onClick={handleStartOver} style={{
                  background: "transparent",
                  color: "#7A8494",
                  border: "2px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "13px 28px",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                  Submit Another
                </button>
              </div>
            </div>
          )}

          {view === "results" && (
            <div>
              {totalRespondents === 0 ? (
                <div style={{
                  background: "#FAFAF7",
                  borderRadius: "20px",
                  padding: "48px 32px",
                  textAlign: "center",
                  boxShadow: "0 2px 24px rgba(0,0,0,0.15)",
                }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>🗓️</div>
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "26px",
                    color: "#1B2B4A",
                    marginBottom: "10px",
                  }}>No responses yet</h2>
                  <p style={{ color: "#7A8494", fontSize: "15px" }}>Be the first to submit your availability!</p>
                </div>
              ) : (
                <>
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {[
                      { label: "Responses", value: totalRespondents, icon: "👥" },
                      { label: "Conflict-Free Days", value: availableDates.length, icon: "✅" },
                      { label: "Days with Conflicts", value: Object.keys(allBlocked).length, icon: "⚠️" },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: "#FAFAF7",
                        borderRadius: "14px",
                        padding: "20px 24px",
                        flex: "1",
                        minWidth: "140px",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.icon}</div>
                        <div style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "32px",
                          fontWeight: 700,
                          color: "#1B2B4A",
                          lineHeight: 1,
                        }}>{s.value}</div>
                        <div style={{ color: "#9BA3B0", fontSize: "13px", fontWeight: 500, marginTop: "4px" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Who responded */}
                  <div style={{
                    background: "#FAFAF7",
                    borderRadius: "16px",
                    padding: "24px 28px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#1B2B4A",
                      fontSize: "20px",
                      marginBottom: "16px",
                    }}>Who's responded</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {Object.values(responses).map(r => (
                        <div key={r.name} style={{
                          background: "#EEF2F8",
                          borderRadius: "100px",
                          padding: "7px 16px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1B2B4A",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}>
                          <span style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#1B2B4A",
                            color: "#F5EFE0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {r.name[0].toUpperCase()}
                          </span>
                          {r.name}
                          {r.blockedDates?.length > 0 && (
                            <span style={{ color: "#E8634A", fontSize: "12px" }}>
                              {r.blockedDates.length} blocked
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination votes */}
                  {(() => {
                    const destCount = {};
                    Object.values(responses).forEach(r => {
                      (r.destinations || []).forEach(d => {
                        if (d) destCount[d] = (destCount[d] || 0) + 1;
                      });
                    });
                    const sorted = Object.entries(destCount).sort((a, b) => b[1] - a[1]);
                    if (sorted.length === 0) return null;
                    return (
                      <div style={{
                        background: "#FAFAF7",
                        borderRadius: "16px",
                        padding: "24px 28px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                      }}>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif",
                          color: "#1B2B4A",
                          fontSize: "20px",
                          marginBottom: "6px",
                        }}>Destination wishes</h3>
                        <p style={{ color: "#9BA3B0", fontSize: "13px", marginBottom: "18px" }}>
                          All destinations mentioned, ranked by popularity
                        </p>
                        {sorted.map(([dest, count], idx) => (
                          <div key={dest} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 0",
                            borderBottom: idx < sorted.length - 1 ? "1px solid #E8EDF5" : "none",
                          }}>
                            <span style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: idx === 0 ? "#E8634A" : idx === 1 ? "#F0A080" : "#D8E4F2",
                              color: idx < 2 ? "#fff" : "#1B2B4A",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}>{idx + 1}</span>
                            <span style={{ fontWeight: 600, color: "#1B2B4A", fontSize: "15px", flex: 1 }}>{dest}</span>
                            <span style={{
                              background: "#EEF2F8",
                              borderRadius: "100px",
                              padding: "3px 12px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#4A5568",
                            }}>
                              {count} vote{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                        <div style={{ marginTop: "20px" }}>
                          <p style={{ color: "#9BA3B0", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                            Individual picks
                          </p>
                          {Object.values(responses).filter(r => r.destinations?.length > 0).map(r => (
                            <div key={r.name} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap" }}>
                              <span style={{
                                fontWeight: 700,
                                color: "#1B2B4A",
                                fontSize: "13px",
                                minWidth: "80px",
                              }}>{r.name}:</span>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {r.destinations.map((d, i) => (
                                  <span key={i} style={{
                                    background: "#EEF2F8",
                                    borderRadius: "6px",
                                    padding: "2px 10px",
                                    fontSize: "13px",
                                    color: "#4A5568",
                                  }}>{i + 1}. {d}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Budget ranges */}
                  {(() => {
                    const budgets = Object.values(responses).filter(r => r.budgetMax);
                    if (budgets.length === 0) return null;
                    const maxs = budgets.map(r => Number(r.budgetMax)).filter(n => n > 0);
                    const lowestMax = maxs.length > 0 ? Math.min(...maxs) : null;
                    return (
                      <div style={{
                        background: "#FAFAF7",
                        borderRadius: "16px",
                        padding: "24px 28px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                      }}>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif",
                          color: "#1B2B4A",
                          fontSize: "20px",
                          marginBottom: "6px",
                        }}>Budget ranges</h3>
                        <p style={{ color: "#9BA3B0", fontSize: "13px", marginBottom: "18px" }}>Max budget per person submitted by the group</p>
                        {lowestMax && (
                          <div style={{
                            background: "linear-gradient(135deg, #EEF6EE, #D8F0D8)",
                            border: "1px solid #A8D8A8",
                            borderRadius: "12px",
                            padding: "14px 18px",
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}>
                            <span style={{ fontSize: "20px" }}>✅</span>
                            <div>
                              <div style={{ fontWeight: 700, color: "#2D6A2D", fontSize: "14px" }}>Group cap (lowest max)</div>
                              <div style={{ color: "#3A8A3A", fontSize: "15px", fontWeight: 600 }}>
                                Up to ${lowestMax.toLocaleString()} per person
                              </div>
                            </div>
                          </div>
                        )}
                        {budgets.map(r => (
                          <div key={r.name} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 0",
                            borderBottom: "1px solid #E8EDF5",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: "#1B2B4A",
                                color: "#F5EFE0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}>{r.name[0].toUpperCase()}</span>
                              <span style={{ fontWeight: 600, color: "#1B2B4A", fontSize: "14px" }}>{r.name}</span>
                            </div>
                            <span style={{
                              background: "#EEF2F8",
                              borderRadius: "100px",
                              padding: "4px 14px",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#4A5568",
                            }}>
                              Up to ${Number(r.budgetMax).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Most conflicted dates */}
                  {highConflictDates.length > 0 && (
                    <div style={{
                      background: "#FAFAF7",
                      borderRadius: "16px",
                      padding: "24px 28px",
                      marginBottom: "20px",
                      boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                    }}>
                      <h3 style={{
                        fontFamily: "'Playfair Display', serif",
                        color: "#1B2B4A",
                        fontSize: "20px",
                        marginBottom: "16px",
                      }}>Most conflicted dates</h3>
                      {highConflictDates.map(([dateKey, names]) => (
                        <div key={dateKey} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          borderBottom: "1px solid #E8EDF5",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}>
                          <div>
                            <span style={{ fontWeight: 700, color: "#1B2B4A", fontSize: "15px" }}>
                              {formatDate(dateKey)}
                            </span>
                            <span style={{ color: "#9BA3B0", fontSize: "13px", marginLeft: "10px" }}>
                              {names.join(", ")}
                            </span>
                          </div>
                          <div style={{
                            background: names.length === totalRespondents ? "#FDE8E3" : "#FEF3CF",
                            color: names.length === totalRespondents ? "#C0402A" : "#92620A",
                            borderRadius: "100px",
                            padding: "4px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}>
                            {names.length}/{totalRespondents} unavailable
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full conflict calendar heatmap */}
                  <div style={{
                    background: "#FAFAF7",
                    borderRadius: "16px",
                    padding: "24px 28px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "#1B2B4A",
                      fontSize: "20px",
                      marginBottom: "6px",
                    }}>Conflict heatmap</h3>
                    <p style={{ color: "#9BA3B0", fontSize: "13px", marginBottom: "20px" }}>
                      Darker = more people unavailable
                    </p>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                      {MONTHS.map(({ name: mn, year, days, startDay }) => {
                        const cells = [];
                        for (let i = 0; i < startDay; i++) cells.push(null);
                        for (let d = 1; d <= days; d++) cells.push(d);
                        while (cells.length % 7 !== 0) cells.push(null);
                        const weeks = [];
                        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

                        return (
                          <div key={mn} style={{ flex: 1, minWidth: "260px" }}>
                            <div style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: "20px",
                              color: "#1B2B4A",
                              marginBottom: "12px",
                              fontWeight: 700,
                            }}>{mn}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "6px" }}>
                              {DAY_LABELS.map(d => (
                                <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "#C0C8D4", fontWeight: 600, textTransform: "uppercase" }}>{d}</div>
                              ))}
                            </div>
                            {weeks.map((week, wi) => (
                              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
                                {week.map((day, di) => {
                                  if (!day) return <div key={di} />;
                                  const dk = `${year}-${mn}-${day}`;
                                  const count = (allBlocked[dk] || []).length;
                                  const ratio = totalRespondents > 0 ? count / totalRespondents : 0;
                                  const bg = ratio === 0
                                    ? "#EEF6EE"
                                    : ratio <= 0.33
                                    ? `rgba(232,99,74,${0.2 + ratio * 0.5})`
                                    : ratio <= 0.66
                                    ? `rgba(232,99,74,${0.45 + ratio * 0.3})`
                                    : `rgba(232,99,74,${0.7 + ratio * 0.3})`;
                                  return (
                                    <div key={di} title={count > 0 ? `${(allBlocked[dk] || []).join(", ")} unavailable` : "No conflicts"} style={{
                                      aspectRatio: "1",
                                      borderRadius: "6px",
                                      background: bg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      color: ratio > 0.5 ? "#fff" : ratio > 0 ? "#C0402A" : "#5A9A6A",
                                    }}>
                                      {day}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", fontSize: "12px", color: "#9BA3B0" }}>
                      <span>Fewer conflicts</span>
                      {[0, 0.25, 0.5, 0.75, 1].map(r => (
                        <div key={r} style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          background: r === 0 ? "#EEF6EE" : `rgba(232,99,74,${0.2 + r * 0.8})`,
                        }} />
                      ))}
                      <span>More conflicts</span>
                    </div>
                  </div>

                  {/* Admin: clear data */}
                  {!showAdminPrompt ? (
                    <div style={{ textAlign: "center", marginTop: "8px" }}>
                      <button onClick={() => setShowAdminPrompt(true)} style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(245,239,224,0.25)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}>⚙ Admin</button>
                    </div>
                  ) : (
                    <div style={{
                      background: "rgba(255,255,255,0.07)",
                      borderRadius: "12px",
                      padding: "16px 20px",
                      textAlign: "center",
                    }}>
                      <p style={{ color: "rgba(245,239,224,0.6)", fontSize: "13px", marginBottom: "10px" }}>
                        Enter admin password to clear all responses:
                      </p>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                        <input
                          type="password"
                          placeholder="Password"
                          value={adminInput}
                          onChange={e => setAdminInput(e.target.value)}
                          style={{
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            background: "rgba(255,255,255,0.1)",
                            color: "#F5EFE0",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                        <button onClick={async () => {
                          if (adminInput === "tripplanner2027") {
                            await remove(ref(db, "responses"));
                            await loadAllResponses();
                            setShowAdminPrompt(false);
                            setAdminInput("");
                          } else {
                            alert("Incorrect password");
                          }
                        }} style={{
                          background: "#E8634A",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: "13px",
                        }}>Clear All</button>
                        <button onClick={() => setShowAdminPrompt(false)} style={{
                          background: "transparent",
                          color: "rgba(245,239,224,0.5)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

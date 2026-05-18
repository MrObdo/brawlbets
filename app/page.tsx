"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const BET_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/place-bet"

const SETTLE_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/settle-match"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [coins, setCoins] = useState(1000)
  const [matches, setMatches] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [stake, setStake] = useState(100)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      setUser(u)

      if (!u) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", u.id)
        .single()

      if (profile) setCoins(profile.coins)

      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("is_open", true)

      setMatches(matchData || [])

      const { data: board } = await supabase
        .from("profiles")
        .select("*")
        .order("coins", { ascending: false })
        .limit(10)

      setLeaderboard(board || [])

      setLoading(false)
    }

    init()
  }, [])

  async function login() {
    const email = prompt("Enter email")
    if (!email) return
    await supabase.auth.signInWithOtp({ email })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  function selectBet(match: any, team: string, odds: number) {
    setSelected({ match, team, odds })
  }

  async function placeBet() {
    if (!user || !selected) return

    const res = await fetch(BET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        match_id: selected.match.id,
        team: selected.team,
        amount: stake,
        odds: selected.odds
      })
    })

    if (!res.ok) {
      setMessage("Bet failed")
      return
    }

    setMessage(`Bet placed on ${selected.team}`)
    setSelected(null)

    const { data } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single()

    if (data) setCoins(data.coins)
  }

  async function setWinner(match: any, winner: string) {
    const res = await fetch(SETTLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: match.id,
        winner
      })
    })

    if (!res.ok) {
      setMessage("Settlement failed")
      return
    }

    setMessage(`MATCH SETTLED: ${winner}`)
  }

  if (loading) {
    return (
      <div className="screen">
        <div className="loader pulse">Loading live markets...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="screen bg">
        <div className="auth popIn">
          <div className="logo glow">BrawlBets</div>
          <div className="sub">Predict. Bet. Win.</div>
          <button onClick={login} className="btnPrimary press">
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg">
      {/* HEADER */}
      <div className="header slideDown">
        <div>
          <div className="logoSmall glowText">BrawlBets</div>
          <div className="email">{user.email}</div>
        </div>

        <div className="right">
          <div className="coin pulseSoft">💰 {coins}</div>
          <button onClick={() => setIsAdmin(!isAdmin)} className="ghost press">
            Admin
          </button>
          <button onClick={logout} className="ghost press">
            Logout
          </button>
        </div>
      </div>

      {message && <div className="toast popIn">{message}</div>}

      <div className="layout">
        {/* MAIN */}
        <div>
          <div className="sectionTitle">🔥 Live Matches</div>

          {matches.map((m, i) => (
            <div key={m.id} className="card popIn" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="live pulse">LIVE</div>

              <div className="match">
                <span>{m.team_a}</span>
                <span className="vs">VS</span>
                <span>{m.team_b}</span>
              </div>

              <div className="odds">Odds {m.odds_a} • {m.odds_b}</div>

              <div className="buttons">
                <button className="green press" onClick={() => selectBet(m, m.team_a, m.odds_a)}>
                  {m.team_a}
                </button>

                <button className="red press" onClick={() => selectBet(m, m.team_b, m.odds_b)}>
                  {m.team_b}
                </button>
              </div>

              {isAdmin && (
                <div className="admin">
                  <button onClick={() => setWinner(m, m.team_a)}>Set A</button>
                  <button onClick={() => setWinner(m, m.team_b)}>Set B</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* SIDE */}
        <div className="side popIn">
          <div className="sectionTitle">🏆 Leaderboard</div>

          {leaderboard.map((u, i) => (
            <div key={u.id} className="row hoverRow">
              <span className="rank">#{i + 1}</span>
              <span>{u.coins} 💰</span>
            </div>
          ))}
        </div>
      </div>

      {/* BET SLIP */}
      {selected && (
        <div className="slip slideUp">
          <div className="slipTitle">Bet Slip</div>

          <div className="slipText">
            {selected.match.team_a} vs {selected.match.team_b}
          </div>

          <div className="slipText">Bet: {selected.team}</div>
          <div className="slipText">Odds: {selected.odds}</div>

          <input
            type="number"
            value={stake}
            onChange={e => setStake(Number(e.target.value))}
          />

          <button className="confirm press" onClick={placeBet}>
            Confirm Bet
          </button>

          <button className="cancel press" onClick={() => setSelected(null)}>
            Cancel
          </button>
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        /* ===== BASE ===== */
        .bg {
          min-height: 100vh;
          padding: 16px;
          color: white;
          font-family: system-ui;
          background:
            radial-gradient(circle at 20% 20%, #1d2b4f, transparent 40%),
            radial-gradient(circle at 80% 0%, #3a1d4f, transparent 40%),
            #060913;
        }

        /* ===== ANIMATIONS ===== */
        .popIn {
          animation: popIn 0.4s ease forwards;
        }

        .slideDown {
          animation: slideDown 0.4s ease;
        }

        .slideUp {
          animation: slideUp 0.35s ease;
        }

        .pulse {
          animation: pulse 1.2s infinite;
        }

        .pulseSoft {
          animation: pulseSoft 2s infinite;
        }

        @keyframes popIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes pulseSoft {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* ===== HEADER ===== */
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .logoSmall {
          font-size: 20px;
          font-weight: 800;
        }

        .glowText {
          text-shadow: 0 0 10px rgba(99,102,241,0.6);
        }

        .email {
          font-size: 11px;
          opacity: 0.6;
        }

        .right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .coin {
          background: rgba(255,255,255,0.08);
          padding: 6px 10px;
          border-radius: 999px;
        }

        /* ===== LAYOUT ===== */
        .layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .layout {
            grid-template-columns: 1fr 320px;
          }
        }

        /* ===== CARD ===== */
        .card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 14px;
          border-radius: 16px;
          margin-bottom: 10px;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .card:hover {
          transform: translateY(-2px);
          transition: 0.2s;
        }

        .live {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ef4444;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
        }

        .match {
          font-size: 16px;
          font-weight: 700;
          text-align: center;
        }

        .vs {
          opacity: 0.4;
          margin: 0 6px;
        }

        .odds {
          text-align: center;
          font-size: 12px;
          opacity: 0.7;
        }

        .buttons {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        button {
          border: none;
          padding: 10px;
          border-radius: 10px;
          color: white;
          cursor: pointer;
        }

        .green {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          flex: 1;
        }

        .red {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          flex: 1;
        }

        .ghost {
          background: rgba(255,255,255,0.08);
        }

        .press:active {
          transform: scale(0.96);
        }

        /* ===== SIDE ===== */
        .side {
          background: rgba(255,255,255,0.04);
          padding: 14px;
          border-radius: 16px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
        }

        .hoverRow:hover {
          opacity: 0.7;
        }

        .rank {
          opacity: 0.6;
        }

        /* ===== BET SLIP ===== */
        .slip {
          position: fixed;
          bottom: 14px;
          right: 14px;
          width: 260px;
          background: #0f172a;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .slipTitle {
          font-weight: 700;
          margin-bottom: 8px;
        }

        .slipText {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        input {
          width: 100%;
          padding: 8px;
          margin: 10px 0;
          border-radius: 8px;
          border: none;
        }

        .confirm {
          width: 100%;
          background: #3b82f6;
          margin-bottom: 6px;
        }

        .cancel {
          width: 100%;
          background: #374151;
        }

        /* ===== HEADER TEXT ===== */
        .toast {
          margin-bottom: 10px;
          color: #60a5fa;
        }

        /* ===== AUTH ===== */
        .screen {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .auth {
          text-align: center;
        }

        .logo {
          font-size: 40px;
          font-weight: 800;
          text-shadow: 0 0 20px rgba(99,102,241,0.5);
        }

        .sub {
          opacity: 0.6;
          margin-bottom: 10px;
        }

        .btnPrimary {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          padding: 10px 16px;
          border-radius: 10px;
        }

        .loader {
          opacity: 0.6;
        }
      `}</style>
    </div>
  )
}

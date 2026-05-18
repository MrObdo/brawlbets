"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const BET_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/place-bet"

const SETTLE_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/settle-match"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [coins, setCoins] = useState(1000)
  const [matches, setMatches] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  const [selected, setSelected] = useState<any>(null)
  const [stake, setStake] = useState(100)

  const [msg, setMsg] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    init()
  }, [])

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

  async function loginWithGoogle() {
    setAuthLoading(true)

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://brawlbets.vercel.app"
      }
    })

    setAuthLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  function selectBet(match: any, team: string, odds: number) {
    setSelected({ match, team, odds })
  }

  async function placeBet() {
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

    if (!res.ok) return setMsg("Bet failed")

    setMsg("Bet placed successfully 🎯")
    setSelected(null)

    const { data } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single()

    if (data) setCoins(data.coins)
  }

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="screen">
        <div className="loader">Loading markets...</div>

        <style jsx>{`
          .screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, #1b2b50, #06070f);
            color: white;
          }

          .loader {
            animation: pulse 1.2s infinite;
            opacity: 0.7;
          }

          @keyframes pulse {
            0%,100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  /* ---------------- LOGIN ---------------- */
  if (!user) {
    return (
      <div className="login">
        <div className="card">
          <div className="logo">BrawlBets</div>
          <div className="sub">Predict • Bet • Dominate</div>

          <button onClick={loginWithGoogle} disabled={authLoading}>
            {authLoading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>

        <style jsx>{`
          .login {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at top, #1b2b50, transparent 55%),
              radial-gradient(circle at bottom, #3a1b4f, transparent 55%),
              #06070f;
          }

          .card {
            width: 340px;
            padding: 28px;
            border-radius: 18px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(16px);
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          }

          .logo {
            font-size: 32px;
            font-weight: 900;
            background: linear-gradient(90deg, #60a5fa, #a78bfa, #fb7185);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .sub {
            opacity: 0.7;
            margin-bottom: 18px;
          }

          button {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: 0.2s;
          }

          button:hover {
            transform: scale(1.03);
          }
        `}</style>
      </div>
    )
  }

  /* ---------------- MAIN APP ---------------- */
  return (
    <div className="bg">
      <div className="top">
        <div>
          <div className="title">BrawlBets</div>
          <div className="email">{user.email}</div>
        </div>

        <div className="right">
          <div className="coins">💰 {coins}</div>
          <button onClick={() => setIsAdmin(!isAdmin)}>Admin</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      <div className="grid">
        {/* MATCHES */}
        <div>
          <div className="section">🔥 Live Matches</div>

          {matches.map((m, i) => (
            <div className="card" key={m.id} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="live">LIVE</div>

              <div className="match">
                {m.team_a} <span>VS</span> {m.team_b}
              </div>

              <div className="odds">
                Odds: {m.odds_a} • {m.odds_b}
              </div>

              <div className="btns">
                <button onClick={() => selectBet(m, m.team_a, m.odds_a)}>
                  {m.team_a}
                </button>
                <button onClick={() => selectBet(m, m.team_b, m.odds_b)}>
                  {m.team_b}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* LEADERBOARD */}
        <div className="side">
          <div className="section">🏆 Leaderboard</div>

          {leaderboard.map((u, i) => (
            <div className="row" key={u.id}>
              <span>#{i + 1}</span>
              <span>{u.coins}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BET SLIP */}
      {selected && (
        <div className="slip">
          <div className="slipTitle">Bet Slip</div>
          <div className="slipTeam">{selected.team}</div>

          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />

          <button onClick={placeBet}>Confirm Bet</button>
          <button onClick={() => setSelected(null)}>Cancel</button>
        </div>
      )}

      {/* STYLES */}
      <style jsx>{`
        .bg {
          min-height: 100vh;
          padding: 16px;
          color: white;
          background:
            radial-gradient(circle at top, #1b2b50, transparent 55%),
            radial-gradient(circle at bottom, #3a1b4f, transparent 55%),
            #06070f;
        }

        .top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .title {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #fb7185);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .card {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 14px;
          border-radius: 16px;
          margin-bottom: 10px;
          backdrop-filter: blur(16px);
          transition: 0.25s;
          animation: fadeIn 0.35s ease forwards;
          position: relative;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(99,102,241,0.2);
        }

        .live {
          position: absolute;
          top: 10px;
          right: 10px;
          background: linear-gradient(90deg, #ef4444, #f97316);
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          animation: pulse 1.5s infinite;
        }

        .match {
          text-align: center;
          font-weight: 800;
        }

        .match span {
          opacity: 0.6;
        }

        .btns {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        .btns button {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          color: white;
          transition: 0.2s;
        }

        .btns button:first-child {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
        }

        .btns button:last-child {
          background: linear-gradient(135deg, #f97316, #ef4444);
        }

        .btns button:hover {
          transform: scale(1.05);
        }

        .side {
          background: rgba(255,255,255,0.04);
          padding: 14px;
          border-radius: 16px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .slip {
          position: fixed;
          bottom: 16px;
          right: 16px;
          width: 240px;
          background: rgba(15,23,42,0.95);
          border: 1px solid rgba(99,102,241,0.3);
          padding: 14px;
          border-radius: 16px;
          backdrop-filter: blur(16px);
        }

        .slip button {
          width: 100%;
          margin-top: 8px;
          padding: 10px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 700;
        }

        .slip button:first-of-type {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }

        .slip button:last-of-type {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

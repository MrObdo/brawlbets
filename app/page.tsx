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
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  const [selected, setSelected] = useState<any>(null)
  const [stake, setStake] = useState(100)

  const [msg, setMsg] = useState("")

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

  async function login() {
    setLoginLoading(true)
    await supabase.auth.signInWithOtp({ email })
    setLoginLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  function selectBet(m: any, team: string, odds: number) {
    setSelected({ m, team, odds })
  }

  async function placeBet() {
    const res = await fetch(BET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        match_id: selected.m.id,
        team: selected.team,
        amount: stake,
        odds: selected.odds
      })
    })

    if (!res.ok) return setMsg("Bet failed")

    setMsg("Bet placed 🎯")
    setSelected(null)

    const { data } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single()

    if (data) setCoins(data.coins)
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="screen">
        <div className="loader">Loading live markets...</div>

        <style jsx>{`
          .screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #070A12;
            color: white;
          }

          .loader {
            opacity: 0.7;
            animation: pulse 1.5s infinite;
          }

          @keyframes pulse {
            0%,100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  /* ================= LOGIN ================= */
  if (!user) {
    return (
      <div className="loginWrap">
        <div className="loginCard">
          <div className="logo">BrawlBets</div>
          <div className="sub">Predict. Bet. Win.</div>

          <input
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={login} disabled={loginLoading}>
            {loginLoading ? "Sending..." : "Send Magic Link"}
          </button>
        </div>

        <style jsx>{`
          .loginWrap {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at top, #1b2b50, transparent 50%),
              radial-gradient(circle at bottom, #3a1b4f, transparent 50%),
              #06070f;
          }

          .loginCard {
            width: 340px;
            padding: 26px;
            border-radius: 18px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(12px);
            text-align: center;
          }

          .logo {
            font-size: 30px;
            font-weight: 800;
            margin-bottom: 6px;
            color: white;
          }

          .sub {
            opacity: 0.7;
            margin-bottom: 18px;
          }

          input {
            width: 100%;
            padding: 10px;
            border-radius: 10px;
            border: none;
            margin-bottom: 10px;
            outline: none;
          }

          button {
            width: 100%;
            padding: 10px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            cursor: pointer;
            transition: 0.2s;
          }

          button:hover {
            transform: scale(1.02);
          }

          button:disabled {
            opacity: 0.6;
          }
        `}</style>
      </div>
    )
  }

  /* ================= MAIN APP ================= */
  return (
    <div className="bg">
      <div className="topbar">
        <div>
          <div className="title">BrawlBets</div>
          <div className="email">{user.email}</div>
        </div>

        <div className="right">
          <div className="coins">💰 {coins}</div>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      <div className="grid">
        <div>
          <div className="section">🔥 Live Matches</div>

          {matches.map((m, i) => (
            <div className="card" key={m.id} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="live">LIVE</div>

              <div className="match">
                {m.team_a} <span>VS</span> {m.team_b}
              </div>

              <div className="odds">
                {m.odds_a} • {m.odds_b}
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

      {selected && (
        <div className="slip">
          <div>Bet Slip</div>
          <div>{selected.team}</div>

          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />

          <button onClick={placeBet}>Confirm</button>
          <button onClick={() => setSelected(null)}>Close</button>
        </div>
      )}

      <style jsx>{`
        .bg {
          min-height: 100vh;
          padding: 16px;
          color: white;
          background:
            radial-gradient(circle at top, #1b2b50, transparent 50%),
            radial-gradient(circle at bottom, #3a1b4f, transparent 50%),
            #06070f;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .title {
          font-size: 24px;
          font-weight: 800;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .card {
          background: rgba(255,255,255,0.06);
          padding: 14px;
          border-radius: 14px;
          margin-bottom: 10px;
          position: relative;
          backdrop-filter: blur(10px);
          transition: 0.2s;
          animation: fadeIn 0.4s ease forwards;
        }

        .card:hover {
          transform: translateY(-3px);
        }

        .live {
          position: absolute;
          top: 8px;
          right: 8px;
          background: red;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
        }

        .match {
          text-align: center;
          font-weight: 700;
        }

        .btns {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        button {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }

        .side {
          background: rgba(255,255,255,0.04);
          padding: 12px;
          border-radius: 12px;
        }

        .row {
          display: flex;
          justify-content: space-between;
        }

        .slip {
          position: fixed;
          bottom: 16px;
          right: 16px;
          background: #111827;
          padding: 14px;
          border-radius: 12px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

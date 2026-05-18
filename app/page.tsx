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
  const [authLoading, setAuthLoading] = useState(false)

  const [isAdmin, setIsAdmin] = useState(false)

  /* ---------------- INIT ---------------- */
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
      .select("coins, is_admin")
      .eq("id", u.id)
      .single()

    if (profile) {
      setCoins(profile.coins)
      setIsAdmin(profile.is_admin || false)
    }

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

  /* ---------------- LOGIN ---------------- */
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

  /* ---------------- BET ---------------- */
  async function placeBet() {
    if (!selected) return setMsg("No selection")

    try {
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

      const data = await res.json()

      if (!res.ok) {
        setMsg(data.error || "Bet failed")
        return
      }

      setMsg("Bet placed 🎯")
      setSelected(null)

      const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("id", user.id)
        .single()

      if (profile) setCoins(profile.coins)
    } catch (err) {
      console.error(err)
      setMsg("Network error placing bet")
    }
  }

  function selectBet(match: any, team: string, odds: number) {
    setSelected({ match, team, odds })
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
          }
        `}</style>
      </div>
    )
  }

  /* ---------------- MAIN ---------------- */
  return (
    <div className="bg">
      <div className="top">
        <div>
          <div className="title">BrawlBets</div>
          <div className="email">{user.email}</div>
        </div>

        <div className="right">
          <div className="coins">💰 {coins}</div>
          {isAdmin && <div className="adminTag">ADMIN</div>}
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      <div className="grid">
        <div>
          <div className="section">🔥 Live Matches</div>

          {matches.map((m, i) => (
            <div className="card" key={m.id}>
              <div className="live">LIVE</div>

              <div className="match">
                {m.team_a} <span>VS</span> {m.team_b}
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
          <div>{selected.team}</div>

          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
          />

          <button onClick={placeBet}>Confirm Bet</button>
          <button onClick={() => setSelected(null)}>Cancel</button>
        </div>
      )}

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
        }

        .title {
          font-size: 26px;
          font-weight: 900;
        }

        .adminTag {
          background: red;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .card {
          background: rgba(255,255,255,0.07);
          padding: 14px;
          border-radius: 16px;
          margin-bottom: 10px;
        }

        .live {
          background: red;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
        }

        .btns {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .slip {
          position: fixed;
          bottom: 16px;
          right: 16px;
          width: 240px;
          background: #111827;
          padding: 14px;
          border-radius: 14px;
        }
      `}</style>
    </div>
  )
}

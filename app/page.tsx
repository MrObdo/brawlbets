"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const BET_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/place-bet"

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
      setIsAdmin(profile.is_admin)
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

    const data = await res.json()

    if (!res.ok) {
      setMsg(data.error || "Bet failed")
      return
    }

    setMsg("Bet placed 🔥")
    setSelected(null)

    const { data: profile } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single()

    if (profile) setCoins(profile.coins)
  }

  function selectBet(match: any, team: string, odds: number) {
    setSelected({ match, team, odds })
  }

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="screen">
        <div className="loader">Loading matches...</div>

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
            font-weight: 600;
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
        <div className="loginCard">
          <div className="logo">BrawlBets</div>
          <div className="sub">Predict • Bet • Win</div>

          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: "https://brawlbets.vercel.app"
                }
              })
            }
          >
            Continue with Google
          </button>
        </div>

        <style jsx>{`
          .login {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at top, #1b2b50, transparent 60%),
              radial-gradient(circle at bottom, #3a1b4f, transparent 60%),
              #05060a;
          }

          .loginCard {
            width: 360px;
            padding: 28px;
            border-radius: 18px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(18px);
            text-align: center;
            box-shadow: 0 25px 80px rgba(0,0,0,0.5);
          }

          .logo {
            font-size: 34px;
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

  /* ---------------- MAIN ---------------- */
  return (
    <div className="bg">

      {/* TOP BAR */}
      <div className="top">
        <div>
          <div className="title">BrawlBets</div>
          <div className="email">{user.email}</div>
        </div>

        <div className="stats">
          <div className="coins">💰 {coins}</div>
          {isAdmin && <div className="admin">ADMIN</div>}
        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      {/* MAIN GRID */}
      <div className="grid">

        {/* MATCHES */}
        <div className="sectionBox">
          <div className="sectionTitle">🔥 Live Matches</div>

          {matches.map((m, i) => (
            <div className="matchCard" key={m.id}>
              <div className="live">LIVE</div>

              <div className="matchTitle">
                {m.team_a} <span>VS</span> {m.team_b}
              </div>

              <div className="buttonRow">
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
        <div className="sideBox">
          <div className="sectionTitle">🏆 Leaderboard</div>

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
          <div className="slipTitle">{selected.team}</div>

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
            #05060a;
        }

        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .title {
          font-size: 28px;
          font-weight: 900;
        }

        .stats {
          display: flex;
          gap: 10px;
        }

        .coins {
          background: rgba(255,255,255,0.08);
          padding: 6px 10px;
          border-radius: 10px;
        }

        .admin {
          background: red;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .sectionBox {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sectionTitle {
          font-weight: 800;
          opacity: 0.9;
        }

        .matchCard {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 14px;
          transition: 0.2s;
        }

        .matchCard:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(99,102,241,0.25);
        }

        .live {
          background: linear-gradient(90deg, #ef4444, #f97316);
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .matchTitle {
          font-weight: 800;
          text-align: center;
        }

        .buttonRow {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .buttonRow button {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          cursor: pointer;
        }

        .buttonRow button:first-child {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
        }

        .buttonRow button:last-child {
          background: linear-gradient(135deg, #f97316, #ef4444);
          color: white;
        }

        .sideBox {
          background: rgba(255,255,255,0.05);
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
          padding: 14px;
          border-radius: 16px;
        }

        .slip button {
          width: 100%;
          margin-top: 8px;
          padding: 10px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
        }
      `}</style>

    </div>
  )
}

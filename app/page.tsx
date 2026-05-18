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
  const [username, setUsername] = useState("")
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
      .select("coins, is_admin, username")
      .eq("id", u.id)
      .single()

    if (profile) {
      setCoins(profile.coins)
      setIsAdmin(profile.is_admin)
      setUsername(profile.username)
    }

    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("is_open", true)

    setMatches(matchData || [])

    const { data: board } = await supabase
      .from("profiles")
      .select("username, coins")
      .order("coins", { ascending: false })
      .limit(10)

    setLeaderboard(board || [])

    setLoading(false)
  }

  /* ---------------- AUTH ---------------- */
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://brawlbets.vercel.app"
      }
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  /* ---------------- BET ---------------- */
  async function placeBet() {
    if (!selected) return

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
        <div className="loader">Loading...</div>

        <style jsx>{`
          .screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #05060a;
            color: white;
          }

          .loader {
            animation: pulse 1s infinite;
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
        <div className="box">
          <div className="logo">BrawlBets</div>
          <div className="sub">Predict • Bet • Win</div>

          <button onClick={loginWithGoogle}>Login with Google</button>
        </div>

        <style jsx>{`
          .login {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #05060a;
          }

          .box {
            width: 340px;
            padding: 24px;
            border-radius: 16px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            text-align: center;
          }

          .logo {
            font-size: 28px;
            font-weight: 900;
            color: white;
          }

          .sub {
            opacity: 0.7;
            margin-bottom: 12px;
          }

          button {
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            border: none;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            font-weight: 700;
          }
        `}</style>
      </div>
    )
  }

  /* ---------------- MAIN ---------------- */
  return (
    <div className="bg">

      {/* TOP BAR */}
      <div className="topBar">

        <div>
          <div className="title">BrawlBets</div>
          <div className="subText">{username}</div>
        </div>

        <div className="rightBox">
          <div className="coins">💰 {coins}</div>
          {isAdmin && <div className="admin">ADMIN</div>}
          <button className="logout" onClick={logout}>Logout</button>
        </div>

      </div>

      {/* MSG */}
      {msg && <div className="msg">{msg}</div>}

      <div className="layout">

        {/* MATCHES */}
        <div className="section">

          <div className="sectionTitle">🔥 Matches</div>

          {matches.map((m) => (
            <div className="card" key={m.id}>
              <div className="live">LIVE</div>

              <div className="match">
                {m.team_a} VS {m.team_b}
              </div>

              <div className="btnRow">
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

          <div className="sectionTitle">🏆 Leaderboard</div>

          {leaderboard.map((u, i) => (
            <div className="row" key={i}>
              <span>#{i + 1}</span>
              <span>{u.username}</span>
              <span>{u.coins}</span>
            </div>
          ))}

        </div>

      </div>

      {/* BET MODAL */}
      {selected && (
        <div className="modal">

          <div className="modalBox">

            <div className="modalTitle">
              {selected.team}
            </div>

            <div className="odds">
              Odds: {selected.odds}
            </div>

            <input
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
            />

            <button className="confirm" onClick={placeBet}>
              Confirm Bet
            </button>

            <button onClick={() => setSelected(null)}>
              Cancel
            </button>

          </div>

        </div>
      )}

      <style jsx>{`
        .bg {
          min-height: 100vh;
          padding: 16px;
          color: white;
          background: #05060a;
        }

        .topBar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .title {
          font-size: 28px;
          font-weight: 900;
        }

        .subText {
          opacity: 0.7;
        }

        .rightBox {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .coins {
          background: rgba(255,255,255,0.08);
          padding: 6px 10px;
          border-radius: 10px;
        }

        .logout {
          background: #ef4444;
          border: none;
          padding: 6px 10px;
          border-radius: 10px;
          color: white;
        }

        .layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 16px;
        }

        .card {
          background: rgba(255,255,255,0.06);
          padding: 14px;
          border-radius: 14px;
          margin-bottom: 10px;
        }

        .btnRow {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .btnRow button {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modalBox {
          width: 300px;
          padding: 16px;
          background: #111827;
          border-radius: 16px;
        }

        .confirm {
          background: #22c55e;
          width: 100%;
          margin-top: 10px;
        }
      `}</style>

    </div>
  )
}

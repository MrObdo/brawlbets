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

  const [coins, setCoins] = useState(0)
  const [username, setUsername] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const [matches, setMatches] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  const [selected, setSelected] = useState<any>(null)
  const [stake, setStake] = useState(100)

  const [msg, setMsg] = useState("")
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [tempUsername, setTempUsername] = useState("")

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
      .select("coins, username, is_admin")
      .eq("id", u.id)
      .single()

    if (profile) {
      setCoins(profile.coins ?? 0)
      setIsAdmin(profile.is_admin ?? false)

      if (!profile.username) {
        setShowUsernameModal(true)
      } else {
        setUsername(profile.username)
      }
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
  async function login() {
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

  /* ---------------- USERNAME SAVE ---------------- */
  async function saveUsername() {
    if (!tempUsername || tempUsername.length < 3) {
      setMsg("Username too short")
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: tempUsername })
      .eq("id", user.id)

    if (error) {
      setMsg("Username taken or invalid")
      return
    }

    setUsername(tempUsername)
    setShowUsernameModal(false)
    setMsg("Welcome " + tempUsername)
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
        <div className="loader">Loading BrawlBets...</div>

        <style jsx>{`
          .screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, #0b1220, #05060a);
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
        <div className="card">
          <div className="logo">BrawlBets</div>
          <div className="sub">Predict • Bet • Win</div>

          <button onClick={login}>Continue with Google</button>
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

          .card {
            width: 360px;
            padding: 28px;
            border-radius: 18px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            backdrop-filter: blur(18px);
            text-align: center;
            box-shadow: 0 30px 90px rgba(0,0,0,0.7);
          }

          .logo {
            font-size: 34px;
            font-weight: 900;
            background: linear-gradient(90deg,#60a5fa,#a78bfa,#fb7185);
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
            background: linear-gradient(135deg,#3b82f6,#6366f1);
            color: white;
            font-weight: 700;
            cursor: pointer;
          }
        `}</style>
      </div>
    )
  }

  /* ---------------- USERNAME MODAL ---------------- */
  if (showUsernameModal) {
    return (
      <div className="overlay">
        <div className="modal">
          <h2>Choose username</h2>

          <input
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
            placeholder="username"
          />

          <button onClick={saveUsername}>Continue</button>

          {msg && <p>{msg}</p>}
        </div>

        <style jsx>{`
          .overlay {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #05060a;
            color: white;
          }

          .modal {
            width: 320px;
            padding: 20px;
            border-radius: 16px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
          }

          input {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            border-radius: 10px;
            border: none;
          }

          button {
            width: 100%;
            margin-top: 10px;
            padding: 10px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg,#22c55e,#16a34a);
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

      {/* TOP */}
      <div className="top">
        <div>
          <div className="title">BrawlBets</div>
          <div className="username">{username}</div>
        </div>

        <div className="right">
          <div className="coins">💰 {coins}</div>
          {isAdmin && <div className="admin">ADMIN</div>}
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      {/* GRID */}
      <div className="grid">

        {/* MATCHES */}
        <div>
          <h3>🔥 Matches</h3>

          {matches.map((m) => (
            <div className="card" key={m.id}>
              <div className="live">LIVE</div>

              <div className="match">
                {m.team_a} VS {m.team_b}
              </div>

              <div className="buttons">
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
          <h3>🏆 Leaderboard</h3>

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
        <div className="modalOverlay">
          <div className="betModal">

            <h2>{selected.team}</h2>
            <p>Odds: {selected.odds}</p>

            <input
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
            />

            <button onClick={placeBet}>Confirm Bet</button>
            <button onClick={() => setSelected(null)}>Cancel</button>

          </div>
        </div>
      )}

      <style jsx>{`
        .bg {
          min-height: 100vh;
          padding: 16px;
          color: white;
          background:
            radial-gradient(circle at top,#1b2b50,transparent 60%),
            radial-gradient(circle at bottom,#3a1b4f,transparent 60%),
            #05060a;
        }

        .top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .title {
          font-size: 28px;
          font-weight: 900;
        }

        .username {
          opacity: 0.7;
        }

        .right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .coins {
          background: rgba(255,255,255,0.08);
          padding: 6px 10px;
          border-radius: 10px;
        }

        .admin {
          background: red;
          padding: 4px 8px;
          border-radius: 8px;
        }

        .card {
          background: rgba(255,255,255,0.08);
          padding: 14px;
          border-radius: 14px;
          margin-bottom: 10px;
        }

        .live {
          background: linear-gradient(90deg,#ef4444,#f97316);
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10px;
        }

        .buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .buttons button {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          font-weight: 700;
        }

        .side {
          background: rgba(255,255,255,0.05);
          padding: 14px;
          border-radius: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .betModal {
          width: 320px;
          background: #111827;
          padding: 16px;
          border-radius: 16px;
        }
      `}</style>

    </div>
  )
}

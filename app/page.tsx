"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const BET_URL =
  "https://zukqtpnjzqgliwgnkwql.supabase.co/functions/v1/place-bet"

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
      setMsg("Username taken")
      return
    }

    setUsername(tempUsername)
    setShowUsernameModal(false)
  }

  async function placeBet() {
    if (!selected) return

    setMsg("Placing bet...")

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

  if (loading) {
    return (
      <div className="screen">
        <div className="loader">Loading BrawlBets...</div>

        <style jsx>{`
          .screen {
            height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background: radial-gradient(circle,#0b1220,#05060a);
            color:white;
          }

          .loader {
            animation:pulse 1.2s infinite;
          }

          @keyframes pulse {
            0%,100%{opacity:0.3}
            50%{opacity:1}
          }
        `}</style>
      </div>
    )
  }

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
            height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:
              radial-gradient(circle at top,#1b2b50,transparent 60%),
              radial-gradient(circle at bottom,#3a1b4f,transparent 60%),
              #05060a;
          }

          .card {
            width:360px;
            padding:28px;
            border-radius:18px;
            background: rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.12);
            backdrop-filter:blur(20px);
            text-align:center;
            animation: float 4s ease-in-out infinite;
          }

          @keyframes float {
            0%,100%{transform:translateY(0)}
            50%{transform:translateY(-8px)}
          }

          .logo {
            font-size:36px;
            font-weight:900;
            background: linear-gradient(90deg,#60a5fa,#a78bfa,#fb7185);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
          }

          .sub { opacity:0.7; margin-bottom:16px; }

          button {
            width:100%;
            padding:12px;
            border:none;
            border-radius:12px;
            background: linear-gradient(135deg,#3b82f6,#6366f1);
            color:white;
            font-weight:700;
            cursor:pointer;
            transition:0.2s;
          }

          button:hover {
            transform:scale(1.05);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="bg">

      {/* TOP BAR */}
      <div className="top">

        <div>
          <div className="title">BrawlBets</div>
          <div className="user">{username}</div>
        </div>

        <div className="right">

          <div className="coins">💰 {coins}</div>

          {/* ADMIN BUTTON FIXED */}
          {isAdmin && (
            <button className="adminBtn">
              ADMIN
            </button>
          )}

          {/* LOGOUT BUTTON FIXED */}
          <button className="logoutBtn" onClick={logout}>
            Logout
          </button>

        </div>
      </div>

      {msg && <div className="msg">{msg}</div>}

      <div className="grid">

        {/* MATCHES */}
        <div>
          <h3>🔥 Matches</h3>

          {matches.map((m) => (
            <div className="match" key={m.id}>

              <div className="live">LIVE</div>

              <div className="teams">
                {m.team_a} VS {m.team_b}
              </div>

              {/* ODDS DISPLAY FIX (NEW) */}
              <div className="odds">
                <span>{m.team_a} odds: {m.odds_a}</span>
                <span>{m.team_b} odds: {m.odds_b}</span>
              </div>

              <div className="betRow">

                <button
                  className="green"
                  onClick={() => selectBet(m, m.team_a, m.odds_a)}
                >
                  {m.team_a}
                </button>

                <button
                  className="red"
                  onClick={() => selectBet(m, m.team_b, m.odds_b)}
                >
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
              <span>{u.username || "unknown"}</span>
              <span>{u.coins}</span>
            </div>
          ))}
        </div>

      </div>

      {/* BET MODAL */}
      {selected && (
        <div className="overlay">
          <div className="modal">

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
          min-height:100vh;
          padding:16px;
          color:white;
          background:
            radial-gradient(circle at top,#1b2b50,transparent 60%),
            radial-gradient(circle at bottom,#3a1b4f,transparent 60%),
            #05060a;
        }

        .top {
          display:flex;
          justify-content:space-between;
          margin-bottom:16px;
        }

        .title { font-size:28px; font-weight:900; }

        .user { opacity:0.7; }

        .right {
          display:flex;
          gap:10px;
          align-items:center;
        }

        .coins {
          background:rgba(255,255,255,0.08);
          padding:6px 10px;
          border-radius:10px;
        }

        /* ADMIN BUTTON STYLE FIX */
        .adminBtn {
          background: linear-gradient(135deg,#f59e0b,#ef4444);
          border:none;
          padding:8px 12px;
          border-radius:10px;
          color:white;
          font-weight:700;
          cursor:pointer;
          transition:0.2s;
        }

        .adminBtn:hover {
          transform:scale(1.05);
        }

        /* LOGOUT BUTTON STYLE FIX */
        .logoutBtn {
          background: linear-gradient(135deg,#64748b,#334155);
          border:none;
          padding:8px 12px;
          border-radius:10px;
          color:white;
          font-weight:700;
          cursor:pointer;
          transition:0.2s;
        }

        .logoutBtn:hover {
          transform:scale(1.05);
        }

        .grid {
          display:grid;
          grid-template-columns:1fr 300px;
          gap:16px;
        }

        .match {
          background:rgba(255,255,255,0.08);
          padding:14px;
          border-radius:14px;
          margin-bottom:10px;
          transition:0.3s;
        }

        .match:hover {
          transform:translateY(-6px);
          box-shadow:0 20px 60px rgba(99,102,241,0.3);
        }

        .live {
          background:linear-gradient(90deg,#ef4444,#f97316);
          padding:3px 8px;
          border-radius:999px;
          font-size:10px;
        }

        .odds {
          display:flex;
          justify-content:space-between;
          font-size:12px;
          opacity:0.7;
          margin-top:6px;
        }

        .betRow {
          display:flex;
          gap:10px;
          margin-top:10px;
        }

        .green {
          flex:1;
          background: linear-gradient(135deg,#22c55e,#16a34a);
          border:none;
          padding:10px;
          border-radius:10px;
          color:white;
          font-weight:700;
        }

        .red {
          flex:1;
          background: linear-gradient(135deg,#ef4444,#b91c1c);
          border:none;
          padding:10px;
          border-radius:10px;
          color:white;
          font-weight:700;
        }

        .side {
          background:rgba(255,255,255,0.05);
          padding:14px;
          border-radius:14px;
        }

        .row {
          display:flex;
          justify-content:space-between;
        }

        .overlay {
          position:fixed;
          inset:0;
          background:rgba(0,0,0,0.7);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .modal {
          width:320px;
          background:#111827;
          padding:16px;
          border-radius:16px;
        }

      `}</style>

    </div>
  )
}

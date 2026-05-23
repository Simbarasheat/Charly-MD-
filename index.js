// =======================
// 🚨 ERROR HANDLERS
// =======================
process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

// =======================
// 🌐 EXPRESS
// =======================
const express = require("express")
const path = require("path")
const fs = require("fs")

const app = express()
const startTime = Date.now()

app.use(express.json())
app.use(express.static(__dirname))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// =======================
// 🤖 WHATSAPP BOT
// =======================
const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys")

let sock = null
const recentPairs = new Map()
let activePairing = false

// Vercel /tmp is writable, use it for session
const SESSION_DIR = "/tmp/session"

// =======================
// 📲 PAIR CODE API
// =======================
app.post("/api/pair-code", async (req, res) => {
  try {
    let { phone } = req.body
    if (!phone) return res.status(400).json({ error: "Phone number required" })

    phone = phone.replace(/[^0-9]/g, "")
    if (!/^[0-9]{10,15}$/.test(phone)) return res.status(400).json({ error: "Invalid phone number" })

    // 1 min cooldown
    if (recentPairs.has(phone) && Date.now() - recentPairs.get(phone) < 60000) {
      return res.status(429).json({ error: "Wait 1 minute before requesting again" })
    }

    // Create session dir if not exists
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true })
    }

    // Create socket only when needed
    if (!sock || sock.ws?.readyState !== 1) {
      const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
      const { version } = await fetchLatestBaileysVersion()
      
      sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "22.04.4"],
        syncFullHistory: false,
        markOnlineOnConnect: false
      })
      
      sock.ev.on("creds.update", saveCreds)
      
      // Wait for socket to init
      await new Promise(r => setTimeout(r, 4000))
    }

    if (activePairing) return res.status(429).json({ error: "Pairing already in progress" })

    activePairing = true
    const code = await sock.requestPairingCode(phone)
    recentPairs.set(phone, Date.now())
    activePairing = false

    // Auto close socket after 30s to save memory
    setTimeout(() => {
      if (sock?.ws) {
        try { sock.ws.close() } catch {}
        sock = null
      }
    }, 30000)

    res.json({ success: true, code, expiresIn: "5 minutes" })

  } catch (error) {
    activePairing = false
    console.error("❌ Pair code error:", error)
    res.status(500).json({ error: error.message || "Failed to generate pair code" })
  }
})

// =======================
// 📊 STATUS API
// =======================
app.get("/api/status", (_, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  res.json({
    bot: sock?.ws?.readyState === 1 ? "connected" : "offline",
    uptime: `${hours}h ${minutes}m`,
    version: "2.0.0"
  })
})

// =======================
// ❤️ KEEP ALIVE
// =======================
app.get("/ping", (_, res) => {
  res.send("pong")
})

// =======================
// ❌ 404
// =======================
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// =======================
// 🚀 EXPORT FOR VERCEL
// =======================
module.exports = app
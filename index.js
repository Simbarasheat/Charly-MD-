// =======================
// 🚨 ERROR HANDLERS
// =======================
process.on("uncaughtException", err => console.error("Uncaught:", err))
process.on("unhandledRejection", err => console.error("Unhandled:", err))

const express = require("express")
const path = require("path")
const fs = require("fs")

const app = express()
const startTime = Date.now()

// Always return JSON + parse JSON body
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})
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
const SESSION_DIR = "/tmp/session"

async function initSocket() {
  if (sock?.ws?.readyState === 1) return sock
  
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true })
  }

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
  await new Promise(r => setTimeout(r, 3000))
  return sock
}

// =======================
// 📲 PAIR CODE API
// =======================
app.post("/api/pair-code", async (req, res) => {
  try {
    let { phone } = req.body
    if (!phone) return res.status(400).json({ success: false, error: "Phone number required" })

    phone = phone.replace(/[^0-9]/g, "")
    if (!/^[0-9]{10,15}$/.test(phone)) return res.status(400).json({ success: false, error: "Invalid phone number" })

    // 1 min cooldown
    if (recentPairs.has(phone) && Date.now() - recentPairs.get(phone) < 60000) {
      return res.status(429).json({ success: false, error: "Wait 1 minute before requesting again" })
    }

    if (activePairing) return res.status(429).json({ success: false, error: "Pairing already in progress" })

    activePairing = true
    const socket = await initSocket()
    const code = await socket.requestPairingCode(phone)
    recentPairs.set(phone, Date.now())
    activePairing = false

    // Auto close socket after 30s
    setTimeout(() => {
      if (sock?.ws) {
        try { sock.ws.close() } catch {}
        sock = null
      }
    }, 30000)

    return res.json({ success: true, code, expiresIn: "5 minutes" })

  } catch (error) {
    activePairing = false
    console.error("❌ Pair code error:", error)
    return res.status(500).json({ success: false, error: error.message || "Failed to generate pair code" })
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
    success: true,
    bot: sock?.ws?.readyState === 1 ? "connected" : "offline",
    uptime: `${hours}h ${minutes}m`,
    version: "2.0.0"
  })
})

app.get("/ping", (_, res) => {
  res.json({ success: true, message: "pong" })
})

// 404 handler - always JSON
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ success: false, error: "Internal server error" })
})

module.exports = app
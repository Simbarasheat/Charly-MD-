// =======================
// 🚨 ERROR HANDLERS
// =======================
process.on("uncaughtException", err => console.error("Uncaught:", err))
process.on("unhandledRejection", err => console.error("Unhandled:", err))

// =======================
// 📦 IMPORTS
// =======================
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys")
const express = require("express")
const path = require("path")
const fs = require("fs")
const settings = require("./settings")

// =======================
// 📁 COMMAND HANDLERS - Manual like your screenshot
// =======================
const games = require("./commands/games")
const ai = require("./commands/ai")
const download = require("./commands/download")
const sticker = require("./commands/sticker")
const menu = require("./commands/menu")
const pair = require("./commands/pair") // <- add new commands here

// =======================
// 🌐 EXPRESS APP
// =======================
const app = express()
const startTime = Date.now()

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
let sock = null
const recentPairs = new Map()
let activePairing = false
const SESSION_DIR = "/tmp/session"
let isStarting = false
let retryCount = 0

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

  // =======================
  // 📨 MESSAGE HANDLER
  // =======================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const m = messages[0]
      if (!m.message || m.key.fromMe) return

      const msgType = Object.keys(m.message)[0]
      const text = m.message.conversation || m.message[msgType]?.text || m.message[msgType]?.caption || ""
      const prefix = settings.prefix

      if (!text.startsWith(prefix)) return

      const args = text.slice(prefix.length).trim().split(/ +/)
      const command = args.shift().toLowerCase()

      const context = { sock, m, args, text, command, prefix }

      // =======================
      // RUN COMMAND HANDLERS - Manual order like screenshot
      // =======================
      await games(context)
      await ai(context)
      await download(context)
      await sticker(context)
      await menu(context)
      await pair(context) // <- add here too

    } catch (err) {
      console.error("❌ Message handling error:", err)
    }
  })

  sock.ev.on("connection.update
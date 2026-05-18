// =======================
// 🚨 ERROR HANDLERS
// =======================
process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

// =======================
// 🌐 EXPRESS (WEB PANEL)
// =======================
const express = require("express")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000
const startTime = Date.now()

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

app.use(express.json())
app.use(express.static(path.join(__dirname, "./")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./index.html"))
})

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"))
})

// =======================
// 🤖 WHATSAPP BOT
// =======================
const makeWASocket =
  require("@whiskeysockets/baileys").default

const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")

const BOT_IMAGE =
  "https://files.catbox.moe/37ds7j.png"

// =======================
// 📦 COMMANDS
// =======================
const general = require("./commands/general")
const admin = require("./commands/admin")
const games = require("./commands/games")
const ai = require("./commands/ai")
const download = require("./commands/download")
const sticker = require("./commands/sticker")
const pair = require("./commands/pair")

// =======================
// ⚙️ SETTINGS
// =======================
const PANEL_KEY =
  process.env.PANEL_KEY || "satlimited"

let isStarting = false
let retryCount = 0
const MAX_RETRIES = 5

let sock = null
let latestQR = null
let startupSent = false

const recentPairs = new Map()

// =======================
// 🚀 START BOT
// =======================
async function startBot() {
  if (isStarting) return
  isStarting = true

  console.log("🚀 Starting bot...")

  try {

    // Close old socket safely
    if (sock?.ws) {
      try {
        sock.ws.close()
      } catch {}
    }

    const { state, saveCreds } =
      await useMultiFileAuthState("session")

    const { version } =
      await fetchLatestBaileysVersion()

    sock = makeWASocket({
      version,
      auth: state,
      browser: ["Ubuntu", "Chrome", "22.04.4"]
    })

    sock.ev.on("creds.update", saveCreds)

    // =======================
    // 🔌 CONNECTION HANDLER
    // =======================
    sock.ev.on("connection.update", async (update) => {

      const {
        connection,
        lastDisconnect,
        qr
      } = update

      // Save QR
      if (qr) {
        console.log("📱 New QR received")
        latestQR = qr
      }

      // =======================
      // ✅ CONNECTED
      // =======================
      if (connection === "open") {

        console.log("✅ Bot connected!")

        latestQR = null
        retryCount = 0
        isStarting = false

        if (startupSent) return
        startupSent = true

        try {

          const deployer =
            sock.user?.id?.split(":")[0]

          if (!deployer) return

          setTimeout(async () => {

            try {

              const msg =
                await sock.sendMessage(
                  deployer + "@s.whatsapp.net",
                  {
                    image: { url: BOT_IMAGE },
                    caption: `
🤖 CHARLY MD ACTIVATED

Type .menu for commands

⚡ Version: 2.0.0
👑 Powered by SAT Limited
`
                  }
                )

              // Auto delete after 1 min
              setTimeout(async () => {

                try {

                  await sock.sendMessage(
                    deployer + "@s.whatsapp.net",
                    {
                      delete: msg.key
                    }
                  )

                } catch (e) {
                  console.log(
                    "❌ Auto delete failed:",
                    e
                  )
                }

              }, 60000)

            } catch (e) {

              console.log(
                "❌ Startup message failed:",
                e
              )

            }

          }, 3000)

        } catch (e) {
          console.log(e)
        }
      }

      // =======================
      // ❌ CONNECTION CLOSED
      // =======================
      if (connection === "close") {

        isStarting = false

        const statusCode =
          lastDisconnect?.error?.output?.statusCode

        const shouldReconnect =
          statusCode !== 401

        if (!shouldReconnect) {

          console.log(
            "🚫 Logged out. Delete session folder."
          )

          return
        }

        if (retryCount >= MAX_RETRIES) {

          console.log(
            "🚫 Max retries reached."
          )

          return
        }

        retryCount++

        const delay =
          Math.min(10000 * retryCount, 60000)

        console.log(
          `🔄 Reconnecting in ${delay / 1000}s...`
        )

        setTimeout(() => {
          startBot()
        }, delay)
      }
    })

    // =======================
    // 💬 MESSAGE HANDLER
    // =======================
    sock.ev.on("messages.upsert", async ({
      messages
    }) => {

      try {

        const msg = messages[0]

        if (!msg.message) return

        const from = msg.key.remoteJid

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text

        if (!text) return
        if (!text.startsWith(".")) return

        const args = text.trim().split(" ")

        const command =
          args[0].slice(1).toLowerCase()

        const isGroup =
          from.endsWith("@g.us")

        const sender =
          msg.key.participant ||
          msg.key.remoteJid

        let groupMetadata = null
        let participants = []

        if (isGroup) {

          groupMetadata =
            await sock.groupMetadata(from)

          participants =
            groupMetadata.participants
        }

        const isAdmin = isGroup
          ? participants.find(
              p => p.id === sender
            )?.admin != null
          : false

        const isBotAdmin = isGroup
          ? participants.find(
              p => p.id === sock.user.id
            )?.admin != null
          : false

        const context = {
          sock,
          msg,
          from,
          text,
          args,
          command,
          isGroup,
          isAdmin,
          isBotAdmin,
          sender
        }

        // =======================
        // 📦 COMMANDS
        // =======================
        await general(context)
        await admin(context)
        await ai(context)
        await games(context)
        await download(context)
        await sticker(context)
        await pair(context)

      } catch (err) {

        console.error(
          "❌ Message handling error:",
          err
        )

      }
    })

  } catch (err) {

    console.error(
      "❌ Bot startup error:",
      err
    )

    isStarting = false
  }
}

// =======================
// 📲 PAIR CODE API
// =======================
app.post("/api/pair-code", async (req, res) => {

  try {

    let {
      phone,
      key
    } = req.body

    // Security key
    if (key !== PANEL_KEY) {

      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    if (!phone) {

      return res.status(400).json({
        error: "Phone number required"
      })
    }

    // Clean number
    phone =
      phone.replace(/[^0-9]/g, "")

    // Rate limit
    if (
      recentPairs.has(phone) &&
      Date.now() - recentPairs.get(phone)
      < 60000
    ) {

      return res.status(429).json({
        error:
          "Wait 1 minute before requesting again"
      })
    }

    if (!sock) {

      return res.status(503).json({
        error:
          "Bot still starting"
      })
    }

    // Already paired
    if (
      sock.authState?.creds?.registered
    ) {

      return res.status(400).json({
        error:
          "Bot already paired"
      })
    }

    const code =
      await sock.requestPairingCode(phone)

    recentPairs.set(phone, Date.now())

    res.json({ code })

  } catch (error) {

    console.error(
      "❌ Pair code error:",
      error
    )

    res.status(500).json({
      error:
        error.message ||
        "Failed to generate pair code"
    })
  }
})

// =======================
// 📷 QR CODE API
// =======================
app.get("/api/qr-code", async (req, res) => {

  try {

    if (!latestQR) {

      return res.status(404).json({
        error:
          "QR not available"
      })
    }

    const qr =
      await QRCode.toDataURL(latestQR)

    res.json({ qr })

  } catch (error) {

    console.error(
      "❌ QR generation error:",
      error
    )

    res.status(500).json({
      error:
        "Failed to generate QR"
    })
  }
})

// =======================
// 📊 STATUS API
// =======================
app.get("/api/status", (req, res) => {

  const uptime =
    Math.floor(
      (Date.now() - startTime) / 1000
    )

  const hours =
    Math.floor(uptime / 3600)

  const minutes =
    Math.floor((uptime % 3600) / 60)

  res.json({

    bot:
      sock?.ws?.readyState === 1
        ? "connected"
        : "starting",

    qrAvailable: !!latestQR,

    uptime:
      `${hours}h ${minutes}m`,

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
// ❌ UNKNOWN ROUTES
// =======================
app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  })

})

// =======================
// 🌐 START EXPRESS
// =======================
app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "🌐 Panel running on port",
    PORT
  )

})

// =======================
// 🚀 START BOT
// =======================
startBot()
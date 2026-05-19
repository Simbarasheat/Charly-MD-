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

const app = express()
const PORT = process.env.PORT || 3000
const startTime = Date.now()

app.use(express.json())
app.use(express.static(__dirname))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// =======================
// 🤖 WHATSAPP BOT
// =======================
const makeWASocket =
  require("@whiskeysockets/baileys").default

const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys")

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
let sock = null
let isStarting = false
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

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("session")

    const {
      version
    } = await fetchLatestBaileysVersion()

    sock = makeWASocket({

      version,

      auth: state,

      browser: [
        "Ubuntu",
        "Chrome",
        "22.04.4"
      ],

      printQRInTerminal: false,

      generateHighQualityLinkPreview: false,

      syncFullHistory: false,

      markOnlineOnConnect: false
    })

    sock.ev.on(
      "creds.update",
      saveCreds
    )

    // =======================
    // 🔌 CONNECTION UPDATE
    // =======================
    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update

        // =======================
        // ✅ CONNECTED
        // =======================
        if (connection === "open") {

          console.log(
            "✅ Bot connected!"
          )

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
                    deployer +
                    "@s.whatsapp.net",
                    {
                      image: {
                        url: BOT_IMAGE
                      },

                      caption:
`🤖 CHARLY MD ACTIVATED

Type .menu for commands

⚡ Version: 2.0.0
👑 Powered by SAT Limited`
                    }
                  )

                // Auto delete
                setTimeout(async () => {

                  try {

                    await sock.sendMessage(
                      deployer +
                      "@s.whatsapp.net",
                      {
                        delete: msg.key
                      }
                    )

                  } catch {}

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

          console.log(
            "❌ Connection closed:",
            statusCode
          )

          // Logged out
          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "🚫 Logged out. Delete session folder."
            )

            return
          }

          console.log(
            "⚠ Waiting for manual restart"
          )
        }
      }
    )

    // =======================
    // 💬 MESSAGE HANDLER
    // =======================
    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        try {

          const msg = messages[0]

          if (!msg.message) return

          const from =
            msg.key.remoteJid

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

          if (!text) return
          if (!text.startsWith(".")) return

          const args =
            text.trim().split(" ")

          const command =
            args[0]
            .slice(1)
            .toLowerCase()

          const isGroup =
            from.endsWith("@g.us")

          const sender =
            msg.key.participant ||
            msg.key.remoteJid

          let participants = []

          if (isGroup) {

            const metadata =
              await sock.groupMetadata(from)

            participants =
              metadata.participants
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
            "❌ Message error:",
            err
          )

        }
      }
    )

  } catch (err) {

    console.error(
      "❌ Startup error:",
      err
    )

    isStarting = false
  }
}

// =======================
// 📲 PAIR CODE API
// =======================
app.post(
  "/api/pair-code",
  async (req, res) => {

    try {

      let { phone } = req.body

      if (!phone) {

        return res.status(400).json({
          error:
            "Phone number required"
        })
      }

      // Clean number
      phone =
        phone.replace(/[^0-9]/g, "")

      // Validate
      if (
        !/^[0-9]{10,15}$/
        .test(phone)
      ) {

        return res.status(400).json({
          error:
            "Invalid phone number"
        })
      }

      // Cooldown
      if (
        recentPairs.has(phone)
      ) {

        const last =
          recentPairs.get(phone)

        if (
          Date.now() - last < 60000
        ) {

          return res.status(429).json({
            error:
              "Wait 1 minute before requesting again"
          })
        }
      }

      // Socket check
      if (
        !sock?.ws ||
        sock.ws.readyState !== 1
      ) {

        return res.status(503).json({
          error:
            "WhatsApp not ready yet"
        })
      }

      // Already paired
      if (sock.user) {

        return res.status(400).json({
          error:
            "Bot already paired"
        })
      }

      console.log(
        `📲 Generating code for ${phone}`
      )

      const code =
        await sock.requestPairingCode(
          phone
        )

      recentPairs.set(
        phone,
        Date.now()
      )

      return res.json({
        success: true,
        code
      })

    } catch (error) {

      console.error(
        "❌ Pair code error:",
        error
      )

      return res.status(500).json({
        error:
          error.message ||
          "Failed to generate pair code"
      })
    }
  }
)

// =======================
// 📊 STATUS API
// =======================
app.get("/api/status", (_, res) => {

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
// ❌ 404
// =======================
app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  })

})

// =======================
// 🌐 START EXPRESS
// =======================
app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🌐 Panel running on port ${PORT}`
    )
  }
)

// =======================
// 🚀 START BOT
// =======================
setTimeout(() => {
  startBot()
}, 5000)
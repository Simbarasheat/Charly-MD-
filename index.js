// =======================
// ⚠️ SAFETY + CRASH PROTECTION
// =======================
require("events").EventEmitter.defaultMaxListeners = 50

process.on("uncaughtException", (err) => {
    console.error("🔥 Uncaught Exception:", err)
})

process.on("unhandledRejection", (err) => {
    console.error("🔥 Unhandled Rejection:", err)
})

// =======================
// 🌐 EXPRESS (WEB PANEL)
// =======================
const express = require("express")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"))
})

// =======================
// 🤖 WHATSAPP BOT (BAILEYS)
// =======================
const makeWASocket = require("@whiskeysockets/baileys").default
const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys")

const QRCode = require("qrcode")
const BOT_IMAGE = "https://files.catbox.moe/37ds7j.png"

// COMMAND HANDLERS
const general = require("./commands/general")
const admin = require("./commands/admin")
const games = require("./commands/games")
const ai = require("./commands/ai")
const download = require("./commands/download")
const sticker = require("./commands/sticker")
const pair = require("./commands/pair")

let sock
let isStarting = false
let reconnecting = false
let retryCount = 0
const MAX_RETRIES = 5
let latestQR = null
let startupSent = false

// =======================
// 🔁 START BOT FUNCTION
// =======================
async function startBot() {
    if (isStarting) return
    isStarting = true

    console.log("🚀 Starting bot...")

    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    // =======================
    // 🔌 CONNECTION HANDLER
    // =======================
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log("📱 QR updated")
            latestQR = qr
        }

        if (connection === "open") {
            console.log("✅ Bot connected to WhatsApp")

            reconnecting = false
            isStarting = false
            retryCount = 0

            if (startupSent) return
            startupSent = true

            const user = sock.user?.id?.split(":")[0]

            setTimeout(async () => {
                try {
                    const msg = await sock.sendMessage(
                        user + "@s.whatsapp.net",
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
                            await sock.sendMessage(user + "@s.whatsapp.net", {
                                delete: msg.key
                            })
                        } catch (e) {
                            console.log("Auto delete failed:", e)
                        }
                    }, 60000)

                } catch (e) {
                    console.log("Startup message failed:", e)
                }
            }, 3000)
        }

        if (connection === "close") {
            isStarting = false

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401

            if (!shouldReconnect) {
                console.log("🚫 Session expired. Delete session folder.")
                return
            }

            if (retryCount >= MAX_RETRIES) {
                console.log("🚫 Max retries reached. Stopping bot.")
                return
            }

            if (reconnecting) return
            reconnecting = true

            retryCount++

            const delay = 10000 * retryCount

            console.log(`🔄 Reconnecting in ${delay / 1000}s...`)

            setTimeout(() => {
                reconnecting = false
                startBot()
            }, delay)
        }
    })

    // =======================
    // 💬 MESSAGE HANDLER
    // =======================
    const cooldowns = new Map()

    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0]
            if (!msg.message) return

            const from = msg.key.remoteJid
            const sender = msg.key.participant || from

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text

            if (!text || !text.startsWith(".")) return

            // =======================
            // ⏱️ COOLDOWN SYSTEM
            // =======================
            const now = Date.now()
            if (cooldowns.has(sender)) {
                const expire = cooldowns.get(sender)
                if (now < expire) return
            }
            cooldowns.set(sender, now + 3000)

            const args = text.split(" ")
            const command = args[0].slice(1).toLowerCase()

            const isGroup = from.endsWith("@g.us")

            let groupMetadata = null
            let participants = []

            if (isGroup) {
                groupMetadata = await sock.groupMetadata(from)
                participants = groupMetadata.participants
            }

            const isAdmin = isGroup
                ? participants.find(p => p.id === sender)?.admin
                : false

            const isBotAdmin = isGroup
                ? participants.find(p => p.id === sock.user?.id)?.admin
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

            await general(context)
            await admin(context)
            await ai(context)
            await games(context)
            await download(context)
            await sticker(context)
            await pair(context)

        } catch (err) {
            console.error("❌ Message error:", err)
        }
    })
}

// =======================
// 🔗 API ENDPOINTS
// =======================

// 📲 Pair Code
app.post("/api/pair-code", async (req, res) => {
    try {
        const { phone } = req.body

        if (!phone) {
            return res.status(400).json({ error: "Phone required" })
        }

        if (!sock) {
            return res.status(503).json({ error: "Bot not ready" })
        }

        const code = await sock.requestPairingCode(phone)
        res.json({ code })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to generate code" })
    }
})

// 📷 QR Code
app.get("/api/qr-code", async (req, res) => {
    try {
        if (!latestQR) {
            return res.status(404).json({ error: "QR not ready" })
        }

        const qr = await QRCode.toDataURL(latestQR)
        res.json({ qr })

    } catch (err) {
        res.status(500).json({ error: "QR error" })
    }
})

// Status
app.get("/api/status", (req, res) => {
    res.json({
        bot: sock?.user ? "connected" : "starting",
        qrAvailable: !!latestQR
    })
})

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ error: "Not found" })
})

// =======================
// 🚀 START SERVER + BOT
// =======================
app.listen(PORT, "0.0.0.0", () => {
    console.log("🌐 Panel running on port", PORT)
})

startBot()
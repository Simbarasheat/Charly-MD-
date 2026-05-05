process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

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
// 🤖 WHATSAPP BOT
// =======================
const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const QRCode = require("qrcode")

// COMMANDS
const general = require("./commands/general")
const admin = require("./commands/admin")
const games = require("./commands/games")
const ai = require("./commands/ai")
const download = require("./commands/download")
const sticker = require("./commands/sticker")

let isStarting = false
let retryCount = 0
const MAX_RETRIES = 5
let sock = null

async function startBot() {
    if (isStarting) return
    isStarting = true

    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    // 🔌 CONNECTION HANDLER
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === "open") {
            console.log("✅ Bot connected to WhatsApp!")
            retryCount = 0
        }

        if (connection === "close") {
            isStarting = false

            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== 401

            if (!shouldReconnect) {
                console.log("🚫 Logged out. Delete session and restart.")
                return
            }

            if (retryCount >= MAX_RETRIES) {
                console.log("🚫 Max retries reached. Stopping to avoid ban.")
                return
            }

            retryCount++
            const delay = 10000 * retryCount

            console.log(`🔄 Reconnecting in ${delay / 1000}s...`)

            setTimeout(() => startBot(), delay)
        }
    })

    // 💬 MESSAGE HANDLER
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0]
            if (!msg.message) return

            const from = msg.key.remoteJid
            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text

            if (!text || !text.startsWith(".")) return

            const args = text.split(" ")
            const command = args[0].slice(1).toLowerCase()

            const isGroup = from.endsWith("@g.us")
            const sender = msg.key.participant || msg.key.remoteJid

            let groupMetadata = isGroup ? await sock.groupMetadata(from) : null
            let participants = isGroup ? groupMetadata.participants : []

            const isAdmin = isGroup
                ? participants.find(p => p.id === sender)?.admin !== null
                : false

            const isBotAdmin = isGroup
                ? participants.find(p => p.id === sock.user.id)?.admin !== null
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

        } catch (err) {
            console.error("❌ Message handling error:", err)
        }
    })
}

// =======================
// 🔗 API ENDPOINTS
// =======================

// Get Pair Code
app.post("/api/pair-code", async (req, res) => {
    try {
        const { phone } = req.body

        if (!phone) {
            return res.status(400).json({ error: "Phone number is required" })
        }

        if (!sock) {
            return res.status(503).json({ error: "Bot is not initialized. Please try again." })
        }

        const code = await sock.requestPairingCode(phone)
        res.json({ code })
    } catch (error) {
        console.error("❌ Pair code error:", error)
        res.status(500).json({ error: error.message || "Failed to generate pair code" })
    }
})

// Get QR Code
app.get("/api/qr-code", async (req, res) => {
    try {
        if (!sock || !sock.authState) {
            return res.status(503).json({ error: "Bot is not initialized" })
        }

        const qrValue = sock.authState.creds.me?.jid || "WAITING"
        const qr = await QRCode.toDataURL(qrValue)
        
        res.json({ qr })
    } catch (error) {
        console.error("❌ QR code error:", error)
        res.status(500).json({ error: error.message || "Failed to generate QR code" })
    }
})

// Start Express Server
app.listen(PORT, () => {
    console.log("🌐 Panel running on port", PORT)
})

// Start Bot
startBot()

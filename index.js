process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")

// IMPORT COMMANDS
const general = require("./commands/general")
const admin = require("./commands/admin")
const games = require("./commands/games")
const ai = require("./commands/ai")
const download = require("./commands/download")
const sticker = require("./commands/sticker")

let isStarting = false
let retryCount = 0
const MAX_RETRIES = 5

async function startBot() {
    if (isStarting) return
    isStarting = true

    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    // ✅ CONNECTION HANDLER
    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("📱 Scan this QR code:")
            console.log(qr)
        }

        if (connection === "open") {
            console.log("✅ Bot connected to WhatsApp!")
            retryCount = 0 // reset retries
        }

        if (connection === "close") {
            isStarting = false

            if (retryCount >= MAX_RETRIES) {
                console.log("🚫 Max retries reached. Stopping bot to avoid suspension.")
                return
            }

            retryCount++
            const delay = 5000 * retryCount // increasing delay

            console.log(`❌ Connection closed. Retry ${retryCount}/${MAX_RETRIES} in ${delay / 1000}s...`)

            setTimeout(() => {
                startBot()
            }, delay)
        }
    })

    // ✅ PAIRING CODE
    if (!sock.authState.creds.registered) {
        const phoneNumber = "260XXXXXXXXX" // 🔴 PUT YOUR REAL NUMBER

        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`🔑 Pairing Code: ${code}`)
    }

    // ✅ MESSAGE HANDLER
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

startBot()
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

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    // ✅ CONNECTION HANDLER (QR + STATUS)
    sock.ev.on("connection.update", async (update) => {
        const { connection, qr } = update

        if (qr) {
            console.log("📱 Scan this QR code:")
            console.log(qr)
        }

        if (connection === "open") {
            console.log("✅ Bot connected to WhatsApp!")
        }

        if (connection === "close") {
    console.log("❌ Connection closed. Reconnecting in 5 seconds...")
    setTimeout(() => {
        startBot()
    }, 5000)
}
    })

    // ✅ PAIRING CODE (for hosting / phone)
    if (!sock.authState.creds.registered) {
        const phoneNumber = "260XXXXXXXXX" // 🔴 PUT YOUR NUMBER HERE

        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`🔑 Pairing Code: ${code}`)
    }

    // ✅ MESSAGE HANDLER (your original logic)
    sock.ev.on("messages.upsert", async ({ messages }) => {
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

        // RUN COMMANDS
        await general(context)
        await admin(context)
        await ai(context)
        await games(context)
        await download(context)
        await sticker(context)
    })
}

startBot()
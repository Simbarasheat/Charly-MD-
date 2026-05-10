const fs = require("fs")
const path = require("path")

const makeWASocket =
    require("@whiskeysockets/baileys").default

const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys")

// =======================
// ⏱️ COOLDOWN SYSTEM
// =======================
const cooldowns = new Map()

// =======================
// 🧹 DELETE FOLDER
// =======================
const deleteFolder = (folderPath) => {

    try {

        if (fs.existsSync(folderPath)) {

            fs.rmSync(folderPath, {
                recursive: true,
                force: true
            })
        }

    } catch (e) {

        console.log("Delete folder error:", e)
    }
}

// =======================
// 🚀 EXPORT
// =======================
module.exports = async (ctx) => {

    const {
        sock,
        from,
        command,
        args,
        sender,
        msg
    } = ctx

    if (command !== "pair") return

    // =======================
    // ⏱️ COOLDOWN
    // =======================
    const now = Date.now()

    if (cooldowns.has(sender)) {

        const expire = cooldowns.get(sender)

        if (now < expire) {

            const left =
                Math.ceil((expire - now) / 1000)

            return sock.sendMessage(from, {
                text:
`⏳ Wait ${left}s before requesting another pairing code`
            }, { quoted: msg })
        }
    }

    cooldowns.set(sender, now + 60000)

    // =======================
    // 📱 PHONE
    // =======================
    const phone =
        args.join("")
            .replace(/[^0-9]/g, "")

    if (!phone) {

        return sock.sendMessage(from, {
            text:
`❌ Usage:

.pair 2607XXXXXXXX`
        }, { quoted: msg })
    }

    // =======================
    // 📂 TEMP SESSION
    // =======================
    const sessionPath =
        `./temp/pair_${Date.now()}`

    try {

        await sock.sendMessage(from, {
            text: "🔄 Generating pairing code..."
        }, { quoted: msg })

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(sessionPath)

        const { version } =
            await fetchLatestBaileysVersion()

        const tempSock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            browser: [
                "CHARLY MD",
                "Chrome",
                "1.0.0"
            ]
        })

        tempSock.ev.on(
            "creds.update",
            saveCreds
        )

        // =======================
        // 🔌 CONNECTION EVENTS
        // =======================
        tempSock.ev.on(
            "connection.update",
            async (update) => {

                const {
                    connection,
                    lastDisconnect
                } = update

                if (connection === "close") {

                    const statusCode =
                        lastDisconnect?.error?.output?.statusCode

                    console.log(
                        "Pair socket closed:",
                        statusCode
                    )

                    setTimeout(() => {
                        deleteFolder(sessionPath)
                    }, 5000)
                }
            }
        )

        // =======================
        // 🔑 REQUEST CODE
        // =======================
        const code =
            await tempSock.requestPairingCode(
                phone
            )

        await sock.sendMessage(from, {
            text:
`🔗 *PAIRING CODE*

${code}

📱 Open WhatsApp
⚙️ Linked Devices
🔗 Link with phone number

⚠️ Code expires soon`
        }, { quoted: msg })

        // =======================
        // 🧹 AUTO CLEANUP
        // =======================
        setTimeout(async () => {

            try {

                if (tempSock?.ws) {
                    tempSock.ws.close()
                }

            } catch (e) {}

            deleteFolder(sessionPath)

        }, 60000)

    } catch (err) {

        console.log("Pair error:", err)

        deleteFolder(sessionPath)

        return sock.sendMessage(from, {
            text:
`❌ Failed to generate pairing code

Possible reasons:
- Invalid number
- WhatsApp temporarily blocked requests
- Too many pairing attempts`
        }, { quoted: msg })
    }
}
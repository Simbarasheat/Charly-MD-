const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text
        const from = msg.key.remoteJid

        if (!text) return

        // PREFIX
        if (!text.startsWith(".")) return

        const command = text.split(" ")[0].slice(1).toLowerCase()

        // COMMANDS
        if (command === "ping") {
            await sock.sendMessage(from, { text: "🏓 Pong!" })
        }

        if (command === "alive") {
            await sock.sendMessage(from, { text: "🤖 Bot is alive!" })
        }

        if (command === "menu" || command === "help") {
            await sock.sendMessage(from, {
                text: `
🤖 Charly MD Bot

🌐 Commands:
.ping
.alive
.joke
.owner
                `
            })
        }

        if (command === "joke") {
            await sock.sendMessage(from, {
                text: "😂 Why did the programmer quit? Because he didn't get arrays."
            })
        }

        if (command === "owner") {
            await sock.sendMessage(from, {
                text: "👑 Owner: SAT Limited"
            })
        }
    })
}

startBot()
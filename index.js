const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")

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

        const from = msg.key.remoteJid
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (!text) return

        // PREFIX CHECK
        if (!text.startsWith(".")) return

        const args = text.split(" ")
        const command = args[0].slice(1).toLowerCase()

        // =============================
        // 🤖 GENERAL COMMANDS
        // =============================

        if (command === "ping") {
            await sock.sendMessage(from, { text: "🏓 Pong!" })
        }

        if (command === "alive") {
            await sock.sendMessage(from, {
                text: "✅ Charly MD Bot is running smoothly 🚀"
            })
        }

        if (command === "owner") {
            await sock.sendMessage(from, {
                text: `
👑 Owner Details:
Name: Simbarashe Augustus Tembo
Bot: Charly MD Bot
                `
            })
        }

        if (command === "joke") {
            await sock.sendMessage(from, {
                text: "😂 Why did the programmer quit? Because he didn't get arrays."
            })
        }

        if (command === "menu" || command === "help") {
            await sock.sendMessage(from, {
                text: `
╔═══════════════════╗
   🤖 Charly MD Bot  
   Version: 1.0.0
╚═══════════════════╝

🌐 *Commands*
➤ .ping
➤ .alive
➤ .joke
➤ .owner
                `
            })
        }

        // =============================
        // 🔊 TTS COMMAND
        // =============================
        if (command === "tts") {
            const gTTS = require("gtts")
            const textToSpeak = args.slice(1).join(" ")

            if (!textToSpeak) {
                return sock.sendMessage(from, { text: "❌ Give me text!" })
            }

            const filePath = "./tts.mp3"
            const gtts = new gTTS(textToSpeak, "en")

            gtts.save(filePath, async () => {
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(filePath),
                    mimetype: "audio/mp4"
                })
            })
        }

    })
}

startBot()
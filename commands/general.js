const fs = require("fs")

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    if (command === "ping") {
        await sock.sendMessage(from, { text: "🏓 Pong!" })
    }

    if (command === "alive") {
        await sock.sendMessage(from, {
            text: "✅ Charly MD Bot is running 🚀"
        })
    }

    if (command === "menu") {
        await sock.sendMessage(from, {
            text: `
🤖 Charly MD Bot

.ping
.alive
.joke
            `
        })
    }

    if (command === "joke") {
        await sock.sendMessage(from, {
            text: "😂 Why did the dev go broke? Because he used up all his cache."
        })
    }

    // TTS
    if (command === "tts") {
        const gTTS = require("gtts")
        const textToSpeak = args.slice(1).join(" ")

        if (!textToSpeak) {
            return sock.sendMessage(from, { text: "❌ Give text!" })
        }

        const gtts = new gTTS(textToSpeak, "en")

        gtts.save("tts.mp3", async () => {
            await sock.sendMessage(from, {
                audio: fs.readFileSync("tts.mp3"),
                mimetype: "audio/mp4"
            })
        })
    }
}
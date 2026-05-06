const fs = require("fs")

// 📸 Bot image (you can replace this link anytime)
const BOT_IMAGE = "https://files.catbox.moe/37ds7j.png"

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
        image: { url: BOT_IMAGE },
        caption: `
🤖 *CHARLY MD BOT MENU*
 
 Owner: SAT Limited Dev
 Prefix: (.)

⚡ MAIN COMMANDS
.ping - Check bot speed
.alive - Check if bot is running
.menu - Show this menu
.pair 
.gpt - AI
etc

🎉 FUN COMMANDS
.joke - Random joke

🔊 MEDIA
.tts <text> - Text to speech
.play

🫂 GROUP COMMANDS
.kick
.promote
.antilink on/off
.warn

🔥 NOTE
 1. More Commands Coming Soon.

👑 Powered by SAT Limited
        `
    })
}

    if (command === "joke") {
        await sock.sendMessage(from, {
            text: "😂 Why did the dev go broke? Because he used up all his cache."
        })
    }

    if (command === "owner") {

    const message = `
╭━━━〔 👑 OWNER INFO 〕━━━╮
┃ 🤖 Bot: Charly MD
┃ 👤 Owner: Simbarashe Tembo
┃ 📞 +260772697513
┃ ⚡ SAT Limited
╰━━━━━━━━━━━━━━━━━━╯
    `.trim()

    return await sock.sendMessage(from, { text: message })
}

    if (command === "update") {

    // 🔐 ONLY ALLOWED OWNER NUMBER
    const allowedNumber = "260772697513@s.whatsapp.net"

    if (sender !== allowedNumber) {
        return await sock.sendMessage(from, {
            text: "❌ You are not allowed to use this command."
        })
    }

    // Example update action (edit this part later)
    const message = `
🔄 *BOT UPDATE MODE*

👨‍💻 Developer: SAT Limited
📦 Status: Updating bot components...
⚙️ Changes: System patches applied

✅ Bot updated successfully.
    `.trim()

    return await sock.sendMessage(from, { text: message })
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
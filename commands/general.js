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
    return sock.sendMessage(from, {
        image: { url: BOT_IMAGE },
        caption: `
╭━━━〔 🤖 CHARLY MD BOT 〕━━━╮
┃ 👑 Owner: SAT Limited Dev
┃ ⚙️ Prefix: .
┃ 📡 Status: Online 🚀
╰━━━━━━━━━━━━━━━━━━━━━━╯

⚡ MAIN COMMANDS
.ping - Check bot speed
.alive - Check bot status
.menu - Show full menu
.gpt - AI chatbot 🤖
.pair - Link WhatsApp bot

🧠 AI SYSTEM
.gpt <text> - Ask AI anything

🎮 GAMES
.guess - Number guessing game
.trivia - Trivia questions
.answer - Answer trivia

🔊 MEDIA
.play <name> - Play music 🎵
.ytmp4 <link> - Download video 🎥
.tts <text> - Text to speech 🔊

🖼️ STICKERS & FUN
.sticker - Convert image to sticker
.meme - Random meme 😂
.joke - Random joke

👮 GROUP COMMANDS
.kick - Remove user
.promote - Promote user
.warn - Warn user
.antilink on/off - Block links 🔗

🔐 OWNER COMMANDS
.owner - Bot owner info 👑
.update - Bot update status

📢 OFFICIAL CHANNEL
🔗 SAT Bot Network
https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e

📌 INFO
Bot created by SAT Limited
More updates coming soon 🚀

╰━━━━━━━━━━━━━━━━━━━━━━╯
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
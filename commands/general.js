const fs = require("fs")

// 📸 Bot image (you can replace this link anytime)
const BOT_IMAGE = "https://files.catbox.moe/37ds7j.png"

const BOT_VERSION = "2.0.0"

let mode = "public"

const loadMode = () => {
    if (fs.existsSync("./database/mode.json")) {
        mode = JSON.parse(fs.readFileSync("./database/mode.json")).mode
    }
}

loadMode()

module.exports = async (ctx) => {
    const { sock, from, command, args, sender } = ctx

const ownerNumber = "260772697513@s.whatsapp.net" // your number

const isOwner = (sender) => sender === ownerNumber

    // MODE SYSTEM
    if (mode === "private" && !isOwner(sender)) {
    return sock.sendMessage(from, { text: "⛔ Bot is in PRIVATE mode" })
}

    if (mode === "self" && !isOwner(sender)) {
    return
}

    if (command === "ping") {
    const end = Date.now()
    const ping = end - start

    await sock.sendMessage(from, {
        text: `🏓 Pong!\n⚡ Speed: ${ping}ms`
    })
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
┃ 👑 Owner: SAT Limited Developers
┃ ⚙️ Prefix: .
┃ 📡 Status: Online 🚀
┃ 🔐 Mode: ${JSON.parse(fs.readFileSync("./database/mode.json")).mode}
┃ ⏱️ Uptime: ${getUptime()}
┃ 🧩 Version: ${BOT_VERSION}
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
.mode public/private/self

📢 OFFICIAL CHANNEL
🔗https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e

📌 INFO
Bot created by SAT Limited
More updates coming soon 🚀

╰━━━━━━━━━━━━━━━━━━━━━━╯
        `
    })
}

    if (command === "joke") {
    const { sock, from } = ctx

    const jokes = [
        "😂 Why did the developer go broke? Because he used up all his cache.",
        "🤣 Why do programmers prefer dark mode? Because light attracts bugs.",
        "😆 Why did JavaScript break up with HTML? It found someone more responsive.",
        "😂 Why did the computer get cold? It forgot to close its Windows.",
        "🤣 Why do coders hate nature? Too many bugs.",
        "😆 Why did the function return early? Because it had a date!",
        "😂 Why did the dev sleep well? Because he debugged everything.",
        "🤣 Why was the JavaScript file sad? Because it didn’t know how to 'null' its feelings.",
        "😆 Why did the programmer quit his job? No arrays (a raise).",
        "😂 Why do programmers drink coffee? To turn code into reality."
    ]

    const random = jokes[Math.floor(Math.random() * jokes.length)]

    await sock.sendMessage(from, {
        text: random
    })
}

    if (command === "owner") {

    const message = `
╭━━━〔 👑 OWNER INFO 〕━━━╮
┃ 🤖 Bot: Charly MD
┃ 👤 Owner: Simbarashe Tembo .A.
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

    if (command === "mode") {

    const newMode = args[0]

    if (!newMode) {
        return sock.sendMessage(from, {
            text: `📌 Current mode: *${mode}*\n\nUse:\n.mode public\n.mode private\n.mode self`
        })
    }

    if (!["public", "private", "self"].includes(newMode)) {
        return sock.sendMessage(from, {
            text: "❌ Use: public, private, self"
        })
    }

    mode = newMode

    fs.writeFileSync("./database/mode.json", JSON.stringify({ mode }, null, 2))

    return sock.sendMessage(from, {
        text: `✅ Mode changed to: ${newMode}`
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
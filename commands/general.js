const fs = require("fs")

// ===============================
// 📸 BOT SETTINGS
// ===============================

const BOT_IMAGE = "https://files.catbox.moe/37ds7j.png"
const BOT_VERSION = "2.0.0"

const startTime = Date.now()

const getUptime = () => {
    const seconds = Math.floor((Date.now() - startTime) / 1000)

    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    return `${h}h ${m}m ${s}s`
}

// ===============================
// 🔐 MODE SYSTEM
// ===============================

let mode = "public"

const loadMode = () => {
    if (fs.existsSync("./database/mode.json")) {
        mode = JSON.parse(
            fs.readFileSync("./database/mode.json")
        ).mode
    }
}

loadMode()

// ===============================
// 👑 OWNER SETTINGS
// ===============================

const ownerNumber = "260772697513@s.whatsapp.net"

const isOwner = (sender) => sender === ownerNumber

// ===============================
// 🚀 MAIN EXPORT
// ===============================

module.exports = async (ctx) => {

    const {
        sock,
        from,
        command,
        args,
        sender
    } = ctx

    const start = Date.now()

    // ===============================
    // 🔒 PRIVATE / SELF MODE
    // ===============================

    if (mode === "private" && !isOwner(sender)) {
        return sock.sendMessage(from, {
            text: "⛔ Bot is in PRIVATE mode"
        })
    }

    if (mode === "self" && !isOwner(sender)) {
        return
    }

    // ===============================
    // ⚡ MAIN COMMANDS
    // ===============================

    if (command === "ping") {

        const end = Date.now()
        const ping = end - start

        return sock.sendMessage(from, {
            text: `🏓 Pong!\n⚡ Speed: ${ping}ms`
        })
    }

    if (command === "alive") {

        return sock.sendMessage(from, {
            text: "✅ Charly MD Bot is running 🚀"
        })
    }

    // ===============================
    // 📜 MENU COMMAND
    // ===============================

    if (command === "menu") {

        return sock.sendMessage(from, {
            image: { url: BOT_IMAGE },

            caption: `
╭━━━〔 🤖 CHARLY MD BOT 〕━━━╮
┃ 👑 Owner: SAT Limited Developers
┃ ⚙️ Prefix: .
┃ 📡 Status: Online 🚀
┃ 🔐 Mode: ${mode}
┃ ⏱️ Uptime: ${getUptime()}
┃ 🧩 Version: ${BOT_VERSION}
╰━━━━━━━━━━━━━━━━━━━━━━╯

┌──⭓『 ⚡ MAIN COMMANDS 』
│ .ping - Check bot speed
│ .alive - Check bot status
│ .menu - Show full menu
│ .gpt - AI chatbot 🤖
│ .pair - Link WhatsApp bot
└───────⭓

┌──⭓『 🧠 AI SYSTEM 』
│ .gpt <text> - Ask AI anything
└───────⭓

┌──⭓『 🎮 GAMES 』
│ .guess - Number guessing game
│ .trivia - Trivia questions
│ .answer - Answer trivia
└───────⭓

┌──⭓『 🔊 MEDIA 』
│ .play <name> - Play music 🎵
│ .ytmp4 <link> - Download video 🎥
│ .tts <text> - Text to speech 🔊
│ .vv - View once media
└───────⭓

┌──⭓『 🖼️ STICKERS & FUN 』
│ .sticker - Convert image to sticker
│ .meme - Random meme 😂
│ .joke - Random joke
└───────⭓

┌──⭓『 👮 GROUP COMMANDS 』
│ .kick - Remove user
│ .promote - Promote user
│ .warn - Warn user
│ .antilink on/off - Block links 🔗
│ .add <phone number>
└───────⭓

┌──⭓『 🔐 OWNER COMMANDS 』
│ .owner - Bot owner info 👑
│ .update - Bot update status
│ .mode public/private/self
│ .channel
└───────⭓

📢 OFFICIAL CHANNEL
│ Join for updates & support

📌 INFO
│ Bot created by SAT Limited
│ More updates coming soon 🚀
╰━━━━━━━━━━━━━━━━━━━━━━╯
            `,

            contextInfo: {
                externalAdReply: {
                    title: "Charly MD Official Channel",
                    body: "Powered by SAT Limited",
                    thumbnailUrl: BOT_IMAGE,
                    sourceUrl:
                        "https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        })
    }

    // ===============================
    // 😂 FUN COMMANDS
    // ===============================

    if (command === "joke") {

        const jokes = [
            "😂 Why did the developer go broke? Because he used up all his cache.",
            "🤣 Why do programmers prefer dark mode? Because light attracts bugs.",
            "😆 Why did JavaScript break up with HTML? It found someone more responsive.",
            "😂 Why did the computer get cold? It forgot to close its Windows.",
            "🤣 Why do coders hate nature? Too many bugs.",
            "😆 Why did the function return early? Because it had a date!",
            "😂 Why did the dev sleep well? Because he debugged everything.",
            "🤣 Why was the JavaScript file sad? Because it didn’t know how to null its feelings.",
            "😆 Why did the programmer quit his job? No arrays (a raise).",
            "😂 Why do programmers drink coffee? To turn code into reality."
        ]

        const random =
            jokes[Math.floor(Math.random() * jokes.length)]

        return sock.sendMessage(from, {
            text: random
        })
    }

    // ===============================
    // 🔊 MEDIA COMMANDS
    // ===============================

    if (command === "vv") {

        if (!ctx.m || !ctx.m.message) {
            return sock.sendMessage(from, {
                text: "❌ Reply to a view-once image or video!"
            })
        }

        const msg = ctx.m.message

        let viewOnce =
            msg.viewOnceMessageV2?.message ||
            msg.viewOnceMessage?.message

        if (!viewOnce) {
            return sock.sendMessage(from, {
                text: "❌ This is not a view-once message!"
            })
        }

        await sock.sendMessage(from, {
            text: "🔓 Revealing view-once media..."
        })

        try {

            // IMAGE
            if (viewOnce.imageMessage) {

                const buffer =
                    await sock.downloadMediaMessage(ctx.m)

                return sock.sendMessage(from, {
                    image: buffer,
                    caption:
                        viewOnce.imageMessage.caption || ""
                })
            }

            // VIDEO
            if (viewOnce.videoMessage) {

                const buffer =
                    await sock.downloadMediaMessage(ctx.m)

                return sock.sendMessage(from, {
                    video: buffer,
                    caption:
                        viewOnce.videoMessage.caption || ""
                })
            }

        } catch (err) {

            console.log(err)

            return sock.sendMessage(from, {
                text: "❌ Failed to retrieve view-once media."
            })
        }
    }

    // ===============================
    // 🔊 TTS COMMAND
    // ===============================

    if (command === "tts") {

        const gTTS = require("gtts")

        const textToSpeak = args.join(" ")

        if (!textToSpeak) {
            return sock.sendMessage(from, {
                text: "❌ Give text!"
            })
        }

        const gtts = new gTTS(textToSpeak, "en")

        gtts.save("tts.mp3", async () => {

            await sock.sendMessage(from, {
                audio: fs.readFileSync("tts.mp3"),
                mimetype: "audio/mp4"
            })
        })
    }

    // ===============================
    // 👮 GROUP COMMANDS
    // ===============================

    if (command === "add") {

        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, {
                text: "❌ This command only works in groups!"
            })
        }

        const number = args[0]

        if (!number) {
            return sock.sendMessage(from, {
                text: "❌ Usage:\n.add 2607xxxxxxx"
            })
        }

        const jid = number + "@s.whatsapp.net"

        try {

            await sock.groupParticipantsUpdate(
                from,
                [jid],
                "add"
            )

            return sock.sendMessage(from, {
                text:
                    `✅ Successfully added ${number} to the group`
            })

        } catch (err) {

            return sock.sendMessage(from, {
                text:
                    "❌ Failed to add user.\nMake sure:\n- Bot is admin\n- Number is correct"
            })
        }
    }

    // ===============================
    // 👑 OWNER COMMANDS
    // ===============================

    if (command === "owner") {

        const message = `
╭━━━〔 👑 OWNER INFO 〕━━━╮
┃ 🤖 Bot: Charly MD
┃ 👤 Owner: Simbarashe Tembo .A.
┃ 📞 +260772697513
┃ ⚡ SAT Limited
╰━━━━━━━━━━━━━━━━━━╯
        `.trim()

        return sock.sendMessage(from, {
            text: message
        })
    }

    const fs = require("fs")
const { exec } = require("child_process")

if (command === "update") {

    if (!isOwner(sender)) {
        return sock.sendMessage(from, {
            text: "❌ Owner only."
        })
    }

    await sock.sendMessage(from, {
        text: "🔄 Updating CHARLY MD from GitHub..."
    })

    exec("git pull", async (err, stdout, stderr) => {

        if (err) {

            console.log(err)

            return sock.sendMessage(from, {
                text: `❌ Update failed:\n${err.message}`
            })
        }

        if (stderr) {
            console.log(stderr)
        }

        await sock.sendMessage(from, {
            text:
                `✅ Updated successfully!\n\n` +
                `${stdout}\n` +
                `♻️ Restarting bot in 3 seconds...`
        })

        setTimeout(() => {
            process.exit(0)
        }, 3000)
    })
}

    if (command === "channel") {

    return sock.sendMessage(from, {
        text: `
📢 OFFICIAL CHANNEL

https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e

👑 SAT Limited Updates
        `
    })
}

    if (command === "mode") {

        if (!isOwner(sender)) {
            return sock.sendMessage(from, {
                text: "❌ Owner only command."
            })
        }

        const newMode = args[0]

        if (!newMode) {
            return sock.sendMessage(from, {
                text:
                    `📌 Current mode: *${mode}*\n\n` +
                    `Use:\n.mode public\n.mode private\n.mode self`
            })
        }

        if (!["public", "private", "self"].includes(newMode)) {
            return sock.sendMessage(from, {
                text: "❌ Use: public, private, self"
            })
        }

        mode = newMode

        fs.writeFileSync(
            "./database/mode.json",
            JSON.stringify({ mode }, null, 2)
        )

        return sock.sendMessage(from, {
            text: `✅ Mode changed to: ${newMode}`
        })
    }

}
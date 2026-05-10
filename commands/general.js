const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")
const gTTS = require("gtts")
const {
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")

// ===============================
// 📁 DATABASE SETUP
// ===============================
const dbPath = "./database"
const tempPath = "./temp"

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath)
}

if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath)
}

// ===============================
// 📸 BOT SETTINGS
// ===============================
const BOT_IMAGE = "https://files.catbox.moe/37ds7j.png"
const BOT_VERSION = "2.0.0"
const ownerNumber = "260772697513"

const startTime = Date.now()

let settings = {}
let PREFIX = "."
let mode = "public"

// ===============================
// 💾 LOAD SETTINGS
// ===============================
try {
    if (fs.existsSync("./database/settings.json")) {
        settings = JSON.parse(
            fs.readFileSync("./database/settings.json")
        )
    }
} catch (e) {
    console.log("Settings load error:", e)
    settings = {}
}

if (settings.prefix) {
    PREFIX = settings.prefix
}

try {
    if (fs.existsSync("./database/mode.json")) {
        mode = JSON.parse(
            fs.readFileSync("./database/mode.json")
        ).mode
    }
} catch (e) {
    console.log("Mode load error:", e)
}

// ===============================
// ⏱️ UPTIME
// ===============================
const getUptime = () => {

    const seconds = Math.floor(
        (Date.now() - startTime) / 1000
    )

    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    return `${h}h ${m}m ${s}s`
}

// ===============================
// 👑 OWNER CHECK
// ===============================
const isOwner = (sender) => {
    return sender.includes(ownerNumber)
}

// ===============================
// 🧹 SAFE DELETE
// ===============================
const safeDelete = (file) => {
    try {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file)
        }
    } catch (e) {
        console.log("Delete error:", e)
    }
}

// ===============================
// 🚀 EXPORT
// ===============================
module.exports = async (ctx) => {

    const {
        sock,
        from,
        command,
        args = [],
        sender,
        msg,
        text
    } = ctx

    // ===============================
    // 🔒 MODE SYSTEM
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
    // 🏓 PING
    // ===============================
    if (command === "ping") {

        const ping = Date.now() - msg.messageTimestamp * 1000

        return sock.sendMessage(from, {
            text: `🏓 Pong!\n⚡ Speed: ${ping}ms`
        })
    }

    // ===============================
    // ✅ ALIVE
    // ===============================
    if (command === "alive") {

        return sock.sendMessage(from, {
            text:
`✅ CHARLY MD BOT ONLINE

⚡ Version: ${BOT_VERSION}
⏱️ Uptime: ${getUptime()}`
        })
    }

    // ===============================
    // ⚙️ SETTINGS
    // ===============================
    if (command === "settings") {

        return sock.sendMessage(from, {
            text:
`⚙️ BOT SETTINGS

🔹 Prefix: ${PREFIX}
🔹 Mode: ${mode}
🔹 Version: ${BOT_VERSION}
🔹 Owner: +${ownerNumber}`
        })
    }

    // ===============================
    // 📜 MENU
    // ===============================
    if (command === "menu") {

        return sock.sendMessage(from, {
            image: {
                url: BOT_IMAGE
            },

            caption:
`╭━━━〔 🤖 CHARLY MD BOT 〕━━━╮
┃ 👑 Owner: SAT Limited
┃ ⚙️ Prefix: ${PREFIX}
┃ 🔐 Mode: ${mode}
┃ ⏱️ Uptime: ${getUptime()}
┃ 🚀 Version: ${BOT_VERSION}
╰━━━━━━━━━━━━━━━━━━━━━━╯

⚡ MAIN
.ping
.alive
.menu
.settings

🧠 AI
.gpt
.ai

🎮 GAMES
.guess
.trivia
.answer

🎵 MEDIA
.play
.ytmp4
.tts
.vv

👮 GROUP
.kick
.promote
.warn
.demote
.antilink
.add

👑 OWNER
.mode
.setprefix
.update
.owner
.channel

⚡ SAT Limited`,

            contextInfo: {
                externalAdReply: {
                    sourceUrl:
                        "https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        })
    }

    // ===============================
    // 😂 JOKE
    // ===============================
    if (command === "joke") {

        const jokes = [
            "😂 Why do programmers hate bugs? Because they prefer features.",
            "🤣 Why did the developer go broke? Too many cache misses.",
            "😆 Why do coders love dark mode? Light attracts bugs."
        ]

        const random =
            jokes[Math.floor(Math.random() * jokes.length)]

        return sock.sendMessage(from, {
            text: random
        })
    }

    // ===============================
    // 🔊 TTS
    // ===============================
    if (command === "tts") {

        const textToSpeak = args.join(" ").trim()

        if (!textToSpeak) {
            return sock.sendMessage(from, {
                text: "❌ Give text"
            })
        }

        const fileName =
            `./temp/${Date.now()}.mp3`

        try {

            const gtts = new gTTS(textToSpeak, "en")

            gtts.save(fileName, async () => {

                try {

                    await sock.sendMessage(from, {
                        audio: {
                            url: fileName
                        },
                        mimetype: "audio/mpeg"
                    }, { quoted: msg })

                } catch (e) {
                    console.log("TTS send error:", e)
                }

                safeDelete(fileName)
            })

        } catch (e) {

            console.log("TTS error:", e)

            return sock.sendMessage(from, {
                text: "❌ Failed to generate TTS"
            })
        }
    }

    // ===============================
    // 👁️ VIEW ONCE
    // ===============================
    if (command === "vv") {

        const quoted =
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (!quoted) {
            return sock.sendMessage(from, {
                text: "❌ Reply to a view-once message"
            }, { quoted: msg })
        }

        try {

            const viewOnceMsg =
                quoted.viewOnceMessage?.message ||
                quoted.viewOnceMessageV2?.message ||
                quoted.viewOnceMessageV2Extension?.message

            if (!viewOnceMsg) {
                return sock.sendMessage(from, {
                    text: "❌ Not a view-once message"
                }, { quoted: msg })
            }

            const mediaType =
                viewOnceMsg.imageMessage
                    ? "image"
                    : viewOnceMsg.videoMessage
                    ? "video"
                    : null

            if (!mediaType) {
                return sock.sendMessage(from, {
                    text: "❌ Unsupported media"
                }, { quoted: msg })
            }

            const mediaMsg =
                viewOnceMsg.imageMessage ||
                viewOnceMsg.videoMessage

            if (
                mediaMsg.fileLength >
                50 * 1024 * 1024
            ) {
                return sock.sendMessage(from, {
                    text: "❌ File too large"
                }, { quoted: msg })
            }

            const stream = await downloadContentFromMessage(
                mediaMsg,
                mediaType
            )

            let buffer = Buffer.from([])

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk])
            }

            if (mediaType === "image") {

                await sock.sendMessage(from, {
                    image: buffer,
                    caption: "✅ View-once saved"
                }, { quoted: msg })

            } else {

                await sock.sendMessage(from, {
                    video: buffer,
                    caption: "✅ View-once saved"
                }, { quoted: msg })
            }

        } catch (e) {

            console.log("VV error:", e)

            return sock.sendMessage(from, {
                text: "❌ Failed to save media"
            }, { quoted: msg })
        }
    }

    // ===============================
    // 👮 DEMOTE
    // ===============================
    if (command === "demote") {

        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, {
                text: "❌ Group only command"
            })
        }

        const metadata = await sock.groupMetadata(from)

        const senderAdmin = metadata.participants.find(
            p => p.id === sender
        )?.admin

        if (!senderAdmin) {
            return sock.sendMessage(from, {
                text: "❌ Admin only"
            })
        }

        const mentioned =
            msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

        if (!mentioned.length) {
            return sock.sendMessage(from, {
                text: "❌ Mention a user"
            })
        }

        await sock.groupParticipantsUpdate(
            from,
            mentioned,
            "demote"
        )

        return sock.sendMessage(from, {
            text: "✅ User demoted"
        })
    }

    // ===============================
    // ➕ ADD USER
    // ===============================
    if (command === "add") {

        if (!from.endsWith("@g.us")) {
            return sock.sendMessage(from, {
                text: "❌ Group only command"
            })
        }

        const number = args[0]

        if (!number) {
            return sock.sendMessage(from, {
                text: "❌ Usage: .add 2607xxxxxxx"
            })
        }

        try {

            const jid = number + "@s.whatsapp.net"

            await sock.groupParticipantsUpdate(
                from,
                [jid],
                "add"
            )

            return sock.sendMessage(from, {
                text: `✅ Added ${number}`
            })

        } catch (e) {

            console.log("Add error:", e)

            return sock.sendMessage(from, {
                text: "❌ Failed to add user"
            })
        }
    }

    // ===============================
    // 👑 OWNER
    // ===============================
    if (command === "owner") {

        return sock.sendMessage(from, {
            text:
`👑 OWNER INFO

👤 Simbarashe Tembo
📞 +${ownerNumber}
⚡ SAT Limited`
        })
    }

    // ===============================
    // 📢 CHANNEL
    // ===============================
    if (command === "channel") {

        return sock.sendMessage(from, {
            text:
`📢 OFFICIAL CHANNEL

https://whatsapp.com/channel/0029VbCHC3dIt5s59dq0u92e`
        })
    }

    // ===============================
    // ⚙️ SET PREFIX
    // ===============================
    if (command === "setprefix") {

        if (!isOwner(sender)) {
            return sock.sendMessage(from, {
                text: "❌ Owner only"
            })
        }

        const newPrefix = args[0]

        if (!newPrefix) {
            return sock.sendMessage(from, {
                text:
`⚙️ Current prefix: ${PREFIX}`
            })
        }

        PREFIX = newPrefix

        settings.prefix = PREFIX

        fs.writeFileSync(
            "./database/settings.json",
            JSON.stringify(settings, null, 2)
        )

        return sock.sendMessage(from, {
            text: `✅ Prefix changed to ${PREFIX}`
        })
    }

    // ===============================
    // 🔐 MODE
    // ===============================
    if (command === "mode") {

        if (!isOwner(sender)) {
            return sock.sendMessage(from, {
                text: "❌ Owner only"
            })
        }

        const newMode = args[0]

        if (!newMode) {
            return sock.sendMessage(from, {
                text:
`📌 Current mode: ${mode}

Use:
.mode public
.mode private
.mode self`
            })
        }

        if (
            !["public", "private", "self"]
                .includes(newMode)
        ) {
            return sock.sendMessage(from, {
                text: "❌ Invalid mode"
            })
        }

        mode = newMode

        fs.writeFileSync(
            "./database/mode.json",
            JSON.stringify({ mode }, null, 2)
        )

        return sock.sendMessage(from, {
            text: `✅ Mode changed to ${mode}`
        })
    }

    // ===============================
    // 🔄 UPDATE
    // ===============================
    if (command === "update") {

        if (!isOwner(sender)) {
            return sock.sendMessage(from, {
                text: "❌ Owner only"
            })
        }

        await sock.sendMessage(from, {
            text: "🔄 Updating from GitHub..."
        })

        exec("git pull", async (err, stdout) => {

            if (err) {
                return sock.sendMessage(from, {
                    text: `❌ Update failed\n${err.message}`
                })
            }

            await sock.sendMessage(from, {
                text:
`✅ Updated successfully

${stdout}

♻️ Restarting...`
            })

            setTimeout(() => {
                process.exit(0)
            }, 3000)
        })
    }
}
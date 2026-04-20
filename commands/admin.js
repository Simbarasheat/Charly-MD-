const fs = require("fs")

// LOAD DATABASE
let warnings = {}
let antiLink = {}

if (fs.existsSync("./database/warnings.json")) {
    warnings = JSON.parse(fs.readFileSync("./database/warnings.json"))
}

if (fs.existsSync("./database/antilink.json")) {
    antiLink = JSON.parse(fs.readFileSync("./database/antilink.json"))
}

module.exports = async (ctx) => {
    const {
        sock, from, msg, command, isAdmin,
        isBotAdmin, isGroup, sender
    } = ctx

    // WARN
    if (command === "warn") {
        if (!isAdmin) return sock.sendMessage(from, { text: "❌ Admin only!" })

        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
        if (!mentioned) return sock.sendMessage(from, { text: "❌ Tag user!" })

        const user = mentioned[0]

        if (!warnings[user]) warnings[user] = 0
        warnings[user]++

        fs.writeFileSync("./database/warnings.json", JSON.stringify(warnings))

        if (warnings[user] >= 3) {
            await sock.groupParticipantsUpdate(from, [user], "remove")
            delete warnings[user]
            fs.writeFileSync("./database/warnings.json", JSON.stringify(warnings))

            return sock.sendMessage(from, { text: "🚫 User kicked!" })
        }

        sock.sendMessage(from, { text: `⚠️ Warning ${warnings[user]}/3` })
    }

    // ANTILINK TOGGLE
    if (command === "antilink") {
        if (!isAdmin) return sock.sendMessage(from, { text: "❌ Admin only!" })

        const option = ctx.args[1]

        if (option === "on") antiLink[from] = true
        else if (option === "off") antiLink[from] = false
        else return sock.sendMessage(from, { text: "Use: .antilink on/off" })

        fs.writeFileSync("./database/antilink.json", JSON.stringify(antiLink))

        sock.sendMessage(from, { text: `🔗 Anti-link ${option}` })
    }

    // AUTO ANTILINK
    if (isGroup && antiLink[from]) {
        if (ctx.text.includes("chat.whatsapp.com")) {
            if (!isAdmin && isBotAdmin) {
                await sock.groupParticipantsUpdate(from, [sender], "remove")
            }
        }
    }

    // PROMOTE
    if (command === "promote") {
        if (!isAdmin || !isBotAdmin) return

        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
        if (!mentioned) return

        await sock.groupParticipantsUpdate(from, mentioned, "promote")
        sock.sendMessage(from, { text: "✅ Promoted!" })
    }

    // KICK
    if (command === "kick") {
        if (!isAdmin || !isBotAdmin) return

        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid
        if (!mentioned) return

        await sock.groupParticipantsUpdate(from, mentioned, "remove")
        sock.sendMessage(from, { text: "🚫 Removed!" })
    }
}
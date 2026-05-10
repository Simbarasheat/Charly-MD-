const fs = require("fs")
const path = require("path")

// =======================
// 📁 SAFE DATABASE SETUP
// =======================
const dbPath = "./database"

if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath)
}

const warnFile = path.join(dbPath, "warnings.json")
const antiFile = path.join(dbPath, "antilink.json")

let warnings = {}
let antiLink = {}

// SAFE LOAD
try {
    if (fs.existsSync(warnFile)) {
        warnings = JSON.parse(fs.readFileSync(warnFile))
    }
} catch (e) {
    warnings = {}
}

try {
    if (fs.existsSync(antiFile)) {
        antiLink = JSON.parse(fs.readFileSync(antiFile))
    }
} catch (e) {
    antiLink = {}
}

// =======================
// 💾 SAFE SAVE FUNCTION
// =======================
const saveJSON = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// =======================
// 🤖 MODULE
// =======================
module.exports = async (ctx) => {
    const {
        sock,
        from,
        msg,
        command,
        isAdmin,
        isBotAdmin,
        isGroup,
        sender,
        args = [],
        text
    } = ctx

    // =======================
    // ⚠️ GET MENTIONS SAFELY
    // =======================
    const mentioned =
        msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    // =======================
    // ⚠️ WARN SYSTEM
    // =======================
    if (command === "warn") {
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "❌ Admin only!" })
        }

        if (!mentioned.length) {
            return sock.sendMessage(from, { text: "❌ Tag a user!" })
        }

        const user = mentioned[0]

        warnings[user] = (warnings[user] || 0) + 1
        saveJSON(warnFile, warnings)

        if (warnings[user] >= 3) {
            if (isBotAdmin) {
                await sock.groupParticipantsUpdate(from, [user], "remove")
            }

            delete warnings[user]
            saveJSON(warnFile, warnings)

            return sock.sendMessage(from, {
                text: "🚫 User removed after 3 warnings"
            })
        }

        return sock.sendMessage(from, {
            text: `⚠️ Warning ${warnings[user]}/3`
        })
    }

    // =======================
    // 🔗 ANTILINK TOGGLE
    // =======================
    if (command === "antilink") {
        if (!isAdmin) {
            return sock.sendMessage(from, { text: "❌ Admin only!" })
        }

        const option = args[0]

        if (!option || !["on", "off"].includes(option)) {
            return sock.sendMessage(from, {
                text: "Use: .antilink on/off"
            })
        }

        antiLink[from] = option === "on"
        saveJSON(antiFile, antiLink)

        return sock.sendMessage(from, {
            text: `🔗 Anti-link ${option.toUpperCase()}`
        })
    }

    // =======================
    // 🚨 AUTO ANTILINK
    // =======================
    if (isGroup && antiLink[from]) {
        const messageText = text || ""

        const hasLink = messageText.includes("chat.whatsapp.com")

        if (hasLink && !isAdmin && isBotAdmin) {
            try {
                await sock.groupParticipantsUpdate(from, [sender], "remove")
            } catch (e) {
                console.log("Anti-link remove failed:", e)
            }
        }
    }

    // =======================
    // ⬆️ PROMOTE
    // =======================
    if (command === "promote") {
        if (!isAdmin || !isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ No permission!" })
        }

        if (!mentioned.length) {
            return sock.sendMessage(from, { text: "❌ Tag user!" })
        }

        await sock.groupParticipantsUpdate(from, mentioned, "promote")

        return sock.sendMessage(from, {
            text: "✅ User promoted"
        })
    }

    // =======================
    // ⬇️ DEMOTE/KICK
    // =======================
    if (command === "kick") {
        if (!isAdmin || !isBotAdmin) {
            return sock.sendMessage(from, { text: "❌ No permission!" })
        }

        if (!mentioned.length) {
            return sock.sendMessage(from, { text: "❌ Tag user!" })
        }

        await sock.groupParticipantsUpdate(from, mentioned, "remove")

        return sock.sendMessage(from, {
            text: "🚫 User removed"
        })
    }
}
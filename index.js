const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")

// IMPORT COMMAND FILES
const general = require("./commands/general")
const admin = require("./commands/admin")
const games = require("./commands/games")
const ai = require("./commands/ai")

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

        if (!text || !text.startsWith(".")) return

        const args = text.split(" ")
        const command = args[0].slice(1).toLowerCase()

        const isGroup = from.endsWith("@g.us")
        const sender = msg.key.participant || msg.key.remoteJid

        let groupMetadata = isGroup ? await sock.groupMetadata(from) : null
        let participants = isGroup ? groupMetadata.participants : []

        const isAdmin = isGroup
            ? participants.find(p => p.id === sender)?.admin !== null
            : false

        const isBotAdmin = isGroup
            ? participants.find(p => p.id === sock.user.id)?.admin !== null
            : false

        // PASS EVERYTHING TO COMMAND FILES
        const context = {
            sock,
            msg,
            from,
            text,
            args,
            command,
            isGroup,
            isAdmin,
            isBotAdmin,
            sender
        }

        // RUN COMMANDS
        await general(context)
        await admin(context)
        await ai(context)
        await games(context)
    })
}

startBot()
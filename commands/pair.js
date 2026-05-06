const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")

module.exports = async function pair(context) {
    const { sock, from, args } = context

    try {
        const phone = args[1]

        if (!phone) {
            return sock.sendMessage(from, {
                text: "❌ Usage:\n.pair 260XXXXXXXXX"
            })
        }

        // clean number
        const cleanPhone = phone.replace(/[^0-9]/g, "")

        const { state } = await useMultiFileAuthState("temp-session")
        const { version } = await fetchLatestBaileysVersion()

        const tempSock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false
        })

        const code = await tempSock.requestPairingCode(cleanPhone)

        await sock.sendMessage(from, {
            text: `🔗 *Pairing Code*\n\n${code}\n\n⚠️ Use WhatsApp → Link Device`
        })

        await tempSock.ws.close()

    } catch (err) {
        console.error("Pair error:", err)

        await sock.sendMessage(from, {
            text: "❌ Failed to generate pairing code"
        })
    }
}
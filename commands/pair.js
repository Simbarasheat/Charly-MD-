const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    if (command === "pair") {

        const phone = args.join(" ").replace(/[^0-9]/g, "")

        if (!phone) {
            return sock.sendMessage(from, {
                text: "❌ Usage:\n.pair 260XXXXXXXXX"
            })
        }

        try {
            const { state } = await useMultiFileAuthState("./temp-session")
            const { version } = await fetchLatestBaileysVersion()

            const tempSock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false
            })

            const code = await tempSock.requestPairingCode(phone)

            await sock.sendMessage(from, {
                text: `
🔗 *PAIRING CODE*

${code}

📱 Open WhatsApp:
Settings → Linked Devices → Link with code
                `.trim()
            })

            // DO NOT instantly close — give time for generation
            setTimeout(() => {
                try {
                    tempSock.end()
                } catch (e) {}
            }, 5000)

        } catch (err) {
            console.error(err)

            return sock.sendMessage(from, {
                text: "❌ Failed to generate pairing code"
            })
        }
    }
}
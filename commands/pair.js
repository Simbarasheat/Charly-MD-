const makeWASocket = require("@whiskeysockets/baileys").default
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    if (command === "pair") {

        const phone = args.join("").replace(/[^0-9]/g, "")

        if (!phone) {
            return sock.sendMessage(from, {
                text: "❌ Usage:\n.pair 260XXXXXXXXX"
            })
        }

        try {

            const { state, saveCreds } = await useMultiFileAuthState("./temp-session")
            const { version } = await fetchLatestBaileysVersion()

            const tempSock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false
            })

            tempSock.ev.on("creds.update", saveCreds)

            const code = await tempSock.requestPairingCode(phone, "CHARLY MD")

            await sock.sendMessage(from, {
                text: `🔗 *PAIRING CODE*\n\n${code}\n\n📱 Go to WhatsApp → Linked Devices → Link with code`
            })

            setTimeout(() => {
                try {
                    tempSock.end()
                } catch (e) {}
            }, 15000)

        } catch (err) {
            console.log(err)

            return sock.sendMessage(from, {
                text: "❌ Failed to generate pairing code"
            })
        }
    }
}
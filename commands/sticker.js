const fs = require("fs")

module.exports = async (ctx) => {
    const { sock, from, msg, command } = ctx

    // 📌 STICKER FROM IMAGE
    module.exports = async (ctx) => {
    const { sock, from, msg, command } = ctx

    if (command === "sticker") {

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        const imageMsg =
            quoted?.imageMessage || msg.message?.imageMessage

        if (!imageMsg) {
            return sock.sendMessage(from, {
                text: "❌ Reply to an image or send image with .sticker"
            })
        }

        try {
            const buffer = await sock.downloadMediaMessage({
                message: quoted || msg.message
            })

            await sock.sendMessage(from, {
                sticker: buffer
            })

        } catch (e) {
            console.error(e)

            return sock.sendMessage(from, {
                text: "❌ Failed to create sticker"
            })
        }
    }

    // 🖼️ SIMPLE MEME
    if (command === "meme") {

        const memes = [
            "https://i.imgflip.com/30b1gx.jpg",
            "https://i.imgflip.com/1bij.jpg",
            "https://i.imgflip.com/26am.jpg"
        ]

        const random = memes[Math.floor(Math.random() * memes.length)]

        return sock.sendMessage(from, {
            image: { url: random },
            caption: "😂 *Random Meme*"
        })
    }
}
const fs = require("fs")

module.exports = async (ctx) => {
    const { sock, from, msg, command } = ctx

    // 📌 STICKER FROM IMAGE
    if (command === "sticker") {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage

        if (!quoted?.imageMessage) {
            return sock.sendMessage(from, {
                text: "❌ Reply to an image!"
            })
        }

        const buffer = await sock.downloadMediaMessage({
            message: quoted
        })

        await sock.sendMessage(from, {
            sticker: buffer
        })
    }

    // 🖼️ SIMPLE MEME
    if (command === "meme") {
        const memes = [
            "https://i.imgflip.com/30b1gx.jpg",
            "https://i.imgflip.com/1bij.jpg"
        ]

        const random = memes[Math.floor(Math.random() * memes.length)]

        await sock.sendMessage(from, {
            image: { url: random },
            caption: "😂 Meme"
        })
    }
}
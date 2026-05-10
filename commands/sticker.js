const fs = require("fs")
const path = require("path")

module.exports = async (ctx) => {

    const {
        sock,
        from,
        msg,
        command
    } = ctx

    // =======================
    // 📁 TEMP FOLDER
    // =======================
    if (!fs.existsSync("./temp")) {
        fs.mkdirSync("./temp")
    }

    // =======================
    // 🖼️ STICKER
    // =======================
    if (command === "sticker") {

        try {

            const quoted =
                msg.message?.extendedTextMessage
                    ?.contextInfo?.quotedMessage

            const imageMsg =
                quoted?.imageMessage ||
                msg.message?.imageMessage

            if (!imageMsg) {

                return sock.sendMessage(from, {
                    text:
`❌ Reply to an image

Example:
.sticker`
                }, { quoted: msg })
            }

            // =======================
            // 📏 FILE SIZE LIMIT
            // =======================
            const fileSize =
                imageMsg.fileLength || 0

            if (
                fileSize >
                10 * 1024 * 1024
            ) {

                return sock.sendMessage(from, {
                    text:
"❌ Image too large (max 10MB)"
                }, { quoted: msg })
            }

            // =======================
            // 📥 DOWNLOAD
            // =======================
            const mediaBuffer =
                await sock.downloadMediaMessage({
                    message: quoted || msg.message
                })

            if (!mediaBuffer) {

                return sock.sendMessage(from, {
                    text:
"❌ Failed to download image"
                }, { quoted: msg })
            }

            // =======================
            // 🏷️ STICKER METADATA
            // =======================
            await sock.sendMessage(from, {

                sticker: mediaBuffer,

                packname: "CHARLY MD",

                author: "SAT Limited"

            }, { quoted: msg })

        } catch (e) {

            console.log("Sticker error:", e)

            return sock.sendMessage(from, {
                text:
"❌ Failed to create sticker"
            }, { quoted: msg })
        }
    }

    // =======================
    // 😂 MEME
    // =======================
    if (command === "meme") {

        const memes = [

            "https://i.imgflip.com/30b1gx.jpg",

            "https://i.imgflip.com/1bij.jpg",

            "https://i.imgflip.com/26am.jpg",

            "https://i.imgflip.com/4t0m5.jpg",

            "https://i.imgflip.com/3si4.jpg"
        ]

        const random =
            memes[Math.floor(Math.random() * memes.length)]

        return sock.sendMessage(from, {

            image: {
                url: random
            },

            caption:
"😂 Random Meme\n⚡ SAT Limited"

        }, { quoted: msg })
    }
}
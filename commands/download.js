const yts = require("yt-search")
const ytdl = require("ytdl-core")

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    // 🎵 PLAY (search + audio)
    if (command === "play") {
        const query = args.slice(1).join(" ")

        if (!query) {
            return sock.sendMessage(from, { text: "❌ Give song name!" })
        }

        const search = await yts(query)
        const video = search.videos[0]

        if (!video) {
            return sock.sendMessage(from, { text: "❌ Not found!" })
        }

        await sock.sendMessage(from, {
            text: `🎶 *${video.title}*\n${video.url}`
        })

        const stream = ytdl(video.url, { filter: "audioonly" })

        await sock.sendMessage(from, {
            audio: stream,
            mimetype: "audio/mp4"
        })
    }

    // 🎥 YTMP4
    if (command === "ytmp4") {
        const url = args[1]

        if (!url) {
            return sock.sendMessage(from, { text: "❌ Give link!" })
        }

        const stream = ytdl(url, { filter: "audioandvideo" })

        await sock.sendMessage(from, {
            video: stream,
            mimetype: "video/mp4"
        })
    }
}
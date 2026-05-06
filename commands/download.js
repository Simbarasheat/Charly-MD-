const yts = require("yt-search")
const ytdl = require("ytdl-core")

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    // 🎵 PLAY AUDIO
    if (command === "play") {

        const query = args.join(" ")

        if (!query) {
            return sock.sendMessage(from, {
                text: "❌ Give song name!\nExample: .play calm down"
            })
        }

        try {
            const search = await yts(query)
            const video = search.videos[0]

            if (!video) {
                return sock.sendMessage(from, { text: "❌ No results found!" })
            }

            await sock.sendMessage(from, {
                text: `🎶 *${video.title}*\n⏳ Downloading audio...`
            })

            const stream = ytdl(video.url, { filter: "audioonly" })

            await sock.sendMessage(from, {
                audio: stream,
                mimetype: "audio/mp4",
                fileName: `${video.title}.mp3`
            })

        } catch (e) {
            console.error(e)
            await sock.sendMessage(from, { text: "❌ Error playing song" })
        }
    }

    // 🎥 YTMP4
    if (command === "ytmp4") {

        const url = args[1]

        if (!url) {
            return sock.sendMessage(from, {
                text: "❌ Give YouTube link!\nExample: .ytmp4 https://youtube.com/..."
            })
        }

        try {
            if (!ytdl.validateURL(url)) {
                return sock.sendMessage(from, { text: "❌ Invalid YouTube link!" })
            }

            await sock.sendMessage(from, {
                text: "🎥 Downloading video..."
            })

            const stream = ytdl(url, { filter: "audioandvideo" })

            await sock.sendMessage(from, {
                video: stream,
                mimetype: "video/mp4",
                fileName: "video.mp4"
            })

        } catch (e) {
            console.error(e)
            await sock.sendMessage(from, { text: "❌ Video download failed" })
        }
    }
}
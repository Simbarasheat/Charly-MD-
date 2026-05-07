const yts = require("yt-search")
const play = require("play-dl")
const fs = require("fs")
const path = require("path")
const lyricsFinder = require("lyrics-finder")
const Genius = require("genius-lyrics-api")

module.exports = async (ctx) => {
    const { sock, from, command, args, msg } = ctx

    // Make sure temp folder exists
    if (!fs.existsSync("./temp")) fs.mkdirSync("./temp")

    // 🎵 PLAY AUDIO
    if (command === "play") {
        const query = args.join(" ")
        if (!query) {
            return sock.sendMessage(from, {
                text: "❌ Give song name!\nExample: .play calm down"
            }, { quoted: msg })
        }

        let replyMsg
        try {
            replyMsg = await sock.sendMessage(from, {
                text: `🎶 Searching *${query}*...`
            }, { quoted: msg })

            const search = await yts(query)
            const video = search.videos[0]
            if (!video) {
                await sock.sendMessage(from, { delete: replyMsg.key })
                return sock.sendMessage(from, { text: "❌ No results found!" }, { quoted: msg })
            }

            await sock.sendMessage(from, {
                edit: replyMsg.key,
                text: `🎵 *${video.title}*\n⏳ Duration: ${video.timestamp}\n📥 Downloading audio...`
            })

            const stream = await play.stream(video.url, { quality: 2 }) 
            const fileName = path.join("./temp", `${Date.now()}.mp3`)

            const writeStream = fs.createWriteStream(fileName)
            stream.stream.pipe(writeStream)

            writeStream.on('finish', async () => {
                await sock.sendMessage(from, {
                    audio: { url: fileName },
                    mimetype: "audio/mpeg",
                    fileName: `${video.title}.mp3`
                }, { quoted: msg })

                await sock.sendMessage(from, {
                    text: `✅ *${video.title}* sent\n\n💡 Get lyrics: .lyrics ${video.title}\n⚡ SAT Limited`
                }, { quoted: msg })

                fs.unlinkSync(fileName)
                await sock.sendMessage(from, { delete: replyMsg.key })
            })

            writeStream.on('error', async (err) => {
                console.error("Write error:", err)
                await sock.sendMessage(from, { delete: replyMsg.key })
                await sock.sendMessage(from, { text: "❌ Download failed" }, { quoted: msg })
            })

        } catch (e) {
            console.error("Play error:", e)
            if (replyMsg) await sock.sendMessage(from, { delete: replyMsg.key })
            await sock.sendMessage(from, {
                text: "❌ Error playing song\n*Reason:* YouTube blocked server or song restricted"
            }, { quoted: msg })
        }
    }

    // 🎥 YTMP4
    if (command === "ytmp4") {
        const url = args[0]
        if (!url || !play.yt_validate(url)) {
            return sock.sendMessage(from, {
                text: "❌ Give valid YouTube link!\nExample: .ytmp4 https://youtube.com/..."
            }, { quoted: msg })
        }

        let replyMsg
        try {
            replyMsg = await sock.sendMessage(from, {
                text: "🎥 Fetching video info..."
            }, { quoted: msg })

            const videoInfo = await play.video_info(url)
            if (videoInfo.video_details.durationInSec > 600) {
                await sock.sendMessage(from, { delete: replyMsg.key })
                return sock.sendMessage(from, { 
                    text: "❌ Video too long! Max 10 minutes." 
                }, { quoted: msg })
            }

            await sock.sendMessage(from, {
                edit: replyMsg.key,
                text: `🎥 *${videoInfo.video_details.title}*\n📥 Downloading 360p...`
            })

            const stream = await play.stream(url, { quality: 18 }) // 360p
            const fileName = path.join("./temp", `${Date.now()}.mp4`)
            const writeStream = fs.createWriteStream(fileName)
            stream.stream.pipe(writeStream)

            writeStream.on('finish', async () => {
                const stats = fs.statSync(fileName)
                if (stats.size > 64 * 1024 * 1024) { // 64MB WhatsApp limit
                    fs.unlinkSync(fileName)
                    await sock.sendMessage(from, { delete: replyMsg.key })
                    return sock.sendMessage(from, { 
                        text: "❌ Video too large for WhatsApp. Try shorter video." 
                    }, { quoted: msg })
                }

                await sock.sendMessage(from, {
                    video: { url: fileName },
                    mimetype: "video/mp4",
                    fileName: `${videoInfo.video_details.title}.mp3`,
                    caption: `🎥 ${videoInfo.video_details.title}\n⚡ SAT Limited`
                }, { quoted: msg })

                fs.unlinkSync(fileName)
                await sock.sendMessage(from, { delete: replyMsg.key })
            })

        } catch (e) {
            console.error("Ytmp4 error:", e)
            if (replyMsg) await sock.sendMessage(from, { delete: replyMsg.key })
            await sock.sendMessage(from, { 
                text: "❌ Video download failed\n*Reason:* Age restricted or too large" 
            }, { quoted: msg })
        }
    }

    // 📜 LYRICS DOWNLOADER
    if (command === "lyrics") {
        const query = args.join(" ")
        if (!query) {
            return sock.sendMessage(from, {
                text: "❌ Give song name!\nExample: .lyrics calm down rema"
            }, { quoted: msg })
        }

        let replyMsg = await sock.sendMessage(from, {
            text: `🔍 Searching lyrics for *${query}*...`
        }, { quoted: msg })

        try {
            let lyrics = await lyricsFinder(query, "")

            if (!lyrics) {
                const options = {
                    apiKey: "free",
                    title: query,
                    artist: "",
                    optimizeQuery: true
                }
                lyrics = await Genius.getLyrics(options)
            }

            await sock.sendMessage(from, { delete: replyMsg.key })

            if (!lyrics) {
                return sock.sendMessage(from, {
                    text: `❌ Lyrics not found for *${query}*\n\nTry: .lyrics artist - song name`
                }, { quoted: msg })
            }

            if (lyrics.length > 4000) {
                const parts = lyrics.match(/.{1,4000}/gs)
                await sock.sendMessage(from, {
                    text: `📜 *LYRICS: ${query.toUpperCase()}*\n\n${parts[0]}`
                }, { quoted: msg })

                for (let i = 1; i < parts.length; i++) {
                    await new Promise(r => setTimeout(r, 1000))
                    await sock.sendMessage(from, { text: parts[i] })
                }
            } else {
                await sock.sendMessage(from, {
                    text: `📜 *LYRICS: ${query.toUpperCase()}*\n\n${lyrics}\n\n⚡ Powered by SAT Limited`
                }, { quoted: msg })
            }

        } catch (e) {
            console.error("Lyrics error:", e)
            await sock.sendMessage(from, { delete: replyMsg.key })
            await sock.sendMessage(from, {
                text: "❌ Error fetching lyrics\n*Try:* .lyrics artist - song name"
            }, { quoted: msg })
        }
    }
}
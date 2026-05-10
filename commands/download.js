const yts = require("yt-search")
const play = require("play-dl")
const fs = require("fs")
const path = require("path")
const lyricsFinder = require("lyrics-finder")
const Genius = require("genius-lyrics-api")

// =======================
// 📁 TEMP FOLDER
// =======================
const TEMP_DIR = "./temp"

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR)
}

// =======================
// 🧹 SAFE DELETE
// =======================
const safeDelete = (file) => {
    try {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file)
        }
    } catch (e) {
        console.log("Delete error:", e)
    }
}

// =======================
// 🤖 MODULE
// =======================
module.exports = async (ctx) => {

    const {
        sock,
        from,
        command,
        args = [],
        msg
    } = ctx

    // =======================
    // 🎵 PLAY AUDIO
    // =======================
    if (command === "play") {

        const query = args.join(" ").trim()

        if (!query) {
            return sock.sendMessage(from, {
                text:
`❌ Give song name!

Example:
.play calm down`
            }, { quoted: msg })
        }

        let statusMsg

        try {

            statusMsg = await sock.sendMessage(from, {
                text: `🔍 Searching for "${query}"...`
            }, { quoted: msg })

            const search = await yts(query)

            const video = search?.videos?.[0]

            if (!video) {
                return sock.sendMessage(from, {
                    text: "❌ No results found"
                }, { quoted: msg })
            }

            // Prevent long downloads
            if (video.seconds > 900) {
                return sock.sendMessage(from, {
                    text: "❌ Audio too long. Max 15 minutes."
                }, { quoted: msg })
            }

            await sock.sendMessage(from, {
                text:
`🎵 Downloading audio...

📌 ${video.title}
⏱️ ${video.timestamp}`
            }, { quoted: msg })

            const stream = await play.stream(video.url, {
                quality: 2
            })

            const fileName = path.join(
                TEMP_DIR,
                `${Date.now()}.mp3`
            )

            const writeStream = fs.createWriteStream(fileName)

            stream.stream.pipe(writeStream)

            writeStream.on("finish", async () => {

                try {

                    const stats = fs.statSync(fileName)

                    // WhatsApp safety
                    if (stats.size > 64 * 1024 * 1024) {
                        safeDelete(fileName)

                        return sock.sendMessage(from, {
                            text: "❌ Audio too large for WhatsApp"
                        }, { quoted: msg })
                    }

                    await sock.sendMessage(from, {
                        audio: {
                            url: fileName
                        },
                        mimetype: "audio/mpeg",
                        fileName: `${video.title}.mp3`
                    }, { quoted: msg })

                    await sock.sendMessage(from, {
                        text:
`✅ Audio sent

🎵 ${video.title}
⚡ SAT Limited`
                    }, { quoted: msg })

                } catch (e) {
                    console.log("Audio send error:", e)

                    await sock.sendMessage(from, {
                        text: "❌ Failed to send audio"
                    }, { quoted: msg })
                }

                safeDelete(fileName)
            })

            writeStream.on("error", async (err) => {

                console.log("Write stream error:", err)

                await sock.sendMessage(from, {
                    text: "❌ Download failed"
                }, { quoted: msg })

                safeDelete(fileName)
            })

        } catch (e) {

            console.log("Play command error:", e)

            await sock.sendMessage(from, {
                text:
`❌ Failed to download audio

Possible reasons:
• Video restricted
• YouTube blocked request
• Network issue`
            }, { quoted: msg })
        }
    }

    // =======================
    // 🎥 YTMP4
    // =======================
    if (command === "ytmp4") {

        const url = args[0]

        if (!url || !play.yt_validate(url)) {
            return sock.sendMessage(from, {
                text:
`❌ Invalid YouTube link

Example:
.ytmp4 https://youtube.com/...`
            }, { quoted: msg })
        }

        try {

            const info = await play.video_info(url)

            const video = info.video_details

            if (video.durationInSec > 600) {
                return sock.sendMessage(from, {
                    text: "❌ Video too long. Max 10 minutes."
                }, { quoted: msg })
            }

            await sock.sendMessage(from, {
                text:
`🎥 Downloading video...

📌 ${video.title}`
            }, { quoted: msg })

            const stream = await play.stream(url, {
                quality: 18
            })

            const fileName = path.join(
                TEMP_DIR,
                `${Date.now()}.mp4`
            )

            const writeStream = fs.createWriteStream(fileName)

            stream.stream.pipe(writeStream)

            writeStream.on("finish", async () => {

                try {

                    const stats = fs.statSync(fileName)

                    if (stats.size > 64 * 1024 * 1024) {

                        safeDelete(fileName)

                        return sock.sendMessage(from, {
                            text:
                                "❌ Video too large for WhatsApp"
                        }, { quoted: msg })
                    }

                    await sock.sendMessage(from, {
                        video: {
                            url: fileName
                        },
                        mimetype: "video/mp4",
                        fileName: `${video.title}.mp4`,
                        caption:
`🎥 ${video.title}

⚡ SAT Limited`
                    }, { quoted: msg })

                } catch (e) {

                    console.log("Video send error:", e)

                    await sock.sendMessage(from, {
                        text: "❌ Failed to send video"
                    }, { quoted: msg })
                }

                safeDelete(fileName)
            })

            writeStream.on("error", async (err) => {

                console.log("Video stream error:", err)

                await sock.sendMessage(from, {
                    text: "❌ Video download failed"
                }, { quoted: msg })

                safeDelete(fileName)
            })

        } catch (e) {

            console.log("YTMP4 error:", e)

            await sock.sendMessage(from, {
                text:
`❌ Failed to download video

Possible reasons:
• Age restricted
• Video unavailable
• Server blocked`
            }, { quoted: msg })
        }
    }

    // =======================
    // 📜 LYRICS
    // =======================
    if (command === "lyrics") {

        const query = args.join(" ").trim()

        if (!query) {
            return sock.sendMessage(from, {
                text:
`❌ Give song name

Example:
.lyrics calm down rema`
            }, { quoted: msg })
        }

        try {

            await sock.sendMessage(from, {
                text: `🔍 Searching lyrics for "${query}"...`
            }, { quoted: msg })

            let lyrics = await lyricsFinder(query, "")

            // Fallback
            if (!lyrics) {

                const options = {
                    apiKey: "free",
                    title: query,
                    artist: "",
                    optimizeQuery: true
                }

                lyrics = await Genius.getLyrics(options)
            }

            if (!lyrics) {
                return sock.sendMessage(from, {
                    text:
`❌ Lyrics not found

Try:
.lyrics artist - song`
                }, { quoted: msg })
            }

            // WhatsApp safe split
            const chunks = lyrics.match(/[\s\S]{1,3500}/g)

            for (let i = 0; i < chunks.length; i++) {

                await sock.sendMessage(from, {
                    text:
i === 0
? `📜 *${query.toUpperCase()}*\n\n${chunks[i]}`
: chunks[i]
                }, { quoted: msg })

                // Prevent spam burst
                if (i !== chunks.length - 1) {
                    await new Promise(r => setTimeout(r, 1200))
                }
            }

        } catch (e) {

            console.log("Lyrics error:", e)

            await sock.sendMessage(from, {
                text: "❌ Failed to fetch lyrics"
            }, { quoted: msg })
        }
    }
}
const OpenAI = require("openai")

// =======================
// 🔐 API KEY CHECK
// =======================
if (!process.env.OPENAI_API_KEY) {
    console.log("❌ OPENAI_API_KEY missing in environment variables")
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// =======================
// ⏱️ SIMPLE AI COOLDOWN
// =======================
const aiCooldown = new Map()

module.exports = async (ctx) => {
    const {
        sock,
        from,
        command,
        args = [],
        msg,
        sender
    } = ctx

    // =======================
    // 🤖 AI COMMANDS
    // =======================
    if (command === "gpt" || command === "ai") {

        // =======================
        // ⏱️ USER COOLDOWN
        // =======================
        const now = Date.now()

        if (aiCooldown.has(sender)) {
            const expire = aiCooldown.get(sender)

            if (now < expire) {
                return sock.sendMessage(from, {
                    text: "⏳ Please wait before using AI again."
                }, { quoted: msg })
            }
        }

        aiCooldown.set(sender, now + 10000)

        // =======================
        // ❓ QUESTION
        // =======================
        const question = args.join(" ").trim()

        if (!question) {
            return sock.sendMessage(from, {
                text:
`❌ Ask me something!

Example:
.gpt What is WhatsApp?`
            }, { quoted: msg })
        }

        // Prevent extremely long prompts
        if (question.length > 1000) {
            return sock.sendMessage(from, {
                text: "❌ Message too long."
            }, { quoted: msg })
        }

        try {

            // =======================
            // ✍️ TYPING INDICATOR
            // =======================
            await sock.sendPresenceUpdate("composing", from)

            // =======================
            // 🤖 OPENAI REQUEST
            // =======================
            const res = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You are Charly MD, a friendly WhatsApp bot made by SAT Limited. Keep replies short, useful, and friendly. Use emojis sometimes."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })

            // =======================
            // ✅ SAFE RESPONSE
            // =======================
            let answer =
                res?.choices?.[0]?.message?.content ||
                "❌ No response generated."

            // WhatsApp limit protection
            if (answer.length > 4000) {
                answer =
                    answer.substring(0, 4000) +
                    "\n\n...truncated"
            }

            // =======================
            // 📤 SEND MESSAGE
            // =======================
            await sock.sendMessage(from, {
                text:
`🤖 *CHARLY MD AI*

${answer}

⚡ SAT Limited`
            }, { quoted: msg })

        } catch (e) {

            console.error("AI Error:", e)

            let errorMsg = "❌ AI Error"

            // OpenAI errors
            if (e.status === 401) {
                errorMsg = "❌ Invalid OpenAI API key"
            }

            else if (e.status === 429) {
                errorMsg = "❌ AI limit reached. Try again later."
            }

            else if (e.status >= 500) {
                errorMsg = "❌ OpenAI servers unavailable"
            }

            else if (e.code === "ENOTFOUND") {
                errorMsg = "❌ Network error"
            }

            await sock.sendMessage(from, {
                text: errorMsg
            }, { quoted: msg })

        } finally {

            // =======================
            // ⏹️ STOP TYPING
            // =======================
            try {
                await sock.sendPresenceUpdate("paused", from)
            } catch {}
        }
    }
}
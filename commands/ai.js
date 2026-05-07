const OpenAI = require("openai")

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

module.exports = async (ctx) => {
    const { sock, from, command, args, msg } = ctx

    if (command === "gpt" || command === "ai") {
        const question = args.join(" ") // Fixed: was args.slice(1)

        if (!question) {
            return sock.sendMessage(from, {
                text: "❌ Ask me something!\n\n*Example:*.gpt What is WhatsApp?"
            }, { quoted: msg })
        }

        try {
            // Show typing indicator
            await sock.sendPresenceUpdate('composing', from)

            const res = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are Charly MD, a helpful WhatsApp bot made by SAT Limited. Keep replies short and friendly. Use emojis."
                    },
                    { role: "user", content: question }
                ],
                max_tokens: 500 // Prevent long replies that fail on WhatsApp
            })

            let answer = res.choices[0].message.content

            // WhatsApp limit is 4096 chars
            if (answer.length > 4000) {
                answer = answer.substring(0, 4000) + "\n\n...*truncated*"
            }

            await sock.sendMessage(from, {
                text: `🤖 *CHARLY MD AI*\n\n${answer}\n\n⚡ SAT Limited`
            }, { quoted: msg })

        } catch (e) {
            console.error("AI Error:", e.message)

            let errorMsg = "❌ AI Error"
            if (e.status === 401) errorMsg = "❌ Invalid API Key"
            if (e.status === 429) errorMsg = "❌ AI limit reached. Try later"
            if (e.status === 500) errorMsg = "❌ OpenAI servers down"

            await sock.sendMessage(from, { text: errorMsg }, { quoted: msg })
        } finally {
            await sock.sendPresenceUpdate('paused', from) // Stop typing
        }
    }
}
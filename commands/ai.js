const OpenAI = require("openai")

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    if (command === "gpt") {
        const question = args.slice(1).join(" ")

        if (!question) {
            return sock.sendMessage(from, { text: "❌ Ask something!" })
        }

        try {
            const res = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: question }]
            })

            await sock.sendMessage(from, {
                text: res.choices[0].message.content
            })
        } catch (e) {
            console.error(e)
            sock.sendMessage(from, { text: "❌ AI Error" })
        }
    }
}
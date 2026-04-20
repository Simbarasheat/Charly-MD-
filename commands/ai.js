const OpenAI = require("openai")

const client = new OpenAI({
    apiKey: "YOUR_OPENAI_API_KEY"
})

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    if (command === "gpt") {
        const question = args.slice(1).join(" ")

        if (!question) {
            return sock.sendMessage(from, { text: "❌ Ask something!" })
        }

        try {
            const response = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: question }]
            })

            const reply = response.choices[0].message.content

            await sock.sendMessage(from, { text: reply })

        } catch (err) {
            sock.sendMessage(from, { text: "❌ AI Error" })
        }
    }
}
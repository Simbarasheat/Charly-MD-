let games = {}

module.exports = async (ctx) => {
    const { sock, from, command, args } = ctx

    // GUESS GAME
    if (command === "guess") {
        if (!games[from]) {
            const number = Math.floor(Math.random() * 10) + 1
            games[from] = number

            return sock.sendMessage(from, {
                text: "🎯 Guess a number between 1-10"
            })
        } else {
            const guess = parseInt(args[1])

            if (guess === games[from]) {
                delete games[from]
                return sock.sendMessage(from, { text: "🎉 Correct!" })
            } else {
                return sock.sendMessage(from, { text: "❌ Wrong, try again" })
            }
        }
    }

    // TRIVIA
    if (command === "trivia") {
        const questions = [
            { q: "Capital of Zambia?", a: "lusaka" },
            { q: "2+2?", a: "4" }
        ]

        const q = questions[Math.floor(Math.random() * questions.length)]

        games[from] = q.a

        sock.sendMessage(from, { text: `🧠 ${q.q}` })
    }

    if (command === "answer") {
        const ans = args[1]?.toLowerCase()

        if (ans === games[from]) {
            delete games[from]
            sock.sendMessage(from, { text: "✅ Correct!" })
        } else {
            sock.sendMessage(from, { text: "❌ Wrong!" })
        }
    }
}
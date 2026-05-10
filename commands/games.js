// =======================
// 🎮 GAME STORAGE
// =======================
const guessGames = {}
const triviaGames = {}

// =======================
// ⏱️ AUTO CLEANUP
// =======================
setInterval(() => {

    const now = Date.now()

    // Guess cleanup
    for (const id in guessGames) {
        if (now > guessGames[id].expires) {
            delete guessGames[id]
        }
    }

    // Trivia cleanup
    for (const id in triviaGames) {
        if (now > triviaGames[id].expires) {
            delete triviaGames[id]
        }
    }

}, 60000)

// =======================
// 🤖 MODULE
// =======================
module.exports = async (ctx) => {

    const {
        sock,
        from,
        command,
        args = [],
        sender
    } = ctx

    // Unique game ID per chat + user
    const gameId = `${from}_${sender}`

    // =======================
    // 🎯 GUESS GAME
    // =======================
    if (command === "guess") {

        // Start new game
        if (!guessGames[gameId]) {

            const number =
                Math.floor(Math.random() * 10) + 1

            guessGames[gameId] = {
                answer: number,
                expires: Date.now() + 300000 // 5 mins
            }

            return sock.sendMessage(from, {
                text:
`🎯 Guess a number between 1 and 10

Example:
.guess 5`
            })
        }

        // Player guessing
        const guess = parseInt(args[0])

        if (isNaN(guess)) {
            return sock.sendMessage(from, {
                text: "❌ Enter a valid number"
            })
        }

        const answer = guessGames[gameId].answer

        if (guess === answer) {

            delete guessGames[gameId]

            return sock.sendMessage(from, {
                text: "🎉 Correct answer!"
            })
        }

        return sock.sendMessage(from, {
            text: "❌ Wrong guess, try again"
        })
    }

    // =======================
    // 🧠 TRIVIA
    // =======================
    if (command === "trivia") {

        const questions = [
            {
                q: "Capital city of Zambia?",
                a: "lusaka"
            },
            {
                q: "2 + 2 = ?",
                a: "4"
            },
            {
                q: "Largest planet?",
                a: "jupiter"
            },
            {
                q: "Water chemical formula?",
                a: "h2o"
            }
        ]

        const random =
            questions[Math.floor(Math.random() * questions.length)]

        triviaGames[gameId] = {
            answer: random.a,
            expires: Date.now() + 300000
        }

        return sock.sendMessage(from, {
            text:
`🧠 TRIVIA

${random.q}

Reply using:
.answer your_answer`
        })
    }

    // =======================
    // ✅ ANSWER
    // =======================
    if (command === "answer") {

        if (!triviaGames[gameId]) {
            return sock.sendMessage(from, {
                text: "❌ No active trivia game"
            })
        }

        const ans =
            args.join(" ").trim().toLowerCase()

        if (!ans) {
            return sock.sendMessage(from, {
                text: "❌ Give an answer"
            })
        }

        const correct =
            triviaGames[gameId].answer

        if (ans === correct) {

            delete triviaGames[gameId]

            return sock.sendMessage(from, {
                text: "✅ Correct answer!"
            })
        }

        return sock.sendMessage(from, {
            text: "❌ Wrong answer"
        })
    }
}
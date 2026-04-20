const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on("creds.update", saveCreds);

    // Store warnings in memory (you can save this to a file later if needed)
    let warnings = {};

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;
        if (!text.startsWith(".")) return;

        const args = text.split(" ");
        const command = args[0].slice(1).toLowerCase();
        const isGroup = from.endsWith("@g.us");
        const sender = msg.key.participant || msg.key.remoteJid;

        // Get group metadata if applicable
        let groupMetadata = isGroup ? await sock.groupMetadata(from) : null;
        let participants = isGroup ? groupMetadata.participants : [];

        // Check if sender and bot are admins
        const isAdmin = isGroup
            ? participants.find(p => p.id === sender)?.admin !== null
            : false;
        const isBotAdmin = isGroup
            ? participants.find(p => p.id === sock.user.id)?.admin !== null
            : false;

        // =============================
        // 🤖 GENERAL COMMANDS
        // =============================

        if (command === "ping") {
            await sock.sendMessage(from, { text: "🏓 Pong!" });
        }

        if (command === "alive") {
            await sock.sendMessage(from, {
                text: "✅ Charly MD Bot is running smoothly 🚀",
            });
        }

        if (command === "owner") {
            await sock.sendMessage(from, {
                text: `
👑 Owner Details:
Name: Simbarashe Augustus Tembo
Bot: Charly MD Bot
                `,
            });
        }

        if (command === "joke") {
            await sock.sendMessage(from, {
                text: "😂 Why did the programmer quit? Because he didn't get arrays.",
            });
        }

        if (command === "menu" || command === "help") {
            await sock.sendMessage(from, {
                text: `
╔═══════════════════╗
   🤖 Charly MD Bot  
   Version: 1.0.0
╚═══════════════════╝

🌐 *Commands*
➤ .ping
➤ .alive
➤ .joke
➤ .owner
                `,
            });
        }

        // =============================
        // 🔊 TTS COMMAND
        // =============================
        if (command === "tts") {
            const gTTS = require("gtts");
            const textToSpeak = args.slice(1).join(" ");

            if (!textToSpeak) {
                return sock.sendMessage(from, { text: "❌ Give me text!" });
            }

            const filePath = "./tts.mp3";
            const gtts = new gTTS(textToSpeak, "en");

            gtts.save(filePath, async () => {
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(filePath),
                    mimetype: "audio/mp4",
                });
            });
        }

        // =============================
        // ⚠️ WARNING SYSTEM
        // =============================
        if (command === "warn") {
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "❌ Admin only!" });
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) {
                return sock.sendMessage(from, { text: "❌ Tag a user!" });
            }

            const user = mentioned[0];

            if (!warnings[user]) {
                warnings[user] = 0;
            }
            warnings[user]++;

            if (warnings[user] >= 3) {
                // Kick user after 3 warnings
                if (isGroup) {
                    await sock.groupParticipantsUpdate(from, [user], "remove");
                    delete warnings[user]; // clear after kick
                    await sock.sendMessage(from, { text: "🚫 User kicked (3 warnings)!" });
                }
            } else {
                await sock.sendMessage(from, {
                    text: `⚠️ Warning ${warnings[user]}/3`,
                });
            }
        }

        // =============================
        // 🔗 ANTILINK SYSTEM
        // =============================
        if (isGroup && text.includes("chat.whatsapp.com")) {
            if (!isAdmin && isBotAdmin) {
                await sock.sendMessage(from, {
                    text: "🚫 Anti-link active! Removing user...",
                });
                await sock.groupParticipantsUpdate(from, [sender], "remove");
            }
        }

        // =============================
        // 👮 ADMIN COMMANDS
        // =============================
        if (command === "promote") {
            if (!isGroup) return;
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "❌ Admin only!" });
            }
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: "❌ I must be admin!" });
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) {
                return sock.sendMessage(from, { text: "❌ Tag a user!" });
            }

            await sock.groupParticipantsUpdate(from, mentioned, "promote");
            await sock.sendMessage(from, { text: "✅ User promoted!" });
        }

        if (command === "demote") {
            if (!isGroup) return;
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "❌ Admin only!" });
            }
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: "❌ I must be admin!" });
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) {
                return sock.sendMessage(from, { text: "❌ Tag a user!" });
            }

            await sock.groupParticipantsUpdate(from, mentioned, "demote");
            await sock.sendMessage(from, { text: "⚠️ User demoted!" });
        }

        if (command === "kick") {
            if (!isGroup) return;
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "❌ Admin only!" });
            }
            if (!isBotAdmin) {
                return sock.sendMessage(from, { text: "❌ I must be admin!" });
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) {
                return sock.sendMessage(from, { text: "❌ Tag a user!" });
            }

            await sock.groupParticipantsUpdate(from, mentioned, "remove");
            await sock.sendMessage(from, { text: "🚫 User removed from group!" });
        }

        // BAN (SIMULATED)
        if (command === "ban") {
            if (!isGroup) return sock.sendMessage(from, { text: "❌ Group only!" });
            if (!isAdmin) {
                return sock.sendMessage(from, { text: "❌ Admin only!" });
            }

            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) {
                return sock.sendMessage(from, { text: "❌ Tag a user!" });
            }

            // This adds the user to a temporary in-memory ban list
            if (!warnings.bannedUsers) {
                warnings.bannedUsers = [];
            }
            warnings.bannedUsers.push(...mentioned);

            await sock.groupParticipantsUpdate(from, mentioned, "remove");
            await sock.sendMessage(from, { text: "🚫 User banned (temporary)!" });
        }
    });
}

startBot();
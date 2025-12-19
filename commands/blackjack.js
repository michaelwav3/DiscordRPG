"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blackjack = blackjack;
// commands/blackjack.ts
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];
const suits = ["♠", "♥", "♦", "♣"];
// Infinite deck shoe – just random cards
function drawCard() {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    let value = 0;
    if (rank === "A")
        value = 11;
    //@ts-ignore
    else if (["J", "Q", "K"].includes(rank))
        value = 10;
    //@ts-ignore
    else
        value = parseInt(rank, 10);
    //@ts-ignore
    return { rank, suit, value };
}
function handValue(hand) {
    let total = 0;
    let aces = 0;
    for (const c of hand) {
        total += c.value;
        if (c.rank === "A")
            aces++;
    }
    // If total > 21, drop some aces from 11 -> 1
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}
function formatHand(hand, hideFirst = false) {
    if (hideFirst && hand.length > 0) {
        const [, ...rest] = hand;
        const restStr = rest.map((c) => `${c.rank}${c.suit}`).join(" ");
        return `🂠 ${restStr || ""}`.trim();
    }
    return hand.map((c) => `${c.rank}${c.suit}`).join(" ");
}
async function blackjack(message, userData) {
    const user = userData[message.author.id];
    if (!user) {
        //@ts-ignore
        return message.channel.send("You are not registered! Use %register first.");
    }
    // 🔒 Location gate: only in Goblin Casino
    if (user.location !== "Goblin Casino") {
        //@ts-ignore
        return message.channel.send("You can only play blackjack in the Goblin Casino!");
    }
    // Parse bet: %blackjack 100
    const args = message.content.trim().split(/\s+/).slice(1);
    let bet = 0;
    if (args[0]) {
        const n = parseInt(args[0], 10);
        if (!isNaN(n) && n > 0)
            bet = n;
    }
    if (bet <= 0) {
        //@ts-ignore
        return message.channel.send("Enter a valid bet amount. Example: `%blackjack 50`");
    }
    if ((user.balance || 0) < bet) {
        //@ts-ignore
        return message.channel.send("You don't have enough coins for that bet.");
    }
    // Local game state
    let playerHand = [drawCard(), drawCard()];
    let dealerHand = [drawCard(), drawCard()];
    let gameOver = false;
    const playerName = message.author.username;
    function buildEmbed(showDealerHole = false, footerText) {
        const playerTotal = handValue(playerHand);
        const dealerTotal = showDealerHole ? handValue(dealerHand) : undefined;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🃏 Blackjack - Goblin Casino`)
            .setDescription(`**Player: ${playerName}**\n` +
            `Hand: ${formatHand(playerHand)} (${playerTotal})\n\n` +
            `**Dealer**\n` +
            `Hand: ${showDealerHole
                ? `${formatHand(dealerHand)} (${dealerTotal})`
                : `${formatHand(dealerHand, true)}`}`)
            .setColor(0x00aa88);
        // ✅ Only set footer if we actually have text
        if (footerText && footerText.length > 0) {
            embed.setFooter({ text: footerText });
        }
        return embed;
    }
    const buttonsRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("hit")
        .setLabel("Hit")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId("stand")
        .setLabel("Stand")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    // Check for natural blackjack
    const playerTotal = handValue(playerHand);
    const dealerTotal = handValue(dealerHand);
    //@ts-ignore
    const gameMessage = await message.channel.send({
        content: `💰 You bet **${bet} coins** at the Goblin Casino!`,
        embeds: [buildEmbed(false)],
        components: [buttonsRow],
    });
    // If immediate blackjack states exist, resolve at once
    async function resolveImmediateBlackjack() {
        let footer = "";
        let balanceChange = 0;
        const pVal = handValue(playerHand);
        const dVal = handValue(dealerHand);
        const playerBJ = playerHand.length === 2 && pVal === 21;
        const dealerBJ = dealerHand.length === 2 && dVal === 21;
        if (playerBJ && !dealerBJ) {
            // Blackjack win 3:2
            const win = Math.floor(bet * 1.5);
            balanceChange = win;
            footer = `Blackjack! You win **${win} coins**.`;
        }
        else if (!playerBJ && dealerBJ) {
            balanceChange = -bet;
            footer = `Dealer has blackjack. You lose **${bet} coins**.`;
        }
        else if (playerBJ && dealerBJ) {
            footer = `Both you and the dealer have blackjack. Push (no coins won or lost).`;
        }
        else {
            // no natural, continue game
            return false;
        }
        // apply result
        user.balance = (user.balance || 0) + balanceChange;
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        gameOver = true;
        await gameMessage.edit({
            content: `🃏 Blackjack result:`,
            embeds: [buildEmbed(true, footer)],
            components: [],
        });
        return true;
    }
    // if natural BJ situation, handle now
    if (await resolveImmediateBlackjack()) {
        return;
    }
    // Otherwise create collector for HIT/STAND
    const filter = (i) => i.user.id === message.author.id && i.message.id === gameMessage.id;
    const collector = gameMessage.createMessageComponentCollector({
        filter,
        componentType: discord_js_1.ComponentType.Button,
        time: 2 * 60 * 1000, // 2 minutes
    });
    async function finishRound() {
        // Dealer draws until 17+
        while (handValue(dealerHand) < 17) {
            dealerHand.push(drawCard());
        }
        const pVal = handValue(playerHand);
        const dVal = handValue(dealerHand);
        let footer = "";
        let balanceChange = 0;
        if (pVal > 21) {
            // already handled in hit, but just in case
            balanceChange = -bet;
            footer = `You bust with ${pVal}. You lose **${bet} coins**.`;
        }
        else if (dVal > 21) {
            balanceChange = bet;
            footer = `Dealer busts with ${dVal}. You win **${bet} coins**!`;
        }
        else if (pVal > dVal) {
            balanceChange = bet;
            footer = `You win **${bet} coins**! (${pVal} vs ${dVal})`;
        }
        else if (pVal < dVal) {
            balanceChange = -bet;
            footer = `You lose **${bet} coins**. (${pVal} vs ${dVal})`;
        }
        else {
            footer = `Push. (${pVal} vs ${dVal}) No coins won or lost.`;
        }
        user.balance = (user.balance || 0) + balanceChange;
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
        gameOver = true;
        collector.stop("finished");
        await gameMessage.edit({
            content: `🃏 Blackjack result:`,
            embeds: [buildEmbed(true, footer)],
            components: [],
        });
    }
    collector.on("collect", async (interaction) => {
        if (gameOver) {
            return interaction.reply({
                content: "This game is already over.",
                ephemeral: true,
            });
        }
        if (interaction.customId === "hit") {
            playerHand.push(drawCard());
            const total = handValue(playerHand);
            if (total > 21) {
                // Player busts immediately
                user.balance = (user.balance || 0) - bet;
                fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
                gameOver = true;
                collector.stop("bust");
                await interaction.update({
                    content: `💥 You drew a card and busted with **${total}**. You lose **${bet} coins**.`,
                    embeds: [buildEmbed(true, `You busted with ${total}.`)],
                    components: [],
                });
                return;
            }
            // still alive
            await interaction.update({
                content: `💰 Bet: **${bet} coins**`,
                embeds: [buildEmbed(false, "You choose to hit.")],
                components: [buttonsRow],
            });
        }
        else if (interaction.customId === "stand") {
            // Player stands -> finish dealer round
            await interaction.update({
                content: `💰 Bet: **${bet} coins**`,
                embeds: [buildEmbed(true, "You stand. Dealer's turn...")],
                components: [],
            });
            await finishRound();
        }
    });
    //@ts-ignore
    collector.on("end", async (_collected, reason) => {
        if (!gameOver && reason === "time") {
            // Game timed out – no balance change, reveal hands
            gameOver = true;
            try {
                await gameMessage.edit({
                    content: "⏰ Blackjack game ended due to inactivity.",
                    embeds: [buildEmbed(true, "No result; game expired.")],
                    components: [],
                });
            }
            catch {
                // ignore
            }
        }
    });
}
//# sourceMappingURL=blackjack.js.map
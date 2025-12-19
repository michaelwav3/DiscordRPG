"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shop = shop;
// commands/shop.ts
const discord_js_1 = require("discord.js");
const items_1 = require("../data/items");
const market_1 = require("../data/market");
// -------------------------------
// Helper: chunk long strings safely
// -------------------------------
function chunkString(str, max = 1000) {
    const chunks = [];
    let current = "";
    for (const line of str.split("\n")) {
        if ((current + line + "\n").length > max) {
            chunks.push(current);
            current = "";
        }
        current += line + "\n";
    }
    if (current)
        chunks.push(current);
    return chunks;
}
// -------------------------------
// SHOP COMMAND
// -------------------------------
async function shop(Message, userData) {
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        return Message.channel.send("You are not registered!");
    }
    // Location check
    if (user.location !== "Western Capital Market") {
        //@ts-ignore
        return Message.channel.send("You can only use the **%shop** command at the **Western Capital Market**.");
    }
    // -------------------------------
    // Build shop text
    // -------------------------------
    let buyList = "";
    let sellList = "";
    // BUY LIST
    for (const itemId in market_1.SHOP_INVENTORY) {
        const item = items_1.ITEMS[itemId];
        const buyPrice = market_1.SHOP_INVENTORY[itemId];
        if (!item)
            continue;
        buyList +=
            `• **${item.name}**\n` +
                `  ${item.description ?? "No description."}\n` +
                `  💰 Buy: **${buyPrice} coins**\n\n`;
    }
    // SELL LIST
    for (const itemId in market_1.MARKET_PRICES) {
        const item = items_1.ITEMS[itemId];
        if (!item)
            continue;
        const basePrice = market_1.MARKET_PRICES[itemId];
        //@ts-ignore
        const sellPrice = Math.floor(basePrice * market_1.SELL_MULTIPLIER);
        sellList +=
            `• **${item.name}**\n` +
                `  💰 Sell: **${sellPrice} coins**\n\n`;
    }
    // -------------------------------
    // Build pages
    // -------------------------------
    const pages = [];
    const buyChunks = chunkString(buyList || "*No stock available.*");
    buyChunks.forEach((chunk, i) => {
        pages.push({
            title: i === 0 ? "🛍️ Items For Sale" : "🛍️ Items For Sale (cont.)",
            content: chunk,
        });
    });
    const sellChunks = chunkString(sellList || "*The market is not buying items right now.*");
    sellChunks.forEach((chunk, i) => {
        pages.push({
            title: i === 0
                ? "💰 Items Market Will Buy Back"
                : "💰 Items Market Will Buy Back (cont.)",
            content: chunk,
        });
    });
    if (pages.length === 0) {
        pages.push({
            title: "Shop",
            content: "*Nothing available.*",
        });
    }
    // -------------------------------
    // Embed + buttons builders
    // -------------------------------
    let pageIndex = 0;
    function buildEmbed(index) {
        return new discord_js_1.EmbedBuilder()
            .setTitle("🛒 Western Capital Market")
            .setDescription("Use `%buy [item] [qty]` to purchase and `%sell [item] [qty]` to sell.")
            .addFields({
            //@ts-ignore
            name: pages[index].title,
            //@ts-ignore
            value: pages[index].content,
            inline: false,
        })
            .setFooter({
            text: `Page ${index + 1} / ${pages.length} • Sell Rate: ${market_1.SELL_MULTIPLIER * 100}%`,
        })
            .setColor(0x3498db);
    }
    function buildButtons(index) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("shop_prev")
            .setLabel("<")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(index === 0), new discord_js_1.ButtonBuilder()
            .setCustomId("shop_next")
            .setLabel(">")
            .setStyle(discord_js_1.ButtonStyle.Secondary)
            .setDisabled(index === pages.length - 1));
    }
    // -------------------------------
    // Send shop message
    // -------------------------------
    //@ts-ignore
    const shopMessage = await Message.channel.send({
        embeds: [buildEmbed(pageIndex)],
        components: [buildButtons(pageIndex)],
    });
    // -------------------------------
    // Button collector
    // -------------------------------
    const collector = shopMessage.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 2 * 60 * 1000, // 2 minutes
    });
    //@ts-ignore
    collector.on("collect", async (interaction) => {
        if (interaction.user.id !== Message.author.id) {
            return interaction.reply({
                content: "This shop menu isn't yours.",
                ephemeral: true,
            });
        }
        if (interaction.customId === "shop_prev") {
            pageIndex--;
        }
        else if (interaction.customId === "shop_next") {
            pageIndex++;
        }
        await interaction.update({
            embeds: [buildEmbed(pageIndex)],
            components: [buildButtons(pageIndex)],
        });
    });
    collector.on("end", async () => {
        try {
            await shopMessage.edit({ components: [] });
        }
        catch { }
    });
}
//# sourceMappingURL=shop.js.map
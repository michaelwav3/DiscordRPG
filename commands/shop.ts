// commands/shop.ts
import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { ITEMS } from "../data/items";
import {
  MARKET_PRICES,
  SELL_MULTIPLIER,
  SHOP_INVENTORY,
} from "../data/market";

// -------------------------------
// Helper: chunk long strings safely
// -------------------------------
function chunkString(str: string, max = 1000): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const line of str.split("\n")) {
    if ((current + line + "\n").length > max) {
      chunks.push(current);
      current = "";
    }
    current += line + "\n";
  }

  if (current) chunks.push(current);
  return chunks;
}

// -------------------------------
// SHOP COMMAND
// -------------------------------
export async function shop(Message: Message, userData: any) {
  const user = userData[Message.author.id];
  if (!user) {
    //@ts-ignore
    return Message.channel.send("You are not registered!");
  }

  // Location check
  if (user.location !== "Western Capital Market") {
    //@ts-ignore
    return Message.channel.send(
      "You can only use the **%shop** command at the **Western Capital Market**."
    );
  }

  // -------------------------------
  // Build shop text
  // -------------------------------
  let buyList = "";
  let sellList = "";

  // BUY LIST
  for (const itemId in SHOP_INVENTORY) {
    const item = ITEMS[itemId];
    const buyPrice = SHOP_INVENTORY[itemId];

    if (!item) continue;

    buyList +=
      `• **${item.name}**\n` +
      `  ${item.description ?? "No description."}\n` +
      `  💰 Buy: **${buyPrice} coins**\n\n`;
  }

  // SELL LIST
  for (const itemId in MARKET_PRICES) {
    const item = ITEMS[itemId];
    if (!item) continue;

    const basePrice = MARKET_PRICES[itemId];
    //@ts-ignore
    const sellPrice = Math.floor(basePrice * SELL_MULTIPLIER);

    sellList +=
      `• **${item.name}**\n` +
      `  💰 Sell: **${sellPrice} coins**\n\n`;
  }

  // -------------------------------
  // Build pages
  // -------------------------------
  const pages: { title: string; content: string }[] = [];

  const buyChunks = chunkString(buyList || "*No stock available.*");
  buyChunks.forEach((chunk, i) => {
    pages.push({
      title: i === 0 ? "🛍️ Items For Sale" : "🛍️ Items For Sale (cont.)",
      content: chunk,
    });
  });

  const sellChunks = chunkString(
    sellList || "*The market is not buying items right now.*"
  );
  sellChunks.forEach((chunk, i) => {
    pages.push({
      title:
        i === 0
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

  function buildEmbed(index: number) {
    return new EmbedBuilder()
      .setTitle("🛒 Western Capital Market")
      .setDescription(
        "Use `%buy [item] [qty]` to purchase and `%sell [item] [qty]` to sell."
      )
      .addFields({
        //@ts-ignore
        name: pages[index].title,
        //@ts-ignore
        value: pages[index].content,
        inline: false,
      })
      .setFooter({
        text: `Page ${index + 1} / ${pages.length} • Sell Rate: ${
          SELL_MULTIPLIER * 100
        }%`,
      })
      .setColor(0x3498db);
  }

  function buildButtons(index: number) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("shop_prev")
        .setLabel("<")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(index === 0),

      new ButtonBuilder()
        .setCustomId("shop_next")
        .setLabel(">")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(index === pages.length - 1)
    );
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
    componentType: ComponentType.Button,
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
    } else if (interaction.customId === "shop_next") {
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
    } catch {}
  });
}

// commands/trade.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Message,
} from "discord.js";
import fs from "fs";
import { ITEMS } from "../data/items";

// ---------- Types ----------
interface TradeOffer {
  items: string[];
  coins: number;
  ready: boolean;
}

interface TradeSession {
  channelId: string;
  messageId: string; // trade window message
  user1Id: string;
  user2Id: string;
  offers: Record<string, TradeOffer>; // key: userId
}

// Active trades in memory (reset if bot restarts, which is fine)
const activeTrades = new Map<string, TradeSession>(); // key: tradeMessageId

function findSessionForUser(userId: string): TradeSession | undefined {
  for (const session of activeTrades.values()) {
    if (session.user1Id === userId || session.user2Id === userId) {
      return session;
    }
  }
  return undefined;
}

function buildTradeEmbed(session: TradeSession, userData: any) {
  const u1 = userData[session.user1Id];
  const u2 = userData[session.user2Id];

  const offer1 = session.offers[session.user1Id];
  const offer2 = session.offers[session.user2Id];

  const name1 = u1?.name || u1?.username || "Player 1";
  const name2 = u2?.name || u2?.username || "Player 2";

  const listItems = (ids: string[]) =>
    ids.length === 0
      ? "_None_"
      : ids
          .map((id) => {
            const def = ITEMS[id];
            return def ? def.name : id;
          })
          .map((n) => `• ${n}`)
          .join("\n");

  return new EmbedBuilder()
    .setTitle("📦 Trade Window")
    .setDescription("Both players can add/remove items and coins, then confirm to finalize the trade.")
    .addFields(
      {
        name: `${name1}'s Offer ${
          //@ts-ignore
          offer1.ready ? "✅ (ready)" : "❌ (not ready)"
        }`,
        value:
        //@ts-ignore
          `**Items:**\n${listItems(offer1.items)}\n\n` +
          //@ts-ignore
          `**Coins:** ${offer1.coins}`,
        inline: true,
      },
      {
        name: `${name2}'s Offer ${
          //@ts-ignore
          offer2.ready ? "✅ (ready)" : "❌ (not ready)"
        }`,
        value:
        //@ts-ignore
          `**Items:**\n${listItems(offer2.items)}\n\n` +
          //@ts-ignore
          `**Coins:** ${offer2.coins}`,
        inline: true,
      }
    )
    .setColor(0x00ae86);
}

// ---------- Main entry ----------
export async function trade(message: Message, userData: any) {
  const sender = userData[message.author.id];
  if (!sender) {
    //@ts-ignore
    return message.channel.send("You are not registered! Use %register first.");
  }

  const parts = message.content.trim().split(/\s+/);
  const args = parts.slice(1); // everything after "trade"

  // 1) If first arg is a mention → start a trade request
  if (args[0] && args[0].startsWith("<@")) {
    return startTradeRequest(message, userData, args);
  }

  // 2) Otherwise, treat as subcommand for an existing trade:
  //    %trade add item <itemId>
  //    %trade remove item <itemId>
  //    %trade add coins <amount>
  //    %trade remove coins <amount>
  const sub = (args[0] || "").toLowerCase();

  if (!sub) {
    //@ts-ignore
    return message.channel.send(
      "Usage:\n" +
        "`%trade @user` to start a trade\n" +
        "`%trade add item <itemId>`\n" +
        "`%trade remove item <itemId>`\n" +
        "`%trade add coins <amount>`\n" +
        "`%trade remove coins <amount>`"
    );
  }

  const session = findSessionForUser(message.author.id);
  if (!session) {
    //@ts-ignore
    return message.channel.send(
      "You are not currently in an active trade."
    );
  }

  if (sub === "add" || sub === "remove") {
    const mode = sub; // "add" or "remove"
    const kind = (args[1] || "").toLowerCase(); // "item" or "coins"

    if (kind === "item") {
      const itemId = (args[2] || "").toLowerCase().replace(" ", "_");
      if (!itemId) {
        //@ts-ignore
        return message.channel.send(
          "Specify an item ID. Example: `%trade add item wooden_stick`"
        );
      }
      return modifyTradeItem(message, userData, session, mode, itemId);
    } else if (kind === "coins") {
      const amount = parseInt(args[2] || "0", 10);
      if (!amount || amount <= 0) {
        //@ts-ignore
        return message.channel.send(
          "Specify a positive coin amount. Example: `%trade add coins 50`"
        );
      }
      return modifyTradeCoins(message, userData, session, mode, amount);
    } else {
      //@ts-ignore
      return message.channel.send(
        "Unknown trade subcommand. Use `item` or `coins`.\nExample: `%trade add item wooden_stick`"
      );
    }
  }

  //@ts-ignore
  return message.channel.send(
    "Unknown trade command. Valid examples:\n" +
      "`%trade @user`\n" +
      "`%trade add item <itemId>`\n" +
      "`%trade remove item <itemId>`\n" +
      "`%trade add coins <amount>`\n" +
      "`%trade remove coins <amount>`"
  );
}

// ---------- Start trade request (Accept/Decline) ----------
async function startTradeRequest(
  message: Message,
  userData: any,
  args: string[]
) {
  const sender = userData[message.author.id];
  const targetUser = message.mentions.users.first();

  if (!targetUser) {
    //@ts-ignore
    return message.channel.send("Usage: `%trade @user`");
  }

  if (targetUser.id === message.author.id) {
    //@ts-ignore
    return message.channel.send("You can't trade with yourself.");
  }

  const receiver = userData[targetUser.id];
  if (!receiver) {
    //@ts-ignore
    return message.channel.send("That user is not registered yet.");
  }

  // Prevent multiple simultaneous trades involving these users
  if (findSessionForUser(message.author.id) || findSessionForUser(targetUser.id)) {
    //@ts-ignore
    return message.channel.send(
      "Either you or that user is already in an active trade."
    );
  }

  // Ask for accept/decline
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("trade_req_accept")
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("trade_req_decline")
      .setLabel("Decline")
      .setStyle(ButtonStyle.Danger)
  );

  //@ts-ignore
  const reqMsg = await message.channel.send({
    content: `📦 **${message.author.username}** wants to trade with **${targetUser.username}**.\n${targetUser}, do you accept?`,
    components: [row],
  });

  const filter = (i: any) =>
    i.user.id === targetUser.id && i.message.id === reqMsg.id;

  const collector = reqMsg.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: 60 * 1000,
  });

  let accepted = false;

  collector.on("collect", async (interaction: any) => {
    if (interaction.customId === "trade_req_decline") {
      collector.stop("declined");
      await interaction.update({
        content: `❌ ${targetUser.username} declined the trade.`,
        components: [],
      });
    } else if (interaction.customId === "trade_req_accept") {
      accepted = true;
      collector.stop("accepted");

      await interaction.update({
        content: `✅ ${targetUser.username} accepted the trade! Opening trade window...`,
        components: [],
      });

      await startTradeSession(message, userData, message.author.id, targetUser.id);
    }
  });
//@ts-ignore
  collector.on("end", async (_collected, reason) => {
    if (!accepted && reason === "time") {
      try {
        await reqMsg.edit({
          content: "⏰ Trade request expired (no response).",
          components: [],
        });
      } catch {
        // ignore
      }
    }
  });
}

// ---------- Start trade session (window + buttons) ----------
async function startTradeSession(
  message: Message,
  userData: any,
  user1Id: string,
  user2Id: string
) {
  const session: TradeSession = {
    channelId: message.channel.id,
    messageId: "",
    user1Id,
    user2Id,
    offers: {
      [user1Id]: { items: [], coins: 0, ready: false },
      [user2Id]: { items: [], coins: 0, ready: false },
    },
  };

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("trade_confirm")
      .setLabel("Confirm / Unconfirm")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("trade_cancel")
      .setLabel("Cancel Trade")
      .setStyle(ButtonStyle.Danger)
  );

  //@ts-ignore
  const tradeMsg = await message.channel.send({
    content:
      `📦 Trade started between <@${user1Id}> and <@${user2Id}>.\n` +
      `Use:\n` +
      "`%trade add item <itemId>` / `%trade remove item <itemId>`\n" +
      "`%trade add coins <amount>` / `%trade remove coins <amount>`\n" +
      "When both are ready, press **Confirm**.",
    embeds: [buildTradeEmbed(session, userData)],
    components: [row],
  });

  session.messageId = tradeMsg.id;
  activeTrades.set(tradeMsg.id, session);

  const filter = (i: any) =>
    [user1Id, user2Id].includes(i.user.id) && i.message.id === tradeMsg.id;

  const collector = tradeMsg.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000, // 5 minutes
  });

  collector.on("collect", async (interaction: any) => {
    const s = activeTrades.get(tradeMsg.id);
    if (!s) {
      return interaction.reply({
        content: "This trade is no longer active.",
        ephemeral: true,
      });
    }

    const userId = interaction.user.id;
    if (![s.user1Id, s.user2Id].includes(userId)) {
      return interaction.reply({
        content: "You are not part of this trade.",
        ephemeral: true,
      });
    }

    if (interaction.customId === "trade_cancel") {
      activeTrades.delete(tradeMsg.id);
      collector.stop("cancelled");

      await interaction.update({
        content: `❌ Trade cancelled by <@${userId}>.`,
        embeds: [],
        components: [],
      });
      return;
    }

    if (interaction.customId === "trade_confirm") {
      // Toggle ready state for this user
      const offer = s.offers[userId];
      //@ts-ignore
      offer.ready = !offer.ready;

      // If both are ready, finalize the trade
      const offer1 = s.offers[s.user1Id];
      const offer2 = s.offers[s.user2Id];
//@ts-ignore
      if (offer1.ready && offer2.ready) {
        const success = await finalizeTrade(message, userData, s);
        activeTrades.delete(tradeMsg.id);
        collector.stop("completed");
        if (!success) {
          // finalizeTrade already edited message/content
          return;
        }
        await interaction.update({
          content: "✅ Trade completed successfully.",
          embeds: [buildTradeEmbed(s, userData)],
          components: [],
        });
        return;
      } else {
        // Just update embed, showing new ready state
        await interaction.update({
          content: interaction.message.content,
          embeds: [buildTradeEmbed(s, userData)],
          components: (interaction.message as any).components,
        });
        return;
      }
    }
  });
//@ts-ignore
  collector.on("end", async (_collected, reason) => {
    if (reason === "time" && activeTrades.has(tradeMsg.id)) {
      activeTrades.delete(tradeMsg.id);
      try {
        await tradeMsg.edit({
          content: "⏰ Trade ended due to inactivity.",
          embeds: [buildTradeEmbed(session, userData)],
          components: [],
        });
      } catch {
        // ignore
      }
    }
  });
}

// ---------- Modify items in an active trade ----------
async function modifyTradeItem(
  message: Message,
  userData: any,
  session: TradeSession,
  mode: "add" | "remove",
  itemId: string
) {
  const userId = message.author.id;
  const offer = session.offers[userId];
  if (!offer) {
    //@ts-ignore
    return message.channel.send("You are not part of this trade.");
  }

  const user = userData[userId];
  if (!user || !Array.isArray(user.inventory)) {
    //@ts-ignore
    return message.channel.send("Your inventory is invalid.");
  }

  if (mode === "add") {
    // Make sure user actually has this item and isn't over-offering
    const invCounts: Record<string, number> = {};
    for (const id of user.inventory) {
      invCounts[id] = (invCounts[id] || 0) + 1;
    }

    const offeredCounts: Record<string, number> = {};
    for (const id of offer.items) {
      offeredCounts[id] = (offeredCounts[id] || 0) + 1;
    }

    const available = (invCounts[itemId] || 0) - (offeredCounts[itemId] || 0);
    if (available <= 0) {
      //@ts-ignore
      return message.channel.send(
        "You don't have any more of that item to offer."
      );
    }

    offer.items.push(itemId);
    // Any change -> both sides must re-confirm
    //@ts-ignore
    session.offers[session.user1Id].ready = false;
    //@ts-ignore
    session.offers[session.user2Id].ready = false;

    await updateTradeWindow(message, userData, session);
    //@ts-ignore
    return message.channel.send(`Added **${itemId}** to your trade offer.`);
  } else {
    // remove
    const idx = offer.items.indexOf(itemId);
    if (idx === -1) {
      //@ts-ignore
      return message.channel.send("That item is not in your current offer.");
    }

    offer.items.splice(idx, 1);
    //@ts-ignore
    session.offers[session.user1Id].ready = false;
    //@ts-ignore
    session.offers[session.user2Id].ready = false;

    await updateTradeWindow(message, userData, session);
    //@ts-ignore
    return message.channel.send(
      `Removed **${itemId}** from your trade offer.`
    );
  }
}

// ---------- Modify coins in an active trade ----------
async function modifyTradeCoins(
  message: Message,
  userData: any,
  session: TradeSession,
  mode: "add" | "remove",
  amount: number
) {
  const userId = message.author.id;
  const offer = session.offers[userId];
  if (!offer) {
    //@ts-ignore
    return message.channel.send("You are not part of this trade.");
  }

  const user = userData[userId];
  const balance = user.balance || 0;

  if (mode === "add") {
    if (offer.coins + amount > balance) {
      //@ts-ignore
      return message.channel.send(
        "You can't offer more coins than you currently have."
      );
    }
    offer.coins += amount;
  } else {
    if (offer.coins < amount) {
      //@ts-ignore
      return message.channel.send(
        "You can't remove more coins than you have offered."
      );
    }
    offer.coins -= amount;
  }
//@ts-ignore
  session.offers[session.user1Id].ready = false;
  //@ts-ignore
  session.offers[session.user2Id].ready = false;

  await updateTradeWindow(message, userData, session);
  //@ts-ignore
  return message.channel.send(
    `Your coin offer is now **${offer.coins}** coins.`
  );
}

// ---------- Update trade window embed ----------
async function updateTradeWindow(
  message: Message,
  userData: any,
  session: TradeSession
) {
  try {
    const tradeMsg = await message.channel.messages.fetch(session.messageId);
    await tradeMsg.edit({
      content: tradeMsg.content,
      embeds: [buildTradeEmbed(session, userData)],
      components: (tradeMsg as any).components,
    });
  } catch {
    // ignore
  }
}

// ---------- Finalize trade (swap items/coins) ----------
async function finalizeTrade(
  message: Message,
  userData: any,
  session: TradeSession
): Promise<boolean> {
  const u1 = userData[session.user1Id];
  const u2 = userData[session.user2Id];

  if (!u1 || !u2) {
    //@ts-ignore
    await message.channel.send(
      "❌ Trade failed: one of the users is no longer registered."
    );
    return false;
  }

  const o1 = session.offers[session.user1Id];
  const o2 = session.offers[session.user2Id];

  // Re-validate items & coins for both sides
  const hasEnough = (user: any, offer: TradeOffer) => {
    if (!Array.isArray(user.inventory)) return false;

    const invCounts: Record<string, number> = {};
    for (const id of user.inventory) {
      invCounts[id] = (invCounts[id] || 0) + 1;
    }

    const neededCounts: Record<string, number> = {};
    for (const id of offer.items) {
      neededCounts[id] = (neededCounts[id] || 0) + 1;
    }

    for (const [id, cnt] of Object.entries(neededCounts)) {
      if (!invCounts[id] || invCounts[id] < cnt) return false;
    }

    if ((user.balance || 0) < offer.coins) return false;

    return true;
  };
//@ts-ignore
  if (!hasEnough(u1, o1) || !hasEnough(u2, o2)) {
    //@ts-ignore
    await message.channel.send(
      "❌ Trade failed: one of the users no longer has the offered items/coins."
    );
    return false;
  }

  // Apply: remove o1's items from u1, add to u2; remove o2's from u2, add to u1
  const removeItems = (user: any, items: string[]) => {
    for (const id of items) {
      const idx = user.inventory.indexOf(id);
      if (idx !== -1) user.inventory.splice(idx, 1);
    }
  };
//@ts-ignore
  removeItems(u1, o1.items);
  //@ts-ignore
  removeItems(u2, o2.items);

  if (!Array.isArray(u1.inventory)) u1.inventory = [];
  if (!Array.isArray(u2.inventory)) u2.inventory = [];
//@ts-ignore
  for (const id of o1.items) {
    u2.inventory.push(id);
  }
  //@ts-ignore
  for (const id of o2.items) {
    u1.inventory.push(id);
  }

  // Coins: u1 loses o1.coins, gains o2.coins
  //@ts-ignore
  u1.balance = (u1.balance || 0) - o1.coins + o2.coins;
  //@ts-ignore
  u2.balance = (u2.balance || 0) - o2.coins + o1.coins;

  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
  return true;
}

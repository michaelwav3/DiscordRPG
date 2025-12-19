import { Message } from "discord.js";
import fs from "fs";
import "dotenv/config";

const API_KEY = process.env.EXTERNAL_API_KEY || "Yummyyummyyipyapyen";

//@ts-ignore
export async function exchange(message, userData) {
  const user = userData[message.author.id];
  if (!user) {
    return message.channel.send("You're not registered!");
  }

  const arg = message.content.split(" ")[1];
  if (!arg) {
    return message.channel.send("Usage: `%exchange <amount>`");
  }

  let amount = parseInt(arg);
  if (isNaN(amount) || amount <= 0) {
    return message.channel.send("Invalid amount.");
  }

  if (amount > user.balance) {
    return message.channel.send("You don't have enough coins.");
  }

  // -----------------------------
  // 💱 GET EXCHANGE RATE (Euro/Mine)
  // -----------------------------
  
  // 1. Get Euro's total economy
  const euroRes = await fetch("http://home.seceurity.place:8222/api/economy/total");
  const euroData = await euroRes.json();
  const euroTotal = euroData.total;

  // 2. Calculate my total economy
  let localTotal = 0;
  for (const id in userData) {
    const u = userData[id];
    localTotal += (u.balance || 0) + (u.bank || 0);
  }

  // 3. Dynamic exchange rate
  const EXCHANGE_RATE = euroTotal / localTotal;

  // 4. Amount after conversion
  const converted = Math.floor(amount * EXCHANGE_RATE);

  // -----------------------------

  // Step 1: Remove from your bot’s balance
  user.balance -= amount;
  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));

  // Step 2: Add to Euro’s bot (same user)
  const endpoint =
    `http://home.seceurity.place:8222/api/give-money/${message.author.id}/${converted}?key=${API_KEY}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (data.error) {
      // Restore money if API fails
      user.balance += amount;
      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return message.channel.send(`Exchange failed: ${data.error}`);
    }

    return message.channel.send(
      `💱 Exchanged **${amount}** coins.\n` +
      `📈 Exchange Rate: **${EXCHANGE_RATE.toFixed(4)}**\n` +
      `➡️ You received **${converted}** coins in Euro's bot.\n` +
      `Your new balance: **${user.balance}**`
    );

  } catch (err) {
    // Restore on network error
    user.balance += amount;
    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return message.channel.send("Exchange failed: Could not reach the external API.");
  }
}

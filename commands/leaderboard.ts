import { Message } from "discord.js";

//@ts-ignore
export function leaderboard(message, userData) {
  const rankings = Object.entries(userData)
    .map(([id, user]) => ({
      id,
      //@ts-ignore
      total: (user.balance || 0) + (user.bank || 0)
    }))
    .sort((a, b) => b.total - a.total);

  if (rankings.length === 0) {
    return message.channel.send("No users found in the economy.");
  }

  let text = "🏆 **Economy Leaderboard** 🏆\n\n";

  rankings.slice(0, 10).forEach((u, index) => {
    // Try to get username from cache
    const userObj = message.client.users.cache.get(u.id);

    // Display @username if found, otherwise @<id>
    const displayName = userObj
      ? `@${userObj.username}`
      : `@${u.id}`;

    text += `**${index + 1}.** ${displayName} — **${u.total.toLocaleString()} coins**\n`;
  });

  return message.channel.send(text);
}

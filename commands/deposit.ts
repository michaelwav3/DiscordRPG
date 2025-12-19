import { Message } from "discord.js";
import fs from "fs";

export function deposit(message: Message, userData: any) {
  const user = userData[message.author.id];

  if (!user) {
    //@ts-ignore
    return message.channel.send("You're not registered!");
  }


  if (user.location !== "Western Capital Bank") {
    

    if (user.location == "Goblin Bank") {
    user.balance = 0;
    //@ts-ignore
    message.channel.send("The goblins stole all your money... why would you trust goblins with your finances?");
  }else{
    return
  }
  }

  

  const arg = message.content.split(" ")[1];
  if (!arg) {
    //@ts-ignore
    return message.channel.send("Usage: `%deposit <amount>` or `%deposit all`");
  }

  let amount = 0;

  if (arg.toLowerCase() === "all") {
    amount = user.balance;
  } else {
    amount = parseInt(arg);
    if (isNaN(amount) || amount <= 0) {
      //@ts-ignore
      return message.channel.send("Invalid deposit amount.");
    }
  }

  if (amount > user.balance) {
    //@ts-ignore
    return message.channel.send("You don’t have that many coins.");
  }

  // Calculate capacity
  const netWorth = user.balance + (user.bank || 0);
  const maxBank = Math.floor(netWorth * 0.5);
  const bank = user.bank || 0;
  const spaceLeft = maxBank - bank;

  if (amount > spaceLeft) {
    //@ts-ignore
    return message.channel.send(
      `Your bank can only hold **${spaceLeft}** more coins (capacity: ${maxBank}).`
    );
  }

  // Apply deposit
  user.balance -= amount;
  user.bank = (user.bank || 0) + amount;

  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));

  //@ts-ignore
  return message.channel.send(
    `💰 Deposited **${amount}** coins.\n` +
    `Bank Balance: **${user.bank}**\n` +
    `Wallet: **${user.balance}**`
  );
}

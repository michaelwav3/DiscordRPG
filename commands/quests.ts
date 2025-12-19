// commands/quests.ts
import { Message } from "discord.js";
import { getQuestDisplayLines } from "../utils/questHelpers";

export function quests(message: Message, userData: any) {
  const user = userData[message.author.id];
  if (!user) {
    //@ts-ignore
    message.channel.send("You are not registered! Use %register to register.");
    return;
  }

  const lines = getQuestDisplayLines(user);
//@ts-ignore
  message.channel.send("Quests:\n" + lines.join("\n"));
}

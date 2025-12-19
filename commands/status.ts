import { Message, User } from "discord.js"

export function status (Message: Message, userData:any) { 
  //@ts-ignore
  const user = userData[Message.author.id]
  if(!user){
    //@ts-ignore
    Message.channel.send("You are not registered! Use $register to register.")
    return
  }
  //@ts-ignore
  Message.channel.send(`HP: **${user.HP}**\nMP: **${user.MP}**\nSP: **${user.SP}**`)
}
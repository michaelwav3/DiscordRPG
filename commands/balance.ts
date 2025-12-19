import { Message, User } from "discord.js"
import {Events} from "discord.js"

export function balance (Message: Message, userData:any) { 
  //@ts-ignore
  const user = userData[Message.author.id]
  if(!user){
    //@ts-ignore
    Message.channel.send("You are not registered! Use $register to register.")
    return
  }
  //@ts-ignore
  Message.channel.send(`Why Hello There Sir! Why, you wish to know your balance? Oh, alrighty then! Well, it seems Your balance is **PRECISELY** ${user.balance} Coins! how spectacular! how splending indubitably! Have a wonderful day!`)
}
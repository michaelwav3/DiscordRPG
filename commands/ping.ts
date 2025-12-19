import { Message } from "discord.js"
import {Events} from "discord.js"



export function ping (Message: Message) { 
  //@ts-ignore
  Message.channel.send("EURO was here")
}
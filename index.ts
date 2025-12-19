require('dotenv').config();
import { ping } from "./commands/ping";
import {balance} from "./commands/balance"
import { Message } from "discord.js"
import { stats } from "./commands/stats";
import { upgrade } from "./commands/upgrade";
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import { interact } from "./commands/interact";
import path from 'path';
import { view } from "./commands/view";
import type { QuestState } from "./data/quests";
import { inventory } from "./commands/inventory";
import { status } from "./commands/status";
import { quests } from "./commands/quests";
import { Client, GatewayIntentBits, Partials, Collection, ActivityType, Events } from 'discord.js';
import { equip } from "./commands/equip";
import { unequip } from "./commands/unequip";
import { startPvP } from "./commands/pvp";
import { trade } from "./commands/trade";
import { blackjack } from "./commands/blackjack";
import { deposit } from "./commands/deposit";
import { withdraw } from "./commands/withdraw";
import { exchange } from "./commands/exchange";
import { calculateTotalEconomy } from "./commands/calculateTotalEconomy"
import { leaderboard } from "./commands/leaderboard"
import { joinCombat } from "./commands/join";
import { buy } from "./commands/buy"; 
import { sell } from "./commands/sell";
import { shop } from "./commands/shop";
import { craft } from "./commands/craft";
import { craftList } from "./commands/craft";


// Assuming you have an activeCombats map somewhere, 
// if it's external, you would import it here to clear it.
// import { activeCombats } from "./commands/combatRegistry"; 



const prefix = "%";


export class User {
    UID:string
    balance:number
    HP:number
    MP:number
    SP:number
    baseStrength:number
    baseAgility:number
    baseIntelligence:number
    baseVitality:number
    basePerception:number
    strength:number
    agility:number
    intelligence:number
    vitality:number
    perception:number
    location:string
    bank: number
    inCombat:boolean
    inventory = []
    equipment = {
  body: null,
  head: null,
  legs: null,
  boots: null,
  rightarm: null,
  leftarm: null,
  accessory: null,
  skill: null,   // equipped skill scroll
  spell: null    // equipped spell scroll
}
    quests: QuestState[] = [];
    interactables = ["Henry", "Door"]
    element: "fire" | "water" | "earth" | "air" | null;
    elementTier: number;
    elementsUnlocked: string[];
    waitingForElementChoice?: boolean; // 🚩 NEW: Flag for Mumbo's reply listener


    
    constructor(UID:string) {
        this.UID = UID
        this.balance = 100
        this.HP = 100
        this.MP = 50
        this.SP = 100
        this.baseStrength = 10
        this.baseAgility = 10
        this.baseIntelligence = 10
        this.baseVitality = 10
        this.basePerception = 10
        this.strength = 10
        this.agility = 10
        this.intelligence = 10
        this.vitality = 10
        this.perception = 10
        this.location = "Henry's Basement"
        this.bank = 0
        this.inCombat = false;
        this.element = null;
        this.elementTier = 0;
        this.elementsUnlocked = [];
        this.waitingForElementChoice = false; // Initialize the new flag
    }
}


const deployCommands = async () => {
}

const rawData = fs.readFileSync('userData.json', 'utf-8');
const userData = JSON.parse(rawData)


// ----------------------------------------------------------------------
// 🚩 NEW FUNCTION: Combat Status Reset
// ----------------------------------------------------------------------

function resetAllCombatStatuses() {
    console.log("Attempting to reset all active combat statuses on startup...");

    let usersResetCount = 0;
    let dataChanged = false;

    // Iterate through all users using the globally loaded userData
    for (const userId in userData) {
        const user = userData[userId];

        // Check and reset the combat flags (inCombat and combatLocation, if you have one)
        if (user.inCombat || user.combatLocation) {
            user.inCombat = false;
            user.combatLocation = null; // Assuming combatLocation is a field on the user object
            usersResetCount++;
            dataChanged = true;
        }
        
        // Handle the user.isInCombat used in your interval regen logic
        if (user.isInCombat) {
            user.isInCombat = false;
            if (usersResetCount === 0) usersResetCount++; // Count if only this flag was set
            dataChanged = true;
        }
    }

    // If any data was changed, write the file back
    if (dataChanged) {
        try {
            fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
            console.log(`✅ Successfully reset combat status for ${usersResetCount} user(s).`);
        } catch (error) {
            //@ts-ignore
            console.error("Error writing userData.json after reset:", error.message);
        }
    } else {
        console.log("No active combat statuses found to reset.");
    }
    
    // If you imported activeCombats from combatRegistry, clear the in-memory map here:
    // activeCombats.clear(); 
}

// ----------------------------------------------------------------------


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});


fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
console.log("✅ Fetch quest progress migration complete.");
const commands = new Collection();


const commandsPath = path.join(__dirname, 'commands');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      
        commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, async() => {
 
    console.log(`Logged in as ${client.user?.tag}`);
    await deployCommands();
    console.log('Commands deployed successfully.');
    
    // 🚩 CALL THE RESET FUNCTION HERE (First task on ready)
    resetAllCombatStatuses();

    const statusType = process.env.BOT_STATUS || 'online';
    const activityType = process.env.BOT_ACTIVITY_TYPE || 'Playing';
    const activityName = process.env.BOT_ACTIVITY_NAME || 'with Discord.js';

   

    console.log(`Bot status set to ${statusType}`);
    console.log(`Bot activity set to ${activityType} ${activityName}`);
});

//Euros WaCkY Code!

setInterval(() => {
  for (const userId in userData) {
    const user = userData[userId];
    if (!user) continue;

    // The condition here should ideally check the same flag used in combat.
    // I noticed you use 'inCombat' in the User class and 'isInCombat' in the Interval.
    // I am assuming 'inCombat' from the User class is correct, but leaving 'isInCombat' for now to match your existing interval logic.
    if (user.isInCombat) continue; 

    const maxHP = user.vitality * 10;
    const maxSP = user.agility * 10;   // same formula you use when upgrading stats
    const maxMP = user.intelligence * 10;

    // HP regen: +1 every 4 seconds
    if (user.HP < maxHP) {
      user.HP = Math.min(user.HP + Math.round((0.015*maxHP)), maxHP);
    }

    // SP regen: +1 every 4 seconds
    if (user.SP < maxSP) {
      user.SP = Math.min(user.SP + Math.round((0.015*maxSP)), maxSP);
    }

    // MP regen: +1 every 4 seconds
    if (user.MP < maxMP) {
      user.MP = Math.min(user.MP + (Math.round(0.015*maxMP)), maxMP);
    }
  }

  // Save updated values
  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
}, 4000); // every 4 seconds



client.on(Events.MessageCreate, async (m: Message) => {
    if(m.content === "#ping") {
      ping(m)
}
if(m.content.startsWith(prefix) && m.channel.isSendable()){
    const args = m.content.slice(prefix.length).trim().split(/ +/).slice(1);
    const command = m.content.slice(prefix.length).trim().split(/ +/).shift()?.toLowerCase();
    if(command === "register") {
        if(userData[m.author.id]) {
  
            m.channel.send("You are already registered!")
            return
        }
        let newUser = new User(m.author.id)
        userData[m.author.id] = newUser
        fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2));

        m.channel.send("Registered Successfully!")
    }

    if(command === "balance" || command === "bal"){
        balance(m,userData)
    }

    if(command === "stats"){
        stats(m,userData)
    }

    if(command === "upgrade" || command === "up"){
       upgrade(m,userData)
}
    if(command === "view"){
        view(m,userData)
    }

    if(command === "interact" || command === "i"){
        interact(m,userData)
}

    if(command === "inventory" || command === "inv"){
        inventory(m,userData)
    }

    if(command === "quests"){
        quests(m,userData)
    }

    if(command === "status"){
        status(m,userData)
    }

    if (command === "equip") {
    equip(m, userData);
    }

    if (command === "unequip") {
    unequip(m, userData);
    }

    if (command === "duel") {
  startPvP(m, userData);
    }

    if (command === "trade") {
  trade(m, userData);
}


    if (command === "blackjack" || command === "bj") {
  //@ts-ignore
  blackjack(m, userData);
}

    if (command === "deposit" || command === "dep"){
         deposit(m, userData);
    }

    if (command === "withdraw" || command === "with"){
         withdraw(m, userData);
    }

    if (command === "exchange") {
    exchange(m, userData);
    }

    if (command === "economy") {
        const totalEconomy = calculateTotalEconomy(userData);
        m.channel.send(`Total economy: ${totalEconomy}`);
    }

    if (command === "leaderboard" || command === "lb"){
        leaderboard(m, userData);
    }

    if (command === "join") {
     await joinCombat(m, userData);
    return;
}if (command === "buy") {
     buy(m, userData);
    return;
    }

    if (command === "sell") {
     sell(m, userData);
    return;
    }

    if (command === "shop") {
     shop(m, userData);
    return;
    }

    if (command === "craft") {
  if (m.content.split(" ")[1] === "list") {
    craftList(m);
  } else {
    craft(m, userData);
  }
}


    // 🚩 REMOVED: Old %element command is removed.
    // The logic is now handled interactively by the Mumbo reply listener below.
} // END of if(m.content.startsWith(prefix) && m.channel.isSendable()){

// --------------------------------------------------------------------
// 🚩 NEW: Mumbo Element Choice Reply Listener (MOVED INSIDE client.on)
// --------------------------------------------------------------------
const user = userData[m.author.id];
if (user && user.waitingForElementChoice && m.channel.isTextBased() && !m.author.bot) {
    const choice = m.content.toLowerCase().trim();
    
    if (["fire", "water", "earth", "air"].includes(choice)) {
      user.element = choice as "fire" | "water" | "earth" | "air";
      user.elementTier = 0;
      user.elementsUnlocked = user.elementsUnlocked || [];
      user.waitingForElementChoice = false;
//@ts-ignore
      m.channel.send(
        `🔥 Grand Wizard Mumbo binds you to **${choice.toUpperCase()}**.\n` +
        "Return to him (`%interact mumbo`) when your INT reaches **10** for your first trial!"
      );
      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    } else {
      // If the message is not a valid choice, but the flag is set, prompt them again
      //@ts-ignore
      m.channel.send(
        "Mumbo: Invalid element. Choose **fire**, **water**, **earth**, or **air**."
      );
      return;
    }
}
// --------------------------------------------------------------------

}); // END of client.on(Events.MessageCreate, async (m: Message) => {


client.login(process.env.DISCORD_BOT_TOKEN);
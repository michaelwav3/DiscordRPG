"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
require('dotenv').config();
const ping_1 = require("./commands/ping");
const balance_1 = require("./commands/balance");
const stats_1 = require("./commands/stats");
const upgrade_1 = require("./commands/upgrade");
const fs_1 = __importDefault(require("fs"));
const interact_1 = require("./commands/interact");
const path_1 = __importDefault(require("path"));
const view_1 = require("./commands/view");
const inventory_1 = require("./commands/inventory");
const status_1 = require("./commands/status");
const quests_1 = require("./commands/quests");
const discord_js_1 = require("discord.js");
const equip_1 = require("./commands/equip");
const unequip_1 = require("./commands/unequip");
const pvp_1 = require("./commands/pvp");
const trade_1 = require("./commands/trade");
const blackjack_1 = require("./commands/blackjack");
const deposit_1 = require("./commands/deposit");
const withdraw_1 = require("./commands/withdraw");
const exchange_1 = require("./commands/exchange");
const calculateTotalEconomy_1 = require("./commands/calculateTotalEconomy");
const leaderboard_1 = require("./commands/leaderboard");
const join_1 = require("./commands/join");
const buy_1 = require("./commands/buy");
const sell_1 = require("./commands/sell");
const shop_1 = require("./commands/shop");
const craft_1 = require("./commands/craft");
const craft_2 = require("./commands/craft");
// Assuming you have an activeCombats map somewhere, 
// if it's external, you would import it here to clear it.
// import { activeCombats } from "./commands/combatRegistry"; 
const prefix = "%";
class User {
    UID;
    balance;
    HP;
    MP;
    SP;
    baseStrength;
    baseAgility;
    baseIntelligence;
    baseVitality;
    basePerception;
    strength;
    agility;
    intelligence;
    vitality;
    perception;
    location;
    bank;
    inCombat;
    inventory = [];
    equipment = {
        body: null,
        head: null,
        legs: null,
        boots: null,
        rightarm: null,
        leftarm: null,
        accessory: null,
        skill: null, // equipped skill scroll
        spell: null // equipped spell scroll
    };
    quests = [];
    interactables = ["Henry", "Door"];
    element;
    elementTier;
    elementsUnlocked;
    waitingForElementChoice; // 🚩 NEW: Flag for Mumbo's reply listener
    constructor(UID) {
        this.UID = UID;
        this.balance = 100;
        this.HP = 100;
        this.MP = 50;
        this.SP = 100;
        this.baseStrength = 10;
        this.baseAgility = 10;
        this.baseIntelligence = 10;
        this.baseVitality = 10;
        this.basePerception = 10;
        this.strength = 10;
        this.agility = 10;
        this.intelligence = 10;
        this.vitality = 10;
        this.perception = 10;
        this.location = "Henry's Basement";
        this.bank = 0;
        this.inCombat = false;
        this.element = null;
        this.elementTier = 0;
        this.elementsUnlocked = [];
        this.waitingForElementChoice = false; // Initialize the new flag
    }
}
exports.User = User;
const deployCommands = async () => {
};
const rawData = fs_1.default.readFileSync('userData.json', 'utf-8');
const userData = JSON.parse(rawData);
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
            if (usersResetCount === 0)
                usersResetCount++; // Count if only this flag was set
            dataChanged = true;
        }
    }
    // If any data was changed, write the file back
    if (dataChanged) {
        try {
            fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
            console.log(`✅ Successfully reset combat status for ${usersResetCount} user(s).`);
        }
        catch (error) {
            //@ts-ignore
            console.error("Error writing userData.json after reset:", error.message);
        }
    }
    else {
        console.log("No active combat statuses found to reset.");
    }
    // If you imported activeCombats from combatRegistry, clear the in-memory map here:
    // activeCombats.clear(); 
}
// ----------------------------------------------------------------------
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildPresences
    ]
});
fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
console.log("✅ Fetch quest progress migration complete.");
const commands = new discord_js_1.Collection();
const commandsPath = path_1.default.join(__dirname, 'commands');
const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path_1.default.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
client.once(discord_js_1.Events.ClientReady, async () => {
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
        if (!user)
            continue;
        // The condition here should ideally check the same flag used in combat.
        // I noticed you use 'inCombat' in the User class and 'isInCombat' in the Interval.
        // I am assuming 'inCombat' from the User class is correct, but leaving 'isInCombat' for now to match your existing interval logic.
        if (user.isInCombat)
            continue;
        const maxHP = user.vitality * 10;
        const maxSP = user.agility * 10; // same formula you use when upgrading stats
        const maxMP = user.intelligence * 10;
        // HP regen: +1 every 4 seconds
        if (user.HP < maxHP) {
            user.HP = Math.min(user.HP + Math.round((0.015 * maxHP)), maxHP);
        }
        // SP regen: +1 every 4 seconds
        if (user.SP < maxSP) {
            user.SP = Math.min(user.SP + Math.round((0.015 * maxSP)), maxSP);
        }
        // MP regen: +1 every 4 seconds
        if (user.MP < maxMP) {
            user.MP = Math.min(user.MP + (Math.round(0.015 * maxMP)), maxMP);
        }
    }
    // Save updated values
    fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
}, 4000); // every 4 seconds
client.on(discord_js_1.Events.MessageCreate, async (m) => {
    if (m.content === "#ping") {
        (0, ping_1.ping)(m);
    }
    if (m.content.startsWith(prefix) && m.channel.isSendable()) {
        const args = m.content.slice(prefix.length).trim().split(/ +/).slice(1);
        const command = m.content.slice(prefix.length).trim().split(/ +/).shift()?.toLowerCase();
        if (command === "register") {
            if (userData[m.author.id]) {
                m.channel.send("You are already registered!");
                return;
            }
            let newUser = new User(m.author.id);
            userData[m.author.id] = newUser;
            fs_1.default.writeFileSync('userData.json', JSON.stringify(userData, null, 2));
            m.channel.send("Registered Successfully!");
        }
        if (command === "balance" || command === "bal") {
            (0, balance_1.balance)(m, userData);
        }
        if (command === "stats") {
            (0, stats_1.stats)(m, userData);
        }
        if (command === "upgrade" || command === "up") {
            (0, upgrade_1.upgrade)(m, userData);
        }
        if (command === "view") {
            (0, view_1.view)(m, userData);
        }
        if (command === "interact" || command === "i") {
            (0, interact_1.interact)(m, userData);
        }
        if (command === "inventory" || command === "inv") {
            (0, inventory_1.inventory)(m, userData);
        }
        if (command === "quests") {
            (0, quests_1.quests)(m, userData);
        }
        if (command === "status") {
            (0, status_1.status)(m, userData);
        }
        if (command === "equip") {
            (0, equip_1.equip)(m, userData);
        }
        if (command === "unequip") {
            (0, unequip_1.unequip)(m, userData);
        }
        if (command === "duel") {
            (0, pvp_1.startPvP)(m, userData);
        }
        if (command === "trade") {
            (0, trade_1.trade)(m, userData);
        }
        if (command === "blackjack" || command === "bj") {
            //@ts-ignore
            (0, blackjack_1.blackjack)(m, userData);
        }
        if (command === "deposit" || command === "dep") {
            (0, deposit_1.deposit)(m, userData);
        }
        if (command === "withdraw" || command === "with") {
            (0, withdraw_1.withdraw)(m, userData);
        }
        if (command === "exchange") {
            (0, exchange_1.exchange)(m, userData);
        }
        if (command === "economy") {
            const totalEconomy = (0, calculateTotalEconomy_1.calculateTotalEconomy)(userData);
            m.channel.send(`Total economy: ${totalEconomy}`);
        }
        if (command === "leaderboard" || command === "lb") {
            (0, leaderboard_1.leaderboard)(m, userData);
        }
        if (command === "join") {
            await (0, join_1.joinCombat)(m, userData);
            return;
        }
        if (command === "buy") {
            (0, buy_1.buy)(m, userData);
            return;
        }
        if (command === "sell") {
            (0, sell_1.sell)(m, userData);
            return;
        }
        if (command === "shop") {
            (0, shop_1.shop)(m, userData);
            return;
        }
        if (command === "craft") {
            if (m.content.split(" ")[1] === "list") {
                (0, craft_2.craftList)(m);
            }
            else {
                (0, craft_1.craft)(m, userData);
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
            user.element = choice;
            user.elementTier = 0;
            user.elementsUnlocked = user.elementsUnlocked || [];
            user.waitingForElementChoice = false;
            //@ts-ignore
            m.channel.send(`🔥 Grand Wizard Mumbo binds you to **${choice.toUpperCase()}**.\n` +
                "Return to him (`%interact mumbo`) when your INT reaches **10** for your first trial!");
            fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
            return;
        }
        else {
            // If the message is not a valid choice, but the flag is set, prompt them again
            //@ts-ignore
            m.channel.send("Mumbo: Invalid element. Choose **fire**, **water**, **earth**, or **air**.");
            return;
        }
    }
    // --------------------------------------------------------------------
}); // END of client.on(Events.MessageCreate, async (m: Message) => {
client.login(process.env.DISCORD_BOT_TOKEN);
//# sourceMappingURL=index.js.map
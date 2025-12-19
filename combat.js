"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCombat = startCombat;
// commands/combat.ts
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const questHelpers_1 = require("./utils/questHelpers");
const items_1 = require("./data/items");
const combatRegistry_1 = require("./commands/combatRegistry");
const inventoryHelpers_1 = require("./utils/inventoryHelpers");
// --------------------------------------------------------------------
// 🚩 NEW: MUMBO PROGRESSION HELPER
// --------------------------------------------------------------------
const ELEMENTAL_MOVES = {
    fire: ["fireball", "greatFireball", "dragonFlame", "incinerate", "elderFlame"],
    water: ["waterBullet", "waterWall", "waterPrison", "tsunami", "poseidon"],
    earth: ["earthWall", "earthFlowRiver", "rockTomb", "earthquake", "ragnarok"],
    air: ["jetStream", "airPalm", "suffocate", "flight", "aeolus"],
};
const MAX_TIER = 5; // Total number of moves Mumbo teaches
/**
 * Handles all Mumbo progression, giving moves and resetting element on mastery.
 * @param user The user object from userData.
 * @param enemyName The defeated enemy's name (e.g., Grand Wizard Mumbo (FIRE Trial 1)).
 * @returns {string} The text log of the reward and progression.
 */
function processMumboVictory(user, enemyName) {
    let log = "";
    const INT_REQUIREMENTS = [10, 30, 50, 75, 100];
    // Safety checks for user data initialization
    user.elementTier = user.elementTier ?? 0;
    user.elementsUnlocked = user.elementsUnlocked ?? [];
    if (!user.element || user.elementTier >= MAX_TIER) {
        log += `\n\n🧙 **Mumbo: Hmm, you seem to have fought me out of order, or you have already mastered this element.**`;
        return log;
    }
    const currentTier = user.elementTier; // This is the move index they *earn*
    const element = user.element;
    // Determine the reward for the current tier
    const moveId = ELEMENTAL_MOVES[element][currentTier];
    // 1. Give the reward item
    user.inventory.push(moveId); // Use push for basic inventory if giveItem is complex
    // 2. Advance the player's tier for the next challenge
    user.elementTier++;
    const nextTier = user.elementTier;
    log += `\n\n🧙 **Mumbo laughs as he falls...**\n`;
    // 3. Check for mastery
    if (nextTier >= MAX_TIER) {
        user.elementsUnlocked.push(element);
        user.element = null; // Free up for a new element choice
        log +=
            `✨ **MASTERY!** You mastered the element of **${element.toUpperCase()}**!\n` +
                `📜 You earned the ultimate spell: **${moveId}**.\n` +
                `Mumbo will now allow you to choose a new element.`;
    }
    else {
        // Announce new move
        const requiredInt = INT_REQUIREMENTS[nextTier];
        log +=
            `🔥 You have completed **${element.toUpperCase()} Trial ${currentTier + 1}**!\n` +
                `📜 You learned the spell: **${moveId}**!\n` +
                `Return to him (\`%interact mumbo\`) when your INT reaches **${requiredInt}** for the next trial.`;
    }
    return log;
}
// --------------------------------------------------------------------
function recalcMaxHp(p) {
    const oldMax = p.maxHp;
    p.maxHp = p.vitality * 10;
    // Preserve HP percentage
    if (oldMax > 0) {
        const ratio = p.hp / oldMax;
        p.hp = Math.max(1, Math.floor(p.maxHp * ratio));
    }
    // Clamp
    if (p.hp > p.maxHp)
        p.hp = p.maxHp;
}
function getSpeed(entity) {
    // Players use agility, enemies use speed
    const raw = entity.agility ?? entity.speed ?? 1;
    const n = Number(raw);
    if (!Number.isFinite(n))
        return 1;
    return Math.max(1, n);
}
async function safeUpdate(interaction, payload) {
    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(payload);
        }
        else {
            await interaction.update(payload);
        }
    }
    catch (e) {
        console.error("safeUpdate failed:", e);
    }
}
async function startCombat(message, userData, enemyConfig) {
    const user = userData[message.author.id];
    const party = [];
    if (!user) {
        //@ts-ignore
        await message.channel.send("You are not registered! Use %register to register.");
        return;
    }
    // Prevent double combat
    if (user.inCombat) {
        //@ts-ignore
        await message.channel.send("⚠️ You are already in combat!");
        return;
    }
    // Mark combat as active
    user.inCombat = true;
    //reset HP incase of buffs
    if (user.HP > user.vitality * 10) {
        user.HP = user.vitality * 10;
    }
    ;
    fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    async function endCombat() {
        user.inCombat = false;
        user.combatLocation = null;
        combatRegistry_1.activeCombats.delete(user.location);
        for (const member of party) {
            const u = userData[member.id];
            if (u) {
                u.inCombat = false;
                u.combatLocation = null;
            }
        }
        await savePlayerState(); // already writes userData.json
    }
    // ---------- PLAYER STATS (from your user object) ----------
    const player = {
        id: message.author.id,
        name: message.author.username,
        // 🔥 BASE STATS
        baseVitality: user.vitality,
        vitality: user.vitality,
        maxHp: user.vitality * 10,
        hp: user.HP,
        maxSp: user.agility * 10,
        sp: user.SP,
        maxMp: user.intelligence * 10,
        mp: user.MP,
        str: user.strength,
        int: user.intelligence,
        agility: user.agility,
        statuses: [],
        defenseMultiplier: 1,
    };
    party.push(player); // original player is leader
    user.combatLocation = user.location;
    combatRegistry_1.activeCombats.set(user.location, {
        party,
        addPlayer: (newPlayer) => {
            party.push(newPlayer);
        },
    });
    // ---------- ENEMY STATS (from config) ----------
    const enemy = {
        name: enemyConfig.name,
        maxHp: enemyConfig.maxHp,
        hp: enemyConfig.maxHp,
        str: enemyConfig.str,
        int: enemyConfig.int ?? enemyConfig.str, // default: same as strength
        speed: enemyConfig.speed,
        fleeResist: enemyConfig.fleeResist,
        coinReward: enemyConfig.coinReward,
        maxSp: enemyConfig.maxSp ?? 0,
        sp: enemyConfig.maxSp ?? 0,
        maxMp: enemyConfig.maxMp ?? 0,
        mp: enemyConfig.maxMp ?? 0,
        skillIds: enemyConfig.skillIds ?? [],
        spellIds: enemyConfig.spellIds ?? [],
        skillChance: enemyConfig.skillChance ?? 0.3, // 30% default
        spellChance: enemyConfig.spellChance ?? 0.3, // 30% default
        statuses: []
    };
    let combatOver = false;
    let turnIndex = 0;
    let playerTurnsRemaining = [];
    let enemyTurnsRemaining = 1;
    const physicalCost = 20; // SP cost per physical attack
    // REGEN PER ROUND
    const spRegenPerRound = Math.max(1, Math.floor(player.maxSp * 0.05)); // 5% SP
    const mpRegenPerRound = Math.max(1, Math.floor(player.maxMp * 0.05)); // 5% MP
    // DEFEND: damage multiplier for the NEXT enemy turn (1 = normal, 0.5–0.9 = reduced)
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    function calcPhysicalDamage(str) {
        const base = str * 2;
        const variance = randInt(-2, 2);
        return Math.max(1, base + variance);
    }
    // --- NEW: skills & spells use damageAmount, not scaleStat/scaleMult ---
    function calcSkillDamage(actor, ability) {
        const baseStr = actor.str ?? 0;
        const mult = ability.damageAmount ?? 1;
        const weapon = user.equipment.rightarm
            ? items_1.ITEMS[user.equipment.rightarm]
            : undefined;
        const weaponAttack = weapon?.attack ?? 0;
        const attackBonus = weaponAttack * 0.06 * actor.str;
        const dmg = Math.floor((baseStr * mult) + attackBonus);
        //refer 2 2
        return Math.max(1, dmg);
    }
    function calcSpellDamage(actor, ability) {
        const baseInt = actor.int ?? 0;
        const mult = ability.damageAmount ?? 1;
        const dmg = Math.floor(baseInt * mult);
        return Math.max(1, dmg);
    }
    function applyStatus(target, status) {
        const existing = target.statuses.find((s) => s.type === status.type);
        if (existing) {
            existing.duration = Math.max(existing.duration, status.duration);
            if (status.potency !== undefined) {
                existing.potency = status.potency;
            }
        }
        else {
            target.statuses.push({ ...status });
        }
    }
    function processStatuses(target) {
        let log = "";
        // Set default skipTurn to false, but check for Paralyze or Freeze first
        let skipTurn = false;
        for (const status of [...target.statuses]) {
            switch (status.type) {
                case "burn": {
                    const dmg = status.potency ?? Math.max(1, Math.floor(target.maxHp * 0.05));
                    target.hp -= dmg;
                    log += `🔥 **${target.name}** takes **${dmg} burn damage**!\n`;
                    break;
                }
                case "poison": {
                    const dmg = status.potency ?? Math.max(1, Math.floor(target.maxHp * 0.03));
                    target.hp -= dmg;
                    log += `☠️ **${target.name}** takes **${dmg} poison damage**!\n`;
                    break;
                }
                case "paralyze": {
                    const chance = status.potency ?? 0.25;
                    if (Math.random() < chance) {
                        // Paralyze only skips the action, not the entire turn processing.
                        skipTurn = true;
                        log += `⚡ **${target.name}** is paralyzed and can’t move!\n`;
                    }
                    break;
                }
                case "freeze": {
                    // Freeze always skips the action
                    skipTurn = true;
                    log += `🧊 **${target.name}** is frozen solid!\n`;
                    break;
                }
            }
            status.duration--;
            if (status.duration <= 0) {
                target.statuses = target.statuses.filter((s) => s !== status);
                log += `✨ **${target.name}** is no longer affected by **${status.type}**.\n`;
            }
        }
        if (target.hp < 0)
            target.hp = 0;
        return { skipTurn, log };
    }
    function getFleeChance(playerSpeed, enemySpeed, fleeResist) {
        const base = 0.4;
        const speedDiff = (playerSpeed - enemySpeed) * 0.03; // +3% per speed difference
        let chance = base + speedDiff - fleeResist;
        return Math.min(0.9, Math.max(0.1, chance)); // clamp 10%-90%
    }
    function startNewRound() {
        const partySpeeds = party.map(p => getSpeed(p));
        const avgPartySpeed = partySpeeds.reduce((a, b) => a + b, 0) / partySpeeds.length || 1;
        playerTurnsRemaining = party.map(p => Math.max(1, Math.min(10, Math.floor(getSpeed(p) / Math.max(1, enemy.speed)))));
        enemyTurnsRemaining = Math.max(1, Math.min(10, Math.floor(enemy.speed / avgPartySpeed)));
        turnIndex = 0;
    }
    // ----- ROLL DROPS FOR THIS ENEMY -----
    function rollDrops() {
        const obtainedItemIds = [];
        const drops = enemyConfig.drops;
        if (!drops || drops.length === 0)
            return obtainedItemIds;
        for (const drop of drops) {
            const rolls = drop.min && drop.max ? randInt(drop.min, drop.max) : 1;
            for (let i = 0; i < rolls; i++) {
                if (Math.random() <= drop.chance) {
                    obtainedItemIds.push(drop.itemId);
                }
            }
        }
        return obtainedItemIds;
    }
    // ----- HANDLE VICTORY (shared by physical / skill / magic) -----
    async function handleVictory(interaction, log) {
        combatOver = true;
        await endCombat();
        collector.stop("enemy_dead");
        // 🚩 GRAND WIZARD MUMBO PROGRESSION (using the new helper function)
        if (enemy.name.startsWith("Grand Wizard Mumbo")) {
            log += processMumboVictory(user, enemy.name);
        }
        // coins
        //user.balance = (user.balance || 0) + enemy.coinReward;
        // 💰 SPLIT COIN REWARD AMONG PARTY
        const partySize = party.length;
        const totalCoins = enemy.coinReward;
        const coinsPerPlayer = Math.floor(totalCoins / partySize);
        const remainder = totalCoins % partySize;
        for (let i = 0; i < party.length; i++) {
            const member = party[i];
            const u = userData[member.id];
            if (!u)
                continue;
            // Everyone gets base share
            u.balance = (u.balance || 0) + coinsPerPlayer;
            // Leader (index 0) gets remainder
            if (i === 0) {
                u.balance += remainder;
            }
        }
        let coinText = "";
        if (partySize === 1) {
            coinText = `💰 You gained **${totalCoins} coins**!`;
        }
        else {
            coinText =
                `💰 Party split: **${coinsPerPlayer} coins each**` +
                    (remainder > 0 ? ` (+${remainder} bonus to leader)` : "");
        }
        // quest kill tracking
        (0, questHelpers_1.incrementKillQuests)(user, enemy.name.toLowerCase());
        // roll drops
        // roll drops once
        const drops = rollDrops();
        // give drops to all party members
        for (const member of party) {
            const u = userData[member.id];
            if (!u)
                continue;
            for (const itemId of drops) {
                (0, inventoryHelpers_1.giveItem)(u, itemId, 1);
            }
        }
        await savePlayerState();
        let lootText = "";
        if (drops.length > 0) {
            lootText = `\n🎁 You obtained: ${drops
                .map((n) => `**${n}**`)
                .join(", ")}`;
        }
        // FIX: Keep try/catch here to prevent crashes if the interaction was handled elsewhere.
        try {
            await safeUpdate(interaction, {
                content: `✅ **${player.name} wins!**\n` +
                    `${log}\n\n` +
                    `💰 You gained **${enemy.coinReward} coins**!` +
                    lootText,
                embeds: [buildCombatEmbed()],
                components: [],
            });
        }
        catch (e) {
            console.error("Error during handleVictory update:", e);
            // Attempt to send a new message if update failed
            //@ts-ignore
            await message.channel.send({
                content: `✅ **${player.name} wins!** (Interaction Failed)\n` +
                    `${log}\n\n` +
                    `💰 You gained **${enemy.coinReward} coins**!` +
                    lootText,
                embeds: [buildCombatEmbed()],
                //@ts-ignore
            }).catch(sendError => console.error("Could not send final victory message:", sendError));
        }
    }
    function getCurrentPlayer() {
        // Ensure turnIndex points to a player who actually has turns left
        // (This handles moving past players who ran out of turns in a previous round)
        while (turnIndex < party.length &&
            //@ts-ignore
            playerTurnsRemaining[turnIndex] <= 0) {
            turnIndex++;
        }
        return turnIndex < party.length ? party[turnIndex] : null;
    }
    /**
     * Decrements the current player's turns and determines the next actor.
     * FIX: This implements the correct logic for a player to act multiple times
     * before advancing to the next player or the enemy.
     */
    function advanceTurn() {
        //@ts-ignore
        playerTurnsRemaining[turnIndex]--; // Decrement the turns for the player who just acted
        // 1. Check if the player who just acted still has turns
        //@ts-ignore
        if (playerTurnsRemaining[turnIndex] > 0) {
            // Current player acts again immediately
            return "player";
        }
        // 2. If the current player is out of turns, look for the next player
        let nextIndex = turnIndex + 1;
        // 3. Scan for a player with turns in the rest of the array
        //@ts-ignore
        while (nextIndex < party.length && playerTurnsRemaining[nextIndex] <= 0) {
            nextIndex++;
        }
        // 4. If a player was found, advance turnIndex to them
        if (nextIndex < party.length) {
            turnIndex = nextIndex;
            return "player";
        }
        // 5. If no one in the party (from current position onwards) has turns left, 
        //    the player phase is over.
        return "enemy";
    }
    // ----- NEW HELPER FUNCTION TO PROCESS HYBRID ABILITIES -----
    /**
     * Processes all effects (attack, heal, buff) defined on an item/ability.
     * @param actor The entity using the ability (Player or Enemy)
     * @param primaryTarget The entity the ability is primarily aimed at (Enemy for Attack/Player for Buff/Heal, depending on context)
     * @param ability The ItemDef object representing the skill or spell
     * @param damageCalculator Function to calculate damage (calcSkillDamage or calcSpellDamage)
     * @returns {string} The combat log for the action.
     */
    function processAbilityEffects(actor, primaryTarget, ability, damageCalculator) {
        let log = "";
        // Safely convert abilityType (string or array) into an array of effects
        const effectsToProcess = Array.isArray(ability.abilityType)
            ? ability.abilityType
            : (ability.abilityType ? [ability.abilityType] : []);
        const isPlayerAction = actor.id === player.id; // Check if the actor is the main player
        // Determine who gets healed/buffed (always the actor/caster) and who gets attacked (primaryTarget)
        const targetForDamage = primaryTarget;
        const targetForSupport = actor;
        for (const type of effectsToProcess) {
            // 1. ATTACK/DAMAGE EFFECT
            if (type === "attack" && ability.damageAmount && ability.damageAmount > 0) {
                // Damage calculation logic
                const dmg = damageCalculator(actor, ability);
                let finalDmg = dmg;
                if (!isPlayerAction) {
                    // If Enemy is attacking player, apply player defenseMultiplier (targetForDamage is the player)
                    finalDmg = Math.max(1, Math.floor(dmg * (targetForDamage.defenseMultiplier ?? 1)));
                }
                targetForDamage.hp -= finalDmg;
                if (targetForDamage.hp < 0)
                    targetForDamage.hp = 0;
                log += `💥 **${ability.name}** hits **${targetForDamage.name}** for **${finalDmg}** damage!`;
                // Defense multiplier is consumed only if the target is the player
                if (!isPlayerAction) {
                    targetForDamage.defenseMultiplier = 1;
                }
                // Check for Status Effect (only apply to damage attacks)
                if (ability.status && Math.random() < (ability.status.chance ?? 1)) {
                    applyStatus(targetForDamage, ability.status);
                    log += `\n✨ **${targetForDamage.name}** is afflicted with **${ability.status.type}**!`;
                }
                // If player is attacking enemy, victory check happens after ability processing.
            }
            // 2. HEAL EFFECT
            else if (type === "heal" && ability.healAmount && ability.healAmount > 0) {
                const heal = ability.healAmount;
                const healed = Math.min(heal, targetForSupport.maxHp - targetForSupport.hp);
                targetForSupport.hp += healed;
                if (healed > 0) {
                    log += `\n❤️ **${ability.name}** restores **${healed} HP** to **${targetForSupport.name}**!`;
                }
            }
            // 3. BUFF EFFECT (FIX FOR FLIGHT/WATERWALL)
            else if (type === "buff" && ability.buff && ability.buffType) {
                const stat = ability.buffType;
                // 🔥 VITALITY BUFF → RECALC MAX HP
                if (stat === "vitality") {
                    targetForSupport.vitality += ability.buff;
                    recalcMaxHp(targetForSupport);
                    log += `\n🛡️ **${ability.name}** increases **${targetForSupport.name}'s vitality** by **${ability.buff}**!`;
                }
                else {
                    const before = Number(targetForSupport[stat] ?? 0);
                    targetForSupport[stat] = (Number.isFinite(before) ? before : 0) + ability.buff;
                    log += `\n✨ **${ability.name}** raises **${targetForSupport.name}'s ${stat}** by **${ability.buff}**!`;
                }
            }
        }
        // Clean up log spacing
        return log.trim();
    }
    function buildCombatEmbed() {
        // Need to handle the case where turnIndex is out of bounds (i.e., enemy turn)
        const currentPlayer = turnIndex < party.length ? party[turnIndex] : null;
        let playerStatsText = '';
        if (currentPlayer) {
            playerStatsText =
                `\n\n**${currentPlayer.name}**\n` +
                    `HP: ${currentPlayer.hp}/${currentPlayer.maxHp}\n` +
                    `SP: ${currentPlayer.sp}/${currentPlayer.maxSp}\n` +
                    `MP: ${currentPlayer.mp}/${currentPlayer.maxMp}\n\n`;
        }
        else {
            playerStatsText = "\n\n**Enemy Turn**\n\n";
        }
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ Battle: ${player.name} vs ${enemy.name}`)
            .setDescription(
        // ---- PARTY TURN ORDER ----
        party
            .map((p, i) => 
        // turnIndex highlights the player who is NEXT to act
        i === turnIndex && turnIndex < party.length
            ? `👉 **${p.name}** — ${playerTurnsRemaining[i]} turn(s)`
            : `• ${p.name} — ${playerTurnsRemaining[i]} turn(s)`)
            .join("\n") +
            // ---- CURRENT PLAYER STATS (or "Enemy Turn") ----
            playerStatsText +
            // ---- ENEMY ----
            `**${enemy.name}**\n` +
            `HP: ${enemy.hp}/${enemy.maxHp}\n` +
            `Enemy turns: ${enemyTurnsRemaining}`)
            .setColor(0x5865f2);
    }
    const buttonsRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("physical")
        .setLabel("Physical Attack")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId("skill")
        .setLabel("Skill Attack")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("magic")
        .setLabel("Magic Attack")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("defend")
        .setLabel("Defend")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId("flee")
        .setLabel("Flee")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    startNewRound();
    //@ts-ignore
    const combatMessage = await message.channel.send({
        content: `🗡️ A wild **${enemy.name}** appears!`,
        embeds: [buildCombatEmbed()],
        components: [buttonsRow],
    });
    const filter = (i) => party.some(p => p.id === i.user.id) &&
        i.message.id === combatMessage.id;
    const collector = combatMessage.createMessageComponentCollector({
        filter,
        componentType: discord_js_1.ComponentType.Button,
        time: 2 * 60 * 1000, // 2 minutes
    });
    async function savePlayerState() {
        for (const p of party) {
            const u = userData[p.id];
            if (!u)
                continue;
            u.HP = p.hp;
            u.SP = p.sp;
            u.MP = p.mp;
            // NOTE: If you save the temporary stat buffs (like agility from Flight)
            // they will persist outside of combat. You must add logic here to
            // remove them before saving the final state if they are combat-only.
        }
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    }
    function enemyActOnce() {
        let log = " ";
        // If enemy is out of HP, do nothing
        // Select target randomly from players still alive
        const aliveTargets = party.filter(p => p.hp > 0);
        if (aliveTargets.length === 0)
            return "";
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        if (enemy.hp <= 0)
            return "";
        // Decide action type: try skill, spell, or fallback to physical
        const roll = Math.random();
        // Try skill first
        if (enemy.skillIds.length > 0 &&
            roll < enemy.skillChance &&
            enemy.sp > 0) {
            const skillId = enemy.skillIds[Math.floor(Math.random() * enemy.skillIds.length)];
            //@ts-ignore
            const sk = items_1.ITEMS[skillId];
            if (sk && sk.type === "skill") {
                const costSP = sk.costSP ?? 0;
                if (enemy.sp >= costSP) {
                    enemy.sp -= costSP;
                    // 🚩 ENEMY SKILL FIX: Use the new helper function for hybrid effects
                    const actionLog = processAbilityEffects(enemy, target, sk, calcSkillDamage);
                    // Check for enemy death after attack effect is processed
                    if (target.hp <= 0 && actionLog.includes("💥")) {
                        // Do not return here, let the main enemyTurn handle player death
                    }
                    return actionLog;
                }
            }
        }
        // Try spell second
        const roll2 = Math.random();
        if (enemy.spellIds.length > 0 &&
            roll2 < enemy.spellChance &&
            enemy.mp > 0) {
            const spellId = enemy.spellIds[Math.floor(Math.random() * enemy.spellIds.length)];
            //@ts-ignore
            const sp = items_1.ITEMS[spellId];
            if (sp && sp.type === "spell") {
                const costMP = sp.costMP ?? 0;
                if (enemy.mp >= costMP) {
                    enemy.mp -= costMP;
                    // 🚩 ENEMY SPELL FIX: Use the new helper function for hybrid effects
                    // Enemy ability always targets a player (target)
                    const actionLog = processAbilityEffects(enemy, target, sp, calcSpellDamage);
                    return actionLog;
                }
            }
        }
        // Fallback: physical attack (your old behavior)
        const rawDmg = calcPhysicalDamage(enemy.str);
        // Apply player defense multiplier
        const finalDmg = Math.max(1, Math.floor(rawDmg * (target.defenseMultiplier ?? 1)));
        target.hp -= finalDmg;
        if (target.hp < 0)
            target.hp = 0;
        // defense consumed
        target.defenseMultiplier = 1;
        return `👹 **${enemy.name}** hits **${target.name}** for **${finalDmg}** damage!`;
    }
    // enemyTurn now accepts an optional preLog (for Defend text)
    async function enemyTurn(interaction, preLog = "") {
        let log = preLog;
        // One "round" for the enemy: they may act multiple times based on enemyActionsPerRound
        for (let i = 0; i < enemyTurnsRemaining; i++) {
            if (enemy.hp <= 0 || party.every(p => p.hp <= 0))
                break;
            const enemyStatus = processStatuses(enemy);
            log += enemyStatus.log;
            if (enemy.hp <= 0)
                break;
            if (enemyStatus.skipTurn)
                continue;
            // Decide what the enemy will do this action
            const actionLog = enemyActOnce();
            log += `\n${actionLog}`;
            if (enemy.hp <= 0 || party.every(p => p.hp <= 0))
                break;
        }
        // check if players are still alive
        if (party.every(p => p.hp <= 0)) {
            // on death penalty
            user.HP = 100;
            user.balance = 0;
            await savePlayerState();
            combatOver = true;
            await endCombat();
            collector.stop("player_dead");
            await safeUpdate(interaction, {
                content: `💀 **defeated by ${enemy.name}...**${log}`,
                embeds: [buildCombatEmbed()],
                components: [],
            });
            return;
        }
        // ---- REGEN AND STATUS CHECKS FOR PLAYERS ----
        for (const p of party) {
            // Player status effects (e.g., burn/poison damage)
            const playerStatus = processStatuses(p);
            log += playerStatus.log;
            // Regen only applies at the start of the player phase, after enemy turn.
            const oldSp = p.sp;
            const oldMp = p.mp;
            p.sp = Math.min(p.maxSp, p.sp + spRegenPerRound);
            p.mp = Math.min(p.maxMp, p.mp + mpRegenPerRound);
            if (p.sp !== oldSp || p.mp !== oldMp) {
                log += `\n💧 **${p.name}** recovers **${p.sp - oldSp} SP** and **${p.mp - oldMp} MP**.`;
            }
        }
        // reset player actions for next round and find next player
        startNewRound();
        // reset defense for next round (player's DEF applies only to the round)
        for (const p of party) {
            p.defenseMultiplier = 1;
        }
        await safeUpdate(interaction, {
            content: `🌀 Enemy turn is over.${log}`,
            embeds: [buildCombatEmbed()],
            components: [buttonsRow],
        });
    }
    collector.on("collect", async (interaction) => {
        const currentPlayer = getCurrentPlayer();
        // Check if it's the player's turn and they are the one clicking.
        if (!currentPlayer || interaction.user.id !== currentPlayer.id) {
            return interaction.reply({
                content: "⏳ It's not your turn.",
                ephemeral: true,
            });
        }
        const playerStatus = processStatuses(currentPlayer);
        if (playerStatus.skipTurn) {
            const log = playerStatus.log;
            const next = advanceTurn(); // ✅ CONSUME ONE TURN
            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }
            if (next === "player") {
                await safeUpdate(interaction, {
                    content: log,
                    embeds: [buildCombatEmbed()],
                    components: [buttonsRow],
                });
            }
            else {
                await enemyTurn(interaction, log);
            }
            return;
        }
        if (combatOver) {
            return interaction.reply({
                content: "Combat is already over.",
                ephemeral: true,
            });
        }
        // ---------- PHYSICAL ATTACK ----------
        if (interaction.customId === "physical") {
            // REDUNDANT CHECK REMOVED HERE
            // ✅ Check SP before attacking
            if (currentPlayer.sp < physicalCost) {
                return interaction.reply({
                    content: "You don't have enough SP for a physical attack!",
                    ephemeral: true,
                });
            }
            currentPlayer.sp -= physicalCost;
            const weapon = user.equipment.rightarm
                ? items_1.ITEMS[user.equipment.rightarm]
                : undefined;
            const weaponAttack = weapon?.attack ?? 0;
            //refer to hereeeee
            const attackBonus = weaponAttack * 0.025 * currentPlayer.str;
            const dmg = calcPhysicalDamage(currentPlayer.str + attackBonus);
            enemy.hp -= dmg;
            if (enemy.hp < 0)
                enemy.hp = 0;
            const log = `👊 **${currentPlayer.name}** hits **${enemy.name}** for **${dmg}** damage!`;
            if (enemy.hp <= 0) {
                await handleVictory(interaction, log);
                return;
            }
            const next = advanceTurn();
            if (next === "player") {
                await safeUpdate(interaction, {
                    content: log,
                    embeds: [buildCombatEmbed()],
                    components: [buttonsRow],
                });
            }
            else {
                await enemyTurn(interaction, log);
            }
        }
        // ---------- DEFEND ----------
        else if (interaction.customId === "defend") {
            // REDUNDANT CHECK REMOVED HERE
            const reductionPercent = randInt(20, 50);
            currentPlayer.defenseMultiplier = (100 - reductionPercent) / 100;
            const log = `🛡️ **${currentPlayer.name}** braces for impact!\n` +
                `Incoming damage will be reduced by **${reductionPercent}%** until their next turn.`;
            const next = advanceTurn();
            if (next === "enemy") {
                await enemyTurn(interaction, log);
            }
            else {
                await safeUpdate(interaction, {
                    content: log,
                    embeds: [buildCombatEmbed()],
                    components: [buttonsRow],
                });
            }
        }
        // ---------- SKILL ATTACK (FIXED FOR HYBRID) ----------
        else if (interaction.customId === "skill") {
            // REDUNDANT CHECK REMOVED HERE
            const skillId = user.equipment.skill;
            if (!skillId) {
                return interaction.reply({ content: "No skill scroll equipped!", ephemeral: true });
            }
            //@ts-ignore
            const sk = items_1.ITEMS[skillId];
            if (!sk) {
                return interaction.reply({ content: "Invalid skill scroll!", ephemeral: true });
            }
            //@ts-ignore
            if (currentPlayer.sp < sk.costSP) {
                return interaction.reply({ content: "Not enough SP!", ephemeral: true });
            }
            //@ts-ignore
            currentPlayer.sp -= sk.costSP;
            // 🚩 PLAYER SKILL: Primary target is always the enemy. processAbilityEffects handles self-targeting for heal/buff.
            const log = processAbilityEffects(currentPlayer, enemy, sk, calcSkillDamage);
            // ✅ VICTORY CHECK GOES HERE (only needed if attack was one of the effects)
            if (enemy.hp <= 0) {
                await handleVictory(interaction, log);
                return;
            }
            const next = advanceTurn();
            if (next === "player") {
                await safeUpdate(interaction, {
                    content: log,
                    embeds: [buildCombatEmbed()],
                    components: [buttonsRow],
                });
            }
            else {
                await enemyTurn(interaction, log);
            }
        }
        // ---------- MAGIC ATTACK (FIXED FOR TARGETING) ----------
        else if (interaction.customId === "magic") {
            // REDUNDANT CHECK REMOVED HERE
            const spellId = user.equipment.spell;
            if (!spellId) {
                return interaction.reply({ content: "No spell scroll equipped!", ephemeral: true });
            }
            //@ts-ignore
            const sp = items_1.ITEMS[spellId];
            if (!sp) {
                return interaction.reply({ content: "Invalid spell scroll!", ephemeral: true });
            }
            //@ts-ignore
            if (currentPlayer.mp < sp.costMP) {
                return interaction.reply({ content: "Not enough MP!", ephemeral: true });
            }
            //@ts-ignore
            currentPlayer.mp -= sp.costMP;
            // 🚩 FIX: Magic ability's primary target is the ENEMY.
            // The `processAbilityEffects` helper function will internally redirect HEAL/BUFF effects back to the `currentPlayer` (the actor).
            const log = processAbilityEffects(currentPlayer, enemy, sp, calcSpellDamage);
            // Enemy dies from attack effect (Must check after effects are processed)
            if (enemy.hp <= 0 && log.includes("💥")) {
                await handleVictory(interaction, log);
                return;
            }
            const next = advanceTurn();
            if (next === "player") {
                await safeUpdate(interaction, {
                    content: log,
                    embeds: [buildCombatEmbed()],
                    components: [buttonsRow],
                });
            }
            else {
                // Must defer update before calling enemyTurn if it hasn't been done
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.deferUpdate();
                }
                await enemyTurn(interaction, log);
            }
        }
        // ---------- FLEE ----------
        else if (interaction.customId === "flee") {
            // REDUNDANT CHECK REMOVED HERE
            const chance = getFleeChance(getSpeed(currentPlayer), enemy.speed, enemy.fleeResist);
            const roll = Math.random();
            if (roll < chance) {
                // success
                combatOver = true;
                await endCombat();
                collector.stop("fled");
                await savePlayerState();
                // FIX: Keep try/catch here
                try {
                    await safeUpdate(interaction, {
                        content: `🏃‍♂️ **${currentPlayer.name} successfully fled from ${enemy.name}!**`,
                        embeds: [buildCombatEmbed()],
                        components: [],
                    });
                }
                catch (e) {
                    console.error("Flee update failed, trying to send new message:", e);
                    //@ts-ignore
                    await message.channel.send(`🏃‍♂️ **${currentPlayer.name} successfully fled from ${enemy.name}!** (Interaction Failed)`);
                }
                return;
            }
            else {
                const failText = `❌ **${currentPlayer.name}** tried to flee but **${enemy.name}** blocked the escape! (Chance: ${(chance * 100).toFixed(1)}%)`;
                const next = advanceTurn();
                if (next === "enemy") {
                    // Must defer update before calling enemyTurn if it hasn't been done
                    if (!interaction.deferred && !interaction.replied) {
                        await interaction.deferUpdate();
                    }
                    await enemyTurn(interaction, failText);
                }
                else {
                    await safeUpdate(interaction, {
                        content: failText,
                        embeds: [buildCombatEmbed()],
                        components: [buttonsRow],
                    });
                }
            }
        }
        // Safety Fallback: Ensure data is saved after player action
        await savePlayerState();
    });
    //@ts-ignore
    collector.on("end", async (_collected, reason) => {
        if (!combatOver) {
            combatOver = true;
            await endCombat();
        }
        if (reason === "time") {
            try {
                await combatMessage.edit({
                    content: "⏰ Combat ended due to inactivity.",
                    embeds: [buildCombatEmbed()],
                    components: [],
                });
            }
            catch (e) {
                console.error("Collector end edit failed:", e);
            }
        }
    });
}
//# sourceMappingURL=combat.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPvP = startPvP;
// commands/pvp.ts
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const items_1 = require("../data/items"); // note the ../ and include ItemDef interface
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// --- STATUS HELPERS ---
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
/**
 * Processes status effects (damage, duration) and checks for turn skip.
 * @returns { skipTurn: boolean, log: string }
 */
function processStatuses(target) {
    let log = "";
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
                    skipTurn = true;
                    log += `⚡ **${target.name}** is paralyzed and can’t move!\n`;
                }
                break;
            }
            case "freeze": {
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
    return { skipTurn, log: log.trim() };
}
// --- HYBRID ABILITY PROCESSOR ---
/**
 * Processes all effects (attack, heal, buff) defined on an item/ability for PvP.
 * @param actor The entity using the ability (p1 or p2)
 * @param target The entity the ability is primarily aimed at (p1 or p2)
 * @param ability The ItemDef object representing the skill or spell
 * @param damageCalculator Function to calculate damage (calcSkillDamage or calcSpellDamage)
 * @returns {string} The combat log for the action.
 */
function processAbilityEffects(actor, target, ability, damageCalculator) {
    let log = "";
    // Safely convert abilityType (string or array) into an array of effects
    const effectsToProcess = Array.isArray(ability.abilityType)
        ? ability.abilityType
        : (ability.abilityType ? [ability.abilityType] : []);
    const isSelfTarget = actor.id === target.id;
    for (const type of effectsToProcess) {
        // 1. ATTACK/DAMAGE EFFECT
        if (type === "attack" && ability.damageAmount && ability.damageAmount > 0) {
            if (isSelfTarget)
                continue; // Attack effect must target opponent in PvP
            const dmg = damageCalculator(actor, ability);
            const defMul = target.defenseMultiplier; // PvP players have their own defense multipliers
            const finalDmg = Math.max(1, Math.floor(dmg * defMul));
            target.hp -= finalDmg;
            if (target.hp < 0)
                target.hp = 0;
            log += `💥 **${ability.name}** hits **${target.name}** for **${finalDmg}** damage!`;
            // Defense multiplier is consumed
            target.defenseMultiplier = 1;
            // Check for Status Effect (only apply to damage attacks)
            if (ability.status && Math.random() < (ability.status.chance ?? 1)) {
                applyStatus(target, ability.status);
                log += `\n✨ **${target.name}** is afflicted with **${ability.status.type}**!`;
            }
        }
        // 2. HEAL EFFECT
        else if (type === "heal" && ability.healAmount && ability.healAmount > 0) {
            // Healing must target the caster in PvP
            const heal = ability.healAmount;
            const healed = Math.min(heal, actor.maxHp - actor.hp);
            actor.hp += healed;
            if (healed > 0) {
                log += `\n❤️ **${ability.name}** restores **${healed} HP** to **${actor.name}**!`;
            }
        }
        // 3. BUFF EFFECT
        else if (type === "buff" && ability.buff && ability.buffType) {
            // Buffing must target the caster in PvP
            // We are modifying the local combat state, not the permanent userData
            //@ts-ignore
            actor[ability.buffType] += ability.buff;
            log += `\n✨ **${ability.name}** boosts **${actor.name}'s ${ability.buffType}** by **${ability.buff}**!`;
        }
    }
    // Clean up log spacing
    return log.trim();
}
// ===================================================================
// ====================  END COMBAT LOGIC  ===========================
// ===================================================================
async function startPvP(message, userData) {
    const challengerId = message.author.id;
    const challengerUser = userData[challengerId];
    if (!challengerUser) {
        //@ts-ignore
        return message.channel.send("You are not registered! Use %register first.");
    }
    const args = message.content.trim().split(/\s+/).slice(1);
    const mentioned = message.mentions.users.first();
    if (!mentioned) {
        //@ts-ignore
        return message.channel.send("Tag someone to duel: `%pvp @user [wager]`");
    }
    if (mentioned.id === challengerId) {
        //@ts-ignore
        return message.channel.send("You can't duel yourself.");
    }
    const opponentId = mentioned.id;
    const opponentUser = userData[opponentId];
    if (!opponentUser) {
        //@ts-ignore
        return message.channel.send("That user is not registered yet.");
    }
    // ---------------- SAME LOCATION CHECK (initial) ----------------
    if (challengerUser.location !== opponentUser.location) {
        //@ts-ignore
        return message.channel.send(`You must both be in the same location to duel!\n` +
            `${message.author.username} is in **${challengerUser.location}**\n` +
            `${mentioned.username} is in **${opponentUser.location}**`);
    }
    // ---------------- WAGER PARSE ----------------
    let wager = 0;
    if (args.length > 1) {
        //@ts-ignore
        const maybeNumber = parseInt(args[1], 10);
        if (!isNaN(maybeNumber) && maybeNumber > 0)
            wager = maybeNumber;
    }
    if (wager < 0)
        wager = 0;
    // Check balances if there's a wager
    if (wager > 0) {
        if ((challengerUser.balance || 0) < wager) {
            //@ts-ignore
            return message.channel.send(`${message.author.username}, you don't have enough coins for a **${wager}** coin wager.`);
        }
        if ((opponentUser.balance || 0) < wager) {
            //@ts-ignore
            return message.channel.send(`${mentioned.username} doesn't have enough coins for a **${wager}** coin wager.`);
        }
    }
    // ---------------- SEND CHALLENGE MESSAGE ----------------
    const buttonsRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("pvp_accept")
        .setLabel("Accept")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId("pvp_decline")
        .setLabel("Decline")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    //@ts-ignore
    const challengeMessage = await message.channel.send({
        content: `⚔️ **${message.author.username}** has challenged **${mentioned.username}** to a duel!` +
            (wager > 0 ? `\n💰 Wager: **${wager} coins** each` : "") +
            `\n\n${mentioned}, do you accept?`,
        components: [buttonsRow],
    });
    const filter = (i) => i.user.id === opponentId && i.message.id === challengeMessage.id;
    const collector = challengeMessage.createMessageComponentCollector({
        filter,
        componentType: discord_js_1.ComponentType.Button,
        time: 60 * 1000, // 60 seconds to accept/decline
    });
    let accepted = false;
    collector.on("collect", async (interaction) => {
        if (interaction.customId === "pvp_accept") {
            accepted = true;
            collector.stop("accepted");
            // Clean up the challenge message UI
            await interaction.update({
                content: `✅ **${mentioned.username}** accepted the duel against **${message.author.username}**!` +
                    (wager > 0 ? `\n💰 Wager: **${wager} coins** each` : ""),
                components: [],
            });
            // Start the actual duel
            await runDuel(message, userData, challengerId, opponentId, wager);
        }
        else if (interaction.customId === "pvp_decline") {
            collector.stop("declined");
            await interaction.update({
                content: `❌ **${mentioned.username}** declined the duel.`,
                components: [],
            });
        }
    });
    //@ts-ignore
    collector.on("end", async (_collected, reason) => {
        if (!accepted && reason === "time") {
            try {
                await challengeMessage.edit({
                    content: "⏰ Duel request expired (no response).",
                    components: [],
                });
            }
            catch {
                // ignore
            }
        }
    });
}
// ===================================================================
// ================  ACTUAL DUEL LOGIC BELOW  =========================
// ===================================================================
async function runDuel(message, userData, challengerId, opponentId, wager) {
    const challengerUser = userData[challengerId];
    const opponentUser = userData[opponentId];
    const challengerName = message.author.username;
    const opponentName = message.guild?.members.cache.get(opponentId)?.user.username ||
        "Opponent";
    // Re-check registration & location & balances in case things changed
    if (!challengerUser || !opponentUser) {
        //@ts-ignore
        await message.channel.send("One of the players is no longer registered.");
        return;
    }
    if (challengerUser.location !== opponentUser.location) {
        //@ts-ignore
        await message.channel.send("Duel cancelled: you are no longer in the same location.");
        return;
    }
    if (wager > 0) {
        if ((challengerUser.balance || 0) < wager) {
            //@ts-ignore
            await message.channel.send(`${challengerName} no longer has enough coins for the wager. Duel cancelled.`);
            return;
        }
        if ((opponentUser.balance || 0) < wager) {
            //@ts-ignore
            await message.channel.send(`${opponentName} no longer has enough coins for the wager. Duel cancelled.`);
            return;
        }
    }
    // -------- Player states (local copies for combat) --------
    const p1 = {
        id: challengerId,
        name: challengerName,
        maxHp: challengerUser.vitality * 10,
        hp: challengerUser.HP,
        maxSp: challengerUser.agility * 10,
        sp: challengerUser.SP,
        maxMp: challengerUser.intelligence * 10,
        mp: challengerUser.MP,
        str: challengerUser.strength,
        agi: challengerUser.agility,
        int: challengerUser.intelligence,
        statuses: [], // 🚩 ADDED STATUS TRACKING
        defenseMultiplier: 1, // 🚩 ADDED DEFENSE MULTIPLIER
    };
    const p2 = {
        id: opponentId,
        name: opponentName,
        maxHp: opponentUser.vitality * 10,
        hp: opponentUser.HP,
        maxSp: opponentUser.agility * 10,
        sp: opponentUser.SP,
        maxMp: opponentUser.intelligence * 10,
        mp: opponentUser.MP,
        str: opponentUser.strength,
        agi: opponentUser.agility,
        int: opponentUser.intelligence,
        statuses: [], // 🚩 ADDED STATUS TRACKING
        defenseMultiplier: 1, // 🚩 ADDED DEFENSE MULTIPLIER
    };
    // Who goes first? Higher agility
    let currentTurnId = p1.agi >= p2.agi ? p1.id : p2.id;
    let combatOver = false;
    // defend damage reduction multiplier for the NEXT hit against that player
    // NOTE: Defense multipliers are now stored directly on p1 and p2 objects.
    const physicalCost = 20; // SP cost per physical attack
    const spRegenPerRound = Math.max(1, Math.floor(p1.maxSp * 0.05)); // 5% SP
    const mpRegenPerRound = Math.max(1, Math.floor(p1.maxMp * 0.05)); // 5% MP
    function calcPhysicalDamage(str) {
        const base = str * 2;
        const variance = randInt(-2, 2);
        return Math.max(1, base + variance);
    }
    // --- NEW: use damageAmount for skills/spells, scaling off STR/INT ---
    function calcSkillDamage(actor, ability) {
        const baseStr = actor.str ?? 0;
        const mult = ability.damageAmount ?? 1;
        const dmg = Math.floor(baseStr * mult);
        return Math.max(1, dmg);
    }
    function calcSpellDamage(actor, ability) {
        const baseInt = actor.int ?? 0;
        const mult = ability.damageAmount ?? 1;
        const dmg = Math.floor(baseInt * mult);
        return Math.max(1, dmg);
    }
    function buildEmbed() {
        const turnName = currentTurnId === p1.id ? p1.name : p2.name;
        const wagerText = wager > 0 ? `\n💰 Wager: **${wager} coins**` : "";
        // Status display helper
        const getStatusText = (player) => player.statuses.map((s) => `\n    - ${s.type} (${s.duration}t)`).join('') || '';
        return new discord_js_1.EmbedBuilder()
            .setTitle(`⚔️ PvP Duel: ${p1.name} vs ${p2.name}`)
            .setDescription(`**${p1.name}**\n` +
            `HP: ${p1.hp}/${p1.maxHp}` + getStatusText(p1) + `\n` +
            `SP: ${p1.sp}/${p1.maxSp}\n` +
            `MP: ${p1.mp}/${p1.maxMp}\n\n` +
            `**${p2.name}**\n` +
            `HP: ${p2.hp}/${p2.maxHp}` + getStatusText(p2) + `\n` +
            `SP: ${p2.sp}/${p2.maxSp}\n` +
            `MP: ${p2.mp}/${p2.maxMp}\n\n` +
            `👉 **${turnName}'s turn**` +
            wagerText)
            .setColor(0xeb459e);
    }
    const buttonsRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("physical")
        .setLabel("Physical Attack")
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId("skill")
        .setLabel("Skill")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("magic")
        .setLabel("Magic")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("defend")
        .setLabel("Defend")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId("forfeit")
        .setLabel("Forfeit")
        .setStyle(discord_js_1.ButtonStyle.Danger));
    //@ts-ignore
    const duelMessage = await message.channel.send({
        content: `⚔️ **${p1.name}** vs **${p2.name}** begins!` +
            (wager > 0 ? `\n💰 Wager: **${wager} coins** each` : ""),
        embeds: [buildEmbed()],
        components: [buttonsRow],
    });
    const filter = (i) => [p1.id, p2.id].includes(i.user.id) && i.message.id === duelMessage.id;
    const collector = duelMessage.createMessageComponentCollector({
        filter,
        componentType: discord_js_1.ComponentType.Button,
        time: 3 * 60 * 1000, // 3 minutes
    });
    function getStateById(id) {
        return id === p1.id ? p1 : p2;
    }
    function getUserById(id) {
        return id === p1.id ? challengerUser : opponentUser;
    }
    function getTarget(actorId) {
        return actorId === p1.id ? p2 : p1;
    }
    async function savePvPState() {
        // Only save HP/SP/MP back to the user data
        challengerUser.HP = p1.hp;
        challengerUser.SP = p1.sp;
        challengerUser.MP = p1.mp;
        opponentUser.HP = p2.hp;
        opponentUser.SP = p2.sp;
        opponentUser.MP = p2.mp;
        fs_1.default.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    }
    async function handleVictory(interaction, winnerId, reasonLog) {
        combatOver = true;
        collector.stop("pvp_end");
        const winner = getStateById(winnerId);
        const loser = winnerId === p1.id ? p2 : p1;
        const winnerUser = winnerId === p1.id ? challengerUser : opponentUser;
        const loserUser = winnerId === p1.id ? opponentUser : challengerUser;
        // Apply wager payout if any
        if (wager > 0) {
            const actualWager = Math.min(wager, loserUser.balance || 0); // safety clamp
            loserUser.balance = (loserUser.balance || 0) - actualWager;
            winnerUser.balance = (winnerUser.balance || 0) + actualWager;
        }
        await savePvPState();
        let wagerText = "";
        if (wager > 0) {
            wagerText = `\n💰 **${winner.name}** wins **${wager} coins** from **${loser.name}**!`;
        }
        // Ensure the interaction is either replied to or updated.
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }
        await interaction.editReply({
            content: `🏆 **${winner.name}** defeats **${loser.name}**!\n` +
                reasonLog +
                wagerText,
            embeds: [buildEmbed()],
            components: [],
        });
    }
    // 🚩 New function to handle turn advancement and status processing
    async function advanceTurn(interaction, previousLog) {
        // 1. Switch turn to next player
        currentTurnId = currentTurnId === p1.id ? p2.id : p1.id;
        const actor = getStateById(currentTurnId);
        let log = previousLog;
        // 2. Regen SP/MP for the *new* actor
        const oldSp = actor.sp;
        const oldMp = actor.mp;
        actor.sp = Math.min(actor.maxSp, actor.sp + spRegenPerRound);
        actor.mp = Math.min(actor.maxMp, actor.mp + mpRegenPerRound);
        if (actor.sp !== oldSp || actor.mp !== oldMp) {
            log += `\n💧 **${actor.name}** recovers **${actor.sp - oldSp} SP** and **${actor.mp - oldMp} MP**.`;
        }
        // 3. Process Status Effects on the new actor
        const statusResult = processStatuses(actor);
        log += statusResult.log ? `\n\n${statusResult.log}` : "";
        // 4. Check for death from status damage
        if (actor.hp <= 0) {
            const winnerId = actor.id === p1.id ? p2.id : p1.id;
            await handleVictory(interaction, winnerId, `${log}\n💀 **${actor.name}** succumbed to status effects!`);
            return;
        }
        // 5. Update the game state display
        await savePvPState();
        await interaction.editReply({
            content: log || `👉 **${actor.name}'s** turn.`,
            embeds: [buildEmbed()],
            components: [buttonsRow],
        });
        // 6. If the turn was skipped due to status, immediately advance to the next player
        if (statusResult.skipTurn) {
            // Send an update saying the turn was skipped
            log += `\n❌ **${actor.name}'s** turn was skipped! Advancing to opponent.`;
            await interaction.followUp({ content: log, embeds: [buildEmbed()], ephemeral: false });
            // Recursively call advanceTurn to process the opponent's turn.
            // Note: This needs to handle the interaction token carefully, so we use the followUp and then defer/edit the original message.
            // To simplify, we'll just edit the original message and rely on the next interaction click to process statuses again.
            // Skip back to the caller to switch turns again
            await advanceTurn(interaction, `❌ **${actor.name}'s** turn was skipped due to status effects.`);
        }
    }
    collector.on("collect", async (interaction) => {
        // Defer the interaction update right away to prevent "Interaction Failed"
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }
        if (combatOver) {
            return interaction.followUp({
                content: "This duel is already over.",
                ephemeral: true,
            });
        }
        const actorId = interaction.user.id;
        if (actorId !== currentTurnId) {
            return interaction.followUp({
                content: "It's not your turn!",
                ephemeral: true,
            });
        }
        const actor = getStateById(actorId);
        const target = getTarget(actorId);
        const actorUser = getUserById(actorId);
        let log = "";
        // ---------- PHYSICAL ----------
        if (interaction.customId === "physical") {
            if (actor.sp < physicalCost) {
                return interaction.followUp({
                    content: "You don't have enough SP for a physical attack!",
                    ephemeral: true,
                });
            }
            actor.sp -= physicalCost;
            const weaponId = actorUser.equipment?.rightarm;
            const weapon = weaponId ? items_1.ITEMS[weaponId] : null;
            const attackBonus = weapon?.attack ?? 0;
            const dmg = calcPhysicalDamage(actor.str + attackBonus);
            const defMul = target.defenseMultiplier;
            const finalDmg = Math.max(1, Math.floor(dmg * defMul));
            target.hp -= finalDmg;
            if (target.hp < 0)
                target.hp = 0;
            // reset target defense after getting hit
            target.defenseMultiplier = 1;
            log = `👊 **${actor.name}** hits **${target.name}** for **${finalDmg}** damage!`;
            if (target.hp <= 0) {
                await handleVictory(interaction, actor.id, log);
                return;
            }
        }
        // ---------- SKILL (FIXED FOR HYBRID) ----------
        else if (interaction.customId === "skill") {
            const skillId = actorUser.equipment?.skill;
            if (!skillId) {
                return interaction.followUp({
                    content: "You don't have a skill scroll equipped!",
                    ephemeral: true,
                });
            }
            //@ts-ignore
            const sk = items_1.ITEMS[skillId];
            if (!sk) {
                return interaction.followUp({
                    content: "That skill scroll is invalid.",
                    ephemeral: true,
                });
            }
            if (actor.sp < (sk.costSP ?? 0)) {
                return interaction.followUp({
                    content: "Not enough SP to use that skill!",
                    ephemeral: true,
                });
            }
            actor.sp -= sk.costSP ?? 0;
            // 🚩 USE HYBRID PROCESSOR
            // Pass target for attack, but processAbilityEffects handles self-heal/buff
            log = processAbilityEffects(actor, target, sk, calcSkillDamage);
            if (target.hp <= 0 && log.includes("💥")) {
                await handleVictory(interaction, actor.id, log);
                return;
            }
        }
        // ---------- MAGIC (FIXED FOR HYBRID) ----------
        else if (interaction.customId === "magic") {
            const spellId = actorUser.equipment?.spell;
            if (!spellId) {
                return interaction.followUp({
                    content: "You don't have a spell scroll equipped!",
                    ephemeral: true,
                });
            }
            //@ts-ignore
            const sp = items_1.ITEMS[spellId];
            if (!sp) {
                return interaction.followUp({
                    content: "That spell scroll is invalid.",
                    ephemeral: true,
                });
            }
            if (actor.mp < (sp.costMP ?? 0)) {
                return interaction.followUp({
                    content: "Not enough MP to cast that spell!",
                    ephemeral: true,
                });
            }
            actor.mp -= sp.costMP ?? 0;
            // 🚩 USE HYBRID PROCESSOR
            // Pass target for attack, but processAbilityEffects handles self-heal/buff
            log = processAbilityEffects(actor, target, sp, calcSpellDamage);
            if (target.hp <= 0 && log.includes("💥")) {
                await handleVictory(interaction, actor.id, log);
                return;
            }
        }
        // ---------- DEFEND ----------
        else if (interaction.customId === "defend") {
            const reductionPercent = randInt(20, 50); // 20–50% damage reduction
            const mul = (100 - reductionPercent) / 100;
            actor.defenseMultiplier = mul;
            log =
                `🛡️ **${actor.name}** braces for impact!\n` +
                    `Damage taken until your next hit will be reduced by **${reductionPercent}%**.`;
        }
        // ---------- FORFEIT ----------
        else if (interaction.customId === "forfeit") {
            const otherId = actor.id === p1.id ? p2.id : p1.id;
            log = `🏳️ **${actor.name}** forfeits the duel!`;
            await handleVictory(interaction, otherId, log);
            return;
        }
        // Switch turns, process status/regen for next player, and update message
        await advanceTurn(interaction, log);
    });
    //@ts-ignore
    collector.on("end", async (_collected, reason) => {
        if (!combatOver && reason === "time") {
            combatOver = true;
            await savePvPState();
            try {
                await duelMessage.edit({
                    content: "⏰ Duel ended due to inactivity.",
                    embeds: [buildEmbed()],
                    components: [],
                });
            }
            catch {
                // ignore
            }
        }
    });
}
//# sourceMappingURL=pvp.js.map
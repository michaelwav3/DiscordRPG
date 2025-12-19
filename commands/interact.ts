import { Message, User } from "discord.js"
import fs from 'fs';
import { startCombat, EnemyConfig } from "../combat";
import { giveItem } from "../utils/inventoryHelpers";
import { startQuest, getQuestState, setQuestStatus } from "../utils/questHelpers";
import { QUESTS } from "../data/quests";
import { ITEMS } from "../data/items"; // Or wherever your items are stored

export function interact(Message: Message, userData:any){
    
    const user = userData[Message.author.id];
    const targetRaw = Message.content.split(" ")[1];
    const target = targetRaw?.toLowerCase();

    if(Message.content.split(" ")[1] == undefined){
        return
    }

    if(!user){
    //@ts-ignore
    Message.channel.send("You are not registered! Use $register to register.")
    return
  }

  if (!user.element) user.element = null;
if (user.elementTier === undefined) user.elementTier = 0;
if (!user.elementsUnlocked) user.elementsUnlocked = [];
if (user.waitingForElementChoice === undefined) user.waitingForElementChoice = false; // Initialize


  //@ts-ignore

  
    //henry

   
    if (target === "henry" && user.interactables.includes("Henry")) {
  const tutorialId = "tutorial_bandits";
  const tutorialQuest = getQuestState(user, tutorialId);

  // 1) No quest yet -> give quest
  if (!tutorialQuest) {
    //@ts-ignore
    Message.channel.send(
      "Henry: Ah young adventurer, you've finally awoken from my special potion! Welcome to my basement!\n" +
      "Please, help me defeat 5 bandits outside then return to me!"
    );
    startQuest(user, tutorialId);
    //@ts-ignore
    Message.channel.send("You received quest: **Tutorial: Bandit Problem**");
  }

  // 2) Quest active but not done
  else if (tutorialQuest.status === "active") {
    const def = QUESTS[tutorialId];
    //@ts-ignore
    Message.channel.send(
      `Henry: **SPLENDDYYY!!!** Yummy yummy bandit ` +
      //@ts-ignore
      `${tutorialQuest.progress}/${def.required}. Woohooooooooooo!`
    );
  }

  // 3) Quest completed (killed enough) but reward not claimed yet
  else if (tutorialQuest.status === "completed") {
    const def = QUESTS[tutorialId];

    //@ts-ignore
    Message.channel.send(
      "Henry: Thank you for defeating those pesky bandits! " +
      "As a reward, please accept these coins and a trusty wooden stick!"
    );

    // Give rewards
    //@ts-ignore
    user.balance += def.rewardCoins;
    if (!user.inventory) user.inventory = [];
    user.inventory.push("wooden_stick"); // later replace with giveItem()

    //@ts-ignore
    Message.channel.send(
        //@ts-ignore
      `You received: **${def.rewardCoins} coins**, **Wooden Stick**`
    );

    setQuestStatus(user, tutorialId, "rewarded");
  }

  // 4) Quest already rewarded / fully done
  else if (tutorialQuest.status === "rewarded") {
    //@ts-ignore
    Message.channel.send(
      "Henry: FWJNJgnwjgnjwgjg Goblins in the walls Goblins in the walls Goblins in the walls! We must get rid of them! Please help me!\nYou blink and find yourself in **Goblin Town**"
    );
    user.location = "Goblin Town"
    user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
  }

  // Remember to save after changes
  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
  return;
}


//door

    if(Message.content.split(" ")[1]?.toLowerCase() === "door" && user.interactables.includes("Door")){
        
        if(user.location === "Henry's Basement"){
              //@ts-ignore
            Message.channel.send("You open the door, walk through henry's wizard shack and step outside into Bandit Forest.");
            user.location = "Bandit Forest"
            user.interactables = ["Bandits", "Door"]
            return
        }
        if(user.location === "Bandit Forest"){
              //@ts-ignore
            Message.channel.send("You walk back into Henry's Basement, closing the door behind you.");
            user.location = "Henry's Basement"
            user.interactables = ["Henry", "Door"]
            return
        }else{
            return
        }

        }

        //goblin cave

    if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "goblin cave" && user.interactables.includes("Goblin Cave")){
        
        if(user.location === "Goblin Town"){
              //@ts-ignore
            Message.channel.send("You enter the Goblin Cave, the air is damp and the smell of goblins fills your nostrils.");
            user.location = "Goblin Cave"
            user.interactables = ["Goblins", "Cave Entrance"]
            return
        }
      }

       if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2]) + (" ") + Message.content.split(" ")[3]?.toLowerCase() === "the freaky goblin" && user.interactables.includes("The Freaky Goblin")){
  
       if(user.location === "Goblin Town"){
             //@ts-ignore
        Message.channel.send("You lick the **Freaky Goblin**'s Toes, mmmm yummy 😋🤤🤤");
           return
       }
      }

      //Goblin Tavern

 if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "goblin tavern" && user.interactables.includes("Goblin Tavern")){
        
        if(user.location === "Goblin Town"){
              //@ts-ignore
            Message.channel.send("You enter the Goblin Tavern, drinks flow freely and the atmosphere is lively.");
            user.location = "Goblin Tavern"
            user.interactables = ["Tavern Entrance", "Guckus"]
            return
        }
      }



      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "tavern entrance" && user.interactables.includes("Tavern Entrance")){
        
        if(user.location === "Goblin Tavern"){
              //@ts-ignore
            Message.channel.send("You exit the Goblin Tavern, the air is fresh and you find yourself back in Goblin Town.");
            user.location = "Goblin Town"
            user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
            return
        }
      }

      //Goblin Bank
      
 if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "goblin bank" && user.interactables.includes("Goblin Bank")){
        
        if(user.location === "Goblin Town"){
              //@ts-ignore
            Message.channel.send("You enter the Goblin Bank, the atmosphere is serious and the tellers are busy.");
            user.location = "Goblin Bank"
            user.interactables = ["Bank Entrance"]
            return
        }
      }


      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "bank entrance" && user.interactables.includes("Bank Entrance")){
        
        if(user.location === "Goblin Bank"){
              //@ts-ignore
            Message.channel.send("You exit the Goblin Bank, the air is fresh and you find yourself back in Goblin Town.");
            user.location = "Goblin Town"
            user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
            return
        }
      }

//road

 if(Message.content.split(" ")[1]?.toLowerCase() === "road" && user.interactables.includes("Road")){
        
        if(user.location === "Goblin Town"){
              //@ts-ignore
            Message.channel.send("You walk for miles, finding yourself in front of the Western Capital Gate.");
            user.location = "Western Capital Gate"
            user.interactables = ["Guards", "Road"]
            return
        }
        if(user.location === "Western Capital Gate"){
              //@ts-ignore
            Message.channel.send("You walk miles back to Goblin Town.");
            user.location = "Goblin Town"
            user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
            return
        }
        
        // 🚩 NEW: TRAVEL FROM WESTERN CAPITAL TO ICY MOUNTAINS
        if(user.location === "Western Capital"){
            //@ts-ignore
            Message.channel.send("You follow a winding, upward road. The air gets sharp and cold. You reach the **Icy Mountains**.");
            user.location = "Icy Mountains"
            user.interactables = ["Road", "Inner Mountain", "Ice Elementals", "Otzi"]
            return
        }
        
        if(user.location === "Icy Mountains"){

            //@ts-ignore
            Message.channel.send("You descend the mountains and return to the warmth of the Western Capital.");
            user.location = "Western Capital"
            user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"]
            return
        }
        
        else{
            return
        }
    }


        //Western Capital Gate
       if(Message.content.split(" ")[1]?.toLowerCase() === "guards" && user.interactables.includes("Guards")){
        
        if(user.location === "Western Capital Gate"){
           
              if(user.inventory.includes("western_badge")){
                   //@ts-ignore
                Message.channel.send("The guards recognize your badge and allow you to pass.");
                //@ts-ignore
                Message.channel.send("You find yourself in the Western Capital.");
                user.location = "Western Capital"
                user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"] // Added "Road"
              }else{
                   //@ts-ignore
                Message.channel.send("The guards do not recognize you and block your way.");
              }
    
        }
      }

        //Western Capital

if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "capital gate" && user.interactables.includes("Capital Gate")){
        
        if(user.location === "Western Capital"){
              //@ts-ignore
            Message.channel.send("You exit the Western Capital, the air is fresh and you find yourself back at the Western Capital Gate.");
            user.location = "Western Capital Gate"
            user.interactables = ["Guards", "Road"]
            return
        }
      }

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "capital bank" && user.interactables.includes("Capital Bank")){
        
        if(user.location === "Western Capital"){
              //@ts-ignore
            Message.channel.send("You enter the Western Capital Bank, the atmosphere is serious and the tellers are busy.");
            user.location = "Western Capital Bank"
            user.interactables = ["Bank Entrance"]
            return
        }
      }

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "bank entrance" && user.interactables.includes("Bank Entrance")){
        
        if(user.location === "Western Capital Bank"){
              //@ts-ignore
            Message.channel.send("You exit the Western Capital Bank, the air is fresh and you find yourself back in the Western Capital.");
            user.location = "Western Capital"
            user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"]
            return
        }
      }

      // 🚩 NEW: CAPITAL MARKET LOGIC
      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "capital market" && user.interactables.includes("Capital Market")){
        
        if(user.location === "Western Capital"){
              //@ts-ignore
            Message.channel.send(
                "🛒 You enter the Western Capital Market. Vendors are shouting prices and displaying wares. "
            );
            user.location = "Western Capital Market"
            user.interactables = ["Market Entrance"] // Only exit from the market
            return
        }
      }

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "market entrance" && user.interactables.includes("Market Entrance")){
        
        if(user.location === "Western Capital Market"){
              //@ts-ignore
            Message.channel.send("You exit the Western Capital Market and find yourself back in the Western Capital.");
            user.location = "Western Capital"
            user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"]
            return
        }
      }

      // ======================= SCHOOL OF WIZARDRY =======================
if ((Message.content.split(" ")[1] + " " + Message.content.split(" ")[2])?.toLowerCase() === "school of" &&
    Message.content.split(" ")[3]?.toLowerCase() === "wizardry" &&
    user.interactables.includes("School of Wizardry")) {

  if (user.location === "Western Capital") {
    //@ts-ignore
    Message.channel.send(
      "You step into the **School of Wizardry**. Ancient runes glow along the walls.\n" +
      "At the center stands the **Grand Wizard Mumbo**."
    );

    user.location = "School of Wizardry";
    user.interactables = ["Grand Wizard Mumbo", "School Entrance"];

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }
}

if ((Message.content.split(" ")[1] + " " + Message.content.split(" ")[2])?.toLowerCase() === "school entrance" &&
    user.interactables.includes("School Entrance")) {

  if (user.location === "School of Wizardry") {
    //@ts-ignore
    Message.channel.send("You exit the School of Wizardry and return to the Western Capital.");

    user.location = "Western Capital";
    user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"];
    
    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }
}


//INNER MOUNTAIN

if ((Message.content.split(" ")[1] + " " + Message.content.split(" ")[2])?.toLowerCase() === "inner mountain" &&
    user.interactables.includes("Inner Mountain")) {
      if(user.location === "Icy Mountains"){
        //@ts-ignore
Message.channel.send("You enter the Inner Mountain, the air is frigid and the ground is covered in ice. Faint light can be seen in the distance.");
user.location = "Inner Mountain"
user.interactables = ["Mountain Entrance", "Direbats", "Mountain Exit"]
fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
return;
    }
      }

      if ((Message.content.split(" ")[1] + " " + Message.content.split(" ")[2])?.toLowerCase() === "mountain entrance" &&
    user.interactables.includes("Mountain Entrance")) {
      if(user.location === "Inner Mountain"){
        //@ts-ignore
Message.channel.send("You exit the Inner Mountain, the air is sharp and cold as you step back into the Icy Mountains.");
user.location = "Icy Mountains"
user.interactables = ["Road", "Inner Mountain", "Ice Elementals", "Otzi"]
fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
return;
      }
    }

if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "mountain exit" && user.interactables.includes("Mountain Exit")){
        
        if(user.location === "Inner Mountain"){
           
              if(user.inventory.includes("alpha_bat_wing")){
                   //@ts-ignore
                Message.channel.send("Your Alpha Direbat Wing glows black as the rocks blocking the exit crumble away.");
                //@ts-ignore
                Message.channel.send("You walk through and find yourself in the Scorching Desert.");
                user.location = "Scorching Desert"
                user.interactables = ["Mountain Exit", "Sand Worms", "Oasis", "Desert Road"]
              }else{
                   //@ts-ignore
                Message.channel.send("The mountain exit is blocked by large rocks. Perhaps something can help you get through?");
              }
    
        }

        if(user.location === "Scorching Desert"){
              //@ts-ignore
            Message.channel.send("You walk back into the Inner Mountain, the cavernous area is dimly lit by glowing crystals embedded in the walls.");
            user.location = "Inner Mountain"
            user.interactables = ["Mountain Entrance", "Dire Bats", "Mountain Exit"]
            return
        }
      }
    


//CAPITAL GRAVEYARD

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "capital graveyard" && user.interactables.includes("Capital Graveyard")){
        
        if(user.location === "Western Capital"){
              //@ts-ignore
            Message.channel.send("You enter the Western Capital Graveyard, the atmosphere is eerie and somber.");
            user.location = "Western Capital Graveyard"
            user.interactables = ["Grave Entrance", "Skeletons"]
            return
        }
      }

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "grave entrance" && user.interactables.includes("Grave Entrance")){
        
        if(user.location === "Western Capital Graveyard"){
              //@ts-ignore
            Message.channel.send("You exit the Western Capital Graveyard, the air is fresh and you find yourself back in the Western Capital.");
            user.location = "Western Capital"
            user.interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "Road"]
            return
        }
      }

      if((Message.content.split(" ")[1]?.toLowerCase()) === "skeletons" && user.interactables.includes("Skeletons")){
        
        if(user.location === "Western Capital Graveyard"){
        
               const skeleton: EnemyConfig = {
 name: "Skeleton",
  maxHp: 200,
  str: 30,
  speed: 20,
  fleeResist: 0.4,
  coinReward: 15,
  int: 20,
  maxSp: 100,
  maxMp: 100,

  skillIds: ["spooky_bones"],     // must exist in ITEMS with type: "skill"

  skillChance: 0.2, // 40% chance to try a skill

  drops: [
    { itemId: "spooky_bones", chance: 0.01 },
],}


    startCombat(Message, userData, skeleton);
    return;
            return
        }
      }





//guckus

// ======================= GUCKUS (Goblin Tavern) =======================
if (target === "guckus" && user.interactables.includes("Guckus")) {
  const goblinQuestId = "goblins";
  const shamanQuestId = "goblinShaman";

  const goblinQuest = getQuestState(user, goblinQuestId);
  const shamanQuest = getQuestState(user, shamanQuestId);

  const goblinDef = QUESTS[goblinQuestId];
  const shamanDef = QUESTS[shamanQuestId];

  // 1) No goblin quest yet -> give Guckus 1: Goblins
  if (!goblinQuest) {
    //@ts-ignore
    Message.channel.send(
      "Guckus: *Hiccup*... You smell like non-goblin... good.\n" +
      "I hate them filthy goblins, I ain't no goblin, I just got reverse goblin Re-Vitaligo\n These caves are crawling with nasty goblins. You help Guckus, yes?\n" +
     //@ts-ignore
      `Kill **${goblinDef.required}** for me.`
    );

    startQuest(user, goblinQuestId);

    //@ts-ignore
    Message.channel.send(
       //@ts-ignore
      `You received quest: **${goblinDef.name}**\n` +
       //@ts-ignore
      `${goblinDef.description}`
    );

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }

  // 2) Goblin quest is active (in progress)
  if (goblinQuest.status === "active") {
    //@ts-ignore
    Message.channel.send(
      //@ts-ignore
      `Guckus: You only squished **${goblinQuest.progress}/${goblinDef.required}** goblins so far.\n` +
      "Back to the cave with you!"
    );

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }

  // 3) Goblin quest completed but not rewarded yet
  if (goblinQuest.status === "completed") {
    //@ts-ignore
    Message.channel.send(
      "Guckus: OHO! You actually did it!\n" +
      "Guckus is impressed. Here, take some shinies."
    );

    // Give rewards for goblins quest
     //@ts-ignore
    user.balance = (user.balance || 0) + goblinDef.rewardCoins;
    if (!user.inventory) user.inventory = [];
     //@ts-ignore
    if (goblinDef.rewardItems && goblinDef.rewardItems.length > 0) {
       //@ts-ignore
      for (const itemId of goblinDef.rewardItems) {
        user.inventory.push(itemId);
      }
    }

    //@ts-ignore
    Message.channel.send(
       //@ts-ignore
      `You received: **${goblinDef.rewardCoins} coins**` +
       //@ts-ignore
      (goblinDef.rewardItems && goblinDef.rewardItems.length > 0
         //@ts-ignore
        ? ` and **${goblinDef.rewardItems.join(", ")}**`
        : "")
    );

    setQuestStatus(user, goblinQuestId, "rewarded");

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }

  // 4) Goblin quest fully rewarded -> handle Goblin Shaman questline
  if (goblinQuest.status === "rewarded") {
    // 4a) No shaman quest yet -> offer it
    if (!shamanQuest) {
      //@ts-ignore
      Message.channel.send(
        "Guckus: I hate those filthy green backs...\n" +
        "Guckus hears rumors of the Goblin Shaman, makes bad magic. Bad for business. Bad for Guckus.\n" +
        "You... you look strong enough now. Go defeat the **Goblin Shaman**!"
      );

      startQuest(user, shamanQuestId);

      //@ts-ignore
      Message.channel.send(
         //@ts-ignore
        `You received quest: **${shamanDef.name}**\n` +
         //@ts-ignore
        `${shamanDef.description}`
      );

      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    }

    // 4b) Shaman quest active
    if (shamanQuest.status === "active") {
      //@ts-ignore
      Message.channel.send(
         //@ts-ignore
        `Guckus: Still no shaman head?\n` +
        "Go deeper. Listen for chanting."
      );

      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    }

    // 4c) Shaman defeated but reward not given yet
    if (shamanQuest.status === "completed") {
      //@ts-ignore
      Message.channel.send(
        "Guckus: YOU DID IT! The Shaman is gone, cave is quieter already.\n" +
        "Here, take Guckus's special stash and this badge I found..."
      );
 //@ts-ignore
      user.balance = (user.balance || 0) + shamanDef.rewardCoins;
      if (!user.inventory) user.inventory = [];
       //@ts-ignore
      if (shamanDef.rewardItems && shamanDef.rewardItems.length > 0) {
         //@ts-ignore
        for (const itemId of shamanDef.rewardItems) {
          user.inventory.push(itemId);
        }
      }

      //@ts-ignore
      Message.channel.send(
         //@ts-ignore
        `You received: **${shamanDef.rewardCoins} coins**` +
         //@ts-ignore
        (shamanDef.rewardItems && shamanDef.rewardItems.length > 0
           //@ts-ignore
          ? ` and **${shamanDef.rewardItems.join(", ")}**`
          : "")
      );

      setQuestStatus(user, shamanQuestId, "rewarded");

      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    }

    // 4d) Shaman quest already rewarded
    if (shamanQuest.status === "rewarded") {
      //@ts-ignore
      Message.channel.send(
        "Guckus: Business is booming now that Shaman is gone.\n" +
        "You ever need a drink, hero, Guckus has you covered."
      );

      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    }
  }
}

//OTZI

// ======================= OTZI (Icy Mountains) =======================
if (target === "otzi" && user.interactables.includes("Otzi")) {

  const otziQuestId = "otzi_quest";
  const otziQuest = getQuestState(user, otziQuestId);
  const otziDef = QUESTS[otziQuestId];

  // Safety
  if (user.location !== "Icy Mountains") {
    //@ts-ignore
    Message.channel.send("You feel a freezing presence, but Otzi is nowhere to be found...");
    return;
  }

  // 1️⃣ No quest yet → Otzi gives fetch quest
  if (!otziQuest) {
    //@ts-ignore
    Message.channel.send(
      "Otzi: *shivers*\n" +
      "Cold never bothered Otzi... until now.\n" +
      "Lost cloak.. need new warm cloak.\n" +
      "Bring **Yeti Fur Cloak**, yes?"
    );

    startQuest(user, otziQuestId);

        //@ts-ignore
    Message.channel.send(
     //@ts-ignore
      `You received quest: **${otziDef.name}**\n` +

    //@ts-ignore
      `${otziDef.description}`
    );

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }

  // 2️⃣ Quest active → check for item
  if (otziQuest.status === "active") {

    //@ts-ignore
    const needed = otziDef.fetchAmount ?? 1;

    //@ts-ignore
    const itemId = otziDef.fetchItem!;
    const have = user.inventory.filter((i: string) => i === itemId).length;

    if (have < needed) {
      //@ts-ignore
      Message.channel.send(
        "Otzi: Still cold...\n" +

    //@ts-ignore
        `Otzi waits for **${needed - have} more ${ITEMS[itemId]?.name ?? itemId}**.`
      );

      fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
      return;
    }

    // 3️⃣ Item delivered → complete quest
    // Remove items
    let removed = 0;
    user.inventory = user.inventory.filter((i: string) => {
      if (i === itemId && removed < needed) {
        removed++;
        return false;
      }
      return true;
    });

    //@ts-ignore
    Message.channel.send(
      "Otzi: Ahhh... warm again.\n" +
      "Otzi has gift in return.\n" +
      "Take staff, thank you friend.\n" +
      "You received: **Frostspire Staff**"
    );

    // Give rewards

    //@ts-ignore
    if (otziDef.rewardItems && otziDef.rewardItems.length > 0) {

    //@ts-ignore
      for (const item of otziDef.rewardItems) {
        user.inventory.push(item);
      }
    }
//@ts-ignore
    otziQuest.progress = otziDef.fetchAmount ?? 1;
    setQuestStatus(user, otziQuestId, "rewarded");

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }

  // 4️⃣ Quest already rewarded
  if (otziQuest.status === "rewarded") {
    //@ts-ignore
    Message.channel.send(
      "Otzi: Staff serves you well.\n" +
      "Mountains safer with you here."
    );

    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    return;
  }
}

// ======================= GRAND WIZARD MUMBO =======================
if ((target === "grand" || target === "mumbo") && user.interactables.includes("Grand Wizard Mumbo")) {

  // Player has mastered all elements (4 elements)
  if (user.elementsUnlocked.length === 4) {
    //@ts-ignore
    Message.channel.send(
      "Mumbo: You have mastered all elements. There is nothing left I can teach you."
    );
    return;
  }

  // Player has not chosen an element yet
  if (!user.element) {
    // 🚩 NEW: Set flag to wait for element choice and prompt for reply.
    user.waitingForElementChoice = true;
    fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
    
    //@ts-ignore
    Message.channel.send(
      "Mumbo: You stand before the elements.\n" +
      "Choose wisely: **fire**, **water**, **earth**, or **air**.\n" +
      "**Reply with the element you wish to choose** (e.g., `fire`) in this channel. This choice is permanent until mastery."
    );
    return;
  }

  // Player HAS an element → attempt next trial
  // 🚫 Element already mastered
if (user.elementsUnlocked.includes(user.element)) {
  //@ts-ignore
  Message.channel.send(
    `Mumbo: You have already mastered **${user.element.toUpperCase()}**.\n` +
    "Choose a different element when you are ready."
  );

  // Reset so they must pick a NEW element
  user.element = null;
  user.elementTier = 0;
  user.waitingForElementChoice = true;

  fs.writeFileSync("userData.json", JSON.stringify(userData, null, 2));
  return;
}

// Otherwise → continue trials
handleMumboTrial(Message, userData);
return;

}


      //Goblin Casino

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "goblin casino" && user.interactables.includes("Goblin Casino")){
        
        if(user.location === "Goblin Town"){
              //@ts-ignore
            Message.channel.send("You enter the Goblin Casino, goblinkchy time!");
            user.location = "Goblin Casino"
            user.interactables = ["Casino Entrance"]
            return
        }
      }

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "casino entrance" && user.interactables.includes("Casino Entrance")){
        
        if(user.location === "Goblin Casino"){
              //@ts-ignore
            Message.channel.send("You exit the Goblin Casino, the air is fresh and you find yourself back in Goblin Town.");
            user.location = "Goblin Town"
            user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
            return
        }
      }

      //cave entrance

      if((Message.content.split(" ")[1] + (" ") + Message.content.split(" ")[2])?.toLowerCase() === "cave entrance" && user.interactables.includes("Cave Entrance")){
        
        if(user.location === "Goblin Cave"){
              //@ts-ignore
            Message.channel.send("You exit the Goblin Cave, the air is fresh and you find yourself back in Goblin Town.");
            user.interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road", "The Freaky Goblin"]
            user.location = "Goblin Town"
            return
        }
      }

        //bandits

if(Message.content.split(" ")[1]?.toLowerCase() === "bandits" && user.interactables.includes("Bandits")){
    if(user.location==="Bandit Forest"){
     const bandit: EnemyConfig = {
  name: "Bandit",
  maxHp: 40,
  str: 8,
  speed: 10,
  fleeResist: 0.2,
  coinReward: 2,
};


    startCombat(Message, userData, bandit);
    return;
}
}

if(Message.content.split(" ")[1]?.toLowerCase() === "goblins" && user.interactables.includes("Goblins")){
    if(user.location==="Goblin Cave"){

     const goblin: EnemyConfig = {
  name: "Goblin",
  maxHp: 50,
  str: 10,
  speed: 10,
  fleeResist: 0.2,
  coinReward: 5,
  int: 15,
  maxSp: 30,
  maxMp: 50,

  skillIds: ["stab"],     // must exist in ITEMS with type: "skill"

  skillChance: 0.4, // 40% chance to try a skill

  drops: [
    { itemId: "stab", chance: 0.1 },           // 10% chance
    
  
  ],
};

  const goblinShaman: EnemyConfig = {
  name: "Goblin Shaman",
  maxHp: 250,
  str: 5,
  speed: 10,
  fleeResist: 0.2,
  coinReward: 50,
  int: 20,
  maxSp: 30,
  maxMp: 100,

  spellIds: ["darkmagic"],     // must exist in ITEMS with type: "spell"

  spellChance: 0.5, // 50% chance to try a spell

  drops: [
    { itemId: "darkmagic", chance: 0.05 },           // 5% chance
    
  
  ],
};


const roll = Math.random();

if(roll<0.05){
  startCombat(Message, userData, goblinShaman);
}else{
    startCombat(Message, userData, goblin);
}


    return;

}
}


// ===============================================
// 🚩 NEW: ICY MOUNTAINS COMBAT LOGIC
// ===============================================

// Check for "ice elementals" (or "ice" or "elementals") interactable
if((Message.content.split(" ")[1]?.toLowerCase() === "ice" && Message.content.split(" ")[2]?.toLowerCase() === "elementals") ||
   (Message.content.split(" ")[1]?.toLowerCase() === "ice") && user.interactables.includes("Ice Elementals")){
    
    if(user.location === "Icy Mountains"){
        
        const iceElemental: EnemyConfig = {
            name: "Ice Elemental",
            maxHp: 350,
            str: 40,
            speed: 30,
            fleeResist: 0.5,
            coinReward: 50,
            int: 40,
            maxSp: 150,
            maxMp: 500,
            // Assuming you have a 'freeze' related spell/skill in your ITEMS data
            // For now, using a placeholder if you don't have one yet
            spellIds: ["icicle_crash"], 
            spellChance: 0.3,
            drops: [],
        };

        const yeti: EnemyConfig = {
            name: "The Yeti",
            maxHp: 1000,
            str: 70,
            speed: 50,
            fleeResist: 0.8,
            coinReward: 500,
            int: 10,
            maxSp: 500,
            maxMp: 50,
            skillIds: ["yeti_slam"],
            skillChance: 0.3,
            // Yeti has a high chance to drop something special if you add items later
            drops: [
          { itemId: "yeti_fur", chance: 0.5 },  
          { itemId: "yeti_fur", chance: 0.5 }, 
          { itemId: "yeti_pelt", chance: 0.25 },
          { itemId: "yeti_pelt", chance: 0.25 },

            ], 
        };

        const roll = Math.random();

        // 1% chance for the Yeti
        if(roll < 0.01){ 
            //@ts-ignore
            Message.channel.send("🚨 **A powerful presence shakes the mountain!** You encounter the ferocious **Yeti**! 🏔️");
            startCombat(Message, userData, yeti);
        } else {
            startCombat(Message, userData, iceElemental);
        }

        return;
    }
}

//Inner Mountain

if((Message.content.split(" ")[1]?.toLowerCase() === "direbats") &&
   user.interactables.includes("Direbats")){
    
    if(user.location === "Inner Mountain"){
        
        const direbat: EnemyConfig = {
            name: "Dire Bat",
            maxHp: 750,
            str: 60,
            speed: 52,
            fleeResist: 0.5,
            coinReward: 150,
            int: 10,
            maxSp: 1000,
            maxMp: 100,
            skillIds: ["sonic_screech"], 
            skillChance: 0.3,
            drops: [],
        };

        const alphaDirebat: EnemyConfig = {
            name: "Alpha Direbat",
            maxHp: 5000,
            str: 150,
            speed: 100,
            fleeResist: 0.8,
            coinReward: 2500,
            int: 25,
            maxSp: 1000,
            maxMp: 50,
            skillIds: ["sonic_boom"],
            skillChance: 0.3,
            drops: [
    { itemId: "alpha_bat_wing", chance: 1 },           // 10% chance
  ],
        };

        const roll = Math.random();

        // 1% chance for the Alpha Direbat
        if(roll < 0.01){ 
            //@ts-ignore
            Message.channel.send("🚨 **Rocks fall as the ground trembles around you** You encounter the **Alpha Direbat**! 🏔️");
            startCombat(Message, userData, alphaDirebat);
        } else {
            startCombat(Message, userData, direbat);
        }

        return;
    }
}

fs.writeFileSync('userData.json', JSON.stringify(userData, null, 2))

    }

//@ts-ignore
function handleMumboTrial(Message, userData) {
  const user = userData[Message.author.id];

  // INT required for Tiers 1, 2, 3, 4, 5 (Mumbo Tier 0, 1, 2, 3, 4)
  const INT_REQUIREMENTS = [10, 30, 50, 75, 100]; 

  if (user.elementTier >= 5) {
    Message.channel.send("Mumbo: You have mastered this element.");
    return;
  }
  
  // The current tier is the move they *have* earned. The next required INT is for the tier they are about to fight.
  const nextTrialIndex = user.elementTier; 
  const requiredInt = INT_REQUIREMENTS[nextTrialIndex];
  
//@ts-ignore
  if ((user.intelligence ?? 0) < requiredInt) {
    Message.channel.send(
      `Mumbo: You are not ready for **${user.element.toUpperCase()} Trial ${nextTrialIndex + 1}**. Required INT: **${requiredInt}**`
    );
    return;
  }

  const mumbo = createMumbo(user);
  startCombat(Message, userData, mumbo);
}
//@ts-ignore
function createMumbo(user): EnemyConfig {
  const SPELLS = {
    fire: ["fireball", "greatFireball", "dragonFlame", "incinerate", "elderFlame"],
    water: ["waterBullet", "waterWall", "waterPrison", "tsunami", "poseidon"],
    earth: ["earthWall", "earthFlowRiver", "rockTomb", "earthquake", "ragnarok"],
    air: ["jetStream", "airPalm", "suffocate", "flight", "aeolus"],
  };

  const tier = user.elementTier;
  //@ts-ignore
  const spellId = SPELLS[user.element][tier];

  return {
    name: `Grand Wizard Mumbo (${user.element.toUpperCase()} Trial ${tier + 1})`,
    maxHp: 300 + tier * 250,
    str: 10 + tier * 10,
    int: 40 + tier * 30,
    speed: 20 + tier * 5,
    fleeResist: 1,
    coinReward: 100 * (tier + 1),
    maxMp: 2000,
    spellIds: [spellId],
    spellChance: 0.7,
  };
}
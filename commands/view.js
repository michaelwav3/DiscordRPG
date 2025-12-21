"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.view = view;
function view(Message, userData) {
    const user = userData[Message.author.id];
    if (!user) {
        //@ts-ignore
        Message.channel.send("You are not registered! Use $register to register.");
        return;
    }
    if (user.location === "Henry's Basement") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Henry's Basement!\nHenry is here, looking at you expectantly.\n\nYou can Interact with: \nHenry\ndoor");
        user.Interactables = ["Henry", "door"];
    }
    else if (user.location === "Bandit Forest") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Bandit Forest!\nThe trees are dense and the air is filled with the sounds of wildlife.\n\nYou can Interact with: \nBandits\ndoor");
        user.Interactables = ["Bandits", "door"];
    }
    else if (user.location === "Goblin Town") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Goblin Town!\nThe town is bustling with goblins going about their daily lives.\n\nYou can Interact with: \nGoblin Cave\nGoblin Casino\nGoblin Bank\nGoblin Tavern\nRoad");
        user.Interactables = ["Goblin Cave", "Goblin Casino", "Goblin Bank", "Goblin Tavern", "Road"];
    }
    else if (user.location === "Goblin Cave") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Goblin Cave!\nThe air is damp and the smell of goblins fills your nostrils.\n\nYou can Interact with: \nGoblins\nCave Entrance");
        user.Interactables = ["Goblins", "Cave Entrance"];
    }
    else if (user.location === "Goblin Casino") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Goblin Casino!\nThe air is filled with the sounds of gambling and excitement.\n\nYou can Interact with: \nCasino Entrance");
        user.Interactables = ["Casino Entrance"];
    }
    else if (user.location === "Goblin Bank") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Goblin Bank!\nThe tellers are busy and the atmosphere is serious.\n\nYou can use %deposit and %withdraw or \nInteract with: \nBank Entrance");
        user.Interactables = ["Bank Entrance"];
    }
    else if (user.location === "Goblin Tavern") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself in Goblin Tavern!\nThe air is filled with the sounds of drinking and merriment.\n\nYou can Interact with: \nTavern Entrance\nGuckus");
        user.Interactables = ["Tavern Entrance", "Guckus"];
    }
    else if (user.location === "Western Capital Gate") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the Western Capital Gate!\nThe guards are here, watching everyone who passes.\n\nYou can Interact with: \nGuards\nRoad");
        user.Interactables = ["Guards", "Road"];
    }
    else if (user.location === "Western Capital") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the Western Capital!\nThe city is bustling with activity and the sounds of commerce fill the air.\n\nYou can Interact with: \nCapital Bank\nCapital Gate\nCapital Market\nSchool of Wizardry\nCapital Graveyard\nRoad");
        user.Interactables = ["Capital Bank", "Capital Gate", "Capital Market", "School of Wizardry", "Capital Graveyard", "road"];
    }
    else if (user.location === "Western Capital Bank") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the Western Capital Bank!\nThe tellers are busy and the atmosphere is serious.\n\nYou can use %deposit and %withdraw or \nInteract with: \nBank Entrance");
        user.Interactables = ["Bank Entrance"];
    }
    else if (user.location === "Western Capital Graveyard") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the Western Capital Graveyard!\nThe atmosphere is somber and quiet.\n\nYou can Interact with: \nGrave Entrance\nSkeletons");
        user.Interactables = ["Grave Entrance", "Skeletons"];
    }
    else if (user.location === "Western Capital Market") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the Western Capital Market!\nThe market is bustling with activity and the sounds of commerce fill the air.\n\nYou can use %shop, %buy, and %sell or \nInteract with: \nMarket Entrance");
        user.Interactables = ["Market Entrance"];
    }
    else if (user.location === "School of Wizardry") {
        //@ts-ignore
        Message.channel.send("You look around to find yourself at the School of Wizardry!\nThe halls are filled with the sounds of students studying and practicing magic.\n\nYou can Interact with: \nMumbo\nSchool Entrance");
        user.Interactables = ["Grand Wizard Mumbo", "School Entrance"];
    } // 🚩 NEW LOCATION: Icy Mountains
    else if (user.location === "Icy Mountains") {
        //@ts-ignore
        Message.channel.send("🏔️ You look around to find yourself in the Icy Mountains! The wind howls and a biting cold permeates the air. Distant peaks tower over you.\n\nYou can Interact with: \nIce Elementals\nInner Mountain\nRoad");
        user.interactables = ["Inner Mountain", "Ice Elementals", "Road"];
    }
    else if (user.location === "Inner Mountain") {
        //@ts-ignore
        Message.channel.send("🏔️ You look around to find yourself in the Inner Mountain! The cavernous area is dimly lit by glowing crystals embedded in the walls. The air is cold and damp.\n\nYou can Interact with: \nDirebats\nMountain Entrance\nMountain Exit");
        user.interactables = ["Mountain Entrance", "Direbats", "Mountain Exit"];
    }
    else if (user.location === "Scorching Desert") {
        //@ts-ignore
        Message.channel.send("🏜️ You look around to find yourself in the Scorching Desert! The sun blazes overhead, and the heat shimmers off the endless dunes of sand. The air is dry and arid.\n\nYou can Interact with: \nSand Worms\nOasis\n Desert Road\nMountain Exit");
        user.interactables = ["Mountain Exit", "Sand Worms", "Oasis", "Desert Road"];
    }
    else if (user.location === "Oasis") {
        //@ts-ignore
        Message.channel.send("🌴 You look around to find yourself at the Oasis! A small pool of water surrounded by palm trees offers a refreshing respite from the desert heat. The sound of water trickling soothes your senses.\n\nYou can Interact with: \nOasis Exit\nOasis Pool");
    }
    else if (user.location === "RNG World") {
        //@ts-ignore
        Message.channel.send("Everything around you is incomprehensible\nYou can Interact with:\n???\nWake Up");
    }
}
//# sourceMappingURL=view.js.map
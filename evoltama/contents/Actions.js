/*
  this file contains the actions that can be performed in the game.
*/

window.Actions = {
  // attacks
  phantomCharge: {
    name: "Phantom Charge",
    description:
      "The user calls upon their powers of shadow to travel at high speeds towards the enemy, dealing damage.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "phantomCharge" },
      { type: "stateChange", damage: 12 },
    ],
  },
  voidHowl: {
    name: "Void Howl",
    description:
      "The user lets out a screeching howl to deal heavy damage to the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "voidHowl" },
      { type: "stateChange", damage: 20 },
    ],
  },
  starShatter: {
    name: "Star Shatter",
    description:
      "The user sends forth a whirl of stars from the shadow realm, dealing damage to the enemy and leaving them dazed.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "starShatter" },
      { type: "stateChange", status: { type: "dazed", expiresIn: 3 } },
      {
        type: "textMessage",
        text: "{TARGET} is dazed! They may be unable to move.",
      },
    ],
  },
  astralCoil: {
    name: "Astral Coil",
    description:
      "The user wraps their body around the enemy, squeezing them tightly and dealing damage.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 12 },
    ],
  },
  ghostFang: {
    name: "Ghost Fang",
    description:
      "The user channels their mythic abilities to bite the enemy from a distance, dealing large amounts of damage.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "stateChange", damage: 20 },
    ],
  },
  paralyzingSpit: {
    name: "Paralyzing Spit",
    description: "The user spits poison at the enemy, leaving the enemy dazed.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "paralyzingSpit", color: "#dafd2a" },
      { type: "stateChange", status: { type: "dazed", expiresIn: 3 } },
      {
        type: "textMessage",
        text: "{TARGET} is dazed! They may be unable to move.",
      },
    ],
  },
  paralyzingDust: {
    name: "Paralyzing Dust",
    description:
      "The user scatters dust around the environment, leaving the enemy dazed.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "paralyzingDust" },
      { type: "stateChange", status: { type: "dazed", expiresIn: 3 } },
      {
        type: "textMessage",
        text: "{TARGET} is dazed! They may be unable to move.",
      },
    ],
  },
  windCutter: {
    name: "Wind Cutter",
    description:
      "The user flaps their wings violently in an X pattern to send gusts at the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 20 },
    ],
  },
  mesmerizingGaze: {
    name: "Mesmerizing Gaze",
    description:
      "The user uses their psychic abilities to send harmful waves to the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "voidHowl" },
      { type: "stateChange", damage: 20 },
    ],
  },
  thunderJolt: {
    name: "Thunder Jolt",
    description:
      "The user releases a sudden jolt of electricity, shocking the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "electricZap" },
      { type: "stateChange", damage: 20 },
    ],
  },
  naturesGrasp: {
    name: "Nature's Grasp",
    description:
      "The user summons vines and roots from the ground to trap the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "vineWhip" },
      { type: "stateChange", damage: 12 },
      { type: "stateChange", status: { type: "dazed", expiresIn: 2 } },
      { type: "textMessage", text: "{TARGET} is entangled and dazed!" },
    ],
  },
  shroudStep: {
    name: "Shroud Step",
    description: "The user fades into the shadows, dodging the next attack.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "shadowVanish" },
      {
        type: "stateChange",
        status: { type: "evade", expiresIn: 2 },
        onCaster: true,
      },
      {
        type: "textMessage",
        text: "{CASTER} is ready to dodge the next attack!",
      },
    ],
  },
  galeBurst: {
    name: "Gale Burst",
    description:
      "The user summons a powerful gust of wind to knock back the enemy.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "windBlast" },
      { type: "stateChange", damage: 12 },
    ],
  },
  recoverPulse: {
    name: "Recover Pulse",
    description:
      "The user surrounds themselves in healing energy, recovering some health over time.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      {
        type: "stateChange",
        status: { type: "recover", expiresIn: 2, amount: 5, levelScale: 1 },
        onCaster: true,
      },
      {
        type: "textMessage",
        text: "{CASTER} will recover health for a while!",
      },
    ],
  },
  grandRenewal: {
    name: "Grand Renewal",
    description:
      "The user invokes a greater healing aura, recovering large amounts of health over time.",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      {
        type: "stateChange",
        status: { type: "recover", expiresIn: 3, amount: 8, levelScale: 2 },
        onCaster: true,
      },
      {
        type: "textMessage",
        text: "{CASTER} will recover health for a long time!",
      },
    ],
  },

  // items
  item_recoverStatus: {
    name: "Green Potion",
    description: "The user may drink this potion to remove status effects.",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} drinks a {ACTION}!" },
      { type: "stateChange", status: null },
      {
        type: "textMessage",
        text: "{CASTER} has been cured of all status effects!",
      },
    ],
  },
  item_recoverHp: {
    name: "Red Potion",
    description: "The user may drink this potion to recover 40 lost health.",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} drinks a {ACTION}!" },
      { type: "stateChange", recover: 40 },
      { type: "textMessage", text: "{CASTER} recovers health!" },
    ],
  },

  // attempt to capture a wild evolisk
  catchDisc: {
    name: "Capture Disc",
    description: "Throw a capture disc to try and catch the wild Evolisk.",
    success: [
      { type: "textMessage", text: "You throw a {ACTION}!" },
      { type: "animation", animation: "throwCaptureDisc" },
      { type: "attemptCatch" },
    ],
    targetType: "enemy",
  },
};

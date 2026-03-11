/*
  this file contains the creatures used in the game.
*/

window.EvoliskTypes = {
  // evolisk types
  Shadow: "shadow",
  Mythic: "mythic",
  Naturalist: "naturalist",
};

window.Evolisks = {
  // enemy evolisks
  ee001: {
    name: "Luxigon",
    description: "A dark but loyal Evolisk.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/LuxigonBattleEnemy.png",
    icon: "./images/icons/Shadow.png",
    actions: ["phantomCharge", "voidHowl", "starShatter"],
  },
  ee002: {
    name: "Umbraik",
    description: "A slightly unsettling Evolisk.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/UmbraikBattleEnemy.png",
    icon: "./images/icons/Mythic.png",
    actions: ["astralCoil", "ghostFang", "paralyzingSpit"],
  },
  ee003: {
    name: "Lumivyre",
    description:
      "A moth-like creature who senses the intentions of those around it.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/LumivyreBattleEnemy.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["mesmerizingGaze", "recoverPulse", "paralyzingDust"],
  },
  ee004: {
    name: "Ghobun",
    description:
      "A moth-like creature who senses the intentions of those around it.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/GhobunBattleEnemy.png",
    mutatedSrc: "./images/characters/evolisks/GloomareBattleTamed.png",
    icon: "./images/icons/Shadow.png",
    actions: ["phantomCharge", "recoverPulse", "shroudStep"],
  },
  ee005: {
    name: "Juzafrigi",
    description:
      "You're not entirely sure if this is an Evolisk or a fridge. But it does seem to have sentient thoughts, somehow.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/JuzafrigiBattleEnemy.png",
    mutatedSrc: "./images/characters/evolisks/FrigestBattleTamed.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["naturesGrasp", "recoverPulse", "mesmerizingGaze"],
  },
  ee006: {
    name: "Jydistorm",
    description:
      "This Evolisk resembles a jellyfish, using its electric tentacles to swiftly knock out its opponents.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/JydistormBattleEnemy.png",
    icon: "./images/icons/Mythic.png",
    actions: ["mesmerizingGaze", "paralyzingDust", "thunderJolt"],
  },
  ee007: {
    name: "Leaflin",
    description:
      "While this may just look like a pile of leaves, it's actually an Evolisk! It uses fallen leaves and sticks it finds to disguise its weak and frail body.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/LeaflinBattleEnemy.png",
    mutatedSrc: "./images/characters/evolisks/FlorambleBattleTamed.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["grandRenewal", "naturesGrasp", "galeBurst"],
  },
  ee008: {
    name: "Nimbz",
    description:
      "This angry storm cloud is not to be messed with, but it can be quite cute when tamed! It is known to shoot lightning at those it dislikes.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/NimbzBattleEnemy.png",
    mutatedSrc: "./images/characters/evolisks/KingStratusBattleTamed.png",
    icon: "./images/icons/Mythic.png",
    actions: ["thunderJolt", "windCutter", "galeBurst"],
  },

  // player evolisks
  ep001: {
    name: "Luxigon",
    description: "A dark but loyal Evolisk.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/LuxigonBattleTamed.png",
    icon: "./images/icons/Shadow.png",
    actions: ["phantomCharge", "voidHowl", "starShatter"],
  },
  ep002: {
    name: "Umbraik",
    description: "A slightly unsettling Evolisk.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/UmbraikBattleTamed.png",
    icon: "./images/icons/Mythic.png",
    actions: ["astralCoil", "ghostFang", "paralyzingSpit"],
  },
  ep003: {
    name: "Lumivyre",
    description:
      "A moth-like creature who senses the intentions of those around it.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/LumivyreBattleTamed.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["mesmerizingGaze", "recoverPulse", "paralyzingDust"],
  },
  ep004: {
    name: "Ghobun",
    description: "A friendly spirit from the shadow realm.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/GhobunBattleTamed.png",
    mutatedSrc: "./images/characters/evolisks/GloomareBattleTamed.png",
    icon: "./images/icons/Shadow.png",
    actions: ["phantomCharge", "recoverPulse", "shroudStep"],
  },
  ep005: {
    name: "Juzafrigi",
    description:
      "You're not entirely sure if this is an Evolisk or a fridge. But it does seem to have sentient thoughts, somehow.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/JuzafrigiBattleTamed.png",
    mutatedSrc: "./images/characters/evolisks/FrigestBattleTamed.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["mesmerizingGaze", "recoverPulse", "naturesGraso"],
  },
  ep006: {
    name: "Jydistorm",
    description:
      "This Evolisk resembles a jellyfish, using its electric tentacles to swiftly knock out its opponents.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/JydistormBattleTamed.png",
    icon: "./images/icons/Mythic.png",
    actions: ["mesmerizingGaze", "paralyzingDust", "thunderJolt"],
  },
  ep007: {
    name: "Leaflin",
    description:
      "While this may just look like a pile of leaves, it's actually an Evolisk! It uses fallen leaves and sticks it finds to disguise its weak and frail body.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/LeaflinBattleTamed.png",
    mutatedSrc: "./images/characters/evolisks/FlorambleBattleTamed.png",
    icon: "./images/icons/Naturalist.png",
    actions: ["grandRenewal", "naturesGrasp", "galeBurst"],
  },
  ep008: {
    name: "Nimbz",
    description:
      "This angry storm cloud is not to be messed with, but it can be quite cute when tamed! It is known to shoot lightning at those it dislikes.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/NimbzBattleTamed.png",
    mutatedSrc: "./images/characters/evolisks/KingStratusBattleTamed.png",
    icon: "./images/icons/Mythic.png",
    actions: ["thunderJolt", "windCutter", "galeBurst"],
  },
};

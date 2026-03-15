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
    description:
      "One of the most sought-after Evolisks, known for its loyalty and mythic powers.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/luxigon-enemy.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["phantomCharge", "voidHowl", "starShatter"],
  },
  ee002: {
    name: "Umbraik",
    description:
      "This Evolisk uses its shadow abilities to strike fear into its opponents.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/umbraik-enemy.png",
    icon: "./images/icons/shadow-type.png",
    actions: ["astralCoil", "ghostFang", "paralyzingSpit"],
  },
  ee003: {
    name: "Lumivyre",
    description:
      "A moth-like Evolisk who senses the intentions of those around it.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/lumivyre-enemy.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["mesmerizingGaze", "recoverPulse", "paralyzingDust"],
  },
  ee004: {
    name: "Ghobun",
    description:
      "A friendly Evolisk from the shadow realm with a mischievous nature.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/ghobun-enemy.png",
    mutatedSrc: "./images/characters/evolisks/gloomare-enemy.png",
    icon: "./images/icons/shadow-type.png",
    actions: ["phantomCharge", "recoverPulse", "shroudStep"],
  },
  ee005: {
    name: "Juzafrigi",
    description:
      "You're not entirely sure if this is an Evolisk or a fridge. It does seem to have sentient thoughts, somehow.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/juzafrigi-enemy.png",
    mutatedSrc: "./images/characters/evolisks/frigest-enemy.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["naturesGrasp", "recoverPulse", "mesmerizingGaze"],
  },
  ee006: {
    name: "Jydistorm",
    description:
      "This Evolisk resembles a jellyfish, using its electric tentacles to swiftly knock out its opponents.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/jydistorm-enemy.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["mesmerizingGaze", "paralyzingDust", "thunderJolt"],
  },
  ee007: {
    name: "Leaflin",
    description:
      "While this may just look like a pile of leaves, it's actually an Evolisk! It uses foliage to protect itself.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/leaflin-enemy.png",
    mutatedSrc: "./images/characters/evolisks/floramble-enemy.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["grandRenewal", "naturesGrasp", "galeBurst"],
  },
  ee008: {
    name: "Nimbz",
    description:
      "This moody Evolisk is not to be messed with! It is known to shoot lightning at those it dislikes.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/nimbz-enemy.png",
    mutatedSrc: "./images/characters/evolisks/king-stratus-enemy.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["thunderJolt", "windCutter", "galeBurst"],
  },

  // player evolisks
  ep001: {
    name: "Luxigon",
    description:
      "One of the most sought-after Evolisks, known for its loyalty and mythic powers.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/luxigon-tamed.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["phantomCharge", "voidHowl", "starShatter"],
  },
  ep002: {
    name: "Umbraik",
    description:
      "This Evolisk uses its shadow abilities to strike fear into its opponents.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/umbraik-tamed.png",
    icon: "./images/icons/shadow-type.png",
    actions: ["astralCoil", "ghostFang", "paralyzingSpit"],
  },
  ep003: {
    name: "Lumivyre",
    description:
      "A moth-like Evolisk who senses the intentions of those around it.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/lumivyre-tamed.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["mesmerizingGaze", "recoverPulse", "paralyzingDust"],
  },
  ep004: {
    name: "Ghobun",
    description:
      "A friendly Evolisk from the shadow realm with a mischievous nature.",
    type: EvoliskTypes.shadow,
    src: "./images/characters/evolisks/ghobun-tamed.png",
    mutatedSrc: "./images/characters/evolisks/gloomare-tamed.png",
    icon: "./images/icons/shadow-type.png",
    actions: ["phantomCharge", "recoverPulse", "shroudStep"],
  },
  ep005: {
    name: "Juzafrigi",
    description:
      "You're not entirely sure if this is an Evolisk or a fridge. It does seem to have sentient thoughts, somehow.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/juzafrigi-tamed.png",
    mutatedSrc: "./images/characters/evolisks/frigest-tamed.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["naturesGrasp", "recoverPulse", "mesmerizingGaze"],
  },
  ep006: {
    name: "Jydistorm",
    description:
      "This Evolisk resembles a jellyfish, using its electric tentacles to swiftly knock out its opponents.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/jydistorm-tamed.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["mesmerizingGaze", "paralyzingDust", "thunderJolt"],
  },
  ep007: {
    name: "Leaflin",
    description:
      "While this may just look like a pile of leaves, it's actually an Evolisk! It uses foliage to protect itself.",
    type: EvoliskTypes.naturalist,
    src: "./images/characters/evolisks/leaflin-tamed.png",
    mutatedSrc: "./images/characters/evolisks/floramble-tamed.png",
    icon: "./images/icons/naturalist-type.png",
    actions: ["grandRenewal", "naturesGrasp", "galeBurst"],
  },
  ep008: {
    name: "Nimbz",
    description:
      "This moody Evolisk is not to be messed with! It is known to shoot lightning at those it dislikes.",
    type: EvoliskTypes.mythic,
    src: "./images/characters/evolisks/nimbz-tamed.png",
    mutatedSrc: "./images/characters/evolisks/king-stratus-tamed.png",
    icon: "./images/icons/mythic-type.png",
    actions: ["thunderJolt", "windCutter", "galeBurst"],
  },
};

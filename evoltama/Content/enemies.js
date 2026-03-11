/*
  this file contains the enemies data for the game.
*/

window.Enemies = {
  Elder_Beetle: {
    name: "Elder Beetle",
    src: "./images/characters/people/Elder_Beetle.png",
    evolisks: {
      a: {
        evoliskId: "ee007",
        maxHp: 50,
        level: 1,
      },
    },
  },
  Froggert: {
    name: "Froggert",
    src: "./images/characters/people/Froggert_Enemy.png",
    evolisks: {
      a: {
        evoliskId: "ee001",
        maxHp: 50,
        level: 2,
      },
      b: {
        evoliskId: "ee002",
        maxHp: 50,
        level: 2,
      },
    },
  },
  Squishy: {
    name: "Squishy",
    src: "./images/characters/people/Squelchy_NPC_3.png",
    evolisks: {
      a: {
        evoliskId: "ee008",
        maxHp: 50,
        level: 2,
      },
    },
  },
  Hoppins: {
    name: "Hoppins",
    src: "./images/characters/people/Froggert_Enemy_3.png",
    evolisks: {
      a: {
        evoliskId: "ee005",
        maxHp: 30,
        level: 3,
      },
      b: {
        evoliskId: "ee003",
        maxHp: 50,
        level: 3,
      },
    },
  },
  Kiera: {
    name: "Kiera",
    src: "./images/characters/people/Kiera_Final_Boss.png",
    evolisks: {
      a: {
        evoliskId: "ee004",
        maxHp: 60,
        level: 4,
        isMutated: true,
        mutatedSrc: "./images/characters/evolisks/GloomareBattleEnemy.png",
      },
      b: {
        evoliskId: "ee008",
        maxHp: 60,
        level: 4,
        isMutated: true,
        mutatedSrc: "./images/characters/evolisks/KingStratusBattleEnemy.png",
      },
      c: {
        evoliskId: "ee001",
        maxHp: 60,
        level: 5,
      },
    },
  },
};

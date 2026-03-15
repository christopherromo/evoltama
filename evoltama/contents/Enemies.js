/*
  this file contains the enemies data for the game.
*/

window.Enemies = {
  elderBeetle: {
    name: "Elder Beetle",
    src: "./images/characters/people/elder-beetle.png",
    evolisks: {
      a: {
        evoliskId: "ee007",
        maxHp: 40,
        level: 1,
      },
    },
  },
  Squishy: {
    name: "Squishy",
    src: "./images/characters/people/squelchy-squishy.png",
    evolisks: {
      a: {
        evoliskId: "ee003",
        maxHp: 45,
        level: 2,
      },
      b: {
        evoliskId: "ee006",
        maxHp: 50,
        level: 2,
      }
    },
  },
  Hoppins: {
    name: "Hoppins",
    src: "./images/characters/people/froggert-hoppins.png",
    evolisks: {
      a: {
        evoliskId: "ee005",
        maxHp: 55,
        level: 3,
      },
      b: {
        evoliskId: "ee008",
        maxHp: 60,
        level: 3,
        isMutated: true,
        mutatedSrc: "./images/characters/evolisks/king-stratus-enemy.png",
      },
    },
  },
  Kiera: {
    name: "Kiera",
    src: "./images/characters/people/kiera.png",
    evolisks: {
      a: {
        evoliskId: "ee004",
        maxHp: 65,
        level: 4,
        isMutated: true,
        mutatedSrc: "./images/characters/evolisks/gloomare-enemy.png",
      },
      b: {
        evoliskId: "ee002",
        maxHp: 70,
        level: 4,
      },
      c: {
        evoliskId: "ee001",
        maxHp: 75,
        level: 4,
      },
    },
  },
};

/*
  this file contains the OverworldMap class, which is used to manage the overworld map in the game.
*/

const wallAt = (x, y) => ({
  [utils.asGridCoord(x, y)]: true,
});

const wallLine = (x1, y1, x2, y2) => {
  const walls = {};
  const xStep = x1 === x2 ? 0 : x1 < x2 ? 1 : -1;
  const yStep = y1 === y2 ? 0 : y1 < y2 ? 1 : -1;

  let x = x1;
  let y = y1;

  while (true) {
    walls[utils.asGridCoord(x, y)] = true;

    if (x === x2 && y === y2) {
      break;
    }

    x += xStep;
    y += yStep;
  }

  return walls;
};

const buildWalls = (...groups) => Object.assign({}, ...groups);

class OverworldMap {
  constructor(config) {
    // set up the map and objects
    this.overworld = null;
    this.gameObjects = {}; // live objects are in here
    this.configObjects = config.configObjects; // configuration content
    this.wildEncounterAreas = config.wildEncounterAreas || []; // encounter tiles
    this.wildEncounterChance = config.wildEncounterChance;
    this.wildEncounterConfig = config.wildEncounterConfig || null;
    this.healingSpot = config.healingSpot;

    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    // load the images
    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;
    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;
    this.battleBackgroundSrc = config.battleBackgroundSrc;

    // determine if a cutscene is playing
    this.isCutscenePlaying = false;
    this.isPaused = false;
  }

  // draw the lower half of the map
  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y,
    );
  }

  // draw the upper half of the map
  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(10.5) - cameraPerson.x,
      utils.withGrid(6) - cameraPerson.y,
    );
  }

  // collision detection
  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    if (this.walls[`${x},${y}`]) {
      return true;
    }

    // check for game objects at this position
    return Object.values(this.gameObjects).find((obj) => {
      if (obj.x === x && obj.y === y) {
        return true;
      }
      if (
        obj.intentPosition &&
        obj.intentPosition[0] === x &&
        obj.intentPosition[1] === y
      ) {
        return true;
      }
      return false;
    });
  }

  mountObjects() {
    Object.keys(this.configObjects).forEach((key) => {
      let object = this.getObjectConfig(key);
      object.id = key;

      let instance;
      if (object.type === "Person") {
        instance = new Person(object);
      }

      if (object.type === "EvoliskStone") {
        instance = new EvoliskStone(object);
      }

      this.gameObjects[key] = instance;
      this.gameObjects[key].id = key;
      instance.mount(this);
    });
  }

  getObjectConfig(key) {
    const object = { ...this.configObjects[key] };
    const storyFlagPosition = object.storyFlagPosition;
    const storyFlagBehaviorLoop = object.storyFlagBehaviorLoop;

    if (storyFlagPosition && playerState.storyFlags[storyFlagPosition.flag]) {
      object.x = utils.withGrid(storyFlagPosition.x);
      object.y = utils.withGrid(storyFlagPosition.y);
      object.direction = storyFlagPosition.direction || object.direction;
    }

    if (
      storyFlagBehaviorLoop &&
      playerState.storyFlags[storyFlagBehaviorLoop.flag]
    ) {
      object.behaviorLoop = storyFlagBehaviorLoop.behaviorLoop;
    }

    return object;
  }

  // puts the game into "cutscene mode"
  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      });
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE" || result === "RAN_BATTLE") {
        break;
      }
    }

    this.isCutscenePlaying = false;

    // reset npcs to do their idle behavior
    Object.values(this.gameObjects).forEach((object) =>
      object.doBehaviorEvent(this),
    );
  }

  // checks for objects that can trigger a cutscene
  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find((object) => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`;
    });

    if (!this.isCutscenePlaying && match && match.talking.length) {
      const relevantScenario = match.talking.find((scenario) => {
        return (scenario.required || []).every((sf) => {
          return playerState.storyFlags[sf];
        });
      });

      relevantScenario && this.startCutscene(relevantScenario.events);
    }
  }

  // checks for player's position to trigger a cutscene
  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events);
    }
  }

  teleportToHealingArea() {
    const healingSpot = this.healingSpot || {
      x: 5,
      y: 5,
      message: "You feel mysteriously refreshed.",
      heal: "full",
    };

    if (!this.gameObjects["hero"]) {
      return;
    }

    const hero = this.gameObjects["hero"];
    const wasCutscenePlaying = this.isCutscenePlaying;
    this.isCutscenePlaying = true;

    hero.x = healingSpot.x * 16;
    hero.y = healingSpot.y * 16;
    hero.movingProgressRemaining = 0;
    hero.intentPosition = null;

    const healingMessage = new TextMessage({
      text: healingSpot.message,
      onComplete: () => {
        this.healPlayerEvolisks(healingSpot.heal);
        this.isCutscenePlaying = wasCutscenePlaying;
      },
    });

    healingMessage.init(document.querySelector(".game-container"));
  }

  healPlayerEvolisks(healType) {
    const playerState = window.playerState;

    if (healType === "full") {
      Object.values(playerState.evolisks).forEach((evolisk) => {
        evolisk.hp = evolisk.maxHp;
        evolisk.status = null;
      });
    } else if (healType === "partial") {
      Object.values(playerState.evolisks).forEach((evolisk) => {
        evolisk.hp = Math.floor(evolisk.maxHp / 2);
      });
    }

    utils.emitEvent("PlayerStateUpdated");
  }
}

// collection of overworld maps
window.OverworldMaps = {
  ForestVillage: {
    id: "ForestVillage",
    lowerSrc: "./images/maps/forest-lower.png",
    upperSrc: "./images/maps/forest-upper.png",
    battleBackgroundSrc: "./images/maps/forest-battle.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(23),
        y: utils.withGrid(30),
      },
      elderBeetle: {
        type: "Person",
        x: utils.withGrid(40),
        y: utils.withGrid(26),
        src: "./images/characters/people/elder-beetle.png",
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Marvelous! You have saved the world!",
                faceHero: "elderBeetle",
              },
              {
                type: "textMessage",
                text: "I knew you could do it, thank you Kairo!",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "I think you are ready, head to observatory north of the village!",
                faceHero: "elderBeetle",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Be careful, the canyon is very dangerous!",
                faceHero: "elderBeetle",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["FOREST_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Head to the land of mushrooms!",
                faceHero: "elderBeetle",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["FIRST_EVOLISK_STONE"],
            events: [
              {
                type: "textMessage",
                text: "You found the Evolisk Stone!",
                faceHero: "elderBeetle",
              },
              {
                type: "textMessage",
                text: "Before I send you out into the world, I must make sure you are ready.",
              },
              {
                type: "textMessage",
                text: "Let's battle!",
              },
              { type: "battle", enemyId: "elderBeetle" },
              { type: "addStoryFlag", flag: "FOREST_COMPLETE" },
              {
                type: "textMessage",
                text: "You did great!",
                faceHero: "elderBeetle",
              },
              {
                type: "textMessage",
                text: "You must build strong bonds with your Evolisks.",
              },
              {
                type: "textMessage",
                text: "Your party can be rearranged in the Pause Menu.",
              },
              {
                type: "textMessage",
                text: "You may have noticed I've given you some capture discs and potions, use them wisely.",
              },
              {
                type: "textMessage",
                text: "To the south of the village is the land of mushrooms.",
              },
              {
                type: "textMessage",
                text: "Head there first to build your strength!",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["INTRO_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "You can find the Evolisk Stone in my house.",
                faceHero: "elderBeetle",
              },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Hello Kairo! It's great to see you!",
                faceHero: "elderBeetle",
              },
              {
                type: "textMessage",
                text: "I would like to tell you that all is well, but I'm afraid something is very wrong...",
              },
              {
                type: "textMessage",
                text: "Over the past few days, many Evolisks have gone missing, and so has Kiera.",
              },
              {
                type: "textMessage",
                text: "There is powerful energy emanating from the old observatory, I believe that's where they are.",
              },
              {
                type: "textMessage",
                text: "All of our townspeople are afraid, except for you, Kairo. You must help us!",
              },
              {
                type: "textMessage",
                text: "But you will not be enough on your own. You're going to need a partner!",
              },
              {
                type: "textMessage",
                text: "I will allow you to have one of my Evolisks.",
              },
              {
                type: "textMessage",
                text: "In my house, there is an Evolisk Stone. You may choose one of two discs.",
              },
              {
                type: "textMessage",
                text: "Once you've chosen your new partner, return here to me.",
              },
              { type: "addStoryFlag", flag: "INTRO_COMPLETE" },
              { who: "elderBeetle", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      beetleGuard1: {
        type: "Person",
        x: utils.withGrid(53),
        y: utils.withGrid(55),
        storyFlagPosition: {
          flag: "BEETLE_GUARD_1_MOVED",
          x: 52,
          y: 56,
          direction: "down",
        },
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["BEETLE_GUARD_1_MOVED"],
            events: [
              {
                type: "textMessage",
                text: "Right this way, Kairo!",
                faceHero: "beetleGuard1",
              },
              { who: "beetleGuard1", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["FOREST_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Good luck out there, Kairo!",
                faceHero: "beetleGuard1",
              },
              { who: "beetleGuard1", type: "walk", direction: "down" },
              { who: "beetleGuard1", type: "walk", direction: "left" },
              { who: "beetleGuard1", type: "stand", direction: "down" },
              { type: "addStoryFlag", flag: "BEETLE_GUARD_1_MOVED" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Sorry, I can't let you through without the Elder Beetle's permission!",
                faceHero: "beetleGuard1",
              },
              { who: "beetleGuard1", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      beetleGuard2: {
        type: "Person",
        x: utils.withGrid(69),
        y: utils.withGrid(42),
        storyFlagPosition: {
          flag: "BEETLE_GUARD_2_MOVED",
          x: 70,
          y: 41,
          direction: "down",
        },
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["BEETLE_GUARD_2_MOVED"],
            events: [
              {
                type: "textMessage",
                text: "Come on through, Kairo!",
                faceHero: "beetleGuard2",
              },
              { who: "beetleGuard2", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Squishy sent you?",
                faceHero: "beetleGuard2",
              },
              {
                type: "textMessage",
                text: "Alright, you may enter the canyon.",
              },
              {
                type: "textMessage",
                text: "But beware, there are many wild Evolisks!",
              },
              { who: "beetleGuard2", type: "walk", direction: "right" },
              { who: "beetleGuard2", type: "walk", direction: "up" },
              { who: "beetleGuard2", type: "stand", direction: "down" },
              { type: "addStoryFlag", flag: "BEETLE_GUARD_2_MOVED" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Sorry, the canyon is a very dangerous place!",
                faceHero: "beetleGuard2",
              },
              { who: "beetleGuard2", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      beetleGuard3: {
        type: "Person",
        x: utils.withGrid(47),
        y: utils.withGrid(10),
        storyFlagPosition: {
          flag: "BEETLE_GUARD_3_MOVED",
          x: 48,
          y: 9,
          direction: "down",
        },
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["BEETLE_GUARD_3_MOVED"],
            events: [
              {
                type: "textMessage",
                text: "This way, Kairo!",
                faceHero: "beetleGuard3",
              },
              { who: "beetleGuard3", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "You defeated Hoppins? You must be ready!",
                faceHero: "beetleGuard3",
              },
              {
                type: "textMessage",
                text: "Head to the observatory and save us!",
                faceHero: "beetleGuard3",
              },
              { who: "beetleGuard3", type: "walk", direction: "up" },
              { who: "beetleGuard3", type: "walk", direction: "right" },
              { who: "beetleGuard3", type: "stand", direction: "down" },
              { type: "addStoryFlag", flag: "BEETLE_GUARD_3_MOVED" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I can't let you go to the observatory yet, you'll get destroyed!",
                faceHero: "beetleGuard3",
              },
              { who: "beetleGuard3", type: "stand", direction: "down" },
            ],
          },
        ],
      },
    },

    walls: buildWalls(
      // rocks
      wallAt(24, 33),
      wallAt(25, 33),
      wallAt(22, 37),

      // signs
      wallAt(26, 40),
      wallAt(51, 44),
      wallAt(58, 40),
      wallAt(45, 21),

      // trees
      wallAt(37, 25),
      wallAt(38, 25),
      wallAt(42, 27),
      wallAt(43, 27),

      // house 1
      wallLine(21, 24, 21, 27),
      wallLine(22, 24, 24, 24),
      wallLine(22, 27, 25, 27),
      wallLine(25, 24, 25, 26),

      // house 2
      wallLine(39, 34, 43, 34),
      wallLine(39, 37, 43, 37),
      wallLine(39, 35, 39, 36),
      wallLine(43, 35, 43, 36),

      // house 3
      wallLine(51, 34, 55, 34),
      wallLine(51, 37, 55, 37),
      wallLine(51, 35, 51, 36),
      wallLine(55, 35, 55, 36),

      // house 4
      wallLine(51, 22, 55, 22),
      wallLine(51, 25, 55, 25),
      wallLine(51, 23, 51, 24),
      wallLine(55, 23, 55, 24),

      // first area
      wallLine(16, 19, 16, 46),
      wallLine(17, 18, 29, 18),
      wallLine(30, 19, 30, 39),
      wallLine(17, 47, 29, 47),
      wallLine(30, 45, 32, 45),
      wallAt(31, 39),
      wallAt(32, 39),
      wallAt(30, 46),

      // main area
      wallLine(32, 19, 32, 38),
      wallAt(32, 46),
      wallLine(33, 18, 45, 18),
      wallLine(49, 18, 61, 18),
      wallLine(62, 19, 62, 39),
      wallLine(63, 39, 64, 39),
      wallLine(62, 45, 64, 45),
      wallAt(62, 46),
      wallLine(33, 47, 51, 47),
      wallLine(55, 47, 61, 47),

      // lower cube
      wallLine(51, 48, 51, 51),
      wallLine(49, 51, 50, 51),
      wallLine(55, 48, 55, 51),
      wallLine(56, 51, 57, 51),
      wallLine(48, 52, 48, 59),
      wallLine(58, 52, 58, 59),
      wallAt(53, 60),

      // right cube
      wallAt(64, 38),
      wallAt(64, 46),
      wallLine(65, 37, 73, 37),
      wallLine(65, 47, 73, 47),
      wallAt(75, 42),

      // upper cube
      wallLine(45, 14, 45, 17),
      wallLine(43, 14, 44, 14),
      wallLine(49, 14, 49, 17),
      wallLine(50, 14, 51, 14),
      wallLine(52, 7, 52, 13),
      wallLine(42, 7, 42, 13),
      wallLine(43, 6, 45, 6),
      wallLine(46, 4, 48, 4),
      wallLine(49, 6, 51, 6),
      wallAt(45, 5),
      wallAt(49, 5),

      // fences
      wallLine(43, 10, 46, 10),
      wallLine(48, 10, 51, 10),
      wallLine(49, 55, 52, 55),
      wallLine(54, 55, 57, 55),
      wallLine(69, 38, 69, 41),
      wallLine(69, 43, 69, 46),
    ),
    cutsceneSpaces: {
      // houses
      [utils.asGridCoord(23, 28)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "House1",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(53, 26)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "House2",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(41, 38)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "House3",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(53, 38)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "House4",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up",
            },
          ],
        },
      ],

      [utils.asGridCoord(57, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(56, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(55, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(54, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(53, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(52, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(51, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(50, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(49, 59)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "MushroomWild",
              x: utils.withGrid(18),
              y: utils.withGrid(1),
              direction: "down",
            },
          ],
        },
      ],

      [utils.asGridCoord(74, 38)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 39)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 40)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 41)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 42)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 43)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 44)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 45)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(74, 46)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "CanyonWild",
              x: utils.withGrid(1),
              y: utils.withGrid(9),
              direction: "right",
            },
          ],
        },
      ],
      [utils.asGridCoord(46, 5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(28),
              y: utils.withGrid(56),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(47, 5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(29),
              y: utils.withGrid(56),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(48, 5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(30),
              y: utils.withGrid(56),
              direction: "up",
            },
          ],
        },
      ],
    },
    healingSpot: {
      x: 40,
      y: 27,
      message: "It's okay, Kairo! Try again when you feel ready!",
      heal: "full",
    },
  },

  House1: {
    id: "House1",
    lowerSrc: "./images/maps/house-1-lower.png",
    upperSrc: "./images/maps/house-1-upper.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(10),
      },
    },
    walls: buildWalls(
      // tv
      wallAt(7, 9),

      // table
      wallLine(2, 7, 4, 7),
      wallLine(2, 8, 4, 8),

      // couch
      wallLine(6, 7, 8, 7),

      // kitchen
      wallLine(2, 3, 2, 5),
      wallLine(4, 3, 4, 5),
      wallLine(5, 4, 5, 5),

      // bed
      wallLine(6, 3, 8, 3),
      wallAt(7, 4),

      // room shell
      wallLine(2, 10, 4, 10),
      wallLine(6, 10, 8, 10),
      wallAt(5, 11),
      wallLine(9, 3, 9, 9),
      wallLine(2, 2, 8, 2),
      wallLine(1, 3, 1, 9),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(5, 10)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(23),
              y: utils.withGrid(28),
              direction: "down",
            },
          ],
        },
      ],
    },
  },

  House2: {
    id: "House2",
    lowerSrc: "./images/maps/house-2-lower.png",
    upperSrc: "./images/maps/house-2-upper.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(10),
      },
      evoliskStone: {
        type: "EvoliskStone",
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        storyFlag: "FIRST_EVOLISK_STONE",
        evolisks: ["ep003", "ep008"],
        rewardConfig: {
          ep003: {
            baseMaxHp: 40,
            hp: 40,
            maxHp: 40,
            level: 1,
            xp: 0,
            maxXp: 100,
          },
          ep008: {
            baseMaxHp: 40,
            hp: 40,
            maxHp: 40,
            level: 1,
            xp: 0,
            maxXp: 100,
          },
        },
      },
    },
    walls: buildWalls(
      // table
      wallLine(2, 7, 4, 7),
      wallLine(2, 8, 4, 8),

      // couch
      wallLine(6, 7, 8, 7),

      // kitchen
      wallLine(2, 3, 2, 5),
      wallLine(4, 3, 4, 5),
      wallLine(5, 4, 5, 5),

      // bed
      wallLine(6, 3, 8, 3),
      wallAt(7, 4),

      // room shell
      wallLine(2, 10, 4, 10),
      wallLine(6, 10, 8, 10),
      wallAt(5, 11),
      wallLine(9, 3, 9, 9),
      wallLine(2, 2, 8, 2),
      wallLine(1, 3, 1, 9),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(5, 10)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(53),
              y: utils.withGrid(26),
              direction: "down",
            },
          ],
        },
      ],
    },
  },

  House3: {
    id: "House3",
    lowerSrc: "./images/maps/house-3-lower.png",
    upperSrc: "./images/maps/house-3-upper.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(10),
      },
      pawpaw: {
        type: "Person",
        x: utils.withGrid(7),
        y: utils.withGrid(4),
        src: "./images/characters/people/mr-beetle-pawpaw.png",
        behaviorLoop: [{ type: "stand", direction: "left", time: 1000 }],
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "You did it, you saved us!",
                faceHero: "pawpaw",
              },
              {
                type: "textMessage",
                text: "Now I can see Coriander again!",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I am so scared, I am not leaving my house anymore!",
                faceHero: "pawpaw",
              },
              {
                type: "textMessage",
                text: "How will I see Coriander again?!",
              },
            ],
          },
        ],
      },
    },
    walls: buildWalls(
      // tv
      wallAt(3, 9),

      // table
      wallLine(6, 7, 8, 7),
      wallLine(6, 8, 8, 8),

      // couch
      wallLine(2, 7, 4, 7),

      // kitchen
      wallLine(8, 3, 8, 5),
      wallLine(6, 3, 6, 5),
      wallLine(5, 4, 5, 5),

      // bed
      wallLine(2, 3, 4, 3),
      wallAt(3, 4),

      // room shell
      wallLine(2, 10, 4, 10),
      wallLine(6, 10, 8, 10),
      wallAt(5, 11),
      wallLine(9, 3, 9, 9),
      wallLine(2, 2, 8, 2),
      wallLine(1, 3, 1, 9),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(5, 10)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(41),
              y: utils.withGrid(38),
              direction: "down",
            },
          ],
        },
      ],
    },
  },
  House4: {
    id: "House4",
    lowerSrc: "./images/maps/house-4-lower.png",
    upperSrc: "./images/maps/house-4-upper.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(10),
      },

      coriander: {
        type: "Person",
        x: utils.withGrid(3),
        y: utils.withGrid(8),
        src: "./images/characters/people/mr-beetle-coriander.png",
        behaviorLoop: [{ type: "stand", direction: "down", time: 1000 }],
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "I can go outside again, thank you!",
                faceHero: "coriander",
              },
              {
                type: "textMessage",
                text: "I'm going to go see Pawpaw now!",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I wonder if Pawpaw is okay... I hope he is safe in his house.",
                faceHero: "coriander",
              },
            ],
          },
        ],
      },
    },
    walls: buildWalls(
      // tv
      wallAt(3, 9),

      // table
      wallLine(6, 7, 8, 7),
      wallLine(6, 8, 8, 8),

      // couch
      wallLine(2, 7, 4, 7),

      // kitchen
      wallLine(8, 3, 8, 5),
      wallLine(6, 3, 6, 5),
      wallLine(5, 4, 5, 5),

      // bed
      wallLine(2, 3, 4, 3),
      wallAt(3, 4),

      // room shell
      wallLine(2, 10, 4, 10),
      wallLine(6, 10, 8, 10),
      wallAt(5, 11),
      wallLine(9, 3, 9, 9),
      wallLine(2, 2, 8, 2),
      wallLine(1, 3, 1, 9),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(5, 10)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(53),
              y: utils.withGrid(38),
              direction: "down",
            },
          ],
        },
      ],
    },
  },

  MushroomWild: {
    id: "MushroomWild",
    lowerSrc: "./images/maps/mushroom-lower.png",
    upperSrc: "./images/maps/mushroom-upper.png",
    battleBackgroundSrc: "./images/maps/mushroom-battle.png",
    gameObjects: {},

    // configure objects in map
    configObjects: {
      // create hero & npcs
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(18),
        y: utils.withGrid(1),
      },
      cherry: {
        type: "Person",
        x: utils.withGrid(19),
        y: utils.withGrid(3),
        src: "./images/characters/people/squelchy-cherry.png",
        talking: [
          {
            events: [
              {
                type: "textMessage",
                text: "Welcome to the land of mushrooms! My name is Cherry, I'm one of the squelchy sisters.",
                faceHero: "cherry",
              },
              {
                type: "textMessage",
                text: "Be careful around here, there are lots of wild Evolisks!",
              },
              {
                type: "textMessage",
                text: "Should you fail in battle, you'll start over there in the nursery.",
              },
              { who: "cherry", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      shelly: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(12),
        src: "./images/characters/people/squelchy-shelly.png",
        talking: [
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Wow, you showed those frogs who's boss!",
                faceHero: "shelly",
              },
              { who: "shelly", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Be careful at Froggerts' Hideout, those frogs can be vicious!",
                faceHero: "shelly",
              },
              { who: "shelly", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I'm Shelly, one of the squelchy sisters. We are the protectors of mushrooms.",
                faceHero: "shelly",
              },
              {
                type: "textMessage",
                text: "These days, there isn't much to protect the mushrooms from.",
              },
              {
                type: "textMessage",
                text: "There was once a time, however, when a pack of frogs ruled this land.",
              },
              {
                type: "textMessage",
                text: "They were hurting the mushrooms, so we chased them out!",
              },
              {
                type: "textMessage",
                text: "They now reside in a secret hideout.",
              },
              {
                type: "textMessage",
                text: "I personally wouldn't visit them, but I hear they have treasure.",
              },
              {
                type: "textMessage",
                text: "Our leader is the pink squelchy, her name is Squishy!",
              },
              {
                type: "textMessage",
                text: "If you defeat her in battle, perhaps she'll tell you where Froggerts' Hideout is.",
              },
              { who: "shelly", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      squishy: {
        type: "Person",
        x: utils.withGrid(4),
        y: utils.withGrid(8),
        src: "./images/characters/people/squelchy-squishy.png",
        talking: [
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "I knew you could do it!",
                faceHero: "squishy",
              },
              { who: "squishy", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Don't let those frogs bully you!",
                faceHero: "squishy",
              },
              { who: "squishy", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "So I guess you're here to test your strength?",
                faceHero: "squishy",
              },
              {
                type: "textMessage",
                text: "Let's see if you can hold your own!",
              },
              { type: "battle", enemyId: "Squishy" },
              { type: "addStoryFlag", flag: "MUSHROOM_COMPLETE" },
              { type: "addItem", actionId: "catchDisc", quantity: 3 },
              { type: "addItem", actionId: "item_recoverHp", quantity: 2 },
              { type: "addItem", actionId: "item_recoverStatus", quantity: 1 },
              {
                type: "textMessage",
                text: "Not bad!",
                faceHero: "squishy",
              },
              {
                type: "textMessage",
                text: "The real test of strength, however, would be defeating Hoppins.",
              },
              {
                type: "textMessage",
                text: "You can find him at Froggerts' Hideout, located in the canyon east of the forest.",
              },
              {
                type: "textMessage",
                text: "Tell the guard I sent you, he'll let you in.",
              },
              {
                type: "textMessage",
                text: "I've supplied you with some more potions and catch discs.",
              },
              {
                type: "textMessage",
                text: "Don't let those frogs bully you!",
              },
              { who: "squishy", type: "stand", direction: "down" },
            ],
          },
        ],
      },
    },
    // create walls
    walls: buildWalls(
      // mushrooms
      wallAt(16, 1),
      wallAt(20, 2),
      wallAt(13, 2),
      wallLine(11, 3, 13, 3),
      wallLine(11, 4, 12, 4),
      wallLine(21, 3, 23, 3),
      wallLine(22, 4, 23, 4),
      wallAt(23, 7),
      wallAt(6, 8),
      wallAt(8, 13),
      wallAt(10, 15),
      wallAt(18, 15),
      wallAt(23, 16),
      wallAt(19, 8),
      wallLine(16, 9, 18, 9),
      wallLine(16, 10, 17, 10),
      wallLine(19, 11, 21, 11),
      wallAt(20, 12),
      wallLine(3, 13, 5, 13),
      wallLine(4, 14, 5, 14),
      wallLine(13, 18, 15, 18),
      wallLine(13, 19, 14, 19),
      wallLine(5, 18, 6, 18),
      wallLine(5, 19, 6, 19),
      wallLine(22, 19, 23, 19),
      wallLine(22, 20, 23, 20),

      // rocks
      wallAt(3, 3),
      wallAt(3, 4),
      wallAt(4, 3),
      wallAt(4, 4),
      wallLine(11, 6, 12, 6),
      wallLine(19, 17, 20, 17),
      wallLine(19, 18, 20, 18),

      // border walls
      wallLine(0, 0, 0, 24),
      wallLine(1, 0, 25, 0),
      wallLine(0, 23, 26, 23),
      wallLine(25, 0, 25, 24),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(18, 1)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(53),
              y: utils.withGrid(59),
              direction: "up",
            },
          ],
        },
      ],
    },

    wildEncounterAreas: [
      // full encounter area from (1,1) to (24,22)
      { xMin: 1, xMax: 24, yMin: 1, yMax: 22 },

      // excluded area from (11,1) to (24,13)
      // this won't be a valid encounter area
      { xMin: 11, xMax: 24, yMin: 1, yMax: 13, exclude: true },
    ],
    wildEncounterConfig: {
      evoliskIds: ["ee003", "ee006", "ee007", "ee008"],
      minLevel: 1,
      maxLevel: 2,
    },
    wildEncounterChance: 0.1,

    healingSpot: {
      x: 23, // healing area x-coordinate
      y: 11, // healing area y-coordinate
      message: "You wake up in the mushroom nursery fully restored!",
      heal: "full", // healing type ("full" or "partial")
    },
  },

  CanyonWild: {
    id: "CanyonWild",
    lowerSrc: "./images/maps/canyon-lower.png",
    upperSrc: "./images/maps/canyon-upper.png",
    battleBackgroundSrc: "./images/maps/canyon-battle.png",
    gameObjects: {},
    configObjects: {
      // create hero & npcs & events
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(1),
        y: utils.withGrid(9),
      },
      evoliskStone: {
        type: "EvoliskStone",
        x: utils.withGrid(22),
        y: utils.withGrid(2),
        storyFlag: "SECOND_EVOLISK_STONE",
        evolisks: ["ep004", "ep006"],
        rewardConfig: {
          ep004: {
            baseMaxHp: 45,
            hp: 55,
            maxHp: 55,
            level: 3,
            xp: 0,
            maxXp: 100,
          },
          ep006: {
            baseMaxHp: 45,
            hp: 55,
            maxHp: 55,
            level: 3,
            xp: 0,
            maxXp: 100,
          },
        },
      },
      squeak: {
        type: "Person",
        x: utils.withGrid(15),
        y: utils.withGrid(7),
        src: "./images/characters/people/froggert-squeak.png",
        talking: [
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "You defeated Hoppins?! Don't expect me to call you boss now...",
                faceHero: "squeak",
              },
              { who: "squeak", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "What are you doing here?!",
                faceHero: "squeak",
              },
              {
                type: "textMessage",
                text: "I'd fight you right now if it weren't so hot...",
              },
              {
                type: "textMessage",
                text: "Name's Squeak.",
              },
              {
                type: "textMessage",
                text: "Secret treasure? Good luck, Pip's on watch duty.",
              },
              {
                type: "textMessage",
                text: "If I were you, I'd leave right now.",
              },
              {
                type: "textMessage",
                text: "You don't want to get on the boss's bad side.",
              },
              { who: "squeak", type: "stand", direction: "down" },
            ],
          },
        ],
      },
      pip: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(1),
        storyFlagPosition: {
          flag: "PIP_MOVED",
          x: 13,
          y: 2,
          direction: "down",
        },
        src: "./images/characters/people/froggert-pip.png",
        talking: [
          {
            required: ["PIP_MOVED"],
            events: [
              {
                type: "textMessage",
                text: "You didn't tell him... right?",
                faceHero: "pip",
              },
              { who: "pip", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "So you think you can invade our hideout and steal our treasure?",
                faceHero: "pip",
              },
              {
                type: "textMessage",
                text: "Not on my watch!",
              },
              { type: "battle", enemyId: "Pip" },
              {
                type: "textMessage",
                text: "Okay, okay, you win!",
                faceHero: "pip",
              },
              {
                type: "textMessage",
                text: "Let's keep this a secret from Hoppins, alright?",
              },
              { who: "pip", type: "walk", direction: "right" },
              { who: "pip", type: "walk", direction: "down" },
              { type: "addStoryFlag", flag: "PIP_MOVED" },
            ],
          },
        ],
      },
      hoppins: {
        type: "Person",
        x: utils.withGrid(20),
        y: utils.withGrid(18),
        src: "./images/characters/people/froggert-hoppins.png",
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Not bad, kid.",
                faceHero: "hoppins",
              },
              { who: "hoppins", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "What are you still doing here?!",
                faceHero: "hoppins",
              },
              { who: "hoppins", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Hey! You shouldn't be here!",
                faceHero: "hoppins",
              },
              { type: "battle", enemyId: "Hoppins" },
              { type: "addStoryFlag", flag: "CANYON_COMPLETE" },
              { type: "addItem", actionId: "catchDisc", quantity: 1 },
              { type: "addItem", actionId: "item_recoverHp", quantity: 2 },
              { type: "addItem", actionId: "item_recoverStatus", quantity: 2 },
              {
                type: "textMessage",
                text: "Can't believe I lost...",
                faceHero: "hoppins",
              },
              {
                type: "textMessage",
                text: "Not bad, kid.",
              },
              {
                type: "textMessage",
                text: "Maybe you could do something about that person up at the observatory...",
              },
              {
                type: "textMessage",
                text: "Tell the guard you defeated me, he'll know you're tough stuff.",
              },
              {
                type: "textMessage",
                text: "I've given you a bit of treasure, don't waste it all in one place.",
              },
              {
                type: "textMessage",
                text: "Go on, save us all!",
              },
              { who: "hoppins", type: "stand", direction: "down" },
            ],
          },
        ],
      },
    },
    // walls & objects
    walls: buildWalls(
      // border walls
      wallLine(0, 0, 0, 22),
      wallLine(1, 0, 24, 0),
      wallLine(25, 0, 25, 22),
      wallLine(1, 23, 24, 23),

      // river
      wallLine(1, 5, 3, 5),
      wallAt(3, 6),
      wallLine(4, 6, 5, 6),
      wallAt(5, 7),
      wallAt(6, 7),
      wallAt(6, 8),
      wallLine(6, 10, 6, 13),
      wallLine(7, 13, 17, 13),
      wallLine(19, 13, 24, 13),

      // skull
      wallLine(8, 10, 8, 12),

      // bushes
      wallAt(3, 8),
      wallAt(4, 11),
      wallAt(10, 7),
      wallAt(13, 11),
      wallAt(21, 11),
      wallAt(5, 2),
      wallAt(12, 2),
      wallAt(23, 7),
      wallAt(23, 6),
      wallAt(21, 19),
      wallAt(21, 20),
      wallAt(9, 15),
      wallAt(9, 16),
      wallAt(5, 19),
      wallAt(5, 20),

      // canyon walls
      wallLine(1, 3, 3, 3),
      wallLine(4, 4, 6, 4),
      wallAt(7, 5),
      wallLine(9, 5, 12, 5),
      wallLine(13, 4, 17, 4),
      wallLine(18, 3, 20, 3),
      wallLine(21, 4, 22, 4),
      wallLine(23, 3, 24, 3),

      // rocks
      wallAt(2, 11),
      wallAt(10, 9),
      wallAt(13, 3),
      wallAt(20, 2),
      wallAt(16, 11),
      wallAt(19, 7),
      wallAt(15, 16),
      wallAt(6, 16),

      // trees
      wallAt(13, 9),
      wallAt(21, 17),
      wallAt(12, 19),
      wallAt(12, 20),
      wallAt(3, 1),
      wallAt(3, 2),
    ),

    cutsceneSpaces: {
      [utils.asGridCoord(1, 9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(74),
              y: utils.withGrid(42),
              direction: "left",
            },
          ],
        },
      ],
    },

    wildEncounterAreas: [
      // keep the entry corridor safe so the map transition can finish cleanly
      { xMin: 1, xMax: 4, yMin: 8, yMax: 10, exclude: true },

      // excluded area (around froggert at 7,6)
      { xMin: 5, xMax: 9, yMin: 4, yMax: 8, exclude: true },

      // full encounter zone (whole map)
      { xMin: 1, xMax: 24, yMin: 1, yMax: 22 },
    ],
    wildEncounterConfig: {
      evoliskIds: [
        "ee001",
        "ee002",
        "ee003",
        "ee004",
        "ee005",
        "ee006",
        "ee007",
        "ee008",
      ],
      minLevel: 3,
      maxLevel: 4,
    },
    wildEncounterChance: 0.07,

    healingSpot: {
      x: 8, // healing area x-coordinate
      y: 18, // healing area y-coordinate
      message: "The healing winds of the canyon restore you!",
      heal: "full", // healing type ("full" or "partial")
    },
  },

  ObservatoryExterior: {
    id: "ObservatoryExterior",
    lowerSrc: "./images/maps/observatory-exterior-lower.png",
    upperSrc: "./images/maps/observatory-exterior-upper.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(29),
        y: utils.withGrid(56),
      },
    },
    walls: buildWalls(
      // back wall
      wallLine(28, 57, 30, 57),

      // left wall
      wallLine(27, 49, 27, 56),
      wallLine(22, 49, 26, 49),
      wallLine(21, 40, 21, 48),
      wallLine(22, 39, 27, 39),
      wallLine(27, 33, 27, 38),
      wallLine(20, 33, 26, 33),
      wallLine(19, 28, 19, 32),

      // upper wall
      wallLine(20, 27, 27, 27),
      wallLine(31, 27, 38, 27),
      wallLine(28, 26, 30, 26),

      // right wall
      wallLine(39, 28, 39, 32),
      wallLine(31, 33, 38, 33),
      wallLine(31, 34, 31, 39),
      wallLine(32, 39, 36, 39),
      wallLine(37, 40, 37, 48),
      wallLine(31, 49, 36, 49),
      wallLine(31, 50, 31, 57),

      // diagonal corners
      wallAt(21, 48),
      wallAt(19, 32),
      wallAt(28, 26),
      wallAt(30, 26),
      wallAt(38, 33),
      wallAt(37, 40),

      // well
      wallLine(25, 45, 33, 45),
      wallLine(25, 43, 33, 43),
      wallAt(25, 44),
      wallAt(33, 44),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(28, 56)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(46),
              y: utils.withGrid(5),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(29, 56)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(47),
              y: utils.withGrid(5),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(30, 56)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ForestVillage",
              x: utils.withGrid(48),
              y: utils.withGrid(5),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(28, 27)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryInterior",
              x: utils.withGrid(31),
              y: utils.withGrid(55),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(29, 27)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryInterior",
              x: utils.withGrid(32),
              y: utils.withGrid(55),
              direction: "up",
            },
          ],
        },
      ],
      [utils.asGridCoord(30, 27)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryInterior",
              x: utils.withGrid(33),
              y: utils.withGrid(55),
              direction: "up",
            },
          ],
        },
      ],
    },
  },

  ObservatoryInterior: {
    id: "ObservatoryInterior",
    lowerSrc: "./images/maps/observatory-lower.png",
    upperSrc: "./images/maps/observatory-upper.png",
    battleBackgroundSrc: "./images/maps/observatory-battle.png",
    gameObjects: {},
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(32),
        y: utils.withGrid(55),
      },
      kiera: {
        type: "Person",
        x: utils.withGrid(32),
        y: utils.withGrid(23),
        src: "./images/characters/people/kiera.png",
        behaviorLoop: [{ type: "stand", direction: "up", time: 1000 }],
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Thank you for playing our game! :) - Kristen and Christopher",
                faceHero: "kiera",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Hello, Kairo.",
                faceHero: "kiera",
              },
              {
                type: "textMessage",
                text: "I assume you are here to stop me.",
              },
              {
                type: "textMessage",
                text: "The Evolisks are magical creatures, who knows what they're capable of!",
              },
              {
                type: "textMessage",
                text: "I want to be the one who discovers their secret powers.",
              },
              {
                type: "textMessage",
                text: "Won't you join me, Kairo?",
              },
              {
                type: "textMessage",
                text: "...",
              },
              {
                type: "textMessage",
                text: "I see.",
              },
              {
                type: "textMessage",
                text: "Well, in that case...",
              },
              { type: "battle", enemyId: "Kiera" },
              { type: "addStoryFlag", flag: "GAME_COMPLETE" },
              {
                type: "textMessage",
                text: "All I wanted was to be someone special...",
                faceHero: "kiera",
              },
              {
                type: "textMessage",
                text: "I'm special to you?",
              },
              {
                type: "textMessage",
                text: "Kairo, that means the world to me!",
              },
              {
                type: "textMessage",
                text: "I love all of the Evolisks I've taken, but I'll return them to their rightful homes.",
              },
              {
                type: "textMessage",
                text: "I think I'll admire them for what they are, wonderful magical creatures!",
              },
              {
                type: "textMessage",
                text: "Thank you for playing our game! :) - Kristen and Christopher",
              },
            ],
          },
        ],
      },
    },
    walls: buildWalls(
      // entry/back wall
      wallLine(31, 56, 33, 56),
      wallLine(27, 55, 30, 55),
      wallLine(34, 55, 37, 55),

      // left wall arc
      wallLine(26, 48, 26, 54),
      wallLine(27, 47, 30, 47),
      wallLine(30, 45, 30, 46),
      wallAt(29, 44),
      wallLine(28, 41, 28, 43),
      wallAt(29, 40),
      wallLine(30, 37, 30, 39),
      wallLine(25, 37, 29, 37),
      wallLine(24, 22, 24, 36),

      // upper wall
      wallLine(25, 21, 39, 21),

      // right wall arc
      wallLine(40, 22, 40, 36),
      wallLine(34, 37, 39, 37),
      wallLine(34, 38, 34, 39),
      wallAt(35, 40),
      wallLine(36, 41, 36, 43),
      wallAt(35, 44),
      wallLine(34, 45, 34, 47),
      wallLine(35, 47, 37, 47),
      wallLine(38, 48, 38, 54),

      // desk and cones
      wallLine(31, 51, 33, 51),
      wallLine(31, 52, 33, 52),
      wallAt(34, 49),
      wallAt(30, 48),

      // center well
      wallLine(31, 41, 33, 41),
      wallLine(31, 43, 33, 43),
      wallAt(31, 42),
      wallAt(33, 42),

      // left seats
      wallLine(27, 25, 29, 25),
      wallLine(27, 27, 29, 27),
      wallAt(27, 26),
      wallAt(29, 26),
      wallLine(27, 31, 29, 31),
      wallLine(27, 33, 29, 33),
      wallAt(27, 32),
      wallAt(29, 32),

      // right seats
      wallLine(35, 25, 37, 25),
      wallLine(35, 27, 37, 27),
      wallAt(35, 26),
      wallAt(37, 26),
      wallLine(35, 31, 37, 31),
      wallLine(35, 33, 37, 33),
      wallAt(35, 32),
      wallAt(37, 32),
    ),
    cutsceneSpaces: {
      [utils.asGridCoord(31, 55)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(28),
              y: utils.withGrid(27),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(32, 55)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(29),
              y: utils.withGrid(27),
              direction: "down",
            },
          ],
        },
      ],
      [utils.asGridCoord(33, 55)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "ObservatoryExterior",
              x: utils.withGrid(30),
              y: utils.withGrid(27),
              direction: "down",
            },
          ],
        },
      ],
    },
    healingSpot: {
      x: 32, // healing area x-coordinate
      y: 54, // healing area y-coordinate
      message: "You feel the need to try again for the sake of the world!",
      heal: "full", // healing type ("full" or "partial")
    },
  },
};

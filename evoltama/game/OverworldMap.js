/*
  this file contains the OverworldMap class, which is used to manage the overworld map in the game.
*/

class OverworldMap {
  constructor(config) {
    // set up the map and objects
    this.overworld = null;
    this.gameObjects = {}; // live objects are in here
    this.configObjects = config.configObjects; // configuration content
    this.wildEncounterAreas = config.wildEncounterAreas || []; // encounter tiles
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
        obj.intentPosition[0] === y
      ) {
        return true;
      }
      return false;
    });
  }

  mountObjects() {
    Object.keys(this.configObjects).forEach((key) => {
      let object = this.configObjects[key];
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

  // puts the game into "cutscene mode"
  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      });
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
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
      console.error("Hero object not found!");
      return;
    }

    this.gameObjects["hero"].x = healingSpot.x * 16;
    this.gameObjects["hero"].y = healingSpot.y * 16;

    const healingMessage = new TextMessage({
      text: healingSpot.message,
      onComplete: () => {
        this.healPlayerEvolisks(healingSpot.heal);
      },
    });

    healingMessage.init(document.querySelector(".game-container"));
  }

  healPlayerEvolisks(healType) {
    const playerState = window.playerState;

    if (healType === "full") {
      Object.values(playerState.evolisks).forEach((evolisk) => {
        evolisk.hp = evolisk.maxHp;
      });
    } else if (healType === "partial") {
      Object.values(playerState.evolisks).forEach((evolisk) => {
        evolisk.hp = Math.floor(evolisk.maxHp / 2);
      });
    }
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
                text: "I have given you some capture discs and potions to help you in your journey, use them wisely!",
              },
              {
                type: "textMessage",
                text: "To the south of the village is the land of the mushrooms.",
              },
              {
                type: "textMessage",
                text: "Head there first to build your strength!",
              },
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
                text: "One of our townspeople has been corrupted and gone mad. She has locked herself in the old observatory.",
              },
              {
                type: "textMessage",
                text: "I fear that unless someone is able to stop her, she is going to destroy us and all the Evolisks!",
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
                text: "There is a magical stone in my house, I will allow you to have one of my Evolisks.",
              },
              {
                type: "textMessage",
                text: "You must train them well if you're going to save us! I will help guide you.",
              },
              {
                type: "textMessage",
                text: "Once you've chosen your new partner, return here to me.",
              },
            ],
          },
        ],
      },
      beetleGuard1: {
        type: "Person",
        x: utils.withGrid(53),
        y: utils.withGrid(55),
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Right this way, Kairo!",
                faceHero: "beetleGuard1",
              },
              {
                type: "removeWall",
                x: 52,
                y: 55,
              },
              { who: "beetleGuard1", type: "walk", direction: "left" },
              { who: "beetleGuard1", type: "walk", direction: "down" },
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
              {
                type: "removeWall",
                x: 52,
                y: 55,
              },
              { who: "beetleGuard1", type: "walk", direction: "left" },
              { who: "beetleGuard1", type: "walk", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Sorry, I can't let you through without the Elder Beetle's permission!",
                faceHero: "beetleGuard1",
              },
            ],
          },
        ],
      },
      beetleGuard2: {
        type: "Person",
        x: utils.withGrid(69),
        y: utils.withGrid(42),
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Right this way, Kairo!",
                faceHero: "beetleGuard2",
              },
              {
                type: "removeWall",
                x: 69,
                y: 41,
              },
              { who: "beetleGuard2", type: "walk", direction: "up" },
              { who: "beetleGuard2", type: "walk", direction: "right" },
              { who: "beetleGuard2", type: "stand", direction: "down" },
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Squishy sent you? Right this way, Kairo!",
                faceHero: "beetleGuard2",
              },
              {
                type: "removeWall",
                x: 69,
                y: 41,
              },
              { who: "beetleGuard2", type: "walk", direction: "up" },
              { who: "beetleGuard2", type: "walk", direction: "right" },
              { who: "beetleGuard2", type: "stand", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Sorry, the canyon is a very dangerous place!",
                faceHero: "beetleGuard2",
              },
            ],
          },
        ],
      },
      beetleGuard3: {
        type: "Person",
        x: utils.withGrid(47),
        y: utils.withGrid(10),
        src: "./images/characters/people/beetle-guard.png",
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Right this way, Kairo!",
                faceHero: "beetleGuard3",
              },
              {
                type: "removeWall",
                x: 46,
                y: 10,
              },
              { who: "beetleGuard3", type: "walk", direction: "left" },
              { who: "beetleGuard3", type: "walk", direction: "down" },
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
              {
                type: "removeWall",
                x: 46,
                y: 10,
              },
              { who: "beetleGuard3", type: "walk", direction: "left" },
              { who: "beetleGuard3", type: "walk", direction: "down" },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I can't let you go to the observatory yet, you'll get destroyed!",
                faceHero: "beetleGuard3",
              },
            ],
          },
        ],
      },
    },

    walls: {
      // rocks
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(25, 33)]: true,
      [utils.asGridCoord(22, 37)]: true,

      // signs
      [utils.asGridCoord(26, 40)]: true,
      [utils.asGridCoord(51, 44)]: true,
      [utils.asGridCoord(58, 40)]: true,
      [utils.asGridCoord(45, 21)]: true,

      // trees
      [utils.asGridCoord(37, 25)]: true,
      [utils.asGridCoord(38, 25)]: true,
      [utils.asGridCoord(42, 27)]: true,
      [utils.asGridCoord(43, 27)]: true,

      // house 1
      [utils.asGridCoord(21, 27)]: true,
      [utils.asGridCoord(21, 26)]: true,
      [utils.asGridCoord(21, 25)]: true,
      [utils.asGridCoord(21, 24)]: true,
      [utils.asGridCoord(22, 27)]: true,
      [utils.asGridCoord(23, 27)]: true,
      [utils.asGridCoord(24, 27)]: true,
      [utils.asGridCoord(25, 27)]: true,
      [utils.asGridCoord(25, 26)]: true,
      [utils.asGridCoord(25, 25)]: true,
      [utils.asGridCoord(25, 24)]: true,
      [utils.asGridCoord(22, 24)]: true,
      [utils.asGridCoord(23, 24)]: true,
      [utils.asGridCoord(24, 24)]: true,

      // house 2
      [utils.asGridCoord(39, 37)]: true,
      [utils.asGridCoord(40, 37)]: true,
      [utils.asGridCoord(41, 37)]: true,
      [utils.asGridCoord(42, 37)]: true,
      [utils.asGridCoord(43, 37)]: true,

      [utils.asGridCoord(39, 34)]: true,
      [utils.asGridCoord(40, 34)]: true,
      [utils.asGridCoord(41, 34)]: true,
      [utils.asGridCoord(42, 34)]: true,
      [utils.asGridCoord(43, 34)]: true,

      [utils.asGridCoord(39, 35)]: true,
      [utils.asGridCoord(39, 36)]: true,

      [utils.asGridCoord(43, 35)]: true,
      [utils.asGridCoord(43, 36)]: true,

      // house 3
      [utils.asGridCoord(51, 37)]: true,
      [utils.asGridCoord(52, 37)]: true,
      [utils.asGridCoord(53, 37)]: true,
      [utils.asGridCoord(54, 37)]: true,
      [utils.asGridCoord(55, 37)]: true,

      [utils.asGridCoord(51, 34)]: true,
      [utils.asGridCoord(52, 34)]: true,
      [utils.asGridCoord(53, 34)]: true,
      [utils.asGridCoord(54, 34)]: true,
      [utils.asGridCoord(55, 34)]: true,

      [utils.asGridCoord(51, 35)]: true,
      [utils.asGridCoord(51, 36)]: true,

      [utils.asGridCoord(55, 35)]: true,
      [utils.asGridCoord(55, 36)]: true,

      // house 4
      [utils.asGridCoord(51, 25)]: true,
      [utils.asGridCoord(52, 25)]: true,
      [utils.asGridCoord(53, 25)]: true,
      [utils.asGridCoord(54, 25)]: true,
      [utils.asGridCoord(55, 25)]: true,

      [utils.asGridCoord(51, 22)]: true,
      [utils.asGridCoord(52, 22)]: true,
      [utils.asGridCoord(53, 22)]: true,
      [utils.asGridCoord(54, 22)]: true,
      [utils.asGridCoord(55, 22)]: true,

      [utils.asGridCoord(51, 24)]: true,
      [utils.asGridCoord(51, 23)]: true,

      [utils.asGridCoord(55, 24)]: true,
      [utils.asGridCoord(55, 23)]: true,

      // first area

      // left wall
      [utils.asGridCoord(16, 19)]: true,
      [utils.asGridCoord(16, 20)]: true,
      [utils.asGridCoord(16, 21)]: true,
      [utils.asGridCoord(16, 22)]: true,
      [utils.asGridCoord(16, 23)]: true,
      [utils.asGridCoord(16, 24)]: true,
      [utils.asGridCoord(16, 25)]: true,
      [utils.asGridCoord(16, 26)]: true,
      [utils.asGridCoord(16, 27)]: true,
      [utils.asGridCoord(16, 28)]: true,
      [utils.asGridCoord(16, 29)]: true,
      [utils.asGridCoord(16, 30)]: true,
      [utils.asGridCoord(16, 31)]: true,
      [utils.asGridCoord(16, 32)]: true,
      [utils.asGridCoord(16, 33)]: true,
      [utils.asGridCoord(16, 34)]: true,
      [utils.asGridCoord(16, 35)]: true,
      [utils.asGridCoord(16, 36)]: true,
      [utils.asGridCoord(16, 37)]: true,
      [utils.asGridCoord(16, 38)]: true,
      [utils.asGridCoord(16, 39)]: true,
      [utils.asGridCoord(16, 40)]: true,
      [utils.asGridCoord(16, 41)]: true,
      [utils.asGridCoord(16, 42)]: true,
      [utils.asGridCoord(16, 43)]: true,
      [utils.asGridCoord(16, 44)]: true,
      [utils.asGridCoord(16, 45)]: true,
      [utils.asGridCoord(16, 46)]: true,

      // upper wall
      [utils.asGridCoord(17, 18)]: true,
      [utils.asGridCoord(18, 18)]: true,
      [utils.asGridCoord(19, 18)]: true,
      [utils.asGridCoord(20, 18)]: true,
      [utils.asGridCoord(21, 18)]: true,
      [utils.asGridCoord(22, 18)]: true,
      [utils.asGridCoord(23, 18)]: true,
      [utils.asGridCoord(24, 18)]: true,
      [utils.asGridCoord(25, 18)]: true,
      [utils.asGridCoord(26, 18)]: true,
      [utils.asGridCoord(27, 18)]: true,
      [utils.asGridCoord(28, 18)]: true,
      [utils.asGridCoord(29, 18)]: true,

      // right wall
      [utils.asGridCoord(30, 19)]: true,
      [utils.asGridCoord(30, 20)]: true,
      [utils.asGridCoord(30, 21)]: true,
      [utils.asGridCoord(30, 22)]: true,
      [utils.asGridCoord(30, 23)]: true,
      [utils.asGridCoord(30, 24)]: true,
      [utils.asGridCoord(30, 25)]: true,
      [utils.asGridCoord(30, 26)]: true,
      [utils.asGridCoord(30, 27)]: true,
      [utils.asGridCoord(30, 28)]: true,
      [utils.asGridCoord(30, 29)]: true,
      [utils.asGridCoord(30, 30)]: true,
      [utils.asGridCoord(30, 31)]: true,
      [utils.asGridCoord(30, 32)]: true,
      [utils.asGridCoord(30, 33)]: true,
      [utils.asGridCoord(30, 34)]: true,
      [utils.asGridCoord(30, 35)]: true,
      [utils.asGridCoord(30, 36)]: true,
      [utils.asGridCoord(30, 37)]: true,
      [utils.asGridCoord(30, 38)]: true,
      [utils.asGridCoord(30, 39)]: true,
      [utils.asGridCoord(31, 39)]: true,
      [utils.asGridCoord(32, 39)]: true,
      [utils.asGridCoord(30, 45)]: true,
      [utils.asGridCoord(31, 45)]: true,
      [utils.asGridCoord(32, 45)]: true,
      [utils.asGridCoord(30, 46)]: true,

      // bottom wall
      [utils.asGridCoord(17, 47)]: true,
      [utils.asGridCoord(18, 47)]: true,
      [utils.asGridCoord(19, 47)]: true,
      [utils.asGridCoord(20, 47)]: true,
      [utils.asGridCoord(21, 47)]: true,
      [utils.asGridCoord(22, 47)]: true,
      [utils.asGridCoord(23, 47)]: true,
      [utils.asGridCoord(24, 47)]: true,
      [utils.asGridCoord(25, 47)]: true,
      [utils.asGridCoord(26, 47)]: true,
      [utils.asGridCoord(27, 47)]: true,
      [utils.asGridCoord(28, 47)]: true,
      [utils.asGridCoord(29, 47)]: true,

      // main area

      // left wall
      [utils.asGridCoord(32, 19)]: true,
      [utils.asGridCoord(32, 20)]: true,
      [utils.asGridCoord(32, 21)]: true,
      [utils.asGridCoord(32, 22)]: true,
      [utils.asGridCoord(32, 23)]: true,
      [utils.asGridCoord(32, 24)]: true,
      [utils.asGridCoord(32, 25)]: true,
      [utils.asGridCoord(32, 26)]: true,
      [utils.asGridCoord(32, 27)]: true,
      [utils.asGridCoord(32, 28)]: true,
      [utils.asGridCoord(32, 29)]: true,
      [utils.asGridCoord(32, 30)]: true,
      [utils.asGridCoord(32, 31)]: true,
      [utils.asGridCoord(32, 32)]: true,
      [utils.asGridCoord(32, 33)]: true,
      [utils.asGridCoord(32, 34)]: true,
      [utils.asGridCoord(32, 35)]: true,
      [utils.asGridCoord(32, 36)]: true,
      [utils.asGridCoord(32, 37)]: true,
      [utils.asGridCoord(32, 38)]: true,
      [utils.asGridCoord(32, 46)]: true,

      // upper wall
      [utils.asGridCoord(33, 18)]: true,
      [utils.asGridCoord(34, 18)]: true,
      [utils.asGridCoord(35, 18)]: true,
      [utils.asGridCoord(36, 18)]: true,
      [utils.asGridCoord(37, 18)]: true,
      [utils.asGridCoord(38, 18)]: true,
      [utils.asGridCoord(39, 18)]: true,
      [utils.asGridCoord(40, 18)]: true,
      [utils.asGridCoord(41, 18)]: true,
      [utils.asGridCoord(42, 18)]: true,
      [utils.asGridCoord(43, 18)]: true,
      [utils.asGridCoord(44, 18)]: true,
      [utils.asGridCoord(45, 18)]: true,

      [utils.asGridCoord(49, 18)]: true,
      [utils.asGridCoord(50, 18)]: true,
      [utils.asGridCoord(51, 18)]: true,
      [utils.asGridCoord(52, 18)]: true,
      [utils.asGridCoord(53, 18)]: true,
      [utils.asGridCoord(54, 18)]: true,
      [utils.asGridCoord(55, 18)]: true,
      [utils.asGridCoord(56, 18)]: true,
      [utils.asGridCoord(57, 18)]: true,
      [utils.asGridCoord(58, 18)]: true,
      [utils.asGridCoord(59, 18)]: true,
      [utils.asGridCoord(60, 18)]: true,
      [utils.asGridCoord(61, 18)]: true,

      // right wall
      [utils.asGridCoord(62, 19)]: true,
      [utils.asGridCoord(62, 20)]: true,
      [utils.asGridCoord(62, 21)]: true,
      [utils.asGridCoord(62, 22)]: true,
      [utils.asGridCoord(62, 23)]: true,
      [utils.asGridCoord(62, 24)]: true,
      [utils.asGridCoord(62, 25)]: true,
      [utils.asGridCoord(62, 26)]: true,
      [utils.asGridCoord(62, 27)]: true,
      [utils.asGridCoord(62, 28)]: true,
      [utils.asGridCoord(62, 29)]: true,
      [utils.asGridCoord(62, 30)]: true,
      [utils.asGridCoord(62, 31)]: true,
      [utils.asGridCoord(62, 32)]: true,
      [utils.asGridCoord(62, 33)]: true,
      [utils.asGridCoord(62, 34)]: true,
      [utils.asGridCoord(62, 35)]: true,
      [utils.asGridCoord(62, 36)]: true,
      [utils.asGridCoord(62, 37)]: true,
      [utils.asGridCoord(62, 38)]: true,
      [utils.asGridCoord(62, 39)]: true,
      [utils.asGridCoord(63, 39)]: true,
      [utils.asGridCoord(64, 39)]: true,
      [utils.asGridCoord(62, 45)]: true,
      [utils.asGridCoord(63, 45)]: true,
      [utils.asGridCoord(64, 45)]: true,
      [utils.asGridCoord(62, 46)]: true,

      // lower wall
      [utils.asGridCoord(33, 47)]: true,
      [utils.asGridCoord(34, 47)]: true,
      [utils.asGridCoord(35, 47)]: true,
      [utils.asGridCoord(36, 47)]: true,
      [utils.asGridCoord(37, 47)]: true,
      [utils.asGridCoord(38, 47)]: true,
      [utils.asGridCoord(39, 47)]: true,
      [utils.asGridCoord(40, 47)]: true,
      [utils.asGridCoord(41, 47)]: true,
      [utils.asGridCoord(42, 47)]: true,
      [utils.asGridCoord(43, 47)]: true,
      [utils.asGridCoord(44, 47)]: true,
      [utils.asGridCoord(45, 47)]: true,
      [utils.asGridCoord(46, 47)]: true,
      [utils.asGridCoord(47, 47)]: true,
      [utils.asGridCoord(48, 47)]: true,
      [utils.asGridCoord(49, 47)]: true,
      [utils.asGridCoord(50, 47)]: true,
      [utils.asGridCoord(51, 47)]: true,

      [utils.asGridCoord(55, 47)]: true,
      [utils.asGridCoord(56, 47)]: true,
      [utils.asGridCoord(57, 47)]: true,
      [utils.asGridCoord(58, 47)]: true,
      [utils.asGridCoord(59, 47)]: true,
      [utils.asGridCoord(60, 47)]: true,
      [utils.asGridCoord(61, 47)]: true,

      // lower cube

      // hall
      [utils.asGridCoord(51, 48)]: true,
      [utils.asGridCoord(51, 49)]: true,
      [utils.asGridCoord(51, 50)]: true,
      [utils.asGridCoord(51, 51)]: true,
      [utils.asGridCoord(50, 51)]: true,
      [utils.asGridCoord(49, 51)]: true,

      [utils.asGridCoord(55, 48)]: true,
      [utils.asGridCoord(55, 49)]: true,
      [utils.asGridCoord(55, 50)]: true,
      [utils.asGridCoord(55, 51)]: true,
      [utils.asGridCoord(56, 51)]: true,
      [utils.asGridCoord(57, 51)]: true,

      // left side
      [utils.asGridCoord(48, 52)]: true,
      [utils.asGridCoord(48, 53)]: true,
      [utils.asGridCoord(48, 54)]: true,
      [utils.asGridCoord(48, 55)]: true,
      [utils.asGridCoord(48, 56)]: true,
      [utils.asGridCoord(48, 57)]: true,
      [utils.asGridCoord(48, 58)]: true,
      [utils.asGridCoord(48, 59)]: true,

      // right side
      [utils.asGridCoord(58, 52)]: true,
      [utils.asGridCoord(58, 53)]: true,
      [utils.asGridCoord(58, 54)]: true,
      [utils.asGridCoord(58, 55)]: true,
      [utils.asGridCoord(58, 56)]: true,
      [utils.asGridCoord(58, 57)]: true,
      [utils.asGridCoord(58, 58)]: true,
      [utils.asGridCoord(58, 59)]: true,

      // back wall
      [utils.asGridCoord(53, 60)]: true,

      // right cube

      // left wall
      [utils.asGridCoord(64, 38)]: true,
      [utils.asGridCoord(64, 46)]: true,

      // bottom wall
      [utils.asGridCoord(65, 47)]: true,
      [utils.asGridCoord(66, 47)]: true,
      [utils.asGridCoord(67, 47)]: true,
      [utils.asGridCoord(68, 47)]: true,
      [utils.asGridCoord(69, 47)]: true,
      [utils.asGridCoord(70, 47)]: true,
      [utils.asGridCoord(71, 47)]: true,
      [utils.asGridCoord(72, 47)]: true,
      [utils.asGridCoord(73, 47)]: true,

      // top wall
      [utils.asGridCoord(65, 37)]: true,
      [utils.asGridCoord(66, 37)]: true,
      [utils.asGridCoord(67, 37)]: true,
      [utils.asGridCoord(68, 37)]: true,
      [utils.asGridCoord(69, 37)]: true,
      [utils.asGridCoord(70, 37)]: true,
      [utils.asGridCoord(71, 37)]: true,
      [utils.asGridCoord(72, 37)]: true,
      [utils.asGridCoord(73, 37)]: true,

      // back wall
      [utils.asGridCoord(75, 42)]: true,

      // upper cube

      // back wall
      [utils.asGridCoord(45, 17)]: true,
      [utils.asGridCoord(45, 16)]: true,
      [utils.asGridCoord(45, 15)]: true,
      [utils.asGridCoord(45, 14)]: true,
      [utils.asGridCoord(44, 14)]: true,
      [utils.asGridCoord(43, 14)]: true,
      [utils.asGridCoord(49, 17)]: true,
      [utils.asGridCoord(49, 16)]: true,
      [utils.asGridCoord(49, 15)]: true,
      [utils.asGridCoord(49, 14)]: true,
      [utils.asGridCoord(50, 14)]: true,
      [utils.asGridCoord(51, 14)]: true,

      // right wall
      [utils.asGridCoord(52, 13)]: true,
      [utils.asGridCoord(52, 12)]: true,
      [utils.asGridCoord(52, 11)]: true,
      [utils.asGridCoord(52, 10)]: true,
      [utils.asGridCoord(52, 9)]: true,
      [utils.asGridCoord(52, 8)]: true,
      [utils.asGridCoord(52, 7)]: true,

      // left wall
      [utils.asGridCoord(42, 13)]: true,
      [utils.asGridCoord(42, 12)]: true,
      [utils.asGridCoord(42, 11)]: true,
      [utils.asGridCoord(42, 10)]: true,
      [utils.asGridCoord(42, 9)]: true,
      [utils.asGridCoord(42, 8)]: true,
      [utils.asGridCoord(42, 7)]: true,

      // top wall
      [utils.asGridCoord(43, 6)]: true,
      [utils.asGridCoord(44, 6)]: true,
      [utils.asGridCoord(45, 6)]: true,
      [utils.asGridCoord(45, 5)]: true,
      [utils.asGridCoord(46, 4)]: true,
      [utils.asGridCoord(47, 4)]: true,
      [utils.asGridCoord(48, 4)]: true,
      [utils.asGridCoord(49, 5)]: true,
      [utils.asGridCoord(49, 6)]: true,
      [utils.asGridCoord(50, 6)]: true,
      [utils.asGridCoord(51, 6)]: true,

      // fences
      [utils.asGridCoord(51, 10)]: true,
      [utils.asGridCoord(50, 10)]: true,
      [utils.asGridCoord(49, 10)]: true,
      [utils.asGridCoord(48, 10)]: true,
      [utils.asGridCoord(46, 10)]: true,
      [utils.asGridCoord(45, 10)]: true,
      [utils.asGridCoord(44, 10)]: true,
      [utils.asGridCoord(43, 10)]: true,

      [utils.asGridCoord(54, 55)]: true,
      [utils.asGridCoord(55, 55)]: true,
      [utils.asGridCoord(56, 55)]: true,
      [utils.asGridCoord(57, 55)]: true,
      [utils.asGridCoord(52, 55)]: true,
      [utils.asGridCoord(51, 55)]: true,
      [utils.asGridCoord(50, 55)]: true,
      [utils.asGridCoord(49, 55)]: true,

      [utils.asGridCoord(69, 38)]: true,
      [utils.asGridCoord(69, 39)]: true,
      [utils.asGridCoord(69, 40)]: true,
      [utils.asGridCoord(69, 41)]: true,
      [utils.asGridCoord(69, 43)]: true,
      [utils.asGridCoord(69, 44)]: true,
      [utils.asGridCoord(69, 45)]: true,
      [utils.asGridCoord(69, 46)]: true,
    },
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
    walls: {
      // tv
      [utils.asGridCoord(7, 9)]: true,

      // table
      [utils.asGridCoord(4, 8)]: true,
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(2, 8)]: true,
      [utils.asGridCoord(2, 7)]: true,

      // couch
      [utils.asGridCoord(6, 7)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,

      // kitchen
      [utils.asGridCoord(2, 5)]: true,
      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(2, 3)]: true,

      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(4, 3)]: true,

      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(5, 4)]: true,

      // bed
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(7, 4)]: true,
      [utils.asGridCoord(8, 3)]: true,

      // bottom wall
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,

      // right wall
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(9, 8)]: true,
      [utils.asGridCoord(9, 7)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,

      // back wall
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(7, 2)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(4, 2)]: true,
      [utils.asGridCoord(3, 2)]: true,
      [utils.asGridCoord(2, 2)]: true,

      // left wall
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
    },
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
      },
    },
    walls: {
      // table
      [utils.asGridCoord(4, 8)]: true,
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(2, 8)]: true,
      [utils.asGridCoord(2, 7)]: true,

      // couch
      [utils.asGridCoord(6, 7)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 7)]: true,

      // kitchen
      [utils.asGridCoord(2, 5)]: true,
      [utils.asGridCoord(2, 4)]: true,
      [utils.asGridCoord(2, 3)]: true,

      [utils.asGridCoord(4, 5)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(4, 3)]: true,

      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(5, 4)]: true,

      // bed
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(7, 4)]: true,
      [utils.asGridCoord(8, 3)]: true,

      // bottom wall
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,

      // right wall
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(9, 8)]: true,
      [utils.asGridCoord(9, 7)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,

      // back wall
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(7, 2)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(4, 2)]: true,
      [utils.asGridCoord(3, 2)]: true,
      [utils.asGridCoord(2, 2)]: true,

      // left wall
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
    },
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
    walls: {
      // tv
      [utils.asGridCoord(3, 9)]: true,

      // table
      [utils.asGridCoord(6, 8)]: true,
      [utils.asGridCoord(6, 7)]: true,
      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(8, 7)]: true,

      // couch
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,

      // kitchen
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(8, 3)]: true,

      [utils.asGridCoord(6, 5)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(6, 3)]: true,

      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(5, 4)]: true,

      // bed
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(2, 3)]: true,

      // bottom wall
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,

      // right wall
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(9, 8)]: true,
      [utils.asGridCoord(9, 7)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,

      // back wall
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(7, 2)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(4, 2)]: true,
      [utils.asGridCoord(3, 2)]: true,
      [utils.asGridCoord(2, 2)]: true,

      // left wall
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
    },
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
    walls: {
      // tv
      [utils.asGridCoord(3, 9)]: true,

      // table
      [utils.asGridCoord(6, 8)]: true,
      [utils.asGridCoord(6, 7)]: true,
      [utils.asGridCoord(7, 8)]: true,
      [utils.asGridCoord(7, 7)]: true,
      [utils.asGridCoord(8, 8)]: true,
      [utils.asGridCoord(8, 7)]: true,

      // couch
      [utils.asGridCoord(4, 7)]: true,
      [utils.asGridCoord(3, 7)]: true,
      [utils.asGridCoord(2, 7)]: true,

      // kitchen
      [utils.asGridCoord(8, 5)]: true,
      [utils.asGridCoord(8, 4)]: true,
      [utils.asGridCoord(8, 3)]: true,

      [utils.asGridCoord(6, 5)]: true,
      [utils.asGridCoord(6, 4)]: true,
      [utils.asGridCoord(6, 3)]: true,

      [utils.asGridCoord(5, 5)]: true,
      [utils.asGridCoord(5, 4)]: true,

      // bed
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(2, 3)]: true,

      // bottom wall
      [utils.asGridCoord(2, 10)]: true,
      [utils.asGridCoord(3, 10)]: true,
      [utils.asGridCoord(4, 10)]: true,
      [utils.asGridCoord(5, 11)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(7, 10)]: true,
      [utils.asGridCoord(8, 10)]: true,

      // right wall
      [utils.asGridCoord(9, 9)]: true,
      [utils.asGridCoord(9, 8)]: true,
      [utils.asGridCoord(9, 7)]: true,
      [utils.asGridCoord(9, 6)]: true,
      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(9, 3)]: true,

      // back wall
      [utils.asGridCoord(8, 2)]: true,
      [utils.asGridCoord(7, 2)]: true,
      [utils.asGridCoord(6, 2)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(4, 2)]: true,
      [utils.asGridCoord(3, 2)]: true,
      [utils.asGridCoord(2, 2)]: true,

      // left wall
      [utils.asGridCoord(1, 9)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(1, 4)]: true,
      [utils.asGridCoord(1, 3)]: true,
    },
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
                text: "Welcome to the land of mushrooms! My name is Cherry, I'm one of the Squelchy siblings.",
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
            ],
          },
        ],
      },
      shelly: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(11),
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
            ],
          },
          {
            required: ["MUSHROOM_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Be careful at Froggerts' hideout, those frogs can be vicious!",
                faceHero: "shelly",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "I'm Shelly, one of the Squelchy siblings. We are the protectors of mushrooms.",
                faceHero: "shelly",
              },
              {
                type: "textMessage",
                text: "Our leader is the pink Squelchy, her name is Squishy!",
              },
              {
                type: "textMessage",
                text: "If you beat her in battle, she'll tell you where Froggerts' hideout is!",
              },
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
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Hey man! Feel like testing your strength?",
                faceHero: "squishy",
              },
              { type: "battle", enemyId: "Squishy" },
              { type: "addStoryFlag", flag: "MUSHROOM_COMPLETE" },
              {
                type: "textMessage",
                text: "Not bad!",
                faceHero: "squishy",
              },
              {
                type: "textMessage",
                text: "You can find Froggert's hideout east of the village.",
              },
              {
                type: "textMessage",
                text: "Tell the guard I sent you, he'll let you in.",
              },
              {
                type: "textMessage",
                text: "Don't let those frogs bully you!",
              },
            ],
          },
        ],
      },
    },
    // create walls
    walls: {
      // mushrooms
      [utils.asGridCoord(16, 1)]: true,

      [utils.asGridCoord(20, 2)]: true,

      [utils.asGridCoord(13, 2)]: true,

      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(12, 3)]: true,
      [utils.asGridCoord(13, 3)]: true,
      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(12, 4)]: true,

      [utils.asGridCoord(21, 3)]: true,
      [utils.asGridCoord(22, 3)]: true,
      [utils.asGridCoord(23, 3)]: true,
      [utils.asGridCoord(22, 4)]: true,
      [utils.asGridCoord(23, 4)]: true,

      [utils.asGridCoord(23, 7)]: true,

      [utils.asGridCoord(6, 8)]: true,

      [utils.asGridCoord(8, 13)]: true,

      [utils.asGridCoord(10, 15)]: true,

      [utils.asGridCoord(18, 15)]: true,

      [utils.asGridCoord(23, 16)]: true,

      [utils.asGridCoord(19, 8)]: true,

      [utils.asGridCoord(16, 9)]: true,
      [utils.asGridCoord(17, 9)]: true,
      [utils.asGridCoord(18, 9)]: true,
      [utils.asGridCoord(16, 10)]: true,
      [utils.asGridCoord(17, 10)]: true,

      [utils.asGridCoord(19, 11)]: true,
      [utils.asGridCoord(20, 11)]: true,
      [utils.asGridCoord(21, 11)]: true,
      [utils.asGridCoord(20, 12)]: true,

      [utils.asGridCoord(3, 13)]: true,
      [utils.asGridCoord(4, 13)]: true,
      [utils.asGridCoord(5, 13)]: true,
      [utils.asGridCoord(4, 14)]: true,
      [utils.asGridCoord(5, 14)]: true,

      [utils.asGridCoord(13, 18)]: true,
      [utils.asGridCoord(14, 18)]: true,
      [utils.asGridCoord(15, 18)]: true,
      [utils.asGridCoord(13, 19)]: true,
      [utils.asGridCoord(14, 19)]: true,

      [utils.asGridCoord(5, 18)]: true,
      [utils.asGridCoord(6, 18)]: true,
      [utils.asGridCoord(5, 19)]: true,
      [utils.asGridCoord(6, 19)]: true,

      [utils.asGridCoord(22, 19)]: true,
      [utils.asGridCoord(23, 19)]: true,
      [utils.asGridCoord(22, 20)]: true,
      [utils.asGridCoord(23, 20)]: true,

      // rocks
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(3, 4)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(11, 6)]: true,
      [utils.asGridCoord(12, 6)]: true,
      [utils.asGridCoord(19, 17)]: true,
      [utils.asGridCoord(19, 18)]: true,
      [utils.asGridCoord(20, 17)]: true,
      [utils.asGridCoord(20, 18)]: true,

      // left wall
      [utils.asGridCoord(0, 0)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 12)]: true,
      [utils.asGridCoord(0, 13)]: true,
      [utils.asGridCoord(0, 14)]: true,
      [utils.asGridCoord(0, 15)]: true,
      [utils.asGridCoord(0, 16)]: true,
      [utils.asGridCoord(0, 17)]: true,
      [utils.asGridCoord(0, 18)]: true,
      [utils.asGridCoord(0, 19)]: true,
      [utils.asGridCoord(0, 20)]: true,
      [utils.asGridCoord(0, 21)]: true,
      [utils.asGridCoord(0, 22)]: true,
      [utils.asGridCoord(0, 23)]: true,
      [utils.asGridCoord(0, 24)]: true,

      // top wall
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(2, 0)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(4, 0)]: true,
      [utils.asGridCoord(5, 0)]: true,
      [utils.asGridCoord(6, 0)]: true,
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(8, 0)]: true,
      [utils.asGridCoord(9, 0)]: true,
      [utils.asGridCoord(10, 0)]: true,
      [utils.asGridCoord(11, 0)]: true,
      [utils.asGridCoord(12, 0)]: true,
      [utils.asGridCoord(13, 0)]: true,
      [utils.asGridCoord(14, 0)]: true,
      [utils.asGridCoord(15, 0)]: true,
      [utils.asGridCoord(16, 0)]: true,
      [utils.asGridCoord(17, 0)]: true,
      [utils.asGridCoord(18, 0)]: true,
      [utils.asGridCoord(19, 0)]: true,
      [utils.asGridCoord(20, 0)]: true,
      [utils.asGridCoord(21, 0)]: true,
      [utils.asGridCoord(22, 0)]: true,
      [utils.asGridCoord(23, 0)]: true,
      [utils.asGridCoord(24, 0)]: true,
      [utils.asGridCoord(25, 0)]: true,

      // bottom wall
      [utils.asGridCoord(0, 23)]: true,
      [utils.asGridCoord(1, 23)]: true,
      [utils.asGridCoord(2, 23)]: true,
      [utils.asGridCoord(3, 23)]: true,
      [utils.asGridCoord(4, 23)]: true,
      [utils.asGridCoord(5, 23)]: true,
      [utils.asGridCoord(6, 23)]: true,
      [utils.asGridCoord(7, 23)]: true,
      [utils.asGridCoord(8, 23)]: true,
      [utils.asGridCoord(9, 23)]: true,
      [utils.asGridCoord(10, 23)]: true,
      [utils.asGridCoord(11, 23)]: true,
      [utils.asGridCoord(12, 23)]: true,
      [utils.asGridCoord(13, 23)]: true,
      [utils.asGridCoord(14, 23)]: true,
      [utils.asGridCoord(15, 23)]: true,
      [utils.asGridCoord(16, 23)]: true,
      [utils.asGridCoord(17, 23)]: true,
      [utils.asGridCoord(18, 23)]: true,
      [utils.asGridCoord(19, 23)]: true,
      [utils.asGridCoord(20, 23)]: true,
      [utils.asGridCoord(21, 23)]: true,
      [utils.asGridCoord(22, 23)]: true,
      [utils.asGridCoord(23, 23)]: true,
      [utils.asGridCoord(24, 23)]: true,
      [utils.asGridCoord(25, 23)]: true,
      [utils.asGridCoord(26, 23)]: true,

      // right wall
      [utils.asGridCoord(25, 0)]: true,
      [utils.asGridCoord(25, 1)]: true,
      [utils.asGridCoord(25, 2)]: true,
      [utils.asGridCoord(25, 3)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(25, 5)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(25, 7)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(25, 12)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(25, 14)]: true,
      [utils.asGridCoord(25, 15)]: true,
      [utils.asGridCoord(25, 16)]: true,
      [utils.asGridCoord(25, 17)]: true,
      [utils.asGridCoord(25, 18)]: true,
      [utils.asGridCoord(25, 19)]: true,
      [utils.asGridCoord(25, 20)]: true,
      [utils.asGridCoord(25, 21)]: true,
      [utils.asGridCoord(25, 22)]: true,
      [utils.asGridCoord(25, 23)]: true,
      [utils.asGridCoord(25, 24)]: true,
    },
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

    healingSpot: {
      x: 23, // healing area x-coordinate
      y: 11, // healing area y-coordinate
      message: "You've been teleported to the mushroom nursery!",
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
      squeak: {
        type: "Person",
        x: utils.withGrid(7),
        y: utils.withGrid(6),
        src: "./images/characters/people/froggert-squeak.png",
        talking: [
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "You defeated Hoppins?! I think we found our new leader!",
                faceHero: "squeak",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Welcome to the canyon, this is our hideout!",
                faceHero: "squeak",
              },
              {
                type: "textMessage",
                text: "Our leader is an orange frog named Hoppins, defeat him and you can take his place!",
              },
            ],
          },
        ],
      },
      pip: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(4),
        src: "./images/characters/people/froggert-pip.png",
        talking: [
          {
            required: ["GAME_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "Wow, you really did it!",
                faceHero: "pip",
              },
            ],
          },
          {
            events: [
              {
                type: "textMessage",
                text: "Hey, did you hear that some weirdo took over the old Observatory?",
                faceHero: "pip",
              },
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
                text: "You did it! You saved us all!",
                faceHero: "hoppins",
              },
            ],
          },
          {
            required: ["CANYON_COMPLETE"],
            events: [
              {
                type: "textMessage",
                text: "What are you still doing here? Save us all!",
                faceHero: "hoppins",
              },
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
              {
                type: "textMessage",
                text: "Can't believe I lost...",
                faceHero: "hoppins",
              },
              {
                type: "textMessage",
                text: "Maybe you could do something about that person up at the observatory!",
              },
              {
                type: "textMessage",
                text: "Tell the guard you defeated me, he'll know your tough stuff!",
              },
            ],
          },
        ],
      },
    },
    // walls & objects
    walls: {
      // left wall
      [utils.asGridCoord(0, 0)]: true,
      [utils.asGridCoord(0, 1)]: true,
      [utils.asGridCoord(0, 2)]: true,
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(0, 6)]: true,
      [utils.asGridCoord(0, 7)]: true,
      [utils.asGridCoord(0, 8)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 12)]: true,
      [utils.asGridCoord(0, 13)]: true,
      [utils.asGridCoord(0, 14)]: true,
      [utils.asGridCoord(0, 15)]: true,
      [utils.asGridCoord(0, 16)]: true,
      [utils.asGridCoord(0, 17)]: true,
      [utils.asGridCoord(0, 18)]: true,
      [utils.asGridCoord(0, 19)]: true,
      [utils.asGridCoord(0, 20)]: true,
      [utils.asGridCoord(0, 21)]: true,
      [utils.asGridCoord(0, 22)]: true,

      // top wall
      [utils.asGridCoord(1, 0)]: true,
      [utils.asGridCoord(2, 0)]: true,
      [utils.asGridCoord(3, 0)]: true,
      [utils.asGridCoord(4, 0)]: true,
      [utils.asGridCoord(5, 0)]: true,
      [utils.asGridCoord(6, 0)]: true,
      [utils.asGridCoord(7, 0)]: true,
      [utils.asGridCoord(8, 0)]: true,
      [utils.asGridCoord(9, 0)]: true,
      [utils.asGridCoord(10, 0)]: true,
      [utils.asGridCoord(11, 0)]: true,
      [utils.asGridCoord(12, 0)]: true,
      [utils.asGridCoord(13, 0)]: true,
      [utils.asGridCoord(14, 0)]: true,
      [utils.asGridCoord(15, 0)]: true,
      [utils.asGridCoord(16, 0)]: true,
      [utils.asGridCoord(17, 0)]: true,
      [utils.asGridCoord(18, 0)]: true,
      [utils.asGridCoord(19, 0)]: true,
      [utils.asGridCoord(20, 0)]: true,
      [utils.asGridCoord(21, 0)]: true,
      [utils.asGridCoord(22, 0)]: true,
      [utils.asGridCoord(23, 0)]: true,
      [utils.asGridCoord(24, 0)]: true,

      // right wall
      [utils.asGridCoord(25, 0)]: true,
      [utils.asGridCoord(25, 1)]: true,
      [utils.asGridCoord(25, 2)]: true,
      [utils.asGridCoord(25, 3)]: true,
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(25, 5)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(25, 7)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(25, 12)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(25, 14)]: true,
      [utils.asGridCoord(25, 15)]: true,
      [utils.asGridCoord(25, 16)]: true,
      [utils.asGridCoord(25, 17)]: true,
      [utils.asGridCoord(25, 18)]: true,
      [utils.asGridCoord(25, 19)]: true,
      [utils.asGridCoord(25, 20)]: true,
      [utils.asGridCoord(25, 21)]: true,
      [utils.asGridCoord(25, 22)]: true,

      // bottom wall
      [utils.asGridCoord(1, 23)]: true,
      [utils.asGridCoord(2, 23)]: true,
      [utils.asGridCoord(3, 23)]: true,
      [utils.asGridCoord(4, 23)]: true,
      [utils.asGridCoord(5, 23)]: true,
      [utils.asGridCoord(6, 23)]: true,
      [utils.asGridCoord(7, 23)]: true,
      [utils.asGridCoord(8, 23)]: true,
      [utils.asGridCoord(9, 23)]: true,
      [utils.asGridCoord(10, 23)]: true,
      [utils.asGridCoord(11, 23)]: true,
      [utils.asGridCoord(12, 23)]: true,
      [utils.asGridCoord(13, 23)]: true,
      [utils.asGridCoord(14, 23)]: true,
      [utils.asGridCoord(15, 23)]: true,
      [utils.asGridCoord(16, 23)]: true,
      [utils.asGridCoord(17, 23)]: true,
      [utils.asGridCoord(18, 23)]: true,
      [utils.asGridCoord(19, 23)]: true,
      [utils.asGridCoord(20, 23)]: true,
      [utils.asGridCoord(21, 23)]: true,
      [utils.asGridCoord(22, 23)]: true,
      [utils.asGridCoord(23, 23)]: true,
      [utils.asGridCoord(24, 23)]: true,

      // river
      [utils.asGridCoord(1, 5)]: true,
      [utils.asGridCoord(2, 5)]: true,
      [utils.asGridCoord(3, 5)]: true,
      [utils.asGridCoord(3, 6)]: true,
      [utils.asGridCoord(4, 6)]: true,
      [utils.asGridCoord(5, 6)]: true,
      [utils.asGridCoord(5, 7)]: true,
      [utils.asGridCoord(6, 7)]: true,
      [utils.asGridCoord(6, 8)]: true,
      [utils.asGridCoord(6, 10)]: true,
      [utils.asGridCoord(6, 11)]: true,
      [utils.asGridCoord(6, 12)]: true,
      [utils.asGridCoord(6, 13)]: true,

      [utils.asGridCoord(7, 13)]: true,
      [utils.asGridCoord(8, 13)]: true,
      [utils.asGridCoord(9, 13)]: true,
      [utils.asGridCoord(10, 13)]: true,
      [utils.asGridCoord(11, 13)]: true,
      [utils.asGridCoord(12, 13)]: true,
      [utils.asGridCoord(13, 13)]: true,
      [utils.asGridCoord(14, 13)]: true,
      [utils.asGridCoord(15, 13)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,

      [utils.asGridCoord(19, 13)]: true,
      [utils.asGridCoord(20, 13)]: true,
      [utils.asGridCoord(21, 13)]: true,
      [utils.asGridCoord(22, 13)]: true,
      [utils.asGridCoord(23, 13)]: true,
      [utils.asGridCoord(24, 13)]: true,

      // skull
      [utils.asGridCoord(8, 10)]: true,
      [utils.asGridCoord(8, 11)]: true,
      [utils.asGridCoord(8, 12)]: true,

      // bushes
      [utils.asGridCoord(3, 8)]: true,
      [utils.asGridCoord(4, 11)]: true,
      [utils.asGridCoord(10, 7)]: true,
      [utils.asGridCoord(13, 11)]: true,
      [utils.asGridCoord(21, 11)]: true,
      [utils.asGridCoord(5, 2)]: true,
      [utils.asGridCoord(12, 2)]: true,
      [utils.asGridCoord(23, 7)]: true,
      [utils.asGridCoord(23, 6)]: true,
      [utils.asGridCoord(21, 19)]: true,
      [utils.asGridCoord(21, 20)]: true,
      [utils.asGridCoord(9, 15)]: true,
      [utils.asGridCoord(9, 16)]: true,
      [utils.asGridCoord(5, 19)]: true,
      [utils.asGridCoord(5, 20)]: true,

      // canyon walls
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,

      [utils.asGridCoord(4, 4)]: true,
      [utils.asGridCoord(5, 4)]: true,
      [utils.asGridCoord(6, 4)]: true,

      [utils.asGridCoord(7, 5)]: true,

      [utils.asGridCoord(9, 5)]: true,
      [utils.asGridCoord(10, 5)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(12, 5)]: true,

      [utils.asGridCoord(13, 4)]: true,
      [utils.asGridCoord(14, 4)]: true,
      [utils.asGridCoord(15, 4)]: true,
      [utils.asGridCoord(16, 4)]: true,
      [utils.asGridCoord(17, 4)]: true,

      [utils.asGridCoord(18, 3)]: true,
      [utils.asGridCoord(19, 3)]: true,
      [utils.asGridCoord(20, 3)]: true,

      [utils.asGridCoord(21, 4)]: true,
      [utils.asGridCoord(22, 4)]: true,

      [utils.asGridCoord(23, 3)]: true,
      [utils.asGridCoord(24, 3)]: true,

      // rocks
      [utils.asGridCoord(2, 11)]: true,

      [utils.asGridCoord(10, 9)]: true,

      [utils.asGridCoord(13, 3)]: true,

      [utils.asGridCoord(20, 2)]: true,

      [utils.asGridCoord(16, 11)]: true,

      [utils.asGridCoord(19, 7)]: true,

      [utils.asGridCoord(15, 16)]: true,

      [utils.asGridCoord(6, 16)]: true,

      // trees
      [utils.asGridCoord(13, 9)]: true,

      [utils.asGridCoord(21, 17)]: true,

      [utils.asGridCoord(12, 19)]: true,
      [utils.asGridCoord(12, 20)]: true,

      [utils.asGridCoord(3, 1)]: true,
      [utils.asGridCoord(3, 2)]: true,
    },

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
      // excluded area (around froggert at 7,6)
      { xMin: 5, xMax: 9, yMin: 4, yMax: 8, exclude: true },

      // full encounter zone (whole map)
      { xMin: 1, xMax: 24, yMin: 1, yMax: 22 },
    ],

    healingSpot: {
      x: 3, // healing area x-coordinate
      y: 9, // healing area y-coordinate
      message: "You've been teleported to a healing area in the Canyon Wild!",
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
    walls: {
      // back wall
      [utils.asGridCoord(29, 57)]: true,
      [utils.asGridCoord(28, 57)]: true,
      [utils.asGridCoord(30, 57)]: true,

      // left wall
      [utils.asGridCoord(27, 56)]: true,
      [utils.asGridCoord(27, 55)]: true,
      [utils.asGridCoord(27, 54)]: true,
      [utils.asGridCoord(27, 53)]: true,
      [utils.asGridCoord(27, 52)]: true,
      [utils.asGridCoord(27, 51)]: true,
      [utils.asGridCoord(27, 50)]: true,
      [utils.asGridCoord(27, 49)]: true,
      [utils.asGridCoord(26, 49)]: true,
      [utils.asGridCoord(25, 49)]: true,
      [utils.asGridCoord(24, 49)]: true,
      [utils.asGridCoord(23, 49)]: true,
      [utils.asGridCoord(22, 49)]: true,
      [utils.asGridCoord(21, 48)]: true,
      [utils.asGridCoord(21, 47)]: true,
      [utils.asGridCoord(21, 46)]: true,
      [utils.asGridCoord(21, 45)]: true,
      [utils.asGridCoord(21, 44)]: true,
      [utils.asGridCoord(21, 43)]: true,
      [utils.asGridCoord(21, 42)]: true,
      [utils.asGridCoord(21, 41)]: true,
      [utils.asGridCoord(21, 40)]: true,
      [utils.asGridCoord(22, 39)]: true,
      [utils.asGridCoord(23, 39)]: true,
      [utils.asGridCoord(24, 39)]: true,
      [utils.asGridCoord(25, 39)]: true,
      [utils.asGridCoord(26, 39)]: true,
      [utils.asGridCoord(27, 39)]: true,
      [utils.asGridCoord(27, 38)]: true,
      [utils.asGridCoord(27, 37)]: true,
      [utils.asGridCoord(27, 36)]: true,
      [utils.asGridCoord(27, 35)]: true,
      [utils.asGridCoord(27, 34)]: true,
      [utils.asGridCoord(27, 33)]: true,
      [utils.asGridCoord(26, 33)]: true,
      [utils.asGridCoord(25, 33)]: true,
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(23, 33)]: true,
      [utils.asGridCoord(22, 33)]: true,
      [utils.asGridCoord(21, 33)]: true,
      [utils.asGridCoord(20, 33)]: true,
      [utils.asGridCoord(19, 32)]: true,
      [utils.asGridCoord(19, 31)]: true,
      [utils.asGridCoord(19, 30)]: true,
      [utils.asGridCoord(19, 29)]: true,
      [utils.asGridCoord(19, 28)]: true,

      // back wall
      [utils.asGridCoord(20, 27)]: true,
      [utils.asGridCoord(21, 27)]: true,
      [utils.asGridCoord(22, 27)]: true,
      [utils.asGridCoord(23, 27)]: true,
      [utils.asGridCoord(24, 27)]: true,
      [utils.asGridCoord(25, 27)]: true,
      [utils.asGridCoord(26, 27)]: true,
      [utils.asGridCoord(27, 27)]: true,
      [utils.asGridCoord(28, 26)]: true,
      [utils.asGridCoord(29, 26)]: true,
      [utils.asGridCoord(30, 26)]: true,
      [utils.asGridCoord(31, 27)]: true,
      [utils.asGridCoord(32, 27)]: true,
      [utils.asGridCoord(33, 27)]: true,
      [utils.asGridCoord(34, 27)]: true,
      [utils.asGridCoord(35, 27)]: true,
      [utils.asGridCoord(36, 27)]: true,
      [utils.asGridCoord(37, 27)]: true,
      [utils.asGridCoord(38, 27)]: true,

      // right wall
      [utils.asGridCoord(39, 28)]: true,
      [utils.asGridCoord(39, 29)]: true,
      [utils.asGridCoord(39, 30)]: true,
      [utils.asGridCoord(39, 31)]: true,
      [utils.asGridCoord(39, 32)]: true,
      [utils.asGridCoord(38, 33)]: true,
      [utils.asGridCoord(37, 33)]: true,
      [utils.asGridCoord(36, 33)]: true,
      [utils.asGridCoord(35, 33)]: true,
      [utils.asGridCoord(34, 33)]: true,
      [utils.asGridCoord(33, 33)]: true,
      [utils.asGridCoord(32, 33)]: true,
      [utils.asGridCoord(31, 33)]: true,
      [utils.asGridCoord(31, 34)]: true,
      [utils.asGridCoord(31, 35)]: true,
      [utils.asGridCoord(31, 36)]: true,
      [utils.asGridCoord(31, 37)]: true,
      [utils.asGridCoord(31, 38)]: true,
      [utils.asGridCoord(31, 39)]: true,
      [utils.asGridCoord(32, 39)]: true,
      [utils.asGridCoord(33, 39)]: true,
      [utils.asGridCoord(34, 39)]: true,
      [utils.asGridCoord(35, 39)]: true,
      [utils.asGridCoord(36, 39)]: true,
      [utils.asGridCoord(37, 40)]: true,
      [utils.asGridCoord(37, 41)]: true,
      [utils.asGridCoord(37, 42)]: true,
      [utils.asGridCoord(37, 43)]: true,
      [utils.asGridCoord(37, 44)]: true,
      [utils.asGridCoord(37, 45)]: true,
      [utils.asGridCoord(37, 46)]: true,
      [utils.asGridCoord(37, 47)]: true,
      [utils.asGridCoord(37, 48)]: true,
      [utils.asGridCoord(36, 49)]: true,
      [utils.asGridCoord(35, 49)]: true,
      [utils.asGridCoord(34, 49)]: true,
      [utils.asGridCoord(33, 49)]: true,
      [utils.asGridCoord(32, 49)]: true,
      [utils.asGridCoord(31, 49)]: true,
      [utils.asGridCoord(31, 50)]: true,
      [utils.asGridCoord(31, 51)]: true,
      [utils.asGridCoord(31, 52)]: true,
      [utils.asGridCoord(31, 53)]: true,
      [utils.asGridCoord(31, 54)]: true,
      [utils.asGridCoord(31, 55)]: true,
      [utils.asGridCoord(31, 56)]: true,
      [utils.asGridCoord(31, 57)]: true,

      // well
      [utils.asGridCoord(25, 45)]: true,
      [utils.asGridCoord(26, 45)]: true,
      [utils.asGridCoord(27, 45)]: true,
      [utils.asGridCoord(28, 45)]: true,
      [utils.asGridCoord(29, 45)]: true,
      [utils.asGridCoord(30, 45)]: true,
      [utils.asGridCoord(31, 45)]: true,
      [utils.asGridCoord(32, 45)]: true,
      [utils.asGridCoord(33, 45)]: true,

      [utils.asGridCoord(25, 43)]: true,
      [utils.asGridCoord(26, 43)]: true,
      [utils.asGridCoord(27, 43)]: true,
      [utils.asGridCoord(28, 43)]: true,
      [utils.asGridCoord(29, 43)]: true,
      [utils.asGridCoord(30, 43)]: true,
      [utils.asGridCoord(31, 43)]: true,
      [utils.asGridCoord(32, 43)]: true,
      [utils.asGridCoord(33, 43)]: true,

      [utils.asGridCoord(25, 44)]: true,
      [utils.asGridCoord(33, 44)]: true,
    },
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
        behaviorLoop: [{ type: "stand", direction: "up", time: 100 }],
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
                text: "My name is Kiera, and I plan to take over the world!",
                faceHero: "kiera",
              },
              {
                type: "textMessage",
                text: "You dare to challenge me?",
              },
              { type: "battle", enemyId: "Kiera" },
              { type: "addStoryFlag", flag: "GAME_COMPLETE" },
              {
                type: "textMessage",
                text: "All I wanted was a friend...",
                faceHero: "kiera",
              },
              {
                type: "textMessage",
                text: "We can be friends? I would love to be friends!",
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
    walls: {
      // back wall
      [utils.asGridCoord(31, 56)]: true,
      [utils.asGridCoord(32, 56)]: true,
      [utils.asGridCoord(33, 56)]: true,

      [utils.asGridCoord(30, 55)]: true,
      [utils.asGridCoord(29, 55)]: true,
      [utils.asGridCoord(28, 55)]: true,
      [utils.asGridCoord(27, 55)]: true,

      [utils.asGridCoord(34, 55)]: true,
      [utils.asGridCoord(35, 55)]: true,
      [utils.asGridCoord(36, 55)]: true,
      [utils.asGridCoord(37, 55)]: true,

      // left wall
      [utils.asGridCoord(26, 54)]: true,
      [utils.asGridCoord(26, 53)]: true,
      [utils.asGridCoord(26, 52)]: true,
      [utils.asGridCoord(26, 51)]: true,
      [utils.asGridCoord(26, 50)]: true,
      [utils.asGridCoord(26, 49)]: true,
      [utils.asGridCoord(26, 48)]: true,
      [utils.asGridCoord(27, 47)]: true,
      [utils.asGridCoord(28, 47)]: true,
      [utils.asGridCoord(29, 47)]: true,
      [utils.asGridCoord(30, 47)]: true,
      [utils.asGridCoord(30, 46)]: true,
      [utils.asGridCoord(30, 45)]: true,
      [utils.asGridCoord(29, 44)]: true,
      [utils.asGridCoord(28, 43)]: true,
      [utils.asGridCoord(28, 42)]: true,
      [utils.asGridCoord(28, 41)]: true,
      [utils.asGridCoord(29, 40)]: true,
      [utils.asGridCoord(30, 39)]: true,
      [utils.asGridCoord(30, 38)]: true,
      [utils.asGridCoord(30, 37)]: true,
      [utils.asGridCoord(29, 37)]: true,
      [utils.asGridCoord(28, 37)]: true,
      [utils.asGridCoord(27, 37)]: true,
      [utils.asGridCoord(26, 37)]: true,
      [utils.asGridCoord(25, 37)]: true,
      [utils.asGridCoord(24, 36)]: true,
      [utils.asGridCoord(24, 35)]: true,
      [utils.asGridCoord(24, 34)]: true,
      [utils.asGridCoord(24, 33)]: true,
      [utils.asGridCoord(24, 32)]: true,
      [utils.asGridCoord(24, 31)]: true,
      [utils.asGridCoord(24, 30)]: true,
      [utils.asGridCoord(24, 29)]: true,
      [utils.asGridCoord(24, 28)]: true,
      [utils.asGridCoord(24, 27)]: true,
      [utils.asGridCoord(24, 26)]: true,
      [utils.asGridCoord(24, 25)]: true,
      [utils.asGridCoord(24, 24)]: true,
      [utils.asGridCoord(24, 23)]: true,
      [utils.asGridCoord(24, 22)]: true,

      // back wall
      [utils.asGridCoord(25, 21)]: true,
      [utils.asGridCoord(26, 21)]: true,
      [utils.asGridCoord(27, 21)]: true,
      [utils.asGridCoord(28, 21)]: true,
      [utils.asGridCoord(29, 21)]: true,
      [utils.asGridCoord(30, 21)]: true,
      [utils.asGridCoord(31, 21)]: true,
      [utils.asGridCoord(32, 21)]: true,
      [utils.asGridCoord(33, 21)]: true,
      [utils.asGridCoord(34, 21)]: true,
      [utils.asGridCoord(35, 21)]: true,
      [utils.asGridCoord(36, 21)]: true,
      [utils.asGridCoord(37, 21)]: true,
      [utils.asGridCoord(38, 21)]: true,
      [utils.asGridCoord(39, 21)]: true,

      // right wall
      [utils.asGridCoord(40, 36)]: true,
      [utils.asGridCoord(40, 35)]: true,
      [utils.asGridCoord(40, 34)]: true,
      [utils.asGridCoord(40, 33)]: true,
      [utils.asGridCoord(40, 32)]: true,
      [utils.asGridCoord(40, 31)]: true,
      [utils.asGridCoord(40, 30)]: true,
      [utils.asGridCoord(40, 29)]: true,
      [utils.asGridCoord(40, 28)]: true,
      [utils.asGridCoord(40, 27)]: true,
      [utils.asGridCoord(40, 26)]: true,
      [utils.asGridCoord(40, 25)]: true,
      [utils.asGridCoord(40, 24)]: true,
      [utils.asGridCoord(40, 23)]: true,
      [utils.asGridCoord(40, 22)]: true,
      [utils.asGridCoord(39, 37)]: true,
      [utils.asGridCoord(38, 37)]: true,
      [utils.asGridCoord(37, 37)]: true,
      [utils.asGridCoord(36, 37)]: true,
      [utils.asGridCoord(35, 37)]: true,
      [utils.asGridCoord(34, 37)]: true,
      [utils.asGridCoord(34, 38)]: true,
      [utils.asGridCoord(34, 39)]: true,
      [utils.asGridCoord(35, 40)]: true,
      [utils.asGridCoord(36, 41)]: true,
      [utils.asGridCoord(36, 42)]: true,
      [utils.asGridCoord(36, 43)]: true,
      [utils.asGridCoord(35, 44)]: true,
      [utils.asGridCoord(34, 45)]: true,
      [utils.asGridCoord(34, 46)]: true,
      [utils.asGridCoord(34, 47)]: true,
      [utils.asGridCoord(35, 47)]: true,
      [utils.asGridCoord(36, 47)]: true,
      [utils.asGridCoord(37, 47)]: true,
      [utils.asGridCoord(38, 48)]: true,
      [utils.asGridCoord(38, 49)]: true,
      [utils.asGridCoord(38, 50)]: true,
      [utils.asGridCoord(38, 51)]: true,
      [utils.asGridCoord(38, 52)]: true,
      [utils.asGridCoord(38, 53)]: true,
      [utils.asGridCoord(38, 54)]: true,

      // desk and cones
      [utils.asGridCoord(31, 52)]: true,
      [utils.asGridCoord(32, 52)]: true,
      [utils.asGridCoord(33, 52)]: true,
      [utils.asGridCoord(31, 51)]: true,
      [utils.asGridCoord(32, 51)]: true,
      [utils.asGridCoord(33, 51)]: true,

      [utils.asGridCoord(34, 49)]: true,
      [utils.asGridCoord(30, 48)]: true,

      // well
      [utils.asGridCoord(31, 43)]: true,
      [utils.asGridCoord(32, 43)]: true,
      [utils.asGridCoord(33, 43)]: true,

      [utils.asGridCoord(31, 41)]: true,
      [utils.asGridCoord(32, 41)]: true,
      [utils.asGridCoord(33, 41)]: true,

      [utils.asGridCoord(31, 42)]: true,
      [utils.asGridCoord(33, 42)]: true,

      // seats
      [utils.asGridCoord(27, 25)]: true,
      [utils.asGridCoord(28, 25)]: true,
      [utils.asGridCoord(29, 25)]: true,

      [utils.asGridCoord(27, 27)]: true,
      [utils.asGridCoord(28, 27)]: true,
      [utils.asGridCoord(29, 27)]: true,

      [utils.asGridCoord(27, 26)]: true,
      [utils.asGridCoord(29, 26)]: true,

      [utils.asGridCoord(27, 31)]: true,
      [utils.asGridCoord(28, 31)]: true,
      [utils.asGridCoord(29, 31)]: true,

      [utils.asGridCoord(27, 33)]: true,
      [utils.asGridCoord(28, 33)]: true,
      [utils.asGridCoord(29, 33)]: true,

      [utils.asGridCoord(27, 32)]: true,
      [utils.asGridCoord(29, 32)]: true,

      [utils.asGridCoord(35, 25)]: true,
      [utils.asGridCoord(36, 25)]: true,
      [utils.asGridCoord(37, 25)]: true,

      [utils.asGridCoord(35, 27)]: true,
      [utils.asGridCoord(36, 27)]: true,
      [utils.asGridCoord(37, 27)]: true,

      [utils.asGridCoord(35, 26)]: true,
      [utils.asGridCoord(37, 26)]: true,

      [utils.asGridCoord(35, 31)]: true,
      [utils.asGridCoord(36, 31)]: true,
      [utils.asGridCoord(37, 31)]: true,

      [utils.asGridCoord(35, 33)]: true,
      [utils.asGridCoord(36, 33)]: true,
      [utils.asGridCoord(37, 33)]: true,

      [utils.asGridCoord(35, 32)]: true,
      [utils.asGridCoord(37, 32)]: true,
    },
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

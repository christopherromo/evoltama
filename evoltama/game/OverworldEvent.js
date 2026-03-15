/*
  this file contains the OverworldEvent class, which is used to handle events that occur on the overworld map.
*/

class OverworldEvent {
  constructor({ map, event }) {
    this.map = map;
    this.event = event;
  }

  // when a game object is standing
  stand(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: "stand",
        direction: this.event.direction,
        time: this.event.time,
      }
    );

    // set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonStandComplete", completeHandler);
        resolve();
      }
    };
    document.addEventListener("PersonStandComplete", completeHandler);
  }

  // when a game object is walking
  walk(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: "walk",
        direction: this.event.direction,
        retry: true,
      }
    );

    // set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonWalkingComplete", completeHandler);
        resolve();
      }
    };
    document.addEventListener("PersonWalkingComplete", completeHandler);
  }

  // text message that can appear on the screen
  textMessage(resolve) {
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(
        this.map.gameObjects["hero"].direction
      );
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve(),
    });
    message.init(document.querySelector(".game-container"));
  }

  removeWall(resolve) {
    const coord = utils.asGridCoord(this.event.x, this.event.y);
    delete this.map.walls[coord];
    resolve();
  }

  // change the current map
  changeMap(resolve) {
    // deactivate old objects
    Object.values(this.map.gameObjects).forEach((obj) => {
      obj.isMounted = false;
    });

    const sceneTransition = new SceneTransition();
    sceneTransition.init(document.querySelector(".game-container"), () => {
      this.map.overworld.startMap(window.OverworldMaps[this.event.map], {
        x: this.event.x,
        y: this.event.y,
        direction: this.event.direction,
      });
      resolve();

      sceneTransition.fadeOut();
    });
  }

  // puts the game into battle mode
  battle(resolve) {
    const battle = new Battle({
      enemy: Enemies[this.event.enemyId],
      map: this.map,
      onComplete: (didWin) => {
        resolve(didWin ? "WON_BATTLE" : "LOST_BATTLE");
      },
      battleBackgroundSrc: this.map.battleBackgroundSrc,
    });

    battle.init(document.querySelector(".game-container"));
  }

  pause(resolve) {
    this.map.isPaused = true;

    const menu = new PauseMenu({
      progress: this.map.overworld.progress,
      onComplete: () => {
        resolve();
        this.map.isPaused = false;
        this.map.overworld.startGameLoop();
      },
    });
    menu.init(document.querySelector(".game-container"));
  }

  addStoryFlag(resolve) {
    window.playerState.storyFlags[this.event.flag] = true;
    resolve();
  }

  evoliskMenu(resolve) {
    const menu = new EvoliskMenu({
      evolisks: this.event.evolisks,
      onComplete: () => {
        resolve();
      },
    });
    menu.init(document.querySelector(".game-container"));
  }

  // puts the game into a wild battle
  async wildBattle(resolve) {
    // pick a random wild evolisk id
    const wildId = utils.randomFromArray([
      "ee001",
      "ee002",
      "ee003",
      "ee004",
      "ee005",
      "ee006",
      "ee007",
      "ee008",
    ]);

    const battle = new Battle({
      map: this.map,
      enemy: {
        name: "Wild " + window.Evolisks[wildId].name,
        src: window.Evolisks[wildId].src,
        evolisks: {
          [wildId]: {
            evoliskId: wildId,
            hp: 30,
            maxHp: 30,
            level: 1,
            xp: 0,
            maxXp: 100,
            status: null,
          },
        },
      },
      isWildEncounter: true,
      battleBackgroundSrc: this.map.battleBackgroundSrc,
      onComplete: (didWin) => {
        if (didWin) {
          resolve("WON_WILD_BATTLE");
        } else {
          resolve("LOST_WILD_BATTLE");
        }
      },
    });

    battle.init(document.querySelector(".game-container"));
  }

  // initiates the desired event
  init() {
    return new Promise((resolve) => {
      this[this.event.type](resolve);
    });
  }
}

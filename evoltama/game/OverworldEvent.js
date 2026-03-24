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
      },
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
      },
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
        this.map.gameObjects["hero"].direction,
      );
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve(),
    });
    message.init(document.querySelector(".game-container"));
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
      onComplete: (outcome) => {
        if (outcome === "player") {
          resolve("WON_BATTLE");
          return;
        }

        if (outcome === "enemy") {
          resolve("LOST_BATTLE");
          requestAnimationFrame(() => {
            this.map.teleportToHealingArea();
          });
          return;
        }

        resolve("RAN_BATTLE");
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

  addItem(resolve) {
    const actionId = window.playerState.normalizeItemActionId(
      this.event.actionId,
    );
    const quantity = this.event.quantity || 1;

    for (let i = 0; i < quantity; i++) {
      window.playerState.items.push({
        actionId,
        instanceId: `${actionId}_${Date.now()}_${Math.floor(Math.random() * 99999)}_${i}`,
      });
    }

    resolve();
  }

  evoliskMenu(resolve) {
    const menu = new EvoliskMenu({
      evolisks: this.event.evolisks,
      rewardConfig: this.event.rewardConfig,
      onComplete: () => {
        resolve();
      },
    });
    menu.init(document.querySelector(".game-container"));
  }

  // puts the game into a wild battle
  async wildBattle(resolve) {
    const defaultEncounterConfig = {
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
      minLevel: 1,
      maxLevel: 1,
    };
    const encounterConfig =
      this.map.wildEncounterConfig || defaultEncounterConfig;
    const wildId = utils.randomFromArray(
      encounterConfig.evoliskIds?.length
        ? encounterConfig.evoliskIds
        : defaultEncounterConfig.evoliskIds,
    );
    const minLevel = encounterConfig.minLevel || 1;
    const maxLevel = encounterConfig.maxLevel || minLevel;
    const wildLevel =
      Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

    const baseWildStats = {
      maxHp: 30,
      level: wildLevel,
      xp: 0,
      maxXp: 100,
      status: null,
    };

    // pick a random wild evolisk id
    const battle = new Battle({
      map: this.map,
      enemy: {
        name: "Wild " + window.Evolisks[wildId].name,
        src: window.Evolisks[wildId].src,
        evolisks: {
          [wildId]: {
            evoliskId: wildId,
            ...baseWildStats,
          },
        },
      },
      isWildEncounter: true,
      battleBackgroundSrc: this.map.battleBackgroundSrc,
      onComplete: (outcome) => {
        if (outcome === "player") {
          resolve("WON_WILD_BATTLE");
          return;
        }

        if (outcome === "enemy") {
          resolve("LOST_WILD_BATTLE");
          requestAnimationFrame(() => {
            this.map.teleportToHealingArea();
          });
          return;
        }

        resolve("RAN_BATTLE");
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

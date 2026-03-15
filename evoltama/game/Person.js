/*
  this file contains the Person class, which is used to create characters in the game.
*/

class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;
    this.isStanding = false;
    this.intentPosition = null; // [x,y]

    this.isPlayerControlled = config.isPlayerControlled || false;

    this.isPerson = true;

    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
  }

  mount(map) {
    this.map = map;
    super.mount(map); // <--- call the parent GameObject's mount function too
  }

  // updates the character's state
  update(state) {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      // more cases for starting to walk will come here

      // case: we're keyboard ready and have an arrow pressed
      if (
        !state.map.isCutscenePlaying &&
        this.isPlayerControlled &&
        state.arrow
      ) {
        this.startBehavior(state, {
          type: "walk",
          direction: state.arrow,
        });
      }
      this.updateSprite(state);
    }
  }

  // starts the character's behavior
  startBehavior(state, behavior) {
    if (!this.isMounted) {
      return;
    }

    // set character direction to whatever behavior has
    this.direction = behavior.direction;

    if (behavior.type === "walk") {
      // stop here if space is not free
      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        behavior.retry &&
          setTimeout(() => {
            this.startBehavior(state, behavior);
          }, 10);

        return;
      }

      // ready to walk!
      this.movingProgressRemaining = 16;

      // add next position intent
      const intentPosition = utils.nextPosition(this.x, this.y, this.direction);

      this.intentPosition = [intentPosition.x, intentPosition.y];

      this.updateSprite(state);
    }

    if (behavior.type === "stand") {
      this.isStanding = true;
      setTimeout(() => {
        utils.emitEvent("PersonStandComplete", {
          whoId: this.id,
        });
        this.isStanding = false;
      }, behavior.time);
    }
  }

  // updates the character's position
  updatePosition() {
    const [property, change] = this.directionUpdate[this.direction];
    this[property] += change;
    this.movingProgressRemaining -= 1;

    if (this.movingProgressRemaining === 0) {
      // we finished the walk!
      this.intentPosition = null;
      utils.emitEvent("PersonWalkingComplete", {
        whoId: this.id,
      });

      if (this.isPlayerControlled) {
        const heroTileX = Math.floor(this.x / 16);
        const heroTileY = Math.floor(this.y / 16);

        this.checkForWildEncounter();
      }
    }
  }

  // updates the character's sprite
  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation("walk-" + this.direction);
      return;
    }
    this.sprite.setAnimation("idle-" + this.direction);
  }

  checkForWildEncounter() {
    const hero = this.map.gameObjects["hero"];
    const heroTileX = Math.floor(hero.x / 16);
    const heroTileY = Math.floor(hero.y / 16);

    if (
      !this.map.wildEncounterAreas ||
      this.map.wildEncounterAreas.length === 0
    ) {
      return;
    }

    // first: check if hero is in any excluded area
    const isExcluded = this.map.wildEncounterAreas.some((area) => {
      if (!area.exclude) return false;
      return (
        area.xMin <= heroTileX &&
        heroTileX <= area.xMax &&
        area.yMin <= heroTileY &&
        heroTileY <= area.yMax
      );
    });

    if (isExcluded) {
      return; // exit early if excluded
    }

    // then: check if hero is inside any allowed wild encounter area
    const isInWildEncounterArea = this.map.wildEncounterAreas.some((area) => {
      if (area.exclude) return false;
      return (
        area.xMin <= heroTileX &&
        heroTileX <= area.xMax &&
        area.yMin <= heroTileY &&
        heroTileY <= area.yMax
      );
    });

    if (isInWildEncounterArea) {
      // set encounter chance
      const encounterChance = 0.1; // 5% chance
      if (Math.random() < encounterChance) {
        utils.emitEvent("WildEncounter");
      }
    } else {
    }
  }
}

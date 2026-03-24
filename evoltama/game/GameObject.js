/*
  this file contains the GameObject class, which is used to create game objects in the game.
*/

class GameObject {
  constructor(config) {
    this.id = null;
    this.isPerson = false;
    this.isMounted = false;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || "down";

    // sprite setup
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src || "./images/characters/people/kairo.png",
    });

    this.behaviorLoop = config.behaviorLoop || [];
    this.behaviorLoopIndex = 0;
    this.talking = config.talking || [];
    this.retryTimeout = null;
    this.behaviorLoopInProgress = false;
  }

  mount(map) {
    this.isMounted = true;

    // if we have a behavior, kick off after a short delay
    setTimeout(() => {
      if (this.isMounted) {
        this.doBehaviorEvent(map);
      }
    }, 10);
  }

  update() {}

  async doBehaviorEvent(map) {
    if (this.behaviorLoopInProgress) {
      return;
    }

    this.behaviorLoopInProgress = true;

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (!this.isMounted) {
      this.behaviorLoopInProgress = false;
      return;
    }

    if (this.behaviorLoop.length === 0) {
      this.behaviorLoopInProgress = false;
      return;
    }

    if (map.isCutscenePlaying) {
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      this.retryTimeout = setTimeout(() => {
        this.behaviorLoopInProgress = false;
        this.retryTimeout = null;
        this.doBehaviorEvent(map);
      }, 1000);

      this.behaviorLoopInProgress = false;
      return;
    }

    // setting up our event with relevant info
    let eventConfig = {
      ...this.behaviorLoop[this.behaviorLoopIndex],
      who: this.id,
    };

    // create an event instance out of our next event config
    const eventHandler = new OverworldEvent({ map, event: eventConfig });
    await eventHandler.init();

    if (!this.isMounted) {
      this.behaviorLoopInProgress = false;
      return;
    }

    // setting the next event to fire
    this.behaviorLoopIndex += 1;
    if (this.behaviorLoopIndex === this.behaviorLoop.length) {
      this.behaviorLoopIndex = 0;
    }

    // do it again!
    this.behaviorLoopInProgress = false;
    this.doBehaviorEvent(map);
  }
}

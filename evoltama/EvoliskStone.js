/*
  this file contains the EvoliskStone class, which is used to manage the evolisk stone in the game.
*/

class EvoliskStone extends GameObject {
  constructor(config) {
    super(config);
    this.sprite = new Sprite({
      gameObject: this,
      src: "./images/characters/evolisk-stone.png",
      animations: {
        "used-down": [[0, 0]],
        "unused-down": [[1, 0]],
      },
      currentAnimation: "used-down",
    });
    this.storyFlag = config.storyFlag;
    this.evolisks = config.evolisks;

    this.talking = [
      {
        required: [this.storyFlag],
        events: [
          {
            type: "textMessage",
            text: "You have already used this! You can't have ANOTHER Evolisk for free! Not in this economy...",
          },
        ],
      },
      {
        events: [
          {
            type: "textMessage",
            text: "You see two disks sitting on the stone, one appears to be calling your name...",
          },
          { type: "evoliskMenu", evolisks: this.evolisks },
          { type: "addStoryFlag", flag: this.storyFlag },
        ],
      },
    ];
  }

  update() {
    this.sprite.currentAnimation = playerState.storyFlags[this.storyFlag]
      ? "used-down"
      : "unused-down";
  }
}

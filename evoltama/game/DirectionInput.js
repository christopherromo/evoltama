/*
  this file contains the DirectionInput class, which is used to listen for directional input in the game.
*/

class DirectionInput {
  constructor() {
    this.heldDirections = [];

    // map of possible inputs
    this.map = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };
  }

  // returns the direction
  get direction() {
    return this.heldDirections[0];
  }

  // call class functions
  init() {
    // key is pressed
    document.addEventListener("keydown", (e) => {
      const dir = this.map[e.code];
      if (dir && this.heldDirections.indexOf(dir) === -1) {
        this.heldDirections.unshift(dir);
      }
    });

    // key is released
    document.addEventListener("keyup", (e) => {
      const dir = this.map[e.code];
      const index = this.heldDirections.indexOf(dir);
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    });
  }
}

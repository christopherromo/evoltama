/*
  this file contains the KeyPressListener class, which is used to listen for key presses in the game.
*/

class KeyPressListener {
  constructor(keyCode, callback) {
    // will be disabled until key is released
    let keySafe = true;

    // key is pressed
    this.keydownFunction = function (event) {
      // if code matches the key code passed in
      if (event.code === keyCode) {
        // key is free
        if (keySafe) {
          // disable
          keySafe = false;
          callback();
        }
      }
    };

    // key is released
    this.keyupFunction = function (event) {
      // if code matched the key code passed in
      if (event.code === keyCode) {
        // enable
        keySafe = true;
      }
    };

    // event listeners
    document.addEventListener("keydown", this.keydownFunction);
    document.addEventListener("keyup", this.keyupFunction);
  }

  // once finished, remove event listeners
  unbind() {
    document.removeEventListener("keydown", this.keydownFunction);
    document.removeEventListener("keyup", this.keyupFunction);
  }
}

/*
  this file contains the RevealingText class, which is used to reveal text in the game.
*/

class RevealingText {
  constructor(config) {
    this.element = config.element;
    this.text = config.text;
    this.speed = config.speed || 60;

    this.timeout = null;
    this.isDone = false;
  }

  // takes in a list and reveals each character
  revealOneCharacter(list) {
    const next = list.splice(0, 1)[0];
    next.span.classList.add("revealed");

    if (list.length > 0) {
      this.timeout = setTimeout(() => {
        this.revealOneCharacter(list);
      }, next.delayAfter);
    } else {
      this.isDone = true;
    }
  }

  // reveals the entire message
  warpToDone() {
    clearTimeout(this.timeout);
    this.isDone = true;
    this.element.querySelectorAll("span").forEach((s) => {
      s.classList.add("revealed");
    });
  }

  // calls class functions
  init() {
    let characters = [];
    this.text.split("").forEach((character) => {
      // create each span, add to element in dom
      let span = document.createElement("span");
      span.textContent = character;
      this.element.appendChild(span);

      // add this span to our internal state array
      characters.push({
        span,
        delayAfter: character === " " ? 0 : this.speed,
      });
    });

    this.revealOneCharacter(characters);
  }
}

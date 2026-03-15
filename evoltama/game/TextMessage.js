/*
  this file contains the TextMessage class, which is used to display text messages in the game.
*/

class TextMessage {
  constructor({ text, onComplete }) {
    this.text = text;
    this.onComplete = onComplete;
    this.element = null;
  }

  // creates text message block element in game
  createElement() {
    // create the element
    this.element = document.createElement("div");
    this.element.classList.add("TextMessage");
    this.element.innerHTML = `
            <p class="TextMessage_p"></p>
            <button class="TextMessage_button">Next</button>
        `;

    // initiates the typewriter effect
    this.revealingText = new RevealingText({
      element: this.element.querySelector(".TextMessage_p"),
      text: this.text,
    });

    // close the text message once button is clicked
    this.element.querySelector("button").addEventListener("click", () => {
      this.done();
    });

    // allow for the "enter" key to close the text message
    this.actionListener = new KeyPressListener("Enter", () => {
      this.done();
    });
  }

  done() {
    // if the text is done being revealed, remove the element and unbind the action listener
    if (this.revealingText.isDone) {
      this.element.remove();
      this.actionListener.unbind();
      this.onComplete();
    } else {
      this.revealingText.warpToDone();
    }
  }

  // call class functions
  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init();
  }
}

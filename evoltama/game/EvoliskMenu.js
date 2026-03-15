/*
  this file contains the EvoliskMenu class, which is used to manage the evolisk menu in the game.
*/

class EvoliskMenu {
  constructor({ evolisks, onComplete }) {
    this.evolisks = evolisks;
    this.onComplete = onComplete;
  }

  getOptions() {
    return this.evolisks.map((id) => {
      const base = Evolisks[id];

      return {
        label: base.name,
        description: base.description,
        handler: () => {
          playerState.addEvolisk(id);
          this.close();
        },
      };
    });
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("EvoliskMenu");
    this.element.classList.add("overlayMenu");
    this.element.innerHTML = `
            <h2>Select an Evolisk</h2>    
        `;
  }

  close() {
    this.keyboardMenu.end();
    this.element.remove();
    this.onComplete();
  }

  init(container) {
    this.createElement();
    this.keyboardMenu = new KeyboardMenu({
      descriptionContainer: container,
    });
    this.keyboardMenu.init(this.element);
    this.keyboardMenu.setOptions(this.getOptions());

    container.appendChild(this.element);
  }
}

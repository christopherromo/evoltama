/*
  this file contains the PauseMenu class, which is used to manage the pause menu in the game.
*/

class PauseMenu {
  constructor({ progress, onComplete }) {
    this.progress = progress;
    this.onComplete = onComplete;
  }

  getOptions(pageKey) {
    if (pageKey === "root") {
      // case 1: show the first page of options
      const lineupEvolisks = playerState.lineup.map((id) => {
        const { evoliskId } = playerState.evolisks[id];
        const base = Evolisks[evoliskId];
        return {
          label: base.name,
          description: base.description,
          handler: () => {
            this.keyboardMenu.setOptions(this.getOptions(id));
          },
        };
      });
      return [
        ...lineupEvolisks,
        {
          label: "Save",
          description: "Save your progress",
          handler: () => {
            this.progress.save();
            this.close();
          },
        },
        {
          label: "Close",
          description: "Close the pause menu",
          handler: () => {
            this.close();
          },
        },
      ];
    }

    // case 2: show the options for just one evolisk (by id)
    const unequipped = Object.keys(playerState.evolisks)
      .filter((id) => {
        return playerState.lineup.indexOf(id) === -1;
      })
      .map((id) => {
        const { evoliskId } = playerState.evolisks[id];
        const base = Evolisks[evoliskId];
        return {
          label: `Swap for ${base.name}`,
          description: base.description,
          handler: () => {
            playerState.swapLineup(pageKey, id);
            this.keyboardMenu.setOptions(this.getOptions("root"));
          },
        };
      });
    return [
      ...unequipped,
      {
        label: "Move to front",
        description: "Move this Evolisk to the front of the list",
        handler: () => {
          playerState.moveToFront(pageKey);
          this.keyboardMenu.setOptions(this.getOptions("root"));
        },
      },
      {
        label: "Back",
        description: "Back to root menu",
        handler: () => {
          this.keyboardMenu.setOptions(this.getOptions("root"));
        },
      },
    ];
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("PauseMenu");
    this.element.classList.add("overlayMenu");
    this.element.innerHTML = `
            <h2>Pause Menu</h2>
        `;
  }

  close() {
    this.esc?.unbind();
    this.keyboardMenu.end();
    this.element.remove();
    this.onComplete();
  }

  async init(container) {
    this.createElement();
    this.keyboardMenu = new KeyboardMenu({
      descriptionContainer: container,
    });
    this.keyboardMenu.init(this.element);
    this.keyboardMenu.setOptions(this.getOptions("root"));

    container.appendChild(this.element);

    utils.wait(200);
    this.esc = new KeyPressListener("Escape", () => {
      this.close();
    });
  }
}

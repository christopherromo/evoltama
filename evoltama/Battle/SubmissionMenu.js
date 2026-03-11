/*
  this file contains the SubmissionMenu class, which is used to manage the submission menu in the game.
*/

class SubmissionMenu {
  constructor({ caster, enemy, onComplete, items, replacements, battle }) {
    this.caster = caster;
    this.enemy = enemy;
    this.replacements = replacements;
    this.onComplete = onComplete;
    this.battle = battle;

    let quantityMap = {};
    items.forEach((item) => {
      if (item.team === caster.team) {
        let existing = quantityMap[item.actionId];
        if (existing) {
          existing.quantity += 1;
        } else {
          quantityMap[item.actionId] = {
            actionId: item.actionId,
            quantity: 1,
            instanceId: item.instanceId,
          };
        }
      }
    });
    this.items = Object.values(quantityMap);
  }

  getPages() {
    const backOption = {
      label: "Go Back",
      description: "Return to previous page",
      handler: () => {
        this.keyboardMenu.setOptions(this.getPages().root);
      },
    };

    return {
      root: [
        {
          label: "Attack",
          description: "Choose an attack",
          handler: () => {
            this.keyboardMenu.setOptions(this.getPages().attacks);
          },
        },
        {
          label: "Items",
          description: "Choose an item",
          handler: () => {
            this.keyboardMenu.setOptions(this.getPages().items);
          },
        },
        {
          label: "Swap",
          description: "Change to another Evolisk",
          handler: () => {
            this.keyboardMenu.setOptions(this.getPages().replacements);
          },
        },
      ],
      attacks: [
        ...this.caster.actions
          .filter((key) => {
            if (key === "catchNet" && !this.battle.isWildEncounter) {
              return false; // hide "catch net" if it's not a wild battle
            }
            return true;
          })
          .map((key) => {
            const action = Actions[key];
            return {
              label: action.name,
              description: action.description,
              handler: () => {
                this.menuSubmit(action);
              },
            };
          }),
        backOption,
      ],
      items: [
        ...this.items.map((item) => {
          const action = Actions[item.actionId];
          return {
            label: action.name,
            description: action.description,
            right: () => {
              return "x" + item.quantity;
            },
            handler: () => {
              this.menuSubmit(action, item.instanceId);
            },
          };
        }),
        backOption,
      ],
      replacements: [
        ...this.replacements.map((replacement) => {
          return {
            label: replacement.name,
            description: replacement.description,
            handler: () => {
              // swap me in, coach!
              this.menuSubmitReplacement(replacement);
            },
          };
        }),
        backOption,
      ],
    };
  }

  menuSubmitReplacement(replacement) {
    this.keyboardMenu?.end();
    this.onComplete({
      replacement,
    });
  }

  menuSubmit(action, instanceId = null) {
    this.keyboardMenu?.end();

    const target = action.targetType === "friendly" ? this.caster : this.enemy;

    this.onComplete({
      action,
      target,
      instanceId,
    });
  }

  decide() {
    const actionKeys = this.caster.actions || [];
    const availableActions = actionKeys
      .map((key) => window.Actions[key])
      .filter(Boolean);

    const randomAction =
      availableActions[Math.floor(Math.random() * availableActions.length)];

    if (!randomAction) {
      console.error("Enemy has no valid actions.");
      this.onComplete(null);
      return;
    }

    const target =
      randomAction.targetType === "friendly" ? this.caster : this.enemy;

    this.onComplete({
      action: randomAction,
      target,
      caster: this.caster,
    });
  }

  showMenu(container) {
    this.keyboardMenu = new KeyboardMenu();
    this.keyboardMenu.init(container);
    this.keyboardMenu.setOptions(this.getPages().root);
  }

  init(container) {
    if (this.caster.isPlayerControlled) {
      // show some UI
      this.showMenu(container);
    } else {
      this.decide();
    }
  }
}

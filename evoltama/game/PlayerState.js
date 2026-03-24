/*
  this file contains the PlayerState class, which is used to manage the player's state in the game.
*/

class PlayerState {
  constructor() {
    this.evolisks = {};
    this.lineup = [];
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "catchDisc", instanceId: "item3" },
      { actionId: "catchDisc", instanceId: "item4" },
      { actionId: "catchDisc", instanceId: "item5" },
    ];
    this.storyFlags = {};
  }

  normalizeItemActionId(actionId) {
    const legacyActionIds = {
      redPotion: "item_recoverHp",
      greenPotion: "item_recoverStatus",
    };

    return legacyActionIds[actionId] || actionId;
  }

  normalizeItems() {
    this.items = (this.items || []).map((item) => ({
      ...item,
      actionId: this.normalizeItemActionId(item.actionId),
    }));
  }

  getOwnedEvoliskId(evoliskId) {
    const tamedId = evoliskId.replace(/^ee/, "ep");

    if (window.Evolisks?.[tamedId]) {
      return tamedId;
    }

    return evoliskId;
  }

  getEvoliskDisplayName(id) {
    const evolisk = this.evolisks[id];
    if (!evolisk) {
      return "";
    }

    const base = window.Evolisks?.[evolisk.evoliskId];
    if (!base) {
      return evolisk.name || "";
    }

    if (evolisk.name) {
      return evolisk.name;
    }

    if (evolisk.isMutated && base.mutatedName) {
      return base.mutatedName;
    }

    return base.name;
  }

  addEvolisk(evoliskId, config = {}) {
    const ownedEvoliskId = this.getOwnedEvoliskId(evoliskId);
    const newId = `p${Date.now()}` + Math.floor(Math.random() * 99999);
    const level = config.level || 1;
    const baseMaxHp = config.baseMaxHp || 50;
    const scaledMaxHp = Math.floor(baseMaxHp + (level - 1) * 5);
    const maxHp = typeof config.maxHp === "number" ? config.maxHp : scaledMaxHp;
    const hp = typeof config.hp === "number" ? config.hp : maxHp;
    this.evolisks[newId] = {
      evoliskId: ownedEvoliskId,
      baseMaxHp,
      hp,
      maxHp,
      xp: config.xp || 0,
      maxXp: config.maxXp || 100,
      level,
      status: null,
    };

    if (this.lineup.length < 3) {
      this.lineup.push(newId);
    }

    utils.emitEvent("LineupChanged");
  }

  swapLineup(oldId, incomingId) {
    const oldIndex = this.lineup.indexOf(oldId);
    this.lineup[oldIndex] = incomingId;
    utils.emitEvent("LineupChanged");
  }

  moveToFront(futureFrontId) {
    this.lineup = this.lineup.filter((id) => id !== futureFrontId);
    this.lineup.unshift(futureFrontId);
    utils.emitEvent("LineupChanged");
  }
}
window.playerState = new PlayerState();

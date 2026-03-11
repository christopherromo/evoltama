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
      { actionId: "catchDisc", instanceId: "item6" },
      { actionId: "catchDisc", instanceId: "item7" },
    ];
    this.storyFlags = {};
  }

  addEvolisk(evoliskId) {
    const newId = `p${Date.now()}` + Math.floor(Math.random() * 99999);
    this.evolisks[newId] = {
      evoliskId,
      hp: 50,
      maxHp: 50,
      xp: 0,
      maxXp: 100,
      level: 1,
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

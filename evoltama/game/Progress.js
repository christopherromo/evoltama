/*
  this file contains the Progress class, which is used to manage the game progress and save/load functionality.
*/

class Progress {
  constructor() {
    this.mapId = "ForestVillage";
    this.startingHeroX = 0;
    this.startingHeroY = 0;
    this.startingHeroDirection = "down";
    this.saveFileKey = "Evoltama_SaveFile1";
  }

  save() {
    window.localStorage.setItem(
      this.saveFileKey,
      JSON.stringify({
        mapId: this.mapId,
        startingHeroX: this.startingHeroX,
        startingHeroY: this.startingHeroY,
        startingHeroDirection: this.startingHeroDirection,
        playerState: {
          evolisks: playerState.evolisks,
          lineup: playerState.lineup,
          items: playerState.items,
          storyFlags: playerState.storyFlags,
        },
      }),
    );
  }

  getSaveFile() {
    const file = window.localStorage.getItem(this.saveFileKey);
    return file ? JSON.parse(file) : null;
  }

  load() {
    const file = this.getSaveFile();
    if (file) {
      this.mapId = file.mapId;
      this.startingHeroX = file.startingHeroX;
      this.startingHeroY = file.startingHeroY;
      this.startingHeroDirection = file.startingHeroDirection;
      Object.keys(file.playerState).forEach((key) => {
        playerState[key] = file.playerState[key];
      });
    }

    window.playerState.isNewGame = false;
  }
}

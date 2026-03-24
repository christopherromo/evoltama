/*
  this file contains the BattleEvent class, which is used to manage events in the battle.
*/

class BattleEvent {
  constructor(event, battle) {
    this.event = event;
    this.battle = battle;
  }

  textMessage(resolve) {
    const text = this.event.text
      .replace("{CASTER}", this.event.caster?.name)
      .replace("{TARGET}", this.event.target?.name)
      .replace("{ACTION}", this.event.action?.name);

    const message = new TextMessage({
      text,
      onComplete: () => {
        resolve();
      },
    });
    message.init(this.battle.element);
  }

  async stateChange(resolve) {
    const { caster, target, damage, recover, status, action } = this.event;
    let who = this.event.onCaster ? caster : target;

    // dodge check
    if (damage && target.status?.type === "evade") {
      const dodgeMessage = new TextMessage({
        text: `${target.name} dodged the attack!`,
        onComplete: () => {
          resolve();
        },
      });
      dodgeMessage.init(this.battle.element);

      target.update({
        status: null,
      });

      return;
    }

    if (damage) {
      let scaledDamage = damage;

      // if caster exists and has a level, scale damage based on level
      if (caster?.level) {
        scaledDamage = Math.floor(damage + (caster.level - 1) * 6);
      }

      target.update({
        hp: target.hp - scaledDamage,
      });

      target.evoliskElement.classList.add("battle-damage-blink");
    }

    if (recover) {
      let newHp = who.hp + recover;
      if (newHp > who.maxHp) {
        newHp = who.maxHp;
      }
      who.update({
        hp: newHp,
      });
    }

    if (status) {
      who.update({
        status: { ...status },
      });
    }
    if (status === null) {
      who.update({
        status: null,
      });
    }

    await utils.wait(600);

    this.battle.playerTeam.update();
    this.battle.enemyTeam.update();

    target.evoliskElement.classList.remove("battle-damage-blink");
    resolve();
  }

  submissionMenu(resolve) {
    const { caster } = this.event;
    const menu = new SubmissionMenu({
      caster: caster,
      enemy: this.event.enemy,
      items: this.battle.items,
      battle: this.battle,
      replacements: Object.values(this.battle.combatants).filter((c) => {
        return c.id !== caster.id && c.team === caster.team && c.hp > 0;
      }),
      onComplete: (submission) => {
        // submission, what move to use, who to use it on
        resolve(submission);
      },
    });
    menu.init(this.battle.element);
  }

  replacementMenu(resolve) {
    const teamRoster =
      this.event.team === "player"
        ? this.battle.playerTeam.combatants
        : this.battle.enemyTeam.combatants;
    const activeCombatantId = this.battle.activeCombatants[this.event.team];

    const menu = new ReplacementMenu({
      replacements: teamRoster.filter((combatant) => {
        return combatant.hp > 0 && combatant.id !== activeCombatantId;
      }),
      onComplete: (replacement) => {
        resolve(replacement);
      },
    });
    menu.init(this.battle.element);
  }

  async replace(resolve) {
    const { replacement } = this.event;

    // clear out the old combatant
    const prevCombatant =
      this.battle.combatants[this.battle.activeCombatants[replacement.team]];
    this.battle.activeCombatants[replacement.team] = null;
    prevCombatant.update();
    await utils.wait(400);

    // in with the new!
    this.battle.activeCombatants[replacement.team] = replacement.id;
    replacement.update();
    await utils.wait(400);

    // update team components
    this.battle.playerTeam.update();
    this.battle.enemyTeam.update();

    resolve();
  }

  giveXP(resolve) {
    let amount = this.event.xp;
    const { combatant } = this.event;
    const step = async () => {
      if (amount > 0) {
        amount -= 1;
        combatant.xp += 1;

        // check if we've hit level up point
        if (combatant.xp === combatant.maxXp) {
          combatant.xp = 0;
          combatant.maxXp += 25;
          combatant.level += 1;
          combatant.maxHp += 5;
          combatant.hp += 5;

          // show level up message
          await new Promise((res) => {
            const levelUpEvent = new BattleEvent(
              { type: "textMessage", text: `${combatant.name} leveled up!` },
              this.battle,
            );
            levelUpEvent.init(res);
          });

          if (combatant.canMutate && Math.random() < 0.5) {
            const oldName = combatant.name;
            combatant.mutate();

            // persist it to playerState
            const evoliskData = window.playerState.evolisks[combatant.id];
            if (evoliskData) {
              evoliskData.isMutated = true;
              evoliskData.src = combatant.mutatedSrc;
            }

            await new Promise((res) => {
              const mutationEvent = new BattleEvent(
                {
                  type: "textMessage",
                  text: `${oldName} has mutated into ${combatant.name}!`,
                },
                this.battle,
              );
              mutationEvent.init(res);
            });
          }
        }

        combatant.update();
        requestAnimationFrame(step);
        return;
      }

      resolve();
    };
    requestAnimationFrame(step);
  }

  animation(resolve) {
    const fn = BattleAnimations[this.event.animation];
    fn(this.event, resolve);
  }

  attemptCatch(resolve) {
    const enemyTeam = Object.keys(this.battle.activeCombatants).find(
      (team) => team !== "player",
    );
    const enemyId = this.battle.activeCombatants[enemyTeam];
    const target = this.battle.combatants[enemyId];

    if (!target) {
      resolve();
      return;
    }

    const hpPercent = target.hp / target.maxHp;
    const levelPenalty = Math.max(0, (target.level || 1) - 1) * 0.1;
    let baseCatchChance = 1;

    if (hpPercent < 0.25) {
      baseCatchChance = 0.9;
    } else if (hpPercent < 0.5) {
      baseCatchChance = 0.7;
    } else if (hpPercent < 0.75) {
      baseCatchChance = 0.5;
    } else {
      baseCatchChance = 0.3;
    }

    const catchChance = Math.max(0.1, baseCatchChance - levelPenalty);
    const didCatch = Math.random() < catchChance;

    if (didCatch) {
      window.playerState.addEvolisk(target.evoliskId, {
        level: target.level,
      });
      const message = new TextMessage({
        text: `You captured ${target.name}!`,
        onComplete: () => {
          this.battle.turnCycle.onWinner("player");
        },
      });
      message.init(this.battle.element);
    } else {
      const message = new TextMessage({
        text: `Oh no! ${target.name} escaped!`,
        onComplete: async () => {
          const battleElement = this.battle.element;
          battleElement.classList.add("battle-shake");

          await utils.wait(300);

          battleElement.classList.remove("battle-shake");
          resolve();
        },
      });
      message.init(this.battle.element);
    }
  }

  init(resolve) {
    if (this.event.action?.type === "catch") {
      this.attemptCatch(resolve);
      return;
    }

    this[this.event.type](resolve);
  }
}

/*
  this file holds animations for evolisk attacks.
*/

window.BattleAnimations = {
  async spin(event, onComplete) {
    const element = event.caster.evoliskElement;
    const animationClassName =
      event.caster.team === "player" ? "battle-spin-right" : "battle-spin-left";
    element.classList.add(animationClassName);

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove(animationClassName);
        onComplete();
      },
      { once: true },
    );

    await utils.wait(100);
  },

  async paralyzingSpit(event, onComplete) {
    const { caster } = event;
    const div = document.createElement("div");
    div.classList.add("battle-paralyzing-spit");
    div.classList.add(
      caster.team === "player"
        ? "battle-paralyzing-spit-right"
        : "battle-paralyzing-spit-left",
    );

    div.innerHTML = `
      <svg viewBox="0 0 32 32" width="24" height="24">
        <circle cx="16" cy="16" r="10" fill="#dafd2a" />
      </svg>
    `;

    div.addEventListener("animationend", () => {
      div.remove();
    });

    document.querySelector(".Battle").appendChild(div);

    await utils.wait(600);
    onComplete();
  },

  async phantomCharge(event, onComplete) {
    const element = event.caster.evoliskElement;
    const animationClassName =
      event.caster.team === "player"
        ? "battle-phantom-charge-right"
        : "battle-phantom-charge-left";
    element.classList.add(animationClassName);

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove(animationClassName);
        onComplete();
      },
      { once: true },
    );
  },

  async voidHowl(event, onComplete) {
    const element = event.caster.evoliskElement;
    element.classList.add("battle-void-howl");

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("battle-void-howl");
        onComplete();
      },
      { once: true },
    );
  },

  async electricZap(event, onComplete) {
    const element = event.caster.evoliskElement;
    const animationClassName =
      event.caster.team === "player"
        ? "battle-electric-zap-right"
        : "battle-electric-zap-left";
    element.classList.add(animationClassName);

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove(animationClassName);
        onComplete();
      },
      { once: true },
    );
  },

  async vineWhip(event, onComplete) {
    const { caster } = event;
    const div = document.createElement("div");
    div.classList.add("battle-vine-whip");
    div.classList.add(
      caster.team === "player"
        ? "battle-vine-whip-right"
        : "battle-vine-whip-left",
    );

    div.innerHTML = `
      <svg viewBox="0 0 32 32" width="32" height="32">
        <path d="M16 0 C10 10, 22 22, 16 32" stroke="#4CAF50" stroke-width="4" fill="none"/>
      </svg>
    `;

    div.addEventListener("animationend", () => {
      div.remove();
    });

    document.querySelector(".Battle").appendChild(div);

    await utils.wait(820);
    onComplete();
  },

  async shadowVanish(event, onComplete) {
    const element = event.caster.evoliskElement;
    element.classList.add("battle-shadow-vanish");

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("battle-shadow-vanish");
        onComplete();
      },
      { once: true },
    );
  },

  async windBlast(event, onComplete) {
    const element = event.caster.evoliskElement;
    const animationClassName =
      event.caster.team === "player"
        ? "battle-wind-blast-right"
        : "battle-wind-blast-left";
    element.classList.add(animationClassName);

    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove(animationClassName);
        onComplete();
      },
      { once: true },
    );
  },

  async paralyzingDust(event, onComplete) {
    const { caster } = event;
    const container = document.querySelector(".Battle");

    for (let i = 0; i < 8; i++) {
      const dust = document.createElement("div");
      dust.classList.add("battle-paralyzing-dust");
      dust.classList.add(
        caster.team === "player"
          ? "battle-paralyzing-dust-right"
          : "battle-paralyzing-dust-left",
      );

      dust.style.left = `${
        caster.team === "player"
          ? 70 + (Math.random() * 10 - 5)
          : 180 + (Math.random() * 10 - 5)
      }px`;
      dust.style.top = `${
        caster.team === "player"
          ? 105 + (Math.random() * 10 - 5)
          : 65 + (Math.random() * 10 - 5)
      }px`;

      container.appendChild(dust);

      dust.addEventListener("animationend", () => {
        dust.remove();
      });

      await utils.wait(50); // stagger dust creation
    }

    await utils.wait(700);
    onComplete();
  },

  async starShatter(event, onComplete) {
    const { caster } = event;
    const container = document.querySelector(".Battle");

    for (let i = 0; i < 5; i++) {
      const star = document.createElement("div");
      star.classList.add("battle-star");

      // offset starting positions slightly for variety
      const offsetX = Math.random() * 10 - 5;
      const offsetY = Math.random() * 10 - 5;

      star.style.left = `${
        caster.team === "player" ? 70 + offsetX : 180 + offsetX
      }px`;
      star.style.top = `${
        caster.team === "player" ? 105 + offsetY : 65 + offsetY
      }px`;

      star.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="#331944" d="M12 0L14.8 7H22L16 11.2L18.8 18.5L12 14.3L5.2 18.5L8 11.2L2 7H9.2L12 0Z" />
        </svg>
      `;

      container.appendChild(star);

      star.addEventListener("animationend", () => {
        star.remove();
      });

      await utils.wait(80);
    }

    await utils.wait(700);
    onComplete();
  },

  async throwCaptureDisc(event, onComplete) {
    const { caster } = event;
    const container = document.querySelector(".Battle");

    const disc = document.createElement("img");
    disc.src = "./images/tempDisc.png"; // your placeholder disc
    disc.classList.add("capture-disc");
    disc.style.position = "absolute";
    disc.style.width = "24px";
    disc.style.height = "24px";
    disc.style.pointerEvents = "none";
    disc.style.left = `${caster.team === "player" ? 100 : 200}px`;
    disc.style.top = `${caster.team === "player" ? 100 : 70}px`;
    disc.style.transform = "scale(1)";
    container.appendChild(disc);

    // animate flying toward target
    await disc.animate(
      [
        { transform: `translate(0px, 0px) scale(1)` },
        {
          transform: `translate(${caster.team === "player" ? 80 : -80}px, ${
            caster.team === "player" ? -40 : 40
          }px) scale(1.2)`,
        },
      ],
      {
        duration: 500,
        fill: "forwards",
        easing: "ease-out",
      },
    ).finished;

    // bounce animation after landing
    await disc.animate(
      [
        { transform: `scale(1.2) translateY(0px)` },
        { transform: `scale(1.1) translateY(-5px)` },
        { transform: `scale(1) translateY(0px)` },
      ],
      {
        duration: 300,
        easing: "ease-in-out",
      },
    ).finished;

    // now remove disc
    disc.remove();
    onComplete();
  },
};

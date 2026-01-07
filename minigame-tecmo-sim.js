/* ===============================
   TECMO SIM 2.0 — FULL REWRITE
   SIMULATION ONLY
================================ */

const FIELD = {
  width: 800,
  height: 420,
  endzone: 60
};

class Team {
  constructor(name, offense, defense, color) {
    this.name = name;
    this.offense = offense;
    this.defense = defense;
    this.color = color;
    this.score = 0;
  }
}

class GameState {
  constructor(home, away) {
    this.home = home;
    this.away = away;
    this.possession = home;
    this.defense = away;
    this.ballOn = 25;
    this.down = 1;
    this.toGo = 10;
    this.quarter = 1;
    this.clock = 900;
    this.log = [];
    this.finished = false;
  }
}

class GameEngine {
  constructor(home, away) {
    this.state = new GameState(home, away);
  }

  callPlay(type) {
    if (this.state.finished) return;

    const offense = this.state.possession;
    const defense = this.state.defense;

    let base =
      offense.offense -
      defense.defense +
      Math.random() * 30;

    let yards = 0;
    let turnover = false;

    if (type === "run") {
      yards = Math.floor(base * 0.3);
    } else {
      yards = Math.floor(base * 0.5);
      if (Math.random() < 0.08) turnover = true;
    }

    yards = Math.max(-5, Math.min(yards, 60));
    this.resolvePlay(yards, turnover, type);
  }

  resolvePlay(yards, turnover, type) {
    this.state.clock -= Math.floor(20 + Math.random() * 20);

    if (turnover) {
      this.log(`${type.toUpperCase()} → INTERCEPTION!`);
      this.switchPossession();
      return;
    }

    this.state.ballOn += yards;
    this.state.toGo -= yards;

    if (this.state.ballOn >= 100) {
      this.touchdown();
      return;
    }

    if (this.state.toGo <= 0) {
      this.state.down = 1;
      this.state.toGo = 10;
      this.log(`${type} for ${yards} yards — FIRST DOWN`);
    } else {
      this.state.down++;
      if (this.state.down > 4) {
        this.log("Turnover on downs");
        this.switchPossession();
      } else {
        this.log(`${type} for ${yards} yards`);
      }
    }

    if (this.state.clock <= 0) this.nextQuarter();
  }

  touchdown() {
    this.state.possession.score += 7;
    this.log(`🏈 TOUCHDOWN ${this.state.possession.name}!`);
    this.switchPossession(true);
  }

  switchPossession(reset = false) {
    [this.state.possession, this.state.defense] =
      [this.state.defense, this.state.possession];
    this.state.ballOn = reset ? 25 : 100 - this.state.ballOn;
    this.state.down = 1;
    this.state.toGo = 10;
  }

  nextQuarter() {
    this.state.quarter++;
    this.state.clock = 900;
    if (this.state.quarter > 4) {
      this.state.finished = true;
      this.log("🏁 FINAL");
    }
  }

  log(msg) {
    this.state.log.unshift(msg);
    render();
  }
}

/* ===============================
   RENDERING
================================ */

const canvas = document.getElementById("field");
const ctx = canvas.getContext("2d");

function drawField(state) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);

  ctx.fillStyle = "#1e7f34";
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  for (let i = 0; i <= 100; i += 10) {
    let x = FIELD.endzone + (i / 100) * (FIELD.width - FIELD.endzone * 2);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }

  const ballX =
    FIELD.endzone +
    (state.ballOn / 100) *
    (FIELD.width - FIELD.endzone * 2);

  ctx.fillStyle = "brown";
  ctx.beginPath();
  ctx.arc(ballX, FIELD.height / 2, 6, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawField(game.state);
  document.getElementById("score").textContent =
    `${game.state.home.name} ${game.state.home.score} - ${game.state.away.score} ${game.state.away.name}`;
  document.getElementById("meta").textContent =
    `Q${game.state.quarter} | ${Math.floor(game.state.clock / 60)}:${String(game.state.clock % 60).padStart(2, "0")} | ${game.state.down}&${game.state.toGo}`;
  document.getElementById("log").innerHTML =
    game.state.log.slice(0, 6).map(l => `<div>${l}</div>`).join("");
}

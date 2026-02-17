import { rollTestDialog } from "./rolls.mjs";
import { ClandestinoEmployeeSheet } from "./employee-sheet.mjs";

Hooks.once("init", () => {
  console.log("CLANDESTINO | init");

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("clandestino", ClandestinoEmployeeSheet, {
    types: ["character"],
    makeDefault: true,
    label: "Ficha Corporativa (Funcionário)"
  });
});

Hooks.on("prepareActorData", (actor) => {
  if (!actor.system?.attributes) return;
  const s = actor.system;
  const attrs = s.attributes;

  const fib = Number(attrs.fib?.value ?? 1);
  const rob = Number(attrs.rob?.value ?? 1);

  // PV
  const pvMax = rob * 3;
  s.derived ??= {};
  s.derived.pv ??= {};
  s.derived.pv.max = pvMax;
  if (s.derived.pv.value == null) s.derived.pv.value = pvMax;

  // BPM
  const bpmBase = 60 - (fib * 5);
  s.derived.bpm ??= {};
  if (s.derived.bpm.value == null) s.derived.bpm.value = bpmBase;
  s.derived.bpm.base = bpmBase;
});

Hooks.once("ready", async () => {
  game.clandestino ??= {};
  game.clandestino.rollTestDialog = rollTestDialog;

  // Load rules.json to label skills (id -> name)
  try {
    const res = await fetch("systems/clandestino/rules.clandestino.json");
    if (res.ok) {
      const rules = await res.json();
      game.clandestino.rules = rules;

      const labels = {};
      for (const a of Object.values(rules.attributes ?? {})) {
        for (const sk of (a.skills ?? [])) labels[sk.id] = sk.name;
      }
      game.clandestino.skillLabels = labels;
    }
  } catch (err) {
    console.warn("CLANDESTINO | failed to load rules JSON", err);
  }

  console.log("CLANDESTINO | ready (game.clandestino.rollTestDialog)");
});

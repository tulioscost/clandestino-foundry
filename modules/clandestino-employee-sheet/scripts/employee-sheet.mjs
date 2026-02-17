/**
 * CLANDESTINO — Ficha Corporativa (Funcionário)
 * Módulo: clandestino-employee-sheet
 *
 * - Registra uma ActorSheet para "character" quando o sistema ativo for "clandestino"
 * - Usa template e CSS do módulo
 * - Integra com o macro/rolagem do sistema, se disponível (game.clandestino.rollTestDialog)
 */

const TEMPLATE = "modules/clandestino-employee-sheet/templates/actor/employee-sheet.hbs";

class ClandestinoEmployeeSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["clandestino", "sheet", "employee"],
      template: TEMPLATE,
      width: 860,
      height: 900,
      resizable: true
    });
  }

  getData(options) {
    const data = super.getData(options);
    const s = data.actor.system ?? (data.actor.system = {});

    // These fields are expected by the sheet. If the system doesn't provide them in template.json,
    // we still render safely.
    s.identity ??= { path: "", track: "", trackLevel: 0, credit: 0 };

    s.physical ??= {};
    s.physical.condition ??= { value: "Saudável", options: ["Saudável", "Ferido", "Crítico", "Caído"] };

    s.psy ??= {};
    s.psy.state ??= { value: "Estável", options: ["Estável", "Ansioso", "Sob estresse", "Risco de colapso"] };
    s.psy.faith ??= "";
    s.psy.secret ??= "";

    s.talents ??= { l1: "", l3: "", l6: "", l9: "", l12: "" };
    s.traumas ??= ["", "", ""];

    s.gear ??= { primary: "", secondary: "", armor: "", extra: "" };

    s.substances ??= {};
    s.substances.active ??= "";
    s.substances.dependency ??= { value: "Nenhuma", options: ["Nenhuma", "Leve", "Grave"] };
    s.substances.medical ??= "";

    s.report ??= "";

    // Skills list with labels from rules.json if the system exposed them
    const skills = s.skills ?? {};
    const labels = game?.clandestino?.skillLabels ?? {};
    const skillsList = Object.entries(skills).map(([id, obj]) => ({
      id,
      name: labels[id] ?? id,
      value: Number(obj?.value ?? 0)
    })).sort((a,b)=>a.name.localeCompare(b.name, "pt-BR"));

    // BPM ranges (highlight current)
    const bpm = Number(s.derived?.bpm?.value ?? 0);
    const bpmRanges = [
      { range: "60–79", label: "Calmo", min: 60, max: 79 },
      { range: "80–99", label: "Tenso", min: 80, max: 99 },
      { range: "100–119", label: "Ansioso", min: 100, max: 119 },
      { range: "120–149", label: "Pânico", min: 120, max: 149 },
      { range: "150–179", label: "Colapso iminente", min: 150, max: 179 },
      { range: "180–199", label: "Colapso", min: 180, max: 199 },
      { range: "200+", label: "Parada ou surto", min: 200, max: 9999 }
    ].map(r => ({ ...r, active: bpm >= r.min && bpm <= r.max }));

    data.system = s;
    data.system.skillsList = skillsList;
    data.system.bpmRanges = bpmRanges;

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("button.roll-test").on("click", async (ev) => {
      ev.preventDefault();
      // Use system dialog if available
      const fn = game?.clandestino?.rollTestDialog;
      if (typeof fn === "function") return fn(this.actor);
      ui.notifications?.warn("O sistema CLANDESTINO não expôs game.clandestino.rollTestDialog.");
    });
  }
}

Hooks.once("init", async () => {
  // Only run under the CLANDESTINO system
  if (game.system?.id !== "clandestino") return;

  // Preload templates (includes partial)
  await loadTemplates([
    TEMPLATE,
    "modules/clandestino-employee-sheet/templates/partials/attr-row.hbs"
  ]);

  // Register sheet (do NOT force default; user can choose in Sheet Config)
  Actors.registerSheet("clandestino-employee-sheet", ClandestinoEmployeeSheet, {
    types: ["character"],
    makeDefault: false,
    label: "Ficha Corporativa (Funcionário)"
  });

  console.log("CLANDESTINO | módulo de ficha corporativa carregado");
});

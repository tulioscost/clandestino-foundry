import { rollTestDialog } from "./rolls.mjs";

export class ClandestinoEmployeeSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["clandestino", "sheet", "employee"],
      template: "systems/clandestino/templates/actor/employee-sheet.hbs",
      width: 860,
      height: 900,
      resizable: true
    });
  }

  getData(options) {
    const data = super.getData(options);
    const s = data.actor.system ?? (data.actor.system = {});

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

    // Skills list with labels from rules.json if available
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
      await rollTestDialog(this.actor);
    });
  }
}

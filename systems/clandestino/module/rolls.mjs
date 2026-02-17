function scoreDie(d) {
  if (d === 6) return 3;
  if (d === 5 || d === 4) return 1;
  return 0;
}

export async function rollTestDialog(actor) {
  if (!actor) actor = game.user.character;
  if (!actor) return ui.notifications.warn("Selecione um token ou defina um personagem do usuário.");

  const attrs = actor.system.attributes ?? {};
  const attrOptions = Object.keys(attrs).map(k => `<option value="${k}">${k.toUpperCase()}</option>`).join("");
  const skills = actor.system.skills ?? {};
  const skillOptions = Object.keys(skills).map(k => `<option value="${k}">${k}</option>`).join("");

  const content = `
    <form>
      <div class="form-group">
        <label>Atributo</label>
        <select name="attr">${attrOptions}</select>
      </div>
      <div class="form-group">
        <label>Perícia (opcional)</label>
        <select name="skill"><option value="">—</option>${skillOptions}</select>
      </div>
      <div class="form-group">
        <label>Dificuldade (sucessos)</label>
        <input type="number" name="difficulty" value="2" min="0" step="1"/>
      </div>
      <div class="form-group">
        <label>Gastar pontos de perícia</label>
        <input type="number" name="spend" value="0" min="0" step="1"/>
      </div>
    </form>
  `;

  new Dialog({
    title: "CLANDESTINO | Teste",
    content,
    buttons: {
      roll: {
        label: "Rolar",
        callback: async (html) => {
          const form = html[0].querySelector("form");
          const attr = form.attr.value;
          const skill = form.skill.value || null;
          const difficulty = Number(form.difficulty.value || 0);
          const spend = Number(form.spend.value || 0);
          await rollTest(actor, { attr, skill, difficulty, spend });
        }
      }
    },
    default: "roll"
  }).render(true);
}

export async function rollTest(actor, { attr, skill=null, difficulty=0, spend=0 } = {}) {
  const aVal = Number(actor.system.attributes?.[attr]?.value ?? 1);
  const dice = aVal;

  const roll = await (new Roll(`${dice}d6`)).evaluate({async:true});
  const results = roll.dice[0].results.map(r => r.result);

  // compute initial successes
  let successes = results.reduce((acc,d)=>acc+scoreDie(d),0);
  const hasOne = results.includes(1);

  // skill spend: each point turns one failed die (1-3) into a 4 (i.e. +1 success)
  let spendCap = 0;
  if (skill) spendCap = Number(actor.system.skills?.[skill]?.value ?? 0);
  const spendUse = Math.max(0, Math.min(spend, spendCap));

  let fixable = results.filter(d => d <= 3).length;
  const applied = Math.min(spendUse, fixable);
  successes += applied;

  const outcome = (successes >= difficulty) ? "SUCESSO" : "FALHA";
  const majorFail = (successes === 0 && hasOne) ? " (falha maior)" : "";

  const flavor = `
    <b>${outcome}${majorFail}</b><br/>
    Atributo: ${attr.toUpperCase()} (${aVal}d6) ${skill?` | Perícia: ${skill} (gastou ${applied}/${spendCap})`:""}<br/>
    Dificuldade: ${difficulty} | Sucessos: ${successes}<br/>
    Dados: [${results.join(", ")}]
  `;

  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor
  });
}

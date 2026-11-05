"use client";
import { useEffect, useState } from "react";
import * as Blockly from "blockly";
import CodeWorkspace from "@/components/code/CodeWorkspace";
import Icon from "../Icon";
import { useLang } from "@/lib/language";
import { useElio } from "@/lib/useElio";
import { saveProgram, takeOpenRequest, type SavedProgram } from "@/lib/programs";
import { clearProgram, getWorkspace, haltProgram, isRunning, runProgram } from "@/services/codeRunner";

// Phone Blocks page: the SAME Blockly editor and the same program runner as the
// desktop version (drag blocks, snap them together, Run). Only the layout is
// adapted for phones, in app/mobile.css (.mCodeArea).

// Programs saved by the older phone editor were a simple list of blocks.
const OLD_TO_BLOCKLY: Record<string, string> = {
  "green-flag": "elio_start", "move-forward": "elio_move_forward", "move-backward": "elio_move_backward",
  "turn-left": "elio_turn_left", "turn-right": "elio_turn_right", "stop-elio": "elio_stop",
  "set-speed": "elio_speed", wait: "elio_wait",
};
function oldProgramToBlockly(ids: string[]) {
  const types = ids.map((id) => OLD_TO_BLOCKLY[id]).filter(Boolean);
  if (types[0] !== "elio_start") types.unshift("elio_start");  // the runner starts from the Start block
  let chain: any = null;
  for (let i = types.length - 1; i >= 0; i--) chain = { type: types[i], ...(chain ? { next: { block: chain } } : {}) };
  return { blocks: { languageVersion: 0, blocks: [{ ...chain, x: 30, y: 30 }] } };
}

// The runner's messages are in English; these are the ones a child will see.
const ERRORS_RO: Record<string, string> = {
  "Connect ELIO in Robot Control first.": "Conectează mai întâi robotul din pagina Control.",
  "Drag blocks into the workspace first.": "Trage mai întâi blocuri în spațiul de lucru.",
  "Begin the program with the yellow Start block.": "Începe programul cu blocul galben „when Start clicked”.",
  "Bluetooth connection lost.": "S-a pierdut conexiunea Bluetooth.",
  "Program time limit (60 s) reached.": "Programul a ajuns la limita de 60 de secunde.",
  "Stop the program first.": "Oprește mai întâi programul.",
  "Editor not ready.": "Editorul încă se încarcă.",
  "Distance sensor data unavailable.": "Nu am date de la senzorul de distanță.",
  "Division by zero.": "Nu se poate împărți la zero.",
};

export default function MobileCode() {
  const { lang, tr } = useLang();
  const elio = useElio();
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fn = () => setRunning(isRunning());
    window.addEventListener("elio-code-state", fn);
    return () => window.removeEventListener("elio-code-state", fn);
  }, []);

  // Opening a program from Projects. CodeWorkspace (a child) has already made the editor.
  useEffect(() => {
    const p = takeOpenRequest();
    const ws = getWorkspace();
    if (!p || !ws) return;
    try {
      Blockly.serialization.workspaces.load(p.workspace ?? oldProgramToBlockly(p.blocks), ws);
      setCurrent({ id: p.id, name: p.name });
    } catch {
      setMessage(tr("Programul nu a putut fi deschis.", "The program could not be opened."));
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function act(fn: () => Promise<unknown> | void) {
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      if (text === "Program stopped.") return;  // stopped on purpose
      setMessage(lang === "ro" ? ERRORS_RO[text] ?? text : text);
    }
  }

  function save() {
    const ws = getWorkspace();
    if (!ws || !ws.getAllBlocks(false).length) {
      setMessage(tr("Adaugă mai întâi blocuri.", "Add some blocks first."));
      return;
    }
    const fallback = tr("Programul meu", "My program");
    const name = window.prompt(tr("Numele programului:", "Program name:"), current?.name ?? fallback)?.trim();
    if (!name) return;
    const id = current?.id ?? `p${Date.now()}`;
    const program: SavedProgram = {
      id,
      name,
      blocks: ws.getAllBlocks(false).map((b) => b.type),
      workspace: Blockly.serialization.workspaces.save(ws),
      updated: Date.now(),
    };
    saveProgram(program);
    setCurrent({ id, name });
    setMessage(tr(`„${name}” a fost salvat în Proiecte.`, `“${name}” was saved to Projects.`));
  }

  function clear() {
    void act(() => {
      clearProgram();
      setCurrent(null);
    });
  }

  return (
    <div className="mStack mCodePage">
      <section className="mCard mCodeBar">
        <div className="mRow">
          <h2 className="mH2">{current ? current.name : tr("Programul tău", "Your program")}</h2>
          <span className={`mTag ${elio.connected ? "on" : ""}`}>{elio.connected ? tr("ELIO conectat", "ELIO connected") : tr("ELIO deconectat", "ELIO disconnected")}</span>
        </div>
        <div className="mCodeActions">
          <button className="mBtn primary" onClick={() => void act(runProgram)} disabled={running}>
            <Icon name="play" size={18} /> {running ? tr("Rulează…", "Running…") : tr("Rulează", "Run")}
          </button>
          <button className="mBtn danger" onClick={() => void act(haltProgram)}><Icon name="stop" size={18} /> {tr("Oprește", "Stop")}</button>
          <button className="mIconBtn" onClick={save} disabled={running} aria-label={tr("Salvează", "Save")} title={tr("Salvează", "Save")}><Icon name="save" size={20} /></button>
          <button className="mIconBtn" onClick={clear} disabled={running} aria-label={tr("Program nou", "New program")} title={tr("Program nou", "New program")}><Icon name="trash" size={20} /></button>
        </div>
        {message && <p className="mNote strong">{message}</p>}
      </section>

      <div className="mCodeArea">
        <CodeWorkspace />
      </div>

      <p className="mNote">
        {tr(
          "Alege o categorie, trage blocurile în spațiul de lucru și îmbină-le. Programul începe cu blocul galben „when Start clicked”.",
          "Pick a category, drag blocks into the workspace and snap them together. The program starts with the yellow “when Start clicked” block.",
        )}
      </p>
    </div>
  );
}

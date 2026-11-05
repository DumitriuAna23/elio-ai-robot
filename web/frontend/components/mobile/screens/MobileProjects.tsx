"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";
import { useLang } from "@/lib/language";
import { deleteProgram, listPrograms, requestOpen, type SavedProgram } from "@/lib/programs";

export default function MobileProjects() {
  const { lang, tr } = useLang();
  const router = useRouter();
  const [list, setList] = useState<SavedProgram[]>([]);

  useEffect(() => { setList(listPrograms()); }, []);

  const open = (id: string) => { requestOpen(id); router.push("/code"); };
  const remove = (p: SavedProgram) => {
    if (!window.confirm(tr(`Ștergi „${p.name}”?`, `Delete “${p.name}”?`))) return;
    deleteProgram(p.id);
    setList(listPrograms());
  };
  const date = (t: number) => new Date(t).toLocaleDateString(lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="mStack">
      <div className="mRow">
        <h1 className="mH1">{tr("Proiectele mele", "My projects")}</h1>
        <button className="mBtn primary small" onClick={() => router.push("/code")}><Icon name="plus" size={16} /> {tr("Nou", "New")}</button>
      </div>
      {list.length === 0 ? (
        <section className="mCard center">
          <span className="mEmoji big">📁</span>
          <p className="mNote">{tr("Încă nu ai programe salvate. Fă unul în pagina Blocuri și apasă Salvează.", "No saved programs yet. Build one on the Blocks page and tap Save.")}</p>
        </section>
      ) : (
        list.map((p) => (
          <section key={p.id} className="mCard mProject">
            <button className="mProjectMain" onClick={() => open(p.id)}>
              <i><Icon name="code" /></i>
              <div>
                <strong>{p.name}</strong>
                <small>{p.blocks.length} {tr("blocuri", "blocks")} · {date(p.updated)}</small>
              </div>
            </button>
            <button className="mIconBtn" onClick={() => remove(p)} aria-label={tr("Șterge", "Delete")}><Icon name="trash" size={18} /></button>
          </section>
        ))
      )}
      <p className="mNote">{tr("Programele sunt salvate în acest browser, pe acest dispozitiv.", "Programs are saved in this browser, on this device.")}</p>
    </div>
  );
}

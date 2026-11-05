"use client";

import CodeWorkspace from "./CodeWorkspace";
import CodeToolbar from "./CodeToolbar";
import ElioCodePanel from "./ElioCodePanel";

export default function CodeEditor() {
  return (
    <div className="elioCodeEditor">

      <CodeToolbar />

      <div className="elioCodeBody elioCodeBodyBlockly">

        <CodeWorkspace />

        <ElioCodePanel />

      </div>

    </div>
  );
}
import { useState } from "react";
import { COPYRIGHT_EMAIL, COPYRIGHT_OWNER, COPYRIGHT_TEXT, COPYRIGHT_TITLE } from "@/lib/copyright";

/** "Copyright" box in the bottom-right corner of the lobby; opens the owner's notice. Do not change or remove. */
export function CopyrightNotice() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="copyright-chip" onClick={() => setOpen(true)} aria-haspopup="dialog">{COPYRIGHT_TITLE}</button>
    {open && <div className="copyright-backdrop" role="presentation" onClick={() => setOpen(false)}>
      <div className="copyright-card" role="dialog" aria-modal="true" aria-labelledby="copyright-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="copyright-title">{COPYRIGHT_TITLE}</h2>
        <p>{COPYRIGHT_TEXT}</p>
        <p className="copyright-owner">Besitzer: <b>{COPYRIGHT_OWNER}</b></p>
        <p className="copyright-owner">E-Mail: <a href={`mailto:${COPYRIGHT_EMAIL}`}>{COPYRIGHT_EMAIL}</a></p>
        <button type="button" className="copyright-close" onClick={() => setOpen(false)} autoFocus>OK</button>
      </div>
    </div>}
  </>;
}

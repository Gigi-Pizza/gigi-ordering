import React from "@esm.sh/react";
import { MobileShell, TopBar, StickyAction } from "@gigi/ux/index.mjs";
import { useOrderingCopy } from "../copy";

export function Placeholder({ title, message, actionLabel, onAction, onBack, detail }: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack?: () => void;
  detail?: string;
}): React.ReactElement {
  const { t } = useOrderingCopy();
  return (
    <MobileShell>
      <TopBar title={title} onBack={onBack} backLabel={t.back} />
      <main className="gigi-screen-content">
        <p>{message}</p>
        {detail && <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", overflow: "auto" }}>{detail}</pre>}
      </main>
      {actionLabel && onAction && <StickyAction onClick={onAction}>{actionLabel}</StickyAction>}
    </MobileShell>
  );
}

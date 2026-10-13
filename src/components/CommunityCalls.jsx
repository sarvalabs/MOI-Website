import { useState, useSyncExternalStore } from "react";
import { COMMUNITY_CALLS, formatCallDate } from "../lib/communityCalls.js";

// The prerendered page and the browser's first render must produce the same
// markup, or hydration fails. "Now" differs between the build server and every
// visitor, so the first render uses the moment the page was prerendered
// (scripts/ssg.mjs stamps it on #root). Once hydrated, the block switches to
// the visitor's own clock, so a page built before a call and opened after it
// stops advertising that call.
const subscribeToNothing = () => () => {};

function prerenderTime() {
  if (typeof document === "undefined") return globalThis.__SSG_NOW__ ?? Date.now();
  const stamp = Number(document.getElementById("root")?.dataset.ssgNow);
  return stamp > 0 ? stamp : Date.now();
}

// Off until content/community-calls.json carries a Luma link.
export const communityCallsEnabled = COMMUNITY_CALLS !== null;

export default function CommunityCalls() {
  // false on the server and during hydration, true from the next render on.
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [mountedAt] = useState(() => Date.now());

  if (!COMMUNITY_CALLS) return null;

  const now = hydrated ? mountedAt : prerenderTime();
  const next = COMMUNITY_CALLS.nextCall;
  const call = next && next.endsAt >= now ? next : null;

  return (
    <div className="community-inner">
      <div className="community-header">
        <p className="community-eyebrow">
          <span className="community-eyebrow-dot" />
          Community
        </p>
        <h2 className="community-title">Community calls</h2>
        <p className="community-sub">
          Dates and sign-up for every community call are on our Luma calendar.
        </p>
      </div>

      <div className="community-cta">
        {call && (
          <p className="community-next">
            <span className="community-next-label">Next call</span>
            {call.url ? (
              <a href={call.url} target="_blank" rel="noopener noreferrer">{call.title}</a>
            ) : (
              call.title
            )}
            {" · "}
            {formatCallDate(call)}
          </p>
        )}
        <a
          href={COMMUNITY_CALLS.lumaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="kitcta-btn kitcta-btn-primary"
        >
          Open the calendar on Luma <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

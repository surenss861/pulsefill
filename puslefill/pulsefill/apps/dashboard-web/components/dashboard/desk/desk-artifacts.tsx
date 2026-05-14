"use client";

import type { ReactNode } from "react";

/** One physical “desk sheet” with a case-file cover row + body for slips / ledger rows. */
export function DeskFilePage(props: {
  filingLine: string;
  title: string;
  subtitle?: ReactNode;
  coverAside?: ReactNode;
  children: ReactNode;
}) {
  const { filingLine, title, subtitle, coverAside, children } = props;
  return (
    <div className="pf-desk-file-page">
      <div className="pf-desk-file-page__sheet">
        <header className="pf-desk-file-page__cover">
          <div className="pf-desk-file-page__cover-copy">
            <p className="pf-desk-file-page__filing-line">{filingLine}</p>
            <h1 className="pf-desk-file-page__title">{title}</h1>
            {subtitle ? <div className="pf-desk-file-page__subtitle">{subtitle}</div> : null}
          </div>
          {coverAside ? <div className="pf-desk-file-page__cover-aside">{coverAside}</div> : null}
        </header>
        <div className="pf-desk-file-page__body">{children}</div>
      </div>
    </div>
  );
}

/** Live vs setup — reads like a rubber stamp on the file cover. */
export function DeskStatusStamp(props: { live: boolean }) {
  const { live } = props;
  return (
    <span className={`pf-desk-status-stamp${live ? " pf-desk-status-stamp--live" : " pf-desk-status-stamp--setup"}`}>
      {live ? "Live" : "Setup pending"}
    </span>
  );
}

/** Custom desk stamp (waitlist state, billing state, etc.). */
export function DeskFileStamp(props: { children: ReactNode; tone?: "live" | "setup" | "attention" }) {
  const tone = props.tone ?? "setup";
  const extra =
    tone === "live"
      ? " pf-desk-status-stamp--live"
      : tone === "attention"
        ? " pf-desk-status-stamp--attention"
        : " pf-desk-status-stamp--setup";
  return <span className={`pf-desk-status-stamp${extra}`}>{props.children}</span>;
}

export function DeskBillingStamp(props: { status: "active" | "inactive" | "attention" }) {
  const label =
    props.status === "active" ? "Billing active" : props.status === "attention" ? "Needs attention" : "Billing inactive";
  const tone: "live" | "setup" | "attention" =
    props.status === "active" ? "live" : props.status === "attention" ? "attention" : "setup";
  return <DeskFileStamp tone={tone}>{label}</DeskFileStamp>;
}
export function DeskActionSlip(props: {
  title: string;
  titleId?: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const { title, titleId = "pf-desk-action-slip-title", eyebrow, children } = props;
  return (
    <section className="pf-desk-action-slip" aria-labelledby={titleId}>
      {eyebrow ? <p className="pf-desk-action-slip__eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId} className="pf-desk-action-slip__title">
        {title}
      </h2>
      <div className="pf-desk-action-slip__body">{children}</div>
    </section>
  );
}

/** Ledger / case section — rule + label, not a floating panel. */
export function DeskLedgerSection(props: { title: string; headerAction?: ReactNode; children: ReactNode }) {
  const { title, headerAction, children } = props;
  return (
    <section className="pf-desk-ledger-section" aria-label={title}>
      <div className="pf-desk-ledger-section__head">
        <h2 className="pf-desk-ledger-section__title">{title}</h2>
        {headerAction ? <div className="pf-desk-ledger-section__action">{headerAction}</div> : null}
      </div>
      <div className="pf-desk-ledger-section__body">{children}</div>
    </section>
  );
}

/** Sidebar row: numbered index + label (icon optional, rendered by parent). */
export function DeskFileIndexItem(props: { index: string; children: ReactNode }) {
  return (
    <span className="pf-desk-file-index-item">
      <span className="pf-desk-file-index-item__no" aria-hidden>
        {props.index}
      </span>
      <span className="pf-desk-file-index-item__body">{props.children}</span>
    </span>
  );
}

/** Inset marginalia on the sheet. */
export function DeskInsetNote(props: { children: ReactNode }) {
  return <aside className="pf-desk-inset-note">{props.children}</aside>;
}

"use client";

export default function TopNav() {
  function saveContext() {
    window.__saveLectureContextForVoiceHelp?.();
  }

  return (
    <nav className="topnav">
      <a className="voiceHelpButton" href="/aide-vocale" onClick={saveContext}>Aide vocale IA</a>
      <a className="homeButton" href="/">Accueil</a>
    </nav>
  );
}

import './globals.css';

export const metadata = {
  title: 'Lecture 6e année',
  description: 'Application de pratique en compréhension de lecture'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <nav className="topnav">
          <a className="voiceHelpButton" href="/aide-vocale">Aide vocale IA</a>
          <a className="homeButton" href="/">Accueil</a>
        </nav>
        {children}
      </body>
    </html>
  );
}

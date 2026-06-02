import './globals.css';

export const metadata = {
  title: 'Lecture et écriture 6e année',
  description: 'Application de pratique en compréhension de lecture et préparation à l’écriture'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <nav className="topnav">
          <a className="homeButton" href="/">Accueil</a>
          <a className="writingButton" href="/ecriture">Volet écriture</a>
          <a className="voiceHelpButton" href="/aide-vocale">Aide vocale IA</a>
        </nav>
        {children}
      </body>
    </html>
  );
}

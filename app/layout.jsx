import "./globals.css";
import "./formativeFeedback.css";
import ProgressiveAnswerGuard from "./ProgressiveAnswerGuard";
import FormativeFeedbackPanel from "./FormativeFeedbackPanel";
import GuidedReadingCoach from "./GuidedReadingCoach";

export const metadata = {
  title: "Compréhension de lecture — 6e, secondaire 1 et 2",
  description: "Application de pratique guidée et de simulation en compréhension de lecture"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <nav className="topnav" aria-label="Navigation principale">
          <a className="homeButton" href="/">Accueil</a>
          <a className="writingButton" href="/ecriture">Volet écriture</a>
          <a className="voiceHelpButton" href="/aide-vocale">Aide vocale IA</a>
          <a className="adminButton" href="/admin/login">Admin</a>
        </nav>
        <FormativeFeedbackPanel>
          <ProgressiveAnswerGuard>
            <GuidedReadingCoach>{children}</GuidedReadingCoach>
          </ProgressiveAnswerGuard>
        </FormativeFeedbackPanel>
      </body>
    </html>
  );
}

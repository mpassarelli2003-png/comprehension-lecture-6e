import './globals.css';
import VoiceHelpNavSync from './components/VoiceHelpNavSync';
import TopNav from './components/TopNav';

export const metadata = {
  title: 'Lecture 6e année',
  description: 'Application de pratique en compréhension de lecture'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <VoiceHelpNavSync />
        <TopNav />
        {children}
      </body>
    </html>
  );
}

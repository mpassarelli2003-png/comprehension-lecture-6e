import './globals.css';

export const metadata = {
  title: 'Lecture 6e année',
  description: 'Application de pratique en compréhension de lecture'
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

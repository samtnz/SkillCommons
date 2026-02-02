import './globals.css';

export const metadata = {
  title: 'Skills Registry',
  description: 'Decentralized skill registry for AI agents'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav className="nav">
            <a href="/">Skills Registry</a>
            <span className="meta">Decentralized skill index (v1)</span>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

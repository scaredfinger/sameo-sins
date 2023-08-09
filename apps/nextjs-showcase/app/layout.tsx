import './global.scss';
import Link from "next/link";

export const metadata = {
  title: 'Welcome to nextjs-showcase',
  description: 'Generated by create-nx-workspace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

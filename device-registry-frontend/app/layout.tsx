import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IoT Water Level Device Registry",
  description: "水位センサーデバイスの登録と管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Main from "@/components/Main";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pendulum — Smart Fashion Planning",
  description: "De-risk your fashion planning with data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <Sidebar />
          <Main>{children}</Main>
        </div>
      </body>
    </html>
  );
}

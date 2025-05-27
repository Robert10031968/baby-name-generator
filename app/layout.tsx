import "@/styles/globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Nomena | Baby Name Generator",
  description: "Discover meaningful baby names and generate beautiful certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-pink-50 text-gray-800">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
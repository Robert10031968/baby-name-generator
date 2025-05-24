import jsPDF from "jspdf";

interface CertificateData {
  name: string;
  history: string;
  meaning: string;
  logoUrl?: string;
}

export async function generateCertificatePDF({
  name,
  history,
  meaning,
  logoUrl = "/nomena_logo.png", // domyślnie lokalne logo
}: CertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Wstawiamy gotowe tło graficzne
  const bgImage = await loadImageAsBase64("/certificate_bg.png");
  doc.addImage(bgImage, "PNG", 0, 0, 210, 297); // pełna strona A4

  // Ramka
  doc.setDrawColor(170, 170, 220); // Jasna niebiesko-fioletowa
  doc.setLineWidth(1.5);
  doc.rect(15, 15, 180, 267);

  // Logo
  try {
    const logoImage = await loadImageAsBase64(logoUrl);
    doc.addImage(logoImage, "PNG", 85, 18, 40, 20);
  } catch (error) {
    console.error("Could not load logo", error);
  }

  // Tytuł
  doc.setFontSize(26);
  doc.setTextColor(50, 50, 100);
  doc.text("Certificate of Name", 105, 55, { align: "center" });

  // Imię
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(name, 105, 72, { align: "center" });

  let currentY = 92;

  // Sekcja: History
  doc.setFontSize(16);
  doc.setTextColor(70, 70, 120);
  doc.text("History:", 20, currentY);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const historyLines = doc.splitTextToSize(history, 170);
  doc.text(historyLines, 20, currentY + 8);
  currentY += 8 + historyLines.length * 6;

  // Sekcja: Meaning
  doc.setFontSize(16);
  doc.setTextColor(70, 70, 120);
  doc.text("Meaning:", 20, currentY);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const meaningLines = doc.splitTextToSize(meaning, 170);
  doc.text(meaningLines, 20, currentY + 8);
  currentY += 8 + meaningLines.length * 6;

  // Data
  const today = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${today}`, 20, 282);

  // Stopka
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text("Generated with ❤️ by nomena.io", 105, 290, { align: "center" });

  doc.save(`${name}_certificate.pdf`);
}

async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
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
  logoUrl = "/nomena_logo.png",
}: CertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Tło
  const bgImage = await loadImageAsBase64("/certificate_bg_clean.png");
  doc.addImage(bgImage, "PNG", 0, 0, 210, 297);

  // Logo
  try {
    const logoImage = await loadImageAsBase64(logoUrl);
    doc.addImage(logoImage, "PNG", 83, 12, 44, 22);
  } catch (err) {
    console.warn("⚠️ Logo nie załadowane");
  }

  // Tytuł
  doc.setFontSize(24);
  doc.setTextColor(50, 70, 110);
  doc.text("Name Certificate", 105, 50, { align: "center" });

  // Imię
  doc.setFontSize(36);
  doc.setTextColor(30, 30, 30);
  doc.text(name, 105, 72, { align: "center" });

  let currentY = 90;

  // History
  doc.setFontSize(24);
  doc.setTextColor(60, 80, 120);
  doc.text("History:", 105, currentY, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  const historyLines = doc.splitTextToSize(history, 170);
  doc.text(historyLines, 20, currentY + 10);
  currentY += 10 + historyLines.length * 6;

  // Meaning
  doc.setFontSize(24);
  doc.setTextColor(60, 80, 120);
  doc.text("Meaning:", 105, currentY - 2, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  const meaningLines = doc.splitTextToSize(meaning, 170);
  doc.text(meaningLines, 20, currentY + 10);
  currentY += 10 + meaningLines.length * 6;

  // Stopka — data i branding
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated on ${formattedDate}`, 20, 276); // lewa

  try {
    const heartImage = await loadImageAsBase64("/heart_icon_final.png");
    doc.addImage(heartImage, "PNG", 165, 272.5, 4.5, 4.5); // serduszko
  } catch (err) {
    console.warn("⚠️ Serce nie załadowane");
  }

  doc.text("Generated with", 140, 276);
  doc.text("by nomena.io", 170, 276);

  // Zapis PDF
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
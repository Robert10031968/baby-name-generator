import { jsPDF } from "jspdf";

interface CertificateData {
  name: string;
  history: string;
  meaning: string;
  logoUrl?: string;
  usedWiki?: boolean;
}

export async function generateCertificatePDF({
  name,
  history,
  meaning,
  logoUrl = "/nomena_logo.png",
  usedWiki = false,
}: CertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const bgImage = await loadImageAsBase64("/certificate_bg_clean.png");
  doc.addImage(bgImage, "PNG", 0, 0, 210, 297);

  try {
    const logoImage = await loadImageAsBase64(logoUrl);
    doc.addImage(logoImage, "PNG", 83, 12, 44, 22);
  } catch (err) {
    console.warn("⚠️ Logo nie załadowane");
  }

  doc.setFontSize(24);
  doc.setTextColor(50, 70, 110);
  doc.text("Name Certificate", 105, 50, { align: "center" });

  doc.setFontSize(36);
  doc.setTextColor(30, 30, 30);
  doc.text(name, 105, 72, { align: "center" });

  let currentY = 90;

  // Historia
  doc.setFontSize(20);
  doc.setTextColor(60, 80, 120);
  doc.text("History:", 105, currentY, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  const historyLines = doc.splitTextToSize(history, 170);
  doc.text(historyLines, 20, currentY + 8);
  currentY += 8 + historyLines.length * 5.5;

  // Znaczenie
  doc.setFontSize(20);
  doc.setTextColor(60, 80, 120);
  doc.text("Meaning:", 105, currentY, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  const meaningLines = doc.splitTextToSize(meaning, 170);
  doc.text(meaningLines, 20, currentY + 8);
  currentY += 8 + meaningLines.length * 5.5;

  // Źródło
  if (usedWiki) {
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text("(based on Wikipedia)", 105, currentY + 4, { align: "center" });
    currentY += 10;
  }

  // Stopka
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated on ${formattedDate}`, 20, 285);

  try {
    const heartImage = await loadImageAsBase64("/heart_icon_final.png");
    doc.addImage(heartImage, "PNG", 189, 281.5, 4.5, 4.5);
  } catch (err) {
    console.warn("⚠️ Serce nie załadowane");
  }

  doc.text("Generated with ❤️ by nomena.io", 210 - 20, 285, { align: "right" });

  doc.save(`${name}_certificate.pdf`);
}

export async function loadImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
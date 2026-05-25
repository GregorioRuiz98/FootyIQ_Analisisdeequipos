import { jsPDF } from "jspdf";

export type PlayerPdfStat = { title: string; value: string };
export type PlayerPdfCareerRow = {
  season: string;
  team: string;
  type: string;
  appearances: string;
  goals: string;
  assists: string;
  rating: string;
};

export interface PlayerPdfData {
  name: string;
  playerId?: number | string | null;
  teamName?: string;
  teamId?: number | string | null;
  position?: string;
  otherPositions?: string[];
  shirt?: string;
  age?: string;
  country?: string;
  height?: string;
  foot?: string;
  marketValue?: string;
  contractEnd?: string;
  birth?: string;
  status?: string;
  leagueName?: string;
  season?: string;
  stats: PlayerPdfStat[];
  career?: PlayerPdfCareerRow[];
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function safe(s: string | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s);
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "jugador"
  );
}

export async function exportPlayerReportPdf(
  data: PlayerPdfData,
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  // ----- Header band -----
  doc.setFillColor(20, 25, 38);
  doc.rect(0, 0, pageW, 150, "F");
  doc.setFillColor(27, 110, 255);
  doc.rect(0, 150, pageW, 4, "F");

  // Photo
  let photoX = margin;
  const photoSize = 100;
  const photoY = 30;
  if (data.playerId) {
    const photoUrl = `/fotmob-img/image_resources/playerimages/${data.playerId}.png`;
    const dataUrl = await loadImageAsDataUrl(photoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", photoX, photoY, photoSize, photoSize);
      } catch {
        /* ignore */
      }
    }
  }

  // Name + meta
  const textX = margin + photoSize + 20;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(safe(data.name) || "Jugador", textX, 60);

  // Team logo + name
  let teamLineY = 86;
  let teamTextX = textX;
  if (data.teamId) {
    const logoUrl = `/fotmob-img/image_resources/logo/teamlogo/${data.teamId}.png`;
    const logoData = await loadImageAsDataUrl(logoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, "PNG", textX, teamLineY - 14, 18, 18);
        teamTextX = textX + 24;
      } catch {
        /* ignore */
      }
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(200, 210, 230);
  doc.text(safe(data.teamName) || "-", teamTextX, teamLineY);

  // Position + tags row
  const tagParts: string[] = [];
  if (data.position) tagParts.push(data.position);
  if (data.otherPositions && data.otherPositions.length > 0) {
    tagParts.push(data.otherPositions.join(" / "));
  }
  if (data.shirt) tagParts.push(`#${data.shirt}`);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(tagParts.join("  ·  ") || "-", textX, 110);

  // Date / source
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 220);
  const today = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.text(`Informe generado el ${today} · Footy IQ`, pageW - margin, 30, {
    align: "right",
  });

  // ----- Info personal -----
  let y = 200;
  doc.setTextColor(20, 25, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("INFORMACIÓN", margin, y);
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 5, pageW - margin, y + 5);

  const infoRows: Array<[string, string]> = [];
  if (data.age) infoRows.push(["Edad", data.age]);
  if (data.birth) infoRows.push(["Nacimiento", data.birth]);
  if (data.country) infoRows.push(["País", data.country]);
  if (data.height) infoRows.push(["Altura", data.height]);
  if (data.foot) infoRows.push(["Pierna", data.foot]);
  if (data.marketValue) infoRows.push(["Valor de mercado", data.marketValue]);
  if (data.contractEnd) infoRows.push(["Fin de contrato", data.contractEnd]);
  if (data.status) infoRows.push(["Estado", data.status]);

  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const colW = (pageW - margin * 2) / 2;
  infoRows.forEach((row, i) => {
    const col = i % 2;
    const rowIdx = Math.floor(i / 2);
    const rx = margin + col * colW;
    const ry = y + rowIdx * 22;
    doc.setTextColor(110, 120, 140);
    doc.text(row[0], rx, ry);
    doc.setTextColor(20, 25, 38);
    doc.setFont("helvetica", "bold");
    doc.text(safe(row[1]) || "-", rx + 120, ry);
    doc.setFont("helvetica", "normal");
  });
  y += Math.ceil(infoRows.length / 2) * 22 + 12;

  // ----- Stats principales -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 25, 38);
  const statsTitle = data.leagueName
    ? `ESTADÍSTICAS · ${data.leagueName}${data.season ? " · " + data.season : ""}`
    : "ESTADÍSTICAS CLAVE";
  doc.text(statsTitle.toUpperCase(), margin, y);
  doc.setDrawColor(220, 225, 235);
  doc.line(margin, y + 5, pageW - margin, y + 5);
  y += 22;

  if (data.stats.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(130, 140, 160);
    doc.text("Sin estadísticas disponibles para este jugador.", margin, y + 8);
  } else {
    const cols = 3;
    const gap = 12;
    const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
    const cardH = 64;
    data.stats.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (cardW + gap);
      const cy = y + row * (cardH + gap);
      doc.setFillColor(245, 247, 252);
      doc.roundedRect(x, cy, cardW, cardH, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20, 25, 38);
      doc.text(safe(s.value) || "-", x + cardW / 2, cy + 30, {
        align: "center",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 120, 140);
      doc.text(safe(s.title).toUpperCase(), x + cardW / 2, cy + 50, {
        align: "center",
      });
    });
  }

  // ----- Footer -----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 160, 180);
  doc.text("Datos: FotMob · Footy IQ TFG", margin, pageH - 20);
  doc.text(`Página 1`, pageW - margin, pageH - 20, { align: "right" });

  // ===== Página 2: Trayectoria =====
  const career = data.career ?? [];
  if (career.length > 0) {
    doc.addPage();

    // Header band (igual estilo)
    doc.setFillColor(20, 25, 38);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setFillColor(27, 110, 255);
    doc.rect(0, 70, pageW, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(safe(data.name) || "Jugador", margin, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(200, 210, 230);
    doc.text(`Trayectoria · ${career.length} temporadas`, margin, 58);
    doc.setFontSize(9);
    doc.setTextColor(180, 195, 220);
    doc.text(`Footy IQ`, pageW - margin, 40, { align: "right" });

    // Tabla
    const tableX = margin;
    const tableY = 100;
    const tableW = pageW - margin * 2;
    const cols: Array<{ label: string; w: number; align?: "left" | "center" }> =
      [
        { label: "Temp.", w: 0.13, align: "left" },
        { label: "Equipo", w: 0.34, align: "left" },
        { label: "Tipo", w: 0.15, align: "left" },
        { label: "PJ", w: 0.09, align: "center" },
        { label: "G", w: 0.09, align: "center" },
        { label: "A", w: 0.09, align: "center" },
        { label: "Rating", w: 0.11, align: "center" },
      ];
    const colXs: number[] = [];
    let cx = tableX;
    for (const c of cols) {
      colXs.push(cx);
      cx += c.w * tableW;
    }

    // Header row
    const rowH = 20;
    doc.setFillColor(20, 25, 38);
    doc.rect(tableX, tableY, tableW, rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    cols.forEach((c, i) => {
      const cellX = colXs[i];
      const tx = c.align === "center" ? cellX + (c.w * tableW) / 2 : cellX + 6;
      doc.text(c.label.toUpperCase(), tx, tableY + 13, {
        align: c.align === "center" ? "center" : "left",
      });
    });

    // Body rows con paginación
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let rowY = tableY + rowH;
    let page = 2;
    const bottomLimit = pageH - 40;

    const drawPageHeader = (pageNum: number) => {
      doc.setFillColor(20, 25, 38);
      doc.rect(0, 0, pageW, 50, "F");
      doc.setFillColor(27, 110, 255);
      doc.rect(0, 50, pageW, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        `${safe(data.name) || "Jugador"} · Trayectoria (cont.)`,
        margin,
        32,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 195, 220);
      doc.text(`Página ${pageNum}`, pageW - margin, 32, { align: "right" });
      // Re-draw table header
      const headY = 80;
      doc.setFillColor(20, 25, 38);
      doc.rect(tableX, headY, tableW, rowH, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      cols.forEach((c, i) => {
        const cellX = colXs[i];
        const tx =
          c.align === "center" ? cellX + (c.w * tableW) / 2 : cellX + 6;
        doc.text(c.label.toUpperCase(), tx, headY + 13, {
          align: c.align === "center" ? "center" : "left",
        });
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      return headY + rowH;
    };

    career.forEach((row, idx) => {
      if (rowY + rowH > bottomLimit) {
        // Footer página actual
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 180);
        doc.text("Datos: FotMob · Footy IQ TFG", margin, pageH - 20);
        doc.text(`Página ${page}`, pageW - margin, pageH - 20, {
          align: "right",
        });
        doc.addPage();
        page += 1;
        rowY = drawPageHeader(page);
      }
      // Zebra
      if (idx % 2 === 0) {
        doc.setFillColor(245, 247, 252);
        doc.rect(tableX, rowY, tableW, rowH, "F");
      }
      doc.setTextColor(20, 25, 38);
      const values = [
        row.season,
        row.team,
        row.type,
        row.appearances,
        row.goals,
        row.assists,
        row.rating,
      ];
      cols.forEach((c, i) => {
        const cellX = colXs[i];
        const tx =
          c.align === "center" ? cellX + (c.w * tableW) / 2 : cellX + 6;
        const raw = safe(values[i]) || "-";
        const maxChars = i === 1 ? 32 : i === 2 ? 14 : 12;
        const text =
          raw.length > maxChars ? raw.slice(0, maxChars - 1) + "…" : raw;
        doc.text(text, tx, rowY + 13, {
          align: c.align === "center" ? "center" : "left",
        });
      });
      rowY += rowH;
    });

    // Footer última página
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 180);
    doc.text("Datos: FotMob · Footy IQ TFG", margin, pageH - 20);
    doc.text(`Página ${page}`, pageW - margin, pageH - 20, { align: "right" });
  }

  doc.save(`informe-${slug(data.name)}.pdf`);
}

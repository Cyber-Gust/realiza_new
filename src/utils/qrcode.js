"use client";
import QRCode from "qrcode";

/**
 * Gera um QR Code em base64 para um determinado payload.
 * Pode ser usado em ChavesDialog, convites, check-in etc.
 *
 * @param {string|object} value - Valor a codificar (string ou objeto)
 * @param {number} [size=200] - Tamanho do QR (pixels)
 * @returns {Promise<string>} DataURL em base64
 */
export async function generateQrCode(value, size = 200) {
  try {
    const payload = typeof value === "object" ? JSON.stringify(value) : value;
    const qr = await QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    return qr;
  } catch (err) {
    console.error("Erro ao gerar QR Code:", err);
    return null;
  }
}

/**
 * Faz o download automático de um QR em formato PNG.
 *
 * @param {string} dataUrl - Base64 gerado
 * @param {string} filename - Nome do arquivo
 */
export function downloadQrCode(dataUrl, filename = "qrcode.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

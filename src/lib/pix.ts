// Gera um "código PIX copia e cola" de demonstração e uma URL de QR code.
// Este é um MVP — não é um PIX real, apenas representação visual.
export function gerarPixSimulado(bandaNome: string, valor: number) {
  const txid = `UB${Date.now().toString(36).toUpperCase()}`;
  const payload = `00020126360014BR.GOV.BCB.PIX0114uniaodasbandas5204000053039865406${valor.toFixed(2)}5802BR5913UniaoDasBandas6009SAOPAULO62${String(txid.length + 4).padStart(2, "0")}05${String(txid.length).padStart(2, "0")}${txid}6304ABCD`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(payload)}`;
  return { txid, copiaECola: payload, qrUrl, banda: bandaNome };
}

export function pontosDeValor(valor: number) {
  return Math.floor(valor / 10);
}

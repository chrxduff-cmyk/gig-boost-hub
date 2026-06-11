// Gera um "código PIX copia e cola" de demonstração e uma URL de QR code.
// Este é um MVP — não é um PIX real, apenas representação visual.
// A chave/nome/cidade do recebedor vem da tabela `configuracoes_pix` (editável no admin).

export type PixConfig = {
  chave: string;
  nome_recebedor: string;
  cidade: string;
};

export function gerarPixSimulado(bandaNome: string, valor: number, config: PixConfig) {
  const txid = `UB${Date.now().toString(36).toUpperCase()}`;
  const chave = config.chave.slice(0, 36);
  const nome = (config.nome_recebedor || "RECEBEDOR").toUpperCase().slice(0, 25);
  const cidade = (config.cidade || "BRASIL").toUpperCase().slice(0, 15);
  const merchant = `0014BR.GOV.BCB.PIX01${String(chave.length).padStart(2, "0")}${chave}`;
  const payload =
    `00020126${String(merchant.length).padStart(2, "0")}${merchant}` +
    `52040000530398654${String(valor.toFixed(2).length).padStart(2, "0")}${valor.toFixed(2)}` +
    `5802BR59${String(nome.length).padStart(2, "0")}${nome}60${String(cidade.length).padStart(2, "0")}${cidade}` +
    `62${String(txid.length + 4).padStart(2, "0")}05${String(txid.length).padStart(2, "0")}${txid}6304ABCD`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(payload)}`;
  return { txid, copiaECola: payload, qrUrl, banda: bandaNome };
}

export function pontosDeValor(valor: number) {
  return Math.floor(valor / 10);
}

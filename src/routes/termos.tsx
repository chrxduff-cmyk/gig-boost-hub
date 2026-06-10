import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({ meta: [{ title: "Termos de Uso — União das Bandas" }] }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="display text-4xl">Termos de Uso</h1>

      <h2 className="display mt-8 text-2xl text-gold">1. Aceite</h2>
      <p>Antes de concluir o cadastro, o usuário deverá aceitar os Termos de Uso e a Política de Privacidade. Sem os aceites, o cadastro não poderá ser concluído.</p>

      <h2 className="display mt-8 text-2xl text-gold">2. Termos para Bandas</h2>
      <p>Ao se cadastrar, a banda declara que:</p>
      <ul className="list-disc pl-6">
        <li>Possui autorização para representar o grupo musical cadastrado.</li>
        <li>As informações fornecidas são verdadeiras.</li>
        <li>Possui autorização para uso das imagens, logotipos e materiais enviados.</li>
        <li>É responsável pelos direitos autorais das músicas, fotos e conteúdos publicados.</li>
        <li>Não utilizará a plataforma para fins ilícitos ou fraudulentos.</li>
      </ul>

      <h2 className="display mt-8 text-2xl text-gold">3. Autorização de Uso de Imagem e Marca</h2>
      <p>A banda autoriza gratuitamente a União das Bandas e os organizadores dos eventos parceiros a utilizar nome artístico, logotipo, fotografias, material promocional, vídeos e trechos de apresentações para divulgação dos eventos, redes sociais, materiais promocionais, site, aplicativo e divulgação de rankings e resultados. A autorização permanece válida enquanto o perfil estiver ativo na plataforma.</p>

      <h2 className="display mt-8 text-2xl text-gold">4. Regras da Votação</h2>
      <ul className="list-disc pl-6">
        <li>A pontuação será calculada conforme as regras divulgadas para cada evento.</li>
        <li>Os resultados serão públicos.</li>
        <li>Tentativas de fraude podem resultar em desclassificação.</li>
        <li>A organização poderá solicitar comprovação das informações declaradas.</li>
        <li>A decisão final sobre validação de pontos cabe à organização do evento.</li>
      </ul>

      <h2 className="display mt-8 text-2xl text-gold">5. Política Antifraude</h2>
      <p>A plataforma poderá auditar transações, revisar cadastros, remover pontuações irregulares e suspender perfis suspeitos. Exemplos de irregularidades: uso de dados falsos, manipulação do ranking, cadastros duplicados e fraudes financeiras.</p>

      <h2 className="display mt-8 text-2xl text-gold">6. Limitação de Responsabilidade</h2>
      <p>A União das Bandas atua apenas como plataforma de conexão entre público, bandas e organizadores. Não garantimos contratações, premiações futuras, retorno financeiro ou participação em eventos além das regras previamente estabelecidas.</p>

      <h2 className="display mt-8 text-2xl text-gold">7. Aceite Eletrônico</h2>
      <p>O aceite eletrônico registrado pelo sistema terá validade jurídica equivalente à assinatura eletrônica simples, nos termos da legislação brasileira aplicável.</p>
    </article>
  );
}

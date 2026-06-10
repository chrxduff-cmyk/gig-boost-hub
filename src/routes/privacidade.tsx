import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — União das Bandas" }] }),
  component: PrivPage,
});

function PrivPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="display text-4xl">Política de Privacidade</h1>

      <h2 className="display mt-8 text-2xl text-gold">Dados coletados</h2>
      <ul className="list-disc pl-6">
        <li>Nome</li>
        <li>E-mail</li>
        <li>Cidade</li>
        <li>Dados de cadastro</li>
        <li>Histórico de participação</li>
      </ul>

      <h2 className="display mt-8 text-2xl text-gold">Compromissos</h2>
      <p>A plataforma compromete-se a:</p>
      <ul className="list-disc pl-6">
        <li>Não vender dados pessoais.</li>
        <li>Utilizar as informações apenas para operação do sistema.</li>
        <li>Permitir exclusão da conta mediante solicitação.</li>
      </ul>

      <h2 className="display mt-8 text-2xl text-gold">Consentimento LGPD</h2>
      <p>O usuário declara estar ciente de que seus dados serão tratados para: operação da plataforma, participação em eventos, comunicação institucional e divulgação de resultados.</p>
      <p>O usuário poderá solicitar atualização ou exclusão de seus dados a qualquer momento entrando em contato com a organização.</p>
    </article>
  );
}

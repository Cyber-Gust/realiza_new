import { formatCurrency } from "@/utils/formatters";

const formatArea = (value) => {
  if (!value) return "—";
  return Number(value).toLocaleString("pt-BR");
};

export default function FichaImovelPrint({ imovel, proprietario, captador }) {
  if (!imovel) return null;

  return (
    <div id="ficha-imovel-print" className="hidden print:block text-black bg-white text-[12px]">

<style dangerouslySetInnerHTML={{__html:`

@media print {

  html, body {
    background: white !important;
  }

  body * {
    visibility: hidden;
    background: white !important;
  }

  #ficha-imovel-print,
  #ficha-imovel-print * {
    visibility: visible;
  }

  #ficha-imovel-print {
    background: white !important;
    min-height: 100vh;
    position:absolute;
    left:0;
    top:0;
    width:100%;
  }

  @page {
    size:A4;
    margin:12mm;
  }

  body {
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    background: white;
  }

  .avoid-break{
    page-break-inside:avoid;
  }

}
`}} />

<div className="max-w-[780px] mx-auto">

{/* HEADER */}

<div className="flex justify-between mb-4">

<div>
<img src="/logo.png" className="h-10 mb-1"/>
<p className="text-[11px]">
Ficha Cadastral de Imóvel
</p>
</div>

<div className="text-right">
<p className="font-bold text-[14px]">
REF: {imovel.codigo_ref || "—"}
</p>

<p className="text-[11px]">
{new Date().toLocaleDateString("pt-BR")}
</p>
</div>

</div>

{/* TÍTULO */}

<div className="mb-3">

<p className="font-bold text-[15px]">
{imovel.titulo || "Imóvel sem título"}
</p>

<p>
{imovel.endereco_logradouro}
{imovel.endereco_numero && `, ${imovel.endereco_numero}`}
{imovel.endereco_bairro && ` - ${imovel.endereco_bairro}`}
</p>

<p>
{imovel.endereco_cidade} / {imovel.endereco_estado}
{imovel.endereco_cep && ` - CEP ${imovel.endereco_cep}`}
</p>

</div>

{/* DADOS PRINCIPAIS */}

<div className="grid grid-cols-2 gap-x-8 avoid-break">

<div>

<table className="w-full">

<tbody>

<tr>
<td>Tipo</td>
<td className="font-semibold">{imovel.tipo || "—"}</td>
</tr>

<tr>
<td>Status</td>
<td>{imovel.status || "—"}</td>
</tr>

<tr>
<td>Disponibilidade</td>
<td>{imovel.disponibilidade || "—"}</td>
</tr>

<tr>
<td>Área Total</td>
<td>{formatArea(imovel.area_total)} m²</td>
</tr>

<tr>
<td>Área Construída</td>
<td>{formatArea(imovel.area_construida)} m²</td>
</tr>

<tr>
<td>Testada</td>
<td>{formatArea(imovel.testada)} m</td>
</tr>

<tr>
<td>Profundidade</td>
<td>{formatArea(imovel.profundidade)} m</td>
</tr>

<tr>
<td>Topografia Lote</td>
<td>{imovel.lote_tipo || "—"}</td>
</tr>

</tbody>
</table>

</div>

<div>

<table className="w-full">

<tbody>

<tr>
<td>Quartos</td>
<td>{imovel.quartos ?? "—"}</td>
</tr>

<tr>
<td>Suítes</td>
<td>{imovel.suites ?? "—"}</td>
</tr>

<tr>
<td>Banheiros</td>
<td>{imovel.banheiros ?? "—"}</td>
</tr>

<tr>
<td>Garagem</td>
<td>{imovel.vagas_garagem ?? "—"}</td>
</tr>

<tr>
<td>Condomínio</td>
<td>{imovel.condominio || "—"}</td>
</tr>

<tr>
<td>Mobiliado</td>
<td>{imovel.mobiliado ? "Sim" : "Não"}</td>
</tr>

<tr>
<td>Pet Friendly</td>
<td>{imovel.pet_friendly ? "Sim" : "Não"}</td>
</tr>

<tr>
<td>Piscina</td>
<td>{imovel.piscina ? "Sim" : "Não"}</td>
</tr>

<tr>
<td>Área Gourmet</td>
<td>{imovel.area_gourmet ? "Sim" : "Não"}</td>
</tr>

</tbody>

</table>

</div>

</div>

{/* FINANCEIRO */}

<div className="mt-4 avoid-break">

<p className="font-bold mb-1">Financeiro</p>

<table className="w-full">

<tbody>

<tr>
<td>Valor de Venda</td>
<td className="font-semibold">
{imovel.preco_venda ? formatCurrency(imovel.preco_venda) : "—"}
</td>
</tr>

<tr>
<td>Valor de Locação</td>
<td className="font-semibold">
{imovel.preco_locacao ? formatCurrency(imovel.preco_locacao) : "—"}
</td>
</tr>

<tr>
<td>Condomínio</td>
<td>
{imovel.valor_condominio ? formatCurrency(imovel.valor_condominio) : "—"}
</td>
</tr>

<tr>
<td>IPTU</td>
<td>
{imovel.valor_iptu ? formatCurrency(imovel.valor_iptu) : "—"}
</td>
</tr>

<tr>
<td>Aceita permuta</td>
<td>{imovel.aceita_permuta ? "Sim" : "Não"}</td>
</tr>

</tbody>

</table>

</div>

{/* RESPONSÁVEIS */}

<div className="mt-4 avoid-break">

<p className="font-bold mb-1">Responsáveis</p>

<table className="w-full">

<tbody>

<tr>
<td>Proprietário</td>
<td>{proprietario?.nome || "—"}</td>
</tr>

<tr>
<td>Telefone</td>
<td>{proprietario?.telefone || proprietario?.contato_telefone || "—"}</td>
</tr>

<tr>
<td>Corretor</td>
<td>{captador?.nome_completo || "—"}</td>
</tr>

<tr>
<td>Local das Chaves</td>
<td>{imovel.chaves_localizacao || "—"}</td>
</tr>

<tr>
<td>Situação Documentação</td>
<td>{imovel.situacao_documentacao || "—"}</td>
</tr>

</tbody>

</table>

</div>

{/* CARACTERÍSTICAS EXTRAS */}

{imovel.caracteristicas_extras?.length > 0 && (

<div className="mt-4 avoid-break">

<p className="font-bold mb-1">Características</p>

<ul className="columns-2">

{imovel.caracteristicas_extras.map((c,i)=>(
<li key={i}>• {c}</li>
))}

</ul>

</div>

)}

</div>

</div>
);
}
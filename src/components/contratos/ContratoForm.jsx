"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2 } from "lucide-react";

export default function CRMContratoForm({ contrato, onClose, onSaved }) {
  const [form, setForm] = useState({
    tipo: "locacao",
    imovel_id: "",
    proprietario_id: "",
    inquilino_id: "",
    valor_acordado: "",
    taxa_administracao_percent: "",
    dia_vencimento_aluguel: 5,
    indice_reajuste: "IGPM",
    data_inicio: "",
    data_fim: "",
    status: "pendente_assinatura",
  });
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contrato) setForm(contrato);
    loadOptions();
  }, [contrato]);

  const loadOptions = async () => {
    try {
      const [imv, ppl] = await Promise.all([
        fetch("/api/imoveis/list").then((r) => r.json()),
        fetch("/api/perfis/list?type=personas").then((r) => r.json()),
      ]);
      setImoveis(imv.data || []);
      setPessoas(ppl.data || []);
    } catch (e) {
      Toast.error("Erro ao carregar opções: " + e.message);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = contrato ? "PATCH" : "POST";
      const res = await fetch("/api/contratos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Contrato salvo com sucesso!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Imóvel</label>
          <select
            value={form.imovel_id}
            onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Selecione</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.titulo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Proprietário</label>
          <select
            value={form.proprietario_id}
            onChange={(e) => setForm({ ...form, proprietario_id: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Selecione</option>
            {pessoas
              .filter((p) => p.tipo === "proprietario")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Inquilino</label>
          <select
            value={form.inquilino_id}
            onChange={(e) => setForm({ ...form, inquilino_id: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Selecione</option>
            {pessoas
              .filter((p) => p.tipo === "inquilino")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Valor Acordado (R$)</label>
          <input
            type="number"
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
            value={form.valor_acordado}
            onChange={(e) => setForm({ ...form, valor_acordado: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">% Taxa Administração</label>
          <input
            type="number"
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
            value={form.taxa_administracao_percent}
            onChange={(e) =>
              setForm({ ...form, taxa_administracao_percent: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Dia Vencimento</label>
          <input
            type="number"
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
            value={form.dia_vencimento_aluguel}
            onChange={(e) =>
              setForm({ ...form, dia_vencimento_aluguel: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Índice Reajuste</label>
          <select
            value={form.indice_reajuste}
            onChange={(e) => setForm({ ...form, indice_reajuste: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="IGPM">IGP-M</option>
            <option value="IPCA">IPCA</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Data Início</label>
          <input
            type="date"
            value={form.data_inicio}
            onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Data Fim</label>
          <input
            type="date"
            value={form.data_fim}
            onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2 } from "lucide-react";

/**
 * 🧾 Formulário de criação de lançamentos financeiros
 * Props:
 *  - tipoDefault: "receber" | "pagar"
 *  - onSaved: callback ao salvar
 *  - onClose: callback ao fechar modal
 */
export default function FinanceiroForm({ tipoDefault = "receber", onSaved, onClose }) {
  const [form, setForm] = useState({
    descricao: "",
    tipo: "",
    status: "pendente",
    valor: "",
    data_vencimento: "",
    data_pagamento: "",
  });

  const [saving, setSaving] = useState(false);
  const [tiposOptions, setTiposOptions] = useState([]);

  useEffect(() => {
    // 🔹 Define opções conforme o tipo do painel
    if (tipoDefault === "receber") {
      setTiposOptions([
        { value: "receita_aluguel", label: "Receita de Aluguel" },
        { value: "taxa_adm_imobiliaria", label: "Taxa de Administração" },
      ]);
    } else {
      setTiposOptions([
        { value: "repasse_proprietario", label: "Repasse ao Proprietário" },
        { value: "comissao_corretor", label: "Comissão do Corretor" },
        { value: "despesa_manutencao", label: "Despesa de Manutenção" },
        { value: "pagamento_iptu", label: "Pagamento de IPTU" },
        { value: "pagamento_condominio", label: "Pagamento de Condomínio" },
      ]);
    }
  }, [tipoDefault]);

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  const handleSave = async () => {
    try {
      if (!form.tipo || !form.valor) {
        Toast.error("Preencha o tipo e o valor do lançamento.");
        return;
      }

      setSaving(true);
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      Toast.success("Lançamento criado com sucesso!");
      if (onSaved) onSaved();
      if (onClose) onClose();

      setForm({
        descricao: "",
        tipo: "",
        status: "pendente",
        valor: "",
        data_vencimento: "",
        data_pagamento: "",
      });
    } catch (err) {
      Toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {/* Tipo */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Tipo de Lançamento</label>
        <select
          value={form.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        >
          <option value="">Selecione</option>
          {tiposOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Descrição</label>
        <input
          placeholder="Ex: Repasse referente ao contrato #123"
          value={form.descricao}
          onChange={(e) => handleChange("descricao", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        />
      </div>

      {/* Valor */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Valor (R$)</label>
        <input
          type="number"
          step="0.01"
          value={form.valor}
          onChange={(e) => handleChange("valor", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        />
      </div>

      {/* Data de Vencimento */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Data de Vencimento</label>
        <input
          type="date"
          value={form.data_vencimento}
          onChange={(e) => handleChange("data_vencimento", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        />
      </div>

      {/* Data de Pagamento */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Data de Pagamento (opcional)</label>
        <input
          type="date"
          value={form.data_pagamento}
          onChange={(e) => handleChange("data_pagamento", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        />
      </div>

      {/* Status */}
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground">Status</label>
        <select
          value={form.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Botão de salvar */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin mr-2" />}
          {saving ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </div>
    </div>
  );
}

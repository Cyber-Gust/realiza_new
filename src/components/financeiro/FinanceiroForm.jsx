"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

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

  const toast = useToast();

  useEffect(() => {
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
        toast.error("Campos obrigatórios", "Preencha o tipo e o valor do lançamento.");
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

      toast.success("Sucesso", "Lançamento criado com sucesso!");

      onSaved?.();
      onClose?.();

      setForm({
        descricao: "",
        tipo: "",
        status: "pendente",
        valor: "",
        data_vencimento: "",
        data_pagamento: "",
      });

    } catch (err) {
      toast.error("Erro ao salvar", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">

      {/* Tipo */}
      <div className="space-y-1">
        <Label>Tipo de Lançamento</Label>
        <Select
          value={form.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
        >
          <option value="">Selecione</option>
          {tiposOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <Label>Descrição</Label>
        <Input
          placeholder="Ex: Repasse referente ao contrato #123"
          value={form.descricao}
          onChange={(e) => handleChange("descricao", e.target.value)}
        />
      </div>

      {/* Valor */}
      <div className="space-y-1">
        <Label>Valor (R$)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.valor}
          onChange={(e) => handleChange("valor", e.target.value)}
        />
      </div>

      {/* Data de vencimento */}
      <div className="space-y-1">
        <Label>Data de Vencimento</Label>
        <Input
          type="date"
          value={form.data_vencimento}
          onChange={(e) => handleChange("data_vencimento", e.target.value)}
        />
      </div>

      {/* Data de pagamento */}
      <div className="space-y-1">
        <Label>Data de Pagamento (opcional)</Label>
        <Input
          type="date"
          value={form.data_pagamento}
          onChange={(e) => handleChange("data_pagamento", e.target.value)}
        />
      </div>

      {/* Status */}
      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          value={form.status}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </div>

      {/* Botão */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin mr-2" />}
          {saving ? "Salvando..." : "Salvar Lançamento"}
        </Button>
      </div>
    </div>
  );
}

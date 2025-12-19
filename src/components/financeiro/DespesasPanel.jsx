"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  RotateCcw,
  Lock,
  ArrowDownRight,
  UserCheck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Badge from "@/components/admin/ui/Badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";
import { Input, Label, Select } from "@/components/admin/ui/Form";

import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/utils/formatters";
import { labelStatus, labelTipo } from "@/utils/financeiro.constants";

export default function DespesasPanel() {
  const toast = useToast();

  const [dados, setDados] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    tipo: "",
    profile_id: "",
    valor: "",
    data_vencimento: "",
    descricao: "",
  });

  /* =========================
     LOADERS
  ========================== */

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar despesas", err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarCorretores = async () => {
    const res = await fetch("/api/profiles?role=corretor", {
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok) setCorretores(json.data || []);
  };

  useEffect(() => {
    carregar();
    carregarCorretores();
  }, []);

  /* =========================
     DERIVAÇÕES
  ========================== */

  const despesas = useMemo(
    () => dados.filter((d) => d.tipo !== "repasse"),
    [dados]
  );

  const repasses = useMemo(
    () => dados.filter((d) => d.tipo === "repasse"),
    [dados]
  );

  /* =========================
     ACTIONS
  ========================== */

  const handleSave = async () => {
    try {
      if (!form.tipo || !form.valor || !form.data_vencimento) {
        toast.error("Campos obrigatórios", "Preencha os campos necessários.");
        return;
      }

      if (form.tipo === "comissao_corretor" && !form.profile_id) {
        toast.error("Corretor obrigatório");
        return;
      }

      const payload = {
        tipo: form.tipo,
        profile_id:
          form.tipo === "comissao_corretor" ? form.profile_id : undefined,
        valor: Number(form.valor),
        data_vencimento: form.data_vencimento,
        descricao: form.descricao,
      };

      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Despesa registrada com sucesso");
      setOpen(false);
      setForm({
        tipo: "",
        profile_id: "",
        valor: "",
        data_vencimento: "",
        descricao: "",
      });
      carregar();
    } catch (err) {
      toast.error("Erro ao salvar", err.message);
    }
  };

  /* =========================
     HELPERS
  ========================== */

  const badgeTipo = (tipo) => {
    if (tipo === "comissao_corretor")
      return (
        <Badge status="warning">
          <UserCheck size={12} className="mr-1" />
          Comissão
        </Badge>
      );

    if (tipo === "repasse")
      return (
        <Badge status="info">
          <ArrowDownRight size={12} className="mr-1" />
          Repasse
        </Badge>
      );

    return (
      <Badge status="default">
        <Wrench size={12} className="mr-1" />
        Custo
      </Badge>
    );
  };

  /* =========================
     RENDER
  ========================== */

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Despesas
        </h3>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} />
            Atualizar
          </Button>

          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Carregando despesas...
                </TableCell>
              </TableRow>
            )}

            {!loading && dados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Nenhuma despesa encontrada.
                </TableCell>
              </TableRow>
            )}

            {dados.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{badgeTipo(d.tipo)}</TableCell>

                <TableCell>
                  {d.profile?.nome_completo ||
                    d.imovel?.titulo ||
                    labelTipo(d.tipo)}
                </TableCell>

                <TableCell>
                  <Badge status={d.status}>
                    {labelStatus(d.status)}
                  </Badge>
                </TableCell>

                <TableCell className="text-red-600 font-medium">
                  {formatCurrency(d.valor)}
                </TableCell>

                <TableCell>{d.data_vencimento}</TableCell>

                <TableCell>
                  {d.tipo === "repasse" ? (
                    <Badge status="info">
                      <Lock size={12} className="mr-1" />
                      Automático
                    </Badge>
                  ) : (
                    <Badge status="success">Manual</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Registrar Despesa"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              className="w-1/2"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="w-1/2" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">

          <div>
            <Label>Tipo *</Label>
            <Select
              value={form.tipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, tipo: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              <option value="comissao_corretor">Comissão de Corretor</option>
              <option value="despesa_manutencao">Manutenção</option>
              <option value="pagamento_iptu">IPTU</option>
              <option value="pagamento_condominio">Condomínio</option>
              <option value="despesa_operacional">Despesa Operacional</option>
            </Select>
          </div>

          {form.tipo === "comissao_corretor" && (
            <div>
              <Label>Corretor *</Label>
              <Select
                value={form.profile_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, profile_id: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {corretores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_completo}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Label>Valor *</Label>
            <Input
              type="number"
              value={form.valor}
              onChange={(e) =>
                setForm((f) => ({ ...f, valor: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>Data de Vencimento *</Label>
            <Input
              type="date"
              value={form.data_vencimento}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  data_vencimento: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

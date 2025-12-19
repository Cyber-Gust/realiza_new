"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  RotateCcw,
  Lock,
  Home,
  ArrowUpRight,
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

export default function ReceitasPanel() {
  const toast = useToast();

  const [dados, setDados] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    tipo: "",
    imovel_id: "",
    valor: "",
    data_vencimento: "",
  });

  /* =========================
     LOADERS
  ========================== */

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro?type=receber", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar receitas", err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarImoveis = async () => {
    const res = await fetch("/api/imoveis?status=vendido", {
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok) setImoveis(json.data || []);
  };

  useEffect(() => {
    carregar();
    carregarImoveis();
  }, []);

  /* =========================
     ACTIONS
  ========================== */

  const handleSave = async () => {
    try {
      if (!form.tipo || !form.valor || !form.data_vencimento) {
        toast.error("Campos obrigatórios", "Preencha todos os campos.");
        return;
      }

      if (form.tipo === "receita_venda_imovel" && !form.imovel_id) {
        toast.error("Imóvel obrigatório");
        return;
      }

      const payload = {
        tipo: form.tipo,
        imovel_id:
          form.tipo === "receita_venda_imovel"
            ? form.imovel_id
            : undefined,
        valor: Number(form.valor),
        data_vencimento: form.data_vencimento,
        descricao: labelTipo(form.tipo),
      };

      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Receita registrada com sucesso");
      setOpen(false);
      setForm({
        tipo: "",
        imovel_id: "",
        valor: "",
        data_vencimento: "",
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
    if (tipo === "receita_venda_imovel")
      return (
        <Badge status="success">
          <Home size={12} className="mr-1" />
          Venda
        </Badge>
      );

    return (
      <Badge status="info">
        <ArrowUpRight size={12} className="mr-1" />
        Aluguel
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
          Receitas
        </h3>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} />
            Atualizar
          </Button>

          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* AVISO AUTOMÁTICO */}
      <Card className="p-3 bg-muted/30 text-sm text-muted-foreground">
        Receitas de aluguel e taxa administrativa são geradas automaticamente a
        partir dos contratos. Apenas vendas de imóveis podem ser registradas
        manualmente.
      </Card>

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
                  Carregando receitas...
                </TableCell>
              </TableRow>
            )}

            {!loading && dados.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Nenhuma receita encontrada.
                </TableCell>
              </TableRow>
            )}

            {dados.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{badgeTipo(r.tipo)}</TableCell>

                <TableCell>
                  {r.imovel?.titulo ||
                    (r.contrato?.id
                      ? `Contrato ${r.contrato.id.slice(0, 8)}`
                      : "-")}
                </TableCell>

                <TableCell>
                  <Badge status={r.status}>
                    {labelStatus(r.status)}
                  </Badge>
                </TableCell>

                <TableCell className="font-medium text-green-600">
                  {formatCurrency(r.valor)}
                </TableCell>

                <TableCell>{r.data_vencimento}</TableCell>

                <TableCell>
                  {r.tipo === "receita_venda_imovel" ? (
                    <Badge status="success">Manual</Badge>
                  ) : (
                    <Badge status="info">
                      <Lock size={12} className="mr-1" />
                      Automático
                    </Badge>
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
        title="Registrar Receita"
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
              <option value="receita_venda_imovel">
                Venda de Imóvel
              </option>
            </Select>
          </div>

          {form.tipo === "receita_venda_imovel" && (
            <div>
              <Label>Imóvel *</Label>
              <Select
                value={form.imovel_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, imovel_id: e.target.value }))
                }
              >
                <option value="">Selecione</option>
                {imoveis.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.titulo}
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
            <Label>Data de Recebimento *</Label>
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
        </div>
      </Modal>
    </div>
  );
}

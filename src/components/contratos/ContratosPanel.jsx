"use client";
import { useState, useEffect } from "react";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText, Edit, Trash2, Eye, AlertTriangle } from "lucide-react";
import CRMContratoForm from "./ContratoForm";
import CRMContratoDetailDrawer from "./ContratoDetailDrawer";


export default function CRMContratosPanel() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState({ tipo: "todos", status: "todos" });
  const [selectedContrato, setSelectedContrato] = useState(null);

  const loadContratos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contratos", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContratos(json.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar contratos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContratos();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return Toast.error("ID inválido!");

    try {
      const res = await fetch(`/api/contratos?id=${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Contrato removido!");
      setDeleteTarget(null);
      loadContratos();
    } catch (err) {
      Toast.error(err.message);
    }
  };

  const filtered = contratos.filter((c) => {
    if (filter.tipo !== "todos" && c.tipo !== filter.tipo) return false;
    if (filter.status !== "todos" && c.status !== filter.status) return false;
    return true;
  });

  const statusColor = (status) => {
    const map = {
      ativo: "bg-emerald-600",
      encerrado: "bg-gray-500",
      pendente_assinatura: "bg-yellow-600",
      inadimplente: "bg-red-600",
    };
    return map[status] || "bg-muted";
  };

  return (
    <div className="space-y-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <FileText size={18} /> Contratos
        </h3>

        <div className="flex flex-wrap gap-2 items-center">
            <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.tipo}
            onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
            >
            <option value="todos">Todos os tipos</option>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
            </select>

            <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente_assinatura">Pendente de Assinatura</option>
            <option value="encerrado">Encerrado</option>
            </select>

            <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
            <Plus size={16} /> Novo Contrato
            </Button>
        </div>
        </div>

        {/* LISTA */}
        {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
        ) : filtered.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">Nenhum contrato encontrado.</p>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((contrato) => (
            <Card
                key={contrato.id}
                className="p-4 space-y-2 hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedContrato(contrato.id)}
            >
                <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-foreground">
                    {contrato.imoveis?.titulo || "Imóvel sem título"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                    Tipo: {contrato.tipo} | Valor: R$ {Number(contrato.valor_acordado).toFixed(2)}
                    </p>
                </div>

                <div className="flex gap-1">
                    <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        setEditing(contrato);
                        setOpenForm(true);
                    }}
                    >
                    <Edit size={16} />
                    </Button>
                    <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(contrato);
                    }}
                    >
                    <Trash2 size={16} className="text-red-500" />
                    </Button>
                </div>
                </div>

                <div className="text-xs text-muted-foreground flex justify-between">
                <span>
                    {contrato.data_inicio} → {contrato.data_fim}
                </span>
                <span
                    className={`px-2 py-0.5 rounded-full text-white ${statusColor(contrato.status)}`}
                >
                    {contrato.status || "sem status"}
                </span>
                </div>
            </Card>
            ))}
        </div>
        )}

        {/* MODAL FORM */}
        <Modal
        open={openForm}
        onOpenChange={(val) => {
            setOpenForm(val);
            if (!val) setEditing(null);
        }}
        title={editing ? "Editar Contrato" : "Novo Contrato"}
        >
        <CRMContratoForm
            contrato={editing}
            onClose={() => {
            setOpenForm(false);
            setEditing(null);
            }}
            onSaved={loadContratos}
        />
        </Modal>

        {/* MODAL EXCLUSÃO */}
        <Modal
        open={!!deleteTarget}
        onOpenChange={(val) => !val && setDeleteTarget(null)}
        title="Remover Contrato"
        >
        {deleteTarget && (
            <div className="space-y-4">
            <div className="flex items-start gap-3 text-foreground">
                <AlertTriangle className="text-red-500 mt-1" />
                <div>
                <p>
                    Tem certeza que deseja remover o contrato do imóvel{" "}
                    <strong>{deleteTarget.imoveis?.titulo}</strong>?
                </p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button className="w-1/2" variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
                </Button>
                <Button className="w-1/2 bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
                Confirmar
                </Button>
            </div>
            </div>
        )}
        </Modal>

        {/* DRAWER DETALHES */}
        {selectedContrato && (
        <CRMContratoDetailDrawer
            contratoId={selectedContrato}
            onClose={() => setSelectedContrato(null)}
            onUpdated={loadContratos}
        />
        )}
    </div>
    );
}

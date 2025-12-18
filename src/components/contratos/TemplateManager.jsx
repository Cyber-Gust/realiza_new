"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/admin/ui/Form";
import { Card } from "@/components/admin/ui/Card";
import { Trash2, Edit, Plus } from "lucide-react";

export default function TemplateManager({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await fetch("/api/contratos/templates");
    const json = await res.json();
    setTemplates(json.data || []);
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      await load();
    };
    fetchTemplates();
  }, []);

  const saveTemplate = async () => {
    const method = editing?.id ? "PATCH" : "POST";

    await fetch("/api/contratos/templates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });

    setEditing(null);
    load();
  };

  const removeTemplate = async (id) => {
    await fetch(`/api/contratos/templates?id=${id}`, {
      method: "DELETE",
    });
    load();
  };

  return (
    <div className="space-y-6">

      {/* LISTA */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-lg">Templates Cadastrados</h3>

          <Button
            onClick={() =>
              setEditing({ nome: "", tipo: "locacao", conteudo: "" })
            }
          >
            <Plus size={16} /> Novo
          </Button>
        </div>

        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center border p-3 rounded-md"
            >
              <div>
                <p className="font-medium">{t.nome}</p>
                <p className="text-xs text-muted-foreground">{t.tipo}</p>
              </div>

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                  <Edit size={16} />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => removeTemplate(t.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* FORM */}
      {editing && (
        <Card className="p-4 space-y-4 border-t pt-6">
          <div>
            <Label>Nome</Label>
            <Input
              value={editing.nome}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, nome: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>Tipo</Label>
            <Select
              value={editing.tipo}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, tipo: e.target.value }))
              }
            >
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
              <option value="administracao">Administração</option>
            </Select>
          </div>

          <div>
            <Label>Conteúdo</Label>
            <Textarea
              className="min-h-[200px]"
              value={editing.conteudo}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, conteudo: e.target.value }))
              }
            />
          </div>

          <Button className="w-full" onClick={saveTemplate}>
            Salvar Template
          </Button>
        </Card>
      )}
    </div>
  );
}

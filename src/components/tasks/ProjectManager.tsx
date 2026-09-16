import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useTaskData } from "@/hooks/use-task-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/common/SectionCard";

export function ProjectManager({
  creating,
  onCreatingChange,
}: {
  creating: boolean;
  onCreatingChange: (open: boolean) => void;
}) {
  const { projects, pending, saving, saveProject, setProjectActive } = useTaskData();
  const [name, setName] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  return (
    <SectionCard title="Projetos" description="Agrupe tarefas em projetos quando fizer sentido.">
      {!projects.length && (
        <p className="mb-4 text-sm">Nenhum projeto ainda. Use “Novo projeto” para começar.</p>
      )}
      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!saving) onCreatingChange(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo projeto</DialogTitle>
            <DialogDescription>Dê um nome ao projeto para agrupar suas tarefas.</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await saveProject(name);
              setMessage(result.valid ? "Projeto criado." : result.reason);
              if (result.valid) {
                setName("");
                onCreatingChange(false);
              }
            }}
          >
            <Input
              className="max-w-sm"
              autoFocus
              required
              maxLength={150}
              aria-label="Nome do novo projeto"
              placeholder="Nome do novo projeto"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button disabled={pending || !name.trim()}>Criar projeto</Button>
          </form>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <ul className="mt-4 space-y-3">
        {projects.map((project) => (
          <li key={project.id}>
            <form
              className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await saveProject(names[project.id] ?? project.name, project.id);
                setMessage(result.valid ? "Projeto renomeado." : result.reason);
              }}
            >
              <Input
                className="max-w-sm"
                required
                maxLength={150}
                aria-label={`Nome do projeto ${project.name}`}
                value={names[project.id] ?? project.name}
                onChange={(event) => setNames({ ...names, [project.id]: event.target.value })}
              />
              <span className="text-sm text-muted-foreground">
                {project.active ? "Ativo" : "Arquivado"}
              </span>
              <Button disabled={pending} variant="outline">
                Renomear
              </Button>
              <Button
                disabled={pending}
                type="button"
                variant="ghost"
                aria-label={`${project.active ? "Arquivar" : "Reativar"} projeto: ${project.name}`}
                onClick={async () => {
                  const result = await setProjectActive(project.id, !project.active);
                  setMessage(result.valid ? "Projeto atualizado." : result.reason);
                }}
              >
                {project.active ? "Arquivar" : "Reativar"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {message && (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      )}
    </SectionCard>
  );
}

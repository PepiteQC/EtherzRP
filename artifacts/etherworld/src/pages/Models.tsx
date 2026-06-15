import { useState } from "react";
import { Link } from "wouter";
import { useListModels, useDeleteModel, getListModelsQueryKey, useGetModelStats } from "@workspace/api-client-react";
import { ModelViewer } from "@/components/ModelViewer";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Models() {
  const { data: models = [], isLoading } = useListModels();
  const { data: stats } = useGetModelStats();
  const deleteModel = useDeleteModel();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const handleDelete = (id: number, prompt: string) => {
    deleteModel.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
        toast({ title: "Dissolved", description: `"${prompt}" removed from the vault.`, className: "border-violet-500 bg-[#070010] text-violet-300 font-mono" });
        if (preview === prompt) setPreview(null);
      },
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#070010] text-white font-mono">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-20">
        <Link href="/" className="text-xl font-bold tracking-[0.15em] text-violet-400 hover:text-violet-300 transition-colors">
          ETHERWORLD
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xs tracking-[0.2em] text-white/20">
            {stats ? `${stats.total} creation${stats.total !== 1 ? "s" : ""}` : ""}
          </span>
          <Link href="/viewer" className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">Viewer</Link>
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">Generator</Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100dvh - 57px)" }}>
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-white/5 overflow-y-auto bg-black/30">
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">The Vault</p>
          </div>

          {isLoading && (
            <div className="p-4 flex flex-col gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && models.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-white/20 text-xs tracking-[0.2em] uppercase">Vault is empty</p>
              <Link href="/" className="mt-4 inline-block text-violet-400 text-xs hover:underline">
                Generate something
              </Link>
            </div>
          )}

          <div className="divide-y divide-white/5">
            {models.map((m) => (
              <button
                key={m.id}
                data-testid={`model-card-${m.id}`}
                onClick={() => setPreview(m.prompt)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors group ${
                  preview === m.prompt
                    ? "bg-violet-500/10 border-l-2 border-violet-500"
                    : "hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${preview === m.prompt ? "text-violet-300" : "text-white/60"}`}>
                    {m.prompt}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {new Date(m.createdAt).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  data-testid={`button-delete-${m.id}`}
                  role="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id, m.prompt); }}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs shrink-0 pt-0.5"
                  title="Delete"
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* 3D Preview pane */}
        <main className="flex-1 relative overflow-hidden">
          {preview ? (
            <>
              <div className="absolute inset-0">
                <ModelViewer prompt={preview} />
              </div>
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-10">
                <div className="bg-black/70 backdrop-blur border border-white/10 px-4 py-1.5 rounded text-[10px] uppercase tracking-[0.2em] text-white/50 max-w-lg truncate">
                  <span className="text-violet-400">&gt;</span> {preview}
                </div>
              </div>
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,#070010_100%)]" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <p className="text-3xl font-bold tracking-[0.15em] text-white/10">SELECT A CREATION</p>
                <p className="text-xs tracking-[0.2em] text-white/10 uppercase">from the vault on the left</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

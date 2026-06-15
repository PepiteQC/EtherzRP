import { Link, useRoute } from "wouter";
import { useGetModel, useDeleteModel, getListModelsQueryKey, getGetModelQueryKey } from "@workspace/api-client-react";
import { ModelViewer } from "@/components/ModelViewer";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ModelDetail() {
  const [, params] = useRoute("/models/:id");
  const id = Number(params?.id);
  const { data: model, isLoading } = useGetModel(id, { query: { enabled: !!id, queryKey: getGetModelQueryKey(id) } });
  const deleteModel = useDeleteModel();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDelete = () => {
    if (!model) return;
    deleteModel.mutate({ id: model.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListModelsQueryKey() });
        toast({ title: "Dissolved", description: "Creation removed from the vault.", className: "border-violet-500 bg-[#070010] text-violet-300 font-mono" });
        setLocation("/models");
      },
    });
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#070010] text-white font-mono">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-20">
        <Link href="/" className="text-xl font-bold tracking-[0.15em] text-violet-400 hover:text-violet-300 transition-colors">
          ETHERWORLD
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/viewer" className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">Viewer</Link>
          <Link href="/models" className="text-xs uppercase tracking-[0.2em] text-white/30 hover:text-violet-400 transition-colors">← Vault</Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100dvh - 57px)" }}>
        {/* 3D viewer */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            </div>
          ) : model ? (
            <>
              <div className="absolute inset-0">
                <ModelViewer prompt={model.prompt} />
              </div>
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,#070010_100%)]" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/20 text-xs tracking-[0.2em] uppercase">Creation not found</p>
            </div>
          )}
        </div>

        {/* Info panel */}
        <aside className="w-72 shrink-0 border-l border-white/5 bg-black/40 flex flex-col p-6 gap-6">
          {model ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Prompt</p>
                <p className="text-sm text-white/80 leading-relaxed">{model.prompt}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Created</p>
                <p className="text-xs text-white/50">
                  {new Date(model.createdAt).toLocaleString(undefined, {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Engine</p>
                <p className="text-xs text-violet-400/70">Three.js Procedural</p>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <Link
                  href="/"
                  className="block text-center py-2.5 px-4 rounded border border-violet-500/50 text-violet-400 text-xs uppercase tracking-[0.15em] hover:bg-violet-500/10 transition-colors"
                >
                  New Creation
                </Link>
                <button
                  data-testid="button-delete"
                  onClick={handleDelete}
                  disabled={deleteModel.isPending}
                  className="py-2.5 px-4 rounded border border-red-500/30 text-red-400/60 text-xs uppercase tracking-[0.15em] hover:bg-red-500/10 hover:border-red-500/60 hover:text-red-400 transition-colors disabled:opacity-30"
                >
                  {deleteModel.isPending ? "Dissolving..." : "Dissolve"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

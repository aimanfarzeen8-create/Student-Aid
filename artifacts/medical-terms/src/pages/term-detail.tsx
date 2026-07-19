import { useRoute, Link } from "wouter";
import { 
  useGetTerm, 
  useToggleFavorite, 
  useToggleLearned, 
  useDeleteTerm,
  getGetTermQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Heart, 
  GraduationCap, 
  CheckCircle2, 
  Trash2, 
  Edit,
  Quote,
  Volume2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function TermDetail() {
  const [, params] = useRoute("/terms/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: term, isLoading, error } = useGetTerm(id, { 
    query: { enabled: !!id, queryKey: getGetTermQueryKey(id) } 
  });

  const toggleFav = useToggleFavorite();
  const toggleLearn = useToggleLearned();
  const deleteMutation = useDeleteTerm();

  if (error) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-medium text-destructive mb-2">Error loading term</h2>
        <Button asChild variant="outline">
          <Link href="/terms">Back to Dictionary</Link>
        </Button>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    toggleFav.mutate({ id }, {
      onSuccess: (updatedTerm) => {
        queryClient.setQueryData(getGetTermQueryKey(id), updatedTerm);
      }
    });
  };

  const handleToggleLearned = () => {
    toggleLearn.mutate({ id }, {
      onSuccess: (updatedTerm) => {
        queryClient.setQueryData(getGetTermQueryKey(id), updatedTerm);
      }
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Term deleted");
        setLocation("/terms");
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button asChild variant="ghost" className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/terms">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dictionary
        </Link>
      </Button>

      {isLoading || !term ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-border/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="uppercase tracking-widest text-xs font-semibold px-2.5 py-1">
                  {term.category}
                </Badge>
                <Badge variant="outline" className={`uppercase tracking-widest text-xs font-semibold px-2.5 py-1
                  ${term.difficulty === 'beginner' ? 'text-green-600 border-green-200' : 
                    term.difficulty === 'intermediate' ? 'text-amber-600 border-amber-200' : 
                    'text-red-600 border-red-200'}
                `}>
                  {term.difficulty}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
                {term.term}
              </h1>
              {term.pronunciation && (
                <div className="flex items-center text-muted-foreground font-mono text-lg gap-2">
                  <Volume2 className="h-5 w-5" />
                  <span>/{term.pronunciation}/</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start bg-secondary/20 p-1.5 rounded-lg border border-border/50">
              <Button 
                variant={term.isFavorite ? "secondary" : "ghost"} 
                size="sm"
                className={`gap-2 ${term.isFavorite ? 'text-destructive hover:text-destructive/80' : ''}`}
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${term.isFavorite ? 'fill-current' : ''}`} />
                {term.isFavorite ? 'Favorited' : 'Favorite'}
              </Button>
              <Button 
                variant={term.isLearned ? "secondary" : "ghost"} 
                size="sm"
                className={`gap-2 ${term.isLearned ? 'text-emerald-600 hover:text-emerald-700' : ''}`}
                onClick={handleToggleLearned}
              >
                {term.isLearned ? <CheckCircle2 className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                {term.isLearned ? 'Mastered' : 'Mark Learned'}
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{term.term}" from your dictionary. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Term
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3 pt-4">
            <div className="md:col-span-2 space-y-8">
              <section className="space-y-4">
                <h2 className="text-xl font-serif font-semibold text-primary border-b border-border/40 pb-2">Definition</h2>
                <p className="text-lg leading-relaxed text-foreground/90 font-medium">
                  {term.definition}
                </p>
              </section>

              {term.example && (
                <section className="space-y-4">
                  <h2 className="text-xl font-serif font-semibold text-primary border-b border-border/40 pb-2">Clinical Context</h2>
                  <div className="bg-secondary/30 rounded-xl p-6 border border-border/50 relative overflow-hidden">
                    <Quote className="absolute top-4 left-4 h-12 w-12 text-primary/10 rotate-180" />
                    <p className="relative z-10 text-foreground/80 italic text-lg ml-6">
                      "{term.example}"
                    </p>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 space-y-4">
                <h3 className="font-semibold text-primary uppercase tracking-wider text-sm">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added</span>
                    <span className="font-medium text-foreground">
                      {new Date(term.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-foreground">
                      {term.isLearned ? 'Mastered' : 'Learning'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

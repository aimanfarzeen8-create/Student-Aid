import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  useListTerms, 
  useToggleFavorite, 
  useToggleLearned,
  useListCategories,
  getListTermsQueryKey,
  Term
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Heart, 
  GraduationCap, 
  Filter,
  CheckCircle2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function Terms() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [learnedOnly, setLearnedOnly] = useState(false);

  // Simple debounce for search
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // We fetch all and filter locally for a snappier experience, 
  // or we could pass params to the hook if API supported all of them perfectly.
  // The API supports these params, so let's use them.
  const { data: terms, isLoading } = useListTerms({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    difficulty: difficulty !== "all" ? difficulty as any : undefined,
    favoritesOnly: favoritesOnly ? true : undefined,
    learnedOnly: learnedOnly ? true : undefined,
  });

  const { data: categories = [] } = useListCategories();

  const queryClient = useQueryClient();
  const toggleFav = useToggleFavorite();
  const toggleLearn = useToggleLearned();

  const handleToggleFavorite = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFav.mutate({ id }, {
      onSuccess: (updatedTerm) => {
        // Update cache locally for immediate feedback
        queryClient.setQueryData<Term[]>(getListTermsQueryKey({
          search: debouncedSearch || undefined,
          category: category !== "all" ? category : undefined,
          difficulty: difficulty !== "all" ? difficulty as any : undefined,
          favoritesOnly: favoritesOnly ? true : undefined,
          learnedOnly: learnedOnly ? true : undefined,
        }), (old) => old?.map(t => t.id === id ? updatedTerm : t));
      }
    });
  };

  const handleToggleLearned = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLearn.mutate({ id }, {
      onSuccess: (updatedTerm) => {
        queryClient.setQueryData<Term[]>(getListTermsQueryKey({
          search: debouncedSearch || undefined,
          category: category !== "all" ? category : undefined,
          difficulty: difficulty !== "all" ? difficulty as any : undefined,
          favoritesOnly: favoritesOnly ? true : undefined,
          learnedOnly: learnedOnly ? true : undefined,
        }), (old) => old?.map(t => t.id === id ? updatedTerm : t));
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Dictionary</h1>
          <p className="text-muted-foreground mt-1">Browse and search your medical terms.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search terms or definitions..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filters
                {(favoritesOnly || learnedOnly) && (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 h-5 rounded-sm">
                    {(favoritesOnly ? 1 : 0) + (learnedOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Show only</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={favoritesOnly} 
                onCheckedChange={setFavoritesOnly}
              >
                Favorites
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={learnedOnly} 
                onCheckedChange={setLearnedOnly}
              >
                Learned
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : terms?.length === 0 ? (
        <div className="text-center py-20 bg-secondary/20 rounded-xl border border-dashed border-border">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No terms found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
            We couldn't find any terms matching your current search and filters.
          </p>
          <Button asChild variant="outline">
            <Link href="/add">Add New Term</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terms?.map((term) => (
            <Link key={term.id} href={`/terms/${term.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group flex flex-col shadow-sm border-border/60">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {term.term}
                      </h3>
                      {term.pronunciation && (
                        <p className="text-xs font-mono text-muted-foreground">/{term.pronunciation}/</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleToggleFavorite(e, term.id)}
                      >
                        <Heart className={`h-4 w-4 ${term.isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {term.definition}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-secondary/50">
                        {term.category}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-semibold
                        ${term.difficulty === 'beginner' ? 'text-green-600 border-green-200' : 
                          term.difficulty === 'intermediate' ? 'text-amber-600 border-amber-200' : 
                          'text-red-600 border-red-200'}
                      `}>
                        {term.difficulty}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 rounded-full ${term.isLearned ? 'text-emerald-500 bg-emerald-50' : 'text-muted-foreground'}`}
                      onClick={(e) => handleToggleLearned(e, term.id)}
                      title={term.isLearned ? "Mark as unlearned" : "Mark as learned"}
                    >
                      {term.isLearned ? <CheckCircle2 className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

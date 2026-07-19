import { useState, useEffect } from "react";
import { useListTerms, Term } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, RotateCcw, Frown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Flashcards() {
  const [difficulty, setDifficulty] = useState<string>("all");
  const [unlearnedOnly, setUnlearnedOnly] = useState(false);
  
  const { data: allTerms, isLoading } = useListTerms();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);

  // Filter terms based on selection
  useEffect(() => {
    if (allTerms) {
      const filtered = allTerms.filter(t => {
        const matchDiff = difficulty === "all" || t.difficulty === difficulty;
        const matchLearn = unlearnedOnly ? !t.isLearned : true;
        return matchDiff && matchLearn;
      });
      // Shuffle array for better study experience
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      setFilteredTerms(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [allTerms, difficulty, unlearnedOnly]);

  const handleNext = () => {
    if (currentIndex < filteredTerms.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(c => c + 1);
      }, 150); // wait for flip back animation
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex(c => c - 1);
      }, 150);
    }
  };

  const currentTerm = filteredTerms[currentIndex];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-3.5rem)] animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Flashcards</h1>
          <p className="text-muted-foreground mt-1">Drill your medical terminology.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-secondary/20 p-2 rounded-xl border border-border/50">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded-md border border-input">
            <Switch 
              id="unlearned-mode" 
              checked={unlearnedOnly}
              onCheckedChange={setUnlearnedOnly}
            />
            <Label htmlFor="unlearned-mode" className="text-xs font-medium cursor-pointer">Unlearned Only</Label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Skeleton className="w-full max-w-2xl h-[400px] rounded-3xl" />
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center mb-2">
            <Sparkles className="h-10 w-10 text-primary/50" />
          </div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">You're all caught up!</h2>
          <p className="text-muted-foreground max-w-md">
            No terms match your current filters. Try changing difficulty or adding more terms.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full mx-auto pb-10">
          <div className="w-full flex justify-between items-center mb-6 text-sm font-medium text-muted-foreground px-4">
            <span>Card {currentIndex + 1} of {filteredTerms.length}</span>
            <Badge variant="outline" className="uppercase tracking-widest text-[10px]">
              {currentTerm.category}
            </Badge>
          </div>

          <div 
            className="w-full h-[400px] md:h-[450px] perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div 
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
              {/* Front of card (Term) */}
              <Card className="absolute w-full h-full backface-hidden shadow-lg border-2 border-border flex flex-col items-center justify-center p-8 bg-card hover:border-primary/30 transition-colors">
                <CardContent className="text-center space-y-4 p-0">
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-foreground">
                    {currentTerm.term}
                  </h2>
                  {currentTerm.pronunciation && (
                    <p className="text-xl font-mono text-muted-foreground">
                      /{currentTerm.pronunciation}/
                    </p>
                  )}
                  <div className="absolute bottom-6 left-0 w-full text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RotateCcw className="h-4 w-4" /> Tap to flip
                  </div>
                </CardContent>
              </Card>

              {/* Back of card (Definition) */}
              <Card className="absolute w-full h-full backface-hidden rotate-y-180 shadow-lg border-2 border-primary/20 flex flex-col items-center justify-center p-8 bg-primary/5">
                <CardContent className="text-center w-full max-w-xl mx-auto space-y-8 p-0">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Definition</h3>
                    <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                      {currentTerm.definition}
                    </p>
                  </div>
                  
                  {currentTerm.example && (
                    <div className="space-y-2 pt-6 border-t border-primary/10">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Clinical Example</h3>
                      <p className="text-lg text-foreground/80 italic">
                        "{currentTerm.example}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10 w-full">
            <Button 
              variant="outline" 
              size="lg"
              className="w-32 rounded-full h-14"
              disabled={currentIndex === 0}
              onClick={handlePrev}
            >
              <ChevronLeft className="mr-2 h-5 w-5" /> Prev
            </Button>
            
            <Button 
              size="lg"
              className="w-32 rounded-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              onClick={handleNext}
              disabled={currentIndex === filteredTerms.length - 1}
            >
              Next <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

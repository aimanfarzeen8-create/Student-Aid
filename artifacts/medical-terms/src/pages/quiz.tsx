import { useState } from "react";
import { useGetQuizTerms, QuizQuestion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Quiz() {
  const [difficulty, setDifficulty] = useState<string>("all");
  const [count, setCount] = useState<string>("10");
  const [isStarted, setIsStarted] = useState(false);
  
  const { data: questions, isLoading, refetch, isRefetching } = useGetQuizTerms({
    count: parseInt(count),
    difficulty: difficulty !== "all" ? difficulty as any : undefined
  }, {
    query: { enabled: isStarted }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{correct: boolean, question: QuizQuestion, chosen: string}[]>([]);

  const handleStart = () => {
    setIsStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswer(null);
    setAnswers([]);
    refetch();
  };

  const handleAnswer = (choice: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks
    
    setSelectedAnswer(choice);
    const isCorrect = choice === questions![currentIndex].correctAnswer;
    
    if (isCorrect) setScore(s => s + 1);
    
    setAnswers(prev => [...prev, {
      correct: isCorrect,
      question: questions![currentIndex],
      chosen: choice
    }]);

    setTimeout(() => {
      if (currentIndex < questions!.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
      } else {
        setShowResults(true);
      }
    }, 1500);
  };

  if (!isStarted) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-6 mb-10">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Knowledge Check</h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Test your medical terminology recall with multiple choice questions.
          </p>
        </div>

        <Card className="w-full max-w-md border-border/50 shadow-md">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty Level</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mixed (All Levels)</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button size="lg" className="w-full h-12 text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isRefetching || !questions) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (showResults) {
    const percent = Math.round((score / questions.length) * 100);
    let message = "Good effort!";
    if (percent >= 90) message = "Outstanding!";
    else if (percent >= 70) message = "Well done!";
    else if (percent < 50) message = "Keep studying!";

    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in duration-500 space-y-8">
        <Card className="border-border/50 text-center overflow-hidden">
          <div className="bg-primary/5 py-10 px-6 border-b border-border/50">
            <h2 className="text-3xl font-serif font-bold text-primary mb-2">{message}</h2>
            <div className="text-6xl font-bold text-foreground my-6">
              {score}<span className="text-3xl text-muted-foreground">/{questions.length}</span>
            </div>
            <p className="text-lg font-medium text-muted-foreground">Score: {percent}%</p>
          </div>
          <CardContent className="p-6">
            <Button size="lg" onClick={handleStart} className="w-full sm:w-auto h-12 px-8">
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="font-serif text-xl font-semibold border-b border-border pb-2">Review Answers</h3>
          {answers.map((ans, i) => (
            <Card key={i} className={`border ${ans.correct ? 'border-emerald-200 bg-emerald-50/30' : 'border-destructive/20 bg-destructive/5'}`}>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="mt-1 shrink-0">
                  {ans.correct ? 
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : 
                    <XCircle className="h-6 w-6 text-destructive" />
                  }
                </div>
                <div className="space-y-2 w-full">
                  <p className="font-serif font-bold text-lg">{ans.question.term}</p>
                  
                  {!ans.correct && (
                    <div className="text-sm">
                      <span className="text-destructive font-medium">Your answer:</span> {ans.chosen}
                    </div>
                  )}
                  
                  <div className="text-sm bg-background p-3 rounded border border-border/50 shadow-sm mt-2">
                    <span className="text-emerald-600 font-semibold mr-2">Correct definition:</span>
                    <span className="text-foreground">{ans.question.correctAnswer}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>
        <Progress value={((currentIndex) / questions.length) * 100} className="h-2" />
      </div>

      <Card className="border-border/50 shadow-md">
        <CardContent className="p-8 md:p-12 text-center bg-primary/5">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
            {currentQ.term}
          </h2>
          <p className="text-muted-foreground mt-4 font-medium">Select the correct definition</p>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {currentQ.choices.map((choice, i) => {
          const isSelected = selectedAnswer === choice;
          const isCorrect = choice === currentQ.correctAnswer;
          
          let stateClass = "hover:border-primary/50 hover:bg-secondary/20 cursor-pointer";
          if (selectedAnswer) {
            if (isCorrect) {
              stateClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
            } else if (isSelected) {
              stateClass = "border-destructive bg-destructive/10 text-destructive";
            } else {
              stateClass = "opacity-50 cursor-not-allowed";
            }
          }

          return (
            <div 
              key={i}
              onClick={() => handleAnswer(choice)}
              className={`p-5 rounded-xl border-2 border-border/50 transition-all duration-200 flex items-center justify-between group ${stateClass}`}
            >
              <span className="text-base font-medium flex-1 pr-4">{choice}</span>
              {selectedAnswer && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
              {selectedAnswer && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

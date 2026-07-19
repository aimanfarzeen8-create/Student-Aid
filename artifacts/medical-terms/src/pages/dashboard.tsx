import { useGetStats, useListTerms } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Heart, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: terms, isLoading: termsLoading } = useListTerms();

  const recentlyAdded = terms?.slice(0, 5) || [];
  const progressPercent = stats?.total ? Math.round((stats.learned / stats.total) * 100) : 0;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Here is an overview of your study progress.</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Terms</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Learned</CardTitle>
              <GraduationCap className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.learned || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{progressPercent}% progress</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
              <Heart className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.favorites || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary">Mastery Score</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Categories</CardTitle>
            <CardDescription>Breakdown by medical field</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : stats?.byCategory.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No categories yet.</div>
            ) : (
              <div className="space-y-4">
                {stats?.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">{cat.learned} / {cat.count}</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(cat.learned / Math.max(cat.count, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">Recently Added</CardTitle>
              <CardDescription>Latest terms in your dictionary</CardDescription>
            </div>
            <Link href="/terms" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {termsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentlyAdded.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No terms added yet.</p>
                <Link href="/add" className="text-primary text-sm mt-2 font-medium">Add your first term</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlyAdded.map(term => (
                  <Link key={term.id} href={`/terms/${term.id}`}>
                    <div className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {term.term}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {term.definition}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize shrink-0 ml-4">
                        {term.difficulty}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

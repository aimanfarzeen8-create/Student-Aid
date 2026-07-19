import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTerm } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  term: z.string().min(1, "Term name is required"),
  pronunciation: z.string().optional(),
  definition: z.string().min(5, "Definition must be at least 5 characters"),
  example: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export default function AddTerm() {
  const [, setLocation] = useLocation();
  const createMutation = useCreateTerm();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: "",
      pronunciation: "",
      definition: "",
      example: "",
      category: "Anatomy",
      difficulty: "beginner",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({ data: values as any }, {
      onSuccess: (newTerm) => {
        toast.success("Term added successfully!");
        setLocation(`/terms/${newTerm.id}`);
      },
      onError: (err) => {
        toast.error("Failed to add term", { description: err.error });
      }
    });
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Add New Term</h1>
        <p className="text-muted-foreground mt-1">Expand your medical dictionary with new terminology.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-secondary/10 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Term Details
          </CardTitle>
          <CardDescription>Enter the definition, category, and context for the new term.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Term *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Myocardial Infarction" {...field} className="font-semibold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pronunciation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pronunciation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., my-o-CAR-dee-al in-FARK-shun" {...field} className="font-mono text-sm" />
                      </FormControl>
                      <FormDescription>Optional phonetic spelling</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="definition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Definition *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Clear, concise medical definition..." 
                        className="min-h-[100px] resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="example"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinical Example</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="How is this used in a clinical context? (e.g., The patient presented with chest pain indicative of a myocardial infarction.)" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Context helps with memorization</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border/50 mt-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cardiology, Anatomy, Pharmacology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full md:w-auto px-8"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Term to Dictionary"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

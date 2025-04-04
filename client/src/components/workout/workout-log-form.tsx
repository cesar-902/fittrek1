import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutLogSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplets, PlusCircle, MinusCircle, Play, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Esquema validado para log de treino
const workoutLogSchema = insertWorkoutLogSchema
  .omit({ userId: true, date: true })
  .extend({
    workoutId: z.union([z.coerce.number().positive(), z.literal("")]).optional().transform(val => 
      val === "" ? undefined : val
    ),
    completedExercises: z.coerce.number().min(0),
    waterIntake: z.coerce.number().min(0),
    duration: z.coerce.number().min(0),
    notes: z.string().optional()
  });

type WorkoutLogFormValues = z.infer<typeof workoutLogSchema>;

export default function WorkoutLogForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [waterAmount, setWaterAmount] = useState(200); // ml
  
  const form = useForm<WorkoutLogFormValues>({
    resolver: zodResolver(workoutLogSchema),
    defaultValues: {
      completedExercises: 0,
      waterIntake: 0,
      duration: 0
    }
  });
  
  const createLogMutation = useMutation({
    mutationFn: async (data: WorkoutLogFormValues) => {
      const res = await apiRequest("POST", "/api/logs", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Falha ao registrar o treino"
        );
      }
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Treino registrado com sucesso!",
        description: "Seu progresso foi salvo.",
      });
      
      form.reset({
        completedExercises: 0,
        waterIntake: 0,
        duration: 0, 
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar treino",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: WorkoutLogFormValues) => {
    createLogMutation.mutate(data);
  };
  
  const addWater = () => {
    const currentAmount = form.getValues("waterIntake") || 0;
    form.setValue("waterIntake", currentAmount + waterAmount);
  };
  
  const isPending = createLogMutation.isPending;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Registrar Treino</CardTitle>
        <CardDescription>
          Registre seu treino e acompanhe seu progresso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workout" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="workout">Treino</TabsTrigger>
            <TabsTrigger value="water">Água</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workout">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="completedExercises"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercícios Completados</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Número de exercícios" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Quantos exercícios você completou neste treino?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (segundos)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Duração em segundos" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Quanto tempo durou seu treino (em segundos)?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas sobre seu treino" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="waterIntake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingestão de Água (ml)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Quantidade em ml" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Quanto de água você consumiu durante o treino?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Registrar Treino
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="water">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <Droplets className="h-16 w-16 text-primary" />
                <div className="text-4xl font-bold ml-4">
                  {form.watch("waterIntake") || 0} ml
                </div>
              </div>
              
              <div className="flex items-center space-x-4 justify-center">
                <Select
                  value={waterAmount.toString()}
                  onValueChange={(value) => setWaterAmount(parseInt(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Quantidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 ml</SelectItem>
                    <SelectItem value="200">200 ml</SelectItem>
                    <SelectItem value="300">300 ml</SelectItem>
                    <SelectItem value="500">500 ml</SelectItem>
                    <SelectItem value="1000">1000 ml</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={addWater} 
                  variant="outline"
                  type="button"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={() => form.setValue("waterIntake", 0)} 
                  variant="outline"
                  type="button"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <MinusCircle className="h-5 w-5 mr-2" />
                  Zerar Contador
                </Button>
              </div>
              
              <Button 
                onClick={form.handleSubmit(onSubmit)} 
                className="w-full mt-6" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Registrar Água
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
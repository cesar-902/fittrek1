import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Upload } from "lucide-react";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import CsvUpload from './csv-upload';
import CsvViewer from './csv-viewer';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Exercise, Workout, WorkoutDay } from '@shared/schema';

export default function WorkoutPlanViewer() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('exercises');
  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch workouts
  const { 
    data: workouts = [], 
    isLoading: isLoadingWorkouts,
  } = useQuery<Workout[]>({
    queryKey: ['/api/workouts'],
  });
  
  // Selected workout state
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  
  // Make sure we have a valid selection when workouts load
  const selectedWorkout = selectedWorkoutId 
    ? workouts.find(w => w.id === selectedWorkoutId) 
    : workouts[0];
    
  // Set initial selection when data loads
  if (workouts.length > 0 && !selectedWorkoutId && !isLoadingWorkouts) {
    setSelectedWorkoutId(workouts[0].id);
  }
  
  // Fetch workout days for the selected workout
  const { 
    data: workoutDays = [],
    isLoading: isLoadingWorkoutDays,
  } = useQuery({
    queryKey: ['/api/workouts', selectedWorkoutId, 'days'],
    queryFn: async () => {
      if (!selectedWorkoutId) return [];
      const res = await fetch(`/api/workouts/${selectedWorkoutId}/days`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch workout days');
      }
      return await res.json();
    },
    enabled: !!selectedWorkoutId,
  });
  
  // Create new workout mutation
  const createWorkoutMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest('POST', '/api/workouts', { name });
      return await res.json();
    },
    onSuccess: (newWorkout) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      setSelectedWorkoutId(newWorkout.id);
      setWorkoutNameInput('');
      setIsCreateDialogOpen(false);
      toast({
        title: 'Treino criado',
        description: `Seu novo treino "${newWorkout.name}" foi criado com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar treino',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleCreateWorkout = () => {
    if (!workoutNameInput.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Por favor, insira um nome para o treino.',
        variant: 'destructive',
      });
      return;
    }
    
    createWorkoutMutation.mutate(workoutNameInput);
  };
  
  // Loading states
  if (isLoadingWorkouts) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // No workouts state
  if (workouts.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-neutral">Meus Treinos</h2>
        </CardHeader>
        
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground text-center">
            Você ainda não tem nenhum treino cadastrado. Crie seu primeiro treino para começar.
          </p>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Treino
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Treino</DialogTitle>
                <DialogDescription>
                  Insira um nome para o seu novo treino.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workout-name">Nome do Treino</Label>
                  <Input
                    id="workout-name"
                    value={workoutNameInput}
                    onChange={(e) => setWorkoutNameInput(e.target.value)}
                    placeholder="Ex: Treino A - Superiores"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateWorkout}
                  disabled={createWorkoutMutation.isPending}
                >
                  {createWorkoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Treino
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white">
      <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-neutral">Meus Treinos</h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Treino</DialogTitle>
              <DialogDescription>
                Insira um nome para o seu novo treino.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="workout-name">Nome do Treino</Label>
                <Input
                  id="workout-name"
                  value={workoutNameInput}
                  onChange={(e) => setWorkoutNameInput(e.target.value)}
                  placeholder="Ex: Treino A - Superiores"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateWorkout}
                disabled={createWorkoutMutation.isPending}
              >
                {createWorkoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar Treino
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <p className="text-neutral mb-4">Selecione seu treino:</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {workouts.map((workout) => (
              <Button
                key={workout.id}
                variant={selectedWorkout?.id === workout.id ? "default" : "outline"}
                onClick={() => setSelectedWorkoutId(workout.id)}
              >
                {workout.name}
              </Button>
            ))}
          </div>
          
          {selectedWorkout && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex mb-4">
                <TabsTrigger value="exercises" className="flex-1">Exercícios</TabsTrigger>
                <TabsTrigger value="csv" className="flex-1">Plano de Treino (CSV)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="exercises">
                {isLoadingWorkoutDays ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : workoutDays.length > 0 ? (
                  <div className="space-y-4">
                    {workoutDays.map((day: WorkoutDay) => (
                      <div key={day.id} className="border border-border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-3 border-b border-border">
                          <span className="font-medium text-neutral">
                            {day.name} - {day.day}
                          </span>
                        </div>
                        
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Exercício</TableHead>
                                <TableHead>Séries</TableHead>
                                <TableHead>Repetições</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {day.exercises.map((exercise: Exercise, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{exercise.name}</TableCell>
                                  <TableCell>{exercise.sets}</TableCell>
                                  <TableCell>{exercise.reps}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          <p className="text-sm text-muted-foreground mt-4">
                            Descanso entre séries: 60-90 segundos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      Você ainda não tem dias de treino cadastrados para este plano.
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Dia de Treino
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="csv">
                <div className="space-y-4">
                  <CsvUpload workout={selectedWorkout} />
                  
                  <div className="mt-6">
                    <CsvViewer workout={selectedWorkout} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

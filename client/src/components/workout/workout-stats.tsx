import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar, Droplets, Clock, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WorkoutStats } from "@shared/schema";

export default function WorkoutStatsComponent() {
  const { toast } = useToast();
  const [days, setDays] = useState(30);
  
  // Obter estatísticas dos últimos 30 dias
  const { 
    data: stats, 
    isLoading, 
    error 
  } = useQuery<WorkoutStats>({
    queryKey: ["/api/stats", days],
    queryFn: async () => {
      const res = await fetch(`/api/stats?days=${days}`);
      if (!res.ok) {
        throw new Error("Falha ao carregar estatísticas");
      }
      return res.json();
    }
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas: " + (error as Error).message,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Formatador para duração (segundos para minutos/horas)
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Formatador para data que aceita Date | null | undefined
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "Nenhum treino registrado";
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Relatório de Treinos (Últimos 30 dias)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total de Treinos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Total de Treinos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalWorkouts || 0}</div>
            <CardDescription>
              Último treino: {formatDate(stats?.lastWorkoutDate)}
            </CardDescription>
          </CardContent>
        </Card>
        
        {/* Card 2: Ingestão de Água */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Ingestão de Água
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalWaterIntake || 0} ml</div>
            <CardDescription>
              Média: {Math.round(stats?.averageWaterPerWorkout || 0)} ml por treino
            </CardDescription>
          </CardContent>
        </Card>
        
        {/* Card 3: Tempo Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Tempo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatDuration(stats?.totalDuration || 0)}</div>
            <CardDescription>
              Duração de todos os treinos somados
            </CardDescription>
          </CardContent>
        </Card>
        
        {/* Card 4: Progresso */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats?.completionPercentage || 0)}%</div>
            <Progress 
              value={stats?.completionPercentage || 0} 
              className="h-2 mt-2" 
            />
            <CardDescription className="mt-2">
              Da meta de 3 treinos por semana
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
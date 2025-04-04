import { useQuery } from "@tanstack/react-query";
import { WorkoutLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Loader2, Calendar, Droplets, Clock, ListChecks, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkoutLogList() {
  const { toast } = useToast();
  
  const { 
    data: logs, 
    isLoading, 
    error 
  } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/logs"],
    queryFn: async () => {
      const res = await fetch("/api/logs");
      if (!res.ok) {
        throw new Error("Falha ao carregar logs de treino");
      }
      return res.json();
    }
  });
  
  // Usando useEffect para mostrar mensagens de erro
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar logs de treino: " + (error as Error).message,
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
  
  // Formatador para data
  const formatDate = (dateStr: string | Date): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Formatador para hora
  const formatTime = (dateStr: string | Date): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Treinos</CardTitle>
          <CardDescription>
            Seus treinos recentes aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Nenhum treino registrado ainda.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Treinos</CardTitle>
        <CardDescription>
          Seus treinos mais recentes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Calendar className="h-4 w-4 mr-2 inline" /> Data</TableHead>
                <TableHead><ListChecks className="h-4 w-4 mr-2 inline" /> Exercícios</TableHead>
                <TableHead><Droplets className="h-4 w-4 mr-2 inline" /> Água</TableHead>
                <TableHead><Clock className="h-4 w-4 mr-2 inline" /> Duração</TableHead>
                <TableHead><FileText className="h-4 w-4 mr-2 inline" /> Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{formatDate(log.date)}</div>
                    <div className="text-xs text-muted-foreground">{formatTime(log.date)}</div>
                  </TableCell>
                  <TableCell>
                    {log.completedExercises} exercícios
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.waterIntake} ml</Badge>
                  </TableCell>
                  <TableCell>
                    {formatDuration(log.duration)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {log.notes || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
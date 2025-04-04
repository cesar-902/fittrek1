import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiFileUpload, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Workout } from "@shared/schema";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CsvUploadProps {
  workout: Workout;
}

export default function CsvUpload({ workout }: CsvUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Upload CSV mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      
      return await apiFileUpload(`/api/workouts/${workout.id}/csv`, file, 'csv');
    },
    onSuccess: () => {
      // Invalidate workout queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts', workout.id] });
      
      toast({
        title: 'CSV enviado com sucesso',
        description: 'Seu plano de treino foi atualizado.',
      });
      
      // Reset selected file
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar CSV',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's a CSV
      if (
        file.type !== 'text/csv' && 
        file.type !== 'application/vnd.ms-excel' && 
        !file.name.endsWith('.csv')
      ) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo CSV.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upload de Plano de Treino (CSV)</h3>
        
        {workout.pdfUrl && (
          <Alert className="mb-4">
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Plano de treino atual</AlertTitle>
            <AlertDescription>
              Você já possui um plano de treino. Enviar um novo arquivo substituirá o atual.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="csv-upload">Selecione o arquivo CSV do seu plano de treino</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-neutral">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar CSV
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
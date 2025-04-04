import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Workout } from "@shared/schema";
import { AlertCircle, Download, FileSpreadsheet, Loader2, Maximize, Minimize } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CsvViewerProps {
  workout: Workout;
}

interface CsvData {
  headers: string[];
  rows: string[][];
}

export default function CsvViewer({ workout }: CsvViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (workout.pdfUrl) {
      setIsLoading(true);
      fetch(workout.pdfUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Não foi possível carregar o arquivo CSV');
          }
          return response.text();
        })
        .then(text => {
          // Parse CSV
          const rows = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.split(',').map(cell => cell.trim()));
          
          if (rows.length === 0) {
            throw new Error('O arquivo CSV está vazio');
          }
          
          const headers = rows[0];
          const dataRows = rows.slice(1);
          
          setCsvData({ headers, rows: dataRows });
          setError(null);
        })
        .catch(err => {
          console.error('Erro ao carregar CSV:', err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [workout.pdfUrl]);
  
  if (!workout.pdfUrl) {
    return (
      <Card className="w-full p-8 flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">
          Nenhum plano de treino disponível. Faça o upload de um CSV.
        </p>
      </Card>
    );
  }
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : 'w-full'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-bold">Plano de Treino: {workout.name}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Minimizar" : "Maximizar"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => workout.pdfUrl && window.open(workout.pdfUrl, '_blank')}
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className={`rounded-lg border overflow-auto ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
        {isLoading && (
          <div className="flex items-center justify-center h-full w-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {error && !isLoading && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {csvData && !isLoading && (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {csvData.headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvData.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
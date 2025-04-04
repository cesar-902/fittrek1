import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiFileUpload, apiRequest, queryClient } from "@/lib/queryClient";
import { calculateBMI, getBMIClassification } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState<number | "">(user?.weight ? user.weight / 1000 : "");
  const [height, setHeight] = useState<number | "">(user?.height || "");
  const [fullName, setFullName] = useState<string>(user?.fullName || "");
  const [age, setAge] = useState<number | "">(user?.age || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirecionar se o usuário não estiver logado
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Calcular IMC
  const bmi = (weight && height) ? calculateBMI(weight * 1000, height) : null;
  const bmiClassification = bmi ? getBMIClassification(bmi) : null;

  // Função para formatar peso (kg com 1 casa decimal)
  const formatWeight = (weightInGrams: number) => {
    return (weightInGrams / 1000).toFixed(1);
  };

  // Mutação para atualizar a imagem de perfil
  const profileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return await apiFileUpload("/api/user/profile-image", file, "profileImage");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Imagem atualizada com sucesso!",
        description: "Sua foto de perfil foi atualizada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imagem",
        description: error.message || "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar estatísticas (peso, altura, nome e idade)
  const updateStatsMutation = useMutation({
    mutationFn: async (data: { weight: number; height: number; fullName?: string; age?: number }) => {
      return await apiRequest("PUT", "/api/user/stats", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado!",
        description: "Seus dados foram atualizados com sucesso.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar seus dados.",
        variant: "destructive",
      });
    },
  });

  // Handler para upload de imagem
  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    // Reset the input value so the same file can be selected again if needed
    if (event.target.value) {
      event.target.value = '';
    }
    
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type (only images)
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Apenas arquivos de imagem são permitidos (JPG, PNG, GIF).",
          variant: "destructive",
        });
        return;
      }
      
      // Upload the file
      profileImageMutation.mutate(file);
    }
  };

  // Handler para salvar estatísticas e dados pessoais
  const handleSaveStats = () => {
    if (typeof weight !== 'number' || typeof height !== 'number') {
      toast({
        title: "Dados inválidos",
        description: "Por favor, insira valores válidos para peso e altura.",
        variant: "destructive",
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: "Nome completo obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (typeof age !== 'number' || age < 12) {
      toast({
        title: "Idade inválida",
        description: "Por favor, informe uma idade válida (mínimo 12 anos).",
        variant: "destructive",
      });
      return;
    }

    updateStatsMutation.mutate({
      weight: weight * 1000, // Converter para gramas
      height: height,
      fullName: fullName,
      age: age
    });
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Meu Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Foto de Perfil */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Foto de Perfil</CardTitle>
            <CardDescription>Clique na imagem para alterar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {/* Input de arquivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {/* Avatar no estilo Instagram */}
            <div className="relative mb-4">
              <Avatar 
                className="w-32 h-32 cursor-pointer border-4 border-primary"
                onClick={handleProfileImageClick}
                title="Clique para alterar sua foto de perfil"
              >
                <AvatarImage src={user.profileImage || undefined} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
                
                {/* Overlay com ícone de câmera */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </Avatar>
              
              {/* Indicador de carregamento */}
              {profileImageMutation.isPending && (
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full">
                  <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                </div>
              )}
            </div>
            
            {/* Nome e idade abaixo da foto */}
            <div className="text-center mt-4">
              <h3 className="font-semibold text-lg">
                {user.fullName || user.username}
              </h3>
              {user.age && (
                <p className="text-sm text-muted-foreground">{user.age} anos</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Card de Informações Pessoais */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Dados Pessoais</CardTitle>
              <CardDescription>Seus dados biométricos</CardDescription>
            </div>
            
            {/* Botão de editar */}
            {!isEditing ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Nome de Usuário */}
            <div>
              <Label htmlFor="username">Nome de usuário</Label>
              <div className="mt-1 p-2 bg-muted rounded-md">
                {user.username}
              </div>
            </div>
            
            {/* Nome Completo */}
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              {isEditing ? (
                <Input 
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                  placeholder="Digite seu nome completo"
                />
              ) : (
                <div className="mt-1 p-2 bg-muted rounded-md">
                  {user.fullName || "Não informado"}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Idade */}
              <div>
                <Label htmlFor="age">Idade</Label>
                {isEditing ? (
                  <Input 
                    id="age"
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
                    min="12"
                    max="100"
                    step="1"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    {user.age ? `${user.age} anos` : "Não informada"}
                  </div>
                )}
              </div>
              
              {/* Peso */}
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                {isEditing ? (
                  <Input 
                    id="weight"
                    type="number" 
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : "")}
                    min="30"
                    max="300"
                    step="0.1"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    {user.weight ? `${formatWeight(user.weight)} kg` : "Não informado"}
                  </div>
                )}
              </div>
              
              {/* Altura */}
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                {isEditing ? (
                  <Input 
                    id="height"
                    type="number" 
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : "")}
                    min="100"
                    max="250"
                    step="1"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-2 bg-muted rounded-md">
                    {user.height ? `${user.height} cm` : "Não informada"}
                  </div>
                )}
              </div>
            </div>
            
            {/* IMC com Tabela */}
            <div>
              <Label>Índice de Massa Corporal (IMC)</Label>
              <div className="mt-1 p-3 bg-primary/10 rounded-md">
                {bmi ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-xl font-bold">{bmi.toFixed(1)}</span>
                        <span className="ml-2 text-sm text-gray-600">kg/m²</span>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <span 
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            !bmiClassification ? "bg-gray-500 text-white" :
                            bmiClassification.includes("Baixo") ? "bg-green-500 text-white" : 
                            bmiClassification.includes("Moderado") ? "bg-yellow-500 text-black" : 
                            "bg-red-500 text-white"
                          }`}
                        >
                          {bmiClassification || "Não calculado"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tabela de IMC */}
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-center mb-3">Tabela IMC</h3>
                      
                      {/* Classificações IMC */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-blue-400 text-white p-2 rounded text-center text-sm">
                          <strong>PESO NORMAL:</strong>
                          <div>IMC entre 20 e 24</div>
                        </div>
                        <div className="bg-purple-600 text-white p-2 rounded text-center text-sm">
                          <strong>EXCESSO DE PESO:</strong>
                          <div>IMC entre 25 e 29</div>
                        </div>
                        <div className="bg-yellow-400 text-black p-2 rounded text-center text-sm">
                          <strong>OBESIDADE:</strong>
                          <div>IMC entre 30 e 35</div>
                        </div>
                        <div className="bg-red-600 text-white p-2 rounded text-center text-sm">
                          <strong>SUPER OBESIDADE:</strong>
                          <div>IMC superior a 35</div>
                        </div>
                      </div>
                      
                      {/* Tabela responsiva */}
                      <div className="overflow-x-auto max-h-[400px] rounded-md border">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="p-2 border">Altura (m)</th>
                              {[60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130].map(peso => (
                                <th key={peso} className="p-2 border text-center">{peso}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="text-center">
                            {[
                              [1.5, 27, 29, 31, 33, 36, 38, 40, 42, 44, 47, 49, 51, 53, 56, 58],
                              [1.55, 25, 27, 29, 31, 33, 35, 37, 40, 42, 44, 46, 48, 50, 52, 54],
                              [1.6, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51],
                              [1.65, 22, 24, 26, 28, 29, 31, 33, 35, 37, 39, 40, 42, 44, 46, 48],
                              [1.7, 21, 22, 24, 26, 28, 29, 31, 35, 35, 36, 38, 40, 42, 43, 45],
                              [1.75, 20, 21, 23, 24, 26, 28, 29, 31, 33, 34, 36, 38, 39, 41, 42],
                              [1.8, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 39, 40],
                              [1.85, 18, 19, 20, 22, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38],
                              [1.9, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 35, 36]
                            ].map((row, index) => (
                              <tr key={index}>
                                <td className="p-2 border font-semibold">{row[0]}</td>
                                {row.slice(1).map((value, i) => {
                                  let bgColor = '';
                                  // Aplica cores baseadas nos valores de IMC
                                  if (value < 20) bgColor = 'bg-gray-100';
                                  else if (value >= 20 && value < 25) bgColor = 'bg-blue-200';
                                  else if (value >= 25 && value < 30) bgColor = 'bg-purple-200';
                                  else if (value >= 30 && value < 35) bgColor = 'bg-yellow-200';
                                  else bgColor = 'bg-red-200';
                                  
                                  return (
                                    <td 
                                      key={i} 
                                      className={`p-2 border ${bgColor} ${bmi && Math.round(bmi) === value ? 'ring-2 ring-primary font-bold' : ''}`}
                                    >
                                      {value}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        O peso está em kg e a altura em metros. Localize seus valores para encontrar seu IMC.
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500">Informe seu peso e altura para calcular o IMC e visualizar a tabela</span>
                )}
              </div>
            </div>
            
            {/* Botão Salvar */}
            {isEditing && (
              <Button 
                className="w-full mt-4" 
                onClick={handleSaveStats}
                disabled={updateStatsMutation.isPending}
              >
                {updateStatsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            )}
          </CardContent>
          
          <CardFooter className="text-xs text-gray-500 border-t pt-4">
            Última atualização: {new Date().toLocaleDateString()}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
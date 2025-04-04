import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Droplet, Timer, FileText, BarChart3, History, LogOut, ChevronDown } from "lucide-react";
import WorkoutTimer from "@/components/timer/workout-timer";
import WorkoutPlanViewer from "@/components/workout/workout-plan-viewer";
import WorkoutStatsComponent from "@/components/workout/workout-stats";
import WorkoutLogForm from "@/components/workout/workout-log-form";
import WorkoutLogList from "@/components/workout/workout-log-list";
import { Banner } from "@/components/ui/banner";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("timer");

  return (
    <div className="min-h-screen flex flex-col bg-sky-50">
      {/* Header */}
      <header className="bg-primary text-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <Droplet className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold">FitTrack</h1>
          </div>
          
          {/* Profile Dropdown Menu */}
          <div className="flex items-center space-x-3 mt-2 sm:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80">
                  <Avatar className="w-9 h-9 border-2 border-white">
                    <AvatarImage src={user?.profileImage || undefined} />
                    <AvatarFallback className="bg-white text-primary text-sm">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium hidden sm:inline">{user?.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={5}>
                <div className="flex items-center justify-start p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profileImage || undefined} />
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">Sua conta</p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500 font-medium cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Banner title="Fit Track" imageSrc="/images/run-with-dog.png" />
        <Tabs defaultValue="timer" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-blue-200 mb-6">
            <TabsList className="h-auto bg-transparent p-0 space-x-6">
              <TabsTrigger 
                value="timer" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none text-lg flex items-center"
              >
                <Timer className="h-4 w-4 mr-2" />
                Cronômetro
              </TabsTrigger>
              <TabsTrigger 
                value="workout" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none text-lg flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                Meu Treino
              </TabsTrigger>
              <TabsTrigger 
                value="log" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none text-lg flex items-center"
              >
                <History className="h-4 w-4 mr-2" />
                Registrar
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent rounded-none text-lg flex items-center"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="timer" className="pt-4">
            <WorkoutTimer />
          </TabsContent>
          
          <TabsContent value="workout" className="pt-4">
            <div className="max-w-3xl mx-auto">
              <WorkoutPlanViewer />
            </div>
          </TabsContent>

          <TabsContent value="log" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <WorkoutLogForm />
              </div>
              <div>
                <WorkoutLogList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="pt-4">
            <WorkoutStatsComponent />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          &copy; {new Date().getFullYear()} FitTrack - Acompanhe seu progresso no treino
        </div>
      </footer>
    </div>
  );
}

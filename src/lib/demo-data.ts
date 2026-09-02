/**
 * Dados de exemplo (demonstração).
 *
 * Nenhum banco de dados está conectado. Este módulo centraliza todo o conteúdo
 * fictício exibido na interface para que, futuramente, cada função possa ser
 * substituída por uma consulta ao Supabase sem alterar os componentes.
 */

export const DEMO_NOTICE = "Dados de exemplo — nenhum banco de dados conectado.";

export type CategoryId =
  | "spring"
  | "deslocamento"
  | "faculdade"
  | "rocketseat"
  | "rumo"
  | "smart-schedule"
  | "mentorias"
  | "familia"
  | "exercicio"
  | "alimentacao"
  | "domesticas"
  | "descanso";

export type Category = {
  id: CategoryId;
  name: string;
  kind: "Trabalho" | "Estudo" | "Projeto" | "Pessoal" | "Saúde" | "Rotina";
  color: string;
};

export const categories: Category[] = [
  { id: "spring", name: "Spring", kind: "Trabalho", color: "var(--color-chart-1)" },
  { id: "deslocamento", name: "Deslocamento", kind: "Rotina", color: "var(--color-chart-5)" },
  { id: "faculdade", name: "Faculdade", kind: "Estudo", color: "var(--color-chart-3)" },
  { id: "rocketseat", name: "Rocketseat", kind: "Estudo", color: "var(--color-chart-4)" },
  { id: "rumo", name: "RUMO", kind: "Projeto", color: "var(--color-chart-2)" },
  { id: "smart-schedule", name: "Smart Schedule", kind: "Projeto", color: "var(--color-chart-3)" },
  { id: "mentorias", name: "Mentorias", kind: "Trabalho", color: "var(--color-chart-2)" },
  { id: "familia", name: "Família", kind: "Pessoal", color: "var(--color-chart-4)" },
  { id: "exercicio", name: "Exercício", kind: "Saúde", color: "var(--color-chart-1)" },
  { id: "alimentacao", name: "Alimentação", kind: "Saúde", color: "var(--color-chart-5)" },
  { id: "domesticas", name: "Tarefas domésticas", kind: "Rotina", color: "var(--color-chart-3)" },
  { id: "descanso", name: "Descanso", kind: "Saúde", color: "var(--color-chart-4)" },
];

export const categoryName = (id: CategoryId) =>
  categories.find((c) => c.id === id)?.name ?? "Sem categoria";

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  category: CategoryId;
  place?: string;
  fixed: boolean;
};

export const todayAppointments: Appointment[] = [
  {
    id: "a1",
    title: "Daily do time Spring",
    start: "09:00",
    end: "09:20",
    category: "spring",
    place: "Remoto",
    fixed: true,
  },
  {
    id: "a2",
    title: "Deslocamento até o escritório",
    start: "10:10",
    end: "11:00",
    category: "deslocamento",
    place: "Linha Yamanote",
    fixed: true,
  },
  {
    id: "a3",
    title: "Mentoria individual — Ana",
    start: "14:00",
    end: "15:00",
    category: "mentorias",
    place: "Google Meet",
    fixed: true,
  },
  {
    id: "a4",
    title: "Aula de Engenharia de Software",
    start: "19:30",
    end: "21:30",
    category: "faculdade",
    place: "Campus",
    fixed: true,
  },
];

export type Priority = {
  id: string;
  title: string;
  category: CategoryId;
  estimateMin: number;
  done: boolean;
};

export const todayPriorities: Priority[] = [
  { id: "p1", title: "Fechar arquitetura do onboarding do RUMO", category: "rumo", estimateMin: 90, done: true },
  { id: "p2", title: "Revisar PR de autenticação do Spring", category: "spring", estimateMin: 60, done: false },
  { id: "p3", title: "Estudar módulo de testes da Rocketseat", category: "rocketseat", estimateMin: 45, done: false },
];

export type Task = {
  id: string;
  title: string;
  project: string;
  category: CategoryId;
  priority: "Alta" | "Média" | "Baixa";
  due: string;
  estimateMin: number;
  status: "A fazer" | "Em andamento" | "Aguardando" | "Concluída";
};

export const tasks: Task[] = [
  { id: "t1", title: "Definir escopo do MVP do RUMO", project: "RUMO — Fundação", category: "rumo", priority: "Alta", due: "2026-09-02", estimateMin: 90, status: "Em andamento" },
  { id: "t2", title: "Revisar PR de autenticação", project: "Spring — Plataforma", category: "spring", priority: "Alta", due: "2026-09-02", estimateMin: 60, status: "A fazer" },
  { id: "t3", title: "Módulo de testes automatizados", project: "Rocketseat — Trilha", category: "rocketseat", priority: "Média", due: "2026-09-03", estimateMin: 45, status: "A fazer" },
  { id: "t4", title: "Entregar trabalho de Engenharia de Software", project: "Faculdade — 5º período", category: "faculdade", priority: "Alta", due: "2026-09-05", estimateMin: 180, status: "A fazer" },
  { id: "t5", title: "Preparar roteiro da mentoria em grupo", project: "Mentorias", category: "mentorias", priority: "Média", due: "2026-09-04", estimateMin: 50, status: "Em andamento" },
  { id: "t6", title: "Ajustar exportação de agenda", project: "Smart Schedule", category: "smart-schedule", priority: "Baixa", due: "2026-09-08", estimateMin: 40, status: "Aguardando" },
  { id: "t7", title: "Compras da semana", project: "Casa", category: "domesticas", priority: "Baixa", due: "2026-09-06", estimateMin: 60, status: "A fazer" },
  { id: "t8", title: "Marcar almoço com a família", project: "Pessoal", category: "familia", priority: "Média", due: "2026-09-06", estimateMin: 15, status: "Concluída" },
  { id: "t9", title: "Treino de força — inferiores", project: "Saúde", category: "exercicio", priority: "Média", due: "2026-09-03", estimateMin: 50, status: "A fazer" },
];

export type WeekBlock = {
  id: string;
  day: number; // 0 = segunda
  start: string;
  end: string;
  title: string;
  category: CategoryId;
  type: "fixo" | "foco" | "pessoal";
};

export const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const weekBlocks: WeekBlock[] = [
  { id: "w1", day: 0, start: "09:00", end: "12:00", title: "Spring — desenvolvimento", category: "spring", type: "fixo" },
  { id: "w2", day: 0, start: "14:00", end: "15:00", title: "Mentoria individual", category: "mentorias", type: "fixo" },
  { id: "w3", day: 0, start: "19:30", end: "21:30", title: "Faculdade", category: "faculdade", type: "fixo" },
  { id: "w4", day: 1, start: "07:00", end: "08:00", title: "Exercício", category: "exercicio", type: "pessoal" },
  { id: "w5", day: 1, start: "09:00", end: "11:00", title: "Foco — RUMO", category: "rumo", type: "foco" },
  { id: "w6", day: 1, start: "19:30", end: "21:30", title: "Faculdade", category: "faculdade", type: "fixo" },
  { id: "w7", day: 2, start: "09:00", end: "12:00", title: "Spring — desenvolvimento", category: "spring", type: "fixo" },
  { id: "w8", day: 2, start: "13:00", end: "14:30", title: "Foco — Rocketseat", category: "rocketseat", type: "foco" },
  { id: "w9", day: 3, start: "09:00", end: "11:00", title: "Foco — Smart Schedule", category: "smart-schedule", type: "foco" },
  { id: "w10", day: 3, start: "18:00", end: "19:00", title: "Deslocamento", category: "deslocamento", type: "fixo" },
  { id: "w11", day: 4, start: "09:00", end: "12:00", title: "Spring — desenvolvimento", category: "spring", type: "fixo" },
  { id: "w12", day: 4, start: "16:00", end: "17:30", title: "Mentorias em grupo", category: "mentorias", type: "fixo" },
  { id: "w13", day: 5, start: "10:00", end: "12:00", title: "Tarefas domésticas", category: "domesticas", type: "pessoal" },
  { id: "w14", day: 5, start: "15:00", end: "18:00", title: "Família", category: "familia", type: "pessoal" },
  { id: "w15", day: 6, start: "10:00", end: "12:00", title: "Descanso consciente", category: "descanso", type: "pessoal" },
];

export type CapacityRow = { day: string; committedH: number; capacityH: number };

export const weekCapacity: CapacityRow[] = [
  { day: "Seg", committedH: 8.5, capacityH: 9 },
  { day: "Ter", committedH: 7, capacityH: 9 },
  { day: "Qua", committedH: 9.5, capacityH: 9 },
  { day: "Qui", committedH: 6, capacityH: 9 },
  { day: "Sex", committedH: 8, capacityH: 9 },
  { day: "Sáb", committedH: 4, capacityH: 6 },
  { day: "Dom", committedH: 2, capacityH: 5 },
];

export type PlanAlert = { id: string; level: "conflito" | "sobrecarga" | "atencao"; message: string };

export const planAlerts: PlanAlert[] = [
  { id: "al1", level: "conflito", message: "Quarta: mentoria às 14h sobrepõe o bloco de foco do RUMO." },
  { id: "al2", level: "sobrecarga", message: "Quarta ultrapassa a capacidade estimada em 30 minutos." },
  { id: "al3", level: "atencao", message: "Quinta tem 3 deslocamentos sem intervalo entre eles." },
];

export type FocusSession = {
  id: string;
  date: string;
  task: string;
  category: CategoryId;
  plannedMin: number;
  realMin: number;
};

export const focusSessions: FocusSession[] = [
  { id: "f1", date: "01/09", task: "Arquitetura do RUMO", category: "rumo", plannedMin: 25, realMin: 25 },
  { id: "f2", date: "01/09", task: "Revisão de PRs", category: "spring", plannedMin: 25, realMin: 18 },
  { id: "f3", date: "31/08", task: "Trilha de testes", category: "rocketseat", plannedMin: 50, realMin: 50 },
  { id: "f4", date: "31/08", task: "Roteiro de mentoria", category: "mentorias", plannedMin: 25, realMin: 22 },
  { id: "f5", date: "30/08", task: "Trabalho da faculdade", category: "faculdade", plannedMin: 50, realMin: 35 },
];

export const reviewData = {
  planned: [
    "12 tarefas planejadas para a semana",
    "8 blocos de foco reservados",
    "3 sessões de estudo na Rocketseat",
    "2 treinos de força",
  ],
  done: [
    "9 tarefas concluídas",
    "6 blocos de foco realizados",
    "2 sessões de estudo concluídas",
    "2 treinos realizados",
  ],
  postponed: [
    "Ajustar exportação de agenda (Smart Schedule)",
    "Compras da semana",
  ],
  unexpected: [
    "Incidente em produção na quarta-feira (2h)",
    "Atraso de trem na quinta-feira (40 min)",
  ],
  wins: [
    "Fundação do RUMO definida sem virar noite",
    "Sono acima de 6h30 em 5 das 7 noites",
  ],
  struggles: [
    "Blocos de foco à tarde interrompidos com frequência",
    "Refeições em konbini acima do desejado",
  ],
  learnings: [
    "Blocos de 50 minutos funcionam melhor que 90 minutos",
    "Deslocamento é bom para revisão leve, não para estudo profundo",
  ],
  adjustments: [
    "Mover foco profundo para a manhã",
    "Reservar 1h de folga por dia para imprevistos",
    "Planejar 2 refeições em casa a mais",
  ],
};

export const dashboardData = {
  tasksPlannedVsDone: [
    { week: "S32", planejadas: 14, concluidas: 9 },
    { week: "S33", planejadas: 12, concluidas: 10 },
    { week: "S34", planejadas: 15, concluidas: 11 },
    { week: "S35", planejadas: 12, concluidas: 9 },
  ],
  hoursByCategory: [
    { name: "Spring", horas: 18 },
    { name: "Faculdade", horas: 8 },
    { name: "Rocketseat", horas: 5 },
    { name: "RUMO", horas: 6 },
    { name: "Mentorias", horas: 4 },
    { name: "Deslocamento", horas: 7 },
    { name: "Família", horas: 6 },
  ],
  focusSessionsWeek: [
    { day: "Seg", sessoes: 3 },
    { day: "Ter", sessoes: 2 },
    { day: "Qua", sessoes: 1 },
    { day: "Qui", sessoes: 4 },
    { day: "Sex", sessoes: 2 },
    { day: "Sáb", sessoes: 1 },
    { day: "Dom", sessoes: 0 },
  ],
  sleep: [
    { day: "Seg", planejado: 7, realizado: 6.2 },
    { day: "Ter", planejado: 7, realizado: 6.8 },
    { day: "Qua", planejado: 7, realizado: 5.5 },
    { day: "Qui", planejado: 7, realizado: 7.1 },
    { day: "Sex", planejado: 7, realizado: 6.5 },
    { day: "Sáb", planejado: 8, realizado: 8.2 },
    { day: "Dom", planejado: 8, realizado: 7.6 },
  ],
  training: { planejados: 4, realizados: 3, unidade: "treinos" },
  study: { planejadas: 9, realizadas: 6.5, unidade: "horas" },
  strategicWork: { planejadas: 8, realizadas: 6, unidade: "horas" },
  commute: { planejadas: 7, realizadas: 8.5, unidade: "horas" },
  meals: [
    { name: "Em casa", value: 13 },
    { name: "Konbini", value: 8 },
  ],
};

export const energyCheckin = {
  level: 3,
  labels: ["Muito baixa", "Baixa", "Estável", "Boa", "Alta"],
};

export const plannedVsDoneToday = { planejado: 6.5, realizado: 4.25 };

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CalendarDays,
  TrendingUp,
  Settings,
  ArrowUpRight
} from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const PagePlaceholder: React.FC<PlaceholderProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      {/* Placeholder panel */}
      <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center min-h-[400px] gap-5">

        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
          <Icon size={40} />
        </div>

        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold text-slate-800">
            Módulo {title} — Em Desenvolvimento
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Esta seção está integrada ao layout autenticado e ao sistema de rotas com proteção JWT.
            A lógica de negócio deste módulo será implementada nas próximas fases.
          </p>
        </div>

        <button className="px-4 py-2 text-xs font-semibold text-amber-700 hover:text-amber-800 border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-150 flex items-center gap-1.5 mt-1">
          <span>Ver documentação</span>
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => (
  <PagePlaceholder
    title="Dashboard"
    description="Resumo operacional diário, vendas do dia, estoque crítico e parcelas vencendo."
    icon={LayoutDashboard}
  />
);

export const Clientes: React.FC = () => (
  <PagePlaceholder
    title="Clientes"
    description="Pesquisa, cadastro de clientes, perfis individuais e histórico completo de compras."
    icon={Users}
  />
);

export const Produtos: React.FC = () => (
  <PagePlaceholder
    title="Produtos"
    description="Gestão do catálogo de estoque, controle de unidades, preços e movimentações."
    icon={Package}
  />
);

export const Vendas: React.FC = () => (
  <PagePlaceholder
    title="Vendas"
    description="Registro de novas compras com abatimento de estoque automático e emissão de notas promissórias."
    icon={ShoppingCart}
  />
);

export const Parcelas: React.FC = () => (
  <PagePlaceholder
    title="Parcelas"
    description="Acompanhamento financeiro, baixa manual de pagamentos e controle de atrasos."
    icon={CalendarDays}
  />
);

export const Relatorios: React.FC = () => (
  <PagePlaceholder
    title="Relatórios"
    description="Estatísticas gerais de faturamento, snapshots de estoque e relatórios de inadimplência."
    icon={TrendingUp}
  />
);

export const Configuracoes: React.FC = () => (
  <PagePlaceholder
    title="Configurações"
    description="Dados cadastrais da empresa Karoquíssimo, configurações gerais do sistema e categorias de produtos."
    icon={Settings}
  />
);

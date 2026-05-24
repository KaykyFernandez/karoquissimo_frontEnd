import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface Empresa {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Categoria {
  id: number;
  name: string;
}

type EmpresaFormData = Omit<Empresa, 'id' | 'cnpj'>;

const emptyEmpresaForm: EmpresaFormData = {
  corporateName: '',
  tradeName: '',
  phone: '',
  whatsapp: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

const empresaFields: Array<{
  name: keyof EmpresaFormData;
  label: string;
  type?: string;
  className?: string;
}> = [
  { name: 'corporateName', label: 'Razão Social', className: 'md:col-span-2' },
  { name: 'tradeName', label: 'Nome Fantasia', className: 'md:col-span-2' },
  { name: 'phone', label: 'Telefone' },
  { name: 'whatsapp', label: 'WhatsApp' },
  { name: 'email', label: 'E-mail', type: 'email', className: 'md:col-span-2' },
  { name: 'street', label: 'Logradouro', className: 'md:col-span-2' },
  { name: 'number', label: 'Número' },
  { name: 'complement', label: 'Complemento' },
  { name: 'neighborhood', label: 'Bairro' },
  { name: 'city', label: 'Cidade' },
  { name: 'state', label: 'UF' },
  { name: 'zipCode', label: 'CEP' },
];

function toEmpresaForm(empresa: Empresa): EmpresaFormData {
  return {
    corporateName: empresa.corporateName,
    tradeName: empresa.tradeName,
    phone: empresa.phone,
    whatsapp: empresa.whatsapp ?? '',
    email: empresa.email ?? '',
    street: empresa.street,
    number: empresa.number,
    complement: empresa.complement ?? '',
    neighborhood: empresa.neighborhood,
    city: empresa.city,
    state: empresa.state,
    zipCode: empresa.zipCode,
  };
}

function normalizeEmpresaData(data: EmpresaFormData): EmpresaFormData {
  return {
    corporateName: data.corporateName.trim(),
    tradeName: data.tradeName.trim(),
    phone: data.phone.trim(),
    whatsapp: data.whatsapp?.trim() ?? '',
    email: data.email?.trim() ?? '',
    street: data.street.trim(),
    number: data.number.trim(),
    complement: data.complement?.trim() ?? '',
    neighborhood: data.neighborhood.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
    zipCode: data.zipCode.trim(),
  };
}

export function Configuracoes() {
  const [categoryName, setCategoryName] = useState('');
  const queryClient = useQueryClient();

  const empresaQuery = useQuery({
    queryKey: ['empresa'],
    queryFn: () => api.get<Empresa>('/empresa').then(r => r.data),
  });

  const categoriasQuery = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<Categoria[]>('/categorias').then(r => r.data),
  });

  const empresaForm = useForm<EmpresaFormData>({
    defaultValues: emptyEmpresaForm,
  });

  useEffect(() => {
    if (empresaQuery.data) {
      empresaForm.reset(toEmpresaForm(empresaQuery.data));
    }
  }, [empresaQuery.data, empresaForm]);

  const updateEmpresaMutation = useMutation({
    mutationFn: (data: EmpresaFormData) => api.put<Empresa>('/empresa', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
    },
  });

  const createCategoriaMutation = useMutation({
    mutationFn: (name: string) => api.post<Categoria>('/categorias', { name }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      setCategoryName('');
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });

  const handleEmpresaSubmit = (data: EmpresaFormData) => {
    updateEmpresaMutation.mutate(normalizeEmpresaData(data));
  };

  const handleCreateCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    createCategoriaMutation.mutate(name);
  };

  const handleDeleteCategory = (categoria: Categoria) => {
    if (window.confirm(`Excluir categoria "${categoria.name}"?`)) {
      deleteCategoriaMutation.mutate(categoria.id);
    }
  };

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-sm text-slate-500">Dados da empresa e categorias de produtos.</p>
      </div>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Dados da Empresa</h2>
          <p className="text-sm text-slate-500">Informações cadastrais usadas pelo sistema.</p>
        </div>

        <form onSubmit={empresaForm.handleSubmit(handleEmpresaSubmit)} className="space-y-5 px-6 py-5">
          {empresaQuery.isLoading && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Carregando dados da empresa...
            </p>
          )}

          {empresaQuery.isError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Não foi possível carregar os dados da empresa.
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-800">CNPJ</span>
              <input
                value={empresaQuery.data?.cnpj ?? ''}
                disabled
                readOnly
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
              />
            </label>

            {empresaFields.map(field => (
              <label key={field.name} className={`space-y-1.5 ${field.className ?? ''}`}>
                <span className="text-sm font-medium text-slate-800">{field.label}</span>
                <input
                  type={field.type ?? 'text'}
                  {...empresaForm.register(field.name)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                />
              </label>
            ))}
          </div>

          {updateEmpresaMutation.isError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Não foi possível salvar as alterações.
            </p>
          )}

          {updateEmpresaMutation.isSuccess && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Dados da empresa atualizados.
            </p>
          )}

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={updateEmpresaMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {updateEmpresaMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Categorias de Produtos</h2>
          <p className="text-sm text-slate-500">Organize os produtos por categorias.</p>
        </div>

        <div className="space-y-5 px-6 py-5">
          <form onSubmit={handleCreateCategory} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={categoryName}
              onChange={event => setCategoryName(event.target.value)}
              className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              placeholder="Nome da categoria"
            />
            <button
              type="submit"
              disabled={createCategoriaMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createCategoriaMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Adicionar
            </button>
          </form>

          {(createCategoriaMutation.isError || deleteCategoriaMutation.isError) && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Não foi possível atualizar as categorias.
            </p>
          )}

          <div className="overflow-hidden rounded-md border border-slate-200">
            {categoriasQuery.isLoading && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Carregando categorias...
              </div>
            )}

            {categoriasQuery.isError && (
              <div className="px-4 py-6 text-center text-sm text-red-600">
                Não foi possível carregar as categorias.
              </div>
            )}

            {categoriasQuery.data?.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma categoria cadastrada.
              </div>
            )}

            <ul className="divide-y divide-slate-200">
              {categoriasQuery.data?.map(categoria => (
                <li key={categoria.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">{categoria.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(categoria)}
                    disabled={deleteCategoriaMutation.isPending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Excluir categoria"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

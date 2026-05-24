import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Edit2, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { z } from 'zod';
import { clientesService } from '../services/clientes.service';
import type { Cliente, CreateClienteData, UpdateClienteData } from '../services/clientes.service';

const clienteSchema = z.object({
  fullName: z.string().min(3, 'Informe pelo menos 3 caracteres').max(150),
  cpf: z.string().length(14, 'CPF deve ter 14 caracteres'),
  birthDate: z.string().min(1, 'Informe a data de nascimento').refine(
    value => !Number.isNaN(Date.parse(value)),
    'Informe uma data válida',
  ),
  phone: z.string().min(1, 'Informe o telefone'),
  whatsapp: z.string().optional(),
  email: z.string().optional().refine(
    value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'Informe um e-mail válido',
  ),
  street: z.string().min(1, 'Informe o logradouro'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().length(2, 'UF deve ter 2 caracteres'),
  zipCode: z.string().min(1, 'Informe o CEP'),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

const emptyForm: ClienteFormData = {
  fullName: '',
  cpf: '',
  birthDate: '',
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

const textFields: Array<{
  name: keyof ClienteFormData;
  label: string;
  type?: string;
  className?: string;
}> = [
  { name: 'fullName', label: 'Nome Completo', className: 'md:col-span-2' },
  { name: 'cpf', label: 'CPF' },
  { name: 'birthDate', label: 'Data de Nascimento', type: 'date' },
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

function toDateInput(value: string) {
  return value ? value.slice(0, 10) : '';
}

function toFormData(cliente: Cliente): ClienteFormData {
  return {
    fullName: cliente.fullName,
    cpf: cliente.cpf,
    birthDate: toDateInput(cliente.birthDate),
    phone: cliente.phone,
    whatsapp: cliente.whatsapp ?? '',
    email: cliente.email ?? '',
    street: cliente.street,
    number: cliente.number,
    complement: cliente.complement ?? '',
    neighborhood: cliente.neighborhood,
    city: cliente.city,
    state: cliente.state,
    zipCode: cliente.zipCode,
  };
}

function sanitizeFormData(data: ClienteFormData): CreateClienteData {
  return {
    fullName: data.fullName.trim(),
    cpf: data.cpf.trim(),
    birthDate: data.birthDate,
    phone: data.phone.trim(),
    whatsapp: data.whatsapp?.trim() || undefined,
    email: data.email?.trim() || undefined,
    street: data.street.trim(),
    number: data.number.trim(),
    complement: data.complement?.trim() || undefined,
    neighborhood: data.neighborhood.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
    zipCode: data.zipCode.trim(),
  };
}

export function Clientes() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const queryClient = useQueryClient();

  const clientesQuery = useQuery({
    queryKey: ['clientes', search],
    queryFn: () => clientesService.list(search),
  });

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: emptyForm,
  });

  const isSaving = useMemo(
    () => form.formState.isSubmitting,
    [form.formState.isSubmitting],
  );

  const closeModal = () => {
    setModalOpen(false);
    setEditingCliente(null);
    form.reset(emptyForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateClienteData) => clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClienteData }) =>
      clientesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      closeModal();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => clientesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });

  useEffect(() => {
    if (editingCliente) {
      form.reset(toFormData(editingCliente));
    } else {
      form.reset(emptyForm);
    }
  }, [editingCliente, form]);

  const openCreateModal = () => {
    setEditingCliente(null);
    setModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleRemove = (cliente: Cliente) => {
    if (window.confirm('Confirmar inativação?')) {
      removeMutation.mutate(cliente.id);
    }
  };

  const onSubmit = (data: ClienteFormData) => {
    const payload = sanitizeFormData(data);
    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 bg-white text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro e manutenção de clientes ativos.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
        <Search size={18} className="text-slate-500" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="h-8 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
          placeholder="Buscar por nome"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Nome Completo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">CPF</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Telefone</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Cidade/UF</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clientesQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Carregando clientes...
                  </td>
                </tr>
              )}

              {clientesQuery.isError && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-600">
                    Não foi possível carregar os clientes.
                  </td>
                </tr>
              )}

              {clientesQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}

              {clientesQuery.data?.map(cliente => (
                <tr key={cliente.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{cliente.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{cliente.cpf}</td>
                  <td className="px-4 py-3 text-slate-500">{cliente.phone}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {cliente.city}/{cliente.state}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cliente)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-amber-600 hover:text-amber-600"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(cliente)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-red-500 hover:text-red-600"
                        title="Inativar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <p className="text-sm text-slate-500">Preencha os dados cadastrais do cliente.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-800"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                {textFields.map(field => (
                  <label key={field.name} className={`space-y-1.5 ${field.className ?? ''}`}>
                    <span className="text-sm font-medium text-slate-800">{field.label}</span>
                    <input
                      type={field.type ?? 'text'}
                      {...form.register(field.name)}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                    />
                    {form.formState.errors[field.name] && (
                      <span className="block text-xs text-red-600">
                        {form.formState.errors[field.name]?.message}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Não foi possível salvar o cliente.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || createMutation.isPending || updateMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {(isSaving || createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

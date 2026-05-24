import { api } from './api';

export interface Cliente {
  id: number;
  fullName: string;
  cpf: string;
  birthDate: string;
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
  isActive: boolean;
  createdAt: string;
}

export type CreateClienteData = Omit<Cliente, 'id' | 'isActive' | 'createdAt'>;
export type UpdateClienteData = Partial<CreateClienteData>;

export const clientesService = {
  list: (q?: string) =>
    api.get<Cliente[]>('/clientes', { params: q ? { q } : {} }).then(r => r.data),
  getOne: (id: number) =>
    api.get<Cliente>(`/clientes/${id}`).then(r => r.data),
  create: (data: CreateClienteData) =>
    api.post<Cliente>('/clientes', data).then(r => r.data),
  update: (id: number, data: UpdateClienteData) =>
    api.put<Cliente>(`/clientes/${id}`, data).then(r => r.data),
  remove: (id: number) =>
    api.delete(`/clientes/${id}`).then(r => r.data),
};

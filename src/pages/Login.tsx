import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Store, KeyRound, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Insira um endereço de e-mail válido'),
  password: z
    .string()
    .min(6, 'A senha deve conter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      if (
        import.meta.env.DEV &&
        data.email === 'fernanda@karoquissimo.com' &&
        data.password === 'Fernanda@2026'
      ) {
        setTimeout(() => {
          login('mock-jwt-token-dev', {
            id: 1,
            name: 'Fernanda',
            email: 'fernanda@karoquissimo.com',
          });
          navigate('/');
          setIsLoading(false);
        }, 900);
      } else {
        setErrorMsg(
          err.response?.data?.message ||
          'Falha na conexão com o servidor. Verifique suas credenciais ou se o backend está ativo.'
        );
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <Store size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">Karoquíssimo</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Gerenciamento de Estoque e Clientes
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">Erro de Acesso</p>
              <p className="mt-0.5 text-xs opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={15} />
              <input
                type="email"
                placeholder="fernanda@karoquissimo.com"
                className={`w-full bg-white border ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                    : 'border-slate-200 focus:border-amber-400 focus:ring-amber-100'
                } rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 transition-all`}
                disabled={isLoading}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-red-500 font-medium block">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">Senha</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={15} />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-white border ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                    : 'border-slate-200 focus:border-amber-400 focus:ring-amber-100'
                } rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 transition-all`}
                disabled={isLoading}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-red-500 font-medium block">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        {/* Dev credentials hint */}
        {import.meta.env.DEV && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Credenciais de Teste
            </p>
            <code className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-amber-700 block mt-1.5 select-all">
              fernanda@karoquissimo.com / Fernanda@2026
            </code>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-[11px] text-slate-400">
        <p>&copy; {new Date().getFullYear()} Estoque Karoquíssimo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

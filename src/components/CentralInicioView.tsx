import React, { useMemo } from 'react';
import {
  FilePen,
  FileCheck2,
  ListOrdered,
  BookOpen,
  Upload,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Building2,
  RotateCcw,
  Trash2,
  Files,
  Send,
  Key,
  AlertCircle,
  Scale,
  Star,
} from 'lucide-react';
import { RegistroNumeracao, UsuarioSistema } from '../mockData';
import type { RedatorTipoDocumento } from '../documentTypes';
import { AjudaAssistenteIA } from './AjudaAssistenteIA';

export interface SavedRedatorDraftSummary {
  tipo: string;
  assunto: string;
  destinatario: string;
  savedAt?: string;
}

interface CentralInicioViewProps {
  currentUser: UsuarioSistema;
  activeSecretaria: string;
  activeSecretariaSigla: string;
  canSwitchSecretaria: boolean;
  listaSecretariasDoUsuario: string[];
  onChangeSecretaria: (novaPasta: string) => void;
  totalModelos: number;
  totalDespachosModelos: number;
  totalFavoritos: number;
  categoriaComissoes: string | null;
  totalComissoesModelos: number;
  numeracoesFiltradas: RegistroNumeracao[];
  totalAdminPendencias: number;
  totalUsuarios: number;
  savedDraft: SavedRedatorDraftSummary | null;
  skipHomeHub: boolean;
  onToggleSkipHomeHub: (skip: boolean) => void;
  onContinuarRascunho: () => void;
  onDescartarRascunho: () => void;
  onAbrirRedator: (tipoInicial?: RedatorTipoDocumento) => void;
  onAbrirLivro: () => void;
  onIrParaModelos: (opts?: { tipo?: string; categoria?: string | null }) => void;
  onAbrirImportacao: () => void;
  onAbrirAdmin: () => void;
  onAbrirGuia: () => void;
  onAbrirPerfilSenha: () => void;
  onResponderDocumento: (doc: RegistroNumeracao) => void;
  onUsarDocumentoComoBase: (doc: RegistroNumeracao) => void;
  formatDataHoraExibicao: (val: string, withTime?: boolean) => string;
}

function getSaudacaoPeriodo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function isRegistroNoMesAtual(dataHora: string): boolean {
  if (!dataHora) return false;
  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();

  const isoDate = new Date(dataHora);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.getMonth() === mesAtual && isoDate.getFullYear() === anoAtual;
  }

  const brMatch = String(dataHora).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const mes = parseInt(brMatch[2], 10) - 1;
    const ano = parseInt(brMatch[3], 10);
    return mes === mesAtual && ano === anoAtual;
  }
  return false;
}

export const CentralInicioView: React.FC<CentralInicioViewProps> = ({
  currentUser,
  activeSecretaria,
  activeSecretariaSigla,
  canSwitchSecretaria,
  listaSecretariasDoUsuario,
  onChangeSecretaria,
  totalModelos,
  totalDespachosModelos,
  totalFavoritos,
  categoriaComissoes,
  totalComissoesModelos,
  numeracoesFiltradas,
  totalAdminPendencias,
  totalUsuarios,
  savedDraft,
  skipHomeHub,
  onToggleSkipHomeHub,
  onContinuarRascunho,
  onDescartarRascunho,
  onAbrirRedator,
  onAbrirLivro,
  onIrParaModelos,
  onAbrirImportacao,
  onAbrirAdmin,
  onAbrirGuia,
  onAbrirPerfilSenha,
  onResponderDocumento,
  onUsarDocumentoComoBase,
  formatDataHoraExibicao,
}) => {
  const isAdmin = currentUser.nivel === 'ADMIN';
  const saudacao = getSaudacaoPeriodo();
  const primeiroNome = (currentUser.nome || 'Servidor').trim().split(/\s+/)[0];

  const emitidosNoMes = useMemo(
    () => numeracoesFiltradas.filter(n => isRegistroNoMesAtual(n.dataHora)).length,
    [numeracoesFiltradas]
  );

  const atosRecentes = useMemo(
    () => numeracoesFiltradas.slice(0, 3),
    [numeracoesFiltradas]
  );

  return (
    <div className="flex-1 overflow-y-auto sgep-themed-page">
      <div className="max-w-[1440px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-8 space-y-5 sm:space-y-6">
        {/* Faixa 1: Boas-vindas, Contexto Institucional e Resumo Real (Acompanha a Paleta Ativa) */}
        <section className="sgep-themed-hero text-white border rounded-2xl shadow-md p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-semibold text-white/75">
                Central de Início · Banco Mestre Administrativo
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance">
                {saudacao}, {primeiroNome}. O que você deseja fazer agora?
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/80">
                <span className="font-semibold text-white">
                  {currentUser.nome}
                </span>
                {currentUser.cargo && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{currentUser.cargo}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Mat. {currentUser.matricula}</span>
                {currentUser.departamento && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{currentUser.departamento}</span>
                  </>
                )}
              </div>
            </div>

            {/* Seletor / Confirmação de Secretaria Ativa */}
            <div className="lg:w-80 shrink-0 space-y-1.5">
              <label
                htmlFor="hub-secretaria-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-white/85"
              >
                <Building2 className="w-3.5 h-3.5 text-white/85" />
                <span>Secretaria ativa para emissão</span>
              </label>
              {canSwitchSecretaria ? (
                <select
                  id="hub-secretaria-select"
                  value={activeSecretaria}
                  onChange={e => onChangeSecretaria(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/15 hover:bg-white/20 border border-white/25 rounded-lg text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 cursor-pointer"
                >
                  {isAdmin && (
                    <option value="TODAS" className="bg-slate-900 text-white">Todas as Secretarias (Auditoria Geral)</option>
                  )}
                  {listaSecretariasDoUsuario.map(sec => (
                    <option key={sec} value={sec} className="bg-slate-900 text-white">
                      {sec}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2.5 bg-white/15 border border-white/25 rounded-lg text-xs font-semibold text-white truncate">
                  {activeSecretaria}
                </div>
              )}
            </div>
          </div>

          {/* Resumo numérico limpo integrado ao banner temático */}
          <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-white/20">
            <div className="sm:pr-5">
              <p className="text-xs text-white/75">
                Livro ({activeSecretaria === 'TODAS' ? 'Geral' : activeSecretariaSigla})
              </p>
              <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
                {numeracoesFiltradas.length}
              </p>
            </div>
            <div className="sm:px-5">
              <p className="text-xs text-white/75">Emitidos neste mês</p>
              <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
                {emitidosNoMes}
              </p>
            </div>
            <div className="sm:px-5">
              <p className="text-xs text-white/75">Modelos disponíveis</p>
              <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
                {totalModelos}
              </p>
            </div>
            <div className="sm:pl-5">
              <p className="text-xs text-white/75">Seus favoritos</p>
              <p className="mt-0.5 text-lg font-bold text-white tabular-nums">
                {totalFavoritos}
              </p>
            </div>
          </div>

          {/* Bloco de Respostas da IA para Dúvidas do Sistema */}
          <AjudaAssistenteIA
            variant="hero"
            userRole={currentUser.nivel}
            activeSecretaria={activeSecretaria}
            userName={currentUser.nome}
            onAbrirGuiaCompleto={onAbrirGuia}
          />
        </section>

        {/* Faixa Condicional: Rascunho Pendente e/ou Pendências Administrativas */}
        {(savedDraft || (isAdmin && totalAdminPendencias > 0)) && (
          <section className="space-y-3" aria-label="Avisos prioritários">
            {savedDraft && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <RotateCcw className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                      Você tem um rascunho não finalizado no Redator
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 truncate mt-0.5">
                      <span>{savedDraft.tipo || 'Documento'}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{savedDraft.assunto || 'Sem assunto definido'}</span>
                      {savedDraft.savedAt && (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="tabular-nums">Salvo às {savedDraft.savedAt}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onContinuarRascunho}
                    className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                  >
                    Continuar rascunho
                  </button>
                  <button
                    type="button"
                    onClick={onDescartarRascunho}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                    title="Descartar rascunho salvo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Descartar</span>
                  </button>
                </div>
              </div>
            )}

            {isAdmin && totalAdminPendencias > 0 && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 rounded-xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <AlertCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">
                      <span className="tabular-nums">{totalAdminPendencias}</span>{' '}
                      {totalAdminPendencias === 1
                        ? 'solicitação de servidor aguardando autorização'
                        : 'solicitações de servidores aguardando autorização'}
                    </p>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                      Novos cadastros de primeiro acesso ou pedidos de redefinição de senha pendentes na fila administrativa.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onAbrirAdmin}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Analisar autorizações
                </button>
              </div>
            )}
          </section>
        )}

        {/* Faixa 2: Grade Principal de Acesso Direto (6 Módulos por Tarefa) */}
        <section aria-labelledby="heading-acesso-rapido" className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              id="heading-acesso-rapido"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Acesso direto aos módulos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Escolha a tarefa para iniciar sem etapas desnecessárias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cartão 1: Redator Oficial (Focal Anchor — CTA Primário seguindo a Paleta) */}
            <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg sgep-accent-soft border flex items-center justify-center shrink-0">
                    <FilePen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold sgep-accent-text">
                    Emissão oficial
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Redator Oficial
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Redija Memorandos, Ofícios, Portarias, Circulares ou E-mails com numeração sequencial e exportação em PDF A4 timbrado ou Word.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onAbrirRedator('MEMORANDO')}
                  className="sgep-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold shadow-xs whitespace-nowrap cursor-pointer"
                >
                  <span>Novo documento</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirRedator('OFICIO')}
                  className="text-xs font-semibold sgep-accent-text hover:underline whitespace-nowrap cursor-pointer py-1.5 px-1"
                >
                  Novo Ofício
                </button>
              </div>
            </article>

            {/* Cartão 2: Despachos */}
            <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {totalDespachosModelos} modelos
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Despachos
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Abra o Redator já configurado como Despacho Administrativo para encaminhamentos e decisões, ou escolha uma minuta padronizada.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onAbrirRedator('DESPACHO')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Novo Despacho</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onIrParaModelos({ tipo: 'DESPACHO' })}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:underline whitespace-nowrap cursor-pointer py-1.5 px-1"
                >
                  Ver modelos
                </button>
              </div>
            </article>

            {/* Cartão 3: Livro de Numeração */}
            <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {numeracoesFiltradas.length} registros
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Livro de Numeração
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Consulte o registro oficial de expedição da pasta, filtre por período ou servidor, responda atos ou reaproveite como base.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onAbrirLivro}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Abrir Livro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {emitidosNoMes} no mês
                </span>
              </div>
            </article>

            {/* Cartão 4: Banco de Modelos */}
            <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {totalModelos} minutas
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Banco de Modelos
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pesquise no Índice Temático completo por categoria, pareceres, ofícios, checklists e atos de Comissões de PAD e Sindicância.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onIrParaModelos({ tipo: 'TODOS', categoria: null })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Explorar modelos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-3 text-xs">
                  {categoriaComissoes && (
                    <button
                      type="button"
                      onClick={() => onIrParaModelos({ tipo: 'TODOS', categoria: categoriaComissoes })}
                      className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline whitespace-nowrap cursor-pointer"
                      title={`Abrir ${totalComissoesModelos} modelos de Comissões PAD/CAC`}
                    >
                      <Scale className="w-3 h-3" />
                      <span>PAD/CAC</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onIrParaModelos({ tipo: 'FAVORITOS', categoria: null })}
                    className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:underline whitespace-nowrap cursor-pointer tabular-nums"
                  >
                    <Star className="w-3 h-3" />
                    <span>Favoritos ({totalFavoritos})</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Cartão 5: Importar Documentos & OCR */}
            <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Individual ou lote
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Importar Documentos &amp; OCR
                </h4>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Leia PDF, ODT (LibreOffice), DOC/DOCX, RTF, CSV e fotos com OCR, catalogação automática e proteção de assinaturas digitais.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onAbrirImportacao}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Importar arquivos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  PDF/ODT/DOC/CSV
                </span>
              </div>
            </article>

            {/* Cartão 6: Gestão Administrativa (ADMIN) ou Guia de Orientações (Demais Perfis) */}
            {isAdmin ? (
              <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {totalUsuarios} servidores
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Gestão Administrativa
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Autorize novos cadastros, atenda pedidos de senha, configure secretarias, departamentos e permissões de acesso ao Livro.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onAbrirAdmin}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>Abrir Gestão</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className={`text-xs font-medium tabular-nums ${
                      totalAdminPendencias > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {totalAdminPendencias > 0
                      ? `${totalAdminPendencias} pendente(s)`
                      : 'Sem pendências'}
                  </span>
                </div>
              </article>
            ) : (
              <article className="sgep-themed-surface border rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Passo a passo
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Guia de Orientações
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Consulte instruções práticas sobre redação, numeração sequencial, importação de PDFs, Comissões PAD/CAC e respostas rápidas.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onAbrirGuia}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>Abrir Guia</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Ramal 407 · DRH
                  </span>
                </div>
              </article>
            )}
          </div>
        </section>

        {/* Faixa 3: Atos Recentes da Secretaria */}
        <section
          aria-labelledby="heading-atos-recentes"
          className="sgep-themed-surface border rounded-xl overflow-hidden"
        >
          <div className="px-5 py-4 sgep-themed-subtle border-b flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3
                id="heading-atos-recentes"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Atos recentes no seu escopo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Responda ou reaproveite um documento recente como base em 1 clique
              </p>
            </div>
            <button
              type="button"
              onClick={onAbrirLivro}
              className="text-xs font-semibold sgep-accent-text hover:underline whitespace-nowrap cursor-pointer"
            >
              Ver livro completo
            </button>
          </div>

          {atosRecentes.length === 0 ? (
            <div className="px-5 py-8 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ainda não há atos registrados no Livro para o escopo atual.
              </p>
              <button
                type="button"
                onClick={() => onAbrirRedator('MEMORANDO')}
                className="sgep-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Emitir primeiro documento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {atosRecentes.map((doc, idx) => (
                <div
                  key={`${doc.numero}-${idx}`}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {doc.tipoDocumento} {doc.numero}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatDataHoraExibicao(doc.dataHora, false)}
                      </span>
                      {doc.destinatario && (
                        <>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-[260px]">
                            Dest.: {doc.destinatario}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {doc.assunto || 'Sem assunto registrado'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onUsarDocumentoComoBase(doc)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
                      title="Copiar tipo, destinatário e assunto para um novo documento com nova numeração"
                    >
                      <Files className="w-3.5 h-3.5" />
                      <span>Usar como base</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onResponderDocumento(doc)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg sgep-accent-soft border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      title="Responder este documento no Redator com referência automática"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Responder</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Faixa 4: Preferência de Abertura e Links Utilitários */}
        <footer className="pt-2 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipHomeHub}
              onChange={e => onToggleSkipHomeHub(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
            />
            <span>Abrir direto no Banco de Modelos nos próximos acessos</span>
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onAbrirGuia}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guia de Orientações</span>
            </button>
            <button
              type="button"
              onClick={onAbrirPerfilSenha}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 hover:underline cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Perfil e senha</span>
            </button>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500">
              Suporte: Ramal 407 · DRH/SMA
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

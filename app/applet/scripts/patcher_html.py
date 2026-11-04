import re

with open('standalone/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Atualizar <style>
old_style_marker = """        html.dark aside {
            background-color: #0f172a !important;
            border-color: #1e293b !important;
        }
    </style>"""

new_style = """        html.dark aside {
            background-color: #0f172a !important;
            border-color: #1e293b !important;
        }

        /* --- Folha A4 Oficial e Impressão (ABNT / Manual de Redação da PMRC) --- */
        @page { size: A4 portrait; margin: 3cm 2cm 2cm 3cm; }

        #modal-timbrado-impressao > div { max-width: calc(21cm + 2px) !important; }
        #print-area-content {
            width: 21cm; max-width: 100%; min-height: 29.7cm; box-sizing: border-box;
            padding: 3cm 2cm 2cm 3cm !important;
            font-family: 'Times New Roman', Times, serif;
            background: #ffffff !important; color: #0f172a !important;
        }
        html.dark #print-area-content, html.dark #print-area-content.bg-white { background: #ffffff !important; color: #0f172a !important; }
        html.dark #print-area-content .text-slate-900, html.dark #print-area-content .text-slate-800,
        html.dark #print-area-content .text-slate-700 { color: #0f172a !important; }
        html.dark #print-area-content .text-slate-600, html.dark #print-area-content .text-slate-500 { color: #475569 !important; }
        html.dark #print-area-content .border-slate-300 { border-color: #cbd5e1 !important; }

        /* Texto Rico para Documento Oficial A4 (com recuo oficial de primeiro parágrafo de 1,5cm e texto justificado) */
        .sgep-rich-doc {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #0f172a;
        }
        .sgep-rich-doc p {
            margin: 0 0 0.85rem 0;
            text-indent: 1.5cm;
            text-align: justify;
        }
        .sgep-rich-doc ul {
            list-style-type: disc;
            margin: 0 0 0.85rem 2.5cm;
            padding: 0;
            text-indent: 0;
        }
        .sgep-rich-doc li {
            margin: 0 0 0.25rem 0;
            text-align: justify;
        }
        .sgep-rich-doc strong { font-weight: 700; color: inherit; }
        .sgep-rich-doc em { font-style: italic; }

        /* Barra de Formatação do Redator */
        .sgep-toolbar {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            margin-bottom: 0.4rem;
        }
        .sgep-toolbar button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.2rem 0.55rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.375rem;
            background: #f8fafc;
            color: #334155;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .sgep-toolbar button:hover {
            background: #e2e8f0;
            color: #0f172a;
        }
        html.dark .sgep-toolbar button {
            background: #1e293b;
            color: #e2e8f0;
            border-color: #475569;
        }
        html.dark .sgep-toolbar button:hover {
            background: #334155;
        }

        /* Banner de Rascunho Recuperado */
        .sgep-draft-box {
            margin: 0.4rem 0 0.6rem 0;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            color: #78350f;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        html.dark .sgep-draft-box {
            background: #422006 !important;
            border-color: #a16207 !important;
            color: #fde68a !important;
        }

        /* Foco Acessível */
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
        }

        /* Regras de Impressão Limpa */
        @media print {
            html, body {
                background: #ffffff !important;
                color: #000000 !important;
                height: auto !important;
                overflow: visible !important;
            }
            body > *:not(#modal-timbrado-impressao):not(#modal-livro-numeracao) {
                display: none !important;
            }
            #modal-timbrado-impressao.hidden, #modal-livro-numeracao.hidden {
                display: none !important;
            }
            #modal-timbrado-impressao, #modal-livro-numeracao {
                position: static !important;
                display: block !important;
                background: none !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                overflow: visible !important;
            }
            #modal-timbrado-impressao > div, #modal-livro-numeracao > div {
                box-shadow: none !important;
                border: 0 !important;
                border-radius: 0 !important;
                max-width: none !important;
                width: 100% !important;
                margin: 0 !important;
                overflow: visible !important;
            }
            .no-print {
                display: none !important;
            }
            #print-area-content {
                width: auto !important;
                min-height: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .sgep-rich-doc p, .sgep-rich-doc li {
                orphans: 3;
                widows: 3;
            }
        }
    </style>"""

assert old_style_marker in text, "old_style_marker not found"
text = text.replace(old_style_marker, new_style)

# 2. Atualizar Botão PWA no Header
old_pwa_btn = """                <!-- Botão de Instalação PWA -->
                <button id="btn-instalar-pwa" type="button" onclick="acionarInstalacaoPWA()" class="hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-700 to-indigo-700 hover:from-blue-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer border border-blue-400/30" title="Instalar aplicativo Banco Mestre na tela de início">
                    <i class="fa-solid fa-download animate-bounce"></i>
                    <span>Instalar App</span>
                </button>"""

new_pwa_btn = """                <!-- Botão de Instalação PWA -->
                <button id="btn-instalar-pwa" type="button" onclick="acionarInstalacaoPWA()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer border border-blue-400/30" title="Instalar aplicativo Banco Mestre na tela de início ou verificar status PWA">
                    <i class="fa-solid fa-download animate-bounce text-xs" id="pwa-btn-icon"></i>
                    <span id="btn-instalar-pwa-texto">Instalar App</span>
                </button>"""

assert old_pwa_btn in text, "old_pwa_btn not found"
text = text.replace(old_pwa_btn, new_pwa_btn)

# 3. Adicionar Toolbar e Rascunho acima do Textarea no Redator
old_textarea_block = """                        <!-- Campo Textarea com Indicador de Carregamento da IA -->
                        <div class="relative">
                            <textarea id="redator-texto" rows="8" oninput="atualizarPreviaRedator(); checarBotoesIaRedator();" class="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Digite o teor do documento oficial ou utilize o botão '✨ Redigir com IA' acima para gerar automaticamente..."></textarea>"""

new_textarea_block = """                        <!-- Banner de Rascunho Recuperado -->
                        <div id="sgep-draft-banner" class="hidden sgep-draft-box">
                            <div class="flex items-center gap-1.5">
                                <i class="fa-solid fa-clock-rotate-left text-amber-600 dark:text-amber-400"></i>
                                <span>Rascunho não emitido recuperado (<span id="sgep-draft-time" class="font-semibold"></span>).</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button type="button" onclick="restaurarRascunhoRedator()" class="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer">Restaurar</button>
                                <button type="button" onclick="descartarRascunhoRedator()" class="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium cursor-pointer">Descartar</button>
                            </div>
                        </div>

                        <!-- Barra de Ferramentas de Formatação Rápida -->
                        <div class="sgep-toolbar" role="toolbar" aria-label="Formatação de texto">
                            <button type="button" onclick="formatarSelecaoRedator('**', '**')" title="Negrito (Ctrl+B)"><b>N</b></button>
                            <button type="button" onclick="formatarSelecaoRedator('*', '*')" title="Itálico (Ctrl+I)"><i>I</i></button>
                            <button type="button" onclick="formatarMarcadorRedator()" title="Lista com marcadores">• Lista</button>
                            <span class="text-[10px] text-slate-400 ml-auto hidden sm:inline">Use **negrito**, *itálico* ou - para listas</span>
                        </div>

                        <!-- Campo Textarea com Indicador de Carregamento da IA -->
                        <div class="relative">
                            <textarea id="redator-texto" rows="8" oninput="atualizarPreviaRedator(); checarBotoesIaRedator(); agendarRascunhoRedator();" class="w-full px-3.5 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Digite o teor do documento oficial ou utilize o botão '✨ Redigir com IA' acima para gerar automaticamente..."></textarea>"""

assert old_textarea_block in text, "old_textarea_block not found"
text = text.replace(old_textarea_block, new_textarea_block)

# 4. Atualizar Coluna 2 de Pré-visualização do Redator
old_col2_block = """                <!-- Coluna 2: Visualização Timbrada em Tempo Real (Col 5) -->
                <div class="lg:col-span-5 flex flex-col space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-eye text-blue-500"></i>
                            <span>Visualização Timbrada (Padrão Rio Claro – RJ)</span>
                        </h4>
                        <span class="text-[10px] text-slate-400">Papel Timbrado Oficial</span>
                    </div>

                    <!-- Folha A4 Simulação -->
                    <div class="flex-1 bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-md flex flex-col justify-between font-serif text-[11px] leading-relaxed select-all overflow-y-auto max-h-[580px]">
                        <div>
                            <!-- Timbre Municipal Oficial Rio Claro RJ -->
                            <div class="flex items-center gap-3.5 pb-4 border-b-2 border-[#002b82]/30 mb-4">
                                <img src="data:image/png;base64,"""

assert old_col2_block in text, "old_col2_block not found"

# Encontrar o trecho exato da coluna 2 até o fechamento de Folha A4 Simulação
fim_col2_marker = """                        <!-- Assinatura Oficial -->
                        <div class="text-center pt-4 mt-6 max-w-sm mx-auto font-sans">
                            <div class="w-52 h-[1px] bg-slate-400 mx-auto mb-2"></div>
                            <p id="previa-redator-signatario" class="font-bold text-xs text-slate-900">Augusto Lourenço da Silva Júnior</p>
                            <p id="previa-redator-cargo" class="text-[11px] text-slate-700 italic">Chefe de Divisão de Treinamento e Desenvolvimento de Recursos Humanos</p>
                            <p id="previa-redator-secretaria-sig" class="text-[10px] text-[#002b82] font-semibold">Secretaria Municipal de Administração (SMA)</p>
                            <p class="text-[10px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
                        </div>
                    </div>
                </div>"""

assert fim_col2_marker in text, "fim_col2_marker not found"

# Construir nova coluna 2 com ambos os modos: Folha A4 e E-mail Institucional
new_col2_block = """                <!-- Coluna 2: Visualização Timbrada / Pré-visualização em Tempo Real (Col 5) -->
                <div class="lg:col-span-5 flex flex-col space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                            <i class="fa-solid fa-eye text-blue-500"></i>
                            <span id="previa-redator-header-title">Visualização Timbrada (Padrão Rio Claro – RJ)</span>
                        </h4>
                        <span class="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700" id="previa-redator-header-badge">Papel Timbrado Oficial</span>
                    </div>

                    <!-- Modo 1: Folha A4 Simulação (Para Memorando, Ofício, Despacho, Circular) -->
                    <div id="previa-folha-a4-container" class="flex-1 bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-md flex flex-col justify-between font-serif text-[11px] leading-relaxed select-all overflow-y-auto max-h-[580px]">
                        <div>
                            <!-- Timbre Municipal Oficial Rio Claro RJ -->
                            <div class="flex items-center gap-3.5 pb-4 border-b-2 border-[#002b82]/30 mb-4">
                                <img src="data:image/png;base64,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" alt="Brasão de Rio Claro RJ" class="h-16 w-auto object-contain shrink-0">
                                <div class="text-[#002b82] font-sans">
                                    <div class="font-extrabold text-[12px] tracking-wide uppercase leading-tight">ESTADO DO RIO DE JANEIRO</div>
                                    <div class="font-black text-[14px] tracking-tight uppercase leading-tight mt-0.5">PREFEITURA MUNICIPAL DE RIO CLARO</div>
                                    <div class="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68</div>
                                    <div id="previa-redator-secretaria" class="font-bold text-[11px] text-[#002b82] uppercase leading-tight mt-0.5">Secretaria Municipal de Administração (SMA)</div>
                                    <div id="previa-redator-setor" class="text-[10px] text-slate-600 font-medium leading-tight">Departamento de Recursos Humanos</div>
                                </div>
                            </div>

                            <!-- Número e Data -->
                            <div class="flex justify-between items-baseline mb-4 font-sans text-xs">
                                <strong id="previa-redator-num-label" class="text-[#002b82] font-black text-xs sm:text-sm">
                                    MEMO RH ____/2026
                                </strong>
                                <span id="previa-redator-data" class="text-slate-600 text-[10px] font-semibold">Rio Claro-RJ</span>
                            </div>

                            <!-- Destinatário -->
                            <div class="mb-4 font-sans text-xs">
                                <p id="previa-redator-destinatario" class="font-bold text-slate-900 leading-tight">À Secretaria Municipal de Saúde</p>
                                <p class="text-slate-600 text-[10px] font-medium leading-tight mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
                            </div>

                            <!-- Assunto -->
                            <div class="mb-4 font-sans text-xs pb-1.5 border-b border-slate-200">
                                <span class="font-bold text-slate-900">Assunto: </span>
                                <span id="previa-redator-assunto" class="font-semibold text-slate-800">[Assunto do documento]</span>
                                <p id="previa-redator-ref" class="text-[10px] text-slate-500 italic mt-0.5 hidden"></p>
                            </div>

                            <!-- Saudação -->
                            <div class="mb-2 font-sans text-xs font-semibold text-slate-800">
                                Prezados Senhores,
                            </div>

                            <!-- Texto Oficial Formatado com Recuo de Parágrafo (ABNT 1,5cm) -->
                            <div id="previa-redator-texto" class="sgep-rich-doc mb-6 pl-1 sm:pl-2 text-xs"></div>

                            <!-- Fecho -->
                            <div class="mb-6 font-sans text-xs text-slate-800">
                                <p id="previa-redator-fecho">Permanecemos à disposição para eventuais esclarecimentos adicionais.</p>
                            </div>
                        </div>

                        <!-- Assinatura Oficial -->
                        <div class="text-center pt-4 mt-6 max-w-sm mx-auto font-sans">
                            <div class="w-52 h-[1px] bg-slate-400 mx-auto mb-2"></div>
                            <p id="previa-redator-signatario" class="font-bold text-xs text-slate-900">Augusto Lourenço da Silva Júnior</p>
                            <p id="previa-redator-cargo" class="text-[11px] text-slate-700 italic">Chefe de Divisão de Treinamento e Desenvolvimento de Recursos Humanos</p>
                            <p id="previa-redator-secretaria-sig" class="text-[10px] text-[#002b82] font-semibold">Secretaria Municipal de Administração (SMA)</p>
                            <p class="text-[10px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ</p>
                        </div>
                    </div>

                    <!-- Modo 2: Pré-visualização do E-mail Institucional (PMRC) -->
                    <div id="previa-email-container" class="hidden flex-1 bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 p-5 rounded-xl border border-purple-200 dark:border-purple-900/60 shadow-md flex-col justify-between font-sans text-xs leading-relaxed select-all overflow-y-auto max-h-[580px]">
                        <div>
                            <!-- Header de E-mail Institucional -->
                            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-purple-100 dark:border-purple-900/40 shadow-xs space-y-2 mb-4">
                                <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                                    <span class="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                                        <i class="fa-solid fa-envelope"></i>
                                        <span>Correio Institucional — PMRC</span>
                                    </span>
                                    <span id="previa-email-data" class="text-[11px] text-slate-500 font-mono"></span>
                                </div>
                                <div class="text-[11px] space-y-1">
                                    <div><strong class="text-slate-600 dark:text-slate-400">De:</strong> <span id="previa-email-de" class="font-semibold text-slate-900 dark:text-slate-100"></span></div>
                                    <div><strong class="text-slate-600 dark:text-slate-400">Para:</strong> <span id="previa-email-para" class="font-semibold text-slate-900 dark:text-slate-100"></span></div>
                                    <div id="previa-email-cc-row" class="hidden"><strong class="text-slate-600 dark:text-slate-400">Cc:</strong> <span id="previa-email-cc" class="text-slate-700 dark:text-slate-300 font-mono"></span></div>
                                    <div><strong class="text-slate-600 dark:text-slate-400">Assunto:</strong> <span id="previa-email-assunto" class="font-bold text-purple-900 dark:text-purple-200"></span></div>
                                </div>
                            </div>
                            
                            <!-- Mensagem do E-mail -->
                            <div id="previa-email-corpo" class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap mb-4"></div>
                            
                            <!-- Assinatura Institucional de E-mail -->
                            <div class="p-3.5 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-900/50 flex items-center gap-3">
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAABkCAYAAAAc5MdRAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAEMrSURBVHhe7Z0HUFXJ1qgNoIA55xwQJRzO4RDFhJHBnLMCZiWYEEVRARURzFmyAQkKijnOqGOOY5akJEFJSk7fq97o/afmeu/MG2feX69qFtV10j5nd3+9eq3Va3dvKvGP/C1S6bdv/CN/jfwD9m+Sf8D+TfK3gy0vL5fKb5+XlZX923FllPPh40fi4uLIzMykqKiIlJQU0tPTyc3NpbS0lLS0NDIyMqTnv5XfnufX5/t/LX8LWNEY0XABr6SkRHouSnFxsQTo8+fP5OXl8eOPP3LgwAGePHlMSWkx2fmf8T8ciH+QL37+fty7dwc/3/2EhUYQcvggDx49xtfPDz8/P27evCmdS8B/+PAhCQkJ0nNxHvH4Fap4/b8B928FK4oAKbSsoKCAq1evsnXrVtavX09MTAwHDx7kyJEj7N+/j8LCfLI/Z7PR25MdW71ZZG/PzOnW2M+eg4ebB06Ojqx2XYX72rV4uLtz6tQ6VyJSYnMmzcPe3t7zp49y7lz5wgJCeH58+dkZWVJkEXn/r+W7wYrtPK3w068J7QzKSmJ48ePs2vXLkmrxHOhbZ6enmzfvh13N3c8PNyws5vH58855BXks8HDg9XOy1m3Zi3mfQbT2LQPDfoNwqDfcKx+GMrSRYuYM2cO5y+ck851685tZs+ZzcqVK1mwYAEzZ85k27ZtODo6Eh4ezrFjx6QOff/+vXT813p+q95/pXwXWFEhAVCUr9op7J/QEPHZ/fv3Je0UDV22bJlU3Nzc2Lx5MyNGjGD48OHMmDGDCRPGERcXQ0FeHjt37MZ25jw6mfWn0QxP6u64TF3/m9RbdpDG5sPoO/gH1m/cyJkzZ6Q6HIuKZOWqVbi7uzNgwACWLFnC3r17pdfit6dPny6dV3SqqJcoQotFnb8+ivJXw/0usEK+9vwvv/wiAfP29ubt27fSZ8LxCJBCO/fv38/EiRNxcHBg/vz5hIaGcunSJUnLBIA7d25RUlTMyrXrkVkMov7kRTTdc4OmXmE0Wb2L5vvu0GjlXtr16c302bO4f/ee6Fn2HdjP3v37WLFihWQeAgICJK2dO3cuI0eOlDpVfCZMxNf6vn79WhpFouOFifo7TMWfAisqJzRUeO7r16/z7Nkzdu/ezYYNGyRowsaJz0WFhXMSjRw6dKjU6NOnTzNr1iw8PDykY9escZNA3Ll9k9y8zyxesZK6yr7oODsxzr0f0xbJmDTXgBkb+tB9tR31+g1jpp0DcTExFBcVsc7dg9GjRkvnEOcVQ3/RokVSnYR5EO87OTmRmJj4L2cqzNHq1atxcXHhxYsXEmjRFiHfijb+jPwpsOLkwqsLLQwODYwuzYsWzcuJGdO3dKQ+/NmzfSscK+rVu3TmqgKNbW1v9q1KxZs9m7dz92C+zw8d7EwUNBLFy6jOYj7dBzXohfuIz9ezphP6cd5y4ZYOk6joY2K+k7YiSrXFcR4B/IGtfVLHNykhzY1KlTcXZ2ls4hNFJ03I4dOyQn+VUrBUQxaoQNFiNl7dq1ktk4dOgQqampknn4K+RPgy0sLJSGvtA8f39/qREC8MKFCxk/fjzR0dHSscJp2NjYMGzYMElTvx4jYLu6umJjM4Ohg4cxZ9ZsqXOmTp1J49nu1N17BoNlE1jurIPd9E6MXWZKfW8/Gm0KZZj1LJYsXoqt7SxcV66i/4B+0m8Ley6iAwFMgF6zZo30/OnTp/+qt9Bq4fwE2FGjRjFu3DhWrVol1f/Ro0f/Fl//WflTYL+GU48fP5aGmfDyixcvloa50EYBUjiQV69ecfLkSakDhJaIIS8A2NrasmnTJmbPns2sWTOx+sGKmbYzmDR1KrbWC2jisImax+Jps3gloya2YvrUphjbWKC+9yqNdp6l57Cx2NjYsnDRYrZv3SrBESDFo3BgotOEOZg8eTJLly6VzEJ+fr4Ufvn6+v7r/YiICKkuokO9vLzIycn5y5zYnwL71X6KYSMqKuAKYAKocBZCi8VrAVs0UmiHcFzCFIjhKjy1+Lxfv36Spnh7bWKZ0zLu3H9AcNBh2tusoPbhV7R0Wcv8ZV2wmdmCgS4jqHvgHo1dg1izeROJyfGsWLmCieMmSE5KaJ/4TWEGBDgzMzOpPqIDRWcL+y/svYijr127JtVNnFvUSdRROF8hXyOa75XvAiskOTlZsmtCI0WoI+yrACcaJaKBadOmSdojivhMNEg0RjS8R48e2Frb4LluPWPHjWPrjm3s378H3RHTaem8hjEeQ9nqo8uiOe3ZtKcvui4uNBoxg4nWkwg+Gsj4KZMY1G8QritdWbd+HVZWVpLJEXBFKCe0UZgeocmi8ytMj41kHkRni8mJqKvQ3K9A/1dNwT9gf1/+FNhfz1bEo7BhIl4VUYGIY8XwGzNmjARTDD8Rr4oQR4Rk4hgRu1arVo1atWrRr2/filmYuzu2tjZ4em5AR2mIdve2HPDvyfIVnZk9qzOH/HoyfIIezTppYmZmwuYtPkyYNEmCOnvWbCZNmkSlSpXQ1taWhrsY/iLcElGKMBHiUdj9gQMHSqBFHYVCiIlGdnb2b5v43fKnwP5avk4QBFxhR4VGCi8rwik7Oztu3LjB5cuXJS0RzkrAFg2qV6+eBGLw4MESFGGXv37X23sTY2fYoGdjTacFk5AvnYjmjFn0Gj+FsPBwtmzezKBBgyTNFCNFfL9r167S7wn7KkAKRylGiHCgQUFBkgZbWlpK5xDRg7DJQlvFTFHIX2FXfy3fDfZr1kpUbN++fXTv3l2CJeJIocXi+ZYtWyRwYiiKISnCoI4dO0og9PX1mTJlihQSiZhTfD8sLIz9AcHoD55K+wnz6WjtSMveo3BwXsO1az9J2j9kyBBciLiT+GE6tSpg7q6+r8cqY+PjzRtFo5p9OjR9O/fXzr/1xjW3NxccrRf8xp/lQn4Kt8NVsjX3hYxqwCpqakpxbJCO0TMKDRLaJBomEj3CbC9evVCTU0NhUIh2T0RqAsbPWHCBAn0mDHjGTNsLFaDh9BzQF+GDLJi2JChDB02TAqPBBxhQoRWCoAqKip07txZAnfx4kUpWhGaLF6LqEEAFyZInKNx48ZSRCImBL+u/18pfwnYX4vQoNq1a0vDTjgP4SCEPRNTWjEkRcZJmAzRaDFsxXAUkISWiVg0NDRMCvIPHQri+vWfOXTkKHaOC7l9+xaBgX6sXbuGqKgoSSOFrRQdJ0yL6CwBTmjn4cOHJdMkhr/oUDH0v5qbZs2aSZ0g7O3fKX85WJEqtLCwoGbNmhIs0UgxZIUzE15bwBZaIxortElMHoQWCzPydQiLqGGFywrsHOxwcnZhxkw75syfj6vrKgm6GN4iLhXfFzMp8d2vCR6hxWLCIo4TdvT8+fNS/kAcL0AL8yPss4hm/k75S8EKWyVEeOXq1atLdkyYATG0xVAUmismCGKWI6IFAVeYADHFFWZCaLTQMGFjRQgk4Pj7+REUGMS8+fM4d/6cdIxwhBcuXJCOEUAFSDGTEpGF+E2h+cJJCg0V5xUjQtRDOExhi0VnC/k7TMBX+cvBihyCACM0U9g/0TDRKJFPEMCXL18u2T8xhEXqUGT9RWj01WaKEEk4FaG5AowI34QjFN8VSZ89e/ZIAMVQFiGUMCX37t3j5cuXUgd9TROKCORreCfqIH5H2GLh9IRtFU73r3ZYv5a/FKyo6JUrV6TGC80Rti8yMlLSQhEhCBMg4Ij3hCcXQMUwFjDEZ8JcCKcmIoUuXbrQoUMH2rdvLz2K+NTIyEgyM2IECA0X4ITmC2hfcxTCrIgMlhgJQmsFYHG8eC06VNTtzp07Un3/v9DYr4kZcQlGaJOovOsqV+Z9yYeKbJewc18z/Hv27pGAi/izbt26qKqqULVqVSpXrizZwf9WqlSpIpma+vXro6WlJc3uhEYL0KIDhWlwcBTRwQUpPBOJnsWLF0mjQji+hPh4SktKKPvfBPvrGdZvZ1wig1/xAqmSheJyR0lFEa/PX7yI8woXKQslXecSl2iclmFqYoqamroEScAUXlrAqlxZlMpUqVrx+BVk5V9BrVqlKlUqV0WligqqVVWpUqmK9L56dTXkMjlzZ89lncc6vDZuYs+u3Xht3Cjla1eudJFGk6i3mL4Kk1X8m6R2OeWUfr0mJp5L7/w5+P8V7NdKSEVc1yoqlnr6TVwMSR/fU1IG5SIrX1hEcVExn0uLyS0rld5/9PQJuwN82RsQIA33mbY2dOzUUQIoaV2lqlStWo0qVcWjasXzyqpUrVKNKlVUqaxS8b74vFLlqlSuWgXVKpWpXlWFalWrUa2yKtUF3MpVqVZVQK4q/ab47cYNmmA5YBAbPNZz9MhRaaa21GkJsfExEijhC0oK8ikuzfsyc6wohWUl5JZWtLOwpJS8sjKKpKsOZRXaLaD/FtJ/kD8EVuQxn8a84kN2Jqmf0rD1XsreC6GkZWWQkpRMcbFIfBeTlZFFzodUoo4cwWWFM6fPnMLFYRGdm7ZBrZIqKpUqoVK5EioqlVGpXBnVSlUq3qsknle8FqAqYFVFo2q1CvNQtSZVK1dDRdLWKlSuUpXKVVSoLIBXVqFSFRUqVVWlkkr1ilKlQttr1KpJ95698AsMJPJUNK4eblz5+RrJ6WmkpSdTWJxFSVnFuoOy8jKKy0qlUjGbLCE99T1vk97xWXSEgCtp0m8pfVu+CVYMg38N/bIy4t8mYLt6CVO3LWdRqCdt1gxhgKcNs72cCI+OlL7z5vkzttpOI2DaaJwVejh07MYqTT1m1m/KpPqNmNS4GdMaNsa6QTOmNWiBdcNmTGvUjCmNmjK9YTOsGzZneoNm/ypTGzRmSqNmGNZvSB0tEzRMhqDWfTAa5mPQMB8nFfUeE1DvMRGN7pPQMJuMutkkNEwnUqP7eNTNRlO9+2hUzEbTaNAMDBeso6v1ctqOnk/vpR4Md1xKQvK7XzW64jpesfRYQuanj0xwmMYP8yfwIO6FBLS8tCIv8kfk22DFj3zRWHHBrrysnH3nwmmxdjTqi7rTaGkPalnL6Og0hFtvHkjfeXA2iiPaOsQrlbxXKkkzMCZNX0mKqSkPDRTclMl4pNAlxbw7aSa9SetuwofuSjKNjMk2NCZHaSSVbKkYk2FozEezXnh1k9PWzp2GB+9T89BDah56Tu1DL6hz6AW1Dj2n5qFn0ut6h19T9+AL6gU+o/7hF9Q+9JSawb9QQypP0Qh8IhXxuk7Qz7RasJqnr+KIefWaM5fOkJj6loLSYgqKSyktKyXs7FEa2Peh4+IhnL9xucKPlP5P0un35Jtgfy1SnrKsjJScDwzZtYTGLgOoO12XRot78cN2BzILsyUj/+DCSS5206VIbkC5vh5lego+G/bgnH4X9o1oz4kl3fCf0J5AeTveKs3JNVZSaKRLmZ4BZXpyymT6lMv0Kx719SlW6FNiZMj2zl1ovNCHGmEpqIQlUjlClLcVJTyByuHxqB98Ts29P1Nv38/U3fszan73UAt5geqXzyuFx1Ply3dUjqdR7fhbWi3ZzNPnb1i5awOtbHpjs8mJjKwsSorLef8xHcvF46m1ojdtZ/bi4s+XJRZF5UjO7Y/IN8FW2BzhmMopKCqWHFN5SRE3Hl7DZIQprfp3ROE0gugnP0m9K1Ledy6e5qyOHoUKA/INDUk2NOSEkYyVfVow37odS1drMsNekzGWrVhj0YHz5jrEy3XJMTChVGFImVxJmegU8aivEyhpNTYhO1dNGnkuAn1o/GohL2iSvgbqkS8obJ4DHtF1SPPaLU2kCmeu1mwzY/ZO30Z5LGLRm7BVAt9IR0nlYhYVMPiqBYaj3roS9o5buDB0yfM3rocjbndaTbZBN8j/lL794UH0squL/VGatJU2Y6o8xUXRktESPk9YEskQ15GaUk5uSXF0g+WFBcRsXUbjkbdsTbvzu5tmygRi9CEQQfuX4rmpF43PirlnO6qiV8/LZxt27JxtQyH2c3ZE9ACB+eWjB/bArs57XGZ0ZYDY1tx1qgzuYZGlMsNKJXLJbgCcrm+EaVGpuzQ7ExTOy/Uw+KoHvGSauFvUImIoXpoPKpHY6kS/BDlBn8SUlK+1L6MG49f0nndYVSOCq19g2poDCrhsVQ/Gov6kRjUQ5/TxsGL+2+e4xbgTa2e7Wk4qBuG0wZw4+41bL2X0WR2Xya6zETez5wtvnsRF8VLSssp/YOztW+CLSsTwX455SXl5JWVEpv4jocvHxN1YD8zxw8naMdmfj5+kpysHIrFJZpyuHfxNCf1ZLxQ6DNfuxFrHXTY4CHD2rYtTotac+WijJUrWzJxfEvm2LRnybK2hBxU4DOwE++V+pQbGFIuV1CmbyBpbLm+MaVGJuzU1KSJfQXYauEvqf5F69SOxlE9JAaVoF8wWhdIbFJiRd0p4/r9J2iv2Y/GkUeohb5E7egL1MJfS99ViXgraWxrh028SIhjX+gBOvXTZ8rSWXSY2AerBRMxn2FF21GmhJ4/wdgZ05i5yJHPBYUVdlYM5T8g3wQrhWylIrxAGubRP11k4qp5HPkpkgErJ7MrYh+r9njxOj6ekhKxZFKYgnOc0Vbwi74C6x7NcXTSx3pSaybMaMk027Y4zO/EMmdtxk5oz5RpnZi7sC0eHtps6deVVIUClEaU6ysoE3AljVVSamTE7s6aNLbbRPWIeNR8f6bl8r10WbYTLeeddHHeScfFPgxz3sC7ZAFWaFM59x49pc9CVzSdfKRjuizbhtbyHbRc4kut/XfRCHtFG8fNxL59R+TZSAwHmHL1+gV6zxtJ45E66PVrTt/x5qSmJeO2cT3dB/Xn/fs0ic0fzS98G6z4k+K2itcX719Da8Voms3rQbMVg2hn3w+DtVN5kZZASUmBdIwAe1pbRqJMjod+U0YPbMb06e0ZOaEtM2w0cV/ZBUeHNsxfoMUcm3Z4rpExz6wpP+nKKFIag0LA/B+wQnNLjQwlsI3sNqF67C1qXsdYGXCI2KQk4lKTiH+fQkJqKu/T0igqyqeopIDy0nLy8oqISUsjJjWFhJR0YpNTiEt7j1dgNI03HKdW2BvaOG4j/l0yl69eYeT4kbx9F8PRcyHU7dUKexcZWzaPoqAgh7OXLqJjqODSpQoH9keXIH0TbIkUy5VL4YVQ/xu/3EJ302TUHQyot8qCWvYmDPaZx/vMVMpKCyU9uX3xLJE62hTJlbwxM2SZsi1TRrTG2rYzNradWbxME4elrVm5Soc51m1YbtWCy0p98oyMJZjl+vIKG6tQUKYQ9laANWKPiArsN6IWnoC6VwQbw45RXFJEYVk+JWXFkvMsLS2iuCSXkpJCSgpKKCkUi50LKCnLk9ogOr+IfPaf+JEGm05QO/QNbRdtIfZtsrQM1NVtNR8ys/j4IY2x1sNxWdmOA9sG8ik7k5y8fDw8NxAVGUlZaZl0vj8i3wQrpm/CYQl7Ul5Swqv3CQzbZE/dMVrUn2FAp9k9OXg5nIJisYL6i/O6eJYoXT1KZAYUGpqwW1+T+RPbM258C0ZPaI3dos5MGNeeufM7sWW9Ntt6tCDHsDsFCn3KBFD9L0VeAbhErqBYacSOzl1pbO+JRngc6l5ReIZHUS4NJWHbRWApYiAx7cynuLiA/PwiCgvyKCv5THl5HhQjdUQBeeyNukT9TZHUCntNG0cfYhKSiI2L5eKli9LMUciFc0c45G+M7/ZBZOVkkpqWTmxcHNkfMiktFtP17wArwq3S8rKKUlxCQXEJPz+6jdO8qUwZPYDx/Xty+8dLFIoGlVYY84cXznJSR0axvpIiQwMCjTRZay9n2pQODB3RnCnjOjB1YlvmLWiHs3UrDpt0Il/Zg0KDL5r6FeyXUiKXS2C3d+5KQ4f11IiIocbmM8zYHsCFew+5+OAhV+4/5urdJ9x79JLPeTkVmllSxvvMDC49esT5h0+4eu8N5+8+5fT9OyzcGUg9rwhqhr+mteMmXsa9lfIGYvnR1zDq9r3znAjrReCOIbxLjGPKygXoj+/P5Xs3pRxI0feYAnGO0rJySgS4whKp11NjYjkZcIDowH04DxrMs+vXKhZufAV77jQndfQksIWGxvjpdsVhTAcWOnTGaZUeTsta4+qqx6rlbVkzQ5NIg87kGxpTJNenVCb7j2C3dupKIwdP1MLfoBb8kPobw2jq5kczD1+arD1AXZc9WDh7E5/4FkqLJf917f5jFHaraewaSNM14TRzO0xTtwM0dDuExsFHqIeJqMCbpzFxFJeVVCyc/uJQ7j26SlRIf/ZvsiTomC+tZ/akoV0fVu/dSGFZGfnFFVHQ78l/ACvyBBUmIb+gkLy8fB5fu8HWJUvZvdaFHfPmc+ZcFBmfMr9kfeBO9AmiuulIYAuUhgQZdWHRtNbMnNEKyyF1WbK4E0uXdMNpaRscJ7cm1LAzOUpDCvWMKNMTcCvK/4A1oMTQhM3tNWmyYD3q4bGohMVSPewt1USodfQN1cNiqHLwGYYbQ4hPTJTm+0JuPHqGjkcQaodfoxLyDpXQWKqHPkMj5BXVxEztC9jnsfGSfxBQy8oLpe8+fXKTyJCRLFtiiIm1BXUm6FJnlgmrtq+lCJHt+gNU/zvYihRZWsZH1gfsIfDyCa7cuszqra7sOrKdfiuncz/xZcUQKoPb0VFfwBqSZ6jggElLVi/pxOz5bbGZ3wmbaV2xndqN8RM7MGO6DlvNNPmoUFKkp6D0G2CF8xJgt7TrTJO5HmiExqEaFotqeAwqIS9QCXmOathLKh96jHLDQcnDV0gZtx49RtMjGJUjr6kSGk+l0Dgqh8ZR7Ugc1cQkIewlbey9eR1XsfJcaEapmAKUQ0LsC0JCbOk5rjUtRsup36sdDScY4LrdXWqrAPtHkoffBCtsq5RoKIOP2dnM2rcerWVj6eUxjTYrh9BmcX90Xcbz/O1raZYmznP75AlOaulQoq8k01CG76BmuLvrMXxoU4YPb41VnwZMH9+W0dPbMnlWa9yGtCFWX49SmS6lBvqgkINcAXKlFHphqKTc1JQtHbRoOt+bGuHJqB57h8rxeFQiXqMa/hK1Y29QOfwYw3UBJLxL+lp7bj98iKZHEKohTyX4VcJeU0l0SNgbqoXGUCPsFW3tvXgZWwG2qLCI/KJCCVd8QgzWcyxoYtkCxZxBzHC1o+P0vqzavl7i8tvk+H+SfwMrflzAKhMzr1IoLCzA/Yw/TdcORmOpMbXX9qGGnQmjdzqTlpnxL2N+K+oE0VralBsY8dxYF7cRnRk3uTlO07uwfYQ2/oN1WDm+E84rurFwSTs2zenIzzpdKJDJSNBX8LBrV+5168wjzU480dThnpaM2zraLGzZjroTV1Hd5wpVt55Cbds51LaeQ9UnGrXtF1Hf8yMGq3cQ9/YdIu8vWnDz8RM6rw+mSshLKofGUDn0DZW+FJUwYQpe08rBk2exCRQWlXDgUBBrvD1I/fiBuPjXzJn3Ay16tGThxqVEXjqN9hgL3Pb6SOnUkj8LVoj4AWE7hQMrKy3h2pv79HOdQoMxXWltY4zWeFMO3zjzJSqosGu3ThzjlFY3yowtiDDQYvaoTixb3pnlw9twz1BBiokML/MOrFkhY45tU9xs23FOtzPvjYxY364juybY4DPVlp0209k/fTbbrBewecZsVtvOZp6LG9brtzFj/U4muKxjuIszNu7eDJy3mkbLdqNcu5u4t4mUUdHon588pdP6g1QJeUWl0Jh/QRWligT2DW0cNvIy/h2piSkMnzOOuuO74e6/jbjYVwQcmoLtXEPiY1/x/PVLTEcNwsXLvSKV+j02VrIllFEsogNxmaIoH9/dW5g4eiAzbSew3tGRlPdJ0nRXZNYlu3YinBNa3chR9iWgpw6O05uwdklXvPq1JU3fgDx9OQe6d2Ht8vZs3KDJOkdtjhm0I8lUyZKuXTgcfo6+Llv5wXUTYed/JOV9Gu9SkklKT+bFqye8TYjFP/QMfZZtwnD5akIuXiL6xEXaLHBD6b6duIR3VOTZyrn56Bc6rQumasjLfwNb+WgsaqGvaL1wE69i35KWmsZAm+GozdRG324o58+fITx8Als2WlL06RP5ufmMnjKJJa4uFVcbvmdKK2xJkdBaEX8XV2hB7JMnnAoJJCnmFSf8D/L2xWtycj5T/CW7dTMqkmhtPRL0DdgyRBunpa1Z59yFLX2a8kmpRaGOMUHm2jg7tMHDvRU2I1sQbNiZZMM+uBr0ZMb2o9TbFE7z9WEo7Dyw37iNiavXsfbwMXo6OjPZfTvKRZtp4HaMOq4Hcdh7kNPXbtLaYQMGbruITxQ2tkKb7jx+huaGIKoc/XewVcPiJFPQ0t6TV2/iyc7KYaTdVCr1aUYnJ0vsXBcSFTaZzRsGkZOTKf1iQEAQnj4+5BcXUfY9puAfsH8TWDGVLRFmoKRcmuqlZ2bx9OYd/L292LlrGxvd17N781Y8NnhIzk3KJ0RGc0Jbj+dyTbwmaOKxsQuOsxuxZ0B7Mk20+azQ4kgvHRZad8DHuyPTxrdlt3EXkk3M2dyjH8FRpxnvs42ZPv50m+NGA+ddNN0aRhufMFrsOksTj0B6uO1ghs825njv49SNm0TfuErbRRvQd9nNzw+fkpiWTmr6RyIv36CDexBVj76kcliF86rypaiExqER/oYW8zfw/NlrKfU53X0RKmZNaTxTid7knuzb3gev9f34+DmNgrIysj5m8ujpUwpE/llMEP6AfBOscK7CeYlISlwm3hW0lwnzpuKzx5suPxgz0WkmPeeNpNfkH8gr+iR95UaUAKvPPd3OOFu2wMdbm9ULmxM6UJfPhubk68uJ6KWHi3Vntvt0wnpCazbrtuONiYyVCh3SMpJIz0gmITkBk3kraLzQkzar99HayYtGq4Oou2ANE3aHEJ+WzOfMHOkCVNTlC7R12kyLVaH0XXGAQWt8sXT1xWTFXhpvjEQt5JWUDFcNjUXlaKwUw6qGxlMj9DWt5njy8MUbMrMymLhoFt0sDGg1Tka9ad1YsKgzWzxG8uHTe/LF2t/SEil2lRL7xX9s88d/BCvlC6T0YREb93rTfKQxrYcqaDhRSd2+HWk43pDBCyaTV5QvaeytqOOc1tUh3kCbzcaN8V7QgVAfY07270KBgXBeMk71UeI2tyPuS9rjOag912UyXpspcZBrk531QRrKJ27cout0B3rNc8Fi7iqW7PJHc547yukO6M9bzrUnLykrFzWD8EtXaLlkOzUDXlPd9yGqB+6h4fsAtYCHXxLcb1A/+hoV4bS+aGzV8Bhqhr6izWw3fnn9ko/vUxkxZBTe27YybvUM6jkaIxuvxayZI8jM/UBWZjoHT4fjtduHxPh4KeHzR+SbYL9e76pIkZVx6vp5OjsOpuFiC+oO7UJdSy3qDtJhW7AvReI8JXA78hhnu+qRrzAlyag71030OKJswW29rpTrGVGglPPQSI/g3h04aqHDMyNjivSNSTAyZZFcj9zsTOLTUhm5xgeThatx3XeIQfOc8QoOR+HkhdNOXyzWejLS3ZvUnI9Swvnkhau0WLKFKuFJVI1IoGp4HKrhcVQ7Fo9qRMW0Vy30NdXC3qAaJqbAb6TPNcJjaDnPjSevnvIu8R3LFrvw+PF9wi9H02JWfxqPNqKXpSk5eR/xDfGlvnF7WlgZsHX39t+i+o/ybbDSBPrLTRRKxDX2LFwCvGkzyYzqXevQWKcFSmMFz1/FSFcuKS/hbvRRznSTUWLckzK5OWVyMwrNjCgwNqHUUEmpiYx8Y32yDHtTZDKAYgNzUBqTZGLKCj0ZORmJbD0TTas5K/AJieRAxEksHJbhHRqFbLk3fqfP4hlylk5zVnPw/AWpnlHnL9Fp5UZqHH+BugAZKq5nxVAz7I0Uq6qHVsy0Ki7niHxBrHRRsm54Ai3ne3L36TM+ZHzg4e1H5GVlkvwhjlGLrKnRvTnDx/fh4S+P6DFjGDWNWtJosglTVsyjsKgip/B78k2w4oJZWUmJtCqkSFz+Li4lPSOdqeNGo9u0CboNG7LI1pasjIyKRDLFXD53nCnt2rGsfSdWtGuPa5t2uLZqy8rWbVnVug1rWrXBtXUbXFtqsrZ5R9a2aYNbu7Y4tm3PMD19Xr25x5AtfjRY5MOpuw/YFxGNhd1yvI+eRt9pC0FnLnDgxHXarA3GcoM3OQX5HL94hnYTR1Fj7lJqzF2D2lxXNGavQsNmBerTlqM+bQUaokxfifrUFahNXY7a1KXUmL6M5r3H8uzxC4ryCkhMSCQ3N5vPuWls93HAxb0Vy1f3wnr1UpoPkjN/rT1tp5jRz2E8qR8q7nvwe/JNsGUiKy8WjpWV8LmkUJpLi1nYqePHGdZRm15NWzN52GBev34uORHxF/HjddrOdKGJ22EauIfQ0OMQ9dcfpv66EOp5hFF/fTj1PcOk9xusO0y99Yept+EgjV32opwyk5uP76J0P0r9bRcwW7WdXks9sVzqic/hKLou2Yq54xqUHrupu+cyZmt38O59Khd/vETr4UbUWmiBhnM/agtTNdGQmlONqec8iLrO/ai5wJwaU42otciCWiv6UsO5J3WWDKD1sB788uo5IVFR6FiYsitoH2nJyUT4TeTFbSWDJ7Wk7iBdrF3sSEmPZ+ySKRhZD+Lpiye/xfVN+SZYSaQ1YOUUl4pFcaWUlJcS9/Q5cwx707VOPSyNjTkU5M9P165Ih0f" class="h-12 w-auto object-contain shrink-0" alt="Brasão">
                                <div class="text-[11px] leading-tight">
                                    <p id="previa-email-sig-nome" class="font-bold text-purple-950 dark:text-purple-200 text-xs"></p>
                                    <p id="previa-email-sig-cargo" class="text-slate-600 dark:text-slate-400 italic"></p>
                                    <p id="previa-email-sig-sec" class="text-[#002b82] dark:text-blue-300 font-semibold"></p>
                                    <p class="text-[10px] text-slate-500 mt-0.5">Prefeitura Municipal de Rio Claro – RJ • governo@rioclaro.rj.gov.br</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>"""

# Substitui o bloco da coluna 2
inicio_pos = text.find(old_col2_block)
assert inicio_pos != -1, "old_col2_block start not found"
fim_pos = text.find(fim_col2_marker) + len(fim_col2_marker)
assert fim_pos > inicio_pos, "fim_col2_marker end invalid"

text = text[:inicio_pos] + new_col2_block + text[fim_pos:]

# 5. Adicionar Botão Word (.doc) no rodapé do Redator
old_footer_btns = """                    <button type="button" onclick="copiarTextoRedator()" class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                        <i class="fa-regular fa-copy"></i>
                        <span>Copiar Texto</span>
                    </button>"""

new_footer_btns = """                    <button type="button" onclick="copiarTextoRedator()" class="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer">
                        <i class="fa-regular fa-copy"></i>
                        <span>Copiar Texto</span>
                    </button>

                    <button type="button" id="btn-redator-word" onclick="baixarDocxRedator()" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer" title="Baixar documento oficial formatado para o Microsoft Word (.doc) com brasão e padrão ABNT">
                        <i class="fa-regular fa-file-word text-sm"></i>
                        <span>Baixar Word (.doc)</span>
                    </button>"""

assert old_footer_btns in text, "old_footer_btns not found"
text = text.replace(old_footer_btns, new_footer_btns)

# 6. Adicionar Modal de Instalação PWA antes de Toast
old_toast_start = """    <!-- Toast Notification -->
    <div id="toast" """

modal_pwa_html = """    <!-- MODAL 7: GUIA DE INSTALAÇÃO PWA (PROGRESSIVE WEB APP) -->
    <div id="modal-pwa-instalacao" class="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div class="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm text-lg">
                        <i class="fa-solid fa-mobile-screen-button"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                            Instalação do Aplicativo (PWA)
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Banco Mestre Administrativo • Rio Claro RJ
                        </p>
                    </div>
                </div>
                <button onclick="fecharModalInstalacaoPWA()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            <div class="p-5 sm:p-6 space-y-4 text-xs leading-relaxed overflow-y-auto max-h-[70vh]">
                <div class="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5 text-blue-900 dark:text-blue-200">
                    <i class="fa-solid fa-circle-check text-blue-600 mt-0.5 shrink-0 text-sm"></i>
                    <div>
                        <strong class="font-semibold">Vantagens do PWA:</strong>
                        <p class="text-[11px] text-blue-800/90 dark:text-blue-300 mt-0.5">
                            Instale diretamente sem lojas oficiais! Abre em tela cheia como um app nativo, inicia mais rápido e funciona mesmo sem internet através do cache local.
                        </p>
                    </div>
                </div>

                <div class="space-y-3">
                    <!-- Chrome / Edge Desktop -->
                    <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                        <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <i class="fa-brands fa-chrome text-amber-500"></i>
                            <i class="fa-brands fa-edge text-blue-500"></i>
                            <span>No Computador (Google Chrome ou Microsoft Edge):</span>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300">
                            1. Na barra de endereços (URL), clique no ícone de <strong>computador com seta para baixo</strong> ou <strong>Instalar</strong>.<br>
                            2. Ou abra o menu do navegador (três pontinhos no canto superior direito) &gt; selecione <strong>"Instalar Banco Mestre..."</strong> ou <strong>"Criar atalho"</strong>.
                        </p>
                    </div>

                    <!-- Android -->
                    <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                        <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <i class="fa-brands fa-android text-emerald-500"></i>
                            <span>No Celular ou Tablet Android (Chrome):</span>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300">
                            1. Toque nos <strong>três pontinhos (⋮)</strong> no canto superior do navegador.<br>
                            2. Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.
                        </p>
                    </div>

                    <!-- iOS Safari -->
                    <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
                        <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <i class="fa-brands fa-apple text-slate-700 dark:text-slate-300"></i>
                            <span>No iPhone ou iPad (Safari):</span>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300">
                            1. Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para cima na barra inferior).<br>
                            2. Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>.
                        </p>
                    </div>
                </div>
            </div>

            <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button type="button" onclick="fecharModalInstalacaoPWA()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer">
                    Entendi
                </button>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" """

assert old_toast_start in text, "old_toast_start not found"
text = text.replace(old_toast_start, modal_pwa_html)

# 7. Atualizar JavaScript com as novas funções robustas
with open('standalone/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Patcher part 1 (HTML/CSS) applied successfully!')

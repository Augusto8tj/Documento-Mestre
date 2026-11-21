import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { maskPII, maskPIIReversible } from './src/lib/piiMasking';
import { askNvidiaAI, DEFAULT_NVIDIA_MODEL, isNvidiaConfigured } from './src/ai/nvidiaNimClient';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback generator for administrative texts if Gemini API key is missing or quota exceeded
function gerarRedacaoFallback(data: any): string {
  const {
    tipoDocumento = 'MEMORANDO',
    assunto = '',
    destinatario = '',
    secretaria = '',
    signatario = '',
    cargo = '',
    instrucoes = '',
    textoAtual = '',
    acao = 'NOVO_TEXTO'
  } = data;
  const assuntoLimpo = assunto.trim() || 'assuntos de interesse desta municipalidade';
  const destLimpo = destinatario.trim() || 'este setor';
  const secLimpa = secretaria.trim() || 'esta Secretaria Municipal';

  if (acao === 'APRIMORAR' && textoAtual && textoAtual.trim()) {
    // Format existing text to official Brazilian standard
    const linhas = textoAtual.trim().split('\n').filter(Boolean);
    return `Cumprimentando-o cordialmente, sirvo-me do presente para formalizar os apontamentos relativos a ${assuntoLimpo}.\n\n${linhas.join('\n\n')}\n\nReiteramos que a presente comunicação visa a assegurar a máxima celeridade, eficiência e transparência no âmbito da Prefeitura Municipal de Rio Claro – RJ.`;
  }

  if (acao === 'RESUMIR' && textoAtual && textoAtual.trim()) {
    const primeiraFrase = textoAtual.split('.')[0] || textoAtual;
    return `Em síntese, sirvo-me do presente para comunicar que, referente a ${assuntoLimpo}, ${primeiraFrase.trim()}, solicitando-se a adoção das providências administrativas cabíveis no âmbito de sua competência.`;
  }

  if (tipoDocumento === 'DECRETO') {
    return `O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso das atribuições legais que lhe confere a Lei Orgânica do Município de Rio Claro, e\n\nCONSIDERANDO a conveniência administrativa e o interesse público na disciplina da matéria referente a ${assuntoLimpo};\n${instrucoes ? `CONSIDERANDO que ${instrucoes.trim()};\n` : ''}\nDECRETA:\n\nArt. 1º Fica disciplinado, no âmbito da Administração Pública Municipal, o procedimento concernente a ${assuntoLimpo}.\n\nArt. 2º Caberá aos órgãos e secretarias municipais competentes a adoção de todas as providências operacionais necessárias à plena execução deste Decreto.\n\nArt. 3º Este Decreto entra em vigor na data de sua publicação, revogadas as disposições em contrário.`;
  }

  if (tipoDocumento === 'PORTARIA') {
    return `O SECRETÁRIO MUNICIPAL DE ${secLimpa.toUpperCase().replace('SECRETARIA MUNICIPAL DE ', '')} DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais e em conformidade com a legislação municipal em vigor,\n\nRESOLVE:\n\nArt. 1º ${instrucoes ? instrucoes.trim() : `Disciplinar as medidas administrativas e operacionais no âmbito desta pasta relativas a ${assuntoLimpo}.`}\n\nArt. 2º Caberá aos setores competentes o cumprimento das diretrizes estabelecidas no presente ato normativo.\n\nArt. 3º Esta Portaria entra em vigor na data de sua publicação, revogadas as disposições em contrário.`;
  }

  if (tipoDocumento === 'OFICIO') {
    return `Com nossos cordiais cumprimentos, sirvo-me do presente instrumento oficial para encaminhar a Vossa Senhoria as informações e deliberações pertinentes a ${assuntoLimpo}, instruído no âmbito da ${secLimpa}.${instrucoes ? `\n\nEspecificamente quanto ao solicitado: ${instrucoes.trim()}.` : ''}\n\nDiante do exposto, solicitamos a análise e a adoção das medidas cabíveis por parte de ${destLimpo}, visando à continuidade e à regularidade dos serviços prestados por esta municipalidade.`;
  }

  if (tipoDocumento === 'DESPACHO') {
    return `Diante dos elementos constantes dos presentes autos e das manifestações técnicas e administrativas colhidas, encaminho o processo a ${destLimpo} para análise e providências pertinentes quanto a ${assuntoLimpo}.${instrucoes ? `\n\nDetermina-se: ${instrucoes.trim()}.` : ''}\n\nApós a instrução, retornem os autos para as deliberações subsequentes.`;
  }

  if (tipoDocumento === 'CIRCULAR') {
    return `Levamos ao conhecimento de todos os servidores e unidades vinculadas a ${secLimpa} as diretrizes e orientações vigentes acerca de ${assuntoLimpo}.${instrucoes ? `\n\nOrienta-se expressamente que: ${instrucoes.trim()}.` : ''}\n\nSolicita-se a ampla divulgação desta matéria e o rigoroso cumprimento dos prazos e procedimentos estabelecidos pela administração municipal.`;
  }

  if (tipoDocumento === 'PROJETO_LEI') {
    return `A CÂMARA MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, aprovou e eu, PREFEITO MUNICIPAL, sanciono a seguinte Lei:\n\nArt. 1º Fica instituído no Município de Rio Claro – RJ o regramento relativo a ${assuntoLimpo}.\n\nArt. 2º ${instrucoes ? instrucoes.trim() : 'As despesas decorrentes da execução desta Lei correrão à conta das dotações orçamentárias próprias, suplementadas se necessário.'}\n\nArt. 3º Esta Lei entra em vigor na data de sua publicação, revogadas as disposições em contrário.\n\nJUSTIFICATIVA / MENSAGEM:\nExcelentíssimo Senhor Presidente e Nobres Vereadores, submetemos o presente Projeto de Lei à elevada apreciação dessa Casa Legislativa visando ao interesse público municipal.`;
  }

  if (tipoDocumento === 'RESOLUCAO') {
    return `O(A) TITULAR DA ${secLimpa.toUpperCase()} DE RIO CLARO – RJ, no uso de suas atribuições legais e regulamentares,\n\nRESOLVE:\n\nArt. 1º Estabelecer as normas e procedimentos técnicos aplicáveis a ${assuntoLimpo}.\n\nArt. 2º ${instrucoes ? instrucoes.trim() : 'As unidades administrativas deverão observar integralmente as diretrizes desta Resolução/Instrução Normativa.'}\n\nArt. 3º Esta norma entra em vigor na data de sua publicação.`;
  }

  if (tipoDocumento === 'PARECER') {
    return `EMENTA: DIREITO ADMINISTRATIVO. ${assuntoLimpo.toUpperCase()}. ANÁLISE DE LEGALIDADE. PROCURADORIA-GERAL DO MUNICÍPIO.\n\nI – RELATÓRIO\n\nTrata-se de consulta encaminhada a esta Procuradoria-Geral do Município referente a ${assuntoLimpo}, oriunda de ${destLimpo}.\n\nII – FUNDAMENTAÇÃO JURÍDICA\n\nCumpre destacar que a presente análise restringe-se aos aspectos estritamente jurídicos e de legalidade formal.${instrucoes ? `\n\nNo mérito jurídico: ${instrucoes.trim()}.` : ''}\n\nÀ luz da Constituição Federal, da Lei Orgânica Municipal e da Lei Federal nº 14.133/2021 (no que couber), verifica-se a necessidade de estrita observância aos requisitos documentais, orçamentários e de publicidade oficial.\n\nIII – CONCLUSÃO\n\nDiante do exposto, esta Procuradoria-Geral do Município opina pela viabilidade jurídica condicionada ao cumprimento das recomendações elencadas na fundamentação.`;
  }

  if (tipoDocumento === 'NOTA_TECNICA') {
    return `I – OBJETO DA NOTA TÉCNICA / COTA:\nCuida-se de manifestação técnica/jurídica preliminar acerca de ${assuntoLimpo}.\n\nII – ANÁLISE E SANEAMENTO:\n${instrucoes ? instrucoes.trim() : 'Antes da deliberação conclusiva, recomenda-se a complementação documental dos autos com a comprovação de regularidade fiscal, dotação orçamentária e assinatura da autoridade competente.'}\n\nIII – ENCAMINHAMENTO:\nRestituam-se os autos à origem para atendimento das diligências apontadas.`;
  }

  if (tipoDocumento === 'PETICAO') {
    return `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA ÚNICA DA COMARCA DE RIO CLARO – RJ\n\nProcesso nº: [NÚMERO DO PROCESSO]\n\nO MUNICÍPIO DE RIO CLARO – RJ, pessoa jurídica de direito público interno, representado por sua Procuradoria-Geral (art. 75, III, CPC), vem, respeitosamente, à presença de Vossa Excelência, manifestar-se acerca de ${assuntoLimpo}, pelos fatos e fundamentos a seguir:\n\nI – SÍNTESE DOS FATOS\nTrata-se de demanda judicial envolvendo ${assuntoLimpo}.${instrucoes ? `\n\n${instrucoes.trim()}` : ''}\n\nII – DO DIREITO\nO ato municipal encontra pleno respaldo na legislação vigente e nos princípios constitucionais da Administração Pública, inexistindo ilegalidade ou lesão a direito.\n\nIII – DOS PEDIDOS\nAnte o exposto, requer o Município o integral acolhimento da presente manifestação e a intimação pessoal da Fazenda Pública nos termos do art. 183 do CPC.`;
  }

  if (tipoDocumento === 'NOTIFICACAO') {
    return `O MUNICÍPIO DE RIO CLARO – RJ, por intermédio da ${secLimpa}, vem NOTIFICAR formalmente ${destLimpo} acerca de ${assuntoLimpo}.\n\n1. DOS FATOS:\n${instrucoes ? instrucoes.trim() : 'Constatou-se pendência ou descumprimento de obrigação contratual/administrativa apurada nos autos respectivos.'}\n\n2. DO PRAZO PARA REGULARIZAÇÃO E DEFESA PRÉVIA:\nFica Vossa Senhoria notificada para, no prazo legal assinalado, sanar integralmente a irregularidade e/ou apresentar defesa prévia escrita, sob pena de aplicação das sanções cabíveis na forma da Lei nº 14.133/2021 e demais normas vigentes.`;
  }

  if (tipoDocumento === 'RECOMENDACAO') {
    return `A ${secLimpa.toUpperCase()} DE RIO CLARO – RJ, no exercício de suas atribuições de controle preventivo de legalidade;\n\nCONSIDERANDO o art. 37 da Constituição Federal e as orientações do TCE-RJ;\n\nRECOMENDA:\n\nArt. 1º Que ${destLimpo} adote as providências preventivas concernentes a ${assuntoLimpo}.${instrucoes ? `\n\nArt. 2º ${instrucoes.trim()}` : ''}\n\nArt. 3º Solicita-se ciência e comprovação do atendimento no prazo estabelecido.`;
  }

  if (tipoDocumento === 'CONTRATO') {
    return `CONTRATANTE: MUNICÍPIO DE RIO CLARO – RJ.\nCONTRATADA: ${destLimpo}.\n\nCLÁUSULA PRIMEIRA – DO OBJETO:\nO presente instrumento tem por objeto ${assuntoLimpo}, nos termos da Lei Federal nº 14.133/2021.${instrucoes ? `\n\nCLÁUSULA SEGUNDA – CONDIÇÕES ESPECÍFICAS:\n${instrucoes.trim()}` : ''}\n\nCLÁUSULA TERCEIRA – DA FISCALIZAÇÃO E FORO:\nA execução será fiscalizada nos termos do art. 117 da Lei nº 14.133/2021, elegendo-se o Foro da Comarca de Rio Claro – RJ.`;
  }

  if (tipoDocumento === 'DECISAO') {
    return `I – RELATÓRIO:\nTrata-se de expediente administrativo relativo a ${assuntoLimpo}.\n\nII – FUNDAMENTAÇÃO:\nCom base nos documentos instrutórios, manifestações técnicas e no art. 20 da LINDB, verifica-se que ${instrucoes ? instrucoes.trim() : 'encontram-se presentes os elementos necessários à deliberação motivada'}.\n\nIII – DISPOSITIVO:\nDiante do exposto, DECIDO fundamentadamente nos autos, determinando a ciência ao(à) interessado(a) e o cumprimento imediato.`;
  }

  if (tipoDocumento === 'CERTIDAO') {
    return `CERTIFICO, para os devidos fins de direito, que, compulsando os registros oficiais desta ${secLimpa} da Prefeitura Municipal de Rio Claro – RJ, consta em relação a ${assuntoLimpo} que:\n\n${instrucoes ? instrucoes.trim() : '[DESCREVER O FATO CERTIFICADO COM DATAS, PORTARIAS OU REGISTROS OFICIAIS]'}.\n\nPor ser expressão da verdade, lavra-se a presente Certidão.`;
  }

  if (tipoDocumento === 'DECLARACAO') {
    return `DECLARO, para os devidos fins legais e administrativos, no âmbito da ${secLimpa} de Rio Claro – RJ, no tocante a ${assuntoLimpo}, que:\n\n${instrucoes ? instrucoes.trim() : '[DESCREVER O FATO OU CONDIÇÃO DECLARADA]'}.`;
  }

  if (tipoDocumento === 'EMAIL') {
    return `Prezado(a) ${destLimpo},\n\nEscrevo em nome da ${secLimpa} da Prefeitura Municipal de Rio Claro – RJ, referente ao assunto "${assuntoLimpo}".\n\n${instrucoes ? `Informamos especificamente que: ${instrucoes.trim()}.\n\n` : ''}Solicitamos a gentileza de acusar o recebimento desta mensagem e adotar as providências administrativas pertinentes no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares que se façam necessários.\n\nAtenciosamente,\n\n${signatario || 'Servidor Municipal'}${cargo ? `\n${cargo}` : ''}\n${secLimpa}\nPrefeitura Municipal de Rio Claro – RJ`;
  }

  // Padrão: MEMORANDO / demais expedientes
  return `Cumprimentando-o cordialmente, sirvo-me do presente para solicitar a Vossa Senhoria as informações e levantamentos administrativos pertinentes a ${assuntoLimpo}, em atendimento às diretrizes institucionais vigentes.${instrucoes ? `\n\nInformo especificamente que: ${instrucoes.trim()}.` : ''}\n\nAs providências visam a assegurar a máxima celeridade, conformidade legal e transparência aos atos da gestão de pessoal e atendimento desta municipalidade.`;
}

// Endpoint de geração e aprimoramento de redação oficial com IA
app.post('/api/ai/gerar-redacao', async (req, res) => {
  try {
    const {
      tipoDocumento = 'MEMORANDO',
      assunto = '',
      destinatario = '',
      secretaria = '',
      signatario = '',
      cargo = '',
      instrucoes = '',
      textoAtual = '',
      acao = 'NOVO_TEXTO'
    } = req.body;

    const nvidiaDisponivel = isNvidiaConfigured();
    const ai = createGeminiClient();

    if (!nvidiaDisponivel && !ai) {
      console.warn('NVIDIA_API_KEY e GEMINI_API_KEY ausentes. Utilizando motor de redação oficial municipal fallback.');
      const fallbackTexto = gerarRedacaoFallback(req.body);
      return res.json({ success: true, texto: fallbackTexto, fonte: 'motor_regras_municipais' });
    }

    const tipoDocUpper = String(tipoDocumento).toUpperCase();
    const isEmailDoc = tipoDocUpper === 'EMAIL';
    const isNormativo = ['DECRETO', 'PORTARIA', 'PROJETO_LEI', 'RESOLUCAO', 'EDITAL'].includes(tipoDocUpper);
    const isJuridicoPGM = ['PARECER', 'NOTA_TECNICA', 'RECOMENDACAO', 'DECISAO', 'CONTRATO', 'NOTIFICACAO', 'CDA', 'PROCURACAO', 'CHECKLIST'].includes(tipoDocUpper);
    const isJudicial = tipoDocUpper === 'PETICAO';

    let systemInstruction = '';
    if (isEmailDoc) {
      systemInstruction = `Você é o Redator Oficial e Consultor em Comunicação Eletrônica da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir ou aprimorar E-MAILS INSTITUCIONAIS administrativos que serão enviados para servidores, secretarias, órgãos externos ou fornecedores.
REGRAS OBRIGATÓRIAS PARA E-MAIL:
1. Comece com vocativo formal adequado (ex: 'Prezado(a) [Destinatário]', 'Senhor(a) Secretário(a)', etc.).
2. Escreva texto claro, direto, cortês e objetivo. Indique com precisão a referência ao processo/assunto e o prazo ou providência requerida.
3. Conclua com 'Atenciosamente' e a assinatura institucional com o nome, cargo, secretaria e 'Prefeitura Municipal de Rio Claro – RJ'.
4. Retorne o texto completo do e-mail pronto para cópia ou envio.
5. Caso o texto contenha marcadores de privacidade como [CPF_MASCARADO_1] ou [EMAIL_MASCARADO_1], preserve-os exatamente como estão.`;
    } else if (isJudicial) {
      systemInstruction = `Você é Procurador Municipal da Procuradoria-Geral do Município (PGM) de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir PEÇAS JUDICIAIS da Fazenda Pública Municipal (Contestação, Informações em Mandado de Segurança, Manifestação, Contrarrazões, Cumprimento de Sentença ou Petição Intercorrente) com rigor processual civil (CPC/2015, Lei 12.016/2009, Decreto 20.910/1932, Lei 6.830/1980).
DIRETRIZES OBRIGATÓRIAS:
1. Estruture formalmente com: Endereçamento ao MM. Juízo, espaço para Processo nº e partes, qualificação do Município de Rio Claro – RJ representado pela PGM (art. 75, III, CPC), I – SÍNTESE DOS FATOS, II – PRELIMINARES (quando cabíveis), III – DO MÉRITO E FUNDAMENTAÇÃO JURÍDICA, IV – DOS PEDIDOS (incluindo intimação pessoal da Fazenda Pública — art. 183 do CPC).
2. Linguagem forense técnica, clara, objetiva e sem invencionices jurisprudenciais inexistentes.
3. Preserve marcadores de privacidade como [CPF_MASCARADO_1] ou [EMAIL_MASCARADO_1] exatamente como estão.`;
    } else if (isJuridicoPGM) {
      systemInstruction = `Você é Procurador Municipal e Consultor Jurídico da Procuradoria-Geral do Município (PGM) de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir ${tipoDocUpper} com rigor técnico-jurídico conforme a Constituição Federal, Lei Orgânica Municipal, Lei nº 14.133/2021, LINDB (Decreto-Lei nº 4.657/1942), LRF (LC 101/2000), CTN e Lei nº 6.830/1980.
DIRETRIZES ESPECÍFICAS:
- PARECER: Estruture obrigatoriamente com EMENTA (em caixa alta), I – RELATÓRIO, II – FUNDAMENTAÇÃO JURÍDICA (ressalvando análise estritamente jurídica) e III – CONCLUSÃO (com condicionantes objetivas).
- NOTA_TECNICA: Estruture em I – OBJETO, II – ANÁLISE/PENDÊNCIAS DE SANEAMENTO e III – ENCAMINHAMENTO objetivo.
- CONTRATO: Estruture em Qualificação das Partes e CLÁUSULAS numeradas (Objeto, Valor/Dotação, Vigência, Obrigações, Fiscalização art. 117, Sanções arts. 155-156, Foro de Rio Claro – RJ).
- NOTIFICACAO: Estruture em 1. DOS FATOS, 2. DA FUNDAMENTAÇÃO LEGAL e 3. DA PROVIDÊNCIA E PRAZO PARA DEFESA PRÉVIA.
- RECOMENDACAO: Estruture com CONSIDERANDOS e artigos/itens recomendados com prazo de atendimento.
- DECISAO: Estruture em I – RELATÓRIO, II – FUNDAMENTAÇÃO (art. 20 LINDB) e III – DISPOSITIVO.
- CDA / PROCURACAO / CHECKLIST: Observe estritamente os requisitos legais formais de cada instrumento.
- NÃO adicione cabeçalho de brasão ou linha de assinatura (já constam no timbrado oficial). Preserve marcadores de privacidade como [CPF_MASCARADO_1].`;
    } else if (isNormativo) {
      systemInstruction = `Você é o Consultor Jurídico e Redator Legislativo Oficial da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir atos normativos municipais (${tipoDocUpper}) com estrito rigor formal, em conformidade com a Lei Complementar Federal nº 95/1998, a Lei Orgânica Municipal de Rio Claro e o Manual de Redação da Presidência da República.

DIRETRIZES FUNDAMENTAIS PARA ${tipoDocUpper}:
1. ESTRUTURA ARTICULADA LEGISLATIVA:
   - DECRETO / PROJETO_LEI: Preâmbulo solene, Considerandos (no Decreto) ou Justificativa/Mensagem à Câmara (no Projeto de Lei), fórmula imperativa ("DECRETA:" ou "sanciono a seguinte Lei:"), Artigos ("Art. 1º" a "Art. 9º"; "Art. 10." em diante), Parágrafos, Incisos romanos, Alíneas e cláusula de vigência.
   - PORTARIA / RESOLUCAO: Preâmbulo de competência, "RESOLVE:", artigos ordenadores e cláusula de vigência.
   - EDITAL: Preâmbulo de publicidade ("TORNA PÚBLICO"), itens numerados com objeto, requisitos, prazos e disposições finais.
2. ESTILO:
   - Impessoalidade, concisão, precisão vocabular e solenidade técnica.
   - Retorne o texto articulado pronto para ser inserido no documento oficial timbrado.
   - Caso o texto contenha marcadores de privacidade como [CPF_MASCARADO_1] ou [EMAIL_MASCARADO_1], preserve-os exatamente como estão.`;
    } else {
      systemInstruction = `Você é o Redator Oficial e Consultor em Comunicação Administrativa da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir ou aprimorar o corpo de textos oficiais (${tipoDocUpper}) segundo o Manual de Redação da Presidência da República e as normas municipais.
REGRAS OBRIGATÓRIAS:
1. Impessoalidade, concisão, polidez e padrão culto formal da língua portuguesa.
2. NÃO adicione brasão, logotipo, cabeçalho de secretaria ou município (já existem no papel timbrado).
3. NÃO adicione local e data (ex: 'Rio Claro-RJ, ...').
4. NÃO adicione saudações como 'Prezado(a)', 'Senhor Secretário' ou 'À Secretaria...'.
5. NÃO adicione fecho como 'Atenciosamente', 'Respeitosamente' ou assinaturas finais com linhas.
6. Retorne EXCLUSIVAMENTE os parágrafos do corpo do texto oficial, prontos para inserção direta no editor.
7. Se for Certidão, Declaração, Ata ou Relatório Técnico, use a estrutura própria do gênero (ex: "CERTIFICO...", "DECLARO...", pauta/deliberações ou I-Objeto/II-Análise/III-Conclusão).
8. Caso o texto contenha marcadores de privacidade como [CPF_MASCARADO_1] ou [EMAIL_MASCARADO_1], preserve-os exatamente como estão.`;
    }

    let promptUser = `TIPO DE DOCUMENTO: ${tipoDocumento}
SECRETARIA / ÓRGÃO EXPEDIDOR: ${secretaria || 'Secretaria Municipal de Administração (SMA)'}
DESTINATÁRIO: ${destinatario || 'Secretaria Municipal'}
ASSUNTO / EMENTA: ${assunto || 'Sem Assunto'}
SIGNATÁRIO: ${signatario || 'Servidor Municipal'}${cargo ? ` - ${cargo}` : ''}
AÇÃO SOLICITADA: ${acao}
`;

    if (instrucoes && instrucoes.trim()) {
      promptUser += `\nINSTRUÇÕES OU PONTOS PRINCIPAIS DO SERVIDOR:\n"${instrucoes.trim()}"\n`;
    }

    if (textoAtual && textoAtual.trim()) {
      promptUser += `\nTEXTO ATUAL PARA APRIMORAR / MODIFICAR:\n"""\n${textoAtual.trim()}\n"""\n`;
    }

    if (acao === 'APRIMORAR') {
      promptUser += `\nObjetivo: Reescreva o texto atual tornando-o mais formal, direto, coeso e estritamente adequado ao Manual de Redação Oficial da Prefeitura de Rio Claro RJ.`;
    } else if (acao === 'RESUMIR') {
      promptUser += `\nObjetivo: Sintetize o texto em 1 ou 2 parágrafos concisos mantendo os elementos essenciais.`;
    } else if (acao === 'FORMALIZAR') {
      promptUser += `\nObjetivo: Ajuste termos informais ou coloquiais para o estrito vocabulário administrativo municipal.`;
    } else {
      promptUser += `\nObjetivo: Redija o corpo completo do ${tipoDocumento} com base nas instruções e no assunto informado.`;
    }

    // Higienização proativa LGPD (PII Masking) antes de enviar a qualquer provedor externo
    const piiGuard = maskPIIReversible(promptUser);

    // 1. Motor Primário Híbrido: NVIDIA NIM (Nemotron 3.5 Bolt — baixa latência)
    if (nvidiaDisponivel) {
      const nvResult = await askNvidiaAI({
        system: systemInstruction,
        prompt: piiGuard.masked,
        temperature: 0.3,
        maxTokens: 2048,
        skipMasking: true,
      });

      if (nvResult.success && nvResult.text) {
        const textoFinal = piiGuard.restore(nvResult.text.trim());
        return res.json({
          success: true,
          texto: textoFinal,
          fonte: nvResult.model || 'nvidia/nemotron-3.5-bolt-e4b',
          piiProtegido: piiGuard.maskedCount > 0,
        });
      }
      console.warn('Gateway NVIDIA NIM indisponível ou retornou erro, acionando fallback:', nvResult.error);
    }

    // 2. Motor Secundário Híbrido: Gemini
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: piiGuard.masked,
        config: {
          systemInstruction,
        }
      });

      const textoGerado = response.text?.trim() || '';

      if (textoGerado) {
        const textoFinal = piiGuard.restore(textoGerado);
        return res.json({
          success: true,
          texto: textoFinal,
          fonte: 'gemini-4-hydrogen',
          piiProtegido: piiGuard.maskedCount > 0,
        });
      }
    }

    // 3. Contingência Local Offline (Custo Zero)
    const fallbackTexto = gerarRedacaoFallback(req.body);
    return res.json({ success: true, texto: fallbackTexto, fonte: 'fallback_vazio' });
  } catch (error: any) {
    console.error('Erro na chamada do Motor de IA Híbrido:', error);
    const fallbackTexto = gerarRedacaoFallback(req.body);
    res.json({ success: true, texto: fallbackTexto, fonte: 'fallback_erro', error: error.message });
  }
});

// Endpoint direto NVIDIA NIM (Nemotron 3.5 Bolt) para triagens rápidas e automação de campos com PII Masking LGPD
app.post('/api/ai/nvidia', async (req, res) => {
  try {
    const { promptText = '', prompt = '', system = '', temperature = 0.3, maxTokens = 2048 } = req.body || {};
    const rawPrompt = String(promptText || prompt || '').trim();
    if (!rawPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Informe o texto do prompt para processamento.',
      });
    }

    const result = await askNvidiaAI({
      prompt: maskPII(rawPrompt),
      system: system || 'Você é um assistente técnico administrativo de alto desempenho.',
      temperature,
      maxTokens,
      skipMasking: true,
    });

    if (!result.success) {
      return res.status(result.statusCode || 502).json({
        success: false,
        error: result.error || 'Falha na comunicação com o provedor NVIDIA NIM.',
      });
    }

    return res.json({
      success: true,
      text: result.text,
      fonte: result.model || 'nvidia/nemotron-3.5-bolt-e4b',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Falha na comunicação com o provedor de IA.',
    });
  }
});

// Endpoint para extração fiel (somente leitura) de arquivos .doc binários legados (Word 97-2003 OLE2)
app.post('/api/documents/extract-doc', async (req, res) => {
  try {
    const { fileName = 'documento.doc', fileBase64 = '' } = req.body || {};
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo .doc vazio ou inválido para leitura.',
      });
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/i, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo binário do arquivo .doc está vazio.',
      });
    }
    if (buffer.length > 6 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Arquivo .doc excede o limite de 5 MB para leitura automática.',
      });
    }

    // Inspeção somente-leitura de indícios de assinatura digital no contêiner OLE2
    const latinRaw = buffer.toString('latin1');
    const utf16Raw = buffer.toString('utf16le');
    const hasOleSigStream =
      utf16Raw.includes('\u0005DigitalSignature') ||
      utf16Raw.includes('DigitalSignature') ||
      /ICP-Brasil|gov\.br\/assinatura|validar\.iti\.gov\.br/i.test(latinRaw);

    const WordExtractorMod: any = await import('word-extractor');
    const WordExtractor = WordExtractorMod.default || WordExtractorMod;
    const extractor = new WordExtractor();
    const extracted = await extractor.extract(buffer);

    const body = String(extracted.getBody?.() || '').trim();
    const headers = String(extracted.getHeaders?.({ includeFooters: false }) || '').trim();
    const footers = String(extracted.getFooters?.() || '').trim();
    const footnotes = String(extracted.getFootnotes?.() || '').trim();
    const endnotes = String(extracted.getEndnotes?.() || '').trim();

    const textoCompleto = [body, footnotes, endnotes].filter(Boolean).join('\n\n').trim();
    const textoMetadadosAux = [headers, footers].filter(Boolean).join('\n').trim();

    if (!textoCompleto && !textoMetadadosAux) {
      return res.status(422).json({
        success: false,
        error: `Não foi possível extrair texto legível do arquivo .doc "${fileName}". Se o documento contiver apenas imagens escaneadas, salve-o em PDF para OCR completo.`,
      });
    }

    return res.json({
      success: true,
      texto: textoCompleto || textoMetadadosAux,
      cabecalhosRodapes: textoMetadadosAux,
      possuiAssinaturaBinaria: hasOleSigStream,
      detalhesAssinaturaBinaria: hasOleSigStream
        ? 'Fluxo de assinatura digital detectado no contêiner binário OLE2 (.doc).'
        : '',
    });
  } catch (error: any) {
    console.error('Erro ao extrair arquivo .doc binário:', error);
    return res.status(422).json({
      success: false,
      error:
        error?.message ||
        'Não foi possível ler este arquivo .doc legado (pode estar corrompido ou protegido por senha).',
    });
  }
});

// Endpoint de reconhecimento, OCR (PDF, imagens diretas ou imagens embutidas em DOCX/ODT/RTF) e catalogação automática
app.post('/api/ai/catalogar-documento', async (req, res) => {
  try {
    const {
      fileName = 'documento',
      mimeType = 'text/plain',
      formatoOriginal = '',
      fileBase64 = '',
      textoExtraido = '',
      embeddedImages = [],
      assinaturaDetectadaLocal = null,
      categoriasExistentes = [],
      secretariasExistentes = [],
    } = req.body || {};

    const mimeLower = String(mimeType || '').toLowerCase();
    const isPdf = mimeLower === 'application/pdf' || /\.pdf$/i.test(String(fileName));
    const isDirectImage =
      /^image\/(jpeg|jpg|png|webp)$/i.test(mimeLower) ||
      /\.(jpe?g|png|webp)$/i.test(String(fileName));
    const safeEmbeddedImages: Array<{ mimeType: string; data: string; name?: string }> = Array.isArray(embeddedImages)
      ? embeddedImages
          .filter((img: any) => img && typeof img.data === 'string' && typeof img.mimeType === 'string' && /^image\/(jpeg|jpg|png|webp)$/i.test(img.mimeType))
          .slice(0, 4)
      : [];

    const isTextOnly = !isPdf && !isDirectImage && safeEmbeddedImages.length === 0;
    const nvidiaDisponivel = isNvidiaConfigured();
    const ai = createGeminiClient();

    if (!ai && (!isTextOnly || !nvidiaDisponivel)) {
      return res.status(503).json({
        success: false,
        code: 'MISSING_API_KEY',
        error: isTextOnly
          ? 'Serviço de reconhecimento inteligente indisponível: configure NVIDIA_API_KEY ou GEMINI_API_KEY nos Secrets do servidor.'
          : 'OCR de PDF e imagens indisponível: configure a chave GEMINI_API_KEY em Settings > Secrets para leitura multimodal.',
      });
    }

    if ((isPdf || isDirectImage) && !fileBase64) {
      return res.status(400).json({
        success: false,
        error: `Arquivo "${fileName}" vazio ou inválido para processamento OCR.`,
      });
    }
    if (isTextOnly && !String(textoExtraido || '').trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum conteúdo textual ou imagem legível recebido para reconhecimento e catalogação.',
      });
    }

    const categoriasLista = Array.isArray(categoriasExistentes) && categoriasExistentes.length > 0
      ? categoriasExistentes.slice(0, 60).join(' | ')
      : '1. Férias e Licenças | 2. Gestão de Pessoal | 3. Folha de Pagamento | 4. Atos Normativos | 5. Protocolo e Expediente | 6. Compras e Contratos';

    const secretariasLista = Array.isArray(secretariasExistentes) && secretariasExistentes.length > 0
      ? secretariasExistentes.slice(0, 30).join(' | ')
      : 'Secretaria Municipal de Administração (SMA) | Secretaria Municipal de Saúde (SMS) | Secretaria Municipal de Educação (SME) | Secretaria Municipal de Fazenda e Finanças (SMF) | Gabinete do Prefeito';

    const assinaturaLocalInfo = assinaturaDetectadaLocal?.detectada
      ? `\nALERTA DE INTEGRIDADE CRIPTOGRÁFICA: O arquivo original contém assinatura digital detectada estruturalmente (${assinaturaDetectadaLocal.padrao || 'Assinatura Digital'}).`
      : '';

    const systemInstruction = `Você é o Arquivista-Chefe e Especialista em Redação Oficial da Prefeitura Municipal de Rio Claro – RJ.
Sua função é ler documentos administrativos enviados em múltiplos formatos (PDF pesquisável ou escaneado, apresentações em PDF, imagens/fotos de documentos, ODT do LibreOffice, DOC/DOCX do Word, RTF, CSV ou TXT — inclusive realizando OCR em imagens embutidas) e retornar uma catalogação estruturada precisa em JSON.

REGRAS OBRIGATÓRIAS:
1. tipoDocumento: escolha EXATAMENTE um destes valores em maiúsculas: MEMORANDO, OFICIO, DESPACHO, CIRCULAR, EMAIL, CERTIDAO, DECLARACAO, ATA, RELATORIO, PORTARIA, DECRETO, PROJETO_LEI, RESOLUCAO, ATO, DECISAO, EDITAL, TERMO, PARECER, NOTA_TECNICA, CONTRATO, NOTIFICACAO, RECOMENDACAO, PETICAO, CDA, PROCURACAO, CHECKLIST. Se o documento for uma planilha/CSV de dados ou relatório tabular sem cabeçalho de ofício, use CHECKLIST ou RELATORIO conforme o teor.
2. categoria: prefira escolher uma das categorias existentes fornecidas no prompt quando houver afinidade semântica; caso seja um tema totalmente novo, sugira uma categoria clara e concisa em português (ex: "Gestão de Pessoal", "Licitações e Contratos").
3. titulo: título curto, institucional e padronizado (máx. 90 caracteres) ideal para catálogo de modelos/acervo.
4. assunto: ementa/assunto objetivo do documento (sem o prefixo "Assunto:").
5. destinatario: órgão, secretaria ou autoridade destinatária identificada no documento (ou "" se não houver).
6. secretariaOrigem: secretaria ou órgão emissor identificado (preferencialmente usando o nome oficial da lista de secretarias fornecida, ou "" se não constar).
7. numeroOriginal: número oficial identificado no documento (ex: "042/2026 - SMA", "Portaria nº 120/2026") ou "" se não houver numeração.
8. dataDocumento: data do documento no formato DD/MM/AAAA se encontrada, ou "".
9. referencia: número de processo administrativo ou documento anterior citado (ex: "Processo nº 1234/2026", "Ofício nº 15/2026") ou "".
10. baseLegal: leis, decretos, artigos ou normas citadas no documento (ou "" se não houver).
11. palavrasChave: de 4 a 7 termos relevantes em minúsculas separados por vírgula para busca rápida.
12. resumoCatalogacao: resumo de 1 frase clara explicando a finalidade do documento (mencione se foi extraído via OCR ou se é uma planilha CSV estruturada quando aplicável).
13. possuiAssinaturaDigital: retorne true se o documento apresentar QUALQUER evidência de assinatura digital/eletrônica (ex.: ICP-Brasil, Gov.br / validar.iti.gov.br, SEI, certificado digital A1/A3, carimbo do tempo, QR Code de autenticidade, Código Verificador / CRC, Autentique, Clicksign, DocuSign, PAdES, XMLDSig ou aviso de assinatura local). Caso contrário, false.
14. tipoAssinaturaDigital: se possuiAssinaturaDigital for true, descreva o padrão/plataforma (ex.: "Assinatura Gov.br (ICP-Brasil)", "Certificado Digital ICP-Brasil / PAdES", "Assinatura Eletrônica SEI", "Assinatura XMLDSig (LibreOffice/Word)"). Caso contrário, "".
15. signatariosDigitais: nomes e cargos dos signatários digitais identificados no documento separados por "; " (ou "" se não constar).
16. codigoVerificacao: código verificador, CRC, hash ou URL de validação digital identificada no documento (ou "" se não constar).
17. textoLimpo: transcreva integralmente o corpo do documento (realizando OCR fiel em PDFs escaneados, fotos ou imagens embutidas; em CSV, preserve a tabela/dados organizados de forma clara). IMPORTANTE SOBRE ASSINATURA DIGITAL: se possuiAssinaturaDigital for true, PRESERVE fielmente os dados de autenticação/verificação e o teor original do documento sem mutilá-lo; se não houver assinatura digital, remova apenas cabeçalhos repetitivos de timbrado, rodapés de paginação e espaços residuais, mantendo parágrafos separados por linha em branco (\\n\\n).
18. textoModelo: versão reutilizável do mesmo corpo de texto para o Banco de Modelos, substituindo dados específicos de pessoas/datas/processos e removendo dados pessoais de assinatura por marcadores claros em caixa alta entre colchetes como [NOME_SERVIDOR], [MATRICULA], [DATA_INICIO], [NUMERO_PROCESSO], preservando integralmente a redação técnica e jurídica.
19. dadosSistema: objeto estruturado para abastecer os cadastros e combos do sistema municipal (com validação humana posterior). Extraia apenas dados explicitamente presentes no documento (sem inventar):
    - servidores: lista (máx. 12) de servidores ou autoridades citados no ato (ex.: portarias de nomeação, exoneração, designação de FG/CC, comissões ou signatários), cada item com { nome, matricula, cargoEfetivo, funcaoGratificada, secretaria, departamento, acaoAto } onde acaoAto é "NOMEACAO" | "EXONERACAO" | "DESIGNACAO" | "LOTACAO" | "FERIAS" | "COMISSAO" | "CITACAO".
    - departamentos: lista (máx. 6) de departamentos/divisões/setores internos mencionados no documento com { secretaria, departamento }.
    - cargos: lista (máx. 10) de cargos públicos efetivos ou funções citadas no documento.
    - destinatarios: lista (máx. 6) de órgãos, secretarias ou autoridades destinatárias relevantes para abastecer combos de envio.
20. estiloVisual: analise cuidadosamente o layout e estilo visual/tipográfico do documento enviado (especialmente quando for PDF ou imagem, ou pelos sinais estruturais de texto) para que o sistema possa CLONAR o estilo desse setor municipal:
    - nomeSugerido: nome institucional curto para o perfil visual (ex.: "Estilo Clonado — Gabinete do Prefeito", "Estilo Clonado — PGM", "Estilo Clonado — Controladoria").
    - setorReferencia: sigla ou nome curto do setor (ex.: "SEGOV", "PGM", "CGM", "SMF", "SMA", "SMS", "SME", "SMOSP", "GERAL").
    - fonte: escolha EXATAMENTE um entre "Times New Roman", "Arial" ou "Calibri" (o mais próximo da tipografia predominante do corpo).
    - tamanhoFonte: escolha EXATAMENTE um entre "12pt", "11pt" ou "10pt".
    - alinhamento: escolha EXATAMENTE um entre "justify", "left" ou "center".
    - espacamentoLinhas: número entre 1.15 e 1.8 (ex.: 1.5 para padrão formal, 1.35 para relatórios).
    - recuoParagrafoCm: recuo de primeira linha em cm (ex.: 0, 1.25, 1.5 ou 2.0).
    - margemSuperiorCm, margemInferiorCm, margemEsquerdaCm, margemDireitaCm: margens aproximadas em cm (padrão 2.5, 2.0, 3.0, 2.0 se não perceptível).
    - corPrimaria: cor institucional predominante em hex (ex.: "#002b82", "#0b2545", "#1e293b", "#0f4c5c", "#1d4ed8").
    - cabecalhoLayout: "CENTRALIZADO" se brasão/cabeçalho estiver centralizado no topo; "SOLENE_DUPLO" se tiver faixa/borda dupla destacada; "LATERAL" se brasão estiver à esquerda com texto ao lado.
    - cabecalhoSubtitulo: linha principal do órgão/setor exibida no cabeçalho (ex.: "GABINETE DO PREFEITO", "PROCURADORIA-GERAL DO MUNICÍPIO") ou "".
    - rodapeTexto: texto institucional de endereço/contato/e-mail presente no rodapé do documento (sem número de página) ou "".
    - epigrafeAlinhamento: "center" ou "left".
    - epigrafeCaixaAlta: true ou false.
    - ementaEstilo: "DIREITA_BORDA" (recuada à direita com barra vertical), "DIREITA_SEM_BORDA" (recuada à direita limpa, padrão LC 95/98), "CAIXA_SOMBREADA" ou "SIMPLES".
    - assinaturaPadrao: "DUPLA_REFERENDO" se houver 2 autoridades assinando (ex.: Prefeito + Secretário/Procurador), "COMISSAO_PAD" se houver 3+ membros de comissão, ou "INDIVIDUAL".
    - resumoEstilo: 1 frase objetiva descrevendo o estilo visual identificado no arquivo.`;

    // Higienização proativa LGPD (PII Masking) para texto extraído antes de enviar à IA
    const piiGuardDoc = maskPIIReversible(String(textoExtraido || '').slice(0, 45000));

    const contextoConteudo = isPdf
      ? '\nO arquivo PDF original segue anexado para leitura integral (incluindo OCR se escaneado/apresentação) e detecção de eventuais assinaturas digitais.'
      : isDirectImage
      ? '\nA imagem/foto do documento segue anexada para OCR integral em português e catalogação.'
      : `${piiGuardDoc.masked.trim() ? `\nCONTEÚDO EXTRAÍDO DO DOCUMENTO (${formatoOriginal || 'ARQUIVO'}):\n"""\n${piiGuardDoc.masked}\n"""` : ''}${safeEmbeddedImages.length > 0 ? `\nATENÇÃO OCR: Foram extraídas ${safeEmbeddedImages.length} imagem(ns) embutida(s) de dentro do arquivo (${formatoOriginal || 'DOCX/ODT/RTF'}). Faça OCR fiel dessas imagens e integre o texto completo na catalogação.` : ''}`;

    const userPrompt = `Analise e catalogue o documento enviado.
NOME DO ARQUIVO: ${fileName}
FORMATO ORIGINAL: ${formatoOriginal || mimeType}
CATEGORIAS EXISTENTES NO BANCO MESTRE: ${categoriasLista}
SECRETARIAS MUNICIPAIS OFICIAIS: ${secretariasLista}${assinaturaLocalInfo}${contextoConteudo}`;

    // Motor Primário para documentos textuais (DOCX/DOC/ODT/RTF/CSV/TXT): NVIDIA NIM (Nemotron 3.5 Bolt)
    if (isTextOnly && nvidiaDisponivel) {
      const jsonSchemaInstruction = `${systemInstruction}

FORMATO DE RESPOSTA OBRIGATÓRIO:
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem markdown, sem comentários) contendo exatamente estas 20 chaves:
{"tipoDocumento":"","categoria":"","titulo":"","assunto":"","destinatario":"","secretariaOrigem":"","numeroOriginal":"","dataDocumento":"","referencia":"","baseLegal":"","palavrasChave":"","resumoCatalogacao":"","possuiAssinaturaDigital":false,"tipoAssinaturaDigital":"","signatariosDigitais":"","codigoVerificacao":"","textoLimpo":"","textoModelo":"","dadosSistema":{"servidores":[],"departamentos":[],"cargos":[],"destinatarios":[]},"estiloVisual":{"nomeSugerido":"","setorReferencia":"","fonte":"Times New Roman","tamanhoFonte":"12pt","alinhamento":"justify","espacamentoLinhas":1.5,"recuoParagrafoCm":1.5,"margemSuperiorCm":2.5,"margemInferiorCm":2.0,"margemEsquerdaCm":3.0,"margemDireitaCm":2.0,"corPrimaria":"#002b82","cabecalhoLayout":"LATERAL","cabecalhoSubtitulo":"","rodapeTexto":"","epigrafeAlinhamento":"center","epigrafeCaixaAlta":true,"ementaEstilo":"DIREITA_BORDA","assinaturaPadrao":"INDIVIDUAL","resumoEstilo":""}}`;

      const nvCat = await askNvidiaAI({
        system: jsonSchemaInstruction,
        prompt: userPrompt,
        temperature: 0.2,
        maxTokens: 4096,
        responseFormatJson: true,
        skipMasking: true,
      });

      if (nvCat.success && nvCat.text) {
        try {
          const cleanedJson = nvCat.text
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();
          const catalogacao = JSON.parse(cleanedJson);
          if (catalogacao && typeof catalogacao === 'object' && catalogacao.tipoDocumento) {
            if (typeof catalogacao.textoLimpo === 'string') {
              catalogacao.textoLimpo = piiGuardDoc.restore(catalogacao.textoLimpo);
            }
            return res.json({
              success: true,
              catalogacao,
              fonte: nvCat.model || 'nvidia/nemotron-3.5-bolt-e4b',
              piiProtegido: piiGuardDoc.maskedCount > 0,
            });
          }
        } catch (parseErr) {
          console.warn('JSON da NVIDIA NIM inválido na catalogação; acionando fallback Gemini:', parseErr);
        }
      } else {
        console.warn('NVIDIA NIM falhou na catalogação textual; acionando fallback Gemini:', nvCat.error);
      }

      if (!ai) {
        return res.status(nvCat.statusCode || 502).json({
          success: false,
          error: nvCat.error || 'Não foi possível catalogar o documento pelo gateway NVIDIA NIM.',
        });
      }
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        code: 'MISSING_API_KEY',
        error: 'OCR multimodal requer GEMINI_API_KEY configurada nos Secrets do servidor.',
      });
    }

    const parts: any[] = [];
    if (isPdf) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: String(fileBase64).replace(/^data:application\/pdf;base64,/i, ''),
        },
      });
    } else if (isDirectImage) {
      const normalizedMime = mimeLower === 'image/jpg' ? 'image/jpeg' : (mimeLower.startsWith('image/') ? mimeLower : 'image/jpeg');
      parts.push({
        inlineData: {
          mimeType: normalizedMime,
          data: String(fileBase64).replace(/^data:image\/[^;]+;base64,/i, ''),
        },
      });
    } else if (safeEmbeddedImages.length > 0) {
      for (const img of safeEmbeddedImages) {
        const normalizedMime = img.mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : img.mimeType.toLowerCase();
        parts.push({
          inlineData: {
            mimeType: normalizedMime,
            data: img.data.replace(/^data:image\/[^;]+;base64,/i, ''),
          },
        });
      }
    }
    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipoDocumento: { type: Type.STRING, description: 'Tipo documental padronizado em maiúsculas' },
            categoria: { type: Type.STRING, description: 'Categoria temática para catalogação' },
            titulo: { type: Type.STRING, description: 'Título institucional conciso' },
            assunto: { type: Type.STRING, description: 'Assunto ou ementa do documento' },
            destinatario: { type: Type.STRING, description: 'Destinatário identificado ou vazio' },
            secretariaOrigem: { type: Type.STRING, description: 'Secretaria ou órgão emissor ou vazio' },
            numeroOriginal: { type: Type.STRING, description: 'Número oficial do documento se existir' },
            dataDocumento: { type: Type.STRING, description: 'Data no formato DD/MM/AAAA se existir' },
            referencia: { type: Type.STRING, description: 'Referência a processo ou documento anterior' },
            baseLegal: { type: Type.STRING, description: 'Base legal, leis ou artigos citados' },
            palavrasChave: { type: Type.STRING, description: 'Palavras-chave separadas por vírgula' },
            resumoCatalogacao: { type: Type.STRING, description: 'Resumo breve de 1 frase do documento' },
            possuiAssinaturaDigital: { type: Type.BOOLEAN, description: 'Indica se foi detectada assinatura digital ou eletrônica no documento' },
            tipoAssinaturaDigital: { type: Type.STRING, description: 'Tipo/plataforma de assinatura digital detectada ou vazio' },
            signatariosDigitais: { type: Type.STRING, description: 'Signatários digitais identificados ou vazio' },
            codigoVerificacao: { type: Type.STRING, description: 'Código verificador, CRC ou link de validação digital ou vazio' },
            textoLimpo: { type: Type.STRING, description: 'Corpo integral limpo do documento (preservando dados de validação quando assinado digitalmente)' },
            textoModelo: { type: Type.STRING, description: 'Corpo parametrizado com [CAMPOS] reutilizáveis sem dados pessoais/assinaturas' },
            dadosSistema: {
              type: Type.OBJECT,
              description: 'Entidades estruturadas extraídas para abastecer cadastros e combos do sistema municipal',
              properties: {
                servidores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nome: { type: Type.STRING },
                      matricula: { type: Type.STRING },
                      cargoEfetivo: { type: Type.STRING },
                      funcaoGratificada: { type: Type.STRING },
                      secretaria: { type: Type.STRING },
                      departamento: { type: Type.STRING },
                      acaoAto: { type: Type.STRING },
                    },
                  },
                },
                departamentos: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      secretaria: { type: Type.STRING },
                      departamento: { type: Type.STRING },
                    },
                  },
                },
                cargos: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                destinatarios: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            estiloVisual: {
              type: Type.OBJECT,
              description: 'DNA visual e tipográfico detectado no documento para clonagem de estilo do setor',
              properties: {
                nomeSugerido: { type: Type.STRING },
                setorReferencia: { type: Type.STRING },
                fonte: { type: Type.STRING },
                tamanhoFonte: { type: Type.STRING },
                alinhamento: { type: Type.STRING },
                espacamentoLinhas: { type: Type.NUMBER },
                recuoParagrafoCm: { type: Type.NUMBER },
                margemSuperiorCm: { type: Type.NUMBER },
                margemInferiorCm: { type: Type.NUMBER },
                margemEsquerdaCm: { type: Type.NUMBER },
                margemDireitaCm: { type: Type.NUMBER },
                corPrimaria: { type: Type.STRING },
                cabecalhoLayout: { type: Type.STRING },
                cabecalhoSubtitulo: { type: Type.STRING },
                rodapeTexto: { type: Type.STRING },
                epigrafeAlinhamento: { type: Type.STRING },
                epigrafeCaixaAlta: { type: Type.BOOLEAN },
                ementaEstilo: { type: Type.STRING },
                assinaturaPadrao: { type: Type.STRING },
                resumoEstilo: { type: Type.STRING },
              },
            },
          },
          required: [
            'tipoDocumento',
            'categoria',
            'titulo',
            'assunto',
            'destinatario',
            'secretariaOrigem',
            'numeroOriginal',
            'dataDocumento',
            'referencia',
            'baseLegal',
            'palavrasChave',
            'resumoCatalogacao',
            'possuiAssinaturaDigital',
            'tipoAssinaturaDigital',
            'signatariosDigitais',
            'codigoVerificacao',
            'textoLimpo',
            'textoModelo',
          ],
        },
      },
    });

    const rawJson = (response.text || '').trim();
    if (!rawJson) {
      return res.status(502).json({
        success: false,
        error: 'O serviço de reconhecimento não retornou conteúdo legível para este documento.',
      });
    }

    const catalogacao = JSON.parse(rawJson);
    if (catalogacao && typeof catalogacao.textoLimpo === 'string') {
      catalogacao.textoLimpo = piiGuardDoc.restore(catalogacao.textoLimpo);
    }
    return res.json({
      success: true,
      catalogacao,
      fonte: 'gemini-4-hydrogen',
      piiProtegido: piiGuardDoc.maskedCount > 0,
    });
  } catch (error: any) {
    console.error('Erro ao catalogar documento com Gemini:', error);
    const msg = String(error?.message || '');
    if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || error?.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'Chave da API Gemini inválida ou sem permissão. Verifique em Settings > Secrets.',
      });
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Limite temporário de requisições da IA atingido. Aguarde alguns instantes e tente novamente.',
      });
    }
    return res.status(500).json({
      success: false,
      error: msg || 'Não foi possível reconhecer e catalogar o documento.',
    });
  }
});

// Retorna o motor de IA primário configurado no servidor (sem expor chaves)
app.get('/api/ai/modelo-ativo', (_req, res) => {
  if (isNvidiaConfigured()) {
    const modelo = (process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL).trim();
    return res.json({ success: true, provedor: 'NVIDIA NIM', modelo });
  }
  if (process.env.GEMINI_API_KEY) {
    return res.json({ success: true, provedor: 'Google Gemini', modelo: 'gemini-4-hydrogen' });
  }
  return res.json({ success: false, provedor: null, modelo: null });
});

// Endpoint de Ajuda Inteligente do Sistema (Tira-dúvidas dos servidores com base oficial do Banco Mestre)
app.post('/api/ai/ajuda-sistema', async (req, res) => {
  try {
    const {
      pergunta = '',
      historico = [],
      contextoUsuario = {},
    } = req.body || {};

    const perguntaLimpa = String(pergunta || '').trim();
    if (!perguntaLimpa) {
      return res.status(400).json({
        success: false,
        error: 'Digite sua dúvida sobre o sistema antes de enviar.',
      });
    }

    const nvidiaDisponivel = isNvidiaConfigured();
    const ai = createGeminiClient();

    if (!nvidiaDisponivel && !ai) {
      return res.status(503).json({
        success: false,
        error: 'O assistente de IA não está configurado no servidor no momento. Consulte as abas do Guia de Orientações ou contate o DRH/SMA (Ramal 407).',
      });
    }

    const perfil = String(contextoUsuario?.perfil || 'EDITOR');
    const secretaria = String(contextoUsuario?.secretaria || 'Não informada');
    const origem = String(contextoUsuario?.origem || 'Sistema');

    const systemInstruction = `Você é o Assistente Oficial de Ajuda e Suporte do sistema "Banco Mestre de Atos & Documentos" da Prefeitura Municipal de Rio Claro – RJ.
Responda em português do Brasil de forma clara, objetiva, acolhedora e prática (com passo a passo numerado quando envolver ações na tela).

CONHECIMENTO OFICIAL COMPLETO DO SISTEMA:
1. CENTRAL DE INÍCIO:
   - Exibe saudação, Secretaria Ativa (com seletor para quem tem múltiplas pastas ou ADMIN), indicadores do Livro, rascunhos pendentes no Redator, pendências de autorização (para ADMIN), acesso direto aos 6 módulos (Redator Oficial, Despachos, Livro de Numeração, Banco de Modelos, Importar Documentos & OCR, Gestão Administrativa/Guia) e os Atos Recentes (com botões "Usar como base" e "Responder").
   - Sincronização em segundo plano preserva a tela atual do usuário sem redirecionar para o início.

2. REDATOR OFICIAL (MODO SIMPLES E AVANÇADO):
   - Suporta mais de 20 tipos de documentos agrupados em Principais, Expediente (Memorando, Ofício, Despacho, Circular, E-mail, Certidão, Declaração, Ata, Relatório), Normativos & PAD (Portaria, Decreto, Projeto de Lei, Resolução/IN, Edital, Ato PAD, Termo TAC/CAC) e Procuradoria-Geral — PGM (Parecer Jurídico, Nota Técnica/Cota, Petição Judicial, Notificação Extrajudicial, Recomendação, Contrato/Aditivo, Decisão Administrativa, CDA, Procuração, Checklist Jurídico).
   - Editor WYSIWYG em tempo real, auto-save automático ("Restaurar rascunho"), prévia ao vivo em folha A4 timbrada e Prévia Flutuante, Tela Toda e exportação em PDF A4 Timbrado, Word (.doc) com brasão embutido, Texto (.txt) e Copiar Texto.
   - Assistente IA no Redator para redigir, aprimorar, formalizar ou resumir textos com proteção LGPD (PII Masking de CPFs e e-mails).

3. PERFIS VISUAIS POR SETOR & CLONADOR DE ESTILO (PDF / DOCX / ODT):
   - No topo do Redator há o seletor "Estilo do Setor" com 6 perfis oficiais nativos: Padrão Prefeitura/SMA, Gabinete do Prefeito Solene (brasão centralizado, borda dupla, Times 12pt), Procuradoria-Geral (PGM), Controladoria-Geral (CGM), Fazenda e Finanças (SMF) e Secretarias Finalísticas.
   - Botão "Clonar de PDF/DOCX": abre a central de Importar & Catalogar; ao subir qualquer PDF, DOCX ou ODT de um setor, o sistema detecta o estilo visual (fonte, tamanho, margens, cabeçalho, cor, ementa, rodapé e assinatura) e oferece o botão "Salvar Estilo p/ o Setor" para reutilizar em todos os documentos futuros.
   - Botão "Personalizar": permite ajustar layout do timbrado (Lateral, Centralizado, Solene Borda Dupla), cor institucional, subtítulo do órgão, estilo da ementa e rodapé, e salvar como perfil customizado do setor.

4. ASSINATURAS (INDIVIDUAL, DUPLA/REFERENDO E COMISSÕES PAD/TAC):
   - Individual: preenche automaticamente Cargo em Comissão (Anexo I) ou Função Gratificada (Anexo II) quando o servidor possui no cadastro.
   - Dupla / Referendo (Prefeito + Secretário / Procurador-Geral): disponível direto na seção de Assinaturas (mesmo no Modo Simples), com combo de preenchimento rápido da 2ª autoridade; sai lado a lado na prévia, impressão/PDF, Word e TXT. Ativada automaticamente em Decretos Normativos, Projetos de Lei e Termos de Posse.
   - Comissões (Modo Avançado): Trio PAD/Sindicância, Comissão + Notificado/Defensor, TAC/CAC e Personalizada, com botão "Sincronizar no Texto" para preencher tags [PRESIDENTE], [SECRETÁRIO], [VOGAL] e "Salvar Comissão".

5. MODELOS-BASE POR SETOR (BANCO DE MODELOS):
   - Contém modelos prontos do RH/SMA, Comissões PAD/CAC, Procuradoria-Geral (PGM) e 29 modelos-base setoriais: Gabinete do Prefeito (GP-001 a GP-010), Controladoria-Geral (CGM-001 a CGM-004), Finanças/Fazenda (SMF-001 a SMF-004), Licitações e Contratos Lei 14.133/2021 (LIC-001 a LIC-005: DFD, ETP, TR, Dispensa/Inexigibilidade, Aditivo/Apostilamento) e Secretarias Finalísticas (SET-001 a SET-006: Saúde, Educação, Obras, Assistência Social, Posturas/Meio Ambiente e IPRC).

6. NUMERAÇÃO OFICIAL, LIVRO & MARCO ZERO:
   - Numeração sequencial anual por secretaria (com opção de incluir sigla da pasta) e Sequência Global Municipal única para atos como Decreto e Portaria.
   - LockService no Google Apps Script evita duplicidade simultânea.
   - Marco Zero: administradores podem registrar o último número de livros físicos/planilhas anteriores para continuar a contagem sem saltos.
   - Na planilha Google Sheets (aba Numeração), administradores têm "Anular / Cancelar Número (Protocolo)" (mantém o número reservado com [ANULADO - motivo]) e "Higienização (Excluir)" individual ou em lote para remover testes/duplicidades, tudo auditado em Logs.

7. IMPORTAR, OCR & PRESERVAÇÃO DE ASSINATURA DIGITAL:
   - Aceita envio individual ou em lote de PDF (digital ou escaneado), fotos (JPG/PNG/WEBP), ODT, DOCX, DOC, RTF, CSV e TXT/HTML.
   - Detecta assinaturas digitais (ICP-Brasil, Gov.br, PAdES, XMLDSig), calcula hash SHA-256 em modo somente-leitura e protege a validade jurídica orientando a catalogação no Livro sem reexportar o original.
   - Extrai dados estruturados (Servidores, Departamentos, Cargos, Destinatários, Marco Zero e Estilo Visual) para o usuário confirmar com 1 clique antes de abastecer o sistema.

8. ACESSO, SENHA, ADMINISTRAÇÃO & PWA:
   - Login por matrícula (apenas números) e senha; botão "Primeiro acesso / Esqueci minha senha" na tela de entrada.
   - Novos cadastros ficam aguardando aprovação do ADMIN na aba "Autorizações & Senhas" (que possui botões Aprovar e Recusar para cadastros pendentes/inativos).
   - No Painel de Administração Municipal, o Quadro Oficial de Cargos e Funções (Anexo I SS/CC, Anexo II FG e Efetivos com * em extinção e ** extintos) é editável linha a linha.
   - Pode ser instalado como PWA no PC e celular, com seletor de Tema (Claro/Escuro/Auto), 5 Paletas de Cores e Formulários para Celular (Toque Ampliado / Alto Contraste).
   - Suporte humano institucional: Secretaria Municipal de Administração (SMA) • DRH • Ramal 407 • rh@rioclaro.rj.gov.br.

DIRETRIZES DE RESPOSTA:
- Seja direto e objetivo (idealmente 4 a 10 linhas ou passos curtos com **negrito** nos nomes dos botões/abas).
- Adapte a orientação ao perfil do usuário atual (${perfil}, Secretaria: ${secretaria}, tela: ${origem}). Se uma ação exigir perfil ADMIN e o usuário não for ADMIN, avise educadamente para acionar o Administrador ou DRH (Ramal 407).
- Nunca invente funcionalidades que não existam na lista acima. Se a dúvida fugir do sistema (ex: questão jurídica específica de caso concreto), informe o que o sistema oferece (modelos/redator) e sugira consulta à PGM ou DRH.
- Preserve marcadores de privacidade como [CPF_MASCARADO_1] se aparecerem.`;

    const historicoTexto = Array.isArray(historico) && historico.length > 0
      ? historico
          .slice(-4)
          .map((h: any) => `Usuário: ${String(h?.pergunta || '').trim()}\nAssistente: ${String(h?.resposta || '').trim()}`)
          .join('\n\n')
      : '';

    const promptComposto = historicoTexto
      ? `HISTÓRICO RECENTE DA CONVERSA:\n${historicoTexto}\n\nNOVA PERGUNTA DO SERVIDOR:\n${perguntaLimpa}`
      : `PERGUNTA DO SERVIDOR:\n${perguntaLimpa}`;

    const piiGuard = maskPIIReversible(promptComposto);

    // 1. Motor Primário: NVIDIA NIM (Nemotron 3.5 Bolt)
    if (nvidiaDisponivel) {
      const nvResult = await askNvidiaAI({
        system: systemInstruction,
        prompt: piiGuard.masked,
        temperature: 0.25,
        maxTokens: 1024,
        skipMasking: true,
      });

      if (nvResult.success && nvResult.text) {
        return res.json({
          success: true,
          resposta: piiGuard.restore(nvResult.text.trim()),
          fonte: nvResult.model || 'nvidia/nemotron-3.5-bolt-e4b',
          piiProtegido: piiGuard.maskedCount > 0,
        });
      }
      console.warn('Gateway NVIDIA NIM indisponível em /api/ai/ajuda-sistema, acionando Gemini:', nvResult.error);
    }

    // 2. Motor Secundário: Gemini 4 Hydrogen (@google/genai)
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: piiGuard.masked,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const respostaGerada = response.text?.trim() || '';
      if (respostaGerada) {
        return res.json({
          success: true,
          resposta: piiGuard.restore(respostaGerada),
          fonte: 'gemini-4-hydrogen',
          piiProtegido: piiGuard.maskedCount > 0,
        });
      }
    }

    return res.status(502).json({
      success: false,
      error: 'O serviço de IA não retornou resposta no momento. Tente novamente em alguns segundos ou consulte as abas do Guia de Orientações.',
    });
  } catch (error: any) {
    console.error('Erro em /api/ai/ajuda-sistema:', error);
    const msg = String(error?.message || '');
    if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || error?.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'Chave da API de IA inválida ou sem permissão. Verifique em Settings > Secrets.',
      });
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || error?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Limite temporário de requisições da IA atingido. Aguarde alguns instantes e tente novamente.',
      });
    }
    return res.status(500).json({
      success: false,
      error: msg || 'Falha ao consultar o assistente de ajuda.',
    });
  }
});

// Middleware Vite em desenvolvimento / Arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: false,
      ws: { server: httpServer },
      allowedHosts: true
    },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, () => {
  console.log(`[Banco Mestre API] Servidor Express + Vite escutando na porta ${port}`);
});

import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

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

  if (tipoDocumento === 'EMAIL') {
    return `Prezado(a) ${destLimpo},\n\nEscrevo em nome da ${secLimpa} da Prefeitura Municipal de Rio Claro – RJ, referente ao assunto "${assuntoLimpo}".\n\n${instrucoes ? `Informamos especificamente que: ${instrucoes.trim()}.\n\n` : ''}Solicitamos a gentileza de acusar o recebimento desta mensagem e adotar as providências administrativas pertinentes no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares que se façam necessários.\n\nAtenciosamente,\n\n${signatario || 'Servidor Municipal'}${cargo ? `\n${cargo}` : ''}\n${secLimpa}\nPrefeitura Municipal de Rio Claro – RJ`;
  }

  // Padrão: MEMORANDO
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

    const ai = createGeminiClient();

    if (!ai) {
      console.warn('GEMINI_API_KEY ausente. Utilizando motor de redação oficial municipal fallback.');
      const fallbackTexto = gerarRedacaoFallback(req.body);
      return res.json({ success: true, texto: fallbackTexto, fonte: 'motor_regras_municipais' });
    }

    const tipoDocUpper = String(tipoDocumento).toUpperCase();
    const isEmailDoc = tipoDocUpper === 'EMAIL';
    const isNormativo = tipoDocUpper === 'DECRETO' || tipoDocUpper === 'PORTARIA';

    let systemInstruction = '';
    if (isEmailDoc) {
      systemInstruction = `Você é o Redator Oficial e Consultor em Comunicação Eletrônica da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir ou aprimorar E-MAILS INSTITUCIONAIS administrativos que serão enviados para servidores, secretarias, órgãos externos ou fornecedores.
REGRAS OBRIGATÓRIAS PARA E-MAIL:
1. Comece com vocativo formal adequado (ex: 'Prezado(a) [Destinatário]', 'Senhor(a) Secretário(a)', etc.).
2. Escreva texto claro, direto, cortês e objetivo. Indique com precisão a referência ao processo/assunto e o prazo ou providência requerida.
3. Conclua com 'Atenciosamente' e a assinatura institucional com o nome, cargo, secretaria e 'Prefeitura Municipal de Rio Claro – RJ'.
4. Retorne o texto completo do e-mail pronto para cópia ou envio.`;
    } else if (isNormativo) {
      systemInstruction = `Você é o Consultor Jurídico e Redator Legislativo Oficial da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir atos normativos municipais (${tipoDocUpper}) com estrito rigor formal, em conformidade com a Lei Complementar Federal nº 95/1998, a Lei Orgânica Municipal de Rio Claro e o Manual de Redação da Presidência da República.

DIRETRIZES FUNDAMENTAIS PARA ${tipoDocUpper}:
1. ESTRUTURA ARTICULADA LEGISLATIVA:
   - DECRETO (Ato privativo do Prefeito Municipal):
     * Preâmbulo solene com competência legal da Lei Orgânica Municipal;
     * Considerandos motivadores (fáticos e jurídicos);
     * Fórmula de promulgação imperativa: "DECRETA:";
     * Artigos numerados: "Art. 1º", "Art. 2º" até "Art. 9º" (com numerais ordinais e º); a partir do 10 com cardinais: "Art. 10.", "Art. 11.";
     * Parágrafos ("Parágrafo único." ou "§ 1º", "§ 2º"), incisos em algarismos romanos ("I -", "II -"), alíneas minúsculas ("a)", "b)");
     * Cláusula de vigência obrigatória: "Art. Xº Este Decreto entra em vigor na data de sua publicação."
   - PORTARIA (Ato normativo e ordenador de Secretários Municipais ou Gabinete):
     * Preâmbulo de competência da autoridade titular da pasta;
     * Fórmula de comando em linha destacada: "RESOLVE:";
     * Dispositivo articulado com ordens, designações (de fiscais de contrato da Lei 14.133/21, sindicâncias, comissões) ou concessões funcionais;
     * Cláusula de vigência: "Art. Xº Esta Portaria entra em vigor na data de sua publicação, revogadas as disposições em contrário."
2. ESTILO:
   - Impessoalidade, concisão, precisão vocabular e solenidade técnica.
   - Retorne o texto articulado pronto para ser inserido no documento oficial timbrado.`;
    } else {
      systemInstruction = `Você é o Redator Oficial e Consultor em Comunicação Administrativa da Prefeitura Municipal de Rio Claro – Estado do Rio de Janeiro.
Sua missão é redigir ou aprimorar o corpo de textos oficiais (${tipoDocUpper}: Memorando, Ofício, Despacho ou Circular) segundo o Manual de Redação da Presidência da República e as normas municipais.
REGRAS OBRIGATÓRIAS:
1. Impessoalidade, concisão, polidez e padrão culto formal da língua portuguesa.
2. NÃO adicione brasão, logotipo, cabeçalho de secretaria ou município (já existem no papel timbrado).
3. NÃO adicione local e data (ex: 'Rio Claro-RJ, ...').
4. NÃO adicione saudações como 'Prezado(a)', 'Senhor Secretário' ou 'À Secretaria...'.
5. NÃO adicione fecho como 'Atenciosamente', 'Respeitosamente' ou assinaturas finais com linhas.
6. Retorne EXCLUSIVAMENTE os parágrafos do corpo do texto oficial, prontos para inserção direta no editor.
7. Se for uma solicitação, exponha com elegância institucional a motivação e o prazo/providência requerida.
8. Se for aprimoramento, eleve a precisão vocabular e a coesão textual sem inventar dados inverídicos.`;
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

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptUser,
      config: {
        systemInstruction,
      }
    });

    const textoGerado = response.text?.trim() || '';

    if (!textoGerado) {
      const fallbackTexto = gerarRedacaoFallback(req.body);
      return res.json({ success: true, texto: fallbackTexto, fonte: 'fallback_vazio' });
    }

    res.json({ success: true, texto: textoGerado, fonte: 'gemini-4-hydrogen' });
  } catch (error: any) {
    console.error('Erro na chamada Gemini:', error);
    const fallbackTexto = gerarRedacaoFallback(req.body);
    res.json({ success: true, texto: fallbackTexto, fonte: 'fallback_erro', error: error.message });
  }
});

// Endpoint de reconhecimento, OCR (PDF digitalizado ou texto) e catalogação automática (PDF / DOCX / TXT)
app.post('/api/ai/catalogar-documento', async (req, res) => {
  try {
    const {
      fileName = 'documento',
      mimeType = 'text/plain',
      fileBase64 = '',
      textoExtraido = '',
      categoriasExistentes = [],
      secretariasExistentes = [],
    } = req.body || {};

    const ai = createGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        code: 'MISSING_API_KEY',
        error: 'Serviço de reconhecimento inteligente indisponível: configure a chave GEMINI_API_KEY em Settings > Secrets para analisar PDFs e catalogar automaticamente.',
      });
    }

    const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(String(fileName));
    if (isPdf && !fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo PDF vazio ou inválido para processamento.',
      });
    }
    if (!isPdf && !String(textoExtraido || '').trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum conteúdo textual recebido para reconhecimento e catalogação.',
      });
    }

    const categoriasLista = Array.isArray(categoriasExistentes) && categoriasExistentes.length > 0
      ? categoriasExistentes.slice(0, 60).join(' | ')
      : '1. Férias e Licenças | 2. Gestão de Pessoal | 3. Folha de Pagamento | 4. Atos Normativos | 5. Protocolo e Expediente | 6. Compras e Contratos';

    const secretariasLista = Array.isArray(secretariasExistentes) && secretariasExistentes.length > 0
      ? secretariasExistentes.slice(0, 30).join(' | ')
      : 'Secretaria Municipal de Administração (SMA) | Secretaria Municipal de Saúde (SMS) | Secretaria Municipal de Educação (SME) | Secretaria Municipal de Fazenda e Finanças (SMF) | Gabinete do Prefeito';

    const systemInstruction = `Você é o Arquivista-Chefe e Especialista em Redação Oficial da Prefeitura Municipal de Rio Claro – RJ.
Sua função é ler documentos administrativos enviados (em PDF pesquisável, PDF digitalizado/escaneado ou texto extraído de DOCX/DOC/TXT) e retornar uma catalogação estruturada precisa em JSON.

REGRAS OBRIGATÓRIAS:
1. tipoDocumento: escolha EXATAMENTE um destes valores em maiúsculas: MEMORANDO, OFICIO, DESPACHO, CIRCULAR, PORTARIA, DECRETO, ATO, TERMO, PARECER, EMAIL, CHECKLIST. Se o documento não deixar explícito, infira o mais adequado ao teor administrativo.
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
12. resumoCatalogacao: resumo de 1 frase clara explicando a finalidade do documento.
13. textoLimpo: transcreva integralmente o corpo principal do documento (realizando OCR fiel se for PDF digitalizado), removendo apenas cabeçalhos repetitivos de timbrado, rodapés de página, espaços/tabulações residuais e blocos de assinatura duplicados, mantendo parágrafos separados por linha em branco (\\n\\n).
14. textoModelo: versão reutilizável do mesmo corpo de texto, substituindo dados específicos de pessoas/datas/processos (ex: nome do servidor, matrícula, CPF, datas pontuais, números de processo, valores) por marcadores claros em caixa alta entre colchetes como [NOME_SERVIDOR], [MATRICULA], [DATA_INICIO], [NUMERO_PROCESSO], preservando integralmente a redação técnica e jurídica.`;

    const userPrompt = `Analise e catalogue o documento enviado.
NOME DO ARQUIVO: ${fileName}
CATEGORIAS EXISTENTES NO BANCO MESTRE: ${categoriasLista}
SECRETARIAS MUNICIPAIS OFICIAIS: ${secretariasLista}
${!isPdf ? `\nCONTEÚDO EXTRAÍDO DO DOCUMENTO:\n"""\n${String(textoExtraido).slice(0, 45000)}\n"""` : '\nO arquivo PDF original segue anexado para leitura integral (incluindo OCR se escaneado) e catalogação.'}`;

    const parts: any[] = [];
    if (isPdf) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: String(fileBase64).replace(/^data:application\/pdf;base64,/i, ''),
        },
      });
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
            textoLimpo: { type: Type.STRING, description: 'Corpo integral limpo do documento' },
            textoModelo: { type: Type.STRING, description: 'Corpo parametrizado com [CAMPOS] reutilizáveis' },
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
    return res.json({
      success: true,
      catalogacao,
      fonte: 'gemini-4-hydrogen',
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

import type { ModeloDocumental } from './mockData';

export type RedatorTipoDocumento =
  // Expediente & Comunicação Oficial
  | 'MEMORANDO'
  | 'OFICIO'
  | 'DESPACHO'
  | 'CIRCULAR'
  | 'EMAIL'
  | 'CERTIDAO'
  | 'DECLARACAO'
  | 'ATA'
  | 'RELATORIO'
  // Atos Normativos, Disciplinares & Licitações
  | 'PORTARIA'
  | 'DECRETO'
  | 'PROJETO_LEI'
  | 'RESOLUCAO'
  | 'ATO'
  | 'DECISAO'
  | 'EDITAL'
  | 'TERMO'
  // Procuradoria-Geral do Município (PGM) & Jurídico
  | 'PARECER'
  | 'NOTA_TECNICA'
  | 'CONTRATO'
  | 'NOTIFICACAO'
  | 'RECOMENDACAO'
  | 'PETICAO'
  | 'CDA'
  | 'PROCURACAO'
  | 'CHECKLIST';

export type GrupoTipoDocumento = 'EXPEDIENTE' | 'NORMATIVO' | 'PGM';

export type LayoutTipoDocumento =
  | 'CORRESPONDENCIA'
  | 'SOLENE'
  | 'JURIDICO'
  | 'JUDICIAL'
  | 'NOTIFICACAO'
  | 'EMAIL';

export type BadgeToneDocumento =
  | 'emerald'
  | 'amber'
  | 'sky'
  | 'indigo'
  | 'teal'
  | 'purple'
  | 'rose'
  | 'violet'
  | 'slate';

export interface AiQuickChip {
  label: string;
  prompt: string;
}

export interface DocumentTypeDefinition {
  code: RedatorTipoDocumento;
  label: string;
  shortLabel: string;
  pluralLabel: string;
  filePrefix: string;
  group: GrupoTipoDocumento;
  principais?: boolean;
  numeravel: boolean;
  layout: LayoutTipoDocumento;
  badgeTone: BadgeToneDocumento;
  subtitle: string;
  description: string;
  prefixoTemplate: (numLimpo: string, siglaOrgao?: string) => string;
  defaultAssunto: string;
  defaultDestinatario?: string;
  defaultFecho: string;
  defaultTexto: string;
  aiChips: AiQuickChip[];
}

export const DOCUMENT_TYPE_DEFINITIONS: DocumentTypeDefinition[] = [
  // =========================================================================
  // GRUPO 1: EXPEDIENTE & COMUNICAÇÃO OFICIAL
  // =========================================================================
  {
    code: 'MEMORANDO',
    label: 'Memorando',
    shortLabel: 'MEMORANDO',
    pluralLabel: 'Memorandos',
    filePrefix: 'Memo',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: true,
    layout: 'CORRESPONDENCIA',
    badgeTone: 'emerald',
    subtitle: 'Comunicação Interna Municipal',
    description: 'Expediente interno ágil entre secretarias, departamentos e divisões da Prefeitura.',
    prefixoTemplate: (num, sigla) => `MEMO ${sigla || 'PMRC'} ${num}`,
    defaultAssunto: 'Solicitação de informações e providências administrativas',
    defaultFecho: 'Permanecemos à disposição para eventuais esclarecimentos adicionais.',
    defaultTexto:
      'Cumprimentando-o cordialmente, sirvo-me do presente para solicitar a Vossa Senhoria as informações e levantamentos administrativos pertinentes ao processo em epígrafe, em atendimento às diretrizes institucionais vigentes.\n\nAs providências visam a assegurar a máxima celeridade, conformidade legal e transparência aos atos da Administração Pública Municipal de Rio Claro – RJ.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.',
    aiChips: [
      { label: 'Solicitar Informações / Relatório', prompt: 'Solicitar envio urgente de relatório e informações detalhadas sobre a execução das atividades no prazo de 5 dias úteis.' },
      { label: 'Encaminhamento p/ Parecer Jurídico (PGM)', prompt: 'Encaminhar os autos à Procuradoria-Geral do Município (PGM) para análise jurídica de legalidade e emissão de parecer.' },
      { label: 'Comunicação de Prazos e Providências', prompt: 'Comunicar formalmente a abertura de prazo impreterível para cumprimento de diligências e providências administrativas.' },
      { label: 'Resposta a Memorando Anterior', prompt: 'Em resposta à solicitação anterior, prestar os devidos esclarecimentos operacionais e certificar o andamento das medidas.' },
      { label: 'Solicitação de Material / Contratação', prompt: 'Solicitar a abertura de processo administrativo de aquisição de insumos essenciais à continuidade dos serviços públicos.' }
    ]
  },
  {
    code: 'OFICIO',
    label: 'Ofício',
    shortLabel: 'OFÍCIO',
    pluralLabel: 'Ofícios',
    filePrefix: 'Oficio',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: true,
    layout: 'CORRESPONDENCIA',
    badgeTone: 'emerald',
    subtitle: 'Correspondência Oficial Externa / Interinstitucional',
    description: 'Comunicação formal com órgãos externos, Câmara Municipal, Ministério Público, TCE-RJ e Judiciário.',
    prefixoTemplate: (num, sigla) => `OFÍCIO ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Encaminhamento de informações oficiais e providências',
    defaultFecho: 'Renovando protestos de elevada estima e distinta consideração, subscrevemo-nos.',
    defaultTexto:
      'Com nossos cordiais cumprimentos, sirvo-me do presente instrumento oficial para encaminhar a Vossa Senhoria as informações e documentação pertinentes ao assunto em referência, em atendimento às normas institucionais vigentes.\n\nColocamo-nos à inteira disposição para quaisquer esclarecimentos complementares que se fizerem necessários ao pleno atendimento da demanda.',
    aiChips: [
      { label: 'Resposta ao Ministério Público / TCE-RJ', prompt: 'Redigir ofício formal de resposta a requisição do Ministério Público ou Tribunal de Contas do Estado (TCE-RJ), apresentando esclarecimentos documentados e requerendo dilação de prazo se necessário.' },
      { label: 'Resposta à Câmara Municipal', prompt: 'Redigir ofício de resposta a requerimento ou indicação da Câmara Municipal de Rio Claro – RJ, detalhando as providências técnicas adotadas pelo Poder Executivo.' },
      { label: 'Ofício ao Juízo / Poder Judiciário', prompt: 'Redigir ofício formal dirigido ao MM. Juízo informando o cumprimento de determinação judicial ou encaminhando documentação requisitada nos autos.' },
      { label: 'Solicitação de Convênio / Parceria', prompt: 'Redigir ofício formal a órgão estadual ou federal solicitando celebração de convênio, cooperação técnica ou liberação de recursos.' }
    ]
  },
  {
    code: 'DESPACHO',
    label: 'Despacho',
    shortLabel: 'DESPACHO',
    pluralLabel: 'Despachos',
    filePrefix: 'Despacho',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: true,
    layout: 'CORRESPONDENCIA',
    badgeTone: 'emerald',
    subtitle: 'Impulso Processual Administrativo',
    description: 'Encaminhamento, saneamento, deferimento ou indeferimento em processos administrativos.',
    prefixoTemplate: (num, sigla) => `DESPACHO ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Encaminhamento e providências em processo administrativo',
    defaultFecho: 'Publique-se, cientifique-se e encaminhe-se para cumprimento.',
    defaultTexto:
      'Vistos e examinados os presentes autos.\n\nConsiderando a instrução documental constante do processo administrativo em epígrafe e as manifestações técnicas apresentadas, determino o encaminhamento dos autos ao setor destinatário para análise, adoção das providências cabíveis e posterior devolução com a devida certificação.',
    aiChips: [
      { label: 'Encaminhamento à PGM (Análise Jurídica)', prompt: 'Redigir despacho encaminhando processo administrativo de contratação ou pessoal à Procuradoria-Geral do Município para exame de legalidade e parecer.' },
      { label: 'Deferimento Fundamentado', prompt: 'Redigir despacho de deferimento fundamentado de requerimento de servidor, determinando o registro funcional e ciência ao interessado.' },
      { label: 'Saneamento / Diligência Prévia', prompt: 'Redigir despacho determinando o retorno dos autos ao órgão de origem para saneamento de pendências documentais antes da análise conclusiva.' },
      { label: 'Arquivamento de Autos', prompt: 'Redigir despacho determinando o encerramento e arquivamento definitivo dos autos após o cumprimento integral do objeto processual.' }
    ]
  },
  {
    code: 'CIRCULAR',
    label: 'Circular',
    shortLabel: 'CIRCULAR',
    pluralLabel: 'Circulares',
    filePrefix: 'Circular',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: true,
    layout: 'CORRESPONDENCIA',
    badgeTone: 'emerald',
    subtitle: 'Comunicação Conjunta a Múltiplas Unidades',
    description: 'Orientação uniforme expedida simultaneamente para todas as secretarias ou chefias.',
    prefixoTemplate: (num, sigla) => `OFÍCIO CIRCULAR ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Orientações gerais e padronização de prazos administrativos',
    defaultDestinatario: 'A Todos os Secretários Municipais e Chefias de Departamento',
    defaultFecho: 'Contando com a colaboração e ampla divulgação de todos, agradecemos.',
    defaultTexto:
      'Levamos ao conhecimento de todas as Secretarias, Departamentos e unidades administrativas da Prefeitura Municipal de Rio Claro – RJ as diretrizes e prazos operacionais estabelecidos para o assunto em epígrafe.\n\nSolicita-se a imediata ciência dos servidores envolvidos e o rigoroso cumprimento dos procedimentos indicados.',
    aiChips: [
      { label: 'Prazo de Fechamento de Folha / Frequência', prompt: 'Redigir circular informando o cronograma e prazo impreterível de entrega de folhas de ponto e ocorrências funcionais ao RH.' },
      { label: 'Orientação de Fluxo de Processos (PGM/CGM)', prompt: 'Redigir circular conjunta orientando todas as secretarias sobre a instrução obrigatória de processos antes do envio à Procuradoria e Controladoria.' },
      { label: 'Recadastramento / Atualização Cadastral', prompt: 'Redigir circular convocando servidores para atualização cadastral anual obrigatória com prazos e documentos exigidos.' }
    ]
  },
  {
    code: 'EMAIL',
    label: 'E-mail Oficial',
    shortLabel: 'E-MAIL',
    pluralLabel: 'E-mails',
    filePrefix: 'Email',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: false,
    layout: 'EMAIL',
    badgeTone: 'purple',
    subtitle: 'Comunicação Eletrônica Institucional',
    description: 'Mensagem institucional pronta para envio por correio eletrônico (sem numeração sequencial).',
    prefixoTemplate: () => 'COMUNICAÇÃO ELETRÔNICA INSTITUCIONAL (E-MAIL)',
    defaultAssunto: 'Comunicação Institucional — Prefeitura Municipal de Rio Claro – RJ',
    defaultFecho: 'Atenciosamente,',
    defaultTexto:
      'Prezado(a),\n\nEscrevo em nome da Prefeitura Municipal de Rio Claro – RJ referente ao assunto em epígrafe.\n\nSolicitamos a gentileza de analisar as informações apresentadas e acusar o recebimento desta mensagem, bem como adotar as providências cabíveis no âmbito de sua competência.\n\nPermanecemos à disposição para prestar quaisquer esclarecimentos complementares.',
    aiChips: [
      { label: 'E-mail Formal Completo', prompt: 'Redigir e-mail institucional convocando formalmente para reunião de alinhamento com pauta, prazo e solicitação de confirmação.' },
      { label: 'Cobrança Urgente de Prazo', prompt: 'Cobrar formalmente e em caráter urgente a resposta e envio de informações de ofício anterior com prazo esgotado.' },
      { label: 'Encaminhamento com Anexos', prompt: 'Encaminhar documentação técnica em anexo solicitando providências, ciência e retorno tempestivo.' },
      { label: 'Resposta a Solicitação', prompt: 'Prestar esclarecimentos formais em resposta à demanda recebida, detalhando as providências adotadas pela pasta.' }
    ]
  },
  {
    code: 'CERTIDAO',
    label: 'Certidão',
    shortLabel: 'CERTIDÃO',
    pluralLabel: 'Certidões',
    filePrefix: 'Certidao',
    group: 'EXPEDIENTE',
    principais: true,
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'slate',
    subtitle: 'Fé Pública Administrativa • Certificação Oficial',
    description: 'Certidão funcional, tempo de serviço, publicação, inteiro teor, trânsito ou regularidade processual.',
    prefixoTemplate: (num, sigla) => `CERTIDÃO ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Certidão administrativa para fins de comprovação oficial',
    defaultDestinatario: 'Ao(À) Interessado(a) / Autos do Processo Administrativo',
    defaultFecho: 'O referido é verdade e dou fé.',
    defaultTexto:
      'CERTIFICO, para os devidos fins de direito e a requerimento da parte interessada (ou por determinação superior), que, compulsando os registros oficiais e assentamentos arquivados nesta unidade da Prefeitura Municipal de Rio Claro – RJ, consta que:\n\n1. [DESCREVER O FATO, VÍNCULO FUNCIONAL, PUBLICAÇÃO, PRAZO OU SITUAÇÃO PROCESSUAL CERTIFICADA];\n2. [COMPLEMENTAR COM DATAS, NÚMEROS DE PORTARIAS/PROCESSOS E OBSERVAÇÕES PERTINENTES].\n\nPor ser expressão da verdade, lavra-se a presente Certidão, que vai devidamente datada e assinada.',
    aiChips: [
      { label: 'Certidão de Tempo de Serviço / Vínculo', prompt: 'Redigir certidão funcional atestando vínculo, cargo, data de admissão, lotação e situação funcional regular do servidor para fins previdenciários ou administrativos.' },
      { label: 'Certidão de Publicação de Ato Oficial', prompt: 'Redigir certidão atestando que decreto, portaria ou edital foi regularmente publicado no quadro de avisos e no Diário Oficial Eletrônico do Município.' },
      { label: 'Certidão de Decurso de Prazo / Inteiro Teor', prompt: 'Redigir certidão processual certificando o decurso de prazo legal sem manifestação ou a conformidade de cópias com o inteiro teor dos autos.' }
    ]
  },
  {
    code: 'DECLARACAO',
    label: 'Declaração',
    shortLabel: 'DECLARAÇÃO',
    pluralLabel: 'Declarações',
    filePrefix: 'Declaracao',
    group: 'EXPEDIENTE',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'slate',
    subtitle: 'Declaração Institucional Oficial',
    description: 'Declaração de exercício, comparecimento, disponibilidade orçamentária, compatibilidade ou veracidade.',
    prefixoTemplate: (num, sigla) => `DECLARAÇÃO ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Declaração administrativa oficial',
    defaultDestinatario: 'A quem possa interessar',
    defaultFecho: 'Por ser expressão da verdade, firmo a presente Declaração.',
    defaultTexto:
      'DECLARO, para os devidos fins administrativos e legais, que [NOME / ÓRGÃO / EMPREENDIMENTO], inscrito(a) sob matrícula/CPF/CNPJ nº [IDENTIFICAÇÃO], [DESCREVER O FATO, EXERCÍCIO FUNCIONAL, ADEQUAÇÃO ORÇAMENTÁRIA OU CONDIÇÃO DECLARADA] no âmbito do Município de Rio Claro – RJ.\n\nA presente declaração é emitida com base nos documentos e informações disponíveis nesta data.',
    aiChips: [
      { label: 'Declaração de Exercício / Lotação', prompt: 'Redigir declaração institucional confirmando que o servidor encontra-se em efetivo exercício no cargo e secretaria informados, com carga horária semanal.' },
      { label: 'Declaração de Adequação Orçamentária (LRF)', prompt: 'Redigir declaração do ordenador de despesas nos termos do art. 16, inciso II, da Lei de Responsabilidade Fiscal (LC 101/2000), atestando adequação orçamentária e financeira.' },
      { label: 'Declaração de Comparecimento / Reunião', prompt: 'Redigir declaração de comparecimento a audiência, reunião institucional ou atendimento oficial na Prefeitura Municipal.' }
    ]
  },
  {
    code: 'ATA',
    label: 'Ata',
    shortLabel: 'ATA',
    pluralLabel: 'Atas',
    filePrefix: 'Ata',
    group: 'EXPEDIENTE',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'slate',
    subtitle: 'Registro Formal de Reunião, Sessão ou Audiência',
    description: 'Ata de reunião intersetorial, conselho municipal, audiência pública, posse ou sessão de licitação.',
    prefixoTemplate: (num, sigla) => `ATA ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Ata de reunião administrativa e deliberações',
    defaultDestinatario: 'Aos Participantes e Arquivo Oficial',
    defaultFecho: 'Nada mais havendo a tratar, encerrou-se a sessão, lavrando-se a presente Ata que, lida e achada conforme, segue assinada pelos presentes.',
    defaultTexto:
      'Aos [DIA] dias do mês de [MÊS] do ano de [ANO], às [HORA], nas dependências da [LOCAL / SECRETARIA] da Prefeitura Municipal de Rio Claro – RJ, reuniram-se os representantes abaixo identificados para tratar da seguinte PAUTA: [DESCREVER A PAUTA].\n\nI – ABERTURA E PRESENÇAS:\nAberta a sessão pelo(a) coordenador(a) dos trabalhos, registrou-se a presença dos seguintes participantes: [NOMES E CARGOS].\n\nII – DELIBERAÇÕES E ENCAMINHAMENTOS:\n1. [DELIBERAÇÃO 1 E PRAZO/RESPONSÁVEL];\n2. [DELIBERAÇÃO 2 E PRAZO/RESPONSÁVEL].\n\nIII – ENCERRAMENTO:\nFicou definida a próxima reunião / entrega das providências para o dia [DATA].',
    aiChips: [
      { label: 'Ata de Reunião Intersetorial', prompt: 'Redigir ata formal de reunião de alinhamento entre secretarias municipais com pauta, deliberações numeradas, responsáveis e prazos.' },
      { label: 'Ata de Sessão de Conselho Municipal', prompt: 'Redigir ata de reunião ordinária de Conselho Municipal registrando quórum, leitura de pauta, votação de matérias e resoluções aprovadas.' },
      { label: 'Ata de Audiência Pública / Conciliação', prompt: 'Redigir ata circunstanciada de audiência pública ou reunião de conciliação administrativa com registro de manifestações e compromissos.' }
    ]
  },
  {
    code: 'RELATORIO',
    label: 'Relatório Técnico',
    shortLabel: 'RELATÓRIO',
    pluralLabel: 'Relatórios',
    filePrefix: 'Relatorio',
    group: 'EXPEDIENTE',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'slate',
    subtitle: 'Relatório Técnico / Fiscalização / Gestão',
    description: 'Relatório de fiscalização de contrato, vistoria técnica, auditoria interna ou prestação de contas.',
    prefixoTemplate: (num, sigla) => `RELATÓRIO TÉCNICO ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Relatório técnico circunstanciado de atividades e acompanhamento',
    defaultDestinatario: 'À Autoridade Superior / Ordenador de Despesas',
    defaultFecho: 'É o relatório técnico que submetemos à superior apreciação.',
    defaultTexto:
      'I – IDENTIFICAÇÃO E OBJETO:\nTrata o presente relatório do acompanhamento técnico referente a [OBJETO / CONTRATO / PROCESSO Nº], no período de [PERÍODO], sob responsabilidade desta unidade.\n\nII – ANÁLISE E CONSTATAÇÕES:\nDurante as verificações realizadas, apurou-se que:\n1. [CONSTATAÇÃO TÉCNICA / EXECUÇÃO FÍSICA E FINANCEIRA];\n2. [EVENTUAIS INCONFORMIDADES, RISCOS OU NECESSIDADES DE AJUSTE].\n\nIII – CONCLUSÃO E PROVIDÊNCIAS RECOMENDADAS:\nDiante do exposto, recomenda-se [ATESTE / GLOSA / NOTIFICAÇÃO / APROVAÇÃO / MEDIDA CORRETIVA].',
    aiChips: [
      { label: 'Relatório de Fiscalização de Contrato (Lei 14.133)', prompt: 'Redigir relatório circunstanciado de fiscalização contratual atestando a execução dos serviços, cumprimento de obrigações trabalhistas/fiscais e recomendação de ateste ou notificação.' },
      { label: 'Relatório de Auditoria / Controle Interno', prompt: 'Redigir relatório técnico de controle interno apontando achados, fundamentação legal e recomendações corretivas com prazo.' },
      { label: 'Relatório de Vistoria / Ocorrência', prompt: 'Redigir relatório técnico de vistoria in loco detalhando condições encontradas, urgências e medidas recomendadas à gestão.' }
    ]
  },

  // =========================================================================
  // GRUPO 2: ATOS NORMATIVOS, DISCIPLINARES & LICITAÇÕES
  // =========================================================================
  {
    code: 'PORTARIA',
    label: 'Portaria',
    shortLabel: 'PORTARIA',
    pluralLabel: 'Portarias',
    filePrefix: 'Portaria',
    group: 'NORMATIVO',
    principais: true,
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'sky',
    subtitle: 'Ato Administrativo Ordenador / Designação',
    description: 'Designação de fiscais (Lei 14.133/21), comissões de PAD/sindicância, licenças e atos de gestão.',
    prefixoTemplate: (num) => `PORTARIA Nº ${num}`,
    defaultAssunto: 'Designa servidores para comissão / fiscalização e dá outras providências',
    defaultFecho: 'Dê-se ciência, registre-se, publique-se e cumpra-se.',
    defaultTexto:
      'O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso de suas atribuições legais e em conformidade com o Estatuto dos Servidores Públicos Municipais,\n\nRESOLVE:\n\nArt. 1º Designar os seguintes servidores para, sob a presidência do primeiro, comporem a Comissão referente aos autos nº [NÚMERO DO PROCESSO]/[ANO]:\nI - Presidente: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA];\nII - Vogal: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA];\nIII - Secretário: [NOME], cargo [CARGO], matrícula nº [MATRÍCULA].\n\nArt. 2º A Comissão terá o prazo de 60 (sessenta) dias para a conclusão dos trabalhos.\n\nArt. 3º Esta Portaria entra em vigor na data de sua publicação.',
    aiChips: [
      { label: '📋 Fiscal de Contrato (Lei 14.133/21)', prompt: 'Redigir Portaria designando gestor, fiscal titular e substituto para acompanhamento do Contrato Administrativo nº [NÚMERO/ANO], conforme Art. 117 da Lei 14.133/21.' },
      { label: '⚖️ Comissão de Sindicância / PAD', prompt: 'Redigir Portaria constituindo comissão de sindicância investigativa ou processo administrativo disciplinar (PAD) com 3 servidores estáveis e prazo de 30 dias.' },
      { label: '🏖️ Concessão de Licença / Afastamento', prompt: 'Redigir Portaria concedendo licença-prêmio por assiduidade ou licença para capacitação a servidor público efetivo com base no estatuto dos servidores.' },
      { label: '🔄 Substituição de Chefia em Férias', prompt: 'Redigir Portaria designando servidor para responder interinamente pelas atribuições do cargo de chefia durante as férias regulamentares do titular.' },
      { label: '📑 Instrução Procedimental da Pasta', prompt: 'Redigir Portaria estabelecendo diretrizes procedimentais internas para padronização de rotinas e atendimento ao público.' }
    ]
  },
  {
    code: 'DECRETO',
    label: 'Decreto',
    shortLabel: 'DECRETO',
    pluralLabel: 'Decretos',
    filePrefix: 'Decreto',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'amber',
    subtitle: 'Prefeitura Municipal de Rio Claro – RJ • LC 95/98',
    description: 'Ato privativo do Prefeito Municipal: regulamentação de leis, créditos suplementares, nomeações e emergência.',
    prefixoTemplate: (num) => `DECRETO Nº ${num}`,
    defaultAssunto: 'Declara ponto facultativo nas repartições públicas municipais e dá outras providências',
    defaultDestinatario: 'Poder Executivo Municipal e Órgãos da Administração Direta e Indireta',
    defaultFecho: 'Gabinete do Prefeito, Rio Claro – RJ, na data de sua publicação.',
    defaultTexto:
      'O PREFEITO MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, no uso das atribuições legais que lhe confere a Lei Orgânica do Município de Rio Claro, e\n\nCONSIDERANDO a conveniência administrativa e as festividades oficiais no Município;\n\nDECRETA:\n\nArt. 1º É declarado ponto facultativo no âmbito de todos os órgãos e repartições da Administração Pública Municipal Direta e Indireta no dia [DATA].\n\nArt. 2º Os serviços essenciais de urgência e emergência em saúde, defesa civil e coleta de resíduos funcionarão em regime de plantão.\n\nArt. 3º Este Decreto entra em vigor na data de sua publicação.',
    aiChips: [
      { label: '🏛️ Ponto Facultativo em Feriado', prompt: 'Redigir Decreto Municipal declarando ponto facultativo nas repartições públicas municipais, ressalvando serviços essenciais de saúde, defesa civil e limpeza pública.' },
      { label: '💰 Abertura de Crédito Suplementar', prompt: 'Redigir Decreto Municipal autorizando a abertura de crédito adicional suplementar no orçamento vigente, indicando a anulação parcial de dotações e a fundamentação legal.' },
      { label: '📜 Regulamentação de Lei Municipal', prompt: 'Redigir Decreto regulamentando dispositivos de Lei Municipal, estabelecendo prazos, procedimentos e competências das secretarias.' },
      { label: '🚨 Situação de Emergência / Defesa Civil', prompt: 'Redigir Decreto declarando situação de emergência em áreas do município afetadas por desastres climáticos, autorizando medidas administrativas de resposta rápida.' },
      { label: '👤 Nomeação de Cargo em Comissão (1º Escalão)', prompt: 'Redigir Decreto nomeando autoridade para exercer cargo de provimento em comissão de Secretário Municipal.' }
    ]
  },
  {
    code: 'PROJETO_LEI',
    label: 'Projeto de Lei / Mensagem',
    shortLabel: 'PROJETO DE LEI',
    pluralLabel: 'Projetos de Lei',
    filePrefix: 'Projeto_de_Lei',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'amber',
    subtitle: 'Poder Executivo Municipal • LC 95/1998 • Encaminhamento à Câmara',
    description: 'Minuta de Projeto de Lei Ordinária ou Complementar com Mensagem de Justificativa à Câmara Municipal.',
    prefixoTemplate: (num) => `PROJETO DE LEI Nº ${num}`,
    defaultAssunto: 'Dispõe sobre matéria de interesse público municipal e dá outras providências',
    defaultDestinatario: 'À Excelentíssima Presidência da Câmara Municipal de Rio Claro – RJ',
    defaultFecho: 'Gabinete do Prefeito, Rio Claro – RJ, na data de seu protocolo legislativo.',
    defaultTexto:
      'A CÂMARA MUNICIPAL DE RIO CLARO, Estado do Rio de Janeiro, aprovou e eu, PREFEITO MUNICIPAL, sanciono a seguinte Lei:\n\nArt. 1º Fica instituído/autorizado, no âmbito do Município de Rio Claro – RJ, [DESCREVER O OBJETO PRINCIPAL DA LEI].\n\nArt. 2º As despesas decorrentes da execução desta Lei correrão à conta das dotações orçamentárias próprias, suplementadas se necessário.\n\nArt. 3º O Poder Executivo regulamentará esta Lei no que couber.\n\nArt. 4º Esta Lei entra em vigor na data de sua publicação, revogadas as disposições em contrário.\n\nJUSTIFICATIVA / MENSAGEM:\nExcelentíssimo Senhor Presidente e Nobres Vereadores,\nSubmetemos à elevada apreciação dessa Casa Legislativa o presente Projeto de Lei, cuja finalidade é [EXPOR MOTIVAÇÃO, INTERESSE PÚBLICO E IMPACTO ORÇAMENTÁRIO-FINANCEIRO CONFORME LRF].',
    aiChips: [
      { label: '📜 Projeto de Lei + Mensagem (LC 95/98)', prompt: 'Redigir minuta completa de Projeto de Lei Municipal estruturado conforme LC 95/98 seguido de Mensagem de Justificativa do Prefeito dirigida à Câmara Municipal.' },
      { label: '💼 Criação / Alteração de Cargos ou Estrutura', prompt: 'Redigir Projeto de Lei dispondo sobre reestruturação administrativa ou criação/extinção de cargos públicos com previsão de impacto financeiro (art. 16 e 17 da LRF).' },
      { label: '💰 Crédito Adicional Especial', prompt: 'Redigir Projeto de Lei autorizando a abertura de Crédito Adicional Especial no orçamento municipal, indicando fonte de recursos nos termos do art. 43 da Lei 4.320/64.' }
    ]
  },
  {
    code: 'RESOLUCAO',
    label: 'Resolução / IN',
    shortLabel: 'RESOLUÇÃO / IN',
    pluralLabel: 'Resoluções / INs',
    filePrefix: 'Resolucao_IN',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'sky',
    subtitle: 'Resolução / Instrução Normativa Municipal',
    description: 'Normatização técnica expedida por Secretaria, PGM, Controladoria ou Conselho Municipal.',
    prefixoTemplate: (num, sigla) => `RESOLUÇÃO / IN ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Estabelece normas, rotinas e procedimentos técnicos no âmbito municipal',
    defaultFecho: 'Registre-se, publique-se e cumpra-se.',
    defaultTexto:
      'O(A) TITULAR DO ÓRGÃO MUNICIPAL DE RIO CLARO – RJ, no uso de suas atribuições legais e regulamentares,\n\nCONSIDERANDO a necessidade de padronizar os fluxos administrativos e fortalecer os mecanismos de governança e controle;\n\nRESOLVE:\n\nArt. 1º Ficam estabelecidas, na forma desta Instrução Normativa/Resolução, as diretrizes operacionais aplicáveis a [MATÉRIA].\n\nArt. 2º Os órgãos e servidores abrangidos deverão observar rigorosamente os prazos e requisitos documentais previstos no Anexo Único.\n\nArt. 3º Esta norma entra em vigor na data de sua publicação.',
    aiChips: [
      { label: '📐 Instrução Normativa de Controle Interno (CGM)', prompt: 'Redigir Instrução Normativa da Controladoria-Geral estabelecendo rotinas de prestação de contas, liquidação de despesas ou controle patrimonial.' },
      { label: '⚖️ Resolução da PGM (Fluxo de Processos)', prompt: 'Redigir Resolução da Procuradoria-Geral do Município disciplinando prazos, checklists obrigatórios e critérios de parecer referencial.' },
      { label: '🏛️ Resolução de Conselho Municipal', prompt: 'Redigir Resolução de Conselho Municipal aprovando plano de ação, calendário ou deliberação plenária.' }
    ]
  },
  {
    code: 'ATO',
    label: 'Ato / PAD',
    shortLabel: 'ATO / PAD',
    pluralLabel: 'Atos / PAD',
    filePrefix: 'Ato_Disciplinar',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'indigo',
    subtitle: 'Comissão Processante • Sindicância e PAD',
    description: 'Atas de instalação, mandados de citação/intimação, indiciação, oitivas e relatório final disciplinar.',
    prefixoTemplate: (num) => `ATO DISCIPLINAR Nº ${num}`,
    defaultAssunto: 'Ata e Deliberações da Comissão de Processo Administrativo Disciplinar',
    defaultFecho: 'Comissão de Processo Administrativo Disciplinar / Sindicância',
    defaultTexto:
      'PROCESSO ADMINISTRATIVO DISCIPLINAR Nº [NÚMERO DO PAD]/[ANO]\n\nA COMISSÃO PROCESSANTE DA PREFEITURA MUNICIPAL DE RIO CLARO – RJ, reunida formalmente nesta data, no exercício de suas prerrogativas legais, delibera:\n\n1. Proceder à juntada dos documentos e certidões recebidas do Departamento de Recursos Humanos;\n2. Determinar a expedição de Mandado de Citação e Intimação ao(à) servidor(a) investigado(a) para audiência de instrução;\n3. Cientificar as testemunhas arroladas para comparecimento perante esta comissão, asseguradas as garantias constitucionais do contraditório e da ampla defesa.',
    aiChips: [
      { label: '⚖️ Ata de Instalação (PAD / Sindicância)', prompt: 'Redigir Ata de Instalação e Início dos Trabalhos de Comissão Processante de PAD ou Sindicância com designação de secretário e diligências iniciais.' },
      { label: '📄 Mandado de Citação e Intimação', prompt: 'Redigir Mandado de Citação Inicial de servidor investigado assegurando ampla defesa, contraditório, prazo de defesa prévia e rol de testemunhas.' },
      { label: '🏛️ Termo de Indiciação Formal', prompt: 'Redigir Termo de Indiciação detalhando fatos apurados, provas colhidas, tipificação estatutária e abertura de prazo de 10 dias para defesa escrita.' },
      { label: '🎙️ Termo de Oitiva / Interrogatório', prompt: 'Redigir Termo de Oitiva de testemunha ou Interrogatório de servidor investigado com perguntas, respostas e encerramento formal.' },
      { label: '📊 Relatório Final Conclusivo (PAD / Sind.)', prompt: 'Redigir Relatório Final Conclusivo de PAD ou Sindicância analisando provas, teses defensivas, motivação LINDB e proposição conclusiva.' }
    ]
  },
  {
    code: 'DECISAO',
    label: 'Decisão Administrativa',
    shortLabel: 'DECISÃO',
    pluralLabel: 'Decisões',
    filePrefix: 'Decisao_Adm',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'indigo',
    subtitle: 'Julgamento Administrativo Motivado (LINDB art. 20)',
    description: 'Decisão fundamentada em recurso administrativo, impugnação de edital, sanção contratual ou PAD.',
    prefixoTemplate: (num, sigla) => `DECISÃO ADMINISTRATIVA ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Decisão administrativa fundamentada em processo / recurso',
    defaultDestinatario: 'Ao(À) Recorrente / Interessado(a) e Autos do Processo',
    defaultFecho: 'Publique-se, intime-se o(a) interessado(a) e cumpra-se.',
    defaultTexto:
      'I – RELATÓRIO:\nTrata-se de requerimento/recurso administrativo interposto por [INTERESSADO(A)] nos autos do Processo Administrativo nº [NÚMERO]/[ANO], requerendo [OBJETO DO PEDIDO].\n\nII – FUNDAMENTAÇÃO:\nAnalisados os documentos acostados aos autos, a manifestação técnica do setor competente e o parecer jurídico da Procuradoria-Geral do Município, verifica-se que [RAZÕES DE FATO E DE DIREITO, COM BASE NA LEI MUNICIPAL / LEI 14.133/21 / LINDB].\n\nIII – DISPOSITIVO:\nDiante do exposto, no exercício da competência legal, DECIDO por [DEFERIR / INDEFERIR / CONHECER E NEGAR PROVIMENTO] ao pedido, determinando a ciência ao interessado e o prosseguimento regular do feito.',
    aiChips: [
      { label: '⚖️ Julgamento de Recurso em Licitação', prompt: 'Redigir decisão administrativa motivada conhecendo e julgando recurso administrativo ou impugnação de edital sob a Lei 14.133/2021.' },
      { label: '🏛️ Julgamento de PAD / Sindicância', prompt: 'Redigir decisão da autoridade julgadora acolhendo o relatório da comissão processante de PAD com motivação segundo os arts. 20 e 21 da LINDB.' },
      { label: '📋 Decisão de Aplicação de Sanção Contratual', prompt: 'Redigir decisão motivada analisando defesa prévia de empresa contratada e aplicando ou afastando sanção administrativa prevista na Lei 14.133/2021.' }
    ]
  },
  {
    code: 'EDITAL',
    label: 'Edital / Aviso',
    shortLabel: 'EDITAL',
    pluralLabel: 'Editais',
    filePrefix: 'Edital',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'amber',
    subtitle: 'Publicidade Oficial • Convocação / Chamamento / Notificação',
    description: 'Edital de convocação de concurso/PSS, chamamento público, audiência pública ou citação editalícia.',
    prefixoTemplate: (num, sigla) => `EDITAL ${sigla || 'PMRC'} Nº ${num}`,
    defaultAssunto: 'Torna pública convocação / abertura de procedimento oficial e estabelece prazos',
    defaultFecho: 'Para que chegue ao conhecimento de todos, publica-se o presente Edital no Diário Oficial Eletrônico do Município.',
    defaultTexto:
      'A PREFEITURA MUNICIPAL DE RIO CLARO – RJ, por intermédio da [SECRETARIA / COMISSÃO], no uso de suas atribuições legais, TORNA PÚBLICO o presente Edital para [OBJETO DA CONVOCAÇÃO / CHAMAMENTO / NOTIFICAÇÃO], mediante as condições a seguir:\n\n1. DO OBJETO E FINALIDADE:\n[DETALHAR O OBJETO, PÚBLICO-ALVO E FUNDAMENTO LEGAL].\n\n2. DOS PRAZOS E LOCAL DE APRESENTAÇÃO:\nOs interessados/convocados deverão comparecer ou protocolar a documentação no período de [DATA INÍCIO] a [DATA FIM], das [HORA] às [HORA], na [ENDEREÇO/PROTOCOLO].\n\n3. DAS DISPOSIÇÕES FINAIS:\nO não comparecimento no prazo estipulado implicará nas consequências previstas na legislação vigente.',
    aiChips: [
      { label: '📢 Edital de Convocação de Aprovados (Concurso/PSS)', prompt: 'Redigir edital de convocação de candidatos aprovados em concurso público ou processo seletivo simplificado com lista de documentos admissionais e prazo de apresentação.' },
      { label: '⚖️ Edital de Citação / Notificação (Local Incerto)', prompt: 'Redigir edital de notificação/citação para publicação em Diário Oficial dirigido a parte em local incerto e não sabido, assegurando prazo de defesa.' },
      { label: '🤝 Aviso de Chamamento Público / Audiência', prompt: 'Redigir edital de chamamento público ou convocação de audiência pública (LDO/LOA/Saúde) com data, local e regras de participação.' }
    ]
  },
  {
    code: 'TERMO',
    label: 'Termo / TAC',
    shortLabel: 'TERMO / TAC',
    pluralLabel: 'Termos / TACs',
    filePrefix: 'Termo_TAC',
    group: 'NORMATIVO',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'teal',
    subtitle: 'Compromisso de Ajustamento / Termo Administrativo (LINDB art. 26)',
    description: 'TAC/CAC funcional, termo de compromisso, posse, responsabilidade patrimonial ou recebimento definitivo.',
    prefixoTemplate: (num) => `TERMO / CAC Nº ${num}`,
    defaultAssunto: 'Compromisso de Ajustamento de Conduta Funcional (CAC / TAC)',
    defaultFecho: 'E, por estarem plenamente acordados, firmam o presente termo em 3 (três) vias de igual teor.',
    defaultTexto:
      'COMPROMISSO DE AJUSTAMENTO DE CONDUTA FUNCIONAL (CAC) Nº [NÚMERO]/[ANO]\nPROCESSO ADMINISTRATIVO Nº [NÚMERO DO PROCESSO]/[ANO]\n\nCOMPROMITENTE: MUNICÍPIO DE RIO CLARO – RJ, representado pela autoridade competente.\nCOMPROMISSÁRIO(A): [NOME], matrícula/CPF nº [IDENTIFICAÇÃO], cargo/qualificação [CARGO].\n\nAs partes celebram o presente Compromisso de Ajustamento de Conduta, com fundamento nos arts. 20, 21 e 26 do Decreto-Lei nº 4.657/1942 (LINDB) e normas municipais, mediante as seguintes cláusulas:\n\nCLÁUSULA 1ª - O presente compromisso fundamenta-se nas apurações constantes dos autos nº [NÚMERO], visando à solução consensual e saneadora.\nCLÁUSULA 2ª - O compromissário assume a obrigação de cumprir integralmente as metas e diretrizes pactuadas no prazo de [PRAZO].\nCLÁUSULA 3ª - Cumpridas integralmente as obrigações assumidas, proceder-se-á ao arquivamento definitivo do expediente.',
    aiChips: [
      { label: '🤝 Compromisso de Ajustamento (CAC / TAC)', prompt: 'Redigir Termo de Compromisso de Ajustamento de Conduta Funcional (CAC/TAC) com base nos arts. 20, 21 e 26 da LINDB, obrigações, prazos e suspensão punitiva.' },
      { label: '✅ Termo de Recebimento Definitivo (Contrato)', prompt: 'Redigir Termo de Recebimento Definitivo de bens ou serviços conforme art. 140 da Lei 14.133/2021, atestando conformidade técnica com o contrato.' },
      { label: '📝 Termo de Posse / Responsabilidade', prompt: 'Redigir Termo de Posse e Compromisso em cargo público municipal ou Termo de Responsabilidade sobre bens patrimoniais.' }
    ]
  },

  // =========================================================================
  // GRUPO 3: PROCURADORIA-GERAL DO MUNICÍPIO (PGM) & JURÍDICO
  // =========================================================================
  {
    code: 'PARECER',
    label: 'Parecer Jurídico',
    shortLabel: 'PARECER JURÍDICO',
    pluralLabel: 'Pareceres Jurídicos',
    filePrefix: 'Parecer_Juridico_PGM',
    group: 'PGM',
    principais: true,
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'violet',
    subtitle: 'Procuradoria-Geral do Município de Rio Claro – RJ • Consultivo Jurídico',
    description: 'Parecer jurídico formal da PGM com Ementa, I – Relatório, II – Fundamentação Jurídica e III – Conclusão.',
    prefixoTemplate: (num, sigla) => `PARECER JURÍDICO ${sigla === 'PGM' || !sigla ? 'PGM' : sigla} Nº ${num}`,
    defaultAssunto: 'Análise jurídica de legalidade e conformidade administrativa',
    defaultDestinatario: 'Ao Gabinete / Secretaria Consulente',
    defaultFecho: 'É o parecer, salvo melhor juízo (s.m.j.), que submeto à elevada apreciação do(a) Procurador(a)-Geral do Município.',
    defaultTexto:
      'EMENTA: DIREITO ADMINISTRATIVO. [TEMA CENTRAL — EX.: LICITAÇÃO / CONTRATAÇÃO DIRETA / ADITIVO CONTRATUAL / REGIME JURÍDICO DE SERVIDOR]. ANÁLISE DE LEGALIDADE. ART. 53 DA LEI Nº 14.133/2021. OPINATIVO FAVORÁVEL COM RESSALVAS / CONDICIONANTES.\n\nI – RELATÓRIO\n\nTrata-se de consulta jurídica encaminhada a esta Procuradoria-Geral do Município nos autos do Processo Administrativo nº [NÚMERO]/[ANO], oriundo da [SECRETARIA DE ORIGEM], cujo objeto consiste em [DESCREVER O OBJETO DO PROCESSO].\n\nOs autos encontram-se instruídos com: (a) Documento de Formalização de Demanda / requerimento inicial; (b) Estudo Técnico Preliminar / Termo de Referência; (c) pesquisa de preços e dotação orçamentária; (d) minuta do instrumento.\n\nÉ o sucinto relatório. Passo à análise jurídica.\n\nII – FUNDAMENTAÇÃO JURÍDICA\n\nCumpre registrar, preliminarmente, que a presente manifestação possui natureza estritamente jurídica, não adentrando no mérito administrativo ou em aspectos técnicos e econômico-financeiros, cuja responsabilidade recai sobre o órgão consulente.\n\nSob o prisma da legalidade, a matéria encontra respaldo no [CITAR DISPOSITIVOS DA CF/88, LEI ORGÂNICA MUNICIPAL, LEI Nº 14.133/2021 OU ESTATUTO DOS SERVIDORES].\n\nVerifica-se que os requisitos formais foram observados, ressalvada a necessidade de cumprimento das seguintes condicionantes antes da formalização do ato:\n1. [CONDICIONANTE / RESSALVA 1];\n2. [CONDICIONANTE / RESSALVA 2].\n\nIII – CONCLUSÃO\n\nAnte o exposto, esta Procuradoria-Geral do Município opina pela POSSIBILIDADE JURÍDICA do prosseguimento do feito, desde que previamente atendidas as recomendações elencadas no item II deste Parecer.',
    aiChips: [
      { label: '⚖️ Parecer Licitação / Edital (Art. 53 Lei 14.133)', prompt: 'Redigir Parecer Jurídico completo da PGM (Ementa, I-Relatório, II-Fundamentação Jurídica, III-Conclusão) analisando minuta de edital e contrato sob o art. 53 da Lei 14.133/2021.' },
      { label: '📝 Parecer Dispensa / Inexigibilidade (Art. 72/74/75)', prompt: 'Redigir Parecer Jurídico da PGM analisando contratação direta por dispensa ou inexigibilidade de licitação conforme arts. 72, 74 e 75 da Lei 14.133/2021, com condicionantes obrigatórias.' },
      { label: '🔄 Parecer Aditivo de Prazo / Valor (Art. 107/124)', prompt: 'Redigir Parecer Jurídico da PGM sobre termo aditivo de prorrogação de vigência ou acréscimo quantitativo contratual, verificando vantajosidade, regularidade fiscal e dotação.' },
      { label: '👤 Parecer Servidor / Vantagem / Acumulação', prompt: 'Redigir Parecer Jurídico da PGM sobre requerimento funcional de servidor (licença, incorporação, acumulação de cargos art. 37 XVI CF/88 ou revisão remuneratória).' },
      { label: '📜 Parecer de Constitucionalidade de Projeto de Lei', prompt: 'Redigir Parecer Jurídico da PGM analisando constitucionalidade, iniciativa legislativa, competência municipal e impacto financeiro (LRF) de Projeto de Lei.' }
    ]
  },
  {
    code: 'NOTA_TECNICA',
    label: 'Nota Técnica / Cota',
    shortLabel: 'NOTA TÉCNICA / COTA',
    pluralLabel: 'Notas Técnicas / Cotas',
    filePrefix: 'Nota_Tecnica_Cota',
    group: 'PGM',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'violet',
    subtitle: 'Cota Jurídica / Nota Técnica de Saneamento Rápido (PGM / CGM)',
    description: 'Manifestação objetiva para saneamento de autos, diligência prévia ou orientação jurídica célere.',
    prefixoTemplate: (num, sigla) => `NOTA TÉCNICA / COTA ${sigla || 'PGM'} Nº ${num}`,
    defaultAssunto: 'Cota jurídica de saneamento processual e diligências prévias',
    defaultDestinatario: 'À Secretaria de Origem',
    defaultFecho: 'Restituam-se os autos à origem para atendimento das diligências, retornando após para análise jurídica conclusiva.',
    defaultTexto:
      'I – OBJETO DA COTA:\nCuida-se de verificação preliminar de instrução processual nos autos do Processo Administrativo nº [NÚMERO]/[ANO], encaminhado a esta Procuradoria-Geral para exame jurídico.\n\nII – PENDÊNCIAS VERIFICADAS (SANEAMENTO):\nAntes da emissão de Parecer Jurídico conclusivo, faz-se imprescindível o retorno dos autos à Secretaria de origem para suprir os seguintes requisitos legais:\n1. Juntada de certidões atualizadas de regularidade fiscal, trabalhista (CNDT) e FGTS;\n2. Indicação expressa da dotação orçamentária e declaração do ordenador de despesas (art. 16, II, LRF);\n3. Assinatura da autoridade competente no Termo de Referência / pesquisa de preços consolidada.\n\nIII – ENCAMINHAMENTO:\nCumpridas as diligências acima, retornem os autos com urgência para análise de mérito jurídico.',
    aiChips: [
      { label: '🔎 Cota de Diligência / Saneamento (PGM)', prompt: 'Redigir Cota Jurídica objetiva devolvendo processo à secretaria de origem para complementar documentação obrigatória antes do parecer de mérito.' },
      { label: '📌 Nota Técnica de Orientação Geral', prompt: 'Redigir Nota Técnica jurídica ou de controle interno esclarecendo interpretação de norma municipal ou orientação do TCE-RJ para aplicação uniforme.' },
      { label: '✅ Aprovação por Parecer Referencial', prompt: 'Redigir Cota Jurídica aplicando Parecer Referencial da PGM a caso repetitivo de baixa complexidade, certificando o atendimento do checklist.' }
    ]
  },
  {
    code: 'CONTRATO',
    label: 'Contrato / Aditivo',
    shortLabel: 'CONTRATO / ADITIVO',
    pluralLabel: 'Contratos / Aditivos',
    filePrefix: 'Contrato_Aditivo',
    group: 'PGM',
    numeravel: true,
    layout: 'SOLENE',
    badgeTone: 'teal',
    subtitle: 'Instrumento Contratual Municipal • Lei nº 14.133/2021',
    description: 'Minuta de Contrato Administrativo, Termo Aditivo de prazo/valor, Apostilamento ou Termo de Convênio.',
    prefixoTemplate: (num) => `CONTRATO / ADITIVO Nº ${num}`,
    defaultAssunto: 'Termo de Contrato Administrativo / Termo Aditivo (Lei nº 14.133/2021)',
    defaultDestinatario: 'Entre o Município de Rio Claro – RJ e a Contratada',
    defaultFecho: 'E, por estarem justas e contratadas, assinam o presente instrumento em 3 (três) vias de igual teor e forma, na presença das testemunhas abaixo.',
    defaultTexto:
      'CONTRATANTE: MUNICÍPIO DE RIO CLARO, Estado do Rio de Janeiro, pessoa jurídica de direito público interno, inscrito no CNPJ sob nº [CNPJ], com sede na Av. João Baptista Portugal, nº 230, Centro, Rio Claro – RJ, neste ato representado por [AUTORIDADE].\nCONTRATADA: [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], sediada em [ENDEREÇO], representada por [REPRESENTANTE LEGAL].\n\nPROCESSO ADMINISTRATIVO Nº [NÚMERO]/[ANO] — MODALIDADE: [PREGÃO / DISPENSA / INEXIGIBILIDADE]\n\nCLÁUSULA PRIMEIRA – DO OBJETO:\nO presente instrumento tem por objeto [DESCREVER DETALHADAMENTE O OBJETO CONTRATADO], conforme Termo de Referência e proposta vencedora.\n\nCLÁUSULA SEGUNDA – DO VALOR E DA DOTAÇÃO ORÇAMENTÁRIA:\nO valor global estimado é de R$ [VALOR] ([EXTENSO]), correndo a despesa à conta da Dotação Orçamentária nº [DOTAÇÃO].\n\nCLÁUSULA TERCEIRA – DA VIGÊNCIA E PRORROGAÇÃO:\nO prazo de vigência será de [PRAZO], contados de [DATA], admitida prorrogação na forma dos arts. 106 e 107 da Lei nº 14.133/2021.\n\nCLÁUSULA QUARTA – DA FISCALIZAÇÃO E SANÇÕES:\nA execução será acompanhada por fiscal formalmente designado (art. 117 da Lei nº 14.133/2021), sujeitando-se o inadimplemento às sanções dos arts. 155 e 156.\n\nCLÁUSULA QUINTA – DO FORO:\nFica eleito o Foro da Comarca de Rio Claro – RJ para dirimir quaisquer controvérsias oriundas deste contrato.',
    aiChips: [
      { label: '📄 Minuta de Contrato Administrativo (Lei 14.133)', prompt: 'Redigir minuta estruturada de Contrato Administrativo conforme art. 92 da Lei 14.133/2021 contendo objeto, valor, dotação, vigência, pagamento, fiscalização, sanções, extinção e foro.' },
      { label: '🔄 Termo Aditivo de Prorrogação de Prazo', prompt: 'Redigir minuta de Termo Aditivo de prorrogação de prazo de vigência contratual com fundamento no art. 107 da Lei 14.133/2021, ratificando as demais cláusulas.' },
      { label: '➕ Termo Aditivo de Acréscimo/Supressão (25%)', prompt: 'Redigir Termo Aditivo de acréscimo ou supressão quantitativa até o limite de 25% previsto no art. 125 da Lei 14.133/2021, com indicação de valor e dotação.' },
      { label: '📌 Termo de Apostilamento (Reajuste / Dotação)', prompt: 'Redigir Termo de Apostilamento conforme art. 136 da Lei 14.133/2021 para registro de reajuste por índice contratual ou alteração de dotação orçamentária.' }
    ]
  },
  {
    code: 'NOTIFICACAO',
    label: 'Notificação Extrajudicial',
    shortLabel: 'NOTIFICAÇÃO',
    pluralLabel: 'Notificações',
    filePrefix: 'Notificacao_Extrajudicial',
    group: 'PGM',
    numeravel: true,
    layout: 'NOTIFICACAO',
    badgeTone: 'rose',
    subtitle: 'Notificação Formal / Contraditório e Defesa Prévia',
    description: 'Notificação a fornecedor inadimplente, abertura de defesa prévia em sanção contratual ou cobrança amigável.',
    prefixoTemplate: (num, sigla) => `NOTIFICAÇÃO EXTRAJUDICIAL ${sigla || 'PGM'} Nº ${num}`,
    defaultAssunto: 'Notificação de descumprimento contratual e abertura de prazo para regularização/defesa prévia',
    defaultDestinatario: '[RAZÃO SOCIAL / NOME DO NOTIFICADO — CNPJ/CPF]',
    defaultFecho: 'Ciente de que o silêncio ou o não atendimento no prazo legal acarretará a adoção das medidas administrativas e judiciais cabíveis.',
    defaultTexto:
      'O MUNICÍPIO DE RIO CLARO – RJ, por intermédio da [PROCURADORIA-GERAL / SECRETARIA], vem, respeitosamente, NOTIFICAR formalmente Vossa Senhoria acerca dos fatos abaixo expostos:\n\n1. DOS FATOS:\nConforme apurado nos autos do Processo Administrativo nº [NÚMERO]/[ANO] e no Contrato nº [CONTRATO], constatou-se o descumprimento de obrigação contratual/legal consistente em [DESCREVER A INADIMPLÊNCIA OU ATRASO].\n\n2. DA FUNDAMENTAÇÃO LEGAL:\nA conduta contraria as cláusulas contratuais pactuadas e sujeita a notificada às penalidades previstas nos arts. 155 e 156 da Lei Federal nº 14.133/2021 (advertência, multa, impedimento de licitar e rescisão).\n\n3. DA PROVIDÊNCIA E DO PRAZO PARA DEFESA PRÉVIA:\nFica Vossa Senhoria formalmente NOTIFICADA para, no prazo improrrogável de [05 / 15] dias úteis a contar do recebimento desta, regularizar integralmente a pendência e/ou apresentar DEFESA PRÉVIA escrita, assegurados o contraditório e a ampla defesa.',
    aiChips: [
      { label: '⚠️ Notificação de Atraso / Inexecução Contratual', prompt: 'Redigir Notificação Extrajudicial a empresa contratada por atraso na entrega ou inexecução parcial, concedendo prazo para regularização e abertura de defesa prévia (art. 157 Lei 14.133/21).' },
      { label: '💰 Notificação de Cobrança Amigável (Pré-CDA)', prompt: 'Redigir Notificação Extrajudicial administrativa de cobrança de débito municipal antes da inscrição em Dívida Ativa e protesto/execução fiscal.' },
      { label: '🏗️ Notificação de Regularização / Posturas / Imóvel', prompt: 'Redigir Notificação Extrajudicial determinando a regularização de obra, desocupação de área pública ou cessação de irregularidade administrativa sob pena de medidas judiciais.' }
    ]
  },
  {
    code: 'RECOMENDACAO',
    label: 'Recomendação Jurídica',
    shortLabel: 'RECOMENDAÇÃO',
    pluralLabel: 'Recomendações',
    filePrefix: 'Recomendacao_PGM',
    group: 'PGM',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'violet',
    subtitle: 'Procuradoria-Geral do Município • Atuação Preventiva e Controle de Legalidade',
    description: 'Recomendação preventiva da PGM ou Controladoria às Secretarias para evitar apontamentos do TCE-RJ/MP.',
    prefixoTemplate: (num, sigla) => `RECOMENDAÇÃO ${sigla || 'PGM'} Nº ${num}`,
    defaultAssunto: 'Recomendação jurídico-administrativa preventiva de conformidade legal',
    defaultDestinatario: 'Aos Senhores Secretários Municipais e Ordenadores de Despesas',
    defaultFecho: 'Solicita-se ciência formal e comprovação das medidas adotadas no prazo estipulado.',
    defaultTexto:
      'A PROCURADORIA-GERAL DO MUNICÍPIO DE RIO CLARO – RJ, no exercício de suas atribuições institucionais de consultoria jurídica e controle preventivo de legalidade;\n\nCONSIDERANDO os princípios constitucionais da legalidade, impessoalidade, moralidade, publicidade e eficiência (art. 37 da Constituição Federal);\nCONSIDERANDO a jurisprudência consolidada do Tribunal de Contas do Estado do Rio de Janeiro (TCE-RJ) e as disposições da Lei Federal nº 14.133/2021;\n\nRECOMENDA:\n\nArt. 1º Que todas as unidades gestoras observem estritamente [DIRETRIZ PREVENTIVA PRINCIPAL], abstendo-se de [CONDUTA IRREGULAR A EVITAR].\n\nArt. 2º Que seja encaminhada comprovação de adequação dos processos em curso no prazo de [PRAZO] dias.\n\nArt. 3º O descumprimento injustificado sujeitará a responsabilidade administrativa do agente omisso.',
    aiChips: [
      { label: '🛡️ Recomendação Preventiva (Compras / Fracionamento)', prompt: 'Redigir Recomendação Jurídica da PGM orientando secretarias sobre vedação ao fracionamento de despesas e planejamento anual de contratações (PCA) na Lei 14.133/21.' },
      { label: '⚖️ Cumprimento de Determinação do TCE-RJ / MP', prompt: 'Redigir Recomendação da PGM orientando gestores quanto ao cumprimento tempestivo de acórdão do TCE-RJ ou recomendação do Ministério Público.' },
      { label: '📋 Vedação de Condutas em Ano Eleitoral / Transição', prompt: 'Redigir Recomendação Jurídica preventiva orientando servidores e gestores sobre condutas vedadas pela legislação eleitoral (Lei 9.504/97) e LRF.' }
    ]
  },
  {
    code: 'PETICAO',
    label: 'Peça Judicial (PGM)',
    shortLabel: 'PEÇA JUDICIAL',
    pluralLabel: 'Peças Judiciais',
    filePrefix: 'Peca_Judicial_PGM',
    group: 'PGM',
    numeravel: true,
    layout: 'JUDICIAL',
    badgeTone: 'rose',
    subtitle: 'Procuradoria-Geral do Município • Contencioso Judicial',
    description: 'Contestação, Informações em Mandado de Segurança, Manifestação, Contrarrazões ou Petição em Juízo.',
    prefixoTemplate: (num) => `PEÇA JUDICIAL PGM — CONTROLE Nº ${num}`,
    defaultAssunto: 'Manifestação judicial do Município de Rio Claro – RJ',
    defaultDestinatario: 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA ÚNICA DA COMARCA DE RIO CLARO – RJ',
    defaultFecho: 'Termos em que, pede e espera deferimento.',
    defaultTexto:
      'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA ÚNICA DA COMARCA DE RIO CLARO – RJ\n\nProcesso nº: [0000000-00.2026.8.19.0047]\nAutor(a) / Impetrante: [NOME DA PARTE]\nRéu / Impetrado: MUNICÍPIO DE RIO CLARO – RJ\n\nO MUNICÍPIO DE RIO CLARO – RJ, pessoa jurídica de direito público interno, inscrito no CNPJ sob o nº [CNPJ], representado judicialmente por sua Procuradoria-Geral (art. 75, inciso III, do CPC), vem, respeitosamente, à presença de Vossa Excelência, apresentar\n\n[CONTESTAÇÃO / INFORMAÇÕES / MANIFESTAÇÃO]\n\npelos fatos e fundamentos jurídicos a seguir expostos:\n\nI – SÍNTESE DOS FATOS\n[RESUMIR A DEMANDA PROPOSTA PELA PARTE AUTORA E A REALIDADE ADMINISTRATIVA COMPROVADA PELOS DOCUMENTOS].\n\nII – PRELIMINARES (SE HOUVER)\n[ARGÜIR INCOMPETÊNCIA, ILEGITIMIDADE, PRESCRIÇÃO QUINQUENAL DO DECRETO 20.910/32 OU FALTA DE INTERESSE PROCESSUAL, SE APLICÁVEL].\n\nIII – DO MÉRITO E FUNDAMENTAÇÃO JURÍDICA\n[DESENVOLVER AS TESES DE DEFESA DO ENTE MUNICIPAL COM BASE NA CF/88, CPC, LEIS MUNICIPAIS E JURISPRUDÊNCIA DO TJRJ/STJ/STF].\n\nIV – DOS PEDIDOS\nAnte o exposto, requer o Município de Rio Claro – RJ:\na) O acolhimento das preliminares suscitadas, com a extinção do feito sem resolução do mérito (art. 485 do CPC);\nb) No mérito, a total IMPROCEDÊNCIA dos pedidos formulados na inicial, condenando-se a parte autora nos ônus sucumbenciais;\nc) A produção de todas as provas em direito admitidas e a intimação pessoal da Fazenda Pública (art. 183 do CPC).',
    aiChips: [
      { label: '⚖️ Contestação da Fazenda Pública (CPC)', prompt: 'Redigir Contestação judicial completa pelo Município de Rio Claro – RJ com síntese dos fatos, preliminares (prescrição quinquenal Decreto 20.910/32 se cabível), mérito fundamentado e pedidos com intimação pessoal art. 183 CPC.' },
      { label: '🛡️ Informações em Mandado de Segurança', prompt: 'Redigir Informações da Autoridade Coatora em Mandado de Segurança (Lei 12.016/2009), demonstrando ausência de direito líquido e certo e legalidade do ato administrativo, requerendo denegação da segurança.' },
      { label: '🏥 Defesa em Ação de Saúde / Medicamento', prompt: 'Redigir manifestação judicial do Município em ação de fornecimento de medicamento/tratamento de saúde observando os Temas 793 e 1234 do STF, protocolos do SUS e responsabilidade solidária/ressarcimento.' },
      { label: '📋 Petição Intercorrente / Cumprimento de Decisão', prompt: 'Redigir petição simples dirigida ao Juízo informando o cumprimento de decisão liminar ou requerendo dilação de prazo para juntada de documentos administrativos.' }
    ]
  },
  {
    code: 'CDA',
    label: 'CDA / Dívida Ativa',
    shortLabel: 'CDA / DÍVIDA ATIVA',
    pluralLabel: 'CDAs / Dívida Ativa',
    filePrefix: 'CDA_Divida_Ativa',
    group: 'PGM',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'rose',
    subtitle: 'Procuradoria da Dívida Ativa • Lei Federal nº 6.830/1980 (LEF) e CTN art. 202',
    description: 'Certidão de Dívida Ativa (CDA) ou Termo de Inscrição para cobrança administrativa, protesto ou execução fiscal.',
    prefixoTemplate: (num) => `CERTIDÃO DE DÍVIDA ATIVA (CDA) Nº ${num}`,
    defaultAssunto: 'Inscrição e Certidão de Dívida Ativa Municipal (Art. 202 CTN / Art. 2º §5º LEF)',
    defaultDestinatario: 'Contribuinte / Devedor(a) e Cartório / Juízo da Execução Fiscal',
    defaultFecho: 'Certifico que a presente Dívida Ativa goza de presunção de certeza e liquidez (art. 204 do CTN), sendo título executivo extrajudicial.',
    defaultTexto:
      'DADOS DO REGISTRO EM DÍVIDA ATIVA (ART. 2º, § 5º, DA LEI Nº 6.830/1980 E ART. 202 DO CTN):\n\nDEVEDOR(A): [NOME / RAZÃO SOCIAL]\nCPF / CNPJ: [DOCUMENTO] — INSCRIÇÃO MUNICIPAL/IMOBILIÁRIA: [INSCRIÇÃO]\nENDEREÇO: [ENDEREÇO COMPLETO]\nCORRESPONSÁVEL (SE HOUVER): [NOME / CPF]\n\nORIGEM E NATUREZA DO CRÉDITO: [Tributário (IPTU / ISSQN / Taxas) ou Não Tributário (Multa Administrativa)]\nFUNDAMENTO LEGAL: Código Tributário Municipal de Rio Claro – RJ, CTN (Lei nº 5.172/1966) e Lei nº 6.830/1980.\nPROCESSO ADMINISTRATIVO / LIVRO / FOLHA: Processo nº [NÚMERO] — Livro nº [LIVRO], Folha nº [FOLHA], Data da Inscrição: [DATA].\n\nDEMONSTRATIVO DISCRIMINADO DO DÉBITO:\n- Exercício(s) / Competência(s): [ANOS]\n- Valor Principal Originário: R$ [VALOR]\n- Atualização Monetária (Índice Municipal): R$ [VALOR]\n- Juros de Mora (1% a.m. — Termo Inicial: [DATA]): R$ [VALOR]\n- Multa Moratória / Punitiva: R$ [VALOR]\n- VALOR TOTAL CONSOLIDADO: R$ [VALOR TOTAL]\n\nCERTIFICAÇÃO:\nCertifico que o débito acima discriminado encontra-se regularmente inscrito na Dívida Ativa do Município de Rio Claro – RJ, não tendo sido pago até a presente data.',
    aiChips: [
      { label: '💰 CDA Tributária (IPTU / ISS / Taxas)', prompt: 'Redigir Certidão de Dívida Ativa (CDA) completa com todos os requisitos obrigatórios do art. 202 do CTN e art. 2º §5º da Lei 6.830/80 para crédito tributário municipal.' },
      { label: '⚖️ CDA Não Tributária (Multa / Ressarcimento)', prompt: 'Redigir Certidão de Dívida Ativa de crédito não tributário municipal (multa contratual ou de posturas) com fundamentação no art. 39 §2º da Lei 4.320/64 e LEF.' },
      { label: '📄 Termo de Parcelamento / Confissão de Dívida', prompt: 'Redigir Termo de Confissão Irrevogável de Dívida e Parcelamento de débito inscrito em Dívida Ativa Municipal com cláusula de rescisão por inadimplência.' }
    ]
  },
  {
    code: 'PROCURACAO',
    label: 'Procuração / Substab.',
    shortLabel: 'PROCURAÇÃO',
    pluralLabel: 'Procurações',
    filePrefix: 'Procuracao_PGM',
    group: 'PGM',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'violet',
    subtitle: 'Procuradoria-Geral do Município • Outorga de Poderes / Substabelecimento',
    description: 'Procuração ad judicia et extra, carta de preposição para audiências ou substabelecimento de procuradores.',
    prefixoTemplate: (num) => `PROCURAÇÃO / SUBSTABELECIMENTO PGM Nº ${num}`,
    defaultAssunto: 'Outorga de poderes / Carta de Preposição / Substabelecimento',
    defaultDestinatario: 'A quem interessar / Juízos e Tribunais',
    defaultFecho: 'Para que produza seus jurídicos e legais efeitos, firmo o presente instrumento.',
    defaultTexto:
      'OUTORGANTE: MUNICÍPIO DE RIO CLARO, Estado do Rio de Janeiro, pessoa jurídica de direito público interno, inscrito no CNPJ sob nº [CNPJ], com sede na Av. João Baptista Portugal, nº 230, Centro, Rio Claro – RJ, neste ato representado pelo(a) [PREFEITO MUNICIPAL / PROCURADOR-GERAL DO MUNICÍPIO].\n\nOUTORGADO(A): [NOME DO(A) PROCURADOR(A) / PREPOSTO(A)], brasileiro(a), [ESTADO CIVIL], advogado(a) inscrito(a) na OAB/RJ sob nº [OAB] / servidor(a) matrícula nº [MATRÍCULA], com endereço profissional na Procuradoria-Geral do Município de Rio Claro – RJ.\n\nPODERES:\nPelo presente instrumento, o Outorgante confere ao(à) Outorgado(a) amplos poderes da cláusula "ad judicia et extra" (art. 105 do CPC) para representar o Município de Rio Claro – RJ perante qualquer Juízo, Instância ou Tribunal, bem como órgãos administrativos, podendo peticionar, contestar, recorrer, participar de audiências de conciliação e instrução, juntar e retirar documentos e praticar todos os atos necessários ao fiel desempenho do mandato no processo nº [NÚMERO/GERAL].',
    aiChips: [
      { label: '⚖️ Procuração Ad Judicia et Extra (PGM)', prompt: 'Redigir Procuração ad judicia et extra outorgada pelo Município de Rio Claro – RJ a Procurador/Assessor Jurídico conforme art. 105 do CPC.' },
      { label: '🏛️ Carta de Preposição para Audiência', prompt: 'Redigir Carta de Preposição designando servidor público municipal como preposto para representar o Município em audiência judicial ou trabalhista.' },
      { label: '🔁 Termo de Substabelecimento com Reservas', prompt: 'Redigir Termo de Substabelecimento com reserva de iguais poderes entre Procuradores Municipais nos autos de processo judicial.' }
    ]
  },
  {
    code: 'CHECKLIST',
    label: 'Checklist Jurídico',
    shortLabel: 'CHECKLIST',
    pluralLabel: 'Checklists',
    filePrefix: 'Checklist_Juridico',
    group: 'PGM',
    numeravel: true,
    layout: 'JURIDICO',
    badgeTone: 'teal',
    subtitle: 'Lista de Verificação e Saneamento Processual (PGM / CGM / Licitações)',
    description: 'Checklist de conformidade legal para instrução de processos de licitação, dispensa, aditivos e pagamentos.',
    prefixoTemplate: (num, sigla) => `CHECKLIST DE CONFORMIDADE ${sigla || 'PGM'} Nº ${num}`,
    defaultAssunto: 'Checklist de verificação documental e conformidade processual (Lei nº 14.133/2021)',
    defaultDestinatario: 'Autos do Processo Administrativo / Setor Requisitante',
    defaultFecho: 'Conferido e atestado conforme a documentação constante dos autos nesta data.',
    defaultTexto:
      'PROCESSO ADMINISTRATIVO Nº: [NÚMERO]/[ANO]\nÓRGÃO REQUISITANTE: [SECRETARIA]\nOBJETO: [DESCRIÇÃO DO OBJETO]\n\nLISTA DE VERIFICAÇÃO DOCUMENTAL (S = SIM | N = NÃO | NA = NÃO SE APLICA):\n\n[  ] 1. Documento de Formalização de Demanda (DFD) devidamente assinado (fls. ___);\n[  ] 2. Estudo Técnico Preliminar (ETP) ou justificativa legal de dispensa (fls. ___);\n[  ] 3. Termo de Referência / Projeto Básico aprovado pela autoridade competente (fls. ___);\n[  ] 4. Pesquisa de preços conforme art. 23 da Lei nº 14.133/2021 e mapa comparativo (fls. ___);\n[  ] 5. Reserva orçamentária e declaração do ordenador de despesas — art. 16, II, LRF (fls. ___);\n[  ] 6. Certidões de regularidade fiscal (Federal/INSS, Estadual, Municipal), FGTS e CNDT válidas (fls. ___);\n[  ] 7. Autorização expressa da autoridade competente para abertura do certame/contratação (fls. ___);\n[  ] 8. Minuta do Edital / Contrato / Termo Aditivo para análise jurídica da PGM (fls. ___).\n\nRESULTADO DA CONFERÊNCIA:\n(  ) Processo regularmente instruído — apto à análise jurídica de mérito.\n(  ) Processo com pendências — restituir à origem para saneamento dos itens assinalados.',
    aiChips: [
      { label: '✅ Checklist Licitação / Pregão (Lei 14.133/21)', prompt: 'Redigir checklist completo de verificação jurídica da PGM para fase preparatória de licitação (Pregão/Concorrência) sob a Lei 14.133/2021.' },
      { label: '⚡ Checklist Dispensa / Inexigibilidade (Art. 72)', prompt: 'Redigir checklist de instrução processual para contratação direta por dispensa ou inexigibilidade segundo o art. 72 da Lei 14.133/2021.' },
      { label: '🔄 Checklist Prorrogação / Aditivo Contratual', prompt: 'Redigir checklist jurídico de conformidade para prorrogação de vigência ou aditivo de valor de contrato administrativo.' }
    ]
  }
];

export const DOCUMENT_TYPE_MAP: Record<RedatorTipoDocumento, DocumentTypeDefinition> = DOCUMENT_TYPE_DEFINITIONS.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<RedatorTipoDocumento, DocumentTypeDefinition>
);

export const ALL_DOCUMENT_TYPE_CODES: RedatorTipoDocumento[] = DOCUMENT_TYPE_DEFINITIONS.map(d => d.code);

export const TIPOS_DOCUMENTO_NUMERADOS_OFICIAIS: RedatorTipoDocumento[] = DOCUMENT_TYPE_DEFINITIONS
  .filter(d => d.numeravel)
  .map(d => d.code);

export function isValidDocumentType(tipo?: string): tipo is RedatorTipoDocumento {
  if (!tipo) return false;
  return Object.prototype.hasOwnProperty.call(DOCUMENT_TYPE_MAP, tipo.toUpperCase());
}

export function normalizeDocumentTypeCode(raw?: string): RedatorTipoDocumento {
  const upper = String(raw || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (isValidDocumentType(upper)) return upper;

  const compact = upper.replace(/[^A-Z0-9_]/g, '');
  if (isValidDocumentType(compact)) return compact;

  if (compact.includes('PROJETO') && compact.includes('LEI')) return 'PROJETO_LEI';
  if (compact.includes('NOTA') || compact.includes('COTA')) return 'NOTA_TECNICA';
  if (compact.includes('PAREC')) return 'PARECER';
  if (compact.includes('PETIC') || compact.includes('CONTEST') || compact.includes('MANDADO') || compact.includes('JUDIC')) return 'PETICAO';
  if (compact.includes('CONTRAT') || compact.includes('ADITIV') || compact.includes('APOSTIL')) return 'CONTRATO';
  if (compact.includes('NOTIF')) return 'NOTIFICACAO';
  if (compact.includes('RECOMEND')) return 'RECOMENDACAO';
  if (compact === 'CDA' || compact.includes('DIVIDAATIVA')) return 'CDA';
  if (compact.includes('PROCURAC') || compact.includes('SUBSTAB') || compact.includes('PREPOS')) return 'PROCURACAO';
  if (compact.includes('CERTID')) return 'CERTIDAO';
  if (compact.includes('DECLAR')) return 'DECLARACAO';
  if (compact === 'ATA' || compact.startsWith('ATADE')) return 'ATA';
  if (compact.includes('RELAT')) return 'RELATORIO';
  if (compact.includes('RESOL') || compact.includes('INSTRUCAONORMATIVA')) return 'RESOLUCAO';
  if (compact.includes('EDITAL')) return 'EDITAL';
  if (compact.includes('DECIS')) return 'DECISAO';
  if (compact.includes('OFIC')) return 'OFICIO';
  if (compact.includes('MEMO')) return 'MEMORANDO';
  if (compact.includes('DESP')) return 'DESPACHO';
  if (compact.includes('CIRC')) return 'CIRCULAR';
  if (compact.includes('PORT')) return 'PORTARIA';
  if (compact.includes('DECR')) return 'DECRETO';
  if (compact.includes('TERM') || compact.includes('TAC') || compact.includes('CAC')) return 'TERMO';
  if (compact.includes('MAIL')) return 'EMAIL';
  if (compact.includes('CHECK')) return 'CHECKLIST';
  if (compact.includes('ATO') || compact.includes('PAD') || compact.includes('SINDIC')) return 'ATO';
  return 'MEMORANDO';
}

export function getDocumentTypeDefinition(tipo?: string): DocumentTypeDefinition {
  const code = normalizeDocumentTypeCode(tipo);
  return DOCUMENT_TYPE_MAP[code] || DOCUMENT_TYPE_MAP.MEMORANDO;
}

export function isSoleneLayout(tipo?: string): boolean {
  return getDocumentTypeDefinition(tipo).layout === 'SOLENE';
}

export function isJuridicoLayout(tipo?: string): boolean {
  return getDocumentTypeDefinition(tipo).layout === 'JURIDICO';
}

export function isJudicialLayout(tipo?: string): boolean {
  return getDocumentTypeDefinition(tipo).layout === 'JUDICIAL';
}

export function isNotificacaoLayout(tipo?: string): boolean {
  return getDocumentTypeDefinition(tipo).layout === 'NOTIFICACAO';
}

/**
 * Modelos oficiais prontos da Procuradoria-Geral do Município (PGM) e Atos Administrativos Complementares
 * Incorporados diretamente ao Catálogo Oficial do sistema.
 */
export const MODELOS_PGM_E_ADMINISTRATIVOS_OFICIAIS: ModeloDocumental[] = [
  {
    ID: 'PGM-001',
    TipoDocumento: 'PARECER',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Licitações e Contratos',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Parecer Jurídico — Contratação Direta / Licitação (Lei nº 14.133/2021)',
    Assunto: 'Análise jurídica de legalidade de contratação pública conforme Lei Federal nº 14.133/2021',
    Texto: DOCUMENT_TYPE_MAP.PARECER.defaultTexto,
    Observacao: 'Modelo padrão da PGM estruturado com Ementa, Relatório, Fundamentação Jurídica e Conclusão (art. 53 / art. 72 da Lei 14.133/2021).',
    PalavrasChave: 'parecer juridico, pgm, licitacao, dispensa, inexigibilidade, 14133, contratacao publica, legalidade',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Secretaria Municipal de Administração / Departamento de Licitação',
    TipoDecisao: 'OPINATIVO',
    BaseLegal: 'Art. 53 e art. 72 da Lei Federal nº 14.133/2021',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 18,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-002',
    TipoDocumento: 'PARECER',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Contratos Administrativos',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Parecer Jurídico — Aditivo de Prazo e/ou Valor Contratual',
    Assunto: 'Análise jurídica de minuta de Termo Aditivo contratual (prorrogação de vigência / alteração quantitativa)',
    Texto:
      'EMENTA: DIREITO ADMINISTRATIVO. CONTRATO ADMINISTRATIVO. TERMO ADITIVO. PRORROGAÇÃO DE VIGÊNCIA / ACRÉSCIMO QUANTITATIVO. ARTS. 107, 124 E 125 DA LEI Nº 14.133/2021. REGULARIDADE CONDICIONADA.\n\nI – RELATÓRIO\n\nVersam os autos sobre solicitação de celebração do [Nº] Termo Aditivo ao Contrato Administrativo nº [CONTRATO]/[ANO], firmado com [EMPRESA], cujo objeto é [OBJETO], visando à [prorrogação do prazo de vigência por mais ___ meses / acréscimo quantitativo de ___%].\n\nII – FUNDAMENTAÇÃO JURÍDICA\n\nNos termos do art. 107 (ou arts. 124 e 125) da Lei nº 14.133/2021, a alteração contratual exige: (a) vigência ainda em curso; (b) justificativa técnica do fiscal/gestor demonstrando a vantajosidade e a regular execução; (c) previsão de recursos orçamentários; (d) manutenção das condições de habilitação fiscal, trabalhista e previdenciária da contratada; e (e) observância do limite legal de 25% em caso de acréscimo.\n\nIII – CONCLUSÃO\n\nAnte o exposto, opina-se pela viabilidade jurídica da celebração do Termo Aditivo, desde que previamente comprovadas a validade das certidões fiscais e a reserva orçamentária suficiente, com posterior publicação no PNCP e Diário Oficial.',
    Observacao: 'Aplicável a prorrogações de serviços contínuos e acréscimos/supressões contratuais sob a Nova Lei de Licitações.',
    PalavrasChave: 'parecer, aditivo, contrato, prorrogacao, acrescimo, 25%, pgm, 14133',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Departamento de Contratos / Secretaria Gestora',
    TipoDecisao: 'OPINATIVO',
    BaseLegal: 'Arts. 107, 124 e 125 da Lei Federal nº 14.133/2021',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 14,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-003',
    TipoDocumento: 'NOTA_TECNICA',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Saneamento Processual',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Nota Técnica / Cota Jurídica de Saneamento Processual (PGM)',
    Assunto: 'Cota jurídica de diligência prévia e saneamento de instrução processual',
    Texto: DOCUMENT_TYPE_MAP.NOTA_TECNICA.defaultTexto,
    Observacao: 'Ideal para devoluções rápidas às secretarias antes de emitir parecer conclusivo.',
    PalavrasChave: 'nota tecnica, cota juridica, saneamento, diligencia, pgm, instrucao',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Secretaria Consulente',
    TipoDecisao: 'SANEAMENTO',
    BaseLegal: 'Princípio da Eficiência e Legalidade (art. 37 CF/88)',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 12,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-004',
    TipoDocumento: 'PETICAO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Contencioso Judicial',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Peça Judicial — Contestação da Fazenda Pública Municipal (PGM)',
    Assunto: 'Contestação em ação judicial proposta contra o Município de Rio Claro – RJ',
    Texto: DOCUMENT_TYPE_MAP.PETICAO.defaultTexto,
    Observacao: 'Estrutura completa de defesa judicial da Fazenda Pública (art. 75, III e art. 183 do CPC).',
    PalavrasChave: 'peticao, contestacao, judicial, fazenda publica, pgm, cpc, defesa',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Juízo da Comarca de Rio Claro – RJ',
    TipoDecisao: 'CONTENCIOSO',
    BaseLegal: 'Arts. 75, III, 183 e 335 do CPC • Decreto nº 20.910/1932',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 15,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-005',
    TipoDocumento: 'PETICAO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Contencioso Judicial',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Peça Judicial — Informações em Mandado de Segurança (Lei 12.016/09)',
    Assunto: 'Prestação de Informações da Autoridade Coatora em Mandado de Segurança',
    Texto:
      'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA ÚNICA DA COMARCA DE RIO CLARO – RJ\n\nMandado de Segurança nº: [0000000-00.2026.8.19.0047]\nImpetrante: [NOME DO(A) IMPETRANTE]\nAutoridade Coatora: [CARGO DA AUTORIDADE MUNICIPAL]\n\nA AUTORIDADE APONTADA COMO COATORA, assistida pela Procuradoria-Geral do Município de Rio Claro – RJ, vem, tempestivamente, nos termos do art. 7º, inciso I, da Lei Federal nº 12.016/2009, prestar as seguintes\n\nINFORMAÇÕES\n\nI – SÍNTESE DA IMPETRAÇÃO\nTrata-se de Mandado de Segurança impetrado com o objetivo de [DESCREVER O PEDIDO LIMINAR E DEFINITIVO DO IMPETRANTE].\n\nII – PRELIMINARES (ADEQUAÇÃO DA VIA ELEITA / DECADÊNCIA)\nA via estreita do mandado de segurança exige prova pré-constituída e direito líquido e certo, não admitindo dilação probatória (art. 1º da Lei nº 12.016/2009).\n\nIII – DA LEGALIDADE ESTRITA DO ATO ADMINISTRATIVO\nO ato impugnado foi praticado em estrita observância à legislação municipal vigente e aos princípios constitucionais da Administração Pública, conforme comprovam os documentos administrativos anexos.\n\nIV – CONCLUSÃO\nDiante do exposto, requer-se o indeferimento da medida liminar (ou sua revogação) e, ao final, a DENEGAÇÃO DA SEGURANÇA, mantendo-se incólume o ato administrativo.',
    Observacao: 'Prazo legal de 10 dias previsto no art. 7º, I, da Lei nº 12.016/2009.',
    PalavrasChave: 'mandado de seguranca, informacoes, autoridade coatora, pgm, judicial, 12016',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Juízo da Comarca de Rio Claro – RJ',
    TipoDecisao: 'CONTENCIOSO',
    BaseLegal: 'Lei Federal nº 12.016/2009 (Lei do Mandado de Segurança)',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 11,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-006',
    TipoDocumento: 'NOTIFICACAO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Contratos e Sanções',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Notificação Extrajudicial — Inexecução Contratual e Defesa Prévia',
    Assunto: 'Notificação formal de descumprimento contratual com abertura de prazo de defesa prévia (Lei 14.133/2021)',
    Texto: DOCUMENT_TYPE_MAP.NOTIFICACAO.defaultTexto,
    Observacao: 'Assegura contraditório e ampla defesa prévios à aplicação de multa ou rescisão unilateral.',
    PalavrasChave: 'notificacao extrajudicial, inadimplencia, contrato, defesa previa, sancao, pgm',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Empresa Contratada / Fornecedor',
    TipoDecisao: 'SANCIONATORIO',
    BaseLegal: 'Arts. 155, 156 e 157 da Lei Federal nº 14.133/2021',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 10,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-007',
    TipoDocumento: 'RECOMENDACAO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Controle Preventivo',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Recomendação Jurídica Preventiva às Secretarias Municipais (PGM)',
    Assunto: 'Recomendação preventiva de conformidade legal e prevenção de apontamentos do TCE-RJ/MPRJ',
    Texto: DOCUMENT_TYPE_MAP.RECOMENDACAO.defaultTexto,
    Observacao: 'Instrumento formal de orientação preventiva da Procuradoria-Geral aos gestores.',
    PalavrasChave: 'recomendacao juridica, preventiva, pgm, tce, mp, conformidade, compliance',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Todas as Secretarias Municipais',
    TipoDecisao: 'PREVENTIVO',
    BaseLegal: 'Art. 37 da Constituição Federal e Lei Orgânica Municipal',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 9,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-008',
    TipoDocumento: 'CDA',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Dívida Ativa e Execução Fiscal',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Certidão de Dívida Ativa (CDA) — Crédito Tributário / Não Tributário',
    Assunto: 'Inscrição e Certidão de Dívida Ativa Municipal para cobrança administrativa, protesto ou execução fiscal',
    Texto: DOCUMENT_TYPE_MAP.CDA.defaultTexto,
    Observacao: 'Contém todos os requisitos legais obrigatórios do art. 202 do CTN e art. 2º, § 5º, da LEF.',
    PalavrasChave: 'cda, certidao divida ativa, tributario, iptu, iss, execucao fiscal, lef, pgm',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM) / Finanças',
    SetorDestino: 'Contribuinte / Cartório de Protesto / Juízo Fiscal',
    TipoDecisao: 'EXECUTIVO',
    BaseLegal: 'Art. 202 do CTN e Lei Federal nº 6.830/1980 (LEF)',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 10,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-009',
    TipoDocumento: 'CONTRATO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Licitações e Contratos',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Minuta de Contrato Administrativo Padrão (Lei nº 14.133/2021)',
    Assunto: 'Minuta de Contrato Administrativo para aquisição de bens ou prestação de serviços',
    Texto: DOCUMENT_TYPE_MAP.CONTRATO.defaultTexto,
    Observacao: 'Estruturado com as cláusulas necessárias do art. 92 da Lei nº 14.133/2021.',
    PalavrasChave: 'contrato administrativo, minuta, clausulas, 14133, aditivo, pgm, licitacao',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Departamento de Contratos / Empresa Contratada',
    TipoDecisao: 'CONTRATUAL',
    BaseLegal: 'Art. 92 da Lei Federal nº 14.133/2021',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 13,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-010',
    TipoDocumento: 'PROCURACAO',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Representação Judicial',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Procuração Ad Judicia et Extra / Substabelecimento / Preposição (PGM)',
    Assunto: 'Outorga de poderes judiciais e extrajudiciais ou designação de preposto municipal',
    Texto: DOCUMENT_TYPE_MAP.PROCURACAO.defaultTexto,
    Observacao: 'Utilizável para procuradores, assessores jurídicos e prepostos em audiências.',
    PalavrasChave: 'procuracao, substabelecimento, preposto, audiencia, mandato, pgm, cpc',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Juízos, Tribunais e Órgãos Públicos',
    TipoDecisao: 'REPRESENTACAO',
    BaseLegal: 'Art. 75, III e art. 105 do Código de Processo Civil',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 8,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'PGM-011',
    TipoDocumento: 'CHECKLIST',
    Area: 'Procuradoria-Geral do Município (PGM)',
    SubArea: 'Licitações e Contratos',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Checklist Jurídico de Instrução Processual — Lei nº 14.133/2021',
    Assunto: 'Lista de verificação documental prévia para envio de processos de contratação à PGM',
    Texto: DOCUMENT_TYPE_MAP.CHECKLIST.defaultTexto,
    Observacao: 'Agiliza a conferência prévia nas secretarias e reduz devoluções em cota jurídica.',
    PalavrasChave: 'checklist, saneamento, conferencia, 14133, licitacao, pgm, dfd, etp, tr',
    SetorOrigem: 'Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Secretarias Municipais / Departamento de Compras e Licitação',
    TipoDecisao: 'VERIFICACAO',
    BaseLegal: 'Arts. 18, 23, 53 e 72 da Lei Federal nº 14.133/2021',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 11,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'ADM-001',
    TipoDocumento: 'PROJETO_LEI',
    Area: 'Gabinete e Legislação',
    SubArea: 'Processo Legislativo',
    Categoria: '9. Procuradoria-Geral (PGM) — Consultivo e Contencioso',
    Titulo: 'Projeto de Lei Municipal + Mensagem de Encaminhamento à Câmara',
    Assunto: 'Minuta de Projeto de Lei Ordinária com Mensagem Justificativa à Câmara Municipal',
    Texto: DOCUMENT_TYPE_MAP.PROJETO_LEI.defaultTexto,
    Observacao: 'Formatação legislativa conforme LC Federal nº 95/1998 com espaço para Mensagem e impacto LRF.',
    PalavrasChave: 'projeto de lei, mensagem, camara municipal, legislativo, lc 95, pgm, gabinete',
    SetorOrigem: 'Gabinete do Prefeito / Procuradoria-Geral do Município (PGM)',
    SetorDestino: 'Câmara Municipal de Rio Claro – RJ',
    TipoDecisao: 'NORMATIVO',
    BaseLegal: 'Lei Orgânica Municipal e Lei Complementar Federal nº 95/1998',
    Prioridade: 'ALTA',
    Favorito: false,
    UsoFrequente: 9,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'ADM-002',
    TipoDocumento: 'CERTIDAO',
    Area: 'Administração Geral',
    SubArea: 'Fé Pública e Assentamentos',
    Categoria: '1. Recursos Humanos',
    Titulo: 'Certidão Administrativa / Funcional / Inteiro Teor',
    Assunto: 'Emissão de certidão oficial baseada nos assentamentos administrativos municipais',
    Texto: DOCUMENT_TYPE_MAP.CERTIDAO.defaultTexto,
    Observacao: 'Adaptável para tempo de serviço, publicação em Diário Oficial ou decurso de prazo processual.',
    PalavrasChave: 'certidao, funcional, publicacao, inteiro teor, decurso de prazo, rh, administracao',
    SetorOrigem: 'Secretaria Municipal de Administração (SMA)',
    SetorDestino: 'Interessado(a) / Autos do Processo',
    TipoDecisao: 'CERTIFICATORIO',
    BaseLegal: 'Art. 5º, XXXIV, "b" da Constituição Federal',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 10,
    Versao: '1.0',
    Ativo: true
  },
  {
    ID: 'ADM-003',
    TipoDocumento: 'ATA',
    Area: 'Administração Geral',
    SubArea: 'Reuniões e Colegiados',
    Categoria: '1. Recursos Humanos',
    Titulo: 'Ata de Reunião Administrativa / Conselho / Audiência Pública',
    Assunto: 'Registro formal de pauta, presenças e deliberações de reunião institucional',
    Texto: DOCUMENT_TYPE_MAP.ATA.defaultTexto,
    Observacao: 'Modelo padronizado com abertura, presenças, deliberações numeradas e encerramento.',
    PalavrasChave: 'ata, reuniao, conselho, audiencia, deliberacao, colegiado',
    SetorOrigem: 'Secretaria Municipal de Administração (SMA)',
    SetorDestino: 'Participantes e Arquivo Oficial',
    TipoDecisao: 'REGISTRO',
    BaseLegal: 'Normas de Documentação Administrativa Municipal',
    Prioridade: 'NORMAL',
    Favorito: false,
    UsoFrequente: 8,
    Versao: '1.0',
    Ativo: true
  }
];

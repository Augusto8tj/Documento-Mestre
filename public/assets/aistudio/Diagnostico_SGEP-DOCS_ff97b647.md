# SGEP-DOCS — Diagnóstico técnico e plano de evolução
Arquivo analisado: `Banco_Despachos_Online_8.html` (≈400 KB, ~3.230 linhas, 1 bloco `<script>` de ~2.050 linhas, ~90 funções globais).

## 1. Diagnóstico resumido

### Pontos fortes
- Arquivo único realmente autônomo, com base embutida (`masterData`) e histórico de numeração de exemplo.
- Fluxo de numeração bem pensado (reserva no Apps Script, registro de usuário/destinatário/assunto, datalists que "aprendem").
- Sanitização consistente (`sanitizeHTML` / `sanitizeAttribute`) em quase todo `innerHTML` dinâmico.
- Redator com 5 tipos, prévia A4 e assistente de IA já funcionando.

### Divergências entre o briefing e o código real (importantes)
| Briefing diz | O que o arquivo realmente tem |
|---|---|
| `@media print` para A4 timbrado | **Não existe nenhuma regra `@media print` nem `@page`.** O botão chama `window.print()` e imprime o app inteiro; a classe `.no-print` não tem CSS. |
| "Baixar DOCX" | **Não existe** função nem botão de exportação Word. |
| Esc fecha os modais | O handler usa IDs inexistentes (`redator-modal`, `model-modal`, `admin-modal`); o Redator e o modal CRUD **nunca fecham com Esc**. |
| Fallback offline sempre ativo | Em falha de rede, `carregarDadosDaNuvem` **apaga a tela e mostra erro**, mesmo havendo `masterData` embutido. |

### As 5 oportunidades de maior impacto
1. **Segurança do login (crítico):** credenciais fixas no código (`1001/123`, `1001/admin123`, `admin/admin`, `2002/123`) valem como login offline para qualquer pessoa que abrir o HTML, e há botões "Acesso Rápido" com elas na tela de login. O `nivel: "ADMIN"` fica em `localStorage` e pode ser editado pelo usuário, então **o Apps Script precisa validar o nível em toda ação administrativa**.
2. **Impressão/Word inexistentes ou quebrados:** sem CSS de impressão o timbrado sai com o app em volta; sem exportação Word.
3. **Offline incompleto:** além do fallback de dados, **Tailwind, FontAwesome e Inter vêm de CDN** — sem internet a tela perde todo o estilo. Também há referências que dão 404 fora do AI Studio (`/manifest.json`, `/pwa-192x192.png`, `/_aistudio-iframe.js`).
4. **Lacunas na planilha mestra:** `gerarNumeroNoRedator` assume `"Documento Oficial MEMORANDO"` / `"Prefeitura Municipal"` quando os campos estão vazios; `gerarNumeroAPI` usa `"Sem Assunto"` / `"Não informado"`. Esses valores caem no Livro de Numeração. Além disso, não há `requestId`: um timeout ambíguo seguido de novo clique pode **queimar dois números**.
5. **Perda de trabalho:** nenhum rascunho; fechar o modal ou recarregar apaga o texto — e um número já reservado fica "órfão".

## 2. Plano implementado (testado)

O patch é **aditivo**: roda num segundo `<script>` ao final do `<body>` e redefine funções legadas (as chamadas `onclick="..."` continuam valendo). Nada de build, nada de arquivos externos. Tudo fica sob o namespace `window.SGEP`.

| Frente | O que entrega | Onde |
|---|---|---|
| A. Estado/reatividade | `SGEP.createStore` (Proxy, ~12 linhas); `SGEP.form` espelha o formulário do Redator; `SGEP.status` controla online/offline | §1, §6 do JS |
| A. Rede | Timeout (20 s leitura / 30 s escrita), 2 retries com backoff **só em GET**; POST nunca é repetido; `requestId` enviado em `GERAR_NUMERO`. Aplicado por interceptação de `fetch` apenas para `API_URL` | §2 |
| A. Offline | `carregarDadosDaNuvem` reescrita: falhou → cache `localStorage` → base embutida, com faixa "Modo offline"; reconecta e ressincroniza sozinha no evento `online` | §3 |
| A/segurança | Login sem credenciais fixas; offline só para quem já entrou online naquele computador (hash SHA-256 com `crypto.subtle`); botões de demo removidos (`SGEP.config.HIDE_DEMO_LOGIN`) | §4 |
| B. Rascunhos | Autosave 800 ms por usuário e por tipo, até 8 versões, banner "Restaurar / Descartar / Versões"; **restaura inclusive o número já reservado** | §7 |
| B. Conformidade | Número exige destinatário (≥3) e assunto (≥5); emissão exige texto (≥20), signatário, cargo, secretaria e confirma se sobraram `[CAMPOS]`; erros em `role="alert"` com `aria-invalid`; trava contra duplo clique; mesma validação no modal de variáveis | §8, §9 |
| B. Livro | Busca sem acento e multi-termo | §11 |
| B. a11y | `role="dialog"`, `aria-modal`, foco inicial/retorno, *focus trap*, Esc fecha o modal do topo (corrige IDs), `aria-live` no toast, `aria-label` nos botões só com ícone, foco visível | §12 |
| C. Folha A4 | Folha 21 cm × 29,7 cm com margens ABNT (3/2/2/3 cm) na prévia; `@page` e `@media print` que imprimem **somente** a folha; folha continua branca no modo noturno | CSS |
| C. Texto rico | `**negrito**`, `*itálico*`, `- marcador` + barra N/I/Lista e Ctrl+B/I; renderizador seguro (escapa HTML **antes** de formatar); `[CAMPOS]` pendentes destacados na prévia | §5 |
| C. Word | Botão **Baixar Word**: `.doc` em MHTML com brasão embutido, timbre, assinatura e rodapé com paginação; "Copiar texto formatado" cola com formatação no Word/Outlook; `mailto:` usa texto limpo | §10 |

## 3. Onde inserir (se preferir aplicar manualmente)
1. **CSS:** cole `sgep_patch.css` imediatamente antes de `</style>` (linha ~94).
2. **JS:** crie um novo `<script> … </script>` com o conteúdo de `sgep_patch.js` logo antes de `</body>` (depois do bloco que termina na linha ~3229). Precisa vir **depois** do script principal.
3. **Limpeza opcional no `<head>`:** remova `<script src="/_aistudio-iframe.js…">` e os `<link>` para `/manifest.json`, `/apple-touch-icon.png`, `/pwa-*.png`, `/icon.svg`, `/favicon.ico` (404 fora do AI Studio). Os blocos de PWA no fim do script também só fazem sentido com HTTPS e arquivos reais.

O arquivo já pronto é `Banco_Despachos_Online_9_patch.html`.

## 4. Mudança necessária no Google Apps Script (idempotência)
O front agora envia `requestId`. Para que um reenvio não gaste outro número, no `doPost`, na ação `GERAR_NUMERO`:

```javascript
// Dentro do case "GERAR_NUMERO", ANTES de reservar o número:
const lock = LockService.getScriptLock();
lock.waitLock(20000);
try {
  const cache = CacheService.getScriptCache();
  const jaFeito = req.requestId && cache.get('req_' + req.requestId);
  if (jaFeito) return ContentService.createTextOutput(jaFeito).setMimeType(ContentService.MimeType.JSON);

  const resposta = JSON.stringify(reservarProximoNumero_(req));   // sua lógica atual
  if (req.requestId) cache.put('req_' + req.requestId, resposta, 21600); // 6 h
  return ContentService.createTextOutput(resposta).setMimeType(ContentService.MimeType.JSON);
} finally { lock.releaseLock(); }
```
Valide também no servidor o `nivel` do usuário em `SALVAR_MODELO`/ações administrativas (não confie no que o navegador envia).

## 5. Resultados dos testes e limites (seja cético aqui)
**Testado em jsdom (Node 22), 18 verificações passando:** carregamento sem erros do patch; escape de XSS no texto rico; validação bloqueando campos vazios; prévia rica; autosave, restauração de rascunho; Esc; fallback offline com a base embutida; faixa offline.

**Não testado / precisa de olho humano:**
- **Word real:** o `.doc` MHTML é o método clássico e abre no Word, mas não tenho Word aqui. Renderizei o HTML interno no LibreOffice (corpo, brasão, assinatura e rodapé OK; o LibreOffice não lê o formato MIME em si, nem os cabeçalhos `mso-element`). Por isso o padrão é `WORD_HEADER_IN_BODY: true` (timbre no topo do corpo, que funciona em qualquer Word). Teste com `false` se quiser cabeçalho real na 1ª página, e confira o rodapé com número de página.
- **Impressão física/PDF no Chrome e Edge:** as regras `@page`/`@media print` seguem o padrão, mas confirme as margens no seu navegador (desative "Cabeçalhos e rodapés" na caixa de impressão).
- **Navegador:** não rodei em Chrome/Firefox/Safari reais; nada exótico foi usado (Proxy, AbortController, `crypto.subtle`, ClipboardItem; o Safari mais antigo pode copiar sem formatação, e o código cai em texto simples).
- **`crypto.subtle` em `file://`:** funciona em contexto seguro; se o navegador não oferecer, o login offline simplesmente fica indisponível (não há fallback inseguro).

## 6. Próximos passos recomendados (não incluídos no patch)
1. **Offline de verdade:** gerar uma vez o CSS do Tailwind (CLI, na sua máquina) e colá-lo num `<style>`; trocar FontAwesome por um subconjunto de SVG inline; usar a pilha `system-ui` no lugar de Inter. Isso não cria "build" para o usuário final.
2. **`.docx` nativo:** o Word abre o `.doc` HTML, mas um `.docx` real exige ZIP/OOXML; dá para embutir um gerador mínimo (~150 linhas) ou a biblioteca `docx` inline. Vale se o RH precisar de campos/estilos editáveis rigorosos.
3. **Refatoração gradual:** mover as ~90 funções globais para `SGEP.modules.*` (auth, data, redator, livro, ui) à medida que forem tocadas, mantendo *aliases* globais para os `onclick` até migrá-los para `addEventListener`.
4. **Sessão:** expiração (ex.: 12 h) e token de sessão emitido pelo Apps Script, em vez de objeto de usuário em `localStorage`.
5. **Senhas:** o servidor deve armazenar hash+sal (nunca texto puro na planilha) e a exigência mínima de 3 caracteres para senha deveria subir.

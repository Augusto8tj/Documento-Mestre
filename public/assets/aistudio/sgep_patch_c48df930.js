/* =====================================================================
 * SGEP PATCH v1 — carregado DEPOIS do script principal.
 * Tudo vive no namespace window.SGEP; funções legadas são substituídas
 * por redefinição (as chamadas onclick="..." existentes continuam valendo).
 * ===================================================================== */
(function () {
    'use strict';
    const SGEP = window.SGEP = window.SGEP || {};
    const $ = (id) => document.getElementById(id);
    const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const esc = (s) => sanitizeHTML(s);   // reaproveita o sanitizador existente

    SGEP.config = {
        WORD_HEADER_IN_BODY: true,    // true = timbre no topo do corpo (funciona em qualquer Word); false = cabeçalho real da 1ª página
        HIDE_DEMO_LOGIN: true,        // remove botões "Acesso Rápido" com credenciais de teste
        TIMEOUT_READ_MS: 20000, TIMEOUT_WRITE_MS: 30000, READ_RETRIES: 2,
        DRAFT_DEBOUNCE_MS: 800, DRAFT_MAX_VERSIONS: 8
    };

    /* ============ 1. STORE REATIVO MÍNIMO (Proxy) ============ */
    SGEP.createStore = function (initial) {
        const subs = new Set();
        const state = new Proxy({ ...initial }, {
            set(t, k, v) {
                if (t[k] === v) return true;
                const old = t[k]; t[k] = v;
                subs.forEach(fn => { try { fn(k, v, old, t); } catch (e) { console.error('[SGEP.store]', e); } });
                return true;
            }
        });
        return { state, subscribe(fn) { subs.add(fn); return () => subs.delete(fn); } };
    };

    /* ============ 2. REDE: timeout + retry (só leituras) ============ */
    SGEP.net = {
        async fetchTimeout(input, init = {}, { timeout = 20000, retries = 0, backoff = 800 } = {}) {
            let lastErr;
            for (let i = 0; i <= retries; i++) {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), timeout);
                try {
                    const resp = await SGEP.net._fetch(input, { ...init, signal: ctrl.signal });
                    clearTimeout(timer);
                    if (resp.status >= 500 && i < retries) throw new Error('HTTP ' + resp.status);
                    return resp;
                } catch (err) {
                    clearTimeout(timer);
                    lastErr = err.name === 'AbortError'
                        ? new Error('O servidor demorou demais para responder. Verifique a conexão.') : err;
                    if (i < retries) await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
                }
            }
            throw lastErr;
        },
        uuid() { return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2)); }
    };
    SGEP.net._fetch = window.fetch.bind(window);
    // Intercepta SOMENTE chamadas à API do Apps Script: todo o código legado ganha timeout sem reescrita.
    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if (!url.startsWith(API_URL)) return SGEP.net._fetch(input, init);
        const isRead = ((init && init.method) || 'GET').toUpperCase() === 'GET';
        // POST nunca é repetido automaticamente (evita gastar 2 números por timeout ambíguo).
        return SGEP.net.fetchTimeout(input, init || {}, {
            timeout: isRead ? SGEP.config.TIMEOUT_READ_MS : SGEP.config.TIMEOUT_WRITE_MS,
            retries: isRead ? SGEP.config.READ_RETRIES : 0
        });
    };

    /* ============ 3. ESTADO DE CONEXÃO + CACHE OFFLINE ============ */
    SGEP.status = SGEP.createStore({ mode: navigator.onLine ? 'online' : 'offline', lastSync: null });
    SGEP.cache = {
        KEY: 'sgep_cache_v1',
        save() {
            try {
                localStorage.setItem(this.KEY, JSON.stringify({
                    ts: Date.now(), masterData, sugestoes: currentSugestoes, historico: historicoNumeracao
                }));
            } catch (e) { console.warn('[SGEP.cache] sem espaço no localStorage', e); }
        },
        load() { try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { return null; } }
    };
    function ensureBanner() {
        let b = $('sgep-net-banner');
        if (!b) {
            b = document.createElement('div'); b.id = 'sgep-net-banner';
            b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'polite');
            document.body.prepend(b);
        }
        return b;
    }
    SGEP.status.subscribe((k, v) => {
        if (k !== 'mode') return;
        const b = ensureBanner();
        b.textContent = v === 'offline'
            ? 'Modo offline: usando a base local. A reserva de números oficiais exige conexão.' : '';
        b.classList.toggle('on', v === 'offline');
    });
    window.addEventListener('offline', () => { SGEP.status.state.mode = 'offline'; });
    window.addEventListener('online', () => {
        SGEP.status.state.mode = 'online';
        if (typeof currentUser !== 'undefined' && currentUser) carregarDadosDaNuvem();
    });

    function aplicarDados(d) {
        if (Array.isArray(d.masterData) && d.masterData.length) masterData = d.masterData;
        if (d.sugestoes) {
            currentSugestoes = { destinatarios: d.sugestoes.destinatarios || [], assuntos: d.sugestoes.assuntos || [] };
            atualizarDatalistsDOM(currentSugestoes);
        }
        if (Array.isArray(d.historico) && d.historico.length) {
            historicoNumeracao = d.historico; atualizarComboNumeracaoDOM(historicoNumeracao);
        }
        updateDashboardStats(); renderTypeFilters(); renderSidebarCategories(); renderContent();
    }

    // Substitui a versão legada: em caso de falha NÃO apaga a tela; cai para cache -> base embutida.
    window.carregarDadosDaNuvem = async function () {
        const syncIcon = $('sync-icon'); if (syncIcon) syncIcon.classList.add('fa-spin');
        try {
            const resp = await fetch(`${API_URL}?t=${Date.now()}`);
            const result = await resp.json();
            if (!result.success) throw new Error(result.error || 'Falha na resposta do servidor');
            if (result.data) masterData = result.data;
            aplicarDados({
                sugestoes: result.sugestoes,
                historico: result.registrosNumeracao
            });
            SGEP.cache.save();
            SGEP.status.state.mode = 'online'; SGEP.status.state.lastSync = Date.now();
            showToast('Dados sincronizados com a planilha oficial.');
        } catch (err) {
            console.warn('[SGEP] Sincronização falhou, usando base local:', err);
            const c = SGEP.cache.load();
            if (c) aplicarDados({ masterData: c.masterData, sugestoes: c.sugestoes, historico: c.historico });
            else aplicarDados({});                       // base embutida (BASE_DE_CONHECIMENTO)
            SGEP.status.state.mode = 'offline';
            const quando = c ? new Date(c.ts).toLocaleString('pt-BR') : 'base embutida';
            showToast('Sem conexão com a planilha. Usando dados locais (' + quando + ').', true);
        } finally {
            if (syncIcon) syncIcon.classList.remove('fa-spin');
        }
    };

    /* ============ 4. LOGIN: sem credenciais fixas no código ============ */
    SGEP.auth = {
        async hash(mat, sen) {
            if (!(window.crypto && crypto.subtle)) return null;
            const salt = 'sgep-rioclaro-v1';
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}|${mat}|${sen}`));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        },
        async remember(mat, sen, user) {           // só após login ONLINE bem-sucedido
            const h = await this.hash(mat, sen); if (!h) return;
            try { localStorage.setItem('sgep_offline_cred_' + mat, JSON.stringify({ h, user })); } catch (e) {}
        },
        async verifyOffline(mat, sen) {            // só funciona para quem já logou neste computador
            const h = await this.hash(mat, sen);
            try {
                const rec = JSON.parse(localStorage.getItem('sgep_offline_cred_' + mat) || 'null');
                return rec && h && rec.h === h ? rec.user : null;
            } catch (e) { return null; }
        }
    };
    window.realizarLogin = async function (e) {
        e.preventDefault();
        const btn = $('btn-login'), errEl = $('login-error');
        const mat = $('login-matricula').value.trim(), sen = $('login-senha').value.trim();
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Autenticando...</span>';
        btn.disabled = true; errEl.classList.add('hidden');
        const entrar = (user, sufixo) => {
            currentUser = user; localStorage.setItem('sgep_user_session', JSON.stringify(user));
            liberarInterface(user); showToast(`Bem-vindo(a), ${user.nome}!${sufixo || ''}`);
        };
        try {
            const resp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'LOGIN', matricula: mat, senha: sen }) });
            const result = JSON.parse(await resp.text());
            if (result.success && result.usuario) {
                await SGEP.auth.remember(mat, sen, result.usuario);
                entrar(result.usuario); carregarDadosDaNuvem();
            } else {
                const de = new Error(result.error || 'Matrícula ou senha incorretos.'); de.definitive = true; throw de;
            }
        } catch (err) {
            const u = err.definitive ? null : await SGEP.auth.verifyOffline(mat, sen);
            if (u) { entrar(u, ' (Modo Offline)'); aplicarDados({ ...(SGEP.cache.load() || {}) }); SGEP.status.state.mode = 'offline'; }
            else { errEl.textContent = err.message || 'Erro de conexão com o servidor.'; errEl.classList.remove('hidden'); }
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Entrar no Sistema</span>'; btn.disabled = false;
        }
    };
    if (SGEP.config.HIDE_DEMO_LOGIN) {
        document.querySelectorAll('[onclick^="preencherLogin"]').forEach(b => {
            const box = b.closest('.border-t'); if (box) box.remove(); else b.remove();
        });
    }

    /* ============ 5. TEXTO RICO SEGURO (**negrito**, *itálico*, "- " marcador) ============ */
    SGEP.rich = {
        inline(s, o) {
            let h = esc(s)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
            if (o.highlight) h = h.replace(/\[([^\]\n]+)\]/g, '<span class="highlight-bracket">[$1]</span>');
            return h;
        },
        toHTML(text, o = {}) {
            const P = o.word ? ' style="margin:0 0 8pt 0;text-align:justify;text-indent:1.25cm;line-height:150%"' : '';
            const UL = o.word ? ' style="margin:0 0 8pt 1.25cm"' : '';
            const out = []; let para = [], list = [];
            const flushP = () => { if (para.length) { out.push(`<p${P}>${para.join('<br>')}</p>`); para = []; } };
            const flushL = () => { if (list.length) { out.push(`<ul${UL}>${list.join('')}</ul>`); list = []; } };
            String(text || '').replace(/\r/g, '').split('\n').forEach(line => {
                const m = line.match(/^\s*[-•]\s+(.*)$/);
                if (m) { flushP(); list.push(`<li>${this.inline(m[1], o)}</li>`); }
                else if (!line.trim()) { flushP(); flushL(); }
                else { flushL(); para.push(this.inline(line.trim(), o)); }
            });
            flushP(); flushL();
            return out.join('');
        },
        toPlain(text) {
            return String(text || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1$2')
                .replace(/^\s*-\s+/gm, '• ');
        }
    };
    function wrapSelection(ta, before, after) {
        const s = ta.selectionStart, e = ta.selectionEnd;
        ta.setRangeText(before + (ta.value.slice(s, e) || 'texto') + after, s, e, 'select');
        ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
    }
    function bulletSelection(ta) {
        const s = ta.selectionStart, e = ta.selectionEnd;
        const ini = ta.value.lastIndexOf('\n', s - 1) + 1;
        const bloco = ta.value.slice(ini, e).split('\n').map(l => (/^\s*-\s/.test(l) ? l : '- ' + l)).join('\n');
        ta.setRangeText(bloco, ini, e, 'end');
        ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus();
    }
    function montarToolbar() {
        const ta = $('redator-texto'); if (!ta || $('sgep-toolbar')) return;
        const tb = document.createElement('div');
        tb.id = 'sgep-toolbar'; tb.className = 'sgep-toolbar'; tb.setAttribute('role', 'toolbar');
        tb.setAttribute('aria-label', 'Formatação do texto');
        tb.innerHTML =
            '<button type="button" data-f="b" aria-label="Negrito (Ctrl+B)" title="Negrito (Ctrl+B)"><b>N</b></button>' +
            '<button type="button" data-f="i" aria-label="Itálico (Ctrl+I)" title="Itálico (Ctrl+I)"><i>I</i></button>' +
            '<button type="button" data-f="l" aria-label="Lista com marcadores" title="Lista com marcadores">• Lista</button>';
        tb.addEventListener('click', (ev) => {
            const f = ev.target.closest('button'); if (!f) return;
            const k = f.getAttribute('data-f');
            if (k === 'b') wrapSelection(ta, '**', '**'); else if (k === 'i') wrapSelection(ta, '*', '*'); else bulletSelection(ta);
        });
        ta.addEventListener('keydown', (ev) => {
            if (!(ev.ctrlKey || ev.metaKey)) return;
            const k = ev.key.toLowerCase();
            if (k === 'b') { ev.preventDefault(); wrapSelection(ta, '**', '**'); }
            if (k === 'i') { ev.preventDefault(); wrapSelection(ta, '*', '*'); }
        });
        ta.parentElement.insertBefore(tb, ta);
    }

    /* ============ 6. FORMULÁRIO DO REDATOR (store ⇄ DOM) ============ */
    const CAMPOS = { destinatario: 'redator-destinatario', assunto: 'redator-assunto', texto: 'redator-texto',
        fecho: 'redator-fecho', signatario: 'redator-signatario', cargo: 'redator-cargo',
        secretaria: 'redator-secretaria', cc: 'redator-email-cc', referencia: 'redator-referencia-combo' };
    SGEP.form = SGEP.createStore(Object.fromEntries(Object.keys(CAMPOS).map(k => [k, ''])));
    SGEP.form.pull = function () {
        Object.entries(CAMPOS).forEach(([k, id]) => { const el = $(id); this.state[k] = el ? String(el.value || '').trim() : ''; });
        return { ...this.state };
    };
    SGEP.form.push = function (data) {
        Object.entries(CAMPOS).forEach(([k, id]) => {
            const el = $(id); if (!el || data[k] === undefined) return;
            if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === data[k])) return;
            el.value = data[k];
        });
        atualizarPreviaRedator();
    };

    /* ============ 7. RASCUNHOS + VERSÕES (localStorage, por usuário) ============ */
    SGEP.drafts = {
        dirty: false, timer: null,
        key() { return 'sgep_drafts_v1:' + ((typeof currentUser !== 'undefined' && currentUser && currentUser.matricula) || 'anon'); },
        readAll() { try { return JSON.parse(localStorage.getItem(this.key()) || '{}'); } catch (e) { return {}; } },
        writeAll(o) { try { localStorage.setItem(this.key(), JSON.stringify(o)); return true; } catch (e) { return false; } },
        schedule() {
            if (!this.dirty) return;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.save(), SGEP.config.DRAFT_DEBOUNCE_MS);
        },
        save() {
            const f = SGEP.form.pull(); if (!f.texto && !f.assunto) return;
            const all = this.readAll(), slot = all[redatorTipo] || { versions: [] }, now = Date.now();
            const snap = { ...f, numero: redatorNumeroGerado || '', ts: now };
            const last = slot.versions[slot.versions.length - 1];
            if (!last || now - last.ts > 60000 || Math.abs((last.texto || '').length - f.texto.length) >= 80) slot.versions.push(snap);
            else slot.versions[slot.versions.length - 1] = snap;
            slot.versions = slot.versions.slice(-SGEP.config.DRAFT_MAX_VERSIONS);
            slot.current = snap; all[redatorTipo] = slot;
            this.writeAll(all);
        },
        clear(tipo) { const all = this.readAll(); delete all[tipo || redatorTipo]; this.writeAll(all); this.hideBanner(); },
        hideBanner() { const b = $('sgep-draft-banner'); if (b) b.remove(); },
        restore(snap) {
            SGEP.form.push(snap);
            if (snap.numero) { redatorNumeroGerado = snap.numero; renderBotaoGerarNumeroRedator(); atualizarPreviaRedator(); }
            this.dirty = true; this.hideBanner(); showToast('Rascunho restaurado.');
        },
        offer() {
            this.hideBanner();
            const slot = this.readAll()[redatorTipo]; if (!slot || !slot.current) return;
            const ta = $('redator-texto'); if (!ta) return;
            const b = document.createElement('div');
            b.id = 'sgep-draft-banner'; b.className = 'sgep-box sgep-box--warn'; b.setAttribute('role', 'status');
            const quando = new Date(slot.current.ts).toLocaleString('pt-BR');
            const opts = slot.versions.map((v, i) => `<option value="${i}">${new Date(v.ts).toLocaleString('pt-BR')} (${(v.texto || '').length} car.)</option>`).reverse().join('');
            b.innerHTML = `<strong>Rascunho encontrado</strong> (${esc(quando)}${slot.current.numero ? ' • nº ' + esc(slot.current.numero) + ' já reservado' : ''}). ` +
                `<button type="button" data-a="r">Restaurar</button><button type="button" data-a="d">Descartar</button>` +
                `<label>Versões: <select data-a="v" aria-label="Versões anteriores">${opts}</select></label><button type="button" data-a="rv">Restaurar versão</button>`;
            b.addEventListener('click', (ev) => {
                const a = ev.target.getAttribute && ev.target.getAttribute('data-a');
                if (a === 'r') this.restore(slot.current);
                else if (a === 'd') this.clear(redatorTipo);
                else if (a === 'rv') this.restore(slot.versions[+b.querySelector('select').value]);
            });
            const ref = $('sgep-toolbar') || ta; ref.parentElement.insertBefore(b, ref);
        }
    };

    /* ============ 8. VALIDAÇÃO DE CONFORMIDADE ============ */
    SGEP.validar = {
        PLACEHOLDER: /\[[^\]\n]{1,60}\]/g,
        regras: {
            numero: [
                ['destinatario', 3, 'Informe o destinatário (mín. 3 caracteres).', 'redator-destinatario'],
                ['assunto', 5, 'Informe o assunto (mín. 5 caracteres).', 'redator-assunto']
            ],
            emissao: [
                ['destinatario', 3, 'Informe o destinatário.', 'redator-destinatario'],
                ['assunto', 5, 'Informe o assunto.', 'redator-assunto'],
                ['texto', 20, 'O corpo do documento está vazio ou muito curto.', 'redator-texto'],
                ['signatario', 3, 'Informe o signatário.', 'redator-signatario'],
                ['cargo', 3, 'Informe o cargo do signatário.', 'redator-cargo'],
                ['secretaria', 3, 'Informe a secretaria/órgão.', 'redator-secretaria']
            ]
        },
        mostrar(erros) {
            let box = $('sgep-val-box'); if (box) box.remove();
            if (!erros.length) return;
            box = document.createElement('div'); box.id = 'sgep-val-box'; box.className = 'sgep-box sgep-box--err'; box.setAttribute('role', 'alert');
            box.innerHTML = '<strong>Corrija antes de continuar:</strong><ul style="list-style:disc;margin-left:1.2rem">' +
                erros.map(e => `<li>${esc(e.msg)}</li>`).join('') + '</ul>';
            const ta = $('redator-texto'); ta.parentElement.insertBefore(box, ta.parentElement.firstChild);
            const first = $(erros[0].id); if (first) first.focus();
        },
        run(modo) {
            const f = SGEP.form.pull(), erros = [];
            Object.values(CAMPOS).forEach(id => { const el = $(id); if (el) el.removeAttribute('aria-invalid'); });
            this.regras[modo].forEach(([campo, min, msg, id]) => {
                if ((f[campo] || '').length < min) { erros.push({ msg, id }); const el = $(id); if (el) el.setAttribute('aria-invalid', 'true'); }
            });
            this.mostrar(erros);
            if (erros.length) { showToast(erros[0].msg, true); return false; }
            if (modo === 'emissao') {
                const pend = (f.texto.match(this.PLACEHOLDER) || []);
                if (pend.length && !confirm(`Ainda há ${pend.length} campo(s) entre colchetes no texto (ex.: ${pend[0]}). Emitir mesmo assim?`)) return false;
            }
            return true;
        }
    };

    /* ============ 9. FLUXO DE NUMERAÇÃO (reescrito, com validação e trava) ============ */
    let reservando = false;
    window.gerarNumeroNoRedator = async function () {
        if (reservando) return;
        if (!SGEP.validar.run('numero')) return;
        if (SGEP.status.state.mode === 'offline' && !navigator.onLine) {
            showToast('Sem internet: não é possível reservar número oficial agora. Seu rascunho está salvo.', true); return;
        }
        reservando = true;
        const btn = $('btn-redator-gerar-num');
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Reservando...</span>'; btn.disabled = true; }
        const f = SGEP.form.pull(), usuario = (currentUser && currentUser.nome) || 'Servidor Municipal';
        try {
            const resp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'GERAR_NUMERO', requestId: SGEP.net.uuid(), tipoDocumento: redatorTipo,
                    assunto: f.assunto, destinatario: f.destinatario, usuarioLogado: usuario }) });
            const result = JSON.parse(await resp.text());
            if (!(result.success && result.numeroGerado)) throw new Error(result.error || 'Não foi possível obter o próximo número.');
            redatorNumeroGerado = result.numeroGerado; renderBotaoGerarNumeroRedator();
            historicoNumeracao.unshift({ dataHora: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                tipoDocumento: redatorTipo, numero: result.numeroGerado, assunto: f.assunto, usuario, destinatario: f.destinatario });
            atualizarComboNumeracaoDOM(historicoNumeracao); incorporarNovoDestinatarioEAssunto(f.destinatario, f.assunto);
            SGEP.drafts.dirty = true; SGEP.drafts.save();       // grava o nº reservado no rascunho
            atualizarPreviaRedator(); showToast(`Número ${result.numeroGerado} gerado e gravado com sucesso!`);
        } catch (err) {
            showToast((err.message || 'Erro ao conectar ao servidor.') + ' Confira o Livro de Numeração antes de tentar de novo.', true);
            if (btn) { btn.innerHTML = '<i class="fa-solid fa-list-ol"></i><span>Gerar e Reservar Número Agora</span>'; btn.disabled = false; }
        } finally { reservando = false; }
    };

    const _gerarNumeroAPI = window.gerarNumeroAPI;       // geração a partir do modal de variáveis
    window.gerarNumeroAPI = function (cleanName, tipo) {
        let ass = '', dest = '';
        document.querySelectorAll('.var-input').forEach(i => {
            const n = norm(i.getAttribute('data-var') || '');
            if (n.includes('assunto')) ass = i.value.trim(); if (n.includes('destinatario')) dest = i.value.trim();
        });
        if (ass.length < 5 || dest.length < 3) { showToast('Preencha Assunto e Destinatário antes de reservar o número.', true); return; }
        return _gerarNumeroAPI(cleanName, tipo);
    };

    window.salvarDocumentoRedator = async function () {
        if (redatorTipo === 'EMAIL') { if (SGEP.validar.run('numero')) copiarTextoRedator(); return; }
        if (!SGEP.validar.run('emissao')) return;
        if (!redatorNumeroGerado) {
            if (!confirm('Nenhum número oficial foi reservado. Reservar o próximo número agora e emitir?')) return;
            await gerarNumeroNoRedator(); if (!redatorNumeroGerado) return;
        }
        showToast(`Documento ${redatorTipo} nº ${redatorNumeroGerado} emitido e gravado no Livro de Numeração!`);
        SGEP.drafts.clear(redatorTipo); fecharRedatorOficial(); imprimirDocumentoRedator();
    };

    /* ============ 10. PRÉVIA, IMPRESSÃO, CÓPIA, E-MAIL, WORD ============ */
    const _previa = window.atualizarPreviaRedator;
    window.atualizarPreviaRedator = function () {
        _previa();
        const el = $('previa-redator-texto'), ta = $('redator-texto');
        if (el && ta) {
            el.classList.remove('whitespace-pre-wrap'); el.classList.add('sgep-rich');
            if (ta.value.trim()) el.innerHTML = SGEP.rich.toHTML(ta.value, { highlight: true });
        }
        SGEP.form.pull(); SGEP.drafts.schedule();
    };
    const _imprimir = window.imprimirDocumentoRedator;
    window.imprimirDocumentoRedator = function () {
        _imprimir();
        const el = $('print-corpo-texto'), ta = $('redator-texto');
        if (el) { el.classList.remove('whitespace-pre-wrap'); el.classList.add('sgep-rich'); el.innerHTML = SGEP.rich.toHTML(ta.value.trim() || '[Corpo do documento]'); }
    };
    window.abrirClienteDeEmail = function () {
        const g = id => ($(id) ? $(id).value.trim() : '');
        let url = `mailto:${encodeURIComponent(g('redator-destinatario'))}?subject=${encodeURIComponent(g('redator-assunto'))}&body=${encodeURIComponent(SGEP.rich.toPlain(g('redator-texto')))}`;
        if (g('redator-email-cc')) url += `&cc=${encodeURIComponent(g('redator-email-cc'))}`;
        window.location.href = url; showToast('Abrindo seu programa de e-mail padrão...');
    };
    // "Copiar texto formatado": envia HTML + texto simples (Word/Outlook colam com negrito/lista)
    window.copiarTextoRedator = async function () {
        const f = SGEP.form.pull(), num = getDocumentoPrefixoGas(redatorTipo, redatorNumeroGerado);
        const data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        const corpoTxt = SGEP.rich.toPlain(f.texto);
        const ehEmail = redatorTipo === 'EMAIL';
        const txt = ehEmail
            ? `Para: ${f.destinatario}\n${f.cc ? 'Cc: ' + f.cc + '\n' : ''}Assunto: ${f.assunto}\n\n${corpoTxt}\n\n--\n${f.signatario}\n${f.cargo}\n${f.secretaria}\nPrefeitura Municipal de Rio Claro – RJ`
            : `PREFEITURA MUNICIPAL DE RIO CLARO\n${f.secretaria}\n\n${num}\nRio Claro-RJ, ${data}\n\n${f.destinatario}\nAssunto: ${f.assunto}\n\n${corpoTxt}\n\n${f.fecho}\n\n${f.signatario}\n${f.cargo}\n${f.secretaria}`;
        const html = `<div style="font-family:'Times New Roman',serif;font-size:12pt">${ehEmail ? '' : `<p><strong>${esc(num)}</strong> — Rio Claro-RJ, ${esc(data)}</p><p><strong>${esc(f.destinatario)}</strong></p><p><strong>Assunto:</strong> ${esc(f.assunto)}</p>`}${SGEP.rich.toHTML(f.texto, { word: true })}<p>${esc(f.fecho)}</p><p><strong>${esc(f.signatario)}</strong><br>${esc(f.cargo)}<br>${esc(f.secretaria)}</p></div>`;
        try {
            if (window.ClipboardItem) await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([txt], { type: 'text/plain' }) })]);
            else await navigator.clipboard.writeText(txt);
            showToast('Texto formatado copiado!');
        } catch (e) { try { await navigator.clipboard.writeText(txt); showToast('Texto copiado (sem formatação).'); } catch (e2) { showToast('Não foi possível copiar.', true); } }
    };

    /* --- Exportação Word (.doc em MHTML: brasão embutido, cabeçalho 1ª página, rodapé com paginação) --- */
    SGEP.docx = {
        b64(str) { const bytes = new TextEncoder().encode(str); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); },
        wrap76(s) { return s.replace(/(.{76})/g, '$1\r\n'); },
        build() {
            const f = SGEP.form.pull(), num = getDocumentoPrefixoGas(redatorTipo, redatorNumeroGerado);
            const data = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
            const dest = /^(À|Ao|Aos|Às)\s/.test(f.destinatario) ? f.destinatario : 'À ' + f.destinatario;
            const corpo = SGEP.rich.toHTML(f.texto, { word: true });
            const F = "font-family:'Times New Roman',serif;";
            const cabecalho = `<table width="100%" style="border-bottom:2pt solid #002b82;border-collapse:collapse"><tr>
<td width="80" valign="middle"><img src="file:///C:/sgep/brasao.png" width="58" height="68"></td>
<td valign="middle" style="${F}color:#002b82">
<p style="margin:0;font-size:11pt;font-weight:bold">ESTADO DO RIO DE JANEIRO</p>
<p style="margin:0;font-size:13pt;font-weight:bold">PREFEITURA MUNICIPAL DE RIO CLARO</p>
<p style="margin:0;font-size:9pt;color:#444">Av. João Batista Portugal, nº 230 • CNPJ: 29.051.216/0001-68</p>
<p style="margin:0;font-size:10pt;font-weight:bold">${esc(f.secretaria.toUpperCase())}</p></td></tr></table>`;
            const rodape = `<p style="${F}font-size:8pt;color:#555;text-align:center;border-top:1pt solid #999;margin:0">Prefeitura Municipal de Rio Claro – RJ • Av. João Batista Portugal, nº 230 • ${esc(num)} • Página <span style="mso-field-code:' PAGE '"></span></p>`;
            const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(num)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
@page Section1 { size:21.0cm 29.7cm; margin:3cm 2cm 2cm 3cm; mso-header-margin:1.2cm; mso-footer-margin:1cm; mso-title-page:yes;
  mso-first-header:fh1; mso-header:h1; mso-first-footer:ff1; mso-footer:ff1; }
div.Section1 { page:Section1; }
body { ${F} font-size:12pt; }
p { ${F} }
</style></head>
<body><div class="Section1">
${SGEP.config.WORD_HEADER_IN_BODY ? cabecalho : ''}
<table width="100%" style="border-collapse:collapse;margin:0 0 10pt 0"><tr><td style="${F}font-weight:bold;color:#002b82">${esc(num)}</td><td align="right" style="${F}">Rio Claro-RJ, ${esc(data)}</td></tr></table>
<p style="margin:12pt 0 4pt 0;font-weight:bold">${esc(dest)}</p>
<p style="margin:0 0 12pt 0;border-bottom:.5pt solid #999"><b>ASSUNTO:</b> ${esc(f.assunto)}</p>
<p style="margin:0 0 8pt 0;font-weight:bold">Prezados,</p>
${corpo}
<p style="margin:12pt 0 36pt 0">${esc(f.fecho)}</p>
<p style="margin:0;text-align:center">______________________________</p>
<p style="margin:0;text-align:center;font-weight:bold">${esc(f.signatario)}</p>
<p style="margin:0;text-align:center;font-style:italic">${esc(f.cargo)}</p>
<p style="margin:0;text-align:center;color:#002b82">${esc(f.secretaria)}</p>
<div style="mso-element:header" id="fh1">${SGEP.config.WORD_HEADER_IN_BODY ? '<p style="margin:0">&nbsp;</p>' : cabecalho}</div>
<div style="mso-element:header" id="h1"><p style="margin:0">&nbsp;</p></div>
<div style="mso-element:footer" id="ff1">${rodape}</div>
</div></body></html>`;
            const png = String(BRASAO_BASE64).replace(/^data:image\/png;base64,/, '');
            const B = '----=_SGEP_' + Date.now();
            const mime = ['MIME-Version: 1.0', `Content-Type: multipart/related; boundary="${B}"; type="text/html"`, '',
                `--${B}`, 'Content-Type: text/html; charset="utf-8"', 'Content-Transfer-Encoding: base64', 'Content-Location: file:///C:/sgep/documento.htm', '',
                this.wrap76(this.b64(html)), '', `--${B}`, 'Content-Type: image/png', 'Content-Transfer-Encoding: base64', 'Content-Location: file:///C:/sgep/brasao.png', '',
                this.wrap76(png), '', `--${B}--`, ''].join('\r\n');
            return { mime, nome: (redatorNumeroGerado ? (num + '') : (redatorTipo + ' RASCUNHO')).replace(/[\\/:*?"<>|\s]+/g, '_') + '.doc' };
        },
        baixar() {
            if (!SGEP.validar.run('emissao')) return;
            const { mime, nome } = this.build();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([mime], { type: 'application/msword' })); a.download = nome;
            document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
            showToast('Arquivo Word gerado: ' + nome);
        }
    };
    window.baixarDocxRedator = () => SGEP.docx.baixar();
    function montarBotaoWord() {
        const ref = document.querySelector('[onclick="copiarTextoRedator()"]');
        if (!ref || $('btn-redator-word')) return;
        const b = ref.cloneNode(true); b.id = 'btn-redator-word'; b.setAttribute('onclick', 'baixarDocxRedator()');
        b.innerHTML = '<i class="fa-regular fa-file-word"></i><span>Baixar Word</span>';
        ref.insertAdjacentElement('afterend', b);
    }

    /* ============ 11. LIVRO DE NUMERAÇÃO: busca sem acento e multi-termo ============ */
    window.filtrarTabelaLivroModal = function () {
        const q = norm($('busca-livro-modal') ? $('busca-livro-modal').value : '').split(/\s+/).filter(Boolean);
        renderTabelaLivroModal(historicoNumeracao.filter(d => {
            if (filtroTipoLivroModal !== 'TODOS' && d.tipoDocumento !== filtroTipoLivroModal) return false;
            const alvo = norm(`${d.numero} ${d.tipoDocumento} ${d.assunto} ${d.destinatario} ${d.usuario} ${d.dataHora}`);
            return q.every(t => alvo.includes(t));
        }));
    };

    /* ============ 12. ACESSIBILIDADE: modais, foco, Esc, aria ============ */
    const MODAIS = {   // id -> função de fechar (corrige o handler legado que usava IDs inexistentes)
        'modal-timbrado-impressao': () => fecharModalTimbradoImpressao(), 'modal-livro-numeracao': () => fecharModalLivroNumeracao(),
        'modal-redator-oficial': () => fecharRedatorOficial(), 'variable-modal': () => closeVariableModal(),
        'crud-modal': () => closeCrudModal(), 'modal-alterar-senha': () => fecharModalAlterarSenha()
    };
    const FOCAVEL = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const abertos = () => Object.keys(MODAIS).map($).filter(m => m && !m.classList.contains('hidden'))
        .sort((a, b) => (parseInt(getComputedStyle(a).zIndex) || 0) - (parseInt(getComputedStyle(b).zIndex) || 0));
    function iniciarA11y() {
        Object.keys(MODAIS).forEach(id => {
            const m = $(id); if (!m) return;
            m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
            const h = m.querySelector('h1,h2,h3,[id$="title"]'); if (h) { if (!h.id) h.id = id + '-titulo'; m.setAttribute('aria-labelledby', h.id); }
            let anterior = null;
            new MutationObserver(() => {
                const aberto = !m.classList.contains('hidden');
                if (aberto && !m._open) { m._open = true; anterior = document.activeElement; setTimeout(() => { const f = m.querySelector(FOCAVEL); if (f) f.focus(); }, 30); }
                if (!aberto && m._open) { m._open = false; if (anterior && anterior.focus) anterior.focus(); }
            }).observe(m, { attributes: true, attributeFilter: ['class'] });
        });
        const toast = $('toast'); if (toast) { toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); }
        // Botões só com ícone: usa title como nome acessível; ícones decorativos ficam ocultos ao leitor de tela
        document.querySelectorAll('button').forEach(b => {
            if (!b.getAttribute('aria-label') && !b.textContent.trim() && b.title) b.setAttribute('aria-label', b.title);
            b.querySelectorAll('i,svg').forEach(i => i.setAttribute('aria-hidden', 'true'));
        });
    }
    window.addEventListener('keydown', (e) => {
        const ab = abertos(); if (!ab.length) return;
        const topo = ab[ab.length - 1];
        if (e.key === 'Escape') { e.stopPropagation(); MODAIS[topo.id](); return; }   // captura: impede o handler legado
        if (e.key === 'Tab') {
            const fs = [...topo.querySelectorAll(FOCAVEL)].filter(el => el.offsetParent !== null); if (!fs.length) return;
            const p = fs[0], u = fs[fs.length - 1];
            if (e.shiftKey && document.activeElement === p) { e.preventDefault(); u.focus(); }
            else if (!e.shiftKey && document.activeElement === u) { e.preventDefault(); p.focus(); }
        }
    }, true);

    /* ============ 13. ENGATE FINAL ============ */
    const _abrir = window.abrirRedatorOficial;
    window.abrirRedatorOficial = function (tipoPre = 'MEMORANDO', modeloIdRef = null) {
        _abrir.apply(this, arguments);
        montarToolbar(); montarBotaoWord();
        const v = $('sgep-val-box'); if (v) v.remove();
        SGEP.drafts.dirty = false;
        if (!modeloIdRef) SGEP.drafts.offer();
    };
    const _tipo = window.setRedatorTipo;
    window.setRedatorTipo = function (t) {
        _tipo.apply(this, arguments);
        const m = $('modal-redator-oficial'); if (m && !m.classList.contains('hidden')) SGEP.drafts.offer();
    };
    const modalRed = $('modal-redator-oficial');
    if (modalRed) ['input', 'change'].forEach(ev => modalRed.addEventListener(ev, (e) => {
        if (e.target.closest && e.target.closest('#sgep-draft-banner')) return;
        SGEP.drafts.dirty = true; SGEP.drafts.schedule();
    }));
    iniciarA11y();
    console.info('[SGEP] patch v1 ativo');
})();

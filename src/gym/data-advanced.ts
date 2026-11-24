// C1 and C2 content: worlds 4 (Distrito Staff) and 5 (Pico Principal).
// Same shapes as data.ts. Units: p = [english, portuguese, keyword used in "complete a frase"].
// Lessons: c = cards, q = [question, [correct, wrong, wrong]], w = [writing task, sample answer], sp = sentences to say.

export const ADV_UNITS: any[] = [
// ---------- C1 ----------
{id:'mentor',t:'Mentoria',s:'Ajudar alguém do time a crescer',p:[
["What would you do differently next time?","O que você faria diferente da próxima vez?","differently"],
["Let's break this down into smaller steps.","Vamos quebrar isso em passos menores.","break"],
["I'd encourage you to write the test first.","Eu te incentivaria a escrever o teste primeiro.","encourage"],
["You're on the right track.","Você está no caminho certo.","track"],
["Walk me through your reasoning.","Me explica seu raciocínio passo a passo.","reasoning"],
["It's fine to ask for help early.","Tudo bem pedir ajuda cedo.","early"],
["Pair with me on this one.","Faz par comigo nessa.","Pair"],
["What's the trade-off you're making here?","Qual é o trade-off que você está fazendo aqui?","trade-off"]]},
{id:'stakeholders',t:'Falar com o negócio',s:'Traduzir tecnologia para produto e gestão',p:[
["In plain terms, the page loads twice as fast.","Em termos simples, a página carrega duas vezes mais rápido.","plain"],
["This will reduce support tickets.","Isso vai reduzir os chamados de suporte.","reduce"],
["We need two more weeks to do it properly.","Precisamos de mais duas semanas para fazer direito.","properly"],
["The risk is low, but not zero.","O risco é baixo, mas não é zero.","risk"],
["Can we cut scope instead of moving the date?","Podemos cortar escopo em vez de mudar a data?","scope"],
["What problem are we trying to solve?","Que problema estamos tentando resolver?","solve"],
["I'll keep you posted.","Vou te mantendo informado.","posted"],
["Let's align on priorities first.","Vamos alinhar as prioridades primeiro.","align"]]},
{id:'incident',t:'Incidente e postmortem',s:'Comunicar falhas com calma e clareza',p:[
["We're seeing elevated error rates.","Estamos vendo taxas de erro elevadas.","elevated"],
["The issue has been mitigated.","O problema foi mitigado.","mitigated"],
["Customers may have been affected for ten minutes.","Clientes podem ter sido afetados por dez minutos.","affected"],
["The root cause was a missing index.","A causa raiz foi um índice faltando.","root"],
["We rolled back the deploy at 3 p.m.","Revertemos o deploy às 15h.","rolled"],
["This is a blameless postmortem.","Este é um postmortem sem culpados.","blameless"],
["Action items are tracked in the ticket.","As ações estão registradas no ticket.","tracked"],
["We'll add an alert to catch this earlier.","Vamos adicionar um alerta pra pegar isso mais cedo.","alert"]]},
{id:'rfc',t:'Propor e defender ideias',s:'RFCs, propostas e discussões técnicas',p:[
["I'd like to propose a different approach.","Gostaria de propor uma abordagem diferente.","propose"],
["The main goal is to reduce coupling.","O objetivo principal é reduzir o acoplamento.","coupling"],
["We considered two alternatives.","Consideramos duas alternativas.","alternatives"],
["The migration can be done incrementally.","A migração pode ser feita aos poucos.","incrementally"],
["I'm open to other ideas.","Estou aberto a outras ideias.","open"],
["That's a fair point.","É um ponto justo.","fair"],
["Let me play devil's advocate.","Deixa eu fazer o papel de advogado do diabo.","advocate"],
["Can we agree on a decision by Friday?","Podemos chegar a uma decisão até sexta?","decision"]]},
// ---------- C2 ----------
{id:'strategy',t:'Estratégia técnica',s:'Visão de longo prazo e direção',p:[
["Our north star is developer productivity.","Nossa estrela-guia é a produtividade dos devs.","north"],
["We should invest in the platform now to move faster later.","Devemos investir na plataforma agora para andar mais rápido depois.","invest"],
["This bet pays off within two quarters.","Essa aposta se paga em dois trimestres.","pays"],
["We're deliberately taking on this tech debt.","Estamos assumindo essa dívida técnica de propósito.","deliberately"],
["Let's revisit this decision in six months.","Vamos revisitar essa decisão em seis meses.","revisit"],
["The build-versus-buy question comes down to focus.","A questão de construir ou comprar se resume a foco.","focus"],
["We can't afford to boil the ocean.","Não podemos tentar abraçar o mundo.","ocean"],
["That's a one-way door, so let's be careful.","Essa é uma porta sem volta, então vamos com cuidado.","one-way"]]},
{id:'conflict',t:'Mediar conflitos',s:'Discordar sem quebrar a relação',p:[
["I hear your concern.","Entendo a sua preocupação.","concern"],
["Let's separate the people from the problem.","Vamos separar as pessoas do problema.","separate"],
["I see it a bit differently.","Eu vejo isso um pouco diferente.","differently"],
["What would it take to get you on board?","O que seria preciso para você topar?","board"],
["We both want the same outcome.","Nós dois queremos o mesmo resultado.","outcome"],
["Let's disagree and commit.","Vamos discordar e nos comprometer mesmo assim.","commit"],
["I may have come across too strongly.","Talvez eu tenha soado duro demais.","strongly"],
["Can we find some middle ground?","Podemos achar um meio-termo?","middle"]]},
{id:'boardroom',t:'Falar com a diretoria',s:'Ser direto com executivos',p:[
["The bottom line is that we're on track.","Resumindo: estamos dentro do plano.","bottom"],
["I'll keep this brief.","Vou ser breve.","brief"],
["There are three things you need to know.","Tem três coisas que vocês precisam saber.","three"],
["We're asking for one more engineer.","Estamos pedindo mais um engenheiro.","asking"],
["The upside outweighs the cost.","O ganho supera o custo.","outweighs"],
["I don't have that number, but I'll follow up today.","Não tenho esse número, mas retorno hoje.","follow"],
["What would you need to see to approve this?","O que vocês precisariam ver para aprovar isso?","approve"],
["My recommendation is to delay the launch.","Minha recomendação é adiar o lançamento.","recommendation"]]},
{id:'talk',t:'Palestras e conferências',s:'Falar em público com segurança',p:[
["Thanks for having me.","Obrigado pelo convite.","having"],
["Raise your hand if you've ever broken production.","Levanta a mão quem já derrubou produção.","Raise"],
["Here's what I wish I'd known earlier.","Isto é o que eu queria ter sabido antes.","wish"],
["Let me show you a quick demo.","Deixa eu mostrar uma demo rápida.","demo"],
["Bear with me for a second.","Me dá só um segundo.","Bear"],
["That's a great question.","Essa é uma ótima pergunta.","great"],
["I'll leave you with one thought.","Vou deixar vocês com uma reflexão.","thought"],
["The slides are on my profile.","Os slides estão no meu perfil.","slides"]]},
]

export const ADV_LESSONS: any[] = [
// ---------- C1 ----------
{id:'hedging',t:'Diplomacia',s:'Suavizar sem perder a clareza',c:[
 {h:'Suavizar opiniões',pt:'I\'d argue… / It seems to me… soam firmes sem ser agressivos.',ex:[["I'd argue that the cache is the real bottleneck.","Eu diria que o cache é o verdadeiro gargalo."],["It seems to me that we're overcomplicating this.","Me parece que estamos complicando demais."]]},
 {h:'Sugerir com cuidado',pt:'It might be worth… / Have we considered…? abrem espaço pra discussão.',ex:[["It might be worth adding a retry.","Talvez valha a pena adicionar um retry."],["Have we considered using a queue?","Já consideramos usar uma fila?"]]},
 {h:'Admitir incerteza',pt:'I\'m not entirely sure, but… mostra honestidade, não fraqueza.',ex:[["I'm not entirely sure, but it looks like a race condition.","Não tenho certeza total, mas parece uma race condition."],["As far as I know, nothing changed.","Até onde eu sei, nada mudou."]]}],
 q:[["It ___ be worth checking the logs.",["might","mights","might to"]],["I'd ___ that the design is too complex.",["argue","arguing","argued"]],["___ we considered a simpler option?",["Have","Did","Are"]],["I'm not ___ sure, but it seems slow.",["entirely","entire","entirety"]],["As ___ as I know, the API is stable.",["far","long","much"]]],
 w:["Discorde educadamente de uma decisão técnica do seu time.","I see the reasoning, but I'd argue that a monorepo might slow us down. Have we considered keeping the services separate for now?"],
 sp:["It might be worth adding a retry.","Have we considered using a queue?","I'm not entirely sure, but it looks like a race condition."]},
{id:'feedback',t:'Feedback difícil',s:'Falar do problema sem atacar a pessoa',c:[
 {h:'Começar pelo concreto',pt:'Fale do que aconteceu, não de quem a pessoa é.',ex:[["In yesterday's review, two comments sounded harsh.","Na review de ontem, dois comentários soaram duros."],["The last three PRs didn't have tests.","Os três últimos PRs não tinham testes."]]},
 {h:'Mostrar o impacto',pt:'The impact was… / This made it harder to…',ex:[["The impact was a late release.","O impacto foi um release atrasado."],["This made it harder for the team to help.","Isso dificultou o time de ajudar."]]},
 {h:'Pedir, não mandar',pt:'Going forward, could you…? / What do you think?',ex:[["Going forward, could you flag delays earlier?","Daqui pra frente, você pode avisar atrasos mais cedo?"],["How does that sound to you?","O que você acha disso?"]]}],
 q:[["___ forward, could you add tests?",["Going","Coming","Getting"]],["The ___ was a delayed release.",["impact","impacted","impacting"]],["This made it ___ for the team to review.",["harder","hard","hardest"]],["How does that ___ to you?",["sound","hear","listen"]],["Feedback bom fala de…",["fatos e impacto","personalidade","outras pessoas"]]],
 w:["Dê um feedback para um colega que não avisou que ia atrasar uma entrega.","In the last sprint, the API was delivered two days late and we found out on the release day. The impact was a rushed QA. Going forward, could you flag delays as soon as you see them?"],
 sp:["The impact was a late release.","Going forward, could you flag delays earlier?","How does that sound to you?"]},
{id:'connectors',t:'Conectores formais',s:'However, therefore, despite, which',c:[
 {h:'Contraste',pt:'However (porém) começa frase. Despite + substantivo (apesar de).',ex:[["The fix works. However, it's slow.","A correção funciona. Porém, é lenta."],["Despite the delay, we shipped on time.","Apesar do atraso, entregamos no prazo."]]},
 {h:'Consequência',pt:'Therefore / As a result = portanto / como resultado.',ex:[["The tests failed; therefore, we paused the release.","Os testes falharam; portanto, pausamos o release."],["As a result, latency dropped by half.","Como resultado, a latência caiu pela metade."]]},
 {h:'Juntar ideias',pt:', which… explica a frase anterior inteira.',ex:[["The job runs nightly, which keeps the data fresh.","O job roda toda noite, o que mantém os dados atualizados."],["We removed the lock, which fixed the deadlock.","Removemos o lock, o que resolveu o deadlock."]]}],
 q:[["It works. ___, it uses too much memory.",["However","Despite","Although of"]],["___ the bug, the release went well.",["Despite","However","Although"]],["Tests failed; ___, we rolled back.",["therefore","however","despite"]],["We added a cache, ___ cut costs by 30%.",["which","what","who"]],["As a ___, errors dropped.",["result","consequence of","reason"]]],
 w:["Explique uma mudança técnica e o resultado dela usando however, therefore ou which.","We moved image processing to a queue, which made the API much faster. However, users now wait a few seconds for thumbnails; therefore, we added a placeholder."],
 sp:["Despite the delay, we shipped on time.","As a result, latency dropped by half.","We removed the lock, which fixed the deadlock."]},
{id:'idioms',t:'Expressões de trabalho',s:'Idioms que nativos usam toda hora',c:[
 {h:'Alinhamento',pt:'on the same page = alinhados. touch base = conversar rapidinho.',ex:[["Let's make sure we're on the same page.","Vamos garantir que estamos alinhados."],["Let's touch base on Monday.","Vamos conversar rapidinho na segunda."]]},
 {h:'Prioridade e esforço',pt:'low-hanging fruit = ganho fácil. move the needle = fazer diferença real.',ex:[["Caching is the low-hanging fruit here.","Cache é o ganho fácil aqui."],["This feature won't move the needle.","Essa feature não vai fazer diferença."]]},
 {h:'Estimativas',pt:'ballpark = estimativa por alto. ASAP = o quanto antes.',ex:[["Can you give me a ballpark estimate?","Você me dá uma estimativa por alto?"],["It's a rough number, so take it with a grain of salt.","É um número aproximado, então não leve ao pé da letra."]]}],
 q:[["Let's make sure we're on the same ___.",["page","line","book"]],["Can you give me a ___ estimate?",["ballpark","baseball","backyard"]],["Fixing the typo is ___ fruit.",["low-hanging","low-cost","easy-going"]],["This won't move the ___.",["needle","pin","line"]],["Let's touch ___ tomorrow.",["base","point","ground"]]],
 w:["Mande uma mensagem para seu gerente pedindo prioridade, usando duas expressões desta aula.","Quick one: let's touch base before planning. I think the search bug is low-hanging fruit, but the new dashboard is what will really move the needle."],
 sp:["Let's make sure we're on the same page.","Caching is the low-hanging fruit here.","Can you give me a ballpark estimate?"]},
{id:'presenting',t:'Conduzir reuniões',s:'Abrir, guiar e fechar uma apresentação',c:[
 {h:'Abrir',pt:'Let me walk you through… = deixa eu te mostrar passo a passo.',ex:[["Let me walk you through the new architecture.","Deixa eu mostrar a nova arquitetura passo a passo."],["The goal of this meeting is to pick an option.","O objetivo desta reunião é escolher uma opção."]]},
 {h:'Guiar',pt:'Moving on to… / Let\'s park that for now.',ex:[["Moving on to the next topic.","Passando para o próximo assunto."],["Let's park that for now and come back later.","Vamos deixar isso de lado por agora e voltar depois."]]},
 {h:'Fechar',pt:'To wrap up… / Next steps are…',ex:[["To wrap up, we'll start with option B.","Pra fechar, vamos começar com a opção B."],["The next steps are on the doc.","Os próximos passos estão no documento."]]}],
 q:[["Let me walk you ___ the plan.",["through","across","over to"]],["___ on to the budget.",["Moving","Moved","Passing"]],["Let's ___ that for now.",["park","stop","stand"]],["To ___ up, we chose option A.",["wrap","close","end"]],["The goal ___ this meeting is to decide.",["of","for","to"]]],
 w:["Escreva a abertura e o fechamento de uma reunião sobre um novo projeto.","Thanks for joining. Let me walk you through the plan for the new checkout. ... To wrap up, we'll start with the payment API, and the next steps are in the doc."],
 sp:["Let me walk you through the new architecture.","Moving on to the next topic.","To wrap up, we'll start with option B."]},
// ---------- C2 ----------
{id:'inversion',t:'Ênfase formal',s:'Not only, rarely, had we known',c:[
 {h:'Not only… but also',pt:'Not only + verbo auxiliar + sujeito: ordem invertida, como pergunta.',ex:[["Not only did it fix the bug, but it also cut costs.","Não só resolveu o bug, como também cortou custos."],["Not only is it faster, but it's also cheaper.","Não só é mais rápido, como também é mais barato."]]},
 {h:'Raramente / nunca',pt:'Rarely / Never have we… dá peso em discurso formal.',ex:[["Rarely do we see a launch this smooth.","Raramente vemos um lançamento tão tranquilo."],["Never have we had so many users.","Nunca tivemos tantos usuários."]]},
 {h:'Se tivéssemos…',pt:'Had we known = If we had known (mais formal).',ex:[["Had we known, we would have waited.","Se soubéssemos, teríamos esperado."],["Should you need anything, just ask.","Caso precise de algo, é só pedir."]]}],
 q:[["Not only ___ it work, but it also scales.",["does","it does","is"]],["Rarely ___ we see this error.",["do","we do","are"]],["___ we known, we'd have waited.",["Had","If","Have"]],["Never ___ we shipped so fast.",["have","we have","did we"]],["___ you need help, call me.",["Should","Would","Shall"]]],
 w:["Escreva duas frases formais sobre um resultado do seu time usando inversão.","Not only did the new pipeline cut build time in half, but it also reduced flaky tests. Rarely have we seen such a clear win."],
 sp:["Not only did it fix the bug, but it also cut costs.","Rarely do we see a launch this smooth.","Had we known, we would have waited."]},
{id:'subjunctive',t:'Recomendações formais',s:'I suggest that it be, it\'s essential that',c:[
 {h:'Recomendar',pt:'suggest / recommend that + sujeito + verbo na base (sem -s).',ex:[["I recommend that the team review the logs.","Recomendo que o time revise os logs."],["We suggest that he join the call.","Sugerimos que ele entre na call."]]},
 {h:'Essencial que',pt:'It\'s essential / vital that + verbo na base.',ex:[["It's essential that the data be encrypted.","É essencial que os dados sejam criptografados."],["It's vital that every change go through review.","É vital que toda mudança passe por review."]]},
 {h:'Hipótese formal',pt:'If it were… / Were it to… (situação hipotética).',ex:[["If I were you, I'd split the PR.","Se eu fosse você, dividiria o PR."],["Were the service to fail, the queue would hold the jobs.","Se o serviço falhasse, a fila seguraria os jobs."]]}],
 q:[["I recommend that she ___ the doc.",["read","reads","reading"]],["It's essential that the key ___ rotated.",["be","is","being"]],["If I ___ you, I'd wait.",["were","was being","am"]],["We suggest that he ___ the meeting.",["join","joins","joined"]],["___ the server to crash, we'd lose data.",["Were","Was","If"]]],
 w:["Escreva uma recomendação formal de segurança para o time.","I recommend that every service use short-lived tokens, and it's essential that secrets be stored outside the repository."],
 sp:["I recommend that the team review the logs.","It's essential that the data be encrypted.","If I were you, I'd split the PR."]},
{id:'nuance',t:'Vocabulário preciso',s:'Palavras parecidas, sentidos diferentes',c:[
 {h:'Affect x effect',pt:'affect = verbo (afetar). effect = substantivo (efeito).',ex:[["The outage affected all users.","A queda afetou todos os usuários."],["The change had no effect on latency.","A mudança não teve efeito na latência."]]},
 {h:'Ensure x insure',pt:'ensure = garantir. insure = fazer seguro.',ex:[["Ensure the backup runs daily.","Garanta que o backup rode todo dia."],["Mitigate the risk before launch.","Reduza o risco antes do lançamento."]]},
 {h:'Fewer x less',pt:'fewer = contável (bugs). less = incontável (time, memory).',ex:[["We have fewer bugs this quarter.","Temos menos bugs neste trimestre."],["It uses less memory than before.","Usa menos memória do que antes."]]}],
 q:[["The bug ___ only Android users.",["affected","effected","affect"]],["Please ___ the tests pass.",["ensure","insure","assure of"]],["We had ___ incidents this month.",["fewer","less","lesser"]],["It takes ___ time to build.",["less","fewer","lower"]],["The new index had a big ___ on speed.",["effect","affect","affection"]]],
 w:["Escreva um resumo de 2 frases de uma melhoria, usando affect/effect e fewer/less.","The new retry logic had a clear effect: we now see fewer failed payments and spend less time on support."],
 sp:["The change had no effect on latency.","Ensure the backup runs daily.","We have fewer bugs this quarter."]},
{id:'persuasion',t:'Persuadir',s:'Convencer com argumentos de negócio',c:[
 {h:'Ancorar no valor',pt:'What this means for the business is… liga tecnologia a dinheiro.',ex:[["What this means for the business is faster onboarding.","O que isso significa para o negócio é um onboarding mais rápido."],["Every second of load time costs us conversions.","Cada segundo de carregamento nos custa conversões."]]},
 {h:'Antecipar objeções',pt:'You might be thinking… / The obvious concern is…',ex:[["You might be thinking this is too expensive.","Você pode estar pensando que isso é caro demais."],["The obvious concern is the migration risk.","A preocupação óbvia é o risco da migração."]]},
 {h:'Pedir a decisão',pt:'I\'d make the case that… / So what I\'m asking for is…',ex:[["I'd make the case that we start now.","Eu defenderia que comecemos agora."],["So what I'm asking for is one sprint.","Então o que estou pedindo é uma sprint."]]}],
 q:[["What this ___ for the business is lower costs.",["means","mean","meaning"]],["You ___ be thinking it's risky.",["might","mights","would to"]],["I'd make the ___ that we refactor now.",["case","point of","claim to"]],["So what I'm asking ___ is two engineers.",["for","to","about"]],["The obvious ___ is the timeline.",["concern","concerned","concerning"]]],
 w:["Convença seu diretor a investir uma sprint em melhorar a performance.","Every extra second of load time costs us conversions. You might be thinking a sprint is a lot, but I'd make the case that it pays off in a month. So what I'm asking for is one sprint."],
 sp:["What this means for the business is faster onboarding.","The obvious concern is the migration risk.","I'd make the case that we start now."]},
{id:'register',t:'Formal x informal',s:'Ajustar o tom para cada pessoa',c:[
 {h:'Pedidos',pt:'Do casual ao formal: Can you… → Could you… → Would you mind…?',ex:[["Can you take a look?","Dá uma olhada?"],["Would you mind reviewing this when you have a moment?","Você se importaria de revisar isso quando tiver um tempo?"]]},
 {h:'Mensagens',pt:'Slack com o time é curto. E-mail para cliente é completo.',ex:[["Hey, quick question about the deploy.","Oi, pergunta rápida sobre o deploy."],["I'm writing to follow up on our last meeting.","Escrevo para dar sequência à nossa última reunião."]]},
 {h:'Recusar',pt:'Informal: I can\'t this week. Formal: Unfortunately, I won\'t be able to…',ex:[["Sorry, I can't this week.","Foi mal, essa semana não dá."],["Unfortunately, I won't be able to attend.","Infelizmente, não poderei comparecer."]]}],
 q:[["Mais formal:",["Would you mind checking this?","Can you check this?","Check this?"]],["Para e-mail a um cliente:",["I'm writing to follow up on…","Hey, quick q…","Yo, about that…"]],["Unfortunately, I won't be ___ to attend.",["able","can","possible"]],["Would you mind ___ this?",["reviewing","to review","review"]],["Mensagem casual no Slack:",["Hey, quick question about the deploy.","Dear Sir or Madam,","I hereby inform you…"]]],
 w:["Escreva a mesma mensagem duas vezes: uma para o time no Slack e outra formal para um cliente, avisando de um atraso.","Slack: Hey team, heads up: the release slips to Thursday. Client: I'm writing to let you know that, unfortunately, the release will be delayed until Thursday."],
 sp:["Would you mind reviewing this when you have a moment?","I'm writing to follow up on our last meeting.","Unfortunately, I won't be able to attend."]},
]

// Short "why" for each new lesson question (same order as q).
export const ADV_WHY: Record<string, string[]> = {
  hedging: [
    "It might be worth… = talvez valha a pena. Depois de might, o verbo fica na base: might be.",
    "I'd argue that… = eu diria que. Depois de I'd vem o verbo na base: argue.",
    "Have we considered…? pergunta sobre algo até agora (present perfect).",
    "Not entirely sure = não tenho certeza total. Entirely é advérbio, modifica sure.",
    "As far as I know = até onde eu sei. É uma expressão fixa.",
  ],
  feedback: [
    "Going forward = daqui pra frente. Expressão fixa em feedback.",
    "The impact (substantivo) was… — depois de the vem substantivo.",
    "Made it harder = tornou mais difícil (comparativo de hard).",
    "How does that sound? = o que acha? Em inglês, a ideia \"soa\" bem ou mal.",
    "Bom feedback fala de fatos e impacto, nunca da personalidade da pessoa.",
  ],
  connectors: [
    "However começa a frase e vem seguido de vírgula: However, it…",
    "Despite + substantivo: despite the bug. Although pediria uma frase completa.",
    "Therefore = portanto: mostra consequência do que veio antes.",
    ", which… comenta a frase anterior inteira. What não funciona aqui.",
    "As a result = como resultado. Expressão fixa.",
  ],
  idioms: [
    "On the same page = alinhados, pensando igual.",
    "Ballpark estimate = estimativa por alto (vem do beisebol).",
    "Low-hanging fruit = a fruta mais baixa: o ganho mais fácil.",
    "Move the needle = mover o ponteiro: causar diferença real.",
    "Touch base = falar rapidinho para alinhar.",
  ],
  presenting: [
    "Walk someone through = explicar passo a passo.",
    "Moving on to… = passando para o próximo assunto.",
    "Park = estacionar: deixar um tema de lado por enquanto.",
    "To wrap up = para fechar/encerrar.",
    "The goal of… = o objetivo de. Goal pede of.",
  ],
  inversion: [
    "Depois de Not only, inverte como pergunta: does it work.",
    "Rarely no começo pede inversão: do we see.",
    "Had we known = If we had known, versão formal sem if.",
    "Never have we… = inversão com present perfect.",
    "Should you need = caso você precise. Formal e educado.",
  ],
  subjunctive: [
    "Recommend that + verbo na base, sem -s: she read.",
    "Essential that + be: the key be rotated.",
    "Em hipóteses, o formal é were para todas as pessoas: If I were you.",
    "Suggest that + base: he join (sem -s).",
    "Were + sujeito + to = se por acaso. Hipótese formal sem if.",
  ],
  nuance: [
    "Affect é verbo: o bug afetou (affected) os usuários.",
    "Ensure = garantir. Insure é fazer seguro.",
    "Incidents são contáveis → fewer.",
    "Time aqui é incontável → less.",
    "Effect é o substantivo: um grande efeito.",
  ],
  persuasion: [
    "What this means (singular: this) → means com -s.",
    "Might = pode ser que. Mostra que você entende a objeção.",
    "Make the case = defender um argumento.",
    "Ask for = pedir algo.",
    "Concern = preocupação (substantivo).",
  ],
  register: [
    "Would you mind…? é o pedido mais educado dos três.",
    "Com cliente, o e-mail é completo e formal.",
    "Be able to = conseguir/poder. Depois de won't be vem able.",
    "Would you mind + verbo com -ing: reviewing.",
    "No Slack com o time, curto e direto é o normal.",
  ],
}

export const ADV_SHORT: Record<string, string> = {
  hedging: 'Diplomacia', feedback: 'Feedback', connectors: 'Conectores', idioms: 'Expressões', presenting: 'Reuniões',
  inversion: 'Ênfase', subjunctive: 'Formal', nuance: 'Precisão', persuasion: 'Persuadir', register: 'Tom',
  mentor: 'Mentoria', stakeholders: 'Negócio', incident: 'Incidente', rfc: 'Propostas',
  strategy: 'Estratégia', conflict: 'Conflitos', boardroom: 'Diretoria', talk: 'Palestra',
}

export const ADV_LESSON_LV: Record<string, number> = {hedging:3,feedback:3,connectors:3,idioms:3,presenting:3,inversion:4,subjunctive:4,nuance:4,persuasion:4,register:4}
export const ADV_UNIT_LV: Record<string, number> = {mentor:3,stakeholders:3,incident:3,rfc:3,strategy:4,conflict:4,boardroom:4,talk:4}

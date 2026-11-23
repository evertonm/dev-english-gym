// Content for Dev English Gym: phrase units, AI scenarios and grammar lessons.
export const UNITS: any[] =[
{id:'standup',t:'Daily standup',s:'Contar o que fez e o que vai fazer',p:[
["Yesterday I worked on the login bug.","Ontem trabalhei no bug do login.","worked"],
["Today I'm going to finish the API tests.","Hoje vou terminar os testes da API.","finish"],
["I'm blocked by a failing build.","Estou travado por um build quebrado.","blocked"],
["No blockers on my side.","Sem impedimentos do meu lado.","blockers"],
["I'm still working on it.","Ainda estou trabalhando nisso.","still"],
["It should be done by tomorrow.","Deve ficar pronto até amanhã.","done"],
["I need a review on my pull request.","Preciso de uma revisão no meu pull request.","review"],
["Let's take this offline.","Vamos falar disso depois, fora da reunião.","offline"]]},
{id:'help',t:'Pedir ajuda',s:'Quando você não entendeu ou travou',p:[
["Could you help me with this error?","Você poderia me ajudar com esse erro?","help"],
["I'm not sure I understand.","Não sei se entendi.","sure"],
["Could you say that again, please?","Pode repetir, por favor?","again,"],
["Could you speak a bit slower?","Pode falar um pouco mais devagar?","slower"],
["What do you mean by that?","O que você quer dizer com isso?","mean"],
["Let me check and get back to you.","Deixa eu verificar e te retorno.","check"],
["Do you have a minute to pair?","Você tem um minuto pra fazer pair?","minute"],
["Thanks, that makes sense now.","Valeu, agora faz sentido.","sense"]]},
{id:'review',t:'Code review',s:'Comentar e responder PRs',p:[
["I left a few comments on your PR.","Deixei alguns comentários no seu PR.","comments"],
["Looks good to me.","Por mim está bom.","good"],
["Could we rename this variable?","Podemos renomear essa variável?","rename"],
["This function is hard to read.","Essa função está difícil de ler.","hard"],
["Can you add a test for this case?","Pode adicionar um teste pra esse caso?","test"],
["Good catch, I'll fix it.","Boa, vou corrigir.","catch,"],
["I pushed a new commit.","Subi um novo commit.","pushed"],
["What's the reason for this change?","Qual o motivo dessa mudança?","reason"]]},
{id:'meet',t:'Reuniões',s:'Calls, opinião e prazos',p:[
["Can you hear me?","Vocês me ouvem?","hear"],
["Sorry, I was on mute.","Desculpa, eu estava no mudo.","mute"],
["Let me share my screen.","Deixa eu compartilhar minha tela.","share"],
["I agree with that.","Concordo com isso.","agree"],
["I see it differently.","Eu vejo de outra forma.","differently"],
["What's the deadline for this?","Qual o prazo disso?","deadline"],
["I'll follow up by email.","Vou dar sequência por e-mail.","follow"],
["Who owns this task?","Quem é o responsável por essa tarefa?","owns"]]},
{id:'bugs',t:'Bugs e deploy',s:'Quando algo quebra em produção',p:[
["The build is broken.","O build está quebrado.","broken"],
["I can't reproduce the bug.","Não consigo reproduzir o bug.","reproduce"],
["It works on my machine.","Na minha máquina funciona.","works"],
["We need to roll back the release.","Precisamos reverter a release.","roll"],
["The fix is live in production.","A correção está no ar em produção.","live"],
["I found the root cause.","Achei a causa raiz.","root"],
["The server is down.","O servidor caiu.","down"],
["Let's ship it on Monday.","Vamos lançar na segunda.","ship"]]},
{id:'intro',t:'Entrevista: sobre você',s:'Tell me about yourself',p:[
["I have six years of experience.","Tenho seis anos de experiência.","experience"],
["I'm a mobile and full stack developer.","Sou desenvolvedor mobile e full stack.","developer"],
["I currently lead a small team.","Atualmente lidero um time pequeno.","lead"],
["I mostly work with React Native.","Trabalho principalmente com React Native.","mostly"],
["I'm looking for a remote position.","Estou buscando uma vaga remota.","looking"],
["I built this app from scratch.","Construí esse app do zero.","scratch"],
["I enjoy solving hard problems.","Gosto de resolver problemas difíceis.","solving"],
["I'm based in Brazil.","Moro no Brasil.","based"]]},
{id:'story',t:'Entrevista: histórias',s:'Contar um caso real do trabalho',p:[
["Let me give you an example.","Deixa eu te dar um exemplo.","example"],
["We had a tight deadline.","Tínhamos um prazo apertado.","tight"],
["I was responsible for the backend.","Eu era responsável pelo backend.","responsible"],
["I decided to split the work.","Decidi dividir o trabalho.","split"],
["We delivered on time.","Entregamos no prazo.","delivered"],
["I learned a lot from that mistake.","Aprendi muito com esse erro.","mistake"],
["It reduced load time by half.","Reduziu o tempo de carregamento pela metade.","reduced"],
["I would do it differently today.","Hoje eu faria diferente.","would"]]},
{id:'offer',t:'Recrutador e proposta',s:'Salário, fuso, contrato',p:[
["I'm available for a call tomorrow.","Estou disponível pra uma call amanhã.","available"],
["What's the salary range?","Qual a faixa salarial?","range"],
["I work as a contractor.","Trabalho como PJ (contractor).","contractor"],
["What time zone is the team in?","Em qual fuso horário o time está?","zone"],
["I can start in two weeks.","Posso começar em duas semanas.","start"],
["Is the position fully remote?","A vaga é totalmente remota?","fully"],
["What are the next steps?","Quais são os próximos passos?","steps"],
["Thank you for your time.","Obrigado pelo seu tempo.","time"]]},
{id:'pushback',t:'Discordar e negociar',s:'Dizer não sem queimar a ponte',p:[
["I see your point, but I disagree.","Entendo seu ponto, mas discordo.","point"],
["That's a fair point.","É um ponto justo.","fair"],
["Can we push the deadline to Monday?","Podemos empurrar o prazo pra segunda?","deadline"],
["I don't think we have capacity for that.","Acho que não temos capacidade pra isso.","capacity"],
["What if we cut the scope?","E se a gente cortar o escopo?","scope"],
["Let's find a middle ground.","Vamos achar um meio-termo.","middle"],
["I'd rather fix the root cause.","Prefiro corrigir a causa raiz.","rather"],
["Can we agree on the priorities first?","Podemos alinhar as prioridades primeiro?","priorities"]]},
{id:'design',t:'System design',s:'Explicar arquitetura e decisões',p:[
["We split the monolith into services.","Dividimos o monólito em serviços.","split"],
["The API sits behind a load balancer.","A API fica atrás de um load balancer.","behind"],
["We cache the results for five minutes.","Fazemos cache dos resultados por cinco minutos.","cache"],
["The queue handles the heavy jobs.","A fila cuida dos jobs pesados.","handles"],
["It scales horizontally.","Escala horizontalmente.","scales"],
["The bottleneck was the database.","O gargalo era o banco de dados.","bottleneck"],
["We chose it for its reliability.","Escolhemos pela confiabilidade.","reliability"],
["It's a trade-off between speed and cost.","É um trade-off entre velocidade e custo.","between"]]}
];
export const SCEN: any[] =[
{id:'recruiter',t:'Recrutador',role:'a friendly tech recruiter doing a first screening call for a remote senior developer position'},
{id:'standup',t:'Daily',role:'an engineering manager running the daily standup meeting of a software team'},
{id:'review',t:'Code review',role:'a teammate discussing a pull request that the learner opened'},
{id:'behavioral',t:'Entrevista',role:'a hiring manager asking behavioral interview questions about teamwork, deadlines, conflict and mistakes'},
{id:'tech',t:'Papo técnico',role:'a senior engineer asking the learner to explain a past project and its technical decisions'},
{id:'incident',t:'Incidente em produção',xp:500,role:'an engineering manager during a production incident'},
{id:'salary',t:'Negociar salário',xp:1500,role:'a recruiter making a job offer'},
{id:'cto',t:'Entrevista com CTO',xp:3600,role:'the CTO of a startup in a final interview'}
];
export const LESSONS: any[] =[
{id:'past',t:'Passado',s:'Contar o que você fez',c:[
 {h:'O que você fez',pt:'Verbo + ed. Use pra ontem, semana passada, projeto antigo.',ex:[["I fixed the bug yesterday.","Corrigi o bug ontem."],["We deployed last week.","Fizemos deploy semana passada."]]},
 {h:'Irregulares que dev usa',pt:'Esses não levam -ed. São 6, decore.',ex:[["build → built","construir"],["write → wrote","escrever"],["find → found","achar"],["send → sent","enviar"],["make → made","fazer, criar"],["do → did","fazer"]]},
 {h:'Negar e perguntar',pt:'Use did ou didn\'t. O verbo volta ao normal.',ex:[["I didn't test it.","Não testei."],["Did you merge the PR?","Você deu merge no PR?"]]}],
 q:[["I ___ the login bug yesterday.",["fixed","fix","fixing"]],["She ___ the API last year.",["built","builded","build"]],["I didn't ___ the email.",["send","sent","sended"]],["___ you test it?",["Did","Do","Was"]],["We ___ the root cause.",["found","finded","find"]]],
 w:["O que você fez ontem no trabalho? Escreva 1 ou 2 frases.","Yesterday I fixed a bug and reviewed two pull requests."],
 sp:["I fixed the bug yesterday.","I built the app from scratch.","Did you merge the PR?"]},
{id:'present',t:'Presente',s:'Agora vs. sempre',c:[
 {h:'Agora ou sempre?',pt:'I\'m working = agora. I work = rotina, sempre.',ex:[["I'm working on the payment flow.","Estou trabalhando no fluxo de pagamento."],["I work with React Native.","Trabalho com React Native."]]},
 {h:'He, she, it levam S',pt:'Terceira pessoa ganha um S no verbo.',ex:[["The app crashes on Android.","O app crasha no Android."],["She leads the backend team.","Ela lidera o time de backend."]]},
 {h:'Negar',pt:'don\'t para I, you, we, they. doesn\'t para he, she, it.',ex:[["I don't use Redux anymore.","Não uso mais Redux."],["It doesn't work on iOS.","Não funciona no iOS."]]}],
 q:[["Right now I ___ on the API.",["am working","work","works"]],["I usually ___ with TypeScript.",["work","am working","works"]],["The test ___ on CI.",["fails","fail","failing"]],["It ___ work on my phone.",["doesn't","don't","isn't"]],["We ___ a daily every morning.",["have","has","are have"]]],
 w:["No que você está trabalhando agora? Quais tecnologias você usa?","I'm working on a mobile app. I work with React Native and Node."],
 sp:["I'm working on the payment flow.","I work with React Native.","It doesn't work on iOS."]},
{id:'future',t:'Futuro',s:'Planos, promessas e prazos',c:[
 {h:'going to = plano',pt:'Já decidiu que vai fazer.',ex:[["I'm going to deploy today.","Vou fazer deploy hoje."],["We're going to refactor this.","Vamos refatorar isso."]]},
 {h:'will = decidiu agora',pt:'Promessa ou decisão na hora. Vira \'ll.',ex:[["I'll check it now.","Vou ver isso agora."],["I'll send you the link.","Te mando o link."]]},
 {h:'Prazo',pt:'by = até. in = daqui a.',ex:[["It will be ready by Friday.","Fica pronto até sexta."],["I can start in two weeks.","Posso começar em duas semanas."]]}],
 q:[["Today I'm ___ to finish the tests.",["going","go","will"]],["Good catch, I ___ fix it.",["will","am","did"]],["It will be ready ___ Friday.",["by","in","at"]],["I can start ___ two weeks.",["in","by","on"]],["We ___ going to migrate the database.",["are","will","is"]]],
 w:["O que você vai fazer hoje e quando fica pronto?","Today I'm going to finish the API tests. It will be ready by tomorrow."],
 sp:["I'm going to deploy today.","I'll send you the link.","It will be ready by Friday."]},
{id:'polite',t:'Pedir com educação',s:'Não soar grosso em inglês',c:[
 {h:'Comece com Could you',pt:'Ordem direta soa rude em inglês.',ex:[["Could you review my PR?","Pode revisar meu PR?"],["Could you share the docs?","Pode compartilhar a doc?"]]},
 {h:'Pedir permissão',pt:'Can I… ou Is it okay if…',ex:[["Can I ask a question?","Posso fazer uma pergunta?"],["Is it okay if I join later?","Tudo bem se eu entrar depois?"]]},
 {h:'Discordar sem brigar',pt:'Suavize. Nunca só "no".',ex:[["I'm not sure about that.","Não tenho certeza disso."],["What if we try another approach?","E se tentarmos outra abordagem?"]]}],
 q:[["Qual é o jeito educado?",["Could you review my PR?","Review my PR.","You review my PR?"]],["___ I ask a question?",["Can","Do","Am"]],["Could you ___ me the link?",["send","sent","sending"]],["What ___ we try another approach?",["if","about","when"]],["Is it okay ___ I join later?",["if","that","to"]]],
 w:["Peça pra um colega revisar seu PR hoje.","Hi! Could you review my PR today? Thanks!"],
 sp:["Could you review my PR?","Can I ask a question?","What if we try another approach?"]},
{id:'questions',t:'Fazer perguntas',s:'Do, does e a ordem certa',c:[
 {h:'Do e does vêm na frente',pt:'Pergunta não é só entonação.',ex:[["Do you use TypeScript?","Vocês usam TypeScript?"],["Does the team work async?","O time trabalha async?"]]},
 {h:'Com what, how, where',pt:'Palavra de pergunta, depois do/does/is.',ex:[["How big is the team?","Qual o tamanho do time?"],["Where is the team based?","Onde o time fica?"]]},
 {h:'Pra perguntar na entrevista',pt:'Sempre leve 2 perguntas prontas.',ex:[["What does a typical day look like?","Como é um dia típico?"],["How do you handle code reviews?","Como vocês fazem code review?"]]}],
 q:[["___ you use TypeScript?",["Do","Are","Does"]],["___ the team work remotely?",["Does","Do","Is"]],["How big ___ the team?",["is","does","do"]],["What ___ a typical day look like?",["does","is","do"]],["Qual está certa?",["Where is the team based?","Where the team is based?","Where does the team based?"]]],
 w:["Escreva 1 pergunta que você faria pro entrevistador.","What does a typical day look like?"],
 sp:["Do you use TypeScript?","How big is the team?","What does a typical day look like?"]},
{id:'perfect',t:'Sua experiência',s:'I have worked… for / since',c:[
 {h:'Do passado até hoje',pt:'have + verbo no particípio. Começou antes e continua.',ex:[["I have worked with React for five years.","Trabalho com React há cinco anos."],["I've been a tech lead since 2022.","Sou tech lead desde 2022."]]},
 {h:'for ou since?',pt:'for = duração. since = quando começou.',ex:[["for three years","por três anos"],["since 2021","desde 2021"]]},
 {h:'Já fiz, nunca fiz',pt:'Ótimo pra falar de skills.',ex:[["I've led teams of five people.","Já liderei times de cinco pessoas."],["I've never used Kotlin in production.","Nunca usei Kotlin em produção."]]}],
 q:[["I ___ worked with Node for six years.",["have","am","did"]],["I've been here ___ 2021.",["since","for","from"]],["I've used Flutter ___ two years.",["for","since","in"]],["I've never ___ Go in production.",["used","use","using"]],["Qual está certa?",["I've worked here for three years.","I work here since three years.","I'm working here since three years."]]],
 w:["Há quanto tempo você trabalha com sua stack principal?","I've worked with React Native for five years."],
 sp:["I have worked with React for five years.","I've been a tech lead since 2022.","I've led teams of five people."]},
{id:'brmistakes',t:'Erros de brasileiro',s:'Os que entregam na hora',c:[
 {h:'Idade e tempo',pt:'Idade usa am. Tempo de casa usa have worked.',ex:[["I'm 30 years old.","Errado: I have 30 years."],["I've worked here for 3 years.","Errado: I work here since 3 years."]]},
 {h:'Preposições',pt:'depend on. explain to.',ex:[["It depends on the project.","Errado: depends of."],["Can you explain it to me?","Errado: explain me."]]},
 {h:'Falsos amigos',pt:'Parecem português, mas não são.',ex:[["currently","atualmente"],["actually","na verdade"],["I intend to","eu pretendo"],["pretend","fingir"]]},
 {h:'make ou do?',pt:'make = criar algo. do = executar tarefa.',ex:[["I made a mistake.","Errado: did a mistake."],["I did the code review.","Fiz o code review."]]}],
 q:[["It depends ___ the deadline.",["on","of","in"]],["I ___ a mistake in the migration.",["made","did","had"]],["___ I work at a fintech. (atualmente)",["Currently","Actually","Eventually"]],["Can you explain it ___ me?",["to","for","at"]],["I ___ 30 years old.",["am","have","has"]]],
 w:["Onde você trabalha atualmente e há quanto tempo?","Currently I work at a software company. I've worked there for three years."],
 sp:["It depends on the project.","I made a mistake.","Can you explain it to me?"]},
{id:'stories',t:'Contar um caso',s:'Resposta de entrevista em 3 frases',c:[
 {h:'Problema, ação, resultado',pt:'Toda resposta de entrevista cabe nisso.',ex:[["Our app was slow.","Problema"],["I profiled the code and fixed two queries.","Ação"],["Load time dropped by half.","Resultado"]]},
 {h:'Ligue as frases',pt:'Sem conectivo, parece lista.',ex:[["because","porque"],["so","então"],["but","mas"],["as a result","como resultado"]]},
 {h:'Ordem dos fatos',pt:'first, then, finally.',ex:[["First I found the bug.","Primeiro achei o bug."],["Then I wrote a test.","Depois escrevi um teste."],["Finally we shipped the fix.","Por fim lançamos a correção."]]}],
 q:[["The app was slow, ___ I profiled it.",["so","because","but"]],["We missed the deadline ___ the scope changed.",["because","so","then"]],["First I found the bug, ___ I wrote a test.",["then","because","but"]],["It was hard, ___ we delivered on time.",["but","so","because"]],["As a ___, load time dropped by half.",["result","reason","finish"]]],
 w:["Conte em 2 ou 3 frases um problema que você resolveu no trabalho.","Our app was slow, so I profiled the code. I fixed two queries. As a result, load time dropped by half."],
 sp:["Our app was slow, so I profiled the code.","As a result, load time dropped by half.","It was hard, but we delivered on time."]},
{id:'writing',t:'Escrever no trabalho',s:'Slack, PR e recrutador',c:[
 {h:'Mensagem no Slack',pt:'Oi + contexto + pedido. Curto.',ex:[["Hi! Quick question about the auth service.","Oi! Dúvida rápida sobre o serviço de auth."],["Could you take a look when you have time?","Pode dar uma olhada quando tiver tempo?"]]},
 {h:'Descrição de PR',pt:'O que mudou e como testar.',ex:[["This PR adds retry logic to the upload.","Este PR adiciona retry no upload."],["How to test: run the upload with no network.","Como testar: rode o upload sem rede."]]},
 {h:'Responder recrutador',pt:'Agradeça, mostre interesse, proponha call.',ex:[["Thanks for reaching out!","Obrigado pelo contato!"],["I'm available for a call this week.","Estou disponível pra uma call essa semana."]]}],
 q:[["Thanks for reaching ___!",["out","me","up"]],["This PR ___ retry logic to the upload.",["adds","add","adding"]],["Could you take a ___ when you have time?",["look","see","watch"]],["I'm available ___ a call this week.",["for","to","at"]],["Qual abre melhor uma mensagem no Slack?",["Hi! Quick question about the deploy.","Hello dear sir, I hope you are well.","Deploy???"]]],
 w:["Um recrutador te mandou uma vaga remota. Responda com interesse e proponha uma call.","Hi! Thanks for reaching out. I'm interested in the position. I'm available for a call this week."],
 sp:["Thanks for reaching out!","This PR adds retry logic to the upload.","I'm available for a call this week."]},
{id:'sounds',t:'Pronúncia de dev',s:'Palavras que todo mundo erra',c:[
 {h:'Letras que enganam',pt:'Toque, escute e repita.',ex:[["cache","soa como cash"],["queue","soa como kiu"],["schema","skí-ma"],["suite","igual a sweet"]]},
 {h:'Sílaba forte',pt:'A sílaba errada confunde mais que o sotaque.',ex:[["develop","di-VÉ-lop"],["engineer","en-dji-NÍR"],["variable","VÉ-ri-a-bol"],["integer","ÍN-te-djer"]]},
 {h:'Som de ai e ei',pt:'O i e o a mudam de som.',ex:[["height","háit"],["idle","ái-dol"],["archive","ár-kaiv"],["data","dêi-ta"],["label","lêi-bol"]]}],
 q:[["cache soa como…",["cash","catch","cá-che"],"cache"],["queue soa como…",["kiu","kuê-ue","quéu"],"queue"],["Qual sílaba é forte em develop?",["VE","DE","LOP"],"develop"],["height rima com…",["light","eight","wait"],"height, light"],["suite soa como…",["sweet","suit","suí-te"],"suite"]],
 w:null,
 sp:["Clear the cache and run the query.","The queue is idle.","I'm a software engineer."]},
{id:'conditionals',t:'Hipóteses',s:'If, will e would',c:[
 {h:'Se acontecer',pt:'If + presente, will + verbo. Pra riscos e plano B.',ex:[["If the build fails, we'll roll back.","Se o build falhar, a gente reverte."],["If you need help, let me know.","Se precisar de ajuda, me avisa."]]},
 {h:'Se fosse',pt:'If + passado, would + verbo. Situação imaginária.',ex:[["If we had more time, I would refactor it.","Se tivéssemos mais tempo, eu refatoraria."],["If I were you, I'd add a cache.","Se eu fosse você, colocaria um cache."]]},
 {h:'Would pra suavizar',pt:'Opinião com would soa mais diplomática.',ex:[["I would suggest a smaller PR.","Eu sugeriria um PR menor."],["Would it be possible to move the call?","Seria possível mudar a call?"]]}],
 q:[["If the tests pass, we ___ deploy today.",["will","would","are"]],["If I ___ you, I'd split this PR.",["were","am","be"]],["If we had more time, we ___ rewrite it.",["would","will","are"]],["___ it be possible to start next week?",["Would","Will","Do"]],["If you ___ help, let me know.",["need","needed","will need"]]],
 w:["O que você faria se tivesse mais tempo no seu projeto atual?","If I had more time, I would improve the test coverage and refactor the API layer."],
 sp:["If the build fails, we'll roll back.","If I were you, I'd add a cache.","Would it be possible to move the call?"]},
{id:'modals',t:'Certeza e conselho',s:'should, might, must',c:[
 {h:'Recomendar',pt:'should = deveria. Conselho sem ser mandão.',ex:[["We should add monitoring.","Deveríamos colocar monitoramento."],["You shouldn't commit secrets.","Você não deveria commitar segredos."]]},
 {h:'Grau de certeza',pt:'must = com certeza. might = talvez. can\'t = impossível.',ex:[["It must be a cache issue.","Com certeza é problema de cache."],["It might be the new release.","Pode ser a release nova."],["It can't be the database, it's up.","Não pode ser o banco, ele está no ar."]]},
 {h:'Sobre o passado',pt:'should have = deveria ter. might have = pode ter.',ex:[["We should have tested it on Android.","Devíamos ter testado no Android."],["Someone might have changed the config.","Alguém pode ter mudado a config."]]}],
 q:[["We ___ add alerts before the launch.",["should","must to","would to"]],["Every request times out, so it ___ be the network. (com certeza)",["must","might","should"]],["I'm not sure, it ___ be a race condition.",["might","must","can't"]],["We should have ___ it before Friday.",["tested","test","testing"]],["It ___ be the API, the API is fine.",["can't","must","should"]]],
 w:["Apareceu um bug em produção. Escreva o que pode ter causado e o que o time deveria fazer.","It might be the new release. We should roll back and add a test for this case."],
 sp:["It might be a cache issue.","We should have tested it on Android.","You shouldn't commit secrets."]},
{id:'passive',t:'Voz passiva',s:'Incidentes e release notes',c:[
 {h:'Quem fez não importa',pt:'be + particípio. Comum em incidente e release note.',ex:[["The bug was fixed yesterday.","O bug foi corrigido ontem."],["The feature is used by two million users.","A feature é usada por dois milhões de usuários."]]},
 {h:'Já aconteceu',pt:'has been / have been + particípio.',ex:[["The fix has been deployed.","A correção já foi pro ar."],["All tickets have been closed.","Todos os tickets foram fechados."]]},
 {h:'Vai acontecer',pt:'will be + particípio.',ex:[["The API will be deprecated in June.","A API vai ser descontinuada em junho."],["You will be notified by email.","Você vai ser avisado por e-mail."]]}],
 q:[["The bug ___ fixed last night.",["was","is","has"]],["The fix has ___ deployed to production.",["been","be","being"]],["The old endpoint will be ___ next month.",["removed","remove","removing"]],["This library is ___ by thousands of devs.",["used","use","using"]],["Qual está na voz passiva?",["The data was lost during the migration.","We lost the data during the migration.","The migration loses data."]]],
 w:["Escreva um resumo curto de incidente: o que aconteceu e o que já foi feito.","The payment service was down for 20 minutes. The root cause has been found and a fix has been deployed."],
 sp:["The fix has been deployed.","The bug was fixed yesterday.","The API will be deprecated in June."]},
{id:'phrasal',t:'Phrasal verbs de dev',s:'look into, roll back, figure out',c:[
 {h:'Investigar',pt:'look into = investigar. figure out = descobrir.',ex:[["I'll look into it.","Vou investigar."],["We need to figure out the root cause.","Precisamos descobrir a causa raiz."]]},
 {h:'Configurar e reverter',pt:'set up = configurar. roll back = reverter. roll out = liberar aos poucos.',ex:[["Can you set up the staging environment?","Pode configurar o ambiente de staging?"],["Let's roll back the release.","Vamos reverter a release."],["We'll roll out the feature next week.","Vamos liberar a feature semana que vem."]]},
 {h:'Ideias e prazos',pt:'come up with = ter uma ideia. run out of = ficar sem.',ex:[["She came up with a better solution.","Ela teve uma ideia melhor."],["We ran out of time.","Ficamos sem tempo."]]}],
 q:[["I'll look ___ the error and get back to you.",["into","at","for"]],["We need to figure ___ why it's slow.",["out","up","in"]],["The release broke login. Let's roll it ___.",["back","out","up"]],["Can you set ___ the CI pipeline?",["up","on","out"]],["We ran ___ of time before the demo.",["out","off","away"]]],
 w:["Diga o que você vai fazer com um bug novo, usando look into ou figure out.","I'll look into the bug today and try to figure out the root cause."],
 sp:["I'll look into it.","Let's roll back the release.","We ran out of time."]},
{id:'tradeoffs',t:'Discutir trade-offs',s:'Prós, contras e decisão',c:[
 {h:'Prós e contras',pt:'The upside is… The downside is…',ex:[["The upside is that it's faster.","A vantagem é que é mais rápido."],["The downside is the extra cost.","A desvantagem é o custo extra."]]},
 {h:'Comparar opções',pt:'whereas = enquanto. on the other hand = por outro lado.',ex:[["Postgres is consistent, whereas Redis is faster.","Postgres é consistente, enquanto Redis é mais rápido."],["On the other hand, it's harder to maintain.","Por outro lado, é mais difícil de manter."]]},
 {h:'Decidir com critério',pt:'It depends on… / Given…, I\'d go with…',ex:[["It depends on the traffic.","Depende do tráfego."],["Given our deadline, I'd go with the simpler option.","Dado o nosso prazo, eu iria pela opção mais simples."]]}],
 q:[["The ___ is that it costs more.",["downside","download","downtime"]],["SQL is strict, ___ NoSQL is flexible.",["whereas","because","so"]],["On the other ___, it's harder to test.",["hand","side","way"]],["___ our deadline, I'd go with option A.",["Given","Giving","Gave"]],["It depends ___ how many users we have.",["on","of","from"]]],
 w:["Compare duas tecnologias que você conhece e diga qual escolheria e por quê.","React Native shares code across platforms, whereas native apps perform better. Given our small team, I'd go with React Native."],
 sp:["The downside is the extra cost.","On the other hand, it's harder to maintain.","Given our deadline, I'd go with the simpler option."]}
];

// Learning levels. Each lesson and training unit belongs to one level; a level opens when the
// previous one is finished (every lesson with at least one star) or when its placement test is passed.
export const LEVELS: any[] = [
  {t:'Básico',tag:'A2',s:'Frases do dia a dia de dev'},
  {t:'Intermediário',tag:'B1',s:'Entrevista, experiência e escrita'},
  {t:'Avançado',tag:'B2',s:'Negociar, explicar e decidir'},
]
const LESSON_LV: Record<string, number> = {past:0,present:0,future:0,polite:0,questions:0,perfect:1,brmistakes:1,stories:1,writing:1,sounds:1,conditionals:2,modals:2,passive:2,phrasal:2,tradeoffs:2}
const UNIT_LV: Record<string, number> = {standup:0,help:0,review:0,meet:1,bugs:1,intro:1,story:2,offer:2,pushback:2,design:2}
for (const l of LESSONS) l.lv = LESSON_LV[l.id] ?? 0
for (const u of UNITS) u.lv = UNIT_LV[u.id] ?? 0

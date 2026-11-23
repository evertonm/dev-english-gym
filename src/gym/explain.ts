// Spoken explanation for each lesson card (same order as LESSONS[].c), in Brazilian Portuguese.
// Shown under the card's rule and read aloud when the card opens (the learner can mute it).
export const EXPLAIN: Record<string, string[]> = {
  past: [
    "Para falar de algo que já terminou, como ontem ou semana passada, a maioria dos verbos ganha o final E D. Fix vira fixed, deploy vira deployed. O verbo é o mesmo para todas as pessoas: eu, você, ele, nós.",
    "Alguns verbos muito usados por devs são irregulares e não seguem a regra do E D. Build vira built, write vira wrote, find vira found. Esses você precisa decorar, mas são poucos e aparecem toda hora.",
    "Para negar ou perguntar no passado, use did. O detalhe importante: depois de did, o verbo volta para a forma normal, porque o did já marca o passado. Então é I didn't test, e não I didn't tested.",
  ],
  present: [
    "Em inglês, o presente tem duas formas. Am, is ou are mais o verbo com I N G é para o que está acontecendo agora. O verbo simples é para rotina e coisas que são sempre verdade, como a tecnologia que você usa no trabalho.",
    "Quando o sujeito é ele, ela ou uma coisa, o verbo ganha um S no final. I work, mas she works. The app crash vira the app crashes. É um erro muito comum de brasileiro esquecer esse S.",
    "Para negar no presente, use don't com eu, você, nós e eles, e doesn't com ele, ela e coisas. Depois do doesn't, o verbo fica sem S, porque o S já foi para o doesn't.",
  ],
  future: [
    "Going to serve para planos que você já decidiu antes. Se no começo do dia você já sabia que ia fazer o deploy, diga I'm going to deploy today.",
    "Will é para decisões tomadas na hora, promessas e ofertas. Alguém pediu ajuda e você responde na mesma hora: I'll check it now. Na fala, will quase sempre vira apenas o som de L no final.",
    "Para prazos, by significa até tal data, o limite. In significa daqui a tanto tempo. Ready by Friday é pronto até sexta. Start in two weeks é começar daqui a duas semanas.",
  ],
  polite: [
    "Em inglês, pedir de forma direta soa rude, mesmo entre colegas. Em vez de mandar, comece com could you. Isso transforma uma ordem em um pedido gentil, e é o padrão em empresas.",
    "Para pedir permissão, use can I, ou o mais educado is it okay if. Funciona para fazer perguntas, entrar atrasado numa call ou mexer no código de alguém.",
    "Para discordar sem criar clima ruim, suavize. Diga que não tem certeza ou proponha outra ideia como pergunta. Um simples no soa agressivo em inglês.",
  ],
  questions: [
    "Em português, pergunta é só mudar a entonação. Em inglês não: você precisa colocar do ou does antes do sujeito. Does vai com ele, ela e coisas, como the team.",
    "Com palavras de pergunta, como what, how e where, a ordem é: palavra de pergunta, depois do, does ou is, depois o sujeito. How big is the team. Where is the team based.",
    "No fim de toda entrevista, perguntam se você tem dúvidas. Ter duas perguntas prontas mostra interesse. Pergunte sobre o dia a dia e sobre como o time trabalha.",
  ],
  perfect: [
    "Para algo que começou no passado e continua até hoje, use have mais o verbo no particípio. É assim que você fala da sua experiência: I have worked with React for five years, e ainda trabalha.",
    "For indica quanto tempo dura, como for three years. Since indica quando começou, como since 2021. Brasileiro costuma trocar os dois, então preste atenção.",
    "Have também serve para dizer o que você já fez ou nunca fez na vida, sem dizer quando. É perfeito para falar de habilidades numa entrevista.",
  ],
  brmistakes: [
    "Em inglês você é a sua idade, não tem: I'm 30. E para tempo de casa, use have worked, porque você ainda trabalha lá. Nunca diga I have 30 years.",
    "Algumas preposições são diferentes do português. Em inglês é depend on, nunca depend of. E é explain to me, nunca explain me.",
    "Falsos amigos parecem palavras em português, mas significam outra coisa. Actually é na verdade, não atualmente. Pretend é fingir, não pretender. Atualmente é currently.",
    "Make é para criar ou produzir algo, como um erro ou um plano. Do é para executar uma tarefa, como fazer a code review ou o trabalho.",
  ],
  stories: [
    "Toda resposta de entrevista sobre experiência cabe em três partes: o problema, o que você fez e o resultado, de preferência com um número. Isso deixa sua história clara e convincente.",
    "Sem conectivos, suas frases parecem uma lista solta. Use because para causa, so para consequência, but para contraste e as a result para resultado.",
    "Para contar os fatos em ordem, use first, then e finally. Quem escuta acompanha a história sem se perder.",
  ],
  writing: [
    "No Slack, seja curto: cumprimente, dê o contexto em uma frase e faça o pedido. Mensagem longa demais ou só um oi sem contexto atrasa a resposta.",
    "Uma boa descrição de pull request diz o que mudou e como testar. Isso economiza o tempo de quem revisa e acelera a aprovação.",
    "Para responder um recrutador, agradeça o contato, mostre interesse e proponha uma call. Três frases bastam.",
  ],
  sounds: [
    "Algumas palavras de tecnologia não soam como se escrevem. Cache soa como cash, queue soa como kiu e suite soa como sweet. Toque em cada uma e repita em voz alta.",
    "Errar a sílaba forte confunde mais do que o sotaque. Em develop, a força está no meio: deVElop. Em engineer, está no final: engiNEER.",
    "Em inglês, a letra I muitas vezes soa como ai, e a letra A como ei. Height soa como rait, data como deita. Ouça os exemplos.",
  ],
  conditionals: [
    "Para uma situação real que pode acontecer, use if com o presente, e will na consequência. Ótimo para falar de riscos e de plano B.",
    "Para uma situação imaginária, que não é a realidade agora, use if com o passado, e would na consequência. If I were you é a forma clássica de dar conselho.",
    "Would também deixa opiniões e pedidos mais diplomáticos. I would suggest soa muito mais gentil do que dar uma ordem.",
  ],
  modals: [
    "Should significa deveria. Use para recomendar algo sem soar mandão. Shouldn't é o negativo, para dizer o que não fazer.",
    "Para mostrar o quanto você tem certeza: must é quase certeza, might é talvez, e can't é impossível. Muito útil para investigar bugs.",
    "Para falar do passado, use should have ou might have mais o particípio. Should have é o que deveria ter sido feito. Might have é o que pode ter acontecido.",
  ],
  passive: [
    "Na voz passiva, o foco está no que aconteceu, não em quem fez. Use be mais o particípio. É muito comum em relatórios de incidente e notas de release.",
    "Para algo que já aconteceu e importa agora, use has been ou have been mais o particípio, como the fix has been deployed.",
    "Para algo que vai acontecer, use will be mais o particípio. Por exemplo, a API será descontinuada em junho.",
  ],
  phrasal: [
    "Phrasal verbs são verbos com uma partícula que muda o sentido. Look into é investigar. Figure out é descobrir. Nativos usam isso o tempo todo.",
    "Set up é configurar. Roll back é reverter um deploy. Roll out é liberar uma funcionalidade aos poucos.",
    "Come up with é ter uma ideia. Run out of é ficar sem alguma coisa, como tempo ou dinheiro.",
  ],
  tradeoffs: [
    "Toda decisão técnica tem vantagens e desvantagens. The upside is apresenta o lado bom. The downside is apresenta o lado ruim.",
    "Para comparar duas opções, use whereas, que significa enquanto, ou on the other hand, que significa por outro lado.",
    "Para fechar a decisão com critério, diga do que ela depende com it depends on, e decida com given, que significa considerando.",
  ],
  hedging: [
    "Em nível avançado, você expressa opiniões firmes sem soar agressivo. I'd argue e it seems to me apresentam seu ponto como argumento, não como verdade absoluta.",
    "Para sugerir algo, use it might be worth, que significa talvez valha a pena, ou faça uma pergunta como have we considered. Isso abre espaço para discussão.",
    "Admitir que não tem certeza mostra honestidade. I'm not entirely sure, but, e as far as I know, deixam claro o que você sabe e o que não sabe.",
  ],
  feedback: [
    "Feedback bom começa por um fato concreto: o que aconteceu, quando e onde. Nunca fale da personalidade da pessoa.",
    "Depois do fato, mostre o impacto no time ou no produto. Assim a pessoa entende por que aquilo importa.",
    "Termine pedindo, não mandando. Going forward, could you, e uma pergunta sobre o que a pessoa acha, transformam a crítica em acordo.",
  ],
  connectors: [
    "However significa porém e normalmente começa a frase, seguido de vírgula. Despite significa apesar de e vem com um substantivo, como despite the delay.",
    "Therefore e as a result mostram consequência: por isso, como resultado. Deixam explicações técnicas lógicas e profissionais.",
    "Vírgula mais which comenta a frase inteira que veio antes. Em português, seria o que: removemos o lock, o que resolveu o deadlock.",
  ],
  idioms: [
    "On the same page significa estar alinhado. Touch base significa conversar rapidinho para alinhar algo.",
    "Low-hanging fruit é o ganho fácil, a fruta mais baixa da árvore. Move the needle é causar uma diferença real no resultado.",
    "Ballpark é uma estimativa por alto. Take it with a grain of salt significa não levar ao pé da letra.",
  ],
  presenting: [
    "Para abrir uma reunião, diga o objetivo e convide as pessoas a acompanhar com let me walk you through, que significa deixa eu mostrar passo a passo.",
    "Para guiar a conversa, use moving on to para mudar de assunto, e let's park that para deixar um tema para depois sem ignorar ninguém.",
    "Para fechar, resuma com to wrap up e diga os próximos passos. Todo mundo sai da reunião sabendo o que fazer.",
  ],
  inversion: [
    "Em inglês formal, para dar ênfase, você inverte a ordem da frase, como numa pergunta. Not only did it fix the bug. Repare no did antes do it.",
    "Com rarely e never no início da frase, também acontece a inversão: rarely do we see, never have we had. Soa forte em apresentações.",
    "Had we known é uma forma formal de if we had known. E should you need é uma forma educada de if you need.",
  ],
  subjunctive: [
    "Depois de recommend that ou suggest that, o verbo fica na forma básica, sem S, mesmo com ele ou ela. I recommend that she read, e não reads.",
    "O mesmo vale para it's essential that e it's vital that: o verbo fica na forma básica. The data be encrypted, e não is encrypted.",
    "Em hipóteses formais, use were para todas as pessoas: if I were you. Were it to, sem if, é ainda mais formal.",
  ],
  nuance: [
    "Affect é o verbo, afetar. Effect é o substantivo, o efeito. Nativos também confundem, então acertar isso chama atenção.",
    "Ensure significa garantir. Insure é fazer seguro. Mitigate é reduzir um risco ou um problema.",
    "Fewer é para coisas que você conta, como bugs e pessoas. Less é para o que não se conta, como tempo e memória.",
  ],
  persuasion: [
    "Para convencer pessoas de negócio, traduza a tecnologia em valor: dinheiro, tempo ou clientes. What this means for the business is liga as duas coisas.",
    "Antecipe as objeções antes que alguém fale. You might be thinking mostra que você já pensou nos riscos.",
    "Termine pedindo a decisão de forma clara: I'd make the case that, e so what I'm asking for is, dizem exatamente o que você precisa.",
  ],
  register: [
    "O mesmo pedido muda de tom conforme a pessoa. Can you é casual, could you é educado, e would you mind é o mais formal.",
    "No Slack com o time, seja curto e informal. Num e-mail para cliente, escreva frases completas e mais formais.",
    "Para recusar algo, com colegas um sorry, I can't basta. Num contexto formal, use unfortunately, I won't be able to.",
  ],
  immigration: [
    "Na imigração dos Estados Unidos, o oficial faz perguntas curtas sobre o motivo da viagem e quanto tempo você vai ficar. Responda de forma curta, direta e verdadeira.",
    "Tenha as respostas prontas: o motivo da viagem, onde vai ficar e quando volta. Datas usam on, como on the 15th.",
    "Se der problema no voo, você vai ouvir delayed para atrasado, canceled para cancelado e layover para escala. Missed my connection significa perdi a conexão.",
  ],
  smalltalk: [
    "How's it going e what's up são cumprimentos, não perguntas de verdade. Responda curto, good ou not much, e devolva a pergunta.",
    "Os assuntos seguros são clima, fim de semana, esportes, comida e viagens. Nos Estados Unidos, evite salário e política no primeiro papo.",
    "Para encerrar com educação, diga I'll let you go ou good talking to you. Assim você sai da conversa sem parecer apressado.",
  ],
  phrasals: [
    "No trabalho, figure out é descobrir como resolver, follow up é retomar um assunto, e come up with é ter uma ideia.",
    "Com pessoas, catch up é colocar o papo em dia, get along é se dar bem, e run into é encontrar alguém por acaso.",
    "No dia a dia, end up é acabar fazendo algo, show up é aparecer, e look forward to é aguardar ansioso. Depois de look forward to, o verbo vem com I N G.",
  ],
  usidioms: [
    "No worries é sem problema. My bad é foi mal. Sounds good é combinado. São respostas que você vai ouvir o dia inteiro.",
    "Para topar um convite, diga I'm down. Para recusar sem fechar a porta, peça a rain check, que significa deixar para a próxima.",
    "Bucks é a gíria para dólares, e a grand é mil dólares. Twenty bucks são vinte dólares.",
  ],
  traps: [
    "Falsos cognatos enganam brasileiros. Actually é na verdade. Pretend é fingir. E na porta, push é empurrar, não puxar.",
    "Em inglês você é a sua idade: I'm thirty. Para quanto tempo mora ou trabalha em algum lugar, use I've lived ou I've worked, com for.",
    "Erros que entregam o brasileiro: diga I agree, nunca I am agree. It depends on, nunca of. E discuss já significa discutir sobre, então não use about.",
  ],
}

// Termo (Wordle-style) in English: one 5-letter word per day.
// ANSWERS: "word|significado" — common words a Brazilian dev should know (the daily answer comes from here).
// EXTRA: more valid guesses (common 5-letter English words). Words from the app's content are added too.
const A = `
about|sobre
above|acima
actor|ator
admin|administrador
adult|adulto
after|depois
again|de novo
agent|agente
agree|concordar
ahead|à frente
alarm|alarme
album|álbum
alert|alerta
alive|vivo
allow|permitir
alone|sozinho
along|ao longo
alter|alterar
among|entre
anger|raiva
angle|ângulo
angry|bravo
apple|maçã
apply|candidatar-se, aplicar
array|array, lista
aside|de lado
asset|ativo, recurso
audio|áudio
avoid|evitar
award|prêmio
aware|ciente
badge|crachá, selo
basic|básico
batch|lote
beach|praia
begin|começar
being|ser
below|abaixo
bench|banco (de praça)
birth|nascimento
black|preto
blame|culpar
blank|em branco
block|bloquear
board|quadro, diretoria
boost|impulsionar
brain|cérebro
brand|marca
bread|pão
break|pausa, quebrar
brief|breve
bring|trazer
broad|amplo
brown|marrom
build|construir
buyer|comprador
cable|cabo
cache|cache
candy|doce
carry|carregar
catch|pegar
cause|causa
chain|corrente
chair|cadeira
chart|gráfico
cheap|barato
check|verificar
chest|baú, peito
chief|chefe
child|criança
claim|reivindicar
class|classe, aula
clean|limpo
clear|claro
click|clicar
client|cliente
climb|escalar
clock|relógio
close|fechar
cloud|nuvem
coach|treinador
coast|costa
count|contar
court|tribunal, quadra
cover|cobrir
crash|travar, cair
cream|creme
crowd|multidão
daily|diário
dance|dançar
debug|depurar
delay|atraso
depth|profundidade
dirty|sujo
doubt|dúvida
draft|rascunho
drama|drama
dream|sonho
dress|vestido
drink|beber
drive|dirigir
early|cedo
earth|terra
eight|oito
email|e-mail
empty|vazio
enemy|inimigo
enjoy|aproveitar
enter|entrar
entry|entrada
equal|igual
error|erro
event|evento
every|cada
exact|exato
exist|existir
extra|extra
faith|fé
false|falso
fault|culpa, falha
fetch|buscar
field|campo
fight|briga, lutar
final|final
first|primeiro
fixed|corrigido
flag|bandeira
flash|flash
float|flutuar
floor|chão, andar
focus|foco
force|força
frame|quadro, moldura
fresh|fresco
front|frente
fruit|fruta
funny|engraçado
giant|gigante
glass|vidro, copo
grade|nota
grant|conceder
graph|grafo, gráfico
great|ótimo
green|verde
group|grupo
guard|guarda
guess|chutar, palpite
guest|convidado
guide|guia
happy|feliz
heart|coração
heavy|pesado
hello|olá
horse|cavalo
hotel|hotel
house|casa
human|humano
image|imagem
index|índice
inner|interno
input|entrada
issue|problema
joint|conjunto
judge|juiz
juice|suco
label|rótulo
large|grande
later|depois
laugh|rir
layer|camada
learn|aprender
leave|sair
legal|jurídico
level|nível
light|luz, leve
limit|limite
local|local
logic|lógica
lucky|sortudo
lunch|almoço
major|principal
maker|criador
march|março, marchar
match|partida, combinar
maybe|talvez
media|mídia
merge|mesclar
metal|metal
meter|medidor
might|poder (talvez)
minor|menor
model|modelo
money|dinheiro
month|mês
mouse|mouse, rato
mouth|boca
movie|filme
music|música
never|nunca
night|noite
noise|barulho
north|norte
novel|romance, novo
nurse|enfermeiro
ocean|oceano
offer|oferta
often|frequentemente
order|pedido, ordem
other|outro
owner|dono
paint|pintar
panel|painel
paper|papel
party|festa
patch|correção
pause|pausar
peace|paz
phase|fase
phone|telefone
photo|foto
piece|pedaço
pilot|piloto
pitch|apresentação, arremesso
pixel|pixel
pizza|pizza
place|lugar
plain|simples
plane|avião
plant|planta
plate|prato
point|ponto
power|poder, energia
press|apertar
price|preço
pride|orgulho
print|imprimir
prior|anterior
prize|prêmio
proof|prova
proud|orgulhoso
query|consulta
quick|rápido
quiet|quieto
quite|bastante
quote|citação, orçamento
radio|rádio
raise|aumento
range|faixa
rapid|rápido
ratio|proporção
reach|alcançar
react|reagir
ready|pronto
reply|responder
right|certo, direita
river|rio
robot|robô
round|rodada, redondo
route|rota
rural|rural
salad|salada
scale|escalar, escala
scene|cena
scope|escopo
score|pontuação
sense|sentido
serve|servir
seven|sete
shape|forma
share|compartilhar
sharp|afiado
sheet|folha, planilha
shift|turno
shirt|camisa
shock|choque
short|curto
skill|habilidade
sleep|dormir
slide|slide
small|pequeno
smart|inteligente
smile|sorrir
solid|sólido
solve|resolver
sorry|desculpa
sound|som
south|sul
space|espaço
speak|falar
speed|velocidade
spend|gastar
split|dividir
sport|esporte
staff|equipe
stage|etapa, palco
stack|pilha
stand|ficar de pé
start|começar
state|estado
steam|vapor
stock|estoque, ação
stone|pedra
store|loja, guardar
storm|tempestade
story|história
study|estudar
style|estilo
sugar|açúcar
suite|suíte
sweet|doce
table|mesa, tabela
taste|gosto
teach|ensinar
thank|agradecer
theme|tema
thing|coisa
think|pensar
third|terceiro
three|três
throw|jogar, lançar
tired|cansado
title|título
today|hoje
token|token
topic|assunto
total|total
touch|tocar
tough|difícil, duro
tower|torre
track|acompanhar, trilha
trade|troca, comércio
train|trem, treinar
treat|tratar
trend|tendência
trial|teste, julgamento
trust|confiança
truth|verdade
twice|duas vezes
under|embaixo
union|união
until|até
upper|superior
upset|chateado
usage|uso
usual|comum
valid|válido
value|valor
video|vídeo
visit|visitar
voice|voz
waste|desperdício
watch|assistir, relógio
water|água
wheel|roda
where|onde
while|enquanto
white|branco
whole|inteiro
woman|mulher
world|mundo
worry|preocupar
worth|valor, vale a pena
write|escrever
wrong|errado
yield|render
young|jovem
`

const EXTRA = `
abide able aback abbey abort acorn acted adapt added adopt affix afoot afraid again agile aging aglow aided aisle alarm alias alien align alike alley allot alloy aloft aloud alpha altar amber amend amiss ample amuse angel ankle annex annoy apart apron arena argue arise armor aroma arose arrow ashes asked atlas attic audit aunt avert awake awful bacon badly bagel baker balls banjo baron based basin basis batch bathe beard beast began beige belly bench berry bible bikes bills birds bison blade bland blast blaze bleak bleed blend bless blind blink bliss bloom blown blues bluff blunt blurt blush boast bonus booth booze boots bored bound bowel boxer brace braid brass brave bribe brick bride brisk broke brook broom broth brush buddy budge bulge bully bunch bunny burst cabin cadet camel canal canoe cards cargo carol cause cease chalk champ chant chaos charm chase cheek cheer chess chick chili chill choir chord chore civic civil clamp clash clasp claws clerk cliff cling cloak clown clubs clump coins colon color comet comic coral corny couch cough could crack craft cramp crane crate crave crawl crazy creek creep crest crime crisp crops cross crown crude cruel crumb crush crust cubic curve cycle daddy dairy daisy dated deals dealt decay decor decoy deity delta dense dents depot derby desks devil diary diner dirty disco ditch diver dizzy dodge doing dolls donor donut doors dough downs dozen drain drank drawn drawl dread dried drift drill drove drown drums drunk dryer ducks dunes dusty dwell eager eagle earns eased eaten edges elbow elder elect elite embed ember emoji enact endow endup ensue epoch equip erase erode essay ethic evade evoke exams excel exile expat faced facet facts faded fairy false fancy farms fatal favor feast fence ferry fever fewer fiber fifth fifty filed files filly filth finch finds fired firms fishy fixer fizzy flair flake flame flank flaps flare flask fleet flesh flies fling flirt flock flood flour flown fluid fluke flush flute foamy folks fonts forge forms forth forty forum fours foyer frail fraud freak freed fried frogs frost froze fully fumes fungi fuzzy gains gamer games gamma gauge gears geese genre giddy gifts gigs girls glare gleam glide globe gloom glory glove gloat glued goals goats going goods goose gorge gowns grace grain grand grape grasp grass grave gravy graze greed greet grief grill grind grips groan groom gross grove grown grunt guilt guise habit hairs handy harsh haste hatch haunt haven havoc hazel heads heard hedge hefty heirs hello helps hence herbs hertz hikes hills hinge hints hippo hobby holds holes holly homes honey honor hooks hopes horns hosts hotel hound hours hover howdy hunch hurry husky hutch hyper icing icons ideal ideas idiom idiot igloo imply inbox inlet ivory jazzy jeans jelly jewel jiffy jobs joins joker jolly jumbo jumps juror kayak kebab keeps kicks kills kinds kings kiosk kites knack knead kneel knelt knife knobs knock knots known koala labor laced lakes lambs lamps lance lands lanes lapse laser lasso latch latte lawns leads leaks leant leapt lease least ledge lemon lends lever liked likes lilac limbs linen liner links lions lists liter liver lives llama loads loans lobby lodge lofty login loops loose lords lorry loser lotus loved lover lower loyal lumpy lunar lungs lurch lyric macho macro magic mains maize mango manor maple marks marry marsh masks mates maths mayor meals means meant medal melon memes mends menus mercy merit merry messy midst mills mimic mince minds mines mints minus mixed mixer moist moldy money mood moody moose moral motel motor motto mould mound mount mourn moved mover mower muddy mules mural murky mushy muted myths nails naive named names nanny nasty naval needs nerdy nerve nests newer newly nexus nicer niche nifty ninja ninth noble nodes nooks norms notch noted notes nouns nudge nylon oasis occur odder odors offer oiled olive omega onion onset opera opted optic orbit organ outdo outer ovens owned oxide ozone paced packs pages pairs palms panda panic pants parks parts pasta paste patio peach pearl pedal penny perch peril perks pesky petal phony piano picks piled pills pinch pines pinky pipes pique pizza plaid plank plays plaza plead pleat plots pluck plugs plums plush poems poets polar poles polls ponds pools porch posed poses posts pouch pound prank prawn prays press pried prime prism prone props prose prowl prune pulse pumps punch pupil puppy purse pushy quack quail quake quart queen quest queue quilt quirk quota rabbi races racks radar rails rainy rally ranch randy ranks rated rates raven razor reads realm reams rebel recap refer reign relax relay relic remix renew rents repay reset resin retro rider ridge rifle rigid rinse ripen risen risky rival roads roast robin rocks rocky rodeo rogue roles rolls roman roofs rooms roost roots ropes roses rough rover royal rugby ruins ruled ruler rumor runny rusty sadly safer saint salon salsa salty sandy sauce sauna saved saver scarf scary scent scoop scout scrap screw scrub seams seats seeds seize sends serum setup shade shady shake shaky shall shame shark shave sheep shelf shell shield shine shiny ships shoes shook shoot shore shout shown shows shrug shyly sided sides siege sight sigma signs silky silly since siren sixth sixty sized skate skies skirt skull slang slate slave sleek sleet slept slice slick slime slope slots sloth slump slung smash smell smelt smoke snack snail snake snare sneak sniff snore snowy soapy sober socks sofas soggy solar sonic souls soups spare spark spawn spear specs spell spice spicy spied spike spill spine spite splat spoke spoon spore spots spray spree squad squat stain stair stake stale stalk stall stamp stank stare stark stars steak steel steep steer stems steps stern stick stiff still sting stink stint stool stoop stops storm stout stove strap straw stray strip stuck stuff stump stung stunt suave sugar suits sunny super surge swamp swank swarm swear sweat sweep swell swept swift swing swirl swoop sword swore sworn syrup taboo tacky taken tales talks tally tamed tango tanks tapes tapir tardy tasks tasty taxes teams tears teddy teens teeth tempo tends tenor tense tenth tents terms tests texts thick thief thigh thorn those threw thumb thump tiara tides tiger tight tiles timer times timid tipsy titan toast toddy token tonal toned tones tools tooth torch torso totem towel toxic toyed trace trail tramp traps trash tread trees tribe trick tried trims trips troll troop trout truce truck truly trunk tubes tulip tumor tuned tunes turbo turns tutor tweak tweet twins twist typed types udder ulcer ultra uncle unfit unify unite unity unlit untie unzip urban urged usher utter vague vapor vault vegan veins venue verbs verge verse vibes video views villa vinyl viola viral virus vista vital vivid vocal vodka vogue voter vowel wacky wafer wager wages wagon waist walks walls waltz wants wards wares warns washy wasps watts waved waves waxed weary weave wedge weeds weeks weigh weird wells welsh whale wheat whelp whims whiff whips whirl whisk widen wider widow width wield wilds winds windy wines wings wiped wiper wired wires witch wives woken women woods woody words works worms worse worst would wound woven wrath wreck wrist wrote yacht yards yearn years yeast yells yummy zebra zesty zones
`

export const TERMO_ANSWERS: [string, string][] = A.trim()
  .split('\n')
  .map((l) => l.split('|'))
  .filter((p) => /^[a-z]{5}$/.test(p[0]))
  .map((p) => [p[0], p[1]] as [string, string])

export const TERMO_EXTRA: string[] = EXTRA.split(/\s+/).filter((w) => /^[a-z]{5}$/.test(w))

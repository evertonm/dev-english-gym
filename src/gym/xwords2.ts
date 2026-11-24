// More crossword words: "word|dica em português|clue in English", one per line.
// Letters only, 3 to 9 letters. Duplicates of XWORDS are ignored by the generator.
const RAW = `
apple|Maçã|A red or green fruit
banana|Banana|A long yellow fruit
orange|Laranja|A citrus fruit and a color
bread|Pão|Baked food for sandwiches
cheese|Queijo|Made from milk, great on pizza
butter|Manteiga|Yellow spread for bread
egg|Ovo|Chickens lay it
rice|Arroz|White grain, big in Brazil
beans|Feijão|Brazilians eat it with rice
chicken|Frango|A common bird you can eat
beef|Carne bovina|Meat from cows
pork|Carne de porco|Meat from pigs
fish|Peixe|It swims in the water
salad|Salada|Mixed vegetables in a bowl
soup|Sopa|Hot liquid food
sugar|Açúcar|It makes food sweet
salt|Sal|White seasoning from the sea
pepper|Pimenta|Black spice
water|Água|You drink it every day
juice|Suco|Drink made from fruit
milk|Leite|White drink from cows
tea|Chá|Hot drink made with leaves
beer|Cerveja|Alcoholic drink at happy hour
wine|Vinho|Drink made from grapes
breakfast|Café da manhã|The first meal of the day
dinner|Jantar|The evening meal
snack|Lanche|A small bite between meals
dessert|Sobremesa|Sweet food after a meal
cake|Bolo|Sweet food for birthdays
cookie|Biscoito|A small sweet baked treat
fork|Garfo|You eat with it, it has points
knife|Faca|You cut with it
spoon|Colher|You eat soup with it
plate|Prato|You put food on it
glass|Copo|You drink from it
menu|Cardápio|List of dishes in a restaurant
waiter|Garçom|He brings your food
kitchen|Cozinha|Room where you cook
cook|Cozinhar|Make food
bake|Assar|Cook in an oven
fry|Fritar|Cook in hot oil
boil|Ferver|Heat water until bubbles
taste|Gosto, provar|Try the flavor
hungry|Com fome|Wanting food
thirsty|Com sede|Wanting a drink
house|Casa|A building where you live
room|Quarto, cômodo|A space inside a house
bedroom|Quarto de dormir|Where you sleep
bathroom|Banheiro|Room with a shower
door|Porta|You open it to enter
window|Janela|Glass you look through
floor|Chão, andar|You walk on it
wall|Parede|Side of a room
roof|Telhado|Top of a house
stairs|Escada|Steps between floors
garden|Jardim|Outdoor place with plants
chair|Cadeira|You sit on it
table|Mesa|You eat or work on it
desk|Escrivaninha|Work table
bed|Cama|You sleep on it
sofa|Sofá|Long soft seat
lamp|Abajur, lâmpada|It gives light
mirror|Espelho|You see yourself in it
shower|Chuveiro|You wash under it
towel|Toalha|You dry yourself with it
soap|Sabonete|You wash with it
clock|Relógio de parede|It shows the time on a wall
watch|Relógio de pulso|Time on your wrist
key|Chave|It opens a lock
neighbor|Vizinho|Person who lives next door
city|Cidade|A big town
street|Rua|Cars drive on it
avenue|Avenida|A wide street
bridge|Ponte|It crosses a river
park|Parque|Green public area
square|Praça|Open area in a city
store|Loja|Place where you buy things
market|Mercado|Where you buy food
mall|Shopping|Big place with many stores
bank|Banco|Place for money
church|Igreja|Religious building
school|Escola|Where kids study
hospital|Hospital|Where doctors work
pharmacy|Farmácia|Where you buy medicine
museum|Museu|Place with art and history
library|Biblioteca|Place with many books
office|Escritório|Where people work
building|Prédio|A tall structure
corner|Esquina|Where two streets meet
traffic|Trânsito|Many cars on the road
bus|Ônibus|Big vehicle for many people
train|Trem|It runs on rails
subway|Metrô|Underground train
car|Carro|Vehicle with four wheels
bike|Bicicleta|Two wheels and pedals
taxi|Táxi|Car you pay to ride
truck|Caminhão|Big vehicle for cargo
boat|Barco|It floats on water
plane|Avião|It flies
driver|Motorista|Person who drives
road|Estrada|Path for cars
map|Mapa|It shows where things are
north|Norte|Opposite of south
south|Sul|Opposite of north
east|Leste|Where the sun rises
west|Oeste|Where the sun sets
left|Esquerda|Opposite of right
right|Direita, certo|Opposite of left
straight|Reto|Go ahead, no turns
near|Perto|Not far
far|Longe|Not near
inside|Dentro|In, not out
outside|Fora|Out, not in
trip|Viagem|A journey
travel|Viajar|Go to other places
tourist|Turista|Visitor on vacation
beach|Praia|Sand and sea
island|Ilha|Land with water around
mountain|Montanha|Very high land
river|Rio|Water flowing to the sea
lake|Lago|Still water with land around
forest|Floresta|Many trees together
desert|Deserto|Dry place with sand
weather|Tempo, clima|Sun, rain, wind today
rain|Chuva|Water falling from clouds
snow|Neve|White frozen rain
wind|Vento|Moving air
cloud|Nuvem|White thing in the sky
sun|Sol|Star that gives us light
moon|Lua|It shines at night
star|Estrela|It shines in the night sky
hot|Quente|High temperature
cold|Frio|Low temperature
warm|Morno, agradável|Pleasantly hot
storm|Tempestade|Strong rain and wind
summer|Verão|The hottest season
winter|Inverno|The coldest season
spring|Primavera|Season with flowers
autumn|Outono|Season when leaves fall
season|Estação do ano|Summer or winter, for example
morning|Manhã|Early part of the day
afternoon|Tarde|After lunch, before evening
evening|Noite (início)|End of the day
night|Noite|When it is dark
noon|Meio-dia|Twelve o'clock in the day
midnight|Meia-noite|Twelve o'clock at night
hour|Hora|Sixty minutes
minute|Minuto|Sixty seconds
second|Segundo|A very short time
year|Ano|Twelve months
monday|Segunda-feira|First workday of the week
tuesday|Terça-feira|Day after Monday
wednesday|Quarta-feira|Middle of the workweek
thursday|Quinta-feira|Day before Friday
friday|Sexta-feira|Last workday of the week
saturday|Sábado|First day of the weekend
sunday|Domingo|Last day of the weekend
january|Janeiro|First month
february|Fevereiro|Shortest month
march|Março|Third month
april|Abril|Fourth month
june|Junho|Sixth month
july|Julho|Seventh month
august|Agosto|Eighth month
october|Outubro|Tenth month
november|Novembro|Eleventh month
december|Dezembro|Last month of the year
holiday|Feriado|Day off for everyone
vacation|Férias|Time off to rest or travel
birthday|Aniversário|The day you were born
party|Festa|Celebration with friends
gift|Presente|Something you give someone
family|Família|Parents, kids, siblings
mother|Mãe|Female parent
father|Pai|Male parent
brother|Irmão|Male sibling
sister|Irmã|Female sibling
son|Filho|Male child
daughter|Filha|Female child
husband|Marido|Married man
wife|Esposa|Married woman
friend|Amigo|Person you like and trust
baby|Bebê|Very young child
child|Criança|Young person
people|Pessoas|More than one person
woman|Mulher|Adult female
man|Homem|Adult male
head|Cabeça|Top of your body
face|Rosto|Front of your head
eye|Olho|You see with it
ear|Orelha|You hear with it
nose|Nariz|You smell with it
mouth|Boca|You eat and talk with it
tooth|Dente|White and hard, in your mouth
hair|Cabelo|It grows on your head
neck|Pescoço|Between head and body
arm|Braço|From shoulder to hand
hand|Mão|It has five fingers
finger|Dedo|Part of your hand
leg|Perna|You walk with it
foot|Pé|At the end of your leg
back|Costas, voltar|Behind your body
heart|Coração|It pumps blood
health|Saúde|Being well
doctor|Médico|Person who treats sick people
nurse|Enfermeiro|Helps doctors and patients
medicine|Remédio|You take it when sick
sick|Doente|Not healthy
pain|Dor|It hurts
fever|Febre|High body temperature
cough|Tosse|Noise when you have a cold
sleep|Dormir|Rest at night
tired|Cansado|Needing rest
happy|Feliz|Feeling good
sad|Triste|Not happy
angry|Bravo|Very upset
afraid|Com medo|Scared
nervous|Nervoso|Anxious before something
calm|Calmo|Relaxed, peaceful
bored|Entediado|Nothing interesting to do
excited|Animado|Very happy about something
proud|Orgulhoso|Happy with what you did
worried|Preocupado|Thinking about problems
surprised|Surpreso|You didn't expect it
confident|Confiante|Sure of yourself
shy|Tímido|Quiet with new people
friendly|Simpático|Nice to others
funny|Engraçado|It makes you laugh
smart|Inteligente|Clever
kind|Gentil|Nice and caring
honest|Honesto|Tells the truth
lazy|Preguiçoso|Doesn't want to work
polite|Educado|Says please and thanks
rude|Grosseiro|Not polite
brave|Corajoso|Not afraid
strong|Forte|Powerful
weak|Fraco|Not strong
young|Jovem|Not old
old|Velho|Not young
new|Novo|Not old
big|Grande|Not small
small|Pequeno|Not big
long|Longo|Not short
short|Curto, baixo|Not long
tall|Alto|A person with height
heavy|Pesado|Not light
light|Leve, luz|Not heavy
clean|Limpo|Not dirty
dirty|Sujo|Not clean
empty|Vazio|Nothing inside
full|Cheio|No space left
open|Aberto|Not closed
closed|Fechado|Not open
quiet|Silencioso|Not loud
loud|Barulhento|Not quiet
rich|Rico|With a lot of money
poor|Pobre|Without much money
true|Verdadeiro|Not false
false|Falso|Not true
same|Mesmo|Not different
different|Diferente|Not the same
important|Importante|It matters a lot
possible|Possível|It can happen
simple|Simples|Not complicated
correct|Correto|Right, no errors
wrong|Errado|Not right
beautiful|Bonito|Very nice to look at
ugly|Feio|Not beautiful
strange|Estranho|Unusual, weird
famous|Famoso|Known by many people
free|Grátis, livre|It costs nothing
money|Dinheiro|You pay with it
cash|Dinheiro vivo|Bills and coins
coin|Moeda|Round metal money
card|Cartão|Plastic for payment
pay|Pagar|Give money for something
buy|Comprar|Get something with money
sell|Vender|Give something for money
spend|Gastar|Use money
save|Economizar, salvar|Keep money for later
earn|Ganhar (salário)|Get money from work
borrow|Pegar emprestado|Take and give back later
lend|Emprestar|Give for a while
owe|Dever (dinheiro)|Need to pay back
discount|Desconto|A lower price
sale|Liquidação, venda|When prices are lower
bill|Conta, fatura|Paper that says how much to pay
tax|Imposto|Money paid to the government
invoice|Nota fiscal|A bill for services
profit|Lucro|Money you earn after costs
loss|Prejuízo, perda|Losing money
company|Empresa|A business
startup|Startup|A new tech company
customer|Cliente|Person who buys from you
product|Produto|Something a company sells
service|Serviço|Work done for a customer
market|Mercado|Where buying and selling happens
sales|Vendas|Selling team or results
partner|Sócio, parceiro|Someone who works with you
investor|Investidor|Puts money in a company
growth|Crescimento|Getting bigger
strategy|Estratégia|A plan to win
vision|Visão|Long-term picture
mission|Missão|Main purpose of a company
value|Valor|How important something is
quality|Qualidade|How good something is
deliver|Entregar|Give the finished work
launch|Lançar|Release to the public
schedule|Agenda, cronograma|A plan with times
agenda|Pauta|List of topics for a meeting
summary|Resumo|A short version
report|Relatório|Document with results
slide|Slide|One page of a presentation
chart|Gráfico|Picture of data
metric|Métrica|A number you measure
target|Meta, alvo|What you aim for
result|Resultado|What you get at the end
progress|Progresso|Moving forward
priority|Prioridade|Most important first
task|Tarefa|A piece of work
project|Projeto|Planned piece of work
process|Processo|Steps to do something
policy|Política, regra|Company rule
approval|Aprovação|Saying yes officially
decision|Decisão|A choice
opinion|Opinião|What you think
argument|Argumento|A reason for your point
proposal|Proposta|An idea you suggest
solution|Solução|Answer to a problem
problem|Problema|Something to solve
challenge|Desafio|A hard task
mistake|Erro|Something done wrong
lesson|Lição, aula|Something you learn
advice|Conselho|A suggestion to help
help|Ajuda|Support someone
thanks|Obrigado|Word of gratitude
sorry|Desculpa|Word to apologize
please|Por favor|Magic word when asking
welcome|Bem-vindo|Greeting to someone new
goodbye|Tchau|Said when leaving
hello|Olá|Said when meeting
promotion|Promoção|Moving to a higher job
bonus|Bônus|Extra money
benefit|Benefício|Extra perk of a job
vacancy|Vaga|An open job
candidate|Candidato|Person applying for a job
recruiter|Recrutador|Person who finds candidates
onboard|Integrar|Start a new hire
mentor|Mentor|Experienced person who guides
intern|Estagiário|Student working to learn
freelance|Autônomo|Works for many clients
overtime|Hora extra|Work after normal hours
shift|Turno|A period of work
quit|Pedir demissão|Leave your job
fire|Demitir, fogo|End someone's job
retire|Aposentar|Stop working because of age
deadline|Prazo|Last day to deliver
standup|Daily|Short daily team meeting
retro|Retrospectiva|Meeting to review the sprint
demo|Demonstração|Showing how it works
roadmap|Roteiro, plano|Plan of future features
milestone|Marco|An important point in a project
blocker|Impedimento|Something stopping your work
handoff|Passagem de bastão|Giving work to someone else
code|Código|What programmers write
coder|Programador|Person who writes code
software|Software|Programs and apps
hardware|Hardware|Physical computer parts
cloud|Nuvem|Servers on the internet
network|Rede|Connected computers
internet|Internet|The global network
website|Site|Pages on the web
browser|Navegador|You open websites with it
app|Aplicativo|Program on a phone
device|Dispositivo|Phone, tablet or laptop
tablet|Tablet|Big touch screen device
camera|Câmera|It takes photos
battery|Bateria|It powers your phone
charger|Carregador|It refills the battery
cable|Cabo|Wire to connect devices
wifi|Wi-Fi|Wireless internet
data|Dados|Information stored by apps
file|Arquivo|A document on a computer
folder|Pasta|It holds files
image|Imagem|A picture
video|Vídeo|Moving pictures
audio|Áudio|Sound
font|Fonte|Style of letters
color|Cor|Red, blue or green
button|Botão|You click it
icon|Ícone|Small picture on a screen
menu|Menu|List of options
link|Link|You click it to go to a page
search|Busca|Look for something
filter|Filtro|Show only some items
sort|Ordenar|Put in order
click|Clicar|Press the mouse
scroll|Rolar|Move the page up or down
swipe|Deslizar|Move your finger on a screen
type|Digitar|Write with a keyboard
copy|Copiar|Duplicate
paste|Colar|Put copied text
delete|Apagar|Remove
undo|Desfazer|Go back one step
redo|Refazer|Do again
save|Salvar|Keep your changes
print|Imprimir|Put on paper
install|Instalar|Put software on a device
setup|Configuração|How it is set up
config|Configuração|Settings file
token|Token|Secret key for access
secret|Segredo|Something hidden
access|Acesso|Permission to enter
admin|Administrador|User with full access
account|Conta|Your user profile
profile|Perfil|Your public info
avatar|Avatar|Your profile picture
message|Mensagem|Text you send
chat|Bate-papo|Talk by text
inbox|Caixa de entrada|Where emails arrive
spam|Spam|Unwanted messages
notify|Notificar|Send an alert
reply|Responder|Answer a message
forward|Encaminhar|Send to someone else
attach|Anexar|Add a file to an email
draft|Rascunho|Not finished text
signature|Assinatura|Your name at the end
privacy|Privacidade|Keeping data private
security|Segurança|Protection from attacks
hacker|Hacker|Person who breaks into systems
virus|Vírus|Bad program
backup|Backup|Copy to restore later
restore|Restaurar|Bring back from backup
encrypt|Criptografar|Lock data with a key
domain|Domínio|Name of a website
host|Hospedar|Run a site on a server
container|Contêiner|Packaged app with Docker
cluster|Cluster|Group of servers
docker|Docker|Tool for containers
kernel|Kernel|Core of an operating system
linux|Linux|Open source operating system
script|Script|Small program that automates
terminal|Terminal|Window for commands
command|Comando|Instruction you type
syntax|Sintaxe|Rules of a language
compile|Compilar|Turn code into a program
debug|Depurar|Find and fix bugs
refactor|Refatorar|Improve code without new features
pipeline|Pipeline|Automated build steps
endpoint|Endpoint|URL of an API
request|Requisição|Call to a server
response|Resposta|What the server returns
payload|Carga útil|Data sent in a request
header|Cabeçalho|Extra info in a request
cookie|Cookie|Small data saved by sites
session|Sessão|Time while logged in
schema|Esquema|Structure of the data
table|Tabela|Rows and columns in a database
column|Coluna|Vertical part of a table
row|Linha|Horizontal part of a table
key|Chave|Unique id in a table
object|Objeto|Thing with properties in code
class|Classe|Blueprint for objects
method|Método|Function inside a class
module|Módulo|Part of a program
package|Pacote|Code you install with npm
version|Versão|Number of a release
patch|Correção pequena|Small fix release
hotfix|Correção urgente|Urgent fix in production
merge|Mesclar|Combine changes
fork|Fork|Copy of a repository
clone|Clonar|Copy a repo to your machine
pull|Puxar|Get changes from remote
push|Enviar|Send commits to remote
diff|Diferença|Changes between versions
staging|Homologação|Test environment before prod
prod|Produção|Live environment
uptime|Tempo no ar|Time the system is working
latency|Latência|Delay in a response
traffic|Tráfego|Requests to a site
scale|Escalar|Grow to handle more users
monitor|Monitorar|Watch the system
dashboard|Painel|Screen with metrics
incident|Incidente|Something broke in prod
oncall|Plantão|Responsible for alerts tonight
pager|Pager|Device that wakes you for alerts
timeout|Tempo esgotado|Request took too long
retry|Tentar de novo|Try again after failure
async|Assíncrono|Not waiting for each step
thread|Thread|Line of execution
memory|Memória|Where data lives while running
storage|Armazenamento|Where data is kept
disk|Disco|Storage device
cpu|Processador|Brain of the computer
pixel|Pixel|Tiny dot on a screen
render|Renderizar|Draw on the screen
component|Componente|Reusable part of the UI
state|Estado|Data that can change in an app
props|Propriedades|Inputs of a React component
hook|Hook|React function like useState
style|Estilo|How it looks
theme|Tema|Light or dark look
dark|Escuro|Opposite of light
mode|Modo|A way of working
toggle|Alternar|Switch on or off
modal|Modal|Popup window
form|Formulário|Fields to fill in
field|Campo|One input in a form
input|Entrada|Where you type
output|Saída|What comes out
token|Token|Piece of text for AI
prompt|Prompt|Instruction to an AI
model|Modelo|Trained AI system
agent|Agente|AI that takes actions
robot|Robô|Machine that does tasks
learn|Aprender|Get new skills
study|Estudar|Learn by reading
practice|Praticar|Do again to improve
improve|Melhorar|Get better
listen|Ouvir|Pay attention to sounds
speak|Falar|Say words
read|Ler|Look at words
write|Escrever|Put words on paper
spell|Soletrar|Say the letters of a word
word|Palavra|Group of letters with meaning
sentence|Frase|Group of words
grammar|Gramática|Rules of a language
accent|Sotaque|How you sound
fluent|Fluente|Speaks easily
native|Nativo|First language speaker
language|Idioma|English or Portuguese
english|Inglês|Language of this app
translate|Traduzir|Change to another language
meaning|Significado|What a word means
example|Exemplo|Something that shows a rule
level|Nível|How advanced you are
score|Pontuação|Points you got
winner|Vencedor|Person who wins
game|Jogo|Something you play
team|Time|Group playing together
player|Jogador|Person who plays
coach|Treinador|Person who trains a team
goal|Gol, meta|Point in soccer
ball|Bola|Round thing for sports
match|Partida|A game between teams
win|Vencer|Be first
lose|Perder|Not win
tie|Empate|Same score
music|Música|Songs and sounds
song|Canção|Music with words
movie|Filme|Story on a screen
series|Série|Show with episodes
book|Livro|Pages with a story
news|Notícias|What happened today
photo|Foto|A picture you take
dance|Dançar|Move to music
sing|Cantar|Make music with your voice
draw|Desenhar|Make a picture with a pen
paint|Pintar|Use color on a wall or canvas
run|Correr|Move very fast on foot
walk|Andar|Move on foot
swim|Nadar|Move in water
jump|Pular|Go up in the air
climb|Escalar|Go up a mountain or wall
drive|Dirigir|Control a car
ride|Andar de (bike)|Go on a bike or horse
fly|Voar|Move in the air
arrive|Chegar|Get to a place
leave|Sair, deixar|Go away
stay|Ficar|Not leave
wait|Esperar|Stay until something happens
start|Começar|Begin
finish|Terminar|End
stop|Parar|Not continue
continue|Continuar|Keep going
try|Tentar|Make an effort
fail|Falhar|Not succeed
succeed|Ter sucesso|Get what you want
remember|Lembrar|Keep in your mind
forget|Esquecer|Not remember
know|Saber, conhecer|Have information
think|Pensar|Use your mind
believe|Acreditar|Think it is true
understand|Entender|Get the meaning
mean|Significar|Have a meaning
need|Precisar|Must have
want|Querer|Wish to have
like|Gostar|Enjoy
love|Amar|Like very much
hate|Odiar|Not like at all
prefer|Preferir|Like more
choose|Escolher|Pick one
decide|Decidir|Make a choice
change|Mudar|Make different
move|Mover, mudar|Change place
bring|Trazer|Carry to here
take|Levar, pegar|Carry away or grab
give|Dar|Hand to someone
send|Enviar|Make something go
receive|Receber|Get something
find|Encontrar|Discover where it is
lose|Perder|Not find anymore
keep|Manter|Not lose
open|Abrir|Make not closed
close|Fechar|Make not open
turn|Virar|Change direction
show|Mostrar|Let someone see
hide|Esconder|Put out of sight
call|Ligar|Phone someone
meet|Conhecer, encontrar|See someone
visit|Visitar|Go to see
invite|Convidar|Ask someone to come
join|Entrar, participar|Become part of
follow|Seguir|Go after
lead|Liderar|Guide a group
manage|Gerenciar|Be in charge of
plan|Planejar|Decide what to do
organize|Organizar|Put in order
prepare|Preparar|Get ready
check|Verificar|Make sure
compare|Comparar|See the differences
measure|Medir|Find the size
count|Contar|Say numbers in order
choose|Escolher|Select
allow|Permitir|Let someone do it
forbid|Proibir|Not allow
promise|Prometer|Say you will do it
refuse|Recusar|Say no
accept|Aceitar|Say yes
apologize|Pedir desculpas|Say sorry
complain|Reclamar|Say you are not happy
suggest|Sugerir|Give an idea
describe|Descrever|Say what it is like
discuss|Discutir|Talk about a topic
argue|Argumentar, brigar|Disagree with words
convince|Convencer|Make someone agree
negotiate|Negociar|Talk to reach a deal
deal|Acordo|An agreement
agreement|Acordo|When both say yes
rule|Regra|What you must follow
law|Lei|Rule of a country
right|Direito|Something you are allowed
duty|Dever|What you must do
career|Carreira|Your work life
dream|Sonho|What you wish for
future|Futuro|Time ahead
past|Passado|Time before now
present|Presente|Now
history|História|Study of the past
science|Ciência|Study of nature
math|Matemática|Numbers and equations
art|Arte|Painting and music
nature|Natureza|Plants and animals
animal|Animal|A living creature
dog|Cachorro|Man's best friend
cat|Gato|Pet that says meow
bird|Pássaro|It has wings and sings
horse|Cavalo|You can ride it
cow|Vaca|It gives milk
tree|Árvore|Tall plant with leaves
flower|Flor|Pretty part of a plant
plant|Planta|It grows in soil
grass|Grama|Green carpet in a park
earth|Terra|Our planet
world|Mundo|All countries
country|País|Brazil or the USA
state|Estado|Texas or São Paulo
capital|Capital|Main city of a country
border|Fronteira|Line between countries
flag|Bandeira|Symbol of a country
culture|Cultura|Habits of a people
custom|Costume|Something people usually do
`

export const XWORDS2: [string, string, string][] = RAW.trim()
  .split('\n')
  .map((l) => l.split('|'))
  .filter((p) => p.length === 3 && /^[a-z]{3,9}$/.test(p[0]))
  .map((p) => [p[0], p[1], p[2]] as [string, string, string])

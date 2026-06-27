import type {
  SleepStoryContent,
  SleepStoryId,
  SleepStoryParagraph,
  SleepStoryParagraphVariant,
} from '../types/sleepStories'

const GENERATED_SLEEP_STORY_CONTENTS = require('../../assets/sleep/sleep_stories_content.json') as Record<
  SleepStoryId,
  SleepStoryContent
>

function paragraphVariant(text: string): SleepStoryParagraphVariant {
  const trimmed = text.trim()
  if (trimmed.startsWith('—') || trimmed.startsWith('- ')) return 'dialogue'
  if (trimmed.startsWith('"') || trimmed.startsWith('“')) return 'thought'
  return 'normal'
}

function parseParagraphs(raw: string): SleepStoryParagraph[] {
  return raw
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((text) => ({
      text,
      variant: paragraphVariant(text),
    }))
}

const STORY_1_BODY = `Todas as noites, quando o Sol desaparecia atrás das montanhas, a Lua acordava devagarinho.

Primeiro, ela abria um olhinho.

Depois, o outro.

Espreguiçava seus raios prateados, ajeitava as nuvens ao redor e subia até o ponto mais alto do céu.

Lá de cima, iluminava os telhados, os caminhos, as árvores e os rios. Também espiava pelas janelas das casas para ver se as crianças já estavam de pijama.

A Lua gostava muito de seu trabalho.

— Boa noite, passarinhos — dizia ela, enquanto as aves se acomodavam nos ninhos.

— Boa noite, coelhinhos — sussurrava, iluminando a entrada das tocas.

— Boa noite, crianças — falava baixinho, deixando um fio de luz sobre cada travesseiro.

Quando a noite terminava, a Lua costumava descer até uma caminha macia, feita de nuvens, e dormir enquanto o Sol cuidava do céu.

Mas, certa manhã, algo diferente aconteceu.

Quando o Sol começou a aparecer, a Lua olhou para o mundo e pensou:

"E se alguém precisar de mim enquanto eu estiver dormindo?"

Ela viu um barquinho navegando no mar, uma coruja voltando para casa e um cachorrinho procurando seu brinquedo no quintal.

— Acho melhor eu ficar acordada só mais um pouquinho — decidiu.

O Sol apareceu, redondo e brilhante.

— Bom dia, Lua! — cumprimentou ele. — Sua cama de nuvens já está pronta.

— Obrigada, Sol, mas hoje não vou dormir. O mundo pode precisar da minha luz.

O Sol achou aquilo estranho, mas não insistiu.

— Está bem. Só não se esqueça de descansar.

A Lua passou o dia inteiro escondida atrás do céu azul. Embora quase ninguém pudesse vê-la, ela continuou observando tudo.

Quando a noite chegou novamente, a Lua estava um pouco cansada.

Mesmo assim, acendeu sua luz e começou seu trabalho.

— Boa noite, passarinhos…

Sua voz saiu mais baixa do que de costume.

— Boa noite, coelhinhos…

Um bocejo enorme interrompeu a frase.

— Boa noi… aaaaah… te, crianças.

Perto dela brilhava Lili, uma estrelinha pequena e curiosa.

— Lua, você está bem? — perguntou Lili.

— Estou ótima — respondeu a Lua, tentando esconder outro bocejo. — Só estou um pouquinho cansada.

— Você dormiu hoje?

— Não. Fiquei cuidando do mundo.

Lili piscou duas vezes, surpresa.

— Mas o Sol já cuida do mundo durante o dia.

— Eu sei, mas pensei que alguém pudesse precisar de mim.

Na segunda noite sem dormir, a Lua começou a se confundir.

Iluminou a toca dos coelhos quando eles já estavam dormindo, esqueceu de clarear o caminho das tartarugas e desejou "bom dia" para uma família que acabava de se deitar.

— Bom dia? — perguntou uma criança pela janela. — Mas ainda é noite!

A Lua ficou envergonhada.

— Desculpe. Acho que me confundi.

Na terceira noite, seu brilho estava tão fraquinho que parecia uma pequena lâmpada quase apagando.

Ela tentou atravessar uma nuvem, mas ficou presa nela.

— Com licença, senhorita Nuvem — pediu a Lua. — Poderia sair do meu caminho?

— Lua… — respondeu a nuvem, dando uma risadinha. — É você quem está em cima de mim.

A Lua olhou para baixo.

A Nuvem tinha razão.

Ela estava tão cansada que nem sabia mais onde estava.

Lili se aproximou.

— Você precisa dormir.

— Não posso — insistiu a Lua. — Tenho que cuidar de todos.

— Mas você não está conseguindo cuidar nem de si mesma.

A Lua ficou em silêncio.

Lili então teve uma ideia.

Chamou outras estrelinhas, que vieram rapidamente de todos os cantos do céu.

Uma delas iluminou o caminho das tartarugas.

Outra ficou sobre o mar, ajudando os barquinhos.

Duas estrelas cuidaram da floresta.

E Lili ficou perto das casas, deixando pequenos pontinhos de luz sobre os telhados.

— Está vendo? — disse a estrelinha. — Você não precisa fazer tudo sozinha.

Nesse momento, o Sol começou a surgir no horizonte.

— Bom dia, Lua — falou ele, com carinho. — Eu também estou aqui. Enquanto você dorme, eu ilumino o mundo.

A Lua olhou para as estrelas, depois para o Sol e, por fim, para sua cama de nuvens.

Ela percebeu que estava cercada de amigos.

— Eu achava que descansar era abandonar meu trabalho — confessou.

— Descansar não é abandonar — explicou o Sol. — É recuperar as forças para fazer bem aquilo que amamos.

— E aceitar ajuda também é uma forma de cuidar — acrescentou Lili.

A Lua sorriu.

Seu brilho estava fraco, mas seu coração parecia mais leve.

Ela se deitou na cama de nuvens, puxou uma nuvem fofinha como cobertor e fechou os olhos.

Antes de dormir, ainda perguntou:

— Vocês têm certeza de que ficará tudo bem?

— Temos — responderam o Sol e as estrelas ao mesmo tempo.

A Lua respirou fundo.

Pela primeira vez em três dias, parou de observar o mundo.

E sabe o que aconteceu?

Os passarinhos continuaram cantando.

Os barquinhos continuaram navegando.

As crianças foram para a escola.

As flores se abriram.

O mundo continuou girando, mesmo enquanto a Lua dormia.

Quando a noite chegou, ela acordou descansada, alegre e brilhando mais do que nunca.

— Boa noite, passarinhos!

— Boa noite, coelhinhos!

— Boa noite, crianças!

Sua luz prateada cobriu o mundo inteiro como um abraço.

Antes de começar seu passeio pelo céu, a Lua olhou para Lili e disse:

— Obrigada por cuidar de tudo enquanto eu descansava.

A estrelinha piscou contente.

— Amigos fazem isso. Às vezes cuidamos. Às vezes deixamos que cuidem de nós.

Desde aquele dia, a Lua nunca mais esqueceu de dormir.

Todas as manhãs, ela se deitava em sua cama de nuvens, tranquila, porque sabia que o Sol e as estrelas também estavam cuidando do mundo.

E todas as noites acordava renovada, pronta para espalhar sua luz.`

const STORY_2_BODY = `Todas as noites, quando as luzes das casas começavam a se apagar e os últimos bocejos enchiam os quartos, um trem muito especial despertava.

Ele não ficava em nenhuma estação comum.

Não aparecia nos mapas.

Também não fazia barulho nos trilhos.

Seu nome era Trem dos Sonhos Bonitos, e ele corria silenciosamente por caminhos de estrelas.

A locomotiva era azul-escura, com janelas douradas e uma chaminé que soltava nuvens prateadas. No lugar de fumaça, ela espalhava pelo céu um cheirinho leve de camomila, bolo quentinho e cobertor limpo.

Quem conduzia o trem era o senhor Nilo, um maquinista de barba branca, chapéu comprido e olhos sempre sorridentes.

Ao lado dele viajava Pingo, um pequeno vagalume que iluminava os bilhetes.

Toda noite, o senhor Nilo consultava uma lista mágica.

Nela estavam os nomes das crianças que já tinham escovado os dentes, vestido o pijama e se acomodado na cama.

— Vamos começar? — perguntava Pingo.

— Vamos, sim — respondia o maquinista. — Há muitos sonhos bonitos esperando por seus passageiros.

Então ele puxava uma corda dourada.

— Póóóóóó!

O apito soava baixinho, como se não quisesse acordar ninguém.

Naquela noite, o primeiro nome da lista era o de Clara.

Clara estava deitada havia algum tempo, mas não conseguia dormir. Virava para um lado, ajeitava o travesseiro, puxava o cobertor e tornava a virar.

Foi quando ouviu um som distante:

— Póóóóó…

Ela se sentou na cama.

No chão do quarto surgiu uma pequena faixa de luz. A luz cresceu, passou por baixo da porta e se transformou em uma plataforma coberta de estrelas.

Diante dela, parou o Trem dos Sonhos Bonitos.

A porta de um dos vagões se abriu.

— Bilhete, por favor — disse Pingo.

— Mas eu não tenho bilhete — respondeu Clara.

O vagalume sorriu.

— Tem, sim. Está debaixo do seu travesseiro.

Clara levantou o travesseiro e encontrou um pequeno cartão dourado.

Nele estava escrito:

Passageira: Clara
Destino: um sonho tranquilo
Horário de chegada: assim que os olhos se fecharem

Clara entrou no trem.

Por dentro, tudo era ainda mais bonito.

Os bancos eram feitos de almofadas fofinhas. As cortinas pareciam nuvens, e pequenas estrelas brilhavam no teto.

— Escolha o vagão que quiser — explicou o senhor Nilo. — Cada um leva a um sonho diferente.

Clara caminhou pelo corredor.

No primeiro vagão, havia um jardim iluminado pela Lua.

Flores enormes balançavam ao som do vento, e coelhos gentis serviam chá em xícaras feitas de folhas.

— Boa noite, Clara — disseram eles. — Quer descansar um pouco conosco?

Clara tomou um gole do chá imaginário. Tinha gosto de mel e abraço.

Depois, seguiu para o segundo vagão.

Lá dentro havia um mar calmo.

Peixinhos coloridos nadavam no ar, como se o vagão inteiro estivesse debaixo d’água. Uma baleia sorridente carregava uma pequena ilha nas costas.

— Suba — convidou a baleia. — Vamos passear devagar.

Clara sentou-se sobre a ilha, que era coberta de grama macia.

A baleia nadou entre nuvens cor-de-rosa e estrelas que pareciam conchas.

Não havia ondas fortes.

Não havia tempestades.

Havia apenas o som suave da água e uma brisa fresca.

Depois de algum tempo, a baleia encostou novamente no trem.

— Boa viagem — disse ela.

Clara agradeceu e foi conhecer o terceiro vagão.

Assim que abriu a porta, encontrou uma floresta encantada.

As árvores tinham folhas brilhantes, e os galhos formavam arcos sobre o caminho.

Um urso marrom, usando um cachecol verde, esperava por ela.

— Você chegou bem na hora — disse ele. — Estamos procurando a melodia do sono.

— Onde ela está? — perguntou Clara.

— Escondida em algum lugar da floresta.

Clara e o urso seguiram juntos.

Primeiro, ouviram o canto de um riacho.

Depois, o bater das asas de uma coruja.

Mais adiante, o vento atravessou as folhas e fez:

— Shhhhhhhh…

Clara parou.

O riacho fazia “plim, plim”.

A coruja fazia “u-hu, u-hu”.

O vento fazia “shhhhhhhh”.

Quando os três sons se misturaram, formaram uma música tão tranquila que até as árvores começaram a cochilar.

— Encontramos! — comemorou o urso.

Clara sorriu.

Mas logo sentiu um bocejo enorme escapar.

— Aaaah…

O urso apontou para o fim da floresta.

Ali havia uma porta redonda, coberta de estrelinhas.

Clara a abriu e voltou para o corredor do trem.

O senhor Nilo esperava por ela.

— Gostou dos vagões?

— Muito! — respondeu Clara. — Mas estou ficando com sono.

— Então está chegando ao seu destino.

O trem começou a diminuir a velocidade.

— Póóóóó…

A locomotiva parou diante de um último vagão.

Na porta estava escrito:

Vagão da Chegada

Clara entrou.

Não havia florestas, mares ou jardins.

Havia apenas uma cama macia, com travesseiro fofinho e cobertor quentinho.

A cama era exatamente igual à dela.

Pingo pousou na cabeceira.

— Todo sonho bonito precisa terminar em um lugar seguro — disse ele.

Clara se deitou.

O senhor Nilo ajeitou o cobertor sobre seus ombros.

— E amanhã o trem volta? — perguntou ela, já com os olhos quase fechados.

— O trem sempre volta — respondeu o maquinista. — Basta descansar e deixar a imaginação encontrar a estação.

Clara fechou os olhos.

O trem partiu devagar.

Passou sobre montanhas adormecidas, atravessou rios brilhantes e seguiu pelas trilhas de estrelas.

Em cada casa, parava por alguns instantes.

Recolhia uma criança sonolenta.

Levava outra de volta para a cama.

E assim, vagão após vagão, espalhava sonhos bonitos pelo mundo inteiro.

Na manhã seguinte, Clara acordou em seu quarto.

Por um momento, pensou que tudo tivesse sido apenas um sonho.

Mas, ao levantar o travesseiro, encontrou o pequeno bilhete dourado.

No verso, havia uma mensagem:

Obrigada por viajar conosco.
Seu próximo sonho já está sendo preparado.

Clara guardou o bilhete em uma caixinha.

Naquela noite, escovou os dentes, vestiu o pijama e se deitou sem demora.

Ficou em silêncio, ouvindo os sons do lado de fora.

Até que, bem longe, ouviu:

— Póóóóó…

Clara sorriu, fechou os olhos e deixou o Trem dos Sonhos Bonitos levá-la para mais uma aventura tranquila.`

const STORY_3_BODY = `Era uma vez uma cidade chamada Sonolândia.

Apesar do nome, ninguém ali conseguia dormir.

Quando a noite chegava, as luzes das casas continuavam acesas. As janelas permaneciam abertas. As pessoas andavam de um lado para o outro, tentando descobrir o que fazer com tanto sono que não chegava.

Na padaria, o senhor Ambrósio preparava pão às três da manhã.

Na praça, dona Celina varria folhas que já estavam varridas.

Na oficina, seu Tadeu apertava parafusos que não precisavam ser apertados.

Até os gatos ficavam acordados, andando pelos telhados com os olhos bem abertos.

— Miau… eu queria dormir — reclamava Mingau, o gato da rua das Margaridas.

Mas ninguém sabia o que fazer.

Os moradores tentavam de tudo.

Contavam ovelhas.

Bebiam leite morno.

Ajeitavam o travesseiro.

Viravam para a direita.

Viravam para a esquerda.

Puxavam o cobertor até o queixo.

Colocavam um pé para fora.

Nada funcionava.

Certa noite, o prefeito reuniu todos na praça.

Ele subiu em um pequeno palco, segurando uma lista enorme.

— Cidadãos de Sonolândia! — anunciou. — Precisamos encontrar uma solução.

— Já tentamos contar estrelas! — gritou alguém.

— Já tentamos ouvir o barulho da chuva! — disse outra pessoa.

— Eu até li o dicionário inteiro! — contou o professor Afonso.

— E funcionou? — perguntou o prefeito.

— Não. Mas aprendi muitas palavras.

Todos suspiraram.

No meio daquela multidão estava Lia, uma menina de pijama amarelo e pantufas de coelho.

Ela também não conseguia dormir.

Mas, naquela noite, Lia estava especialmente cansada.

Tinha passado o dia brincando, correndo, desenhando e ajudando sua avó a cuidar das plantas.

Enquanto o prefeito falava, Lia tentou prestar atenção.

Mas seus olhos começaram a ficar pesados.

Ela piscou uma vez.

Piscou duas vezes.

Piscou três vezes.

Então abriu a boca e soltou o maior bocejo que Sonolândia já tinha ouvido.

— Aaaaaaaaaaahhhhhhh…

O bocejo começou pequeno, mas foi crescendo, crescendo e crescendo.

Passou pelo nariz de dona Celina.

Entrou no ouvido do senhor Ambrósio.

Fez cócegas no bigode do prefeito.

O padeiro tentou segurar, mas não conseguiu.

— Aaaaaaaaaaahhhhhhh…

Seu bocejo atravessou a praça e chegou ao guarda da cidade.

O guarda também bocejou.

— Aaaaaahhh…

Uma senhora bocejou.

Depois um menino.

Depois uma costureira.

Depois o professor Afonso.

Em poucos segundos, toda a praça estava bocejando.

— O que está acontecendo? — perguntou o prefeito, entre um bocejo e outro.

Mas o bocejo de Lia já tinha ganhado vida própria.

Ele saiu da praça como uma brisa quentinha.

Desceu pela rua das Margaridas.

Passou por baixo das portas.

Entrou pelas janelas.

Na primeira casa, fez um bebê bocejar.

Na segunda, fez um avô bocejar.

Na terceira, uma família inteira abriu a boca ao mesmo tempo.

— Aaaaaaaaaahhhhhhh…

O bocejo seguiu até a padaria.

O senhor Ambrósio ainda tentava tirar uma fornada de pães do forno.

Assim que o bocejo entrou, ele apoiou a cabeça sobre um saco de farinha.

— Acho que vou descansar só um minutinho…

E dormiu.

O bocejo atravessou a oficina.

Seu Tadeu largou a chave de fenda, encostou-se em uma cadeira e fechou os olhos.

Passou pela biblioteca.

O professor Afonso tentou continuar lendo, mas as letras começaram a dançar diante de seus olhos.

Ele fechou o livro, apoiou a cabeça sobre a mesa e adormeceu.

O bocejo chegou aos telhados.

Mingau, o gato, esticou as patas dianteiras, arqueou as costas e abriu a boca.

— Miaaaaaaaaaau…

Depois se enrolou como uma bolinha e dormiu sobre uma chaminé ainda morninha.

Aos poucos, a cidade foi ficando diferente.

As vassouras pararam.

Os relógios pareceram andar mais devagar.

As conversas foram diminuindo.

As luzes começaram a se apagar, uma por uma.

Primeiro, uma janela.

Depois, outra.

Depois, uma rua inteira.

Na praça, o prefeito olhou ao redor.

Todos estavam com os olhos quase fechados.

— Talvez… talvez devêssemos continuar a reunião amanhã — disse ele.

Ninguém respondeu.

Dona Celina já dormia em um banco.

O guarda estava encostado em uma árvore.

Um cachorro roncava debaixo do palco.

Lia segurou a mão de sua mãe.

— Acho que o bocejo resolveu o problema.

A mãe sorriu.

— Acho que sim.

As duas caminharam para casa.

Pela primeira vez em muito tempo, Sonolândia estava silenciosa.

Não era um silêncio vazio.

Era um silêncio macio.

O vento balançava as cortinas.

As folhas das árvores faziam “shhh, shhh”.

Os grilos cantavam baixinho.

A Lua iluminava os telhados como se colocasse um cobertor prateado sobre a cidade.

Lia entrou no quarto, deitou-se e abraçou seu travesseiro.

Sua mãe ajeitou o cobertor.

— Boa noite, minha pequena.

— Boa noite, mamãe.

Lia fechou os olhos.

Mas, antes de dormir, soltou mais um bocejo.

Um bocejo bem menor.

Bem suave.

Bem tranquilo.

Ele saiu pela janela e passeou sobre Sonolândia, apenas para ter certeza de que todos estavam descansando.

Passou pela padaria.

Pela oficina.

Pela biblioteca.

Pela praça.

Depois subiu até o alto da torre do relógio.

Lá, encontrou uma pequena nuvem.

O bocejo deitou-se sobre ela, fechou os olhos e também adormeceu.

Na manhã seguinte, a cidade acordou diferente.

As pessoas estavam sorridentes.

O padeiro fez os pães mais fofinhos de sua vida.

Seu Tadeu consertou tudo sem trocar as ferramentas.

Dona Celina percebeu que não precisava varrer a mesma folha dez vezes.

Até o prefeito fez um discurso mais curto.

— Descobrimos algo muito importante — anunciou ele. — Quando o corpo pede descanso, precisamos escutá-lo.

Desde aquele dia, ninguém mais teve medo de parar.

Quando alguém sentia os olhos pesados, guardava o trabalho para depois.

Quando uma criança bocejava, os adultos não diziam:

— Você ainda não está com sono!

Em vez disso, diziam:

— Seu corpo está pedindo descanso.

E todas as noites, antes de apagar as luzes, os moradores esperavam em silêncio.

Logo, alguém soltava o primeiro bocejo.

Então outro respondia.

E outro.

Até que toda a cidade adormecia em paz.

Dizem que, em noites muito tranquilas, ainda é possível ouvir Sonolândia bocejando ao longe:

— Aaaaaaaaaaahhhhhhh…

E talvez, só de imaginar, você também esteja começando a bocejar.`

const STORY_4_BODY = `Na Floresta Verde-Clara, todos os animais gostavam muito da noite.

Era quando o vento ficava mais fresco, os vaga-lumes acendiam suas luzinhas e a Lua aparecia entre as copas das árvores.

Mas havia um pequeno problema.

Cada animal dormia de um jeito diferente.

O macaco Tito dormia abraçado em um galho.

A coelha Nina dormia dentro de uma toca bem quentinha.

O elefante Balu preferia deitar perto do lago.

A coruja Olívia cochilava empoleirada no alto de uma árvore.

E o ouriço Pipo demorava muito para encontrar uma posição confortável por causa de seus espinhos.

Certa tarde, uma caixa enorme apareceu no meio da floresta.

Era tão grande que precisou ser carregada por três cervos, quatro castores e uma fila inteira de formigas.

Na tampa estava escrito:

Entrega especial para os moradores da Floresta Verde-Clara.

Os animais se reuniram ao redor.

— O que será que tem aí dentro? — perguntou Nina.

— Bananas? — sugeriu Tito.

— Melancias? — imaginou Balu.

— Livros? — perguntou Olívia.

Pipo encostou o ouvido na caixa.

— Não estou ouvindo nada.

Tito pulou sobre a tampa e tentou abri-la.

— Está presa!

Balu usou a tromba.

Nina puxou uma fita.

Os castores empurraram.

Por fim, a tampa se abriu com um grande:

— Puf!

De dentro da caixa saíram dezenas de embrulhos coloridos.

Cada pacote tinha o nome de um animal.

— Este é meu! — disse Nina, pegando um embrulho rosa.

— E aquele é meu! — gritou Tito.

Todos abriram seus presentes ao mesmo tempo.

Dentro de cada pacote havia um pijama.

Mas não eram pijamas comuns.

Tinham sido feitos especialmente para cada animal.

O pijama de Nina era macio, tinha pequenas cenouras desenhadas e duas aberturas compridas para suas orelhas.

O de Tito tinha mangas elásticas, perfeitas para ele se pendurar nos galhos sem rasgar o tecido.

Balu recebeu um pijama azul enorme, coberto de nuvens brancas e com um bolso especial para sua tromba.

Olívia ganhou uma camisola leve, enfeitada com luas e estrelinhas, que deixava suas asas livres.

Pipo recebeu o pijama mais curioso de todos.

Era largo, fofinho e cheio de pequenos espaços por onde seus espinhos podiam passar.

— Finalmente um pijama que não fica preso em mim! — comemorou ele.

Havia pijamas para todos.

A girafa ganhou um com um pescoço muito comprido.

O jacaré recebeu um modelo com cauda reforçada.

A tartaruga ganhou um pijama que cobria sua carapaça como uma manta.

Até as formigas receberam minúsculos pijamas iguais, guardados em uma caixinha do tamanho de uma noz.

No fundo da caixa havia um convite:

Hoje, ao nascer da primeira estrela, acontecerá a Festa dos Pijamas da Floresta.

Os animais ficaram animados.

Mas Olívia, que gostava de festas tranquilas, levantou uma asa.

— Nada de música muito alta.

— Nem de correr perto das tocas — acrescentou Nina.

— Nem de pular sobre quem já estiver dormindo — disse Pipo, olhando para Tito.

O macaco colocou a mão no peito.

— Eu prometo tentar.

Quando a primeira estrela apareceu no céu, todos se encontraram na grande clareira.

A clareira estava decorada com lanternas feitas de folhas e vaga-lumes.

No centro havia almofadas, cobertores e esteiras de capim macio.

Os animais chegaram vestindo seus pijamas novos.

Tito desfilou de um lado para o outro.

— Vejam meu pijama de bananas!

Nina girou para mostrar as cenouras.

Balu bateu as orelhas, fazendo seu pijama balançar.

Pipo caminhou orgulhoso, feliz por não estar enganchado em nenhum galho.

A festa começou com jogos bem calmos.

Eles brincaram de adivinhar sons da floresta.

Depois fizeram desenhos nas folhas.

Também contaram quantas estrelas conseguiam ver no céu.

Tito quase começou uma corrida, mas lembrou da promessa.

Em vez disso, propôs:

— Que tal uma competição para ver quem boceja mais devagar?

Todos acharam graça.

Logo apareceram canecas de leite morno.

Para os animais que não tomavam leite, havia chá de frutas, água fresca e suco de flores.

Balu tomou seu leite em uma caneca enorme.

As formigas dividiram uma gotinha em cinquenta copinhos.

Nina mergulhou um pedacinho de biscoito em sua bebida.

— Está delicioso — disse ela.

Depois do lanche, Olívia abriu um livro grande.

— Hora da história.

Todos se acomodaram.

Os pequenos ficaram na frente.

Os maiores sentaram atrás.

Balu se deitou para não atrapalhar a visão dos outros.

A história era sobre uma estrelinha que tinha perdido o caminho de casa.

Enquanto Olívia lia, o vento balançava suavemente as folhas.

— Shhh… shhh…

A voz da coruja era calma.

— A estrelinha olhou para o céu e percebeu que nunca esteve realmente sozinha…

Nina apoiou a cabeça em uma almofada.

Pipo se enrolou perto dela.

Tito abraçou o próprio rabo.

Balu soltou um bocejo tão grande que fez sua tromba tremer.

— Aaaaahhh…

Um bocejo chamou o outro.

Nina bocejou.

Depois Pipo.

Depois Tito.

Até Olívia precisou parar a história por um instante.

— Acho que estamos todos ficando com sono.

— Mas a festa ainda não terminou — murmurou Tito.

— Festa de pijama também serve para dormir — explicou Olívia.

Os animais apagaram algumas lanternas.

Os vaga-lumes diminuíram o brilho.

Cada um escolheu um lugar sob as árvores.

Nina deitou perto de uma raiz, onde o chão era quentinho.

Pipo se acomodou sobre uma pilha de folhas.

Tito escolheu um galho baixo e amarrou o cobertor para não cair.

Balu ficou perto do lago, ouvindo o barulho suave da água.

Mas, quando todos estavam quase dormindo, perceberam uma coisa.

A pequena raposa Lia estava sentada sozinha.

— O que aconteceu? — perguntou Nina.

— Estou com saudade da minha toca — respondeu Lia. — Nunca dormi longe de casa.

Os animais se aproximaram.

Pipo ofereceu uma parte de sua manta.

Nina encostou-se ao lado dela.

Balu estendeu a tromba como um abraço.

Tito desceu do galho e sentou por perto.

— Você não está sozinha — disse Olívia. — Estamos todos aqui.

Lia olhou ao redor.

Viu os pijamas coloridos, os rostos amigos e a Lua brilhando sobre a clareira.

Então sorriu.

— Posso dormir no meio de vocês?

— Claro! — responderam todos.

Os animais formaram um grande círculo.

Os menores ficaram no centro.

Os maiores ficaram ao redor, protegendo o grupo do vento.

Antes de fechar os olhos, cada um deu um abraço em quem estava por perto.

O abraço de Balu era grande e quentinho.

O de Nina era macio.

O de Pipo precisava ser dado com cuidado.

O de Tito vinha acompanhado de uma risadinha.

Pouco a pouco, a clareira ficou silenciosa.

Ouviam-se apenas o riacho, as folhas e alguns ronquinhos.

A Lua observou tudo lá do alto.

Nunca tinha visto uma floresta tão bonita.

Parecia um enorme cobertor verde, coberto de pequenos pijamas coloridos.

Na manhã seguinte, os animais acordaram descansados.

Lia abriu os olhos e percebeu que tinha dormido a noite inteira.

— Eu consegui!

— Porque estava se sentindo segura — disse Olívia.

Eles dobraram os cobertores, guardaram as canecas e ajudaram a limpar a clareira.

Antes de voltar para casa, combinaram:

— Vamos fazer outra festa de pijama no próximo mês.

— Com mais histórias! — pediu Nina.

— E mais leite morno! — disse Balu.

— E outra competição de bocejos! — acrescentou Tito.

Todos riram.

A partir daquele dia, os animais passaram a usar seus pijamas todas as noites.

Mas o que eles mais gostavam não era do tecido macio, das estampas ou dos bolsos especiais.

O melhor era lembrar que, quando estivessem com medo ou se sentissem sozinhos, havia sempre um amigo por perto para oferecer um abraço, uma história ou um cantinho seguro para descansar.`

const STORY_5_BODY = `Toda noite, antes de dormir, Clara fazia sempre a mesma coisa.

Escovava os dentes, colocava seu pijama amarelo, escolhia um livro na estante e se deitava bem quietinha, esperando o papai ou a mamãe chegarem para contar uma história.

Mas naquela noite, uma coisa estava diferente.

O relógio da parede fazia:

Tic...

Depois ficava em silêncio.

Tac...

Depois parava de novo.

Clara olhou para ele desconfiada.

— Mamãe, acho que o relógio está com sono.

A mamãe sorriu.

— Será?

Clara sentou na cama e ficou olhando para o relógio redondo, pendurado na parede do quarto. Ele tinha ponteiros finos, números grandes e um rostinho que Clara jurava que mudava de expressão quando ninguém estava olhando.

De repente, bem baixinho, o relógio suspirou:

— Ai, ai... estou cansado de correr o dia inteiro.

Clara arregalou os olhos.

— Mamãe... o relógio falou!

Mas a mamãe já tinha ido buscar água.

Então Clara cochichou:

— Senhor Relógio, o senhor está mesmo cansado?

O relógio mexeu o ponteiro pequeno bem devagar.

— Estou, sim. Todo mundo quer que eu ande rápido. Hora de acordar, hora de comer, hora de tomar banho, hora de guardar brinquedos... Ninguém me deixa descansar.

Clara pensou um pouco.

— Mas se o senhor parar, como a gente vai saber que está na hora de dormir?

O relógio deu outro suspiro.

— Talvez hoje ninguém precise saber. Talvez hoje a noite possa ir bem devagar.

Clara gostou da ideia.

Ela se deitou de barriga para cima e olhou pela janela. A lua estava lá fora, redonda e calma, como se também estivesse com preguiça de subir mais alto no céu.

— Eu também queria que algumas horas fossem devagar — disse Clara. — A hora do abraço, por exemplo. E a hora da história.

O relógio pareceu sorrir.

— Essas são minhas horas preferidas.

Então Clara teve uma ideia.

— E se a gente fizesse uma hora bem comprida agora?

— Como assim? — perguntou o relógio.

— Uma hora de coisas pequenas. Bem devagar.

O relógio ficou curioso.

Clara puxou o cobertor até o queixo e começou:

— Primeiro, um abraço demorado.

A mamãe voltou para o quarto com o copo de água. Clara abriu os braços.

— Mamãe, preciso de um abraço de hora comprida.

A mamãe riu baixinho, deixou o copo na mesinha e abraçou Clara com carinho.

Foi um abraço quentinho. Daqueles que parecem cobertor por dentro.

O relógio fez:

Tiiiiic...

Bem devagar.

Depois Clara pediu:

— Agora, uma história com voz macia.

A mamãe pegou um livro, sentou ao lado da cama e começou a ler. As palavras saíam calmas, redondas, como nuvens passeando.

O relógio escutava atento.

Tac...

Tic...

Tac...

Mas cada som parecia mais tranquilo.

Quando a história acabou, Clara bocejou.

— Senhor Relógio, o senhor ainda está cansado?

O relógio respondeu baixinho:

— Menos. Acho que eu só precisava lembrar que nem toda hora precisa correr.

Clara sorriu com os olhos quase fechando.

— Amanhã o senhor pode correr de novo. Mas agora pode andar de pantufas.

O relógio adorou aquilo.

— Andar de pantufas... que ideia bonita.

Então ele começou a marcar o tempo bem suave:

Tic... tac...

Tic... tac...

Parecia uma canção pequenininha.

A mamãe apagou a luz, deixou só o abajur aceso e beijou a testa de Clara.

— Boa noite, meu amor.

— Boa noite, mamãe.

Quando a mamãe saiu, Clara olhou uma última vez para o relógio.

— Boa noite, Senhor Relógio Preguiçoso.

E o relógio respondeu:

— Boa noite, menina da hora comprida.

Clara fechou os olhos.

Lá fora, a lua brilhava quietinha.

Dentro do quarto, o tempo não corria.

Ele caminhava devagar, de pantufas, cuidando do sono de Clara até o sonho chegar.`

const STORY_6_BODY = `Toda noite, antes de dormir, Miguel gostava de olhar pela janela.

Ele subia na pontinha dos pés, encostava o nariz no vidro e procurava as estrelas no céu.

— Uma, duas, três, quatro... — contava ele baixinho.

Mas Miguel nunca conseguia contar todas.

As estrelas eram muitas. Umas brilhavam forte, outras piscavam de leve, e algumas pareciam se esconder atrás das nuvens só para brincar.

Naquela noite, porém, havia apenas uma estrela no céu.

Uma só.

Pequenina, brilhante e bem quieta.

Miguel franziu a testa.

— Mamãe, cadê as outras estrelas?

A mamãe se aproximou da janela, olhou para o céu e sorriu.

— Talvez estejam dormindo.

— Estrelas dormem?

— Acho que sim. Todo mundo precisa descansar um pouquinho.

Miguel ficou olhando para aquela estrela solitária.

Ela piscou uma vez.

Depois piscou de novo.

Miguel arregalou os olhos.

— Mamãe... acho que ela está falando comigo.

A mamãe beijou sua cabeça.

— Então escute com atenção.

Quando a mamãe saiu para buscar o cobertor, Miguel abriu a janela só um pouquinho e cochichou:

— Estrelinha, você está sozinha?

A estrela brilhou um pouco mais forte.

— Estou esperando — respondeu uma voz fininha, parecida com o som de um sininho distante.

Miguel levou um susto gostoso.

— Esperando o quê?

— Esperando a noite ficar bem quieta. Eu sou a última estrela a apagar.

Miguel achou aquilo muito importante.

— Você apaga todas as noites?

— Apago sim. Mas só depois que as crianças estão dormindo, os passarinhos estão sonhando e a lua termina de contar suas histórias para o mar.

Miguel olhou para a cama.

— Então você fica acordada até todo mundo dormir?

— Fico. Alguém precisa cuidar do céu enquanto os sonhos chegam.

Miguel sorriu.

— Eu também posso ajudar?

A estrela piscou contente.

— Pode. Mas ajudar a noite é uma tarefa bem delicada.

— Eu sei ser delicado — disse Miguel, falando bem baixinho.

— Então primeiro você precisa guardar o barulho do dia.

Miguel pensou nos carrinhos espalhados no tapete, nos passos correndo pela casa, nas risadas altas depois do banho.

Ele fechou as mãozinhas, como se estivesse pegando todos aqueles barulhos, e colocou tudo dentro do bolso do pijama.

— Pronto. Guardei.

— Agora — disse a estrela — você precisa chamar a calma.

Miguel respirou fundo.

Uma vez.

Duas vezes.

Três vezes.

O quarto pareceu ficar mais macio. Até a cortina balançou mais devagar.

— Muito bem — disse a estrela. — Agora falta a parte mais importante.

— Qual?

— Você precisa deixar um sonho bonito preparado.

Miguel fechou os olhos e começou a imaginar.

Imaginou um barco feito de travesseiro navegando num rio de leite morno. Imaginou peixinhos usando gorros de dormir. Imaginou uma montanha de cobertores onde moravam risadas pequenas e abraços quentinhos.

A estrela brilhou tanto que o quarto ficou prateado por um instante.

— Que sonho lindo, Miguel.

Ele abriu os olhos, orgulhoso.

— Você gostou?

— Gostei muito. Acho que agora a noite está pronta.

Miguel bocejou.

— Mas se você apagar, o céu vai ficar escuro.

A estrela falou com carinho:

— O escuro não é vazio. O escuro é só o cobertor da noite. Ele cobre o mundo para todo mundo descansar.

Miguel nunca tinha pensado assim.

Olhou para o céu outra vez e percebeu que a noite parecia mesmo um cobertor enorme, cheio de silêncio e cuidado.

A mamãe voltou com o cobertor de Miguel e o colocou sobre a cama.

— Está conversando com a estrela?

— Estou ajudando ela a cuidar da noite — respondeu Miguel, já sonolento.

A mamãe sorriu.

— Então venha cuidar da noite deitado.

Miguel foi para a cama, abraçou seu travesseiro e olhou pela janela uma última vez.

A estrelinha ainda estava lá.

— Boa noite, última estrela — sussurrou ele.

— Boa noite, guardião dos sonhos — respondeu ela.

Miguel fechou os olhos.

A estrela esperou mais um pouquinho.

Esperou o quarto ficar quieto.

Esperou a respiração de Miguel ficar calma.

Então piscou devagar, como quem dá tchau.

E apagou sua luz.

Lá fora, o céu ficou escuro e tranquilo.

Dentro do quarto, Miguel já navegava em seu barco de travesseiro, pelo rio de leite morno, enquanto a noite inteira dormia sorrindo.`

const STORY_7_BODY = `No jardim da Dona Lúcia morava uma abelhinha chamada Bela.

Bela era pequena, listradinha e muito trabalhadeira. Todos os dias, assim que o sol aparecia, ela saía voando de flor em flor.

Zum pra cá.

Zum pra lá.

Zum no girassol.

Zum na margarida.

Zum na lavanda cheirosa.

Bela gostava muito do seu trabalho. Ela ajudava as flores, levava pólen nas patinhas e ainda fazia parte da turma que preparava o mel mais docinho da colmeia.

Mas, naquela manhã, Bela acordou diferente.

Suas asinhas estavam pesadas.

Suas anteninhas estavam caídas.

E seu zumbido saiu bem fraquinho:

— Zuuum...

A abelha Lia, sua amiga, percebeu.

— Bela, você está bem?

Bela tentou sorrir.

— Estou sim. Só estou um pouquinho... sem zum.

Lia inclinou a cabeça.

— Sem zum?

— É — disse Bela. — Sabe quando a gente quer voar, mas parece que o corpo pede colo?

Lia entendeu na hora.

— Acho que você precisa de uma folga.

Bela arregalou os olhos.

— Folga? Mas eu tenho flores para visitar!

— As flores podem esperar um pouquinho — disse Lia. — Você também é importante.

Bela achou aquilo estranho. Ela sempre pensava nas flores, no mel, na colmeia, nas outras abelhas. Mas quase nunca pensava nela mesma.

Mesmo assim, decidiu tentar.

Voou devagar até uma folha grande e verdinha, bem embaixo de uma roseira. A folha parecia uma rede de descanso.

Bela se deitou ali.

— Pronto — disse ela. — Estou descansando.

Mas, depois de três segundos, levantou a cabeça.

— Será que o girassol sentiu minha falta?

Lia riu baixinho.

— Bela, descansar também precisa de treino.

Então Lia chamou alguns amigos do jardim.

A joaninha trouxe uma gotinha de orvalho fresquinha.

— Para você beber devagar — disse ela.

A borboleta trouxe uma brisa suave nas asas.

— Para refrescar seus pensamentos — falou.

E o caracol, que entendia muito de ir devagar, chegou por último.

— Desculpem a demora — disse ele. — Vim o mais rápido que pude.

Todos riram com carinho.

Bela tomou a gotinha de orvalho, sentiu a brisa no rosto e olhou para o céu azul.

Pela primeira vez em muito tempo, ela percebeu coisas que antes passavam voando.

Viu uma nuvem em forma de pão fofinho.

Viu uma formiga carregando uma migalha maior que ela.

Viu uma flor se abrindo bem devagar, como se estivesse bocejando.

— Eu nunca tinha reparado nisso — disse Bela.

— Porque você estava sempre com pressa — respondeu o caracol.

Bela ficou quietinha.

Depois fechou os olhos.

Escutou o vento.

Sentiu o perfume das flores.

E, sem perceber, tirou uma soneca pequenininha.

Quando acordou, o sol já estava mais baixo. O jardim estava dourado e calmo.

Bela mexeu as asinhas.

Elas não pareciam mais tão pesadas.

— Meu zum voltou — disse ela, surpresa.

— Viu só? — falou Lia. — Às vezes, para continuar voando, a gente precisa pousar um pouco.

Bela sorriu.

Naquela tarde, ela visitou apenas uma flor: uma margarida branca que balançava tranquila perto do muro.

— Desculpe a demora — disse Bela.

A margarida respondeu:

— Não precisa se desculpar. Eu também gosto de descansar quando a noite chega.

Bela riu.

Quando voltou para a colmeia, não estava cansada como antes. Estava leve.

A rainha perguntou:

— Bela, como foi seu dia?

Bela pensou um pouquinho e respondeu:

— Hoje eu descobri que uma abelha não precisa zumbar o tempo todo para ser uma boa abelha.

A rainha sorriu.

— Muito sábio.

Desde então, Bela continuou trabalhando, visitando flores e ajudando a fazer mel.

Mas agora ela também separava um tempinho para pousar numa folha, beber orvalho e olhar as nuvens passarem.

Porque até as abelhas mais dedicadas precisam descansar.

E, quando Bela dormia à noite, suas asinhas ficavam quietinhas, seu coração ficava tranquilo, e seu sonho tinha cheiro de flor, gosto de mel e som de vento dizendo bem baixinho:

— Zzz... zum... zzz... zum...`

const STORY_8_BODY = `Toda noite, quando a lua subia no céu, os sonhos saíam passeando pelo mundo.

Havia sonhos de voar, sonhos de brincar na praia, sonhos de encontrar tesouros, sonhos com castelos de nuvem e até sonhos com bolo de chocolate do tamanho de uma mesa.

Cada sonho sabia exatamente para onde ir.

Menos um.

Ele se chamava Tico.

Tico era um sonho pequeno, fofinho e meio distraído. Tinha cabelos de algodão-doce, sapatinhos de vento e carregava uma bolsinha cheia de imagens bonitas.

Naquela noite, Tico recebeu uma missão muito importante:

— Você vai para o quarto da Nina — disse a Estrela dos Sonhos. — Ela está esperando um sonho calmo e bonito.

— Pode deixar! — respondeu Tico, animado.

Mas, no caminho, Tico viu uma nuvem parecida com um carneirinho.

— Só vou olhar rapidinho — disse ele.

A nuvem passou devagar, fazendo cócegas no céu.

Depois Tico encontrou uma estrela cadente ensaiando seu brilho.

— Que lindo! — falou ele. — Só mais um minutinho.

Quando percebeu, a lua já estava bem alta.

— Ai, ai! Estou atrasado!

Tico correu pelo céu, tropeçou numa pontinha de nuvem, girou três vezes no ar e quase deixou cair sua bolsinha de sonhos.

Enquanto isso, no quarto, Nina estava deitada com seu pijama azul.

Ela fechava os olhos, abria de novo, virava para um lado, virava para o outro.

— Mamãe, acho que meu sono chegou, mas meu sonho não — disse Nina.

A mamãe sentou na beira da cama e ajeitou o cobertor.

— Às vezes os sonhos demoram um pouquinho. Enquanto ele não chega, a gente respira devagar.

Nina respirou fundo.

Uma vez.

Duas vezes.

Três vezes.

O quarto ficou quietinho.

Mas nada de sonho.

Lá no céu, Tico procurava o caminho.

— Quarto da Nina, quarto da Nina... onde será?

Ele passou pela casa de um menino que sonhava com dinossauros usando chapéu.

Passou pela casa de uma bebê que sonhava com bolinhas coloridas.

Passou pela janela de um cachorro dormindo, que sonhava que corria atrás da própria cauda.

— Não é aqui, não é aqui, também não é aqui...

Então Tico encontrou a Coruja da Madrugada pousada em uma antena.

— Dona Coruja, a senhora sabe onde fica o quarto da Nina?

A coruja piscou seus olhos redondos.

— Sei sim. Mas por que tanta pressa?

— Estou atrasado! Nina está esperando o sonho dela!

A coruja sorriu.

— Então voe para aquela janela com a cortina de estrelinhas. E lembre-se: sonho bonito não precisa chegar correndo. Precisa chegar macio.

Tico agradeceu e voou até a janela de Nina.

Ele entrou bem devagar, sem fazer barulho.

Nina estava quase dormindo, abraçada ao travesseiro.

Tico abriu sua bolsinha.

Lá dentro havia muitas ideias: um foguete vermelho, um rio de suco de uva, uma bicicleta que andava sozinha, uma floresta de pirulitos e uma montanha de almofadas.

— Hum... — pensou Tico. — Hoje ela precisa de um sonho calmo.

Então ele guardou o foguete.

Guardou a bicicleta.

Guardou a floresta de pirulitos.

E escolheu um sonho bem macio.

Primeiro, colocou no quarto um campo de estrelas baixinhas, brilhando como vaga-lumes.

Depois, trouxe uma casinha feita de cobertor, com janelas de luar.

Em seguida, chamou um barquinho de travesseiro para navegar em um lago quietinho.

Nina suspirou dormindo.

Tico sorriu.

No sonho, Nina entrou no barquinho e começou a passear pelo lago. A água brilhava prateada. O vento cantava uma música baixinha. E, no céu, a lua parecia uma lâmpada acesa só para ela.

— Que sonho bonito — murmurou Nina, sem acordar.

Tico ficou feliz.

A Estrela dos Sonhos apareceu na janela e perguntou baixinho:

— Conseguiu?

Tico respondeu:

— Consegui. Cheguei atrasado, mas cheguei com cuidado.

A estrela sorriu.

— Então foi na hora certa.

Tico entendeu uma coisa importante naquela noite: às vezes a gente se atrasa um pouco, se distrai pelo caminho ou demora para encontrar a janela certa. Mas ainda dá tempo de fazer bonito, se a gente chegar com carinho.

De manhã, Nina acordou sorrindo.

— Mamãe, meu sonho chegou — disse ela.

— E como ele era?

Nina pensou, ainda com os olhos sonolentos.

— Era tranquilo. Parecia um abraço andando de barquinho.

Lá no céu, escondido atrás de uma nuvem, Tico ouviu tudo e ficou muito orgulhoso.

Na noite seguinte, ele prometeu sair mais cedo.

Mas, só por garantia, a Estrela dos Sonhos colocou uma plaquinha em sua bolsinha:

“Quarto da Nina: cortina de estrelinhas.”

E Tico nunca mais esqueceu.

Bem... quase nunca.`

const STORY_9_BODY = `Naquela noite, a chuva começou bem devagar.

Plic.

Ploc.

Plic.

Ploc.

No quarto de Tomás, tudo estava quase pronto para dormir. O pijama já estava vestido, os dentes já estavam escovados e o cobertor azul já esperava quentinho na cama.

Mas Tomás não conseguia fechar os olhos.

Ele abraçava seu ursinho de pano, chamado Tutu, e olhava para a janela.

Lá fora, a chuva batia no vidro.

Plic, ploc, plic, ploc.

De vez em quando, o vento soprava nas folhas das árvores, fazendo um barulho comprido:

Fuuuuuu...

Tomás apertou Tutu contra o peito.

— Tutu, você ouviu isso?

O ursinho, que era muito educado, não respondeu na frente dos adultos. Mas Tomás tinha certeza de que ele entendia tudo.

A mamãe entrou no quarto e percebeu seus olhos bem abertos.

— Ainda acordado, meu amor?

— A chuva está fazendo muito barulho — disse Tomás. — Parece que ela quer entrar.

A mamãe se sentou na beira da cama.

— A chuva não quer entrar. Ela só está cantando lá fora.

Tomás franziu a testa.

— Cantando?

— Sim. Cada gotinha faz uma parte da música.

Tomás ficou escutando.

Plic.

Ploc.

Plic.

Ploc.

Parecia mesmo uma música, mas ainda era uma música estranha.

A mamãe beijou sua testa.

— Tente ouvir devagar. Às vezes, quando a gente conhece o barulho, ele fica menos assustador.

Depois ela apagou a luz grande e deixou só o abajur aceso.

Quando Tomás ficou sozinho, a chuva aumentou um pouquinho.

Plic-ploc-plic-ploc.

Tum.

Uma gota maior caiu no telhado.

Tomás puxou o cobertor até o nariz.

Foi então que ele sentiu Tutu se mexer.

Bem pouquinho.

Depois mais um pouco.

O ursinho levantou a cabeça de pano e piscou seus olhinhos costurados.

— Tomás — disse Tutu, com uma voz fofinha de travesseiro — acho que a chuva está chamando a gente.

Tomás arregalou os olhos.

— Chamando para quê?

— Para escutar a história dela.

Tomás olhou para a janela.

— Chuva conta história?

— Claro — respondeu Tutu. — Só que ela conta em gotinhas.

O ursinho desceu da cama, arrastando suas patinhas macias pelo cobertor.

— Primeiro, precisamos entender os sons.

Tomás se sentou.

— Aquele plic pequeno é o quê?

Tutu colocou a patinha na orelha, escutou com atenção e respondeu:

— Esse é o som das gotinhas pulando nas folhas.

Plic, plic, plic.

Tomás imaginou gotinhas pequeninas pulando de folha em folha como se estivessem brincando de cama elástica.

— E o ploc?

— Esse é o som das gotinhas escorregando pela janela.

Ploc, ploc, ploc.

Tomás imaginou gotinhas descendo pelo vidro como crianças num escorregador transparente.

Ele sorriu um pouquinho.

— E aquele fuuuu do vento?

Tutu abraçou a própria barriga de pano.

— Ah, esse é o vento soprando para ajudar as nuvens a encontrarem um lugar para descansar.

Tomás ouviu de novo.

Fuuuuuu...

Agora parecia menos assustador. Parecia um suspiro grande do céu.

De repente, veio outro barulho no telhado.

Tum.

Tomás se encolheu.

— E esse?

Tutu pensou, pensou e disse:

— Esse é o tambor da chuva.

— Tambor?

— Sim. Toda música precisa de tambor.

Tomás achou graça.

A chuva continuava.

Plic.

Ploc.

Tum.

Fuuuu.

Plic.

Ploc.

Tum.

Fuuuu.

Tutu começou a balançar de um lado para o outro.

— Está ouvindo? É uma canção de dormir.

Tomás respirou devagar.

Aos poucos, o quarto pareceu mudar.

A janela virou uma cortina brilhante.

O telhado virou um tambor macio.

O vento virou uma mão invisível fazendo carinho nas árvores.

E a chuva, que antes parecia barulho demais, começou a parecer companhia.

— Tutu — cochichou Tomás — acho que a chuva está lavando o mundo para amanhã nascer limpinho.

O ursinho sorriu.

— Exatamente. As ruas, as flores, os telhados e até os pensamentos cansados.

Tomás deitou de novo.

— Será que as flores gostam da chuva?

— Muito — disse Tutu. — Para as flores, cada gotinha é como um copinho de água.

Tomás fechou os olhos e imaginou o jardim bebendo chuva com canudinhos invisíveis.

Imaginou as formigas escondidas em suas casinhas.

Imaginou os passarinhos dormindo em ninhos quentinhos.

Imaginou as nuvens ficando leves depois de entregar todas as gotinhas.

A mamãe voltou devagar para espiar.

Tomás estava quietinho, mas ainda acordado.

— Melhorou? — perguntou ela.

Tomás assentiu.

— A chuva está cantando. Tutu me explicou.

A mamãe olhou para o ursinho, que estava parado como sempre, com cara de quem não sabia de nada.

— Que bom que ele explicou.

Ela ajeitou o cobertor e falou baixinho:

— Então boa noite, meu amor.

— Boa noite, mamãe.

Quando ela saiu, Tomás abraçou Tutu bem forte.

Lá fora, a chuva continuava sua música.

Plic.

Ploc.

Tum.

Fuuuu.

Mas agora Tomás não tinha medo.

Ele sabia que cada barulho tinha um segredo.

As gotinhas brincavam nas folhas.

A janela virava escorregador.

O telhado tocava tambor.

E o vento ajudava as nuvens a dormir.

Tomás bocejou.

— Boa noite, chuva — sussurrou.

Tutu respondeu bem baixinho:

— Boa noite, pequeno escutador.

E, enquanto a chuva cantava para o mundo lá fora, Tomás adormeceu por dentro, quentinho e tranquilo, sonhando com gotinhas dançando de pijama em cima das folhas.`

const STORY_10_BODY = `No alto de uma árvore bem antiga, morava uma corujinha chamada Olívia.

Olívia tinha olhos grandes, penas macias e um jeito muito educado de virar a cabeça quando alguém falava com ela.

Como toda coruja, Olívia dormia durante o dia.

De manhã, quando o sol aparecia, ela fechava os olhinhos e cochilava no seu ninho.

Mas, quando a noite chegava, acontecia uma coisa curiosa.

Olívia acordava, olhava para o céu escuro e dizia:

— Acho que ainda não está na hora.

A mamãe coruja piscava devagar.

— Está sim, minha pequena. A noite chegou.

Olívia encolhia as asas.

— Mas está tudo tão escuro...

A mamãe coruja se aproximava com carinho.

— O escuro é o horário das corujas.

— Eu sei — dizia Olívia. — Mas mesmo assim ele parece grande demais.

Enquanto as outras corujas voavam pela floresta, Olívia ficava no ninho, olhando para as sombras entre os galhos.

Uma sombra parecia um gigante.

Outra parecia um bicho estranho.

E uma folha balançando parecia uma mão dando tchau.

— Eu não gosto quando não consigo ver tudo — cochichava ela.

Certa noite, a lua apareceu redonda e brilhante, iluminando a árvore de Olívia com uma luz prateada.

— Boa noite, corujinha — disse a lua.

Olívia levou um susto.

— Dona Lua! A senhora fala?

— Só com quem escuta bem baixinho — respondeu a lua.

Olívia olhou para baixo.

— Eu queria sair do ninho, mas tenho medo do escuro.

A lua sorriu.

— Então talvez você precise conhecer melhor a noite.

— Conhecer?

— Sim. Muitas coisas parecem assustadoras quando a gente olha de longe.

Olívia pensou nisso.

A lua continuou:

— Vamos fazer assim: você não precisa voar pela floresta inteira. Só precisa dar um passinho até aquele galho ali.

Olívia olhou para o galho.

Ele estava pertinho.

Bem pertinho.

Mesmo assim, seu coração fez tum-tum-tum.

— Só até ali?

— Só até ali — disse a lua.

Olívia respirou fundo.

Abriu uma asa.

Depois a outra.

E pulou para o galho.

— Consegui! — disse ela, surpresa.

O galho balançou devagar, como se dissesse parabéns.

De lá, Olívia viu uma coisa brilhando entre as folhas.

— O que é aquilo?

— São vaga-lumes — respondeu a lua. — Pequenas lanternas da floresta.

Os vaga-lumes piscavam amarelinhos, subindo e descendo no ar.

Olívia achou bonito.

Então ouviu um barulhinho:

Cri-cri-cri.

Ela se encolheu.

— O que foi isso?

— Grilos cantando — disse a lua. — Eles ensaiam música quando o mundo fica quieto.

Olívia escutou melhor.

Cri-cri-cri.

Cri-cri-cri.

Parecia mesmo uma canção fininha.

Depois veio um farfalhar nas folhas.

Olívia ficou parada.

— E isso?

A lua iluminou o chão.

Um ouriço pequeno passou devagar, levando uma folhinha presa nas costas.

— É só um vizinho voltando para casa — explicou a lua.

Olívia riu baixinho.

— Eu achei que fosse uma coisa enorme.

— Às vezes o medo aumenta o tamanho das coisas — disse a lua.

Olívia ficou em silêncio.

Olhou para as sombras outra vez.

Aquela sombra que parecia um gigante era apenas um tronco torto.

A sombra do bicho estranho era um monte de folhas.

E a mão dando tchau era só um galhinho balançando no vento.

— Dona Lua — disse Olívia — o escuro não sumiu, mas ele ficou diferente.

— Porque agora você começou a conhecê-lo.

A corujinha ajeitou as penas.

— Será que eu consigo voar até o próximo galho?

— Acho que sim. Mas vá no seu tempo.

Olívia abriu as asas.

Dessa vez, o coração ainda fez tum-tum, mas não tão forte.

Ela voou até o galho seguinte.

Depois até outro.

E mais outro.

Quando percebeu, estava fora da árvore, planando sobre a clareira.

O vento passou por suas penas como um cobertor fresquinho.

Lá embaixo, a floresta parecia dormir e respirar.

Os vaga-lumes brilhavam.

Os grilos cantavam.

A lua acompanhava tudo lá de cima.

Olívia sentiu uma alegria pequena crescer dentro dela.

— Eu estou voando na noite!

A mamãe coruja, que observava de longe, sorriu orgulhosa.

Olívia não ficou corajosa de uma vez.

Na noite seguinte, ainda sentiu um pouco de medo.

E na outra também.

Mas agora ela sabia o que fazer.

Respirava fundo.

Olhava com calma.

Dava um passo de cada vez.

E lembrava que o escuro não era um monstro.

Era só a noite usando seu vestido azul bem profundo.

Com o tempo, Olívia descobriu que a noite tinha muitas coisas bonitas: estrelas escondidas, flores que abriam tarde, perfumes que só apareciam depois do pôr do sol e silêncios macios.

Uma noite, enquanto voava tranquila, Olívia encontrou um filhote de esquilo encolhido perto de uma raiz.

— Você está perdido? — perguntou ela.

— Estou com medo do escuro — disse o esquilo.

Olívia pousou perto dele e falou com carinho:

— Eu também já tive. Quer conhecer a noite comigo?

O esquilo assentiu.

Então Olívia mostrou os vaga-lumes, a música dos grilos e a lua redonda no céu.

O esquilo sorriu.

— O escuro parece menor agora.

Olívia olhou para a lua e piscou.

A lua piscou de volta.

E, desde aquela noite, todos na floresta sabiam: quando alguém tinha medo do escuro, podia chamar Olívia.

Ela chegava devagar, com asas macias, e dizia:

— Venha comigo. A noite é grande, mas a gente pode conhecê-la um pedacinho de cada vez.`

const STORY_11_BODY = `No cantinho de um jardim, debaixo de uma pedra lisinha, morava uma formiguinha chamada Nina.

Nina era pequena, esperta e muito curiosa.

Todos os dias, ela caminhava com as outras formigas pela grama, carregando pedacinhos de folhas, farelinhos de pão e sementinhas caídas perto da varanda.

Mas Nina tinha um sonho diferente.

Ela queria ver o mar.

Não sabia exatamente como o mar era. Só tinha ouvido falar por uma borboleta viajante, que passou pelo jardim certa manhã.

— O mar é enorme — disse a borboleta. — Ele brilha no sol, canta sem parar e faz ondas que vêm e vão, como se respirassem.

Desde então, Nina não conseguia pensar em outra coisa.

— Um lugar que canta? — dizia ela. — Eu preciso conhecer.

As outras formigas riam com carinho.

— Nina, o mar fica muito longe.

— Você é tão pequena.

— E nós temos muito trabalho por aqui.

Nina entendia. Ela gostava do formigueiro, das amigas e do cheirinho de terra molhada depois da chuva.

Mas, dentro dela, havia uma vontade que fazia cosquinha no coração.

Numa tarde dourada, Nina subiu no alto de uma flor amarela e olhou para longe.

— Eu não preciso chegar correndo — disse ela. — Posso ir devagar.

Então preparou uma mochilinha feita de pétala seca, colocou dentro uma migalha de bolo, uma gotinha de orvalho guardada numa casquinha e uma folha pequena para usar de cobertor.

Na manhã seguinte, Nina começou sua viagem.

Primeiro atravessou a grande floresta de grama.

Para uma pessoa, era só o gramado do quintal.

Mas para Nina, cada folha de grama era uma árvore comprida.

Ela caminhou, caminhou, caminhou.

Quando cansou, sentou embaixo de um trevo.

Foi ali que encontrou um caracol.

— Bom dia — disse Nina. — Você sabe o caminho para o mar?

O caracol pensou com calma.

Pensou mais um pouco.

E respondeu:

— Não sei. Mas sei que quem vai devagar também chega em lugares bonitos.

Nina sorriu.

— Então estou no caminho certo.

Mais adiante, ela encontrou uma poça d’água.

A poça era tão grande para Nina que parecia um lago.

Ela ficou parada na beiradinha, sem saber como atravessar.

De repente, uma folha caiu bem perto dela.

Pluft.

— Um barquinho! — disse Nina.

Ela subiu na folha, segurou firme no cabinho e navegou pela poça.

A água balançava de leve.

Nina fechou os olhos e imaginou:

— Será que o mar balança assim também?

Quando chegou do outro lado, agradeceu à folha.

— Você foi meu primeiro barco.

Depois, Nina passou por um caminho de pedras quentes, por uma montanha de terra e por um túnel escuro feito entre raízes.

À noite, deitou-se dentro de uma flor caída.

O céu estava cheio de estrelas.

Nina olhou para cima e cochichou:

— Estrelas, vocês já viram o mar?

Uma estrela piscou.

Nina decidiu que aquilo queria dizer sim.

No dia seguinte, ela continuou.

Encontrou uma joaninha vermelha tomando sol.

— Estou indo ver o mar — contou Nina.

— Que bonito — disse a joaninha. — Leve isto com você.

E deu a Nina uma sementinha redonda.

— Para lembrar que coisas pequenas também carregam grandes começos.

Nina guardou a sementinha com cuidado.

Mais tarde, um vento forte apareceu.

Fuuuuuu!

Nina se segurou em um galhinho.

— Ei, vento! — gritou ela. — Você conhece o mar?

O vento rodopiou ao redor dela.

— Conheço sim. Eu brinco com as ondas todos os dias.

— Então me leva?

O vento soprou mais mansinho.

— Não posso levar você inteira, pequena Nina. Mas posso mostrar a direção.

E soprou uma brisa cheirando diferente.

Não era cheiro de terra.

Não era cheiro de flor.

Era um cheiro fresco, salgado, imenso.

O coração de Nina bateu rapidinho.

— O mar está perto!

Ela caminhou mais um pouco.

Subiu uma última pedrinha.

E então viu.

O mar.

Era muito maior do que qualquer coisa que Nina já tinha imaginado.

Azul, brilhante, mexido, cheio de luz.

As ondas vinham e voltavam, vinham e voltavam, fazendo:

Shhhhh...

Shhhhh...

Parecia mesmo que o mundo estava respirando.

Nina ficou quietinha.

Não disse nada por um tempo.

Às vezes, quando a gente encontra um sonho de verdade, as palavras precisam descansar um pouquinho.

Então ela sentou na areia.

A areia era quentinha e cheia de grãos, cada um menor que uma pedrinha do jardim.

Uma onda chegou perto, bem de mansinho, molhou a ponta das patinhas de Nina e voltou.

— Olá, mar — disse ela.

O mar respondeu:

Shhhhh...

Nina riu.

— Eu vim de muito longe para te conhecer.

O mar continuou cantando.

E Nina entendeu que aquela era a forma dele dizer:

— Que bom que você veio.

Ela ficou ali até o céu começar a ficar cor de laranja.

Comeu sua migalha de bolo, bebeu sua gotinha de orvalho e plantou a sementinha da joaninha perto de uma pedra.

— Para lembrar que eu estive aqui — disse.

Quando a noite chegou, Nina se enrolou na folhinha-cobertor e olhou para as estrelas.

Ela estava longe de casa, mas não se sentia sozinha.

O mar cantava.

O vento passava leve.

A lua brilhava no caminho das ondas.

Antes de dormir, Nina pensou nas amigas do formigueiro.

No dia seguinte, ela começaria a volta.

Ia demorar, claro.

Mas agora ela tinha uma história enorme para contar.

A história da formiguinha que era pequena, mas tinha um sonho grande.

E que descobriu uma coisa muito importante:

o mundo pode ser imenso,

o caminho pode ser comprido,

mas um passinho depois do outro

também leva a gente até o mar.`

const STORY_12_BODY = `No meio de um jardim tranquilo, perto de uma cerca coberta de flores, morava um vagalume chamado Lino.

Lino era pequeno, tinha asinhas finas e olhos curiosos. Durante o dia, ele gostava de descansar embaixo das folhas. Mas, quando a noite chegava, todos os vagalumes saíam para dançar no ar.

Era lindo de ver.

Um acendia.

Outro apagava.

Um brilhava amarelinho.

Outro piscava verdinho.

Parecia que o jardim tinha ganhado estrelinhas voadoras.

Mas Lino ficava escondido atrás de uma folha.

— Você não vem brincar? — perguntava Luna, uma vagalume muito gentil.

Lino abaixava a cabeça.

— Acho que não.

— Por quê?

Ele suspirava.

— Porque eu não sei brilhar.

Luna olhou para ele com surpresa.

— Todo vagalume brilha, Lino.

— Eu não — disse ele. — Eu tento, tento, tento... mas nada acontece.

Lino apertou os olhinhos, fez força com a barriga, esticou as anteninhas e prendeu a respiração.

Mas sua luz não apareceu.

Nem uma faísca.

Nem um pontinho.

Nem um brilhinho pequenino.

— Está vendo? — falou ele, triste.

Luna pousou ao seu lado.

— Talvez sua luz só precise de um pouco de calma.

Mas Lino não acreditou muito.

Naquela noite, enquanto os outros vagalumes desenhavam caminhos brilhantes no ar, Lino caminhou sozinho pelo jardim.

Passou pelo pé de lavanda.

Passou por uma pedrinha redonda.

Passou por uma poça que refletia a lua.

Quando olhou para a água, viu seu próprio reflexo.

— Eu queria tanto brilhar — cochichou.

A lua, que escutava quase tudo lá de cima, respondeu:

— E por que você quer brilhar, pequeno Lino?

O vagalume levou um susto.

— Dona Lua! Eu quero brilhar porque todos os vagalumes brilham.

— Entendi — disse a lua. — Mas você quer brilhar igual aos outros ou quer encontrar a sua própria luz?

Lino ficou quieto.

Nunca tinha pensado nisso.

— Existe luz diferente? — perguntou.

— Claro — respondeu a lua. — Tem luz de estrela, luz de vela, luz de janela acesa, luz de abraço e luz de sorriso.

Lino olhou para a própria barriguinha apagada.

— Mas eu não tenho nenhuma.

A lua iluminou uma trilha entre as flores.

— Caminhe um pouco. Talvez sua luz esteja escondida em algum lugar dentro de você.

Lino seguiu a trilha.

No caminho, encontrou uma formiguinha tentando carregar uma migalha muito grande.

Ela empurrava de um lado.

Puxava do outro.

Mas a migalha não saía do lugar.

— Quer ajuda? — perguntou Lino.

— Quero muito — disse a formiguinha.

Lino apoiou suas patinhas na migalha e empurrou junto com ela.

Um, dois, três!

A migalha se mexeu.

Mais um pouquinho.

Mais um tantinho.

Até que entrou no caminho do formigueiro.

— Obrigada! — disse a formiguinha. — Você clareou minha noite.

Lino sorriu.

Por um instante, sentiu um calorzinho bom dentro do peito.

Mas sua luz ainda não apareceu.

Ele continuou andando.

Mais adiante, ouviu um chorinho baixinho perto de uma margarida.

Era uma lagartinha.

— O que aconteceu? — perguntou Lino.

— Perdi minha folha preferida — disse ela. — Era onde eu dormia.

Lino olhou ao redor.

Procurou embaixo das flores.

Procurou perto das raízes.

Procurou atrás de uma pedra.

Até que encontrou uma folha verdinha, macia e enrolada como uma caminha.

— É essa?

A lagartinha abriu um sorriso.

— É essa! Muito obrigada, Lino.

De novo, Lino sentiu aquele calorzinho.

Dessa vez, mais forte.

Mas sua luz ainda não brilhou.

Ele sentou perto da poça, cansado.

— Acho que não adianta — falou para a lua. — Eu ajudei, procurei, tentei... e continuo apagado.

A lua respondeu com voz macia:

— Às vezes a luz não aparece quando a gente faz força. Ela aparece quando a gente esquece de ter medo.

Lino respirou fundo.

Foi então que ouviu uma voz chamando:

— Lino! Lino!

Era Luna.

Ela voava de um lado para o outro, aflita.

— O menor vagalume da turma se perdeu perto das roseiras. Está escuro e ele não sabe voltar.

Lino levantou depressa.

— Eu ajudo a procurar!

— Mas está muito escuro — disse Luna.

Lino olhou para o jardim.

As sombras estavam grandes.

As folhas balançavam.

A noite parecia enorme.

Mesmo assim, ele pensou no vagaluminho perdido.

Então abriu as asas e voou.

— Estou aqui! — gritou Lino. — Pode chamar por mim!

De trás de uma roseira, veio uma voz bem pequena:

— Eu estou com medo...

Lino pousou perto.

O vagaluminho tremia em cima de uma folha.

— Calma — disse Lino. — Eu vou ficar com você.

— Mas eu não consigo ver o caminho.

Lino também não conseguia.

Então teve uma ideia.

Começou a falar baixinho:

— Vamos dar um passo de cada vez. Primeiro até aquela pétala. Depois até aquela pedrinha. Depois até o galho.

O vagaluminho respirou fundo e foi seguindo Lino.

Um passo.

Mais um.

Mais outro.

Lino falava com tanto carinho, com tanta calma, que o pequeno começou a sorrir.

— Você é muito corajoso — disse o vagaluminho.

Lino sentiu o coração bater quentinho.

E, de repente...

Plim.

Uma luz bem pequena apareceu em sua barriguinha.

Lino parou.

— Eu brilhei?

Luna, que vinha logo atrás, sorriu.

— Brilhou.

Plim.

A luz apareceu de novo.

Pequena, suave e dourada.

Não era a luz mais forte do jardim.

Não piscava rápido como a dos outros.

Mas era bonita.

Era a luz de Lino.

O vagaluminho bateu palminhas.

— Agora consigo ver!

Lino ficou tão feliz que sua luz brilhou um pouco mais.

Quando chegaram de volta ao grupo, todos os vagalumes fizeram uma roda no ar.

Luna disse:

— Viu? Sua luz estava aí o tempo todo.

Lino olhou para a lua.

A lua piscou para ele.

Então Lino entendeu.

Sua luz não aparecia quando ele fazia força para ser igual aos outros.

Ela aparecia quando ele era ele mesmo: cuidadoso, paciente e gentil.

Daquela noite em diante, Lino passou a brilhar do seu jeito.

Às vezes bem fraquinho.

Às vezes um pouco mais forte.

Às vezes só um pontinho dourado no escuro.

Mas tudo bem.

Porque até uma luz pequena pode ajudar alguém a encontrar o caminho.

E, quando o jardim ficava quieto e a noite cobria as flores, Lino voava tranquilo entre os amigos, piscando devagar:

Plim...

Plim...

Plim...

Como uma estrelinha dizendo:

— Eu estou aqui.`

const STORY_13_BODY = `Perto de um lago calminho, onde a água brilhava quando o sol sorria, morava um patinho chamado Pipo.

Pipo tinha penas amarelinhas, pezinhos laranja e um jeito engraçado de andar:

Plec, plec, plec.

Ele morava de um lado do lago com sua mamãe pata e seus irmãos. Do outro lado, havia uma árvore enorme, cheia de sombra gostosa, flores pequeninas e amoras doces que caíam no chão.

Todos os patinhos gostavam de nadar até lá.

Mas Pipo tinha um probleminha.

Ele ainda não sabia nadar muito bem.

Quando entrava na água, batia as patinhas depressa demais, balançava para um lado, balançava para o outro e logo voltava para a beiradinha.

— Não tem pressa, Pipo — dizia a mamãe pata. — Cada patinho aprende no seu tempo.

Mas Pipo olhava para o outro lado do lago e suspirava.

— Eu queria ver a árvore das amoras...

Numa tarde, o vento começou a brincar pelo jardim.

Soprou nas árvores, mexeu nas flores e derrubou muitas folhas sobre o lago.

Uma folha verde caiu.

Depois uma amarela.

Depois uma vermelha.

Pluft.

Pluft.

Pluft.

Pipo olhou para a água e teve uma ideia.

— E se eu fizesse uma ponte?

Ele chamou seus irmãos.

— Uma ponte de folhas!

Os patinhos riram.

— Folha não vira ponte, Pipo.

Mas Pipo não desistiu.

Com o biquinho, ele puxou uma folha grande para perto da margem. Depois puxou outra. E mais outra.

As folhas boiavam na água, uma pertinho da outra, formando um caminho colorido.

A joaninha, que estava passando, perguntou:

— O que você está fazendo?

— Uma ponte para chegar até a árvore das amoras.

A joaninha olhou para as folhas.

— Parece uma ponte muito bonita. Talvez precise de um pouco de cuidado.

Então ela chamou o sapinho Tito, que entendia muito de água.

Tito pulou para perto:

Ploc!

— Folhas escorregam — disse ele. — Mas podem mostrar o caminho.

Pipo pensou um pouco.

— Então eu posso usar a ponte para treinar?

A mamãe pata ouviu de longe e sorriu.

— Pode, meu pequeno. Eu fico ao seu lado.

Pipo respirou fundo e colocou uma patinha na água.

Depois a outra.

As folhas flutuavam na frente dele como pequenos barquinhos coloridos.

— Uma folha de cada vez — disse a mamãe.

Pipo bateu as patinhas devagar.

Chua, chua.

Passou pela folha verde.

Depois pela amarela.

Depois pela vermelha.

Quando ficou com medo, parou.

— E se eu afundar?

A mamãe pata encostou o bico em sua cabeça.

— Você não está sozinho. E suas patinhas sabem aprender.

Pipo tentou de novo.

Chua, chua, chua.

O sapinho acompanhava pulando de folha em folha.

A joaninha voava por cima.

Os irmãos de Pipo ficaram quietinhos, torcendo.

Pouco a pouco, Pipo percebeu uma coisa: ele não estava pisando na ponte.

Ele estava nadando.

As folhas só estavam ali para lembrar o caminho.

— Mamãe! — disse ele, feliz. — Minhas patinhas estão fazendo certo!

— Estão sim — respondeu ela.

Quando Pipo chegou ao outro lado do lago, sacudiu as penas todo orgulhoso.

Plec, plec, plec.

Correu até a árvore grande e olhou para cima.

As amoras pareciam bolinhas roxas escondidas entre as folhas.

Uma caiu bem perto dele.

Poc.

Pipo deu uma bicadinha.

— Hummm! Tem gosto de vitória!

Todos riram.

Na volta, Pipo olhou para o lago. A ponte de folhas já estava se espalhando com o vento.

Antes, ele teria ficado assustado.

Mas agora sorriu.

— Tudo bem. Eu já sei o caminho.

Entrou na água com calma e nadou de volta.

Chua, chua, chua.

Quando chegou à margem, seus irmãos bateram as asinhas.

— Pipo conseguiu!

A mamãe pata o abraçou com as asas quentinhas.

— Viu? Às vezes a gente acha que precisa de uma ponte. Mas, no meio do caminho, descobre que estava aprendendo a atravessar.

Naquela noite, Pipo dormiu cansado e feliz, sonhando com folhas coloridas, amoras docinhas e um lago inteiro esperando por suas patinhas corajosas.`

const STORY_1_LESSON =
  'Cuidar dos outros é muito bonito, mas também precisamos cuidar de nós mesmos. Descansar não é preguiça nem perda de tempo: é o que nos ajuda a recuperar as forças, pensar melhor e continuar fazendo o bem. E quando algo parece grande demais, podemos confiar em quem nos ama e aceitar ajuda.'

const STORY_2_LESSON =
  'Descansar também é uma viagem. Quando diminuímos o ritmo, fechamos os olhos e deixamos as preocupações de lado, nossa imaginação pode nos levar a lugares bonitos e seguros. Dormir nos ajuda a recuperar as forças para viver um novo dia com alegria, coragem e curiosidade.'

const STORY_3_LESSON =
  'Nosso corpo costuma nos avisar quando precisa descansar. O sono não atrapalha a vida: ele nos ajuda a recuperar as forças, melhorar o humor e aproveitar melhor o dia seguinte. Respeitar o momento de parar também é uma forma de cuidar de nós mesmos.'

const STORY_4_LESSON =
  'Sentir-se seguro e acolhido ajuda o coração a ficar tranquilo. Um gesto simples, como dividir uma manta, contar uma história ou oferecer um abraço, pode fazer alguém se sentir muito melhor. Quando cuidamos uns dos outros, até os momentos novos e assustadores podem se transformar em lembranças bonitas.'

const STORY_5_LESSON =
  'Nem todo momento precisa correr. Algumas horas podem ser mais lentas — como um abraço demorado, uma história calma ou o tempo de se preparar para dormir. Desacelerar também é uma forma de cuidar de nós mesmos e de ajudar quem está ao nosso lado a descansar.'

const STORY_6_LESSON =
  'Antes de dormir, podemos ajudar a noite a ficar tranquila: guardando o barulho do dia, respirando com calma e imaginando um sonho bonito. O escuro da noite não é vazio — é como um cobertor que cobre o mundo para que todos possam descansar.'

const STORY_7_LESSON =
  'Trabalhar e ajudar os outros é muito bonito, mas também precisamos cuidar de nós mesmos. Descansar não é preguiça: é o que nos devolve as forças para continuar voando. Às vezes, para seguir fazendo o bem, a gente precisa pousar um pouquinho.'

const STORY_8_LESSON =
  'Às vezes o sonho demora um pouquinho para chegar — e tudo bem. Respirar com calma, fechar os olhos com paciência e esperar com tranquilidade também ajudam. O que importa não é chegar correndo, e sim chegar com carinho.'

const STORY_9_LESSON =
  'Barulhos que parecem assustadores à noite podem ter explicações bonitas. Quando escutamos com calma e imaginamos o que cada som significa, o medo pode virar companhia. A chuva, o vento e a noite também têm suas músicas de dormir.'

const STORY_10_LESSON =
  'Ter medo do escuro é normal. Quando conhecemos a noite com calma — um passinho de cada vez — as sombras podem deixar de parecer tão grandes. Coragem não é não sentir medo: é respirar fundo, olhar com atenção e seguir no nosso tempo.'

const STORY_11_LESSON =
  'Sonhos grandes podem caber em corpos pequenos. Não precisamos chegar correndo — um passinho de cada vez, com paciência e ajuda dos amigos, também leva longe. O caminho pode ser comprido, mas cada pedacinho da viagem também é bonito.'

const STORY_12_LESSON =
  'Não precisamos brilhar igual aos outros para ser especiais. Às vezes nossa luz aparece quando paramos de se comparar e começamos a cuidar de quem precisa. Ser gentil, paciente e corajoso também é uma forma de iluminar o mundo.'

const STORY_13_LESSON =
  'Aprender algo novo pode dar medo, e tudo bem. Com calma, um passo de cada vez e alguém ao nosso lado, a gente descobre que já estava no caminho certo. Coragem não é não sentir medo — é tentar mesmo assim, no nosso tempo.'

const SLEEP_STORY_CONTENTS: Partial<Record<SleepStoryId, SleepStoryContent>> = {
  'story-1': {
    paragraphs: parseParagraphs(STORY_1_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_1_LESSON,
    },
  },
  'story-2': {
    paragraphs: parseParagraphs(STORY_2_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_2_LESSON,
    },
  },
  'story-3': {
    paragraphs: parseParagraphs(STORY_3_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_3_LESSON,
    },
  },
  'story-4': {
    paragraphs: parseParagraphs(STORY_4_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_4_LESSON,
    },
  },
  'story-5': {
    paragraphs: parseParagraphs(STORY_5_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_5_LESSON,
    },
  },
  'story-6': {
    paragraphs: parseParagraphs(STORY_6_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_6_LESSON,
    },
  },
  'story-7': {
    paragraphs: parseParagraphs(STORY_7_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_7_LESSON,
    },
  },
  'story-8': {
    paragraphs: parseParagraphs(STORY_8_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_8_LESSON,
    },
  },
  'story-9': {
    paragraphs: parseParagraphs(STORY_9_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_9_LESSON,
    },
  },
  'story-10': {
    paragraphs: parseParagraphs(STORY_10_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_10_LESSON,
    },
  },
  'story-11': {
    paragraphs: parseParagraphs(STORY_11_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_11_LESSON,
    },
  },
  'story-12': {
    paragraphs: parseParagraphs(STORY_12_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_12_LESSON,
    },
  },
  'story-13': {
    paragraphs: parseParagraphs(STORY_13_BODY),
    lesson: {
      title: 'Lição da história',
      text: STORY_13_LESSON,
    },
  },
  ...GENERATED_SLEEP_STORY_CONTENTS,
}

export function getSleepStoryContent(storyId: SleepStoryId): SleepStoryContent | null {
  return SLEEP_STORY_CONTENTS[storyId] ?? null
}

export function hasSleepStoryContent(storyId: SleepStoryId) {
  return Boolean(SLEEP_STORY_CONTENTS[storyId])
}

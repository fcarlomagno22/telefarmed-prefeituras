import type {
  SleepStoryContent,
  SleepStoryId,
  SleepStoryParagraph,
  SleepStoryParagraphVariant,
} from '../types/sleepStories'

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

const STORY_1_LESSON =
  'Cuidar dos outros é muito bonito, mas também precisamos cuidar de nós mesmos. Descansar não é preguiça nem perda de tempo: é o que nos ajuda a recuperar as forças, pensar melhor e continuar fazendo o bem. E quando algo parece grande demais, podemos confiar em quem nos ama e aceitar ajuda.'

const STORY_2_LESSON =
  'Descansar também é uma viagem. Quando diminuímos o ritmo, fechamos os olhos e deixamos as preocupações de lado, nossa imaginação pode nos levar a lugares bonitos e seguros. Dormir nos ajuda a recuperar as forças para viver um novo dia com alegria, coragem e curiosidade.'

const STORY_3_LESSON =
  'Nosso corpo costuma nos avisar quando precisa descansar. O sono não atrapalha a vida: ele nos ajuda a recuperar as forças, melhorar o humor e aproveitar melhor o dia seguinte. Respeitar o momento de parar também é uma forma de cuidar de nós mesmos.'

const STORY_4_LESSON =
  'Sentir-se seguro e acolhido ajuda o coração a ficar tranquilo. Um gesto simples, como dividir uma manta, contar uma história ou oferecer um abraço, pode fazer alguém se sentir muito melhor. Quando cuidamos uns dos outros, até os momentos novos e assustadores podem se transformar em lembranças bonitas.'

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
}

export function getSleepStoryContent(storyId: SleepStoryId): SleepStoryContent | null {
  return SLEEP_STORY_CONTENTS[storyId] ?? null
}

export function hasSleepStoryContent(storyId: SleepStoryId) {
  return Boolean(SLEEP_STORY_CONTENTS[storyId])
}

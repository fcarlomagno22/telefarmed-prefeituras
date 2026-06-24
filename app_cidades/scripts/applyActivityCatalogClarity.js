#!/usr/bin/env node
/**
 * Applies user-facing clarity copy overrides to activity_catalog.json.
 * Run from repo root: node app_cidades/scripts/applyActivityCatalogClarity.js
 */

const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(
  __dirname,
  '../content/mentalHealth/engine/v1/activity_catalog.json'
);

const CLARITY_OVERRIDES = {
  act_breathing_long_exhale: {
    title: 'Solte o ar devagar, contando até 5',
    subtitle_user: 'Sente-se e respire pelo nariz — só precisa de uma cadeira e um lugar quieto',
    objective_user: 'Ajudar seu corpo a ficar menos agitado com respirações mais lentas',
    steps: [
      'Sente-se numa cadeira, apoie os pés no chão e deixe os ombros caírem.',
      'Inspire pelo nariz contando devagar até 3.',
      'Solte o ar pela boca contando até 5, sem prender o ar no peito.',
      'Repita esse ciclo no seu ritmo; pare se sentir tontura ou falta de ar.',
    ],
  },
  act_breathing_square_gentle: {
    title: 'Respire em quatro tempos iguais',
    subtitle_user: 'Inspire, segure e solte o ar contando até 3 — não precisa de nada além de você',
    objective_user: 'Encontrar um ritmo de respiração mais calmo e regular',
    steps: [
      'Olhe para um ponto fixo na parede e apoie os pés no chão.',
      'Inspire pelo nariz contando até 3.',
      'Segure o ar por 1 segundo e solte devagar contando até 3.',
      'Repita algumas vezes; ao terminar, volte a respirar do jeito que vier natural.',
    ],
  },
  act_breathing_counted_10: {
    title: 'Conte 10 respirações',
    subtitle_user: 'Fique sentado ou em pé e conte cada vez que soltar o ar',
    objective_user: 'Dar uma pausa curta aos pensamentos que não param',
    steps: [
      'Fique com os olhos abertos ou semicerrados, olhando para frente.',
      'Respire normalmente e diga mentalmente "1" ao soltar o ar.',
      'Continue contando até 10; se se perder, volte ao 1 sem se culpar.',
      'Olhe ao redor e diga em voz baixa onde você está antes de encerrar.',
    ],
  },
  act_breathing_hand_anchor: {
    title: 'Apoie a mão no peito e sinta a respiração',
    subtitle_user: 'Use a palma da mão no peito ou na barriga — não precisa mudar como respira',
    objective_user: 'Sentir mais estabilidade no momento presente',
    steps: [
      'Apoie a palma de uma mão no peito ou na barriga, onde for confortável.',
      'Sinta o peito ou a barriga subir e descer com a respiração, sem forçar o ar.',
      'Pressione os pés no chão e olhe ao redor; nomeie três objetos que vê, como cadeira, porta ou janela.',
    ],
  },
  act_breathing_sigh_release: {
    title: 'Solte o ar com um suspiro longo',
    subtitle_user: 'Inspire pelo nariz e solte o ar com um suspiro audível — pode fazer sentado',
    objective_user: 'Aliviar a tensão no corpo em poucos minutos',
    steps: [
      'Perceba se está apertando a mandíbula ou prendendo o ar no peito.',
      'Inspire pelo nariz de forma confortável e solte o ar pela boca com um suspiro longo.',
      'Repita quatro vezes, soltando os dedos das mãos e baixando os ombros a cada suspiro.',
    ],
  },
  act_breathing_evening_slow: {
    title: 'Respire devagar antes de dormir',
    subtitle_user: 'Diminua a luz e sente-se ou deite-se — só precisa de um lugar confortável',
    objective_user: 'Preparar o corpo para descansar na hora de dormir',
    steps: [
      'Diminua a luz do quarto e sente-se ou deite-se numa posição confortável.',
      'Inspire pelo nariz contando até 3, sem esforço.',
      'Solte o ar pela boca contando até 5 e deixe a mandíbula e a língua soltas.',
      'Repita por alguns minutos e depois volte a respirar no seu ritmo normal.',
    ],
  },
  act_grounding_five_senses: {
    title: 'Nomeie o que vê, ouve e sente ao redor',
    subtitle_user: 'Fique onde está e use os cinco sentidos — não precisa de materiais',
    objective_user: 'Trazer a atenção de volta para o lugar e o momento de agora',
    steps: [
      'Olhe ao redor e diga em voz baixa cinco coisas que vê, como mesa, relógio ou parede.',
      'Perceba quatro pontos onde o corpo toca algo: pés no chão, costas na cadeira, mãos no colo.',
      'Ouça três sons (ventilador, carro, voz) e sinta duas temperaturas ou texturas (ar frio, tecido da roupa).',
      'Diga em voz baixa seu nome, o cômodo onde está e o dia de hoje.',
    ],
  },
  act_grounding_feet_press: {
    title: 'Pressione os pés no chão',
    subtitle_user: 'Sente-se numa cadeira com os pés apoiados — só precisa do chão sob você',
    objective_user: 'Sentir o corpo mais firme e presente no lugar',
    steps: [
      'Sente-se numa cadeira e apoie toda a planta dos dois pés no chão.',
      'Pressione os pés contra o chão contando até 5; solte a pressão contando até 5.',
      'Repita cinco vezes enquanto olha três detalhes do ambiente, como cor da parede ou forma da porta.',
    ],
  },
  act_grounding_object_detail: {
    title: 'Observe um objeto perto de você',
    subtitle_user: 'Escolha algo simples, como caneta, copo ou controle — e olhe com atenção',
    objective_user: 'Organizar a atenção em algo concreto e visível',
    steps: [
      'Escolha um objeto neutro perto de você, como caneta, copo, chave ou controle remoto.',
      'Olhe a cor, o formato, o peso na mão, se está quente ou frio e como a superfície se sente.',
      'Diga em voz baixa cinco detalhes, como "azul", "redondo", "leve", sem pensar no que significam.',
      'Coloque o objeto de volta no lugar e olhe ao redor do cômodo antes de terminar.',
    ],
  },
  act_grounding_orientation_card: {
    title: 'Escreva um cartão de orientação',
    subtitle_user: 'Use papel e caneta para registrar onde você está e o que acontece agora',
    objective_user: 'Recuperar referências claras do momento atual',
    steps: [
      'Escreva num papel seu nome, o dia de hoje e o lugar onde está, como "sala" ou "consultório".',
      'Anote três fatos do momento agora, como "luz acesa", "dia chuvoso" ou "estou sozinho".',
      'Leia em voz baixa: "Isso está acontecendo agora; eu posso escolher o próximo passo".',
      'Guarde o papel num bolso, carteira ou criado-mudo para ler de novo se precisar.',
    ],
  },
  act_grounding_cold_texture: {
    title: 'Segure um objeto fresco na mão',
    subtitle_user: 'Use um copo, garrafa ou toalha úmida para acalmar o corpo',
    objective_user: 'Ajudar seu corpo a sair da sobrecarga com uma sensação concreta',
    steps: [
      'Pegue um objeto fresco ou com textura agradável, como copo de água, garrafa ou toalha úmida — nada muito gelado.',
      'Segure o objeto na palma da mão por alguns segundos e diga em voz baixa como se sente: liso, frio, pesado.',
      'Olhe para os pés no chão e depois nomeie três coisas que vê ao redor, como porta, cadeira ou janela.',
    ],
  },
  act_crisis_grounding_name_place: {
    title: 'Diga seu nome e onde está',
    subtitle_user: 'Fique onde está e use a opção de contato na tela — peça ajuda agora',
    objective_user: 'Permanecer no presente até alguém de confiança chegar',
    steps: [
      'Diga em voz alta seu nome completo e o lugar onde está, como "estou na cozinha" ou "estou na rua X".',
      'Coloque os pés no chão e nomeie três coisas que vê, como parede, mesa ou celular.',
      'Toque na opção de contato exibida na tela do celular e fique perto de uma pessoa segura, se houver alguém por perto.',
    ],
  },
  act_crisis_grounding_hold_safe: {
    title: 'Segure um objeto firme e ligue para alguém',
    subtitle_user: 'Use um travesseiro, garrafa ou almofada enquanto chama apoio pelo celular',
    objective_user: 'Ganhar alguns minutos de estabilidade enquanto espera ajuda',
    steps: [
      'Escolha um objeto seguro e firme para segurar com as duas mãos, como travesseiro, garrafa ou almofada.',
      'Diga em voz baixa a textura, a cor e se está quente ou frio, como "macio, azul, morno".',
      'Ligue ou envie mensagem para uma pessoa de confiança usando o botão de contato na tela do celular.',
    ],
  },
  act_crisis_grounding_next_minute: {
    title: 'Faça só o próximo passo seguro',
    subtitle_user: 'Afaste-se do perigo se puder e use a opção de contato na tela',
    objective_user: 'Focar em uma única ação segura de cada vez',
    steps: [
      'Afaste-se de objetos, lugares ou pessoas que aumentem o risco, se puder fazer isso com segurança.',
      'Toque na rota de apoio exibida na tela do celular e escolha ligar ou enviar mensagem.',
      'Fique no lugar mais seguro disponível e concentre-se apenas em completar esse contato agora.',
    ],
  },
  act_journaling_worry_parking: {
    title: 'Escreva as preocupações numa lista',
    subtitle_user: 'Use caderno e caneta para tirar os pensamentos da cabeça',
    objective_user: 'Organizar preocupações sem precisar resolver tudo agora',
    steps: [
      'Escreva num caderno cada preocupação em uma linha, com frases curtas.',
      'Desenhe um círculo ao lado só das preocupações que podem ter uma ação pequena hoje.',
      'Escolha um horário de até 10 minutos hoje ou amanhã para reler a lista.',
      'Feche o caderno e volte a uma tarefa concreta, como lavar um copo ou responder uma mensagem.',
    ],
  },
  act_journaling_three_facts: {
    title: 'Separe fatos do que a mente concluiu',
    subtitle_user: 'Use caderno e caneta para escrever o que aconteceu de fato',
    objective_user: 'Enxergar a situação com mais clareza e menos suposição',
    steps: [
      'Escreva três fatos que uma câmera registraria, como "recebi uma mensagem às 14h" ou "não respondi".',
      'Anote a conclusão que sua mente fez automaticamente, como "a pessoa está brava comigo".',
      'Escreva outra explicação possível que também combine com os fatos, como "a pessoa estava ocupada".',
      'Escolha um próximo passo pequeno e verificável, como "perguntar amanhã se está tudo bem".',
    ],
  },
  act_journaling_energy_map: {
    title: 'Anote sua energia ao longo do dia',
    subtitle_user: 'Use caderno e caneta para marcar manhã, tarde e noite',
    objective_user: 'Planejar o dia respeitando quando você tem mais ou menos energia',
    steps: [
      'Divida o papel em três partes: manhã, tarde e noite.',
      'Dê uma nota de 0 a 5 para a energia em cada período (0 = esgotado, 5 = muito disposto).',
      'Escreva uma atividade que costuma ajudar (caminhada, banho) e uma que costuma esgotar (reunião longa).',
      'Escolha em qual período de amanhã colocar uma tarefa curta de até 15 minutos.',
    ],
  },
  act_journaling_trigger_chain: {
    title: 'Escreva o que veio antes, durante e depois',
    subtitle_user: 'Use caderno e caneta para entender uma sequência sem se culpar',
    objective_user: 'Reconhecer gatilhos e pensar em outra resposta possível',
    steps: [
      'Escreva em uma frase o que aconteceu antes, como "recebi uma crítica no trabalho".',
      'Anote o primeiro sinal no corpo ou pensamento, como "coração acelerado" ou "pensei que sou incapaz".',
      'Registre o que você fez em seguida e o efeito imediato, como "fiquei no celular por uma hora e me senti pior".',
      'Escreva uma alternativa pequena para uma situação parecida, como "sair da sala por cinco minutos".',
    ],
  },
  act_journaling_small_wins: {
    title: 'Registre três coisas do dia',
    subtitle_user: 'Use caderno e caneta — anote o que deu certo, sem forçar positividade',
    objective_user: 'Perceber ações e apoios que já existem no seu dia',
    steps: [
      'Escreva uma coisa que você conseguiu fazer hoje, mesmo pequena, como "tomei café" ou "respondi um e-mail".',
      'Registre uma ajuda recebida ou recurso usado, como "minha irmã me ligou" ou "usei transporte público".',
      'Escreva uma dificuldade que ainda permanece, sem apagar o que funcionou.',
    ],
  },
  act_journaling_sleep_download: {
    title: 'Liste pendências antes de dormir',
    subtitle_user: 'Use papel e caneta na mesa de cabeceira — tire as tarefas da cabeça',
    objective_user: 'Diminuir pensamentos repetidos na hora de dormir',
    steps: [
      'Liste rapidamente no papel as tarefas e preocupações que voltam à mente.',
      'Ao lado de cada item, escreva: "amanhã", "depois" ou "não depende de mim".',
      'Escolha a primeira ação de amanhã e deixe o papel na mesa, longe da cama.',
      'Diga em voz baixa: "Por hoje, isso basta" e apague a luz.',
    ],
  },
  act_journaling_body_neutral: {
    title: 'Escreva o que seu corpo fez por você hoje',
    subtitle_user: 'Use caderno e caneta — foque em funções, não em aparência',
    objective_user: 'Construir uma relação mais neutra e respeitosa com o corpo',
    steps: [
      'Escreva três coisas que seu corpo permitiu hoje, como "caminhei até a cozinha" ou "ouvi uma música".',
      'Não escreva sobre peso, tamanho ou aparência — só sobre o que o corpo fez.',
      'Anote um cuidado prático possível nas próximas horas, como beber água ou trocar de roupa.',
      'Finalize com uma frase respeitosa e realista, como "Meu corpo me levou até aqui hoje".',
    ],
  },
  act_journaling_choice_plan: {
    title: 'Monte um plano de decisão em cinco linhas',
    subtitle_user: 'Use caderno e caneta para transformar confusão em um próximo passo',
    objective_user: 'Organizar uma decisão difícil em partes menores',
    steps: [
      'Escreva qual decisão precisa tomar em uma frase, como "aceitar ou recusar a proposta".',
      'Liste duas opções possíveis e uma consequência provável de cada uma.',
      'Marque com um X a opção mais segura e que dá para desfazer se precisar.',
      'Defina uma ação de até 10 minutos para começar, como "ler o contrato" ou "ligar para perguntar".',
      'Escreva o nome de alguém que pode revisar a decisão com você antes de algo irreversível.',
    ],
  },
  act_behavioral_activation_pleasant_five: {
    title: 'Faça algo agradável por 5 minutos',
    subtitle_user: 'Escolha algo simples — música, banho ou cuidar de planta — mesmo sem vontade',
    objective_user: 'Retomar um pouco de interesse e prazer no dia',
    steps: [
      'Escolha algo simples que já foi agradável, como ouvir uma música, tomar banho ou regar uma planta.',
      'Prepare só o necessário: abrir o app de música, pegar a toalha ou o regador.',
      'Faça a atividade por cinco minutos, sem esperar que a vontade apareça antes.',
      'Dê uma nota de 0 a 5 para como se sentiu e encerre sem se cobrar.',
    ],
  },
  act_behavioral_activation_one_surface: {
    title: 'Organize uma superfície pequena',
    subtitle_user: 'Escolha uma mesa ou criado-mudo — use um cronômetro de 5 minutos',
    objective_user: 'Recuperar sensação de ordem num espaço pequeno',
    steps: [
      'Escolha uma superfície pequena, como mesa de centro, criado-mudo ou bancada da pia.',
      'Separe em três pilhas: lixo, itens para guardar na gaveta e itens que ficam na superfície.',
      'Organize por cinco minutos com o cronômetro do celular.',
      'Pare quando o cronômetro tocar, mesmo que a superfície não esteja perfeita.',
    ],
  },
  act_behavioral_activation_shower_start: {
    title: 'Faça só o primeiro cuidado pessoal',
    subtitle_user: 'Escolha lavar o rosto, escovar os dentes ou trocar de roupa — só essa ação',
    objective_user: 'Facilitar um cuidado básico sem exigir mais do que isso',
    steps: [
      'Escolha um cuidado simples: lavar o rosto na pia, escovar os dentes ou trocar de roupa.',
      'Deixe os itens ao alcance: toalha, escova de dentes ou roupa limpa na cama.',
      'Faça somente a ação escolhida, sem adicionar banho completo ou outras tarefas.',
      'Diga em voz baixa "feito" e reconheça o esforço, mesmo que pareça pequeno.',
    ],
  },
  act_behavioral_activation_outdoor_light: {
    title: 'Saia para ver luz e ar por alguns minutos',
    subtitle_user: 'Vá até a janela, varanda ou calçada — leve o celular se quiser',
    objective_user: 'Ganhar energia e uma referência clara de horário do dia',
    steps: [
      'Vá até uma janela aberta, varanda ou área externa segura perto de casa.',
      'Olhe a luz do céu e sinta o ar no rosto por um minuto.',
      'Caminhe devagar na calçada ou fique sentado na varanda por cinco minutos.',
      'Volte para dentro e anote no celular ou caderno o horário em que fez a atividade.',
    ],
  },
  act_behavioral_activation_body_double: {
    title: 'Faça uma tarefa com alguém por perto',
    subtitle_user: 'Convide alguém por chamada ou presencialmente — a pessoa não precisa ajudar',
    objective_user: 'Facilitar o início de uma tarefa com companhia',
    steps: [
      'Escolha uma tarefa de até dez minutos, como dobrar roupa ou responder e-mails.',
      'Convide alguém para ficar por perto, em chamada de vídeo ou no mesmo cômodo, sem precisar ajudar.',
      'Diga em voz alta qual parte você fará primeiro, como "vou começar pelas camisetas".',
      'Trabalhe por dez minutos e avise quando terminar, mesmo que não tenha concluído tudo.',
    ],
  },
  act_behavioral_activation_walk_block: {
    title: 'Caminhe um trecho curto e conhecido',
    subtitle_user: 'Escolha um caminho seguro perto de casa — leve tênis confortável',
    objective_user: 'Mover o corpo com leveza, sem meta de desempenho',
    steps: [
      'Escolha um trajeto conhecido e seguro, como dar a volta no quarteirão, ou caminhe dentro de casa.',
      'Comece em ritmo confortável por dois minutos, olhando para frente.',
      'Continue por seis minutos observando portas, árvores ou móveis, sem medir velocidade.',
      'Retorne devagar e beba um copo de água se quiser.',
    ],
  },
  act_behavioral_activation_task_sprint: {
    title: 'Trabalhe 15 minutos numa tarefa só',
    subtitle_user: 'Escolha uma tarefa com resultado visível — silencie o celular',
    objective_user: 'Avançar em algo importante sem se dispersar',
    steps: [
      'Escolha uma tarefa com resultado visível em quinze minutos, como responder três e-mails ou lavar a louça.',
      'Silencie notificações do celular ou coloque o celular de cabeça para baixo.',
      'Trabalhe somente na primeira parte da tarefa até o cronômetro de 15 minutos tocar.',
      'Anote num papel ou celular onde parou, para retomar depois com facilidade.',
    ],
  },
  act_behavioral_activation_mastery_twenty: {
    title: 'Termine um projeto pequeno em 20 minutos',
    subtitle_user: 'Escolha algo que dá para concluir hoje — use cronômetro e materiais à mão',
    objective_user: 'Fortalecer a sensação de que você consegue completar algo',
    steps: [
      'Escolha um projeto pequeno que dá para terminar hoje, como organizar uma gaveta ou consertar um botão.',
      'Escreva num papel o que significa "pronto", como "gaveta fechada e itens guardados".',
      'Trabalhe por quinze minutos sem ampliar o projeto para outras áreas.',
      'Use os cinco minutos finais para concluir, guardar ferramentas e anotar o que fez.',
      'Pare no limite de vinte minutos, mesmo que surja vontade de continuar.',
    ],
  },
  act_emotion_regulation_name_need: {
    title: 'Nomeie a emoção e o que você precisa',
    subtitle_user: 'Pare por um minuto — não precisa de materiais, só prestar atenção',
    objective_user: 'Dar forma clara ao que você sente e ao que pode ajudar',
    steps: [
      'Escolha uma palavra simples para a emoção principal, como raiva, medo, tristeza ou ansiedade.',
      'Dê uma nota de 0 a 5 para a intensidade (0 = quase nada, 5 = muito forte).',
      'Pergunte a si mesmo: preciso de pausa, limite, apoio de alguém ou ação concreta?',
      'Escolha apenas uma resposta pequena e segura, como beber água, sair do cômodo ou mandar mensagem.',
    ],
  },
  act_emotion_regulation_pause_urge: {
    title: 'Pause antes de agir no impulso',
    subtitle_user: 'Afaste-se da situação se for seguro — use os pés no chão e a respiração',
    objective_user: 'Escolher a próxima ação com mais calma, sem reagir na hora',
    steps: [
      'Afaste-se por alguns minutos da pessoa, conversa ou tela que disparou o impulso, se for seguro.',
      'Diga em voz baixa o impulso sem obedecer: "Estou com vontade de gritar" ou "Estou com vontade de mandar mensagem".',
      'Pressione os pés no chão e solte o ar devagar três vezes, contando até 5 na saída.',
      'Escolha entre esperar dez minutos, pedir ajuda a alguém ou sair do ambiente.',
    ],
  },
  act_emotion_regulation_temperature_neutral: {
    title: 'Lave as mãos ou o rosto com água fresca',
    subtitle_user: 'Use água da torneira na pia — sem gelo, se isso for seguro para você',
    objective_user: 'Ajudar o corpo a sair de uma onda emocional forte com uma sensação concreta',
    steps: [
      'Verifique se água fresca da torneira é segura para você (sem restrição médica).',
      'Lave as mãos ou o rosto na pia com água fresca, sem usar gelo.',
      'Sinta a temperatura da água na pele e diga três sensações concretas, como "fria", "molhada", "suave".',
      'Seque as mãos ou o rosto com a toalha devagar e observe se a intensidade da emoção mudou.',
    ],
  },
  act_emotion_regulation_opposite_small: {
    title: 'Faça uma ação diferente da vontade',
    subtitle_user: 'Nomeie a emoção e escolha um gesto pequeno na direção oposta',
    objective_user: 'Responder ao momento de um jeito mais útil para você',
    steps: [
      'Diga a emoção e o que ela dá vontade de fazer, como "estou com raiva e quero mandar mensagem grossa".',
      'Pergunte: seguir essa vontade ajuda no longo prazo ou só alivia agora?',
      'Escolha uma ação pequena na direção oposta, como abrir a janela, beber água ou responder com calma.',
      'Faça a ação por até cinco minutos e depois reavalie como se sente.',
    ],
  },
  act_cognitive_reframe_evidence_balance: {
    title: 'Liste fatos a favor e contra o pensamento',
    subtitle_user: 'Use caderno e caneta para examinar o pensamento que está pesando',
    objective_user: 'Construir uma visão mais equilibrada da situação',
    steps: [
      'Escreva o pensamento que está pesando, como "vou perder o emprego".',
      'Liste dois fatos que parecem apoiar esse pensamento.',
      'Liste dois fatos que mostram limites ou outra possibilidade, como "não recebi aviso formal".',
      'Escreva uma frase mais equilibrada, como "pode acontecer, mas ainda não tenho certeza" — não precisa ser positiva.',
    ],
  },
  act_cognitive_reframe_probability: {
    title: 'Separe possível de certo',
    subtitle_user: 'Use caderno e caneta para estimar a chance do que você teme',
    objective_user: 'Diminuir conclusões apressadas sobre o futuro',
    steps: [
      'Escreva o resultado que sua mente está prevendo, como "vou passar mal na reunião".',
      'Dê uma estimativa de chance de 0 a 100, sem buscar precisão — pode ser "40%".',
      'Anote uma alternativa menos ameaçadora que também é possível, como "posso ficar nervoso e ainda assim participar".',
      'Escolha uma ação baseada nos fatos de agora, como "preparar três tópicos" ou "chegar cinco minutos antes".',
    ],
  },
  act_cognitive_reframe_thought_label: {
    title: 'Diga que é um pensamento, não um fato',
    subtitle_user: 'Repita a frase que incomoda com distância — não precisa de materiais',
    objective_user: 'Reduzir o poder de pensamentos que se repetem',
    steps: [
      'Perceba a frase que se repete na cabeça, como "não vou dar conta".',
      'Acrescente no início: "Estou tendo o pensamento de que..." e repita a frase completa.',
      'Diga a frase completa em voz baixa mais duas vezes, devagar.',
      'Volte a uma ação concreta, como lavar uma xícara ou abrir um documento, sem discutir com o pensamento.',
    ],
  },
  act_cognitive_reframe_health_plan: {
    title: 'Organize uma preocupação com o corpo',
    subtitle_user: 'Use caderno e caneta — anote sintomas sem pesquisar na internet',
    objective_user: 'Cuidar de uma preocupação física com passos claros e seguros',
    steps: [
      'Anote o sintoma físico em termos concretos, como "dor de cabeça na testa" — sem interpretar a causa.',
      'Registre há quanto tempo dura, intensidade de 0 a 5 e se mudou nas últimas horas.',
      'Verifique se existe orientação médica prévia ou sinal de urgência que você já conhece.',
      'Escolha entre buscar atendimento agora, agendar consulta ou observar pelo período combinado com seu médico.',
      'Evite novas pesquisas na internet até cumprir o próximo passo escolhido.',
    ],
  },
  act_sleep_hygiene_wind_down: {
    title: 'Faça o mesmo ritual antes de dormir',
    subtitle_user: 'Diminua a luz e repita duas ações simples na mesma ordem toda noite',
    objective_user: 'Preparar corpo e ambiente para descansar',
    steps: [
      'Diminua a luz do quarto e silencie notificações não essenciais do celular.',
      'Escolha duas ações simples, como escovar os dentes e encher um copo de água na mesa de cabeceira.',
      'Faça as duas ações na mesma ordem, sem acrescentar tarefas extras.',
      'Vá para a cama somente depois de terminar o ritual.',
    ],
  },
  act_sleep_hygiene_bed_boundary: {
    title: 'Saia da cama se não conseguir dormir',
    subtitle_user: 'Levante e vá para outro cômodo com pouca luz — volte quando sentir sono',
    objective_user: 'Diminuir o tempo acordado e frustrado na cama',
    steps: [
      'Perceba se está acordado e irritado na cama há mais de vinte minutos.',
      'Levante com cuidado e vá para outro cômodo com pouca luz, como sala ou corredor.',
      'Faça algo monótono e tranquilo, como ler um parágrafo de livro leve — sem celular, trabalho ou notícias.',
      'Volte para a cama quando sentir sono de novo.',
    ],
  },
  act_sleep_hygiene_morning_anchor: {
    title: 'Levante no horário combinado',
    subtitle_user: 'Abra a cortina e beba água — use o celular só para anotar o horário',
    objective_user: 'Dar ao corpo uma referência clara de horário pela manhã',
    steps: [
      'Levante no horário planejado, dentro de uma margem realista de trinta minutos.',
      'Abra a cortina ou vá até a janela para pegar luz natural.',
      'Beba um copo de água e faça uma ação curta em pé, como esticar os braços.',
      'Anote no celular ou caderno o horário em que levantou, para comparar ao longo da semana.',
    ],
  },
  act_sleep_hygiene_caffeine_cutoff: {
    title: 'Defina um horário para parar café e energético',
    subtitle_user: 'Anote a última bebida de hoje e escolha um horário de corte',
    objective_user: 'Proteger o sono da noite, evitando estimulantes tarde demais',
    steps: [
      'Registre no celular ou caderno o horário da última bebida com cafeína de hoje (café, chá preto, energético).',
      'Escolha um horário de corte compatível com sua rotina e orientação de saúde, como "até 14h".',
      'Defina uma alternativa sem cafeína para depois desse horário, como chá de camomila ou água.',
      'Coloque um lembrete no celular para amanhã no horário de corte.',
    ],
  },
  act_sleep_hygiene_night_environment: {
    title: 'Ajuste três coisas no quarto',
    subtitle_user: 'Mude luz, ruído ou temperatura — só o que for confortável para você',
    objective_user: 'Deixar o quarto mais favorável para dormir',
    steps: [
      'Escolha três ajustes possíveis: cortina, ventilador, coberta, roupa de dormir ou trava da porta.',
      'Faça apenas os ajustes que não aumentam desconforto — não force escuridão total se isso incomodar.',
      'Deixe uma luz de corredor ou abajur baixo se a escuridão completa não for confortável.',
      'Verifique se há caminho livre entre a cama e a porta, sem sapatos ou objetos no chão.',
    ],
  },
  act_sleep_hygiene_restless_legs_plan: {
    title: 'Alivie o desconforto nas pernas antes de deitar',
    subtitle_user: 'Movimente tornozelos ou caminhe dois minutos — ajuste coberta e posição',
    objective_user: 'Diminuir desconforto nas pernas à noite sem forçar',
    steps: [
      'Verifique se há dor intensa, inchaço ou orientação médica que exija outro cuidado — nesse caso, siga o médico.',
      'Faça movimentos leves de tornozelo sentado ou caminhe pelo corredor por dois minutos, se for seguro.',
      'Ajuste a posição das pernas na cama e a roupa de cama — solte cobertas apertadas.',
      'Anote de 0 a 5 se o desconforto mudou depois desses cuidados.',
    ],
  },
  act_mindfulness_sound_window: {
    title: 'Ouça três sons ao redor',
    subtitle_user: 'Fique sentado com os olhos abertos — preste atenção nos sons sem julgar',
    objective_user: 'Descansar a atenção nos sons do momento presente',
    steps: [
      'Sente-se com os olhos abertos e olhe para um ponto neutro na parede ou no chão.',
      'Ouça um som perto (relógio), um som a média distância (carro) e um som longe (voz na rua).',
      'Nomeie cada som pelo que é — "tic-tac", "motor", "conversa" — sem buscar significado.',
      'Olhe três objetos do cômodo, como porta, luminária e cadeira, antes de encerrar.',
    ],
  },
  act_mindfulness_one_task: {
    title: 'Faça uma tarefa simples com atenção total',
    subtitle_user: 'Escolha algo como preparar água ou dobrar uma camiseta — silencie o celular',
    objective_user: 'Reduzir dispersão por alguns minutos focando numa coisa só',
    steps: [
      'Escolha uma tarefa simples e segura, como encher um copo de água ou dobrar uma camiseta.',
      'Silencie notificações do celular ou coloque o celular em outro cômodo.',
      'Faça a tarefa percebendo movimentos das mãos, sons da água ou do tecido e a ordem dos passos.',
      'Ao terminar, diga em voz baixa: "Essa tarefa acabou".',
    ],
  },
  act_mindfulness_leaf_stream: {
    title: 'Deixe pensamentos passarem como folhas no rio',
    subtitle_user: 'Sente-se com os olhos abertos — use a imagem de folha no riacho',
    objective_user: 'Observar pensamentos sem precisar seguir cada um',
    steps: [
      'Sente-se numa cadeira com os olhos abertos ou semicerrados, pés no chão.',
      'Quando um pensamento surgir, diga mentalmente "pensamento" — sem entrar no conteúdo.',
      'Imagine colocar esse pensamento numa folha que flutua num riacho e segue corrente abaixo.',
      'Volte a sentir os pés no chão sempre que a imagem do riacho aumentar o desconforto.',
    ],
  },
  act_body_scan_three_zones: {
    title: 'Observe pés, mãos e ombros',
    subtitle_user: 'Fique sentado com os olhos abertos — não procure problemas no corpo',
    objective_user: 'Perceber sinais do corpo com calma e sem julgamento',
    steps: [
      'Mantenha os olhos abertos e escolha três áreas: pés, mãos e ombros.',
      'Olhe para cada área por alguns segundos, sem mover ou massagear — só observar.',
      'Use palavras neutras para descrever sensações, como "quente", "frio", "leve" ou "firme".',
      'Se surgir desconforto forte, pare de olhar o corpo e olhe três objetos do ambiente.',
    ],
  },
  act_body_scan_tension_release: {
    title: 'Aperte e solte mãos, ombros e rosto',
    subtitle_user: 'Sente-se e contraia cada parte por 3 segundos — não use áreas com dor',
    objective_user: 'Reconhecer e aliviar tensão muscular de forma suave',
    steps: [
      'Escolha mãos, ombros e rosto — não use áreas com dor, lesão ou orientação médica contrária.',
      'Feche as mãos em punho suave por três segundos e solte, abrindo os dedos.',
      'Eleve os ombros em direção às orelhas por três segundos e solte; depois relaxe testa e mandíbula.',
      'Respire normalmente e compare como mãos, ombros e rosto se sentem antes e depois.',
    ],
  },
  act_body_scan_neutral_comfort: {
    title: 'Encontre uma parte do corpo confortável',
    subtitle_user: 'Sente-se e procure uma área neutra — compare com um objeto perto',
    objective_user: 'Equilibrar a atenção no corpo sem focar só no desconforto',
    steps: [
      'Sente-se e observe o corpo de forma ampla, sem examinar sintomas ou procurar doença.',
      'Procure uma área neutra ou confortável, mesmo pequena, como antebraço ou costas na cadeira.',
      'Descreva essa área em voz baixa: textura da pele, temperatura ou apoio da cadeira.',
      'Alterne a atenção entre essa área do corpo e um objeto do ambiente, como mesa ou almofada.',
    ],
  },
  act_social_micro_step_check_in: {
    title: 'Mande uma mensagem curta para alguém',
    subtitle_user: 'Escolha uma pessoa segura no celular — uma frase basta',
    objective_user: 'Diminuir o isolamento com um contato simples',
    steps: [
      'Escolha uma pessoa segura e acessível na lista de contatos do celular.',
      'Envie uma mensagem curta, como "Oi, lembrei de você. Como está?"',
      'Não espere resposta imediata; volte a uma atividade do momento, como preparar um lanche.',
    ],
  },
  act_social_micro_step_specific_help: {
    title: 'Peça uma ajuda pequena e clara',
    subtitle_user: 'Escolha alguém de confiança e escreva o pedido antes de enviar',
    objective_user: 'Pedir um apoio concreto que a outra pessoa possa fazer',
    steps: [
      'Escolha uma pessoa em quem costuma confiar, como amigo, familiar ou colega.',
      'Defina um pedido pequeno: conversar dez minutos, ficar na chamada enquanto você faz uma tarefa ou lembrar um compromisso.',
      'Escreva o pedido de forma direta e respeitosa no celular antes de enviar.',
      'Envie a mensagem e pense numa alternativa caso a pessoa não possa, como "tudo bem, tento outra hora".',
    ],
  },
  act_social_micro_step_shared_task: {
    title: 'Faça tarefas paralelas com alguém por 10 minutos',
    subtitle_user: 'Convide alguém por chamada ou presencialmente — cada um faz a sua tarefa',
    objective_user: 'Ganhar apoio para iniciar ou manter uma tarefa',
    steps: [
      'Convide alguém para ficar juntos por dez minutos, em chamada de vídeo ou no mesmo cômodo.',
      'Diga qual tarefa você fará, como "vou lavar louça", e pergunte qual tarefa a pessoa fará.',
      'Mantenham a chamada ou a presença sem obrigação de conversar — só trabalhar em paralelo.',
      'Ao final, cada um diz em uma frase o que conseguiu avançar.',
    ],
  },
  act_social_micro_step_boundary_sentence: {
    title: 'Prepare uma frase de limite',
    subtitle_user: 'Escolha uma situação segura e escreva: "Eu consigo..., mas não consigo..."',
    objective_user: 'Proteger seu espaço em uma conversa com palavras claras',
    steps: [
      'Escolha uma situação de baixo risco, sem violência ou ameaça — não use se não estiver seguro.',
      'Complete num papel ou celular: "Eu consigo..., mas não consigo...", como "Eu consigo conversar amanhã, mas não consigo agora".',
      'Leia a frase em voz alta com tom calmo, olhando para frente.',
      'Envie ou use a frase na conversa apenas se isso for seguro para você.',
    ],
  },
  act_social_micro_step_repair_conversation: {
    title: 'Organize uma conversa de reparo em três partes',
    subtitle_user: 'Use caderno e caneta — escreva fato, impacto e pedido antes de falar',
    objective_user: 'Conduzir uma conversa importante com mais clareza e calma',
    steps: [
      'Escolha uma conversa sem risco de violência que possa ser adiada se necessário.',
      'Escreva em uma frase o fato observado, sem acusação, como "quando você chegou atrasado ontem".',
      'Escreva como isso afetou você e qual pedido concreto deseja, como "preciso que avise quando atrasar".',
      'Combine um horário breve para a conversa e use só essas três partes, sem trazer outros conflitos.',
      'Se a conversa esquentar, diga "vamos pausar" e retome apenas quando houver segurança.',
    ],
  },
  act_gradual_exposure_social_greeting: {
    title: 'Dê um cumprimento curto a alguém conhecido',
    subtitle_user: 'Escolha uma situação segura — prepare uma frase como "Oi, tudo bem?"',
    objective_user: 'Dar um passo pequeno numa situação social que você evita',
    steps: [
      'Escolha uma situação segura e breve, como cumprimentar um vizinho ou colega conhecido.',
      'Planeje uma frase curta, como "Oi, tudo bem?" ou "Bom dia".',
      'Faça o cumprimento e fique por alguns segundos, olhando para a pessoa ou para frente.',
      'Se ficar muito difícil, afaste-se com calma, respire naturalmente e registre que tentou.',
    ],
  },
  act_gradual_exposure_delay_check: {
    title: 'Espere 2 minutos antes de checar de novo',
    subtitle_user: 'Use o cronômetro do celular — escolha uma checagem de baixo risco',
    objective_user: 'Ganhar liberdade diante de um impulso repetitivo de checar algo',
    steps: [
      'Escolha uma checagem de baixo risco, como reler uma mensagem — nunca algo de segurança real, como fechadura ou fogão.',
      'Quando a vontade de checar surgir, abra o cronômetro do celular e marque dois minutos.',
      'Durante a espera, diga em voz baixa: "Posso sentir incerteza sem resolver agora".',
      'Ao final dos dois minutos, escolha conscientemente checar ou não; se ficar muito difícil, pare e respire.',
    ],
  },
  act_gradual_exposure_avoided_task: {
    title: 'Comece a tarefa evitada por 3 minutos',
    subtitle_user: 'Abra o material ou prepare o espaço — não precisa terminar tudo',
    objective_user: 'Reduzir a barreira de começar algo que você vem adiando',
    steps: [
      'Escolha uma tarefa evitada que seja segura e reversível, como abrir e-mails ou separar documentos.',
      'Abra o laptop, caderno ou pasta — prepare o espaço sem exigir conclusão.',
      'Trabalhe por três minutos na parte mais simples, como ler o assunto de um e-mail ou listar três itens.',
      'Se ficar muito difícil, pare, respire e anote num papel onde conseguiu chegar.',
    ],
  },
  act_gradual_exposure_uncertainty_choice: {
    title: 'Decida algo pequeno sem ter certeza total',
    subtitle_user: 'Escolha roupa, refeição ou ordem de tarefas — defina um tempo limite',
    objective_user: 'Praticar decidir com informação suficiente, sem buscar certeza absoluta',
    steps: [
      'Escolha uma decisão de baixo impacto, como qual roupa vestir, o que almoçar ou qual tarefa fazer primeiro.',
      'Defina um limite curto para decidir, como dois minutos no cronômetro do celular.',
      'Tome a decisão sem pedir confirmação extra a outra pessoa ou ao celular.',
      'Mantenha a escolha por alguns minutos; se ficar muito difícil, pare e respire devagar.',
    ],
  },
  act_gradual_exposure_safe_place_step: {
    title: 'Visite um lugar seguro por até 5 minutos',
    subtitle_user: 'Escolha um local sem ligação com perigo atual — leve celular como referência',
    objective_user: 'Diminuir a evitação de um lugar do dia a dia, com controle',
    steps: [
      'Escolha um lugar objetivamente seguro, como mercado, praça ou corredor do prédio — sem ligação com violência atual.',
      'Defina um ponto de parada próximo, como banco na praça, e leve o celular com contato de apoio salvo.',
      'Permaneça por até cinco minutos observando o ambiente atual: pessoas, sons, cores.',
      'Volte pelo caminho combinado; se ficar muito difícil, afaste-se, respire e registre que tentou.',
    ],
  },
  act_self_compassion_friend_voice: {
    title: 'Responda a si como responderia a um amigo',
    subtitle_user: 'Use caderno e caneta para escrever a frase crítica e uma resposta gentil',
    objective_user: 'Reduzir a autocrítica no momento com uma voz mais justa',
    steps: [
      'Escreva a frase crítica que apareceu, como "sou preguiçoso".',
      'Imagine que um amigo querido dissesse a mesma frase sobre si — como você responderia a ele?',
      'Escreva essa resposta firme e gentil no caderno, como falaria para o amigo.',
      'Leia a resposta em voz baixa para você, sem exigir que pareça totalmente verdadeira agora.',
    ],
  },
  act_self_compassion_hand_support: {
    title: 'Apoie a mão no braço ou peito',
    subtitle_user: 'Use o toque da própria mão ou segure um objeto confortável',
    objective_user: 'Oferecer acolhimento ao corpo no momento difícil',
    steps: [
      'Escolha apoiar a palma da mão no braço, no peito ou segurar um objeto confortável, como almofada ou coberta.',
      'Diga em voz baixa: "Este momento está difícil".',
      'Acrescente: "Posso dar um passo pequeno de cuidado agora".',
      'Olhe ao redor e escolha esse passo, como beber água ou abrir a janela.',
    ],
  },
  act_self_compassion_body_respect: {
    title: 'Faça um cuidado simples com o corpo',
    subtitle_user: 'Escolha roupa confortável, água ou descanso — sem julgar peso ou aparência',
    objective_user: 'Fortalecer cuidado com o corpo de forma neutra e respeitosa',
    steps: [
      'Perceba uma crítica sobre o corpo que surgiu, como "estou feio" — não discuta com ela, só note.',
      'Escolha uma ação neutra de cuidado, como vestir roupa confortável, beber água ou deitar cinco minutos.',
      'Faça a ação sem usar peso ou aparência como medida de valor.',
      'Anote de 0 a 5 como ficou o conforto no corpo depois do cuidado.',
    ],
  },
  act_self_compassion_common_humanity: {
    title: 'Lembre que outras pessoas também passam por isso',
    subtitle_user: 'Diga a dificuldade em uma frase — escolha um passo de conexão ou descanso',
    objective_user: 'Diminuir vergonha e sensação de estar sozinho na dificuldade',
    steps: [
      'Nomeie a dificuldade em uma frase simples, como "estou muito ansioso com a entrevista".',
      'Lembre que outras pessoas também enfrentam momentos parecidos — sem comparar quem sofre mais.',
      'Diga em voz baixa: "Eu posso atravessar este minuto com cuidado".',
      'Escolha uma ação pequena de conexão ou descanso, como mandar mensagem ou deitar de olhos fechados por dois minutos.',
    ],
  },
  act_substance_harm_reduction_delay_contact: {
    title: 'Pause, beba água e fale com alguém',
    subtitle_user: 'Afaste-se do gatilho se for seguro — use o celular para pedir companhia',
    objective_user: 'Criar tempo para uma escolha mais segura antes de decidir',
    steps: [
      'Afaste-se por alguns minutos do bar, festa ou conversa que disparou a vontade, se for seguro.',
      'Beba um copo de água se não houver restrição médica.',
      'Envie mensagem no celular para uma pessoa de confiança dizendo: "Preciso de companhia agora".',
      'Adie qualquer decisão sobre consumo até completar o contato e reavaliar como se sente.',
    ],
  },
  act_substance_harm_reduction_trigger_exit: {
    title: 'Saia do lugar ou situação gatilho',
    subtitle_user: 'Identifique o gatilho e mude de cômodo — leve celular e água',
    objective_user: 'Reduzir exposição a um gatilho imediato antes de decidir',
    steps: [
      'Identifique o gatilho presente: lugar (bar), pessoa, horário (fim de tarde) ou emoção (tédio).',
      'Escolha uma saída segura e simples, como mudar de cômodo, encerrar a conversa ou ir embora do local.',
      'Leve celular, garrafa de água e contato de apoio salvo, quando fizer sentido.',
      'Ao chegar ao novo local, anote de 0 a 5 a força da vontade que ainda sente.',
    ],
  },
  act_substance_harm_reduction_safe_plan: {
    title: 'Escreva um plano de segurança para os próximos dias',
    subtitle_user: 'Use caderno ou celular — liste gatilhos, apoio e saídas seguras',
    objective_user: 'Organizar escolhas de proteção antes do gatilho aparecer',
    steps: [
      'Liste no papel ou celular os dois gatilhos mais prováveis do próximo período, como "sexta à noite" ou "briga com fulano".',
      'Escolha uma forma segura de reduzir contato com cada gatilho, como não ir ao local X ou avisar alguém antes.',
      'Defina uma pessoa ou serviço para procurar se a vontade aumentar, como amigo, familiar ou CVV 188.',
      'Planeje transporte e companhia seguros para chegar e sair — sem orientar quantidade ou forma de consumo.',
      'Salve o plano numa nota do celular ou papel no bolso, fácil de acessar.',
    ],
  },
};

function applyOverrides(catalog) {
  const ids = catalog.activities.map((a) => a.id);
  const overrideIds = Object.keys(CLARITY_OVERRIDES);

  if (overrideIds.length !== ids.length) {
    const missing = ids.filter((id) => !CLARITY_OVERRIDES[id]);
    const extra = overrideIds.filter((id) => !ids.includes(id));
    throw new Error(
      `Override count mismatch. Catalog: ${ids.length}, overrides: ${overrideIds.length}. ` +
        `Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`
    );
  }

  for (const activity of catalog.activities) {
    const override = CLARITY_OVERRIDES[activity.id];
    if (!override) {
      throw new Error(`Missing override for activity: ${activity.id}`);
    }

    if (override.steps.length !== activity.steps.length) {
      throw new Error(
        `Step count mismatch for ${activity.id}: catalog has ${activity.steps.length}, override has ${override.steps.length}`
      );
    }

    activity.title = override.title;
    activity.subtitle_user = override.subtitle_user;
    activity.objective_user = override.objective_user;

    override.steps.forEach((instruction, index) => {
      activity.steps[index].instruction_user = instruction;
    });
  }

  return catalog;
}

function main() {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(raw);

  applyOverrides(catalog);

  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

  console.log(`Applied clarity overrides to ${Object.keys(CLARITY_OVERRIDES).length} activities.`);
  console.log(`Updated: ${CATALOG_PATH}`);
}

main();

#!/usr/bin/env node
/**
 * Builds scripts/data/formTheWordSource.js from real Portuguese word lists.
 * Sources (downloaded on demand):
 * - Frequency: hermitdave/FrequencyWords pt_50k
 * - Lexicon accents: fserb/pt-br lexico
 *
 * Run: node app_cidades/scripts/data/buildFormTheWordSource.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const OUTPUT = path.join(__dirname, 'formTheWordSource.js')
const HINTS_PATH = path.join(__dirname, 'formTheWordHints.json')
const DATA_DIR = __dirname
const FREQ_PATH = path.join(DATA_DIR, 'pt_50k.txt')
const LEXICON_PATH = path.join(DATA_DIR, 'pt_lexico.txt')
const TARGET_PER_DIFFICULTY = 1000

const FREQ_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt/pt_50k.txt'
const LEXICON_URL = 'https://raw.githubusercontent.com/fserb/pt-br/master/lexico'

const STOPWORDS = new Set([
  'a', 'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na',
  'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre', 'ante', 'apos', 'após', 'ate', 'até',
  'que', 'se', 'e', 'ou', 'mas', 'nem', 'pois', 'porque', 'como', 'quando', 'onde', 'quem', 'qual',
  'quais', 'quanto', 'quantos', 'quanta', 'quantas', 'eu', 'tu', 'ele', 'ela', 'nós', 'nos', 'vós',
  'vos', 'eles', 'elas', 'me', 'te', 'lhe', 'lhes', 'meu', 'minha', 'teu', 'tua', 'seu', 'sua',
  'nosso', 'nossa', 'vosso', 'vossa', 'dele', 'dela', 'deles', 'delas', 'isso', 'isto', 'esse',
  'essa', 'este', 'esta', 'estes', 'estas', 'esses', 'essas', 'aquele', 'aquela', 'aquilo', 'sim',
  'nao', 'não', 'ja', 'já', 'ainda', 'bem', 'mal', 'muito', 'muita', 'muitos', 'muitas', 'pouco',
  'pouca', 'mais', 'menos', 'tao', 'tão', 'tambem', 'também', 'só', 'so', 'aqui', 'ai', 'aí',
  'la', 'lá', 'cá', 'ca', 'ali', 'agora', 'hoje', 'ontem', 'amanha', 'amanhã', 'sempre', 'nunca',
  'jamais', 'ser', 'estar', 'ter', 'haver', 'ir', 'vir', 'ver', 'dar', 'fazer', 'poder', 'dizer',
  'saber', 'querer', 'ficar', 'dever', 'passar', 'falar', 'achar', 'parecer', 'deixar', 'levar',
  'pensar', 'entrar', 'sair', 'chegar', 'voltar', 'encontrar', 'pedir', 'receber', 'chamar',
  'seguir', 'viver', 'morrer', 'nascer', 'crescer', 'abrir', 'fechar', 'comecar', 'começar',
  'terminar', 'acabar', 'continuar', 'esperar', 'procurar', 'perder', 'ganhar', 'correr', 'andar',
  'subir', 'descer', 'pular', 'nadar', 'dormir', 'acordar', 'comer', 'beber', 'rir', 'chorar',
  'ouvir', 'escutar', 'sentar', 'levantar', 'trabalhar', 'estudar', 'aprender', 'ensinar', 'ler',
  'escrever', 'foi', 'era', 'sao', 'são', 'está', 'estao', 'estão', 'tem', 'tinha', 'têm', 'tinham',
  'há', 'ha', 'houve', 'vai', 'vão', 'vao', 'ia', 'iam', 'foram', 'sera', 'será', 'seria', 'sou',
  'és', 'es', 'somos', 'fui', 'fomos', 'seja', 'sejam', 'estou', 'estamos', 'estava', 'estavam',
  'vamos', 'tenho', 'temos', 'tinha', 'vou', 'vai', 'vão', 'sei', 'sabe', 'sabem', 'quero', 'quer',
  'querem', 'pode', 'podem', 'posso', 'podia', 'faz', 'fazem', 'fez', 'feito', 'diz', 'dizem', 'disse',
  'tudo', 'nada', 'algo', 'alguem', 'alguém', 'ninguem', 'ninguém', 'cada', 'outro', 'outra', 'outros',
  'outras', 'mesmo', 'mesma', 'mesmos', 'mesmas', 'tal', 'tais', 'tanto', 'tanta', 'tantos', 'tantas',
  'todo', 'toda', 'todos', 'todas', 'qualquer', 'quaisquer', 'voce', 'você', 'voces', 'vocês', 'mim',
  'contigo', 'conosco', 'coisa', 'coisas', 'lugar', 'vez', 'vezes', 'dia', 'dias', 'ano', 'anos',
  'tempo', 'modo', 'forma', 'parte', 'partes', 'tipo', 'tipos', 'nome', 'nomes', 'fato', 'fatos',
  'ponto', 'pontos', 'caso', 'casos', 'grupo', 'grupos', 'numero', 'número', 'numeros', 'números',
  'obrigado', 'obrigada', 'desculpa', 'desculpe', 'porfavor', 'favor', 'entao', 'então', 'depois',
  'antes', 'enquanto', 'desde', 'entre', 'contra', 'apenas', 'somente', 'quase', 'talvez', 'certeza',
  'verdade', 'parece', 'parecia', 'preciso', 'precisa', 'precisam', 'precisamos', 'precisava',
  'queres', 'estas', 'estais', 'estive', 'estivemos', 'havia', 'haviam', 'fora', 'serao', 'serão',
  'teria', 'teriam', 'faria', 'fariam', 'daria', 'corta', 'cortar', 'cortou', 'mataram', 'comprei',
  'liguei', 'fria', 'frio', 'quente', 'grande', 'grandes', 'pequeno', 'pequena', 'novo', 'nova',
  'velho', 'velha', 'bom', 'boa', 'bons', 'boas', 'mau', 'maus', 'ruim', 'ruins', 'melhor', 'melhores',
  'pior', 'piores', 'primeiro', 'primeira', 'ultimo', 'último', 'proximo', 'próximo', 'unico', 'único',
])

const BLOCKLIST = new Set([
  'homer', 'terry', 'harry', 'john', 'mary', 'mike', 'jack', 'rose', 'joe', 'tom', 'bob', 'kate',
  'aa', 'aaa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj', 'kk', 'll', 'mm', 'nn', 'oo',
  'pp', 'qq', 'rr', 'ss', 'tt', 'uu', 'vv', 'ww', 'xx', 'yy', 'zz',
])

const VERB_LIKE = new Set([
  'estou', 'estamos', 'estava', 'estavam', 'estive', 'estiver', 'estaria', 'estariam', 'estejam',
  'vamos', 'vai', 'vao', 'vão', 'iam', 'iria', 'iriam', 'fomos', 'foram', 'seria', 'seriam',
  'tenho', 'temos', 'tinha', 'tinham', 'tiver', 'teria', 'teriam', 'houve', 'havia', 'haviam',
  'sei', 'sabem', 'sabia', 'sabiam', 'quero', 'querem', 'queria', 'queriam', 'pode', 'podem',
  'podia', 'podiam', 'posso', 'faz', 'fazem', 'fazia', 'faziam', 'fez', 'diz', 'dizem', 'disse',
  'dissem', 'falei', 'falou', 'falava', 'parece', 'parecia', 'pareciam', 'preciso', 'precisa',
  'precisam', 'precisamos', 'precisava', 'consegue', 'consegui', 'conseguir', 'conseguia',
  'deixa', 'deixam', 'deixou', 'deixei', 'leva', 'levam', 'levou', 'levei', 'volta', 'voltam',
  'voltou', 'voltei', 'chega', 'chegam', 'chegou', 'cheguei', 'olha', 'olham', 'olhou', 'olhei',
  'acha', 'acham', 'achou', 'achei', 'penso', 'pensa', 'pensam', 'pensou', 'pensei', 'sinto',
  'sente', 'sentem', 'sentiu', 'senti', 'fico', 'fica', 'ficam', 'ficou', 'fiquei', 'passo',
  'passa', 'passam', 'passou', 'passei', 'chama', 'chamam', 'chamou', 'chamei', 'lembro',
  'lembra', 'lembram', 'lembrou', 'lembramos', 'mataram', 'comprei', 'liguei', 'corta', 'cortou',
  'cortei', 'abriu', 'abrir', 'fechou', 'fechar', 'ajuda', 'ajudam', 'ajudou', 'ajudei',
])

const { CURATED_HINTS: SEED_HINTS } = require('./formTheWordSeedHints')

function loadHintsIndex() {
  const index = new Map()

  for (const [key, hint] of Object.entries(SEED_HINTS)) {
    index.set(normalize(key), hint)
  }

  if (fs.existsSync(HINTS_PATH)) {
    const fileHints = JSON.parse(fs.readFileSync(HINTS_PATH, 'utf8'))
    for (const [key, hint] of Object.entries(fileHints)) {
      if (hint) index.set(normalize(key), hint)
    }
  }

  return index
}

function ensureDataFile(filePath, url) {
  if (fs.existsSync(filePath)) return
  console.log(`Downloading ${url} ...`)
  execSync(`curl -fsSL "${url}" -o "${filePath}"`, { stdio: 'inherit' })
}

function normalize(word) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function capitalize(word) {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function isGameWord(word) {
  if (!word || word.length < 3) return false
  if (!/^[A-Za-zÀ-ÿ]+$/.test(word)) return false
  const key = normalize(word)
  if (STOPWORDS.has(key)) return false
  if (BLOCKLIST.has(key)) return false
  if (VERB_LIKE.has(key)) return false
  if (/^[0-9]/.test(word)) return false
  return true
}

function mustExistInLexicon(freqWord, lexiconIndex) {
  const key = normalize(freqWord)
  return lexiconIndex.has(key)
}

function buildLexiconIndex(lines) {
  const index = new Map()

  for (const line of lines) {
    const word = line.trim()
    if (!word) continue
    const key = normalize(word)
    if (!index.has(key)) index.set(key, [])
    const variants = index.get(key)
    if (!variants.includes(word)) variants.push(word)
  }

  return index
}

function pickAccentForm(freqWord, lexiconIndex) {
  const exact = lexiconIndex.get(freqWord)
  if (exact && exact.length > 0) {
    return exact.sort((a, b) => a.length - b.length)[0]
  }

  const normalized = normalize(freqWord)
  const variants = lexiconIndex.get(normalized)
  if (!variants || variants.length === 0) return freqWord

  const preferred = variants
    .filter((word) => /^[a-zà-ÿ]+$/i.test(word))
    .sort((a, b) => a.length - b.length)

  return preferred[0] ?? variants[0]
}

function classifyDifficulty(word) {
  const length = [...word].length
  const hasAccent = word !== normalize(word)

  if (length <= 4) return 'facil'
  if (length <= 5 && !hasAccent) return 'facil'
  if (length <= 7 && !hasAccent) return 'medio'
  if (length <= 8) return 'medio'
  return 'dificil'
}

function hintFor(word, hintsIndex) {
  const key = normalize(word)
  const cached = hintsIndex.get(key)
  if (cached) return cached

  const length = [...word].length
  if (word !== key && word.endsWith('ção')) {
    return `Ação ou processo relacionado a "${capitalize(word.slice(0, -4))}"`
  }
  if (length >= 9) return `Termo de ${length} letras do português`
  return `Palavra de ${length} letras`
}

function collectCandidates(freqLines, lexiconIndex, hintsIndex) {
  const seen = new Set()
  const pools = { facil: [], medio: [], dificil: [] }

  for (let rank = 0; rank < freqLines.length; rank += 1) {
    const line = freqLines[rank]
    const [rawWord] = line.split(/\s+/)
    if (!rawWord) continue

    const freqWord = rawWord.trim().toLowerCase()
    if (!isGameWord(freqWord)) continue
    if (!mustExistInLexicon(freqWord, lexiconIndex)) continue
    if (rank < 1200) continue

    const accented = pickAccentForm(freqWord, lexiconIndex)
    if (!isGameWord(accented)) continue

    const key = normalize(accented)
    if (seen.has(key)) continue
    seen.add(key)

    const difficulty = classifyDifficulty(accented)
    pools[difficulty].push({
      word: capitalize(accented),
      hint: hintFor(accented, hintsIndex),
      difficulty,
      rank,
    })
  }

  return pools
}

function fillPool(pool, difficulty, lexiconLines, seenGlobal, freqSet, hintsIndex) {
  if (pool.length >= TARGET_PER_DIFFICULTY) {
    return pool.slice(0, TARGET_PER_DIFFICULTY)
  }

  for (const line of lexiconLines) {
    if (pool.length >= TARGET_PER_DIFFICULTY) break

    const word = line.trim()
    if (!isGameWord(word)) continue

    const key = normalize(word)
    if (seenGlobal.has(key)) continue
    if (!freqSet.has(key) && classifyDifficulty(word) === 'facil') continue

    const wordDifficulty = classifyDifficulty(word)
    if (wordDifficulty !== difficulty) continue

    seenGlobal.add(key)
    pool.push({
      word: capitalize(word),
      hint: hintFor(word, hintsIndex),
      difficulty,
    })
  }

  return pool.slice(0, TARGET_PER_DIFFICULTY)
}

function pack(hint, difficulty, words) {
  return words.map((word) => ({ word: capitalize(word), hint, difficulty }))
}

const CURATED_BASE = {
  facil: [
    ...pack('Animal doméstico que mia', 'facil', ['gato', 'cão', 'rato', 'pato', 'urso', 'lobo', 'peixe', 'sapo', 'galo', 'peru', 'vaca', 'boi', 'porco', 'ovelha', 'cabra', 'formiga', 'abelha', 'mosca', 'grilo', 'cobra', 'tatu', 'ema', 'foca', 'orca', 'lontra']),
    ...pack('Fruta ou legume', 'facil', ['uva', 'pera', 'figo', 'kiwi', 'maçã', 'manga', 'melão', 'pêssego', 'ameixa', 'coco', 'cebola', 'alho', 'milho', 'batata', 'cenoura', 'abóbora', 'pepino', 'tomate', 'alface', 'couve', 'nabo', 'inhame', 'mandioca', 'quiabo', 'chuchu', 'abacate', 'limão', 'laranja', 'banana', 'morango']),
    ...pack('Cor', 'facil', ['azul', 'rosa', 'roxo', 'ouro', 'prata', 'bege', 'creme', 'marrom', 'preto', 'branco', 'verde', 'amarelo', 'cinza', 'lilás', 'ocre', 'coral', 'violeta']),
    ...pack('Parte do corpo', 'facil', ['mão', 'pé', 'olho', 'nariz', 'boca', 'orelha', 'dente', 'pele', 'unha', 'joelho', 'coxa', 'perna', 'braço', 'dedo', 'rosto', 'queixo', 'testa', 'lábio', 'língua', 'pescoço', 'ombro', 'pulso']),
    ...pack('Objeto do dia a dia', 'facil', ['casa', 'mesa', 'cadeira', 'porta', 'janela', 'cama', 'faca', 'copo', 'prato', 'pano', 'sabão', 'escova', 'pente', 'chave', 'livro', 'caneta', 'lápis', 'papel', 'bolsa', 'mochila', 'sapato', 'meia', 'chapéu', 'luva', 'casaco', 'camisa', 'calça', 'saia', 'vestido', 'toalha', 'travesseiro', 'lâmpada', 'vela', 'vaso', 'tapete', 'espelho', 'relógio', 'garfo', 'colher', 'panela']),
    ...pack('Lugar ou ambiente', 'facil', ['rua', 'praia', 'parque', 'escola', 'loja', 'igreja', 'praça', 'campo', 'sala', 'cozinha', 'quarto', 'banheiro', 'garagem', 'jardim', 'varanda', 'lago', 'rio', 'mar', 'ilha', 'monte', 'vale', 'floresta', 'mata', 'vila', 'cidade']),
    ...pack('Pessoa ou família', 'facil', ['mãe', 'pai', 'avô', 'avó', 'tio', 'tia', 'irmão', 'irmã', 'filho', 'filha', 'bebê', 'criança', 'menino', 'menina', 'homem', 'mulher', 'amigo', 'amiga', 'vizinho', 'colega', 'professor', 'aluno', 'médico', 'enfermeira', 'bombeiro', 'policial', 'padeiro']),
    ...pack('Comida ou bebida', 'facil', ['pão', 'leite', 'ovo', 'carne', 'arroz', 'feijão', 'sopa', 'sal', 'açúcar', 'mel', 'queijo', 'manteiga', 'iogurte', 'bolo', 'doce', 'bala', 'chocolate', 'suco', 'água', 'café', 'chá', 'pizza', 'massa', 'torta', 'biscoito', 'geleia', 'sorvete']),
    ...pack('Natureza', 'facil', ['sol', 'lua', 'estrela', 'nuvem', 'chuva', 'vento', 'neve', 'gelo', 'fogo', 'terra', 'pedra', 'areia', 'folha', 'flor', 'fruto', 'semente', 'raiz', 'tronco', 'galho', 'grama', 'musgo', 'cacto', 'palmeira']),
    ...pack('Transporte', 'facil', ['carro', 'ônibus', 'trem', 'metrô', 'barco', 'navio', 'balsa', 'moto', 'táxi', 'van', 'caminhão', 'trator', 'patinete', 'skate', 'roda', 'asa', 'motor', 'pneu', 'avião', 'bicicleta']),
    ...pack('Esporte ou lazer', 'facil', ['bola', 'rede', 'gol', 'jogo', 'time', 'futebol', 'vôlei', 'tênis', 'natação', 'corrida', 'dança', 'música', 'canto', 'teatro', 'cinema', 'festa']),
    ...pack('Material', 'facil', ['ferro', 'aço', 'cobre', 'bronze', 'ouro', 'prata', 'vidro', 'madeira', 'plástico', 'tecido', 'lã', 'algodão', 'seda', 'couro', 'barro', 'cimento', 'tijolo']),
  ],
  medio: [
    ...pack('Animal', 'medio', ['cachorro', 'girafa', 'leopardo', 'tigre', 'zebra', 'camelo', 'rinoceronte', 'hipopótamo', 'crocodilo', 'jacaré', 'tartaruga', 'iguana', 'macaco', 'gorila', 'esquilo', 'castor', 'baleia', 'golfinho', 'tubarão', 'polvo', 'lula', 'caranguejo', 'lagosta', 'camarão', 'borboleta', 'aranha', 'capivara', 'tucano', 'arara', 'papagaio', 'flamingo', 'avestruz']),
    ...pack('Alimento', 'medio', ['lasanha', 'macarrão', 'nhoque', 'risoto', 'feijoada', 'moqueca', 'coxinha', 'pastel', 'empada', 'tapioca', 'brigadeiro', 'beijinho', 'pudim', 'mousse', 'mingau', 'canjica', 'curau', 'pamonha', 'cuscuz', 'polenta', 'farofa', 'maionese', 'ketchup', 'mostarda', 'orégano', 'manjericão', 'salsinha', 'cebolinha', 'abacaxi', 'melancia', 'goiaba', 'maracujá', 'acerola', 'carambola', 'pitaya']),
    ...pack('Profissão', 'medio', ['advogado', 'engenheiro', 'arquiteto', 'dentista', 'veterinário', 'farmacêutico', 'jornalista', 'fotógrafo', 'designer', 'programador', 'analista', 'contador', 'economista', 'historiador', 'geógrafo', 'biólogo', 'químico', 'físico', 'matemático', 'filósofo', 'psicólogo', 'sociólogo', 'pedagogo', 'bibliotecário', 'secretário', 'gerente', 'diretor', 'prefeito', 'vereador', 'juiz', 'promotor', 'delegado', 'carteiro', 'motorista', 'piloto', 'eletricista', 'encanador', 'pedreiro', 'pintor', 'marceneiro', 'mecânico', 'jardineiro', 'agricultor', 'enfermeiro', 'cirurgião']),
    ...pack('Lugar', 'medio', ['hospital', 'universidade', 'biblioteca', 'museu', 'teatro', 'estádio', 'aeroporto', 'rodoviária', 'mercado', 'feira', 'shopping', 'padaria', 'farmácia', 'banco', 'correio', 'delegacia', 'quartel', 'prefeitura', 'câmara', 'tribunal', 'cartório', 'laboratório', 'fábrica', 'usina', 'porto', 'ponte', 'viaduto', 'túnel', 'estrada', 'avenida', 'fazenda', 'sítio', 'chácara', 'condomínio', 'bairro', 'estado', 'país', 'planeta', 'continente']),
    ...pack('Objeto ou ferramenta', 'medio', ['martelo', 'alicate', 'serrote', 'broca', 'parafuso', 'prego', 'porca', 'arruela', 'cola', 'fita', 'corda', 'corrente', 'gancho', 'mola', 'engrenagem', 'bateria', 'carregador', 'adaptador', 'cabo', 'tomada', 'interruptor', 'lanterna', 'binóculo', 'microscópio', 'telescópio', 'câmera', 'tripé', 'microfone', 'tablet', 'notebook', 'computador', 'impressora', 'roteador', 'modem', 'celular', 'televisão', 'controle']),
    ...pack('Corpo humano', 'medio', ['cérebro', 'coração', 'pulmão', 'fígado', 'rim', 'baço', 'estômago', 'intestino', 'vesícula', 'pâncreas', 'tireoide', 'músculo', 'osso', 'cartilagem', 'tendão', 'ligamento', 'nervo', 'veia', 'artéria', 'sangue', 'célula', 'tecido', 'órgão', 'esqueleto', 'coluna', 'vértebra', 'costela', 'crânio', 'mandíbula', 'clavícula', 'fêmur', 'tíbia', 'fíbula']),
    ...pack('Natureza e clima', 'medio', ['tempestade', 'furacão', 'tornado', 'terremoto', 'vulcão', 'erupção', 'inundação', 'seca', 'geada', 'granizo', 'neblina', 'orvalho', 'íris', 'relâmpago', 'trovão', 'cachoeira', 'nascente', 'lagoa', 'pântano', 'mangue', 'recife', 'maré', 'costa', 'penhasco', 'caverna', 'gruta', 'planície', 'planalto', 'serra', 'cordilheira', 'desfiladeiro']),
    ...pack('Esporte', 'medio', ['basquete', 'handebol', 'futsal', 'surfe', 'ciclismo', 'atletismo', 'ginástica', 'judô', 'boxe', 'escalada', 'esqui', 'golfe', 'beisebol', 'rugby', 'hipismo', 'remo', 'canoagem', 'vela', 'mergulho', 'triatlo', 'maratona', 'musculação', 'pilates', 'ioga']),
    ...pack('Saúde', 'medio', ['vacina', 'remédio', 'comprimido', 'xarope', 'pomada', 'curativo', 'atadura', 'gaze', 'seringa', 'termômetro', 'estetoscópio', 'cirurgia', 'consulta', 'exame', 'diagnóstico', 'tratamento', 'terapia', 'reabilitação', 'nutrição', 'dieta', 'higiene', 'prevenção', 'sintoma', 'febre', 'tosse', 'gripe', 'resfriado', 'alergia', 'infecção', 'inflamação', 'cicatriz']),
  ],
  dificil: [
    ...pack('Ciência', 'dificil', ['fotossíntese', 'mitocôndria', 'cromossomo', 'evolução', 'ecossistema', 'biodiversidade', 'sustentabilidade', 'meteorologia', 'astronomia', 'astrofísica', 'cosmologia', 'geologia', 'paleontologia', 'arqueologia', 'antropologia', 'epidemiologia', 'imunologia', 'microbiologia', 'bioquímica', 'farmacologia', 'toxicologia', 'neurologia', 'cardiologia', 'dermatologia', 'oftalmologia', 'psiquiatria', 'psicanálise', 'fenomenologia', 'epistemologia', 'hermenêutica']),
    ...pack('Sociedade', 'dificil', ['democracia', 'cidadania', 'constituição', 'legislação', 'jurisprudência', 'soberania', 'federalismo', 'transparência', 'governança', 'globalização', 'pluralismo', 'multiculturalismo', 'interculturalidade', 'diversidade', 'inclusão', 'desigualdade', 'pobreza', 'riqueza', 'meritocracia']),
    ...pack('Arte e cultura', 'dificil', ['impressionismo', 'expressionismo', 'surrealismo', 'cubismo', 'futurismo', 'romantismo', 'classicismo', 'barroco', 'renascimento', 'modernismo', 'contemporaneidade', 'escultura', 'gravura', 'litografia', 'serigrafia', 'cinematografia', 'documentário', 'autobiografia', 'poesia', 'narrativa', 'literatura']),
    ...pack('Medicina', 'dificil', ['arteriosclerose', 'hipertensão', 'hipotensão', 'trombose', 'embolia', 'pneumonia', 'bronquite', 'diabetes', 'obesidade', 'anorexia', 'bulimia', 'depressão', 'esquizofrenia', 'autismo', 'dislexia', 'parkinson', 'esclerose', 'artrite', 'artrose', 'osteoporose', 'leucemia', 'linfoma', 'melanoma', 'carcinoma', 'metástase', 'quimioterapia', 'radioterapia', 'transplante', 'anestesia', 'antibiótico']),
    ...pack('Geografia', 'dificil', ['península', 'istmo', 'estuário', 'delta', 'bacia', 'hidrografia', 'bioma', 'latitude', 'longitude', 'meridiano', 'paralelo', 'hemisfério', 'cartografia', 'topografia', 'orografia', 'demografia', 'urbanização', 'industrialização', 'migração', 'emigração', 'imigração', 'fronteira']),
    ...pack('Filosofia', 'dificil', ['metafísica', 'ontologia', 'axiologia', 'deontologia', 'teleologia', 'existencialismo', 'estoicismo', 'epicurismo', 'ceticismo', 'racionalismo', 'empirismo', 'idealismo', 'materialismo', 'determinismo', 'consciência', 'inconsciente', 'transcendência', 'imanência', 'dualismo', 'monismo', 'utilitarismo', 'moralidade']),
    ...pack('Economia', 'dificil', ['macroeconomia', 'microeconomia', 'inflação', 'deflação', 'recessão', 'estagflação', 'hiperinflação', 'desvalorização', 'valorização', 'câmbio', 'indexação', 'amortização', 'depreciação', 'patrimônio', 'liquidez', 'solvência', 'endividamento', 'arbitragem', 'mercadoria']),
    ...pack('Tecnologia', 'dificil', ['criptografia', 'blockchain', 'criptomoeda', 'descentralização', 'inteligência', 'aprendizado', 'realidade', 'virtual', 'nanotecnologia', 'biotecnologia', 'bioengenharia', 'clonagem', 'genoma', 'metabolismo', 'algoritmo', 'aplicativo', 'plataforma', 'automação', 'robótica']),
    ...pack('Palavra com acento', 'dificil', ['informação', 'educação', 'situação', 'organização', 'comunicação', 'aplicação', 'observação', 'consideração', 'preocupação', 'recomendação', 'implementação', 'administração', 'participação', 'colaboração', 'contribuição', 'distribuição', 'construção', 'destruição', 'produção', 'redução', 'introdução', 'conclusão', 'exclusão', 'evolução', 'revolução', 'solução', 'poluição', 'população', 'ocupação', 'adaptação', 'criação', 'variação', 'navegação', 'exploração']),
    ...pack('Palavra longa', 'dificil', ['paralelepípedo', 'otorrinolaringologista', 'incompreensivelmente', 'simultaneamente', 'concomitantemente', 'posteriormente', 'anteriormente', 'gradualmente', 'exponencialmente', 'matematicamente', 'estatística', 'responsabilização', 'interdisciplinaridade', 'infraestrutura', 'superestrutura', 'extraordinário', 'inconstitucional', 'anticonstitucional']),
  ],
}

function mergeCuratedBase(pools, hintsIndex) {
  const seen = new Set()

  for (const difficulty of ['facil', 'medio', 'dificil']) {
    const curated = []
    for (const entry of CURATED_BASE[difficulty]) {
      const key = normalize(entry.word)
      if (seen.has(key)) continue
      seen.add(key)
      curated.push({
        ...entry,
        hint: hintsIndex.get(key) ?? entry.hint,
      })
    }
    pools[difficulty] = [...curated, ...pools[difficulty].filter((entry) => !seen.has(normalize(entry.word)))]
  }

  return pools
}

function main() {
  ensureDataFile(FREQ_PATH, FREQ_URL)
  ensureDataFile(LEXICON_PATH, LEXICON_URL)

  const hintsIndex = loadHintsIndex()
  const freqLines = fs.readFileSync(FREQ_PATH, 'utf8').split('\n').filter(Boolean)
  const lexiconLines = fs.readFileSync(LEXICON_PATH, 'utf8').split('\n').filter(Boolean)
  const lexiconIndex = buildLexiconIndex(lexiconLines)

  let pools = collectCandidates(freqLines, lexiconIndex, hintsIndex)
  pools = mergeCuratedBase(pools, hintsIndex)
  const freqSet = new Set(freqLines.map((line) => normalize(line.split(/\s+/)[0] || '')))
  const seenGlobal = new Set(
    [...pools.facil, ...pools.medio, ...pools.dificil].map((entry) => normalize(entry.word)),
  )

  for (const difficulty of ['facil', 'medio', 'dificil']) {
    pools[difficulty] = fillPool(pools[difficulty], difficulty, lexiconLines, seenGlobal, freqSet, hintsIndex)
  }

  const WORD_ENTRIES = [
    ...pools.facil,
    ...pools.medio,
    ...pools.dificil,
  ]

  for (const difficulty of ['facil', 'medio', 'dificil']) {
    const count = WORD_ENTRIES.filter((entry) => entry.difficulty === difficulty).length
    if (count < TARGET_PER_DIFFICULTY) {
      console.error(`Warning: only ${count} words for ${difficulty}`)
    }
  }

  const content = `/**
 * Auto-generated by buildFormTheWordSource.js
 * Do not edit manually — run the build script to regenerate.
 */
module.exports = {
  WORD_ENTRIES: ${JSON.stringify(WORD_ENTRIES, null, 2)},
}
`

  fs.writeFileSync(OUTPUT, content, 'utf8')
  console.log(`Wrote ${WORD_ENTRIES.length} entries to ${OUTPUT}`)
  console.log('facil:', pools.facil.length)
  console.log('medio:', pools.medio.length)
  console.log('dificil:', pools.dificil.length)
}

main()

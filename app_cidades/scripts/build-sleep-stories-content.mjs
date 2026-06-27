#!/usr/bin/env node
/**
 * Converte os lotes em assets/historias para sleep_stories_content.json
 * Mapeia por título ao catálogo em sleepStories.ts (histórias 14–51).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const TITLE_ALIASES = {
  'A Nuvem que Guardava Abraços': 'A Nuvem que Queria um Abraço',
}

const CUSTOM_HISTORIAS = {
  'A Ponte que Tinha Medo de Altura': `No meio de um vale verde, entre duas colinas cobertas de flores, existia uma ponte pequena feita de tábuas antigas e cordas firmes. Ela se chamava Pontinha. Todos os dias, viajantes, ovelhas, crianças e carroças passavam por cima dela para chegar ao outro lado, onde havia uma trilha cheia de cerejeiras.

Pontinha gostava de ajudar. Gostava de ouvir os passos macios, de sentir o vento passar por baixo e de ver o rio brilhar lá embaixo. Mas tinha um segredo: ela tinha medo de altura.

Quando alguém atravessava, Pontinha tremia um pouquinho. As tábuas rangiam, as cordas esticavam, e ela pensava: e se eu não for forte o bastante? E se o rio estiver longe demais?

Certa manhã, uma cabra branca chamada Clara parou no meio da ponte. Não porque tinha medo — cabras são corajosas —, mas porque sentiu Pontinha tremer debaixo de seus cascos.

— Pontinha — disse Clara com voz calma —, você está tremendo?

— Estou — respondeu a ponte, envergonhada. — Tenho medo de altura. Sei que sou útil, mas quando olho para o rio, meu coração de madeira acelera.

Clara sentou-se devagar, sem apressar ninguém.

— Medo não significa fraqueza — explicou. — Significa que algo é importante para você. Você quer que todos cheguem bem ao outro lado. Isso é bonito.

Pontinha ouviu em silêncio.

— Quer um truque? — continuou Clara. — Quando eu tenho medo, respiro três vezes e olho só para o próximo passo. Não para o vale inteiro. Só para o próximo passo.

Naquela tarde, uma menina chamada Lívia chegou com uma cesta de morangos. Queria atravessar, mas parou ao ouvir a ponte ranger.

— Pode passar — disse Pontinha, respirando fundo. — Vou cuidar de você.

Lívia deu um passo. Depois outro. Pontinha tremia, mas segurava firme. Quando Lívia chegou do outro lado, sorriu e acenou.

— Obrigada, pontezinha — gritou.

Pontinha sentiu algo quente dentro dela. Não era medo. Era orgulho.

Nos dias seguintes, Clara passou pela ponte sempre com calma, contando histórias sobre montanhas, nuvens e caminhos pequenos. Pontinha aprendeu que altura não precisava ser inimiga. Podia ser apenas o espaço entre um cuidado e outro.

Quando a noite chegava e o vale ficava quietinho, Pontinha olhava para o rio e para as estrelas. Ainda sentia um friozinho às vezes, mas já não queria desaparecer. Queria continuar ali, ligando um lado ao outro, com coragem de madeira e coração de ponte.

E, quando o vento soprava de leve, parecia sussurrar: passo a passo, passo a passo, até o outro lado.`,

  'A Baleia e a Estrela Cadente': `Lá no fundo do oceano azul, morava uma baleia jovem chamada Marina. Ela era grande, gentil e tinha uma cantiga baixinha que fazia as ondas dormirem. Todas as noites, Marina subia até a superfície para ver o céu e cumprimentar as estrelas.

Numa noite sem lua, enquanto o mar estava calmo como um cobertor, Marina viu algo brilhante caindo devagar. Não foi um barulho. Foi um fio de luz dourada que desceu até perto da água e parou, tremendo, como um passarinho cansado.

— Olá? — disse Marina, aproximando-se com cuidado.

A estrelinha levantou a luz um pouquinho.

— Eu me perdi — sussurrou. — Quis piscar mais forte que as outras e escorreguei. Agora não sei como voltar.

Marina sentiu o coração apertar. Sabia que estrelas pertenciam ao céu, mas também sabia que no mar ninguém deveria ficar sozinho com medo.

— Suba nas minhas costas — convidou. — Vamos procurar o caminho juntas.

A estrelinha pousou sobre Marina, quente e leve como uma semente de luz. A baleia nadou devagar, cantando sua melodia mais suave. Peixes pequenos formaram um círculo luminoso. Uma tartaruga marinha apontou com a nadadeira para o horizonte, onde o céu parecia mais fino, quase transparente.

Quanto mais subiam, mais a estrelinha brilhava de novo. Marina viu outras estrelas piscando, uma, duas, dez, formando uma escada de luz no alto.

— Elas estão chamando você — disse Marina.

A estrelinha hesitou.

— E você?

Marina sorriu com os olhos brilhantes.

— Eu fico aqui embaixo, cuidando do mar. Mas toda noite, quando você brilhar, vou saber que nossa amizade continua.

A estrelinha subiu devagar, deixando um rastro dourado sobre as ondas. Antes de desaparecer no céu, piscou três vezes: uma para Marina, uma para o mar, uma para todas as crianças que olhavam pela janela.

Marina desceu cantando. O oceano inteiro parecia mais tranquilo.

Depois daquela noite, sempre que uma estrela cadente cruzava o céu, Marina abria a boca e soltava uma bolha de luz para o alto, como quem manda um abraço. E lá em cima, a estrelinha piscava de volta, lembrando que amizade verdadeira não precisa estar perto o tempo todo para continuar brilhando.`,
}

function loadCatalog() {
  const src = readFileSync(join(ROOT, 'src/config/sleepStories.ts'), 'utf8')
  return [...src.matchAll(/story\(\s*\n?\s*(\d+),\s*\n?\s*'([^']+)'/g)].map((m) => ({
    number: Number(m[1]),
    title: m[2],
    id: `story-${m[1]}`,
  }))
}

function loadHistorias() {
  const files = [
    'assets/historias/historias_lote_1.json',
    'assets/historias/historias_lote_2.json',
    'assets/historias/historias_lote_3.json',
  ]
  const byTitle = new Map()

  for (const file of files) {
    const items = JSON.parse(readFileSync(join(ROOT, file), 'utf8'))
    for (const item of items) {
      const key = TITLE_ALIASES[item.titulo] ?? item.titulo
      if (!byTitle.has(key)) {
        byTitle.set(key, item)
      }
    }
  }

  return byTitle
}

function splitSentences(text) {
  const parts = text.match(/[^.!?…]+[.!?…]+(?:\s|$)|[^.!?…]+$/g)
  return (parts ?? [text]).map((s) => s.trim()).filter(Boolean)
}

function paragraphVariant(text) {
  const trimmed = text.trim()
  if (trimmed.startsWith('—') || trimmed.startsWith('- ')) return 'dialogue'
  return 'normal'
}

function splitLongBlock(block) {
  const sentences = splitSentences(block)
  const parts = []
  let chunk = []

  for (const sentence of sentences) {
    chunk.push(sentence)
    const joined = chunk.join(' ')
    if (joined.length >= 180 || chunk.length >= 3) {
      parts.push(joined)
      chunk = []
    }
  }

  if (chunk.length) {
    parts.push(chunk.join(' '))
  }

  return parts
}

function historiaToParagraphs(historia) {
  const blocks = historia
    .split(/\n\n+/)
    .map((block) => block.replace(/\n+/g, ' ').trim())
    .filter(Boolean)

  const paragraphs = []

  for (const block of blocks) {
    if (block.length <= 220) {
      paragraphs.push(block)
    } else {
      paragraphs.push(...splitLongBlock(block))
    }
  }

  return paragraphs.map((text) => ({
    text,
    variant: paragraphVariant(text),
  }))
}

function themeToLesson(tema) {
  const cleaned = tema.replace(/\s+e\s+/g, ', ').replace(/\.$/, '')
  return {
    title: 'Lição da história',
    text: `Esta história nos convida a lembrar de ${cleaned}. Às vezes, no silêncio da noite, o coração precisa ouvir exatamente isso.`,
  }
}

function buildEntry(historia, tema) {
  return {
    paragraphs: historiaToParagraphs(historia),
    lesson: themeToLesson(tema),
  }
}

const catalog = loadCatalog()
const historias = loadHistorias()
const output = {}

for (const item of catalog) {
  if (item.number <= 13) continue

  const custom = CUSTOM_HISTORIAS[item.title]
  const fromJson = historias.get(item.title)

  if (custom) {
    const tema =
      item.title === 'A Ponte que Tinha Medo de Altura'
        ? 'coragem, medo e passos pequenos'
        : 'amizade, cuidado e esperança'
    output[item.id] = buildEntry(custom, tema)
    continue
  }

  if (!fromJson) {
    console.warn(`⚠ Sem conteúdo para ${item.id}: ${item.title}`)
    continue
  }

  output[item.id] = buildEntry(fromJson.historia, fromJson.tema)
}

const outPath = join(ROOT, 'assets/sleep/sleep_stories_content.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

console.log(`✓ ${Object.keys(output).length} histórias gravadas em ${outPath}`)

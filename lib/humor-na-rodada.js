export const humorNaRodada = [
{
  slug: "humor-na-rodada-santos-reinicia-o-sistema",
  title: "Humor na Rodada: Santos reinicia o sistema",
  excerpt: "Em meio à crise, o Santos apelou para o método mais clássico possível: desligar, esperar e ligar de novo.",
  author: "Redação BolaNoBrasil",
  date: "19 de março de 2026",
  featured: true,
  content: [
    "O Santos olhou para a própria crise e escolheu a solução mais santista possível: chamar Cuca de novo. Não foi exatamente uma mudança de rota. Foi mais aquele velho procedimento brasileiro quando tudo trava: desliga, espera um pouco e liga de novo.",
    "A sensação é de que o clube abriu o menu de opções da temporada e clicou em “restaurar configuração de fábrica”. Mudou o técnico, mudou o discurso, mudou a esperança da semana. O roteiro, porém, continua com a mesma cara: pressão, urgência, promessa de reação e a eterna impressão de que agora vai — mesmo quando ninguém sabe muito bem por quê.",
    "O mais curioso é que o Santos tem essa habilidade rara de transformar qualquer crise em um grande capítulo dramático. Nunca é só uma fase ruim. É sempre um ambiente de reconstrução, de recomeço, de decisão importante, como se cada rodada valesse uma temporada inteira. Na Vila, até treino fechado parece evento histórico.",
    "E aí entra Cuca, mais uma vez, como aquele personagem que a série traz de volta quando o elenco principal já não está segurando a audiência sozinho. Tem quem critique, tem quem desconfie, tem quem lembre que o histórico é cheio de interrupções pelo caminho. Mas também sempre aparece alguém dizendo que talvez seja exatamente isso que faltava para o time acordar.",
    "No fundo, a chegada dele funciona como toda gambiarra que o brasileiro respeita: ninguém chama de solução definitiva, mas muita gente acredita que pode fazer o aparelho voltar a funcionar por mais algum tempo.",
    "O problema para o Santos é que tudo vive com cara de emergência. Não existe meio-termo. O clube passa do “agora vai” para o “lá vamos nós de novo” com uma velocidade impressionante. E o torcedor acompanha tudo como quem já conhece o roteiro, mas ainda assiste esperando um final diferente.",
    "No fim das contas, o Santos não trocou só de treinador. Trocou o clima da semana, reacendeu a esperança e reiniciou mais uma vez um sistema que vive pedindo manutenção."
  ]
},
];

export function getHumorBySlug(slug) {
  return humorNaRodada.find((item) => item.slug === slug);
}

export function getFeaturedHumor() {
  return humorNaRodada.find((item) => item.featured) || humorNaRodada[0];
}

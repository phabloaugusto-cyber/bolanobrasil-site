export const tecnicosSerieA = [
  {
    slug: "athletico",
    clube: "Athletico-PR",
    tecnicoAtual: "Odair Hellmann",
    entradaAtual: "2025-05-21",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "atletico-mg",
    clube: "Atlético-MG",
    tecnicoAtual: "Eduardo Domínguez",
    entradaAtual: "2026-02-24",
    mudouNoAno: true,
    quemSaiu: [
      {
        nome: "Jorge Sampaoli",
        entrada: "2025-09-01",
        saida: "2026-02-24",
      },
    ],
  },
  {
    slug: "bahia",
    clube: "Bahia",
    tecnicoAtual: "Rogério Ceni",
    entradaAtual: "2023-09-09",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "botafogo",
    clube: "Botafogo",
    tecnicoAtual: "Martín Anselmi",
    entradaAtual: "2025-12-22",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "bragantino",
    clube: "Bragantino",
    tecnicoAtual: "Vagner Mancini",
    entradaAtual: "2025-10-30",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "chapecoense",
    clube: "Chapecoense",
    tecnicoAtual: "Gilmar Dal Pozzo",
    entradaAtual: "2024-08-20",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "corinthians",
    clube: "Corinthians",
    tecnicoAtual: "Dorival Júnior",
    entradaAtual: "2025-04-28",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "coritiba",
    clube: "Coritiba",
    tecnicoAtual: "Fernando Seabra",
    entradaAtual: "2025-12-08",
    mudouNoAno: false,
    quemSaiu: [],
  },
{
  slug: "cruzeiro",
  clube: "Cruzeiro",
  tecnicoAtual: "Wesley Carvalho (interino)",
  entradaAtual: "2026-03-15",
  mudouNoAno: true,
  quemSaiu: [
    {
      nome: "Tite",
      entrada: "2026-01-01",
      saida: "2026-03-15",
    },
  ],
},
  {
    slug: "flamengo",
    clube: "Flamengo",
    tecnicoAtual: "Leonardo Jardim",
    entradaAtual: "2026-03-04",
    mudouNoAno: true,
    quemSaiu: [
      {
        nome: "Filipe Luís",
        entrada: "2024-09-01",
        saida: "2026-03-04",
      },
    ],
  },
  {
    slug: "fluminense",
    clube: "Fluminense",
    tecnicoAtual: "Luis Zubeldía",
    entradaAtual: "2025-09-25",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "gremio",
    clube: "Grêmio",
    tecnicoAtual: "Luís Castro",
    entradaAtual: "2025-12-12",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "internacional",
    clube: "Internacional",
    tecnicoAtual: "Paulo Pezzolano",
    entradaAtual: "2025-12-18",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "mirassol",
    clube: "Mirassol",
    tecnicoAtual: "Rafael Guanaes",
    entradaAtual: "2025-03-13",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "palmeiras",
    clube: "Palmeiras",
    tecnicoAtual: "Abel Ferreira",
    entradaAtual: "2020-10-30",
    mudouNoAno: false,
    quemSaiu: [],
  },
  {
    slug: "remo",
    clube: "Remo",
    tecnicoAtual: "Léo Condé",
    entradaAtual: "2026-03-05",
    mudouNoAno: true,
    quemSaiu: [
      {
        nome: "Juan Carlos Osorio",
        entrada: "2025-12-01",
        saida: "2026-03-05",
      },
    ],
  },
{
  slug: "santos",
  clube: "Santos",
  tecnicoAtual: "Cuca",
  entradaAtual: "2026-03-19",
  mudouNoAno: true,
  quemSaiu: [
    {
      nome: "Juan Pablo Vojvoda",
      entrada: "2025",
      saida: "2026-03-19",
    },
  ],
},
  {
    slug: "sao-paulo",
    clube: "São Paulo",
    tecnicoAtual: "Roger Machado",
    entradaAtual: "2026-03-12",
    mudouNoAno: true,
    quemSaiu: [
      {
        nome: "Roger Machado",
        entrada: "2026-03-12",
        saida: null,
      },
      {
        nome: "Hernán Crespo",
        entrada: "2025-06-18",
        saida: "2026-03-12",
      },
    ],
  },
  {
    slug: "vasco",
    clube: "Vasco",
    tecnicoAtual: "Renato Gaúcho",
    entradaAtual: "2026-03-03",
    mudouNoAno: true,
    quemSaiu: [
      {
        nome: "Fernando Diniz",
        entrada: "2025-05-01",
        saida: "2026-03-03",
      },
    ],
  },
  {
    slug: "vitoria",
    clube: "Vitória",
    tecnicoAtual: "Jair Ventura",
    entradaAtual: "2025-09-25",
    mudouNoAno: false,
    quemSaiu: [],
  },
];

export function getTecnicosOrdenados() {
  return [...tecnicosSerieA].sort((a, b) =>
    a.clube.localeCompare(b.clube, "pt-BR")
  );
}

export function getResumoMudancasTecnicos() {
  const clubesComMudanca = tecnicosSerieA.filter((item) => item.mudouNoAno);

  const ultimasMudancas = tecnicosSerieA
    .flatMap((item) =>
      item.quemSaiu
        .filter((saida) => saida.saida)
        .map((saida) => ({
          clube: item.clube,
          tecnicoAtual: item.tecnicoAtual,
          ...saida,
        }))
    )
    .sort((a, b) => new Date(b.saida) - new Date(a.saida));

  return {
    totalClubes: tecnicosSerieA.length,
    comMudanca: clubesComMudanca.length,
    semMudanca: tecnicosSerieA.length - clubesComMudanca.length,
    ultimasMudancas,
  };
}

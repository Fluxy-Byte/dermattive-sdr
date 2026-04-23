export async function coletarImoveis() {
    try{
        return imoveisMock;
    }catch(e){
        return "Desculpe, ocorreu um erro ao coletar os imóveis. Por favor, tente novamente mais tarde."
    }
}

const imoveisMock = [
  {
    id: 1,
    titulo: "Apartamento 2 quartos - Bairro Santa Mônica",
    tipo: "Apartamento",
    status: "À venda",
    preco: 280000,
    bairro: "Santa Mônica",
    cidade: "Uberlândia",
    quartos: 2,
    banheiros: 1,
    vagasGaragem: 1,
    areaM2: 58,
    descricao: "Apartamento bem localizado, com varanda e ótima iluminação natural.",
    imagens: [
      "https://via.placeholder.com/400x300",
      "https://via.placeholder.com/400x300"
    ],
    destaque: true
  },
  {
    id: 2,
    titulo: "Casa 3 quartos - Bairro Jardim Europa",
    tipo: "Casa",
    status: "À venda",
    preco: 420000,
    bairro: "Jardim Europa",
    cidade: "Uberlândia",
    quartos: 3,
    banheiros: 2,
    vagasGaragem: 2,
    areaM2: 120,
    descricao: "Casa ampla, com quintal, área gourmet e excelente acabamento.",
    imagens: [
      "https://via.placeholder.com/400x300"
    ],
    destaque: false
  },
  {
    id: 3,
    titulo: "Apartamento econômico - Bairro Luizote",
    tipo: "Apartamento",
    status: "À venda",
    preco: 210000,
    bairro: "Luizote de Freitas",
    cidade: "Uberlândia",
    quartos: 2,
    banheiros: 1,
    vagasGaragem: 1,
    areaM2: 50,
    descricao: "Imóvel ideal para primeiro financiamento, próximo a comércios.",
    imagens: [
      "https://via.placeholder.com/400x300"
    ],
    destaque: false
  },
  {
    id: 4,
    titulo: "Casa em condomínio fechado",
    tipo: "Casa",
    status: "À venda",
    preco: 650000,
    bairro: "Granja Marileusa",
    cidade: "Uberlândia",
    quartos: 3,
    banheiros: 3,
    vagasGaragem: 2,
    areaM2: 145,
    descricao: "Casa moderna em condomínio, com lazer completo e segurança.",
    imagens: [
      "https://via.placeholder.com/400x300",
      "https://via.placeholder.com/400x300"
    ],
    destaque: true
  },
  {
    id: 5,
    titulo: "Apartamento para locação - Centro",
    tipo: "Apartamento",
    status: "Para alugar",
    preco: 1800,
    bairro: "Centro",
    cidade: "Uberlândia",
    quartos: 1,
    banheiros: 1,
    vagasGaragem: 1,
    areaM2: 42,
    descricao: "Apartamento compacto, ideal para estudantes e profissionais.",
    imagens: [
      "https://via.placeholder.com/400x300"
    ],
    destaque: false
  }
];
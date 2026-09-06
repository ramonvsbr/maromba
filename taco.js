/* =========================================================
   MAROMBA — base de dados de alimentos (Tabela TACO)
   Valores por 100g de parte comestível, baseados na Tabela
   Brasileira de Composição de Alimentos (TACO, 4ª edição,
   NEPA/UNICAMP), com alguns itens complementares (ex.: whey
   protein) que não constam na TACO mas são comuns na rotina
   de quem treina. São valores de referência: o preparo real
   (tempero, marca, ponto de cozimento) pode variar um pouco
   o resultado — ajuste a quantidade em gramas conforme sua
   embalagem/receita se quiser mais precisão.

   Campos de cada alimento (todos por 100g):
     kcal — calorias
     prot — proteínas (g)
     carb — carboidratos (g)
     gord — gorduras (g)
   ========================================================= */

const TACO_FOODS = [
  // Cereais, massas, pães e tubérculos
  { id:'arroz_branco_cozido',      nome:'Arroz branco cozido',             kcal:128, prot:2.5,  carb:28.1, gord:0.2 },
  { id:'arroz_integral_cozido',    nome:'Arroz integral cozido',           kcal:124, prot:2.6,  carb:25.8, gord:1.0 },
  { id:'feijao_carioca_cozido',    nome:'Feijão carioca cozido',           kcal:76,  prot:4.8,  carb:13.6, gord:0.5 },
  { id:'feijao_preto_cozido',      nome:'Feijão preto cozido',             kcal:77,  prot:4.5,  carb:14.0, gord:0.5 },
  { id:'lentilha_cozida',          nome:'Lentilha cozida',                 kcal:93,  prot:6.3,  carb:16.3, gord:0.5 },
  { id:'grao_de_bico_cozido',      nome:'Grão-de-bico cozido',             kcal:164, prot:8.4,  carb:27.4, gord:2.6 },
  { id:'macarrao_cozido',          nome:'Macarrão cozido',                 kcal:111, prot:3.5,  carb:22.1, gord:0.9 },
  { id:'pao_frances',              nome:'Pão francês',                     kcal:300, prot:8.0,  carb:58.6, gord:3.1 },
  { id:'pao_de_forma_integral',    nome:'Pão de forma integral',           kcal:253, prot:9.4,  carb:50.0, gord:3.3 },
  { id:'aveia_flocos',             nome:'Aveia em flocos',                 kcal:394, prot:13.9, carb:66.6, gord:8.5 },
  { id:'tapioca_hidratada',        nome:'Tapioca (goma hidratada)',        kcal:240, prot:0.3,  carb:59.3, gord:0.1 },
  { id:'batata_doce_cozida',       nome:'Batata-doce cozida',              kcal:77,  prot:0.6,  carb:18.4, gord:0.1 },
  { id:'batata_inglesa_cozida',    nome:'Batata inglesa cozida',           kcal:52,  prot:1.2,  carb:11.9, gord:0.1 },
  { id:'batata_frita',             nome:'Batata frita',                    kcal:267, prot:3.0,  carb:34.9, gord:13.2 },
  { id:'mandioca_cozida',          nome:'Mandioca cozida',                 kcal:125, prot:0.6,  carb:30.1, gord:0.3 },
  { id:'milho_verde_cozido',       nome:'Milho verde cozido',              kcal:98,  prot:3.2,  carb:18.7, gord:1.6 },
  { id:'quinoa_cozida',            nome:'Quinoa cozida',                   kcal:120, prot:4.4,  carb:21.3, gord:1.9 },
  { id:'granola',                  nome:'Granola',                         kcal:471, prot:8.5,  carb:60.0, gord:20.0 },
  { id:'pao_de_queijo',            nome:'Pão de queijo',                   kcal:364, prot:8.2,  carb:33.0, gord:22.0 },

  // Carnes, ovos e peixes
  { id:'peito_frango_grelhado',    nome:'Peito de frango grelhado',        kcal:159, prot:32.0, carb:0,    gord:2.5 },
  { id:'coxa_frango_assada',       nome:'Coxa de frango assada',           kcal:215, prot:26.0, carb:0,    gord:11.7 },
  { id:'patinho_grelhado',         nome:'Patinho (bovino) grelhado',       kcal:219, prot:35.9, carb:0,    gord:7.3 },
  { id:'acem_cozido',              nome:'Acém (bovino) cozido',            kcal:216, prot:26.6, carb:0,    gord:11.6 },
  { id:'carne_moida_cozida',       nome:'Carne moída cozida',              kcal:212, prot:26.5, carb:0,    gord:11.0 },
  { id:'lombo_suino_assado',       nome:'Lombo suíno assado',              kcal:210, prot:32.0, carb:0,    gord:8.0 },
  { id:'tilapia_grelhada',         nome:'Filé de tilápia grelhado',        kcal:128, prot:26.1, carb:0,    gord:2.0 },
  { id:'salmao_grelhado',          nome:'Salmão grelhado',                 kcal:231, prot:25.4, carb:0,    gord:13.6 },
  { id:'pescada_cozida',           nome:'Pescada cozida',                  kcal:111, prot:19.7, carb:0,    gord:2.9 },
  { id:'atum_lata_oleo',           nome:'Atum em lata (óleo)',             kcal:179, prot:26.2, carb:0,    gord:7.6 },
  { id:'camarao_cozido',           nome:'Camarão cozido',                  kcal:90,  prot:19.0, carb:0,    gord:1.0 },
  { id:'ovo_cozido',               nome:'Ovo de galinha cozido',           kcal:146, prot:13.3, carb:0.6,  gord:9.5 },
  { id:'ovo_frito',                nome:'Ovo frito',                       kcal:196, prot:15.6, carb:0.4,  gord:15.0 },
  { id:'clara_ovo_cozida',         nome:'Clara de ovo cozida',             kcal:52,  prot:10.9, carb:0.7,  gord:0.2 },

  // Laticínios
  { id:'leite_integral',           nome:'Leite de vaca integral',          kcal:61,  prot:2.9,  carb:4.3,  gord:3.2 },
  { id:'leite_desnatado',          nome:'Leite de vaca desnatado',         kcal:35,  prot:3.4,  carb:4.9,  gord:0.2 },
  { id:'iogurte_natural',          nome:'Iogurte natural integral',        kcal:51,  prot:4.1,  carb:3.9,  gord:3.0 },
  { id:'iogurte_grego',            nome:'Iogurte grego natural',           kcal:97,  prot:9.0,  carb:4.0,  gord:5.0 },
  { id:'queijo_minas_frescal',     nome:'Queijo minas frescal',            kcal:264, prot:17.4, carb:3.2,  gord:20.2 },
  { id:'queijo_mucarela',          nome:'Queijo muçarela',                 kcal:330, prot:22.6, carb:3.0,  gord:25.2 },
  { id:'requeijao_cremoso',        nome:'Requeijão cremoso',               kcal:257, prot:9.6,  carb:2.5,  gord:23.0 },
  { id:'queijo_cottage',           nome:'Queijo cottage',                  kcal:98,  prot:12.7, carb:3.3,  gord:4.3 },

  // Frutas
  { id:'banana_prata',             nome:'Banana prata',                    kcal:98,  prot:1.3,  carb:26.0, gord:0.1 },
  { id:'maca',                     nome:'Maçã com casca',                  kcal:56,  prot:0.3,  carb:15.2, gord:0 },
  { id:'laranja_pera',             nome:'Laranja pêra',                    kcal:45,  prot:0.9,  carb:11.5, gord:0.1 },
  { id:'mamao_papaia',             nome:'Mamão papaia',                    kcal:40,  prot:0.5,  carb:10.4, gord:0.1 },
  { id:'abacate',                  nome:'Abacate',                         kcal:96,  prot:1.2,  carb:6.0,  gord:8.4 },
  { id:'manga',                    nome:'Manga',                           kcal:64,  prot:0.4,  carb:16.7, gord:0.2 },
  { id:'morango',                  nome:'Morango',                         kcal:30,  prot:0.9,  carb:6.8,  gord:0.3 },
  { id:'uva',                      nome:'Uva',                             kcal:53,  prot:0.7,  carb:13.6, gord:0.2 },
  { id:'abacaxi',                  nome:'Abacaxi',                         kcal:48,  prot:0.9,  carb:12.3, gord:0.1 },
  { id:'suco_laranja_natural',     nome:'Suco de laranja natural',         kcal:45,  prot:0.7,  carb:10.4, gord:0.2 },

  // Verduras e legumes
  { id:'brocolis_cozido',          nome:'Brócolis cozido',                 kcal:25,  prot:2.1,  carb:4.4,  gord:0.5 },
  { id:'alface',                   nome:'Alface',                          kcal:15,  prot:1.4,  carb:2.4,  gord:0.2 },
  { id:'tomate',                   nome:'Tomate',                          kcal:15,  prot:1.1,  carb:3.1,  gord:0.2 },
  { id:'cenoura_cozida',           nome:'Cenoura cozida',                  kcal:30,  prot:0.7,  carb:6.9,  gord:0.2 },
  { id:'couve_refogada',          nome:'Couve refogada',                  kcal:60,  prot:1.7,  carb:4.6,  gord:4.1 },
  { id:'abobrinha_cozida',         nome:'Abobrinha cozida',                kcal:20,  prot:1.1,  carb:4.3,  gord:0.2 },
  { id:'cebola_crua',              nome:'Cebola crua',                     kcal:39,  prot:1.7,  carb:8.9,  gord:0.1 },
  { id:'pepino',                   nome:'Pepino',                          kcal:10,  prot:0.7,  carb:2.0,  gord:0.1 },

  // Oleaginosas, óleos e gorduras
  { id:'amendoim_torrado',         nome:'Amendoim torrado',                kcal:606, prot:27.2, carb:20.3, gord:43.9 },
  { id:'castanha_do_para',         nome:'Castanha-do-pará',                kcal:643, prot:14.5, carb:12.3, gord:63.5 },
  { id:'castanha_de_caju',         nome:'Castanha de caju torrada',        kcal:570, prot:18.5, carb:29.1, gord:46.3 },
  { id:'amendoas',                 nome:'Amêndoas',                        kcal:581, prot:21.2, carb:19.5, gord:49.9 },
  { id:'pasta_amendoim',           nome:'Pasta de amendoim',               kcal:588, prot:25.0, carb:20.0, gord:46.0 },
  { id:'azeite_oliva',             nome:'Azeite de oliva',                 kcal:884, prot:0,    carb:0,    gord:100 },
  { id:'oleo_soja',                nome:'Óleo de soja',                    kcal:884, prot:0,    carb:0,    gord:100 },
  { id:'manteiga',                 nome:'Manteiga',                        kcal:726, prot:0.4,  carb:0.1,  gord:82.4 },

  // Açúcares e doces
  { id:'acucar_refinado',          nome:'Açúcar refinado',                 kcal:387, prot:0,    carb:99.5, gord:0 },
  { id:'mel_abelha',               nome:'Mel de abelha',                   kcal:309, prot:0.4,  carb:84.0, gord:0 },
  { id:'chocolate_amargo_70',      nome:'Chocolate amargo 70%',            kcal:545, prot:7.9,  carb:46.0, gord:31.0 },

  // Bebidas e suplementos
  { id:'cafe_sem_acucar',          nome:'Café sem açúcar',                 kcal:2,   prot:0.2,  carb:0.3,  gord:0 },
  { id:'whey_protein_po',          nome:'Whey protein (pó)',               kcal:380, prot:80.0, carb:8.0,  gord:5.0 },
];

// ---- Alimentos personalizados ------------------------------
// Cadastrados pelo usuário quando um alimento não está na TACO.
// Ficam guardados no localStorage (ver STORAGE_KEYS.CUSTOM_ALIMENTOS
// em app.js) e essa variável é sincronizada com o que está salvo
// sempre que a lista muda.
let CUSTOM_FOODS = [];

function allFoods() {
  return TACO_FOODS.concat(CUSTOM_FOODS);
}

function foodById(id) {
  return allFoods().find(f => f.id === id);
}

import 'models/product.dart';

/// Imágenes vía picsum (sustituir por CDN propio).
String _img(int seed) => 'https://picsum.photos/seed/glow$seed/800/1000';

/// CDN de Beauty Creations México — catálogo real de la colección "Pestañas"
/// (https://beautycreationscosmetics.com.mx/collections/pestanas), copiado el
/// 2026-08-31 para poblar el catálogo demo. Precios en pesos mexicanos (MXN),
/// tal como los publica la tienda — ver [Product.currency].
String _bc(String file) => 'https://beautycreationscosmetics.com.mx/cdn/shop/files/$file';

final List<Product> kSeedProducts = [
  Product(
    id: 'serum-brillo',
    name: 'Sérum brillo 24h',
    category: 'Skincare',
    price: 32,
    tags: const ['luminosidad', 'hidratación', 'vegano'],
    imageUrls: [_img(1), _img(11), _img(21)],
    stockHint: 'Quedan pocas unidades',
    discountPercent: 15,
    aiPitch:
        'Encaja con pieles que buscan glow natural y refuerza el look «Clean girl» que sueles explorar.',
  ),
  Product(
    id: 'base-hd',
    name: 'Base fluida HD',
    category: 'Rostro',
    price: 28.5,
    tags: const ['cobertura media', 'larga duración'],
    imageUrls: [_img(2), _img(12)],
    discountPercent: 20,
    aiPitch: 'Equilibra tu tono cálido y combina con rubores melocotón del catálogo.',
  ),
  Product(
    id: 'paleta-atardecer',
    name: 'Paleta atardecer',
    category: 'Ojos',
    price: 42,
    tags: const ['sombras', 'fiesta', 'pigmento'],
    imageUrls: [_img(3), _img(13), _img(23), _img(33)],
    stockHint: 'Top ventas esta semana',
    aiPitch: 'Ideal si quieres profundidad en párpados; armoniza con labiales terracota.',
  ),
  Product(
    id: 'labial-velvet',
    name: 'Labial velvet',
    category: 'Labios',
    price: 22,
    tags: const ['mate', 'cómodo'],
    imageUrls: [_img(4), _img(14)],
    aiPitch: 'Contraste elegante con looks suaves en ojos; favorece conversión en bundle.',
  ),
  Product(
    id: 'iluminador',
    name: 'Iluminador polvo',
    category: 'Rostro',
    price: 35,
    tags: const ['brillo', 'editorial'],
    imageUrls: [_img(5), _img(15), _img(25)],
    aiPitch: 'Potencia el AR en vivo al captar reflejos reales sobre pómulos.',
  ),
  Product(
    id: 'delineador',
    name: 'Delineador punta pincel',
    category: 'Ojos',
    price: 18.9,
    tags: const ['precisión', 'waterproof'],
    imageUrls: [_img(6), _img(16)],
  ),
  Product(
    id: 'mascara',
    name: 'Máscara volumen',
    category: 'Ojos',
    price: 24,
    tags: const ['pestañas', 'lifting'],
    imageUrls: [_img(7), _img(17)],
    discountPercent: 10,
  ),
  Product(
    id: 'rubor-crema',
    name: 'Rubor en crema',
    category: 'Rostro',
    price: 26,
    tags: const ['fresco', 'difuminable'],
    imageUrls: [_img(8), _img(18), _img(28)],
    aiPitch: 'Refuerza prueba social: look natural que se ve bien en cámara frontal.',
  ),

  // --- Beauty Creations MX · colección "Pestañas" (27 productos reales) ---

  Product(
    id: 'pestanas-silk-bahamas',
    name: 'Pestañas Postizas - Pestañas Silk - Take Me Somewhere',
    category: 'Ojos',
    price: 48.00,
    currency: 'MXN',
    tags: const ['pestañas postizas', 'silk', 'efecto lifting', 'Estilo: Bahamas'],
    imageUrls: [
      _bc('takeme_lashes_low-res__1.jpg?v=1723558424'),
      _bc('beauty-creations-mx-pestanas-de-silk-take-me-somewhere-cosmetics-elts-09-564414.webp?v=1723558864'),
      _bc('beauty-creations-mx-pestanas-de-silk-take-me-somewhere-cosmetics-elts-09-925996.webp?v=1723558882'),
      _bc('beauty-creations-mx-pestanas-de-silk-take-me-somewhere-cosmetics-elts-09-568090.webp?v=1723558897'),
    ],
    aiPitch: 'Realza cualquier look con un efecto lifting natural; fácil aplicación para principiantes y expertas.',
    description:
        '¿Lista para cautivar con una mirada impactante? La colección de pestañas postizas de silk de '
        'Beauty Creations es tu aliada perfecta para realzar cualquier look. Diseñadas para que tu '
        'maquillaje sea el protagonista, estas pestañas son ideales tanto si buscas un estilo clásico '
        'como si prefieres un efecto de lifting más natural. La facilidad de aplicación las convierte '
        'en una opción perfecta para principiantes y expertas por igual.\n\n'
        'Cada modelo de esta colección, inspirada en destinos exóticos y vibrantes, está diseñado para '
        'adaptarse a tus necesidades de maquillaje, convirtiéndose en un básico indispensable en tu kit. '
        'Ya sea que desees un toque sutil o un efecto dramático, encontrarás el par perfecto que '
        'complementará tu estilo personal y te hará sentir fabulosa.\n\n'
        '¡No esperes más! Consigue hoy tu modelo favorito y transforma tu mirada en un instante. Con '
        'estas pestañas, cada día puede ser una nueva aventura de belleza. ¡Compra las tuyas ahora! 💅',
  ),
  Product(
    id: 'rizador-pestanas',
    name: 'Accesorios - Rizador De Pestañas',
    category: 'Ojos',
    price: 69.00,
    currency: 'MXN',
    tags: const ['rizador de pestañas', 'Hot Pink', 'Purple', 'Rosa Pastel', 'Rose Gold'],
    imageUrls: [
      _bc('beauty-creations-mx-rizador-de-pestanas-cosmetics-elc-pink-741541.jpg?v=1723579820'),
      _bc('beauty-creations-mx-rizador-de-pestanas-cosmetics-elc-pink-847349.jpg?v=1723579837'),
      _bc('beauty-creations-mx-rizador-de-pestanas-cosmetics-elc-pink-886670.jpg?v=1723579864'),
      _bc('beauty-creations-mx-rizador-de-pestanas-cosmetics-elc-pink-723650.jpg?v=1723579880'),
    ],
    description:
        'Rizador de pestañas vibrante y ergonómico diseñado para lograr un efecto de curvatura perfecto '
        'y con brillo. Su superficie interior pulida asegura una aplicación uniforme, con curvas '
        'naturales que realzan la mirada y aclaran el rostro.',
  ),
  Product(
    id: 'plump-pout-lip-liner',
    name: 'Plump & Pout - Delineador De Labios - Plumping Lip Liner',
    category: 'Labios',
    price: 109.00,
    currency: 'MXN',
    tags: const ['delineador de labios', 'efecto volumen'],
    imageUrls: [
      _bc('LIP_LINER_PLUM_AND_POUT_-_IPSY_958e9686-7eca-47f6-b0e3-ddb02a5e029b.png?v=1777930032'),
      _bc('beauty-creations-cosmetics-mx-beauty-creations-plump-pout-plumping-lip-liner-delineador-de-labios-ppllw-1-392644.jpg?v=1723570701'),
      _bc('RESIZED_03_12.jpg?v=1777930032'),
      _bc('GRAYBGFORECOMM_7.png?v=1739292788'),
    ],
    description:
        'Delineador de labios de la colección Plump & Pout que realza la definición labial mientras '
        'aporta un efecto volumizador. Su fórmula perfila y da forma a los labios con precisión, '
        'complementando cualquier labial o gloss.',
  ),
  Product(
    id: 'corpse-bride-promise-lashes',
    name: 'Corpse Bride X Beauty Creations - Pestañas Postizas 3D Faux Mink - Promise',
    category: 'Ojos',
    price: 87.50,
    currency: 'MXN',
    discountPercent: 50,
    tags: const ['pestañas postizas', 'faux mink', 'edición especial', 'cat-eye'],
    imageUrls: [
      _bc('POST-CORPSE2_1.jpg?v=1726190270'),
      _bc('CBBC2365.png?v=1726081752'),
      _bc('CBBC2130.png?v=1726081767'),
      _bc('PROMISE-LASHES.jpg?v=1725999172'),
    ],
    aiPitch: 'Colección limitada — ideal para looks temáticos o de noche con un toque dramático.',
    description:
        'Pestañas 3D winged faux mink con estilo cat-eye inspiradas en Emily de "El Cadáver de la '
        'Novia", para una mirada dramática y sofisticada. Universalmente favorecedoras, recortables '
        'para un ajuste personalizado y elaboradas con lujoso material faux mink.',
  ),
  Product(
    id: 'lash-flex-engrosador',
    name: 'Lash Flex - Rimel - Engrosador',
    category: 'Ojos',
    price: 159.00,
    currency: 'MXN',
    tags: const ['rímel', 'engrosador', 'waterproof'],
    imageUrls: [
      _bc('lash-flex-engrosador-ecom.webp?v=1753302520'),
      _bc('bcc-backup-beauty-creations-lash-flex-engrosador-rimel-cosmetics-em03-737383.jpg?v=1753302520'),
      _bc('bcc-backup-beauty-creations-lash-flex-engrosador-rimel-cosmetics-em03-562909.jpg?v=1753302520'),
      _bc('bcc-backup-beauty-creations-lash-flex-engrosador-rimel-cosmetics-em03-367214.jpg?v=1753302520'),
    ],
    description:
        'Rímel waterproof con cepillo en punta que ofrece un efecto 2 en 1: pestañas de aspecto más '
        'grueso y una longitud impresionante, con un color negro profundo.',
  ),
  Product(
    id: 'lash-attach-glue-applicador',
    name: 'Pegamento De Pestañas con Aplicador - Lash Attach Glue',
    category: 'Ojos',
    price: 119.00,
    currency: 'MXN',
    tags: const ['pegamento de pestañas', 'Black', 'Clear'],
    imageUrls: [
      _bc('3_e3cbc98d-c5b3-4a68-b07f-c55672fa8c15.png?v=1739231454'),
      _bc('bcc-backup-beauty-creations-pegamento-de-pestanas-con-aplicador-lash-attach-glue-lash-glue-cosmetics-lab-blk-107971.jpg?v=1739231454'),
      _bc('bcc-backup-beauty-creations-pegamento-de-pestanas-con-aplicador-lash-attach-glue-lash-glue-cosmetics-lab-blk-749913.jpg?v=1739231454'),
      _bc('lash-attach-glue-applicator-beauty-creations-lab-clr-413020_4174e9bf-71f7-45c4-8fd0-eff4398aa3e0.jpg?v=1739403043'),
    ],
    description:
        'Pegamento de pestañas libre de látex con aplicador integrado para una aplicación sencilla. '
        'Fórmula de larga duración y acabado waterproof, hecho en Corea (4.3g).',
  ),
  Product(
    id: 'lash-flex-alargador',
    name: 'Lash Flex - Rimel - Alargador',
    category: 'Ojos',
    price: 159.00,
    currency: 'MXN',
    tags: const ['rímel', 'alargador', 'waterproof'],
    imageUrls: [
      _bc('lash-flex-alargadora-ecom.webp?v=1753302482'),
      _bc('bcc-backup-beauty-creations-lash-flex-alargador-rimel-cosmetics-em01-458399.jpg?v=1753302482'),
      _bc('bcc-backup-beauty-creations-lash-flex-alargador-rimel-cosmetics-em01-600295.jpg?v=1753302482'),
      _bc('bcc-backup-beauty-creations-lash-flex-alargador-rimel-cosmetics-em01-865027.jpg?v=1753302482'),
    ],
    description:
        'Rímel alargador con cepillo de cerdas pequeñas diseñado para recubrir cada pestaña, con color '
        'negro profundo y protección waterproof — ideal para pestañas cortas.',
  ),
  Product(
    id: 'lash-attach-delineador-negro',
    name: 'Lash Attach - Delineador Pegamento De Pestañas - Negro',
    category: 'Ojos',
    price: 95.00,
    currency: 'MXN',
    tags: const ['delineador', 'pegamento 2 en 1', 'waterproof'],
    imageUrls: [
      _bc('lash-attack-pegamento-ecom.webp?v=1753302271'),
      _bc('lash-attach-lash-glue-liner-beauty-creations-lap-black-988575.jpg?v=1753302271'),
      _bc('lash-attach-lash-glue-liner-beauty-creations-lap-black-631586.jpg?v=1753302271'),
      _bc('lash-attach-lash-glue-liner-beauty-creations-lap-black-682379.jpg?v=1753302271'),
    ],
    description:
        'Delineador líquido y pegamento de pestañas 2 en 1, con punta de aplicación precisa. Fórmula '
        'waterproof y de larga duración que combina pegamento y delineador en un solo producto.',
  ),
  Product(
    id: 'aplicador-pestanas',
    name: 'Aplicador De Pestañas Postizas',
    category: 'Ojos',
    price: 40.00,
    currency: 'MXN',
    tags: const ['aplicador', 'Pink', 'Purple', 'Rosa Pastel', 'Rose Gold'],
    imageUrls: [
      _bc('bcc-backup-beauty-creations-aplicador-de-pestanas-pink-cosmetics-ela-pink-516909_7918a345-e197-4dad-b08e-1aa62a2f203f.jpg?v=1723483804'),
      _bc('bcc-backup-beauty-creations-aplicador-de-pestanas-pink-cosmetics-ela-pink-322248_2ca798be-a6fd-4a19-a641-4870fd9d035d.jpg?v=1723483820'),
      _bc('bcc-backup-beauty-creations-aplicador-de-pestanas-pink-cosmetics-ela-pink-570735_d9f3bd0a-9d67-4f73-8859-49cf41d4d592.jpg?v=1723483837'),
      _bc('bcc-backup-beauty-creations-aplicador-de-pestanas-purple-cosmetics-ela-purple-601084_0e952bc0-5080-4707-ba3f-ae1cff4cf575.jpg?v=1723483864'),
    ],
    description:
        'Aplicador ergonómico de pestañas postizas con acabado brillante, diseñado para ayudarte a '
        'lograr una curvatura y una aplicación precisas, combinando funcionalidad con un diseño glam.',
  ),
  Product(
    id: 'lash-flex-volumen',
    name: 'Lash Flex - Rimel - Volumen',
    category: 'Ojos',
    price: 159.00,
    currency: 'MXN',
    tags: const ['rímel', 'volumen', 'waterproof'],
    imageUrls: [
      _bc('lash-flex-volumen-ecom.webp?v=1753302500'),
      _bc('bcc-backup-beauty-creations-lash-flex-volumen-rimel-cosmetics-em02-189475.jpg?v=1753302500'),
      _bc('bcc-backup-beauty-creations-lash-flex-volumen-rimel-cosmetics-em02-674799.jpg?v=1753302500'),
      _bc('bcc-backup-beauty-creations-lash-flex-volumen-rimel-cosmetics-em02-836474.jpg?v=1753302500'),
    ],
    description:
        'Rímel voluminizador con cepillo en forma de reloj de arena diseñado para llegar entre cada '
        'pestaña, con color negro profundo y fórmula resistente al agua.',
  ),
  Product(
    id: 'casually-lashed-3d-faux-mink',
    name: 'Pestañas Postizas - Pestañas De Faux Mink - Casually Lashed',
    category: 'Ojos',
    price: 129.00,
    currency: 'MXN',
    tags: const ['pestañas postizas', 'faux mink', '23 estilos disponibles'],
    imageUrls: [
      _bc('beauty-creations-mx-casually-lashed-3d-faux-mink-pestanas-cosmetics-cml-5-513061.jpg?v=1723542623'),
      _bc('beauty-creations-mx-casually-lashed-3d-faux-mink-pestanas-cosmetics-cml-3-841054.jpg?v=1723542666'),
      _bc('beauty-creations-mx-casually-lashed-3d-faux-mink-pestanas-cosmetics-cml-15-647338.jpg?v=1723542699'),
      _bc('beauty-creations-mx-casually-lashed-3d-faux-mink-pestanas-cosmetics-cml-2-176904.jpg?v=1723542742'),
    ],
    aiPitch: 'Con 23 estilos, hay un modelo para cada nivel de intensidad que sueles pedir.',
    description:
        'Pestañas 3D faux mink de aspecto ligero y natural, disponibles en múltiples estilos: desde lo '
        'sutil hasta lo audaz. Fabricadas con fibra sintética de alta calidad que imita la textura del '
        'mink real.',
  ),
  Product(
    id: 'eyeconic-mascara-mega-volumen',
    name: 'Eyeconic - Mascara Para Pestañas - Mega Volumen',
    category: 'Ojos',
    price: 129.00,
    currency: 'MXN',
    tags: const ['rímel', 'mega volumen'],
    imageUrls: [
      _bc('PINK_OPEN.jpg?v=1779302588'),
      _bc('04RESIZED.jpg?v=1779147695'),
      _bc('PINK_CLOSED.jpg?v=1779302588'),
      _bc('09RESIZED.jpg?v=1779147695'),
    ],
    description:
        'Rímel voluminizador con ceras naturales que construyen pestañas más densas y de apariencia '
        'más larga, con una fórmula ligera y flexible que las mantiene suaves y cómodas.',
  ),
  Product(
    id: 'set-rizador-pinzas',
    name: 'Accesorios - Set De Rizador De Pestañas Y Pinzas Para Cejas',
    category: 'Ojos',
    price: 139.00,
    currency: 'MXN',
    tags: const ['rizador', 'pinzas de cejas', 'Rose Gold', 'Hot Pink', 'Light Pink', 'Purple'],
    imageUrls: [
      _bc('rosegold-eyelash-curler-and-tweezer-set-accessories-beauty-creations-tcset-b-338380.jpg?v=1739407307'),
      _bc('purple-eyelash-curler-and-tweezer-set-accessories-beauty-creations-elctset-purple-579920.jpg?v=1739407305'),
      _bc('hot-pink-eyelash-curler-and-tweezer-set-accessories-beauty-creations-elctset-pink-740358.jpg?v=1739407300'),
      _bc('light-pink-eyelash-curler-and-tweezer-set-accessories-beauty-creations-tcset-a-641452.jpg?v=1739407303'),
    ],
    description:
        'Dúo esencial que incluye pinzas de precisión con punta angulada para una depilación sin '
        'esfuerzo y un rizador de pestañas ergonómico que las levanta desde la raíz para un efecto '
        'duradero.',
  ),
  Product(
    id: 'lash-attach-glue-tubo',
    name: 'Pegamento Negro De Pestañas con Aplicador - Lash Attach Glue - Tubo',
    category: 'Ojos',
    price: 109.00,
    currency: 'MXN',
    tags: const ['pegamento de pestañas', 'tubo', 'Black', 'Clear'],
    imageUrls: [
      _bc('4_03fb5b44-c561-46ae-a72c-c1655bd14274.png?v=1739231432'),
      _bc('lash-attach-glue-tube-beauty-creations-lat-clr-748103.jpg?v=1739402737'),
      _bc('lash-attach-glue-tube-beauty-creations-lat-clr-247939.jpg?v=1739402740'),
      _bc('lash-attach-glue-tube-beauty-creations-lat-clr-999475.jpg?v=1739402743'),
    ],
    description:
        'Pegamento de pestañas libre de látex con tubo aplicador, diseñado para durar todo el día con '
        'un acabado resistente al agua. Hecho en Corea (4.3g).',
  ),
  Product(
    id: 'casually-lashed-clusters',
    name: 'Pestañas Postizas - Casually Lashed - Lash Clusters',
    category: 'Ojos',
    price: 109.00,
    currency: 'MXN',
    tags: const [
      'lash clusters',
      'Naturally Natural',
      'Naturally Wispy',
      'Naturally Long',
      'Voluminous',
      'Soft Glam',
      'Dramatic Wispy',
    ],
    imageUrls: [
      _bc('NaturallyNatural-BOX.png?v=1743698916'),
      _bc('NaturallyNatural-OPEN.png?v=1743698952'),
      _bc('Screenshot2025-01-20at1.55.28PM.png?v=1743699181'),
      _bc('NATURALLYNATURAL-MACRO.jpg?v=1743699181'),
    ],
    description:
        'Clusters de pestañas ligeros disponibles en seis estilos distintos, diseñados para realzar la '
        'belleza natural con resultados personalizados: desde la elegancia diaria hasta el efecto más '
        'dramático.',
  ),
  Product(
    id: 'santas-favorite-lash-set',
    name: "Pestañas Postizas - Set De Pestañas - Santa's Favorite Lash",
    category: 'Ojos',
    price: 579.00,
    currency: 'MXN',
    tags: const ['set de pestañas', 'edición navideña', 'incluye pegamento y aplicador'],
    imageUrls: [
      _bc('f09387e1-2fb6-45ab-8213-4c6d8ac8547c_2.jpg?v=1746230384'),
      _bc('Post-13.jpg?v=1746230384'),
    ],
    description:
        'Set navideño de edición limitada con 5 pares de pestañas postizas de mink sintético en '
        'distintos estilos, más un delineador-pegamento y un aplicador de precisión para looks '
        'festivos.',
  ),
  Product(
    id: '3d-mink-pestanas',
    name: 'Pestañas Postizas - 3D Mink',
    category: 'Ojos',
    price: 189.00,
    currency: 'MXN',
    tags: const ['3D mink', '30+ estilos disponibles', 'BB Alert', 'Brave', 'Confidential'],
    imageUrls: [
      _bc('1portadarosafuerte.webp?v=1725911380'),
      _bc('bbalert1.jpg?v=1725912065'),
      _bc('BRAVE1.jpg?v=1725912220'),
      _bc('CONFIDENCIAL1.jpg?v=1725912420'),
    ],
    description:
        'Pestañas postizas 3D mink diseñadas para aportar volumen y dimensión dramáticos a la mirada, '
        'con una lujosa construcción de fibra tipo mink.',
  ),
  Product(
    id: 'rizador-pestanas-metalico',
    name: 'Rizador De Pestañas Metálico',
    category: 'Ojos',
    price: 69.00,
    currency: 'MXN',
    tags: const ['rizador', 'metálico', 'Negro', 'Plata'],
    imageUrls: [
      _bc('beauty-crations-enchinador-negro-1.png?v=1757107227'),
      _bc('BC-5.21-wholesale-eyelash-curler-black-3.jpg?v=1757107227'),
      _bc('BC-5.21-wholesale-eyelash-curler-black-2.jpg?v=1757107227'),
      _bc('beauty-crations-enchinador-plata-1.png?v=1757107227'),
    ],
    description:
        'Rizador de pestañas ergonómico con superficie interior pulida para una aplicación uniforme, '
        'logrando curvas perfectas y duraderas con un aspecto natural y juvenil.',
  ),
  Product(
    id: 'take-me-somewhere-pr-box',
    name: 'Take Me Somewhere - PR Pestañas Postizas De Silk - PR BOX',
    category: 'Ojos',
    price: 999.00,
    currency: 'MXN',
    tags: const ['pestañas postizas', 'set completo', '24 estilos silk'],
    imageUrls: [
      _bc('take-me-somewhere-lashes-pr-lashes-beauty-creations-elts-pr-724410.jpg?v=1729262417'),
      _bc('take-me-somewhere-lashes-pr-lashes-beauty-creations-elts-pr-545969.jpg?v=1729262417'),
      _bc('take-me-somewhere-lashes-pr-lashes-beauty-creations-elts-pr-198852.jpg?v=1729262418'),
      _bc('take-me-somewhere-lashes-pr-lashes-beauty-creations-elts-pr-352816.jpg?v=1729262417'),
    ],
    description:
        'Colección completa con los 24 estilos de pestañas de silk de la línea "Take Me Somewhere", '
        'inspirados en destinos de viaje. Ligeras y cómodas, para looks glamorosos de día o de noche a '
        'un precio accesible por unidad.',
  ),
  Product(
    id: 'no-simpin-lash-duo',
    name: 'Baby Girl - Set Dúo De Pestañas Postizas - No Simpin',
    category: 'Ojos',
    price: 299.00,
    currency: 'MXN',
    tags: const ['set dúo', 'Player Alert', 'Summer Fling'],
    imageUrls: [
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-no-simpin-pestanas-postizas-cosmetics-bgelns-135614.webp?v=1723509545'),
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-no-simpin-pestanas-postizas-cosmetics-bgelns-294577.webp?v=1723509563'),
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-no-simpin-pestanas-postizas-cosmetics-bgelns-382556.webp?v=1723509606'),
    ],
    description:
        'Set dúo de pestañas postizas dramáticas con dos estilos: "Player Alert", de corte redondo y '
        'voluminoso tipo wispy, y "Summer Fling", una pestaña 3D faux mink más gruesa.',
  ),
  Product(
    id: 'casually-lashed-faux-mink-set',
    name: 'Pestañas Postizas - Set De Pestañas - Casually Lashed Faux Mink',
    category: 'Ojos',
    price: 499.00,
    currency: 'MXN',
    tags: const ['set de 6 pares', 'faux mink'],
    imageUrls: [
      _bc('bcc-backup-beauty-creations-set-de-pestanas-casually-lashed-faux-mink-cosmetics-elcset-515803.jpg?v=1723524186'),
      _bc('bcc-backup-beauty-creations-set-de-pestanas-casually-lashed-faux-mink-cosmetics-elcset-977523.jpg?v=1723524200'),
      _bc('bcc-backup-beauty-creations-set-de-pestanas-casually-lashed-faux-mink-cosmetics-elcset-111173.jpg?v=1723524218'),
      _bc('bcc-backup-beauty-creations-set-de-pestanas-casually-lashed-faux-mink-cosmetics-elcset-850478.jpg?v=1723524247'),
    ],
    description:
        'Set de pestañas postizas ligeras y reutilizables con seis estilos distintos para complementar '
        'cualquier look con un toque especial.',
  ),
  Product(
    id: 'lost-in-luv-lash-duo',
    name: 'Pestañas Postizas - Set Dúo De Pestañas Postizas - Lost In Luv',
    category: 'Ojos',
    price: 299.00,
    currency: 'MXN',
    tags: const ['set dúo', 'Lil Mama', 'Babycakez'],
    imageUrls: [
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-lost-in-luv-pestanas-postizas-cosmetics-bgell-369591.webp?v=1723509442'),
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-lost-in-luv-pestanas-postizas-cosmetics-bgell-980010.webp?v=1723509486'),
      _bc('bcc-backup-beauty-creations-duo-de-pestanas-postizas-lost-in-luv-pestanas-postizas-cosmetics-bgell-390625.webp?v=1723509501'),
    ],
    description:
        'Dúo de pestañas postizas con dos estilos: "Lil Mama", cat-eye tipo wispy para un maquillaje '
        'natural, y "Babycakez", un estilo más lleno para un efecto dramático.',
  ),
  Product(
    id: 'fire-desire-murillo-twins',
    name: 'Beauty Creations X Murillo Twins - Pestañas Postizas FIRE & DESIRE',
    category: 'Ojos',
    price: 267.00,
    currency: 'MXN',
    tags: const ['colaboración', 'Murillo Twins', 'faux mink'],
    imageUrls: [
      _bc('beauty-creations-cosmetics-mx-beauty-creations-murillo-twins-vol-2-fire-desire-lashes-mt2-els-255811.jpg?v=1723556541'),
      _bc('beauty-creations-cosmetics-mx-beauty-creations-murillo-twins-vol-2-fire-desire-lashes-mt2-els-839565.jpg?v=1723556558'),
      _bc('beauty-creations-cosmetics-mx-beauty-creations-murillo-twins-vol-2-fire-desire-lashes-mt2-els-314279.jpg?v=1723556586'),
      _bc('beauty-creations-cosmetics-mx-beauty-creations-murillo-twins-vol-2-fire-desire-lashes-mt2-els-822674.jpg?v=1723556601'),
    ],
    aiPitch: 'Colaboración de edición limitada — buen gancho para looks de creadoras que sigues.',
    description:
        'Segunda colección de pestañas postizas de mink sintético inspirada en las Murillo Twins, '
        'diseñada para miradas dramáticas y listas para la acción.',
  ),
  Product(
    id: 'lesdomakeup-rushing-out',
    name: 'LesDoMakeup X Beauty Creations - Pestañas Postizas - Rushing Out',
    category: 'Ojos',
    price: 186.00,
    currency: 'MXN',
    tags: const ['colaboración', 'LesDoMakeup', 'faux mink'],
    imageUrls: [
      _bc('LESDO-LASHES_ea8f5f59-da41-401b-aa81-af8502e9c221.jpg?v=1738363731'),
      _bc('beauty-creations-mx-lesdomakeup-individual-lashes-rushing-out-ldmv2-l1-695222.jpg?v=1738363731'),
      _bc('beauty-creations-mx-lesdomakeup-individual-lashes-rushing-out-ldmv2-l1-523814.jpg?v=1738363731'),
    ],
    description:
        'Pestañas postizas de mink sintético de alta calidad de la colaboración con LesDoMakeup, con '
        'estilos dramáticos pero refinados, ligeros y cómodos para cualquier ocasión.',
  ),
  Product(
    id: 'louie-castro-full-perra-potential',
    name: 'Louie Castro X Beauty Creations - Set De Pestañas Postizas - Full Perra Potential Faux Mink Lashes',
    category: 'Ojos',
    price: 319.00,
    currency: 'MXN',
    tags: const ['colaboración', 'Louie Castro', 'faux mink', 'set dúo'],
    imageUrls: [
      _bc('bcc-backup-beauty-creations-louie-castro-full-perra-potential-faux-mink-lashes-set-de-pesta-lcld-763025.jpg?v=1723563861'),
      _bc('bcc-backup-beauty-creations-louie-castro-full-perra-potential-faux-mink-lashes-set-de-pesta-lcld-510082.jpg?v=1723563878'),
      _bc('bcc-backup-beauty-creations-louie-castro-full-perra-potential-faux-mink-lashes-set-de-pesta-lcld-644430.jpg?v=1723563906'),
      _bc('bcc-backup-beauty-creations-louie-castro-full-perra-potential-faux-mink-lashes-set-de-pesta-lcld-230868.jpg?v=1723563921'),
    ],
    description:
        'Dúo de pestañas faux mink artesanales de la colaboración con Louie Castro, con dos estilos '
        'volumétricos: "Hide Your Hombres" y "Perras Night Out", ambos con una fullness dramática.',
  ),
  Product(
    id: 'lesdomakeup-pestanas',
    name: 'LesDoMakeup X Beauty Creations - Pestañas Postizas',
    category: 'Ojos',
    price: 186.00,
    currency: 'MXN',
    tags: const ['colaboración', 'LesDoMakeup', 'Simple Gal', 'Rushing Out'],
    imageUrls: [
      _bc('beauty-creations-mx-lesdomakeup-individual-lashes-rushing-out-ldmv2-l1-921318.jpg?v=1738363907'),
      _bc('beauty-creations-mx-lesdomakeup-individual-lashes-simple-gal-ldmv2-l2-900951.jpg?v=1738363907'),
      _bc('LESDO-LASHES_ea8f5f59-da41-401b-aa81-af8502e9c221.jpg?v=1738363731'),
      _bc('beauty-creations-mx-lesdomakeup-individual-lashes-rushing-out-ldmv2-l1-695222.jpg?v=1738363731'),
    ],
    description:
        'Pestañas postizas de mink sintético inspiradas en la beauty blogger LesDoMakeup, con un look '
        'dramático pero refinado, ligeras y cómodas, con empaque reutilizable de lujo.',
  ),
  Product(
    id: 'kit-cejas-pestanas',
    name: 'Accesorios - Kit De Cejas Y Pestañas',
    category: 'Ojos',
    price: 249.00,
    currency: 'MXN',
    tags: const ['kit', 'cejas', 'pestañas', 'pinzas', 'tijeras'],
    imageUrls: [
      _bc('pink-brow-lash-set-cosmetics-beauty-creations-elb4-377275.jpg?v=1764280559'),
      _bc('pink-brow-lash-set-cosmetics-beauty-creations-elb4-453535.jpg?v=1764280558'),
      _bc('pink-brow-lash-set-cosmetics-beauty-creations-elb4-154821.jpg?v=1764280558'),
    ],
    description:
        'Set completo de cuidado que incluye pinzas de punta fina, pinzas en ángulo, tijeras para cejas '
        'y un rizador de pestañas, en acabado lavanda.',
  ),
  Product(
    id: '3d-faux-mink-lash-set',
    name: 'Pestañas Postizas - Set De Pestañas 3D Faux Mink',
    category: 'Ojos',
    price: 672.00,
    currency: 'MXN',
    tags: const ['set de 6 pares', 'faux mink'],
    imageUrls: [
      _bc('3d-faux-mink-lash-set-lashes-beauty-creations-elmset-340465.jpg?v=1738356781'),
    ],
    description:
        'Colección curada de seis pestañas 3D faux mink para crear miradas de impacto: tus favoritas '
        'en un solo set, listas para complementar cualquier maquillaje.',
  ),
];

Product? productById(String id) {
  for (final p in kSeedProducts) {
    if (p.id == id) return p;
  }
  return null;
}

import 'models/product.dart';

/// Imágenes vía picsum (sustituir por CDN propio).
String _img(int seed) => 'https://picsum.photos/seed/glow$seed/800/1000';

final List<Product> kSeedProducts = [
  Product(
    id: 'serum-brillo',
    name: 'Sérum brillo 24h',
    category: 'Skincare',
    priceEur: 32,
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
    priceEur: 28.5,
    tags: const ['cobertura media', 'larga duración'],
    imageUrls: [_img(2), _img(12)],
    discountPercent: 20,
    aiPitch: 'Equilibra tu tono cálido y combina con rubores melocotón del catálogo.',
  ),
  Product(
    id: 'paleta-atardecer',
    name: 'Paleta atardecer',
    category: 'Ojos',
    priceEur: 42,
    tags: const ['sombras', 'fiesta', 'pigmento'],
    imageUrls: [_img(3), _img(13), _img(23), _img(33)],
    stockHint: 'Top ventas esta semana',
    aiPitch: 'Ideal si quieres profundidad en párpados; armoniza con labiales terracota.',
  ),
  Product(
    id: 'labial-velvet',
    name: 'Labial velvet',
    category: 'Labios',
    priceEur: 22,
    tags: const ['mate', 'cómodo'],
    imageUrls: [_img(4), _img(14)],
    aiPitch: 'Contraste elegante con looks suaves en ojos; favorece conversión en bundle.',
  ),
  Product(
    id: 'iluminador',
    name: 'Iluminador polvo',
    category: 'Rostro',
    priceEur: 35,
    tags: const ['brillo', 'editorial'],
    imageUrls: [_img(5), _img(15), _img(25)],
    aiPitch: 'Potencia el AR en vivo al captar reflejos reales sobre pómulos.',
  ),
  Product(
    id: 'delineador',
    name: 'Delineador punta pincel',
    category: 'Ojos',
    priceEur: 18.9,
    tags: const ['precisión', 'waterproof'],
    imageUrls: [_img(6), _img(16)],
  ),
  Product(
    id: 'mascara',
    name: 'Máscara volumen',
    category: 'Ojos',
    priceEur: 24,
    tags: const ['pestañas', 'lifting'],
    imageUrls: [_img(7), _img(17)],
    discountPercent: 10,
  ),
  Product(
    id: 'rubor-crema',
    name: 'Rubor en crema',
    category: 'Rostro',
    priceEur: 26,
    tags: const ['fresco', 'difuminable'],
    imageUrls: [_img(8), _img(18), _img(28)],
    aiPitch: 'Refuerza prueba social: look natural que se ve bien en cámara frontal.',
  ),
];

Product? productById(String id) {
  for (final p in kSeedProducts) {
    if (p.id == id) return p;
  }
  return null;
}

/// Tasa aproximada usada SOLO para poder comparar/filtrar productos de
/// distinta divisa en un mismo slider de precio (ver [Product.priceEurEquivalent]).
/// No se usa para mostrar precios al usuario — eso siempre respeta [Product.currency].
const _kMxnToEurRate = 18.7;

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.tags,
    required this.imageUrls,
    this.currency = 'EUR',
    this.stockHint,
    this.discountPercent,
    this.aiPitch,
    this.description,
  });

  final String id;
  final String name;
  final String category;
  final double price;

  /// Código ISO de la divisa en la que está expresado [price] (p. ej. 'EUR', 'MXN').
  final String currency;
  final List<String> tags;
  final List<String> imageUrls;
  final String? stockHint;
  final int? discountPercent;
  final String? aiPitch;
  final String? description;

  /// Símbolo/etiqueta corta para mostrar junto al precio.
  String get currencySymbol => symbolForCurrency(currency);

  /// Igual que [currencySymbol] pero sin necesitar una instancia de [Product]
  /// (útil, p. ej., para totales agregados por divisa).
  static String symbolForCurrency(String currency) {
    switch (currency) {
      case 'MXN':
        return r'MX$';
      case 'USD':
        return r'US$';
      case 'EUR':
      default:
        return '€';
    }
  }

  /// Precio de [price] convertido a un equivalente aproximado en euros,
  /// usado únicamente para el filtro de "precio máximo" del catálogo
  /// (que opera con un solo slider numérico sobre productos multi-divisa).
  double get priceEurEquivalent {
    switch (currency) {
      case 'MXN':
        return price / _kMxnToEurRate;
      default:
        return price;
    }
  }
}

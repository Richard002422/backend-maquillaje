class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.priceEur,
    required this.tags,
    required this.imageUrls,
    this.stockHint,
    this.discountPercent,
    this.aiPitch,
  });

  final String id;
  final String name;
  final String category;
  final double priceEur;
  final List<String> tags;
  final List<String> imageUrls;
  final String? stockHint;
  final int? discountPercent;
  final String? aiPitch;
}

class CartLine {
  const CartLine({required this.productId, required this.quantity});

  final String productId;
  final int quantity;

  Map<String, dynamic> toJson() => {'productId': productId, 'quantity': quantity};

  static CartLine fromJson(Map<String, dynamic> j) {
    return CartLine(
      productId: j['productId'] as String,
      quantity: (j['quantity'] as num).toInt(),
    );
  }

  CartLine copyWith({int? quantity}) {
    return CartLine(productId: productId, quantity: quantity ?? this.quantity);
  }
}

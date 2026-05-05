import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get light {
    const primary = Color(0xFF8F4F5A);
    const surface = Color(0xFFFAF7F5);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.light,
        surface: surface,
      ),
      scaffoldBackgroundColor: surface,
      appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
    );
  }
}

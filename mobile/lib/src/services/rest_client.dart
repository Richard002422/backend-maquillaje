import 'dart:convert';

import 'package:http/http.dart' as http;

/// Cliente REST mínimo. Centraliza baseUrl y cabeceras para tu backend.
class RestClient {
  RestClient({required this.baseUrl, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  Uri _uri(String path, [Map<String, String>? query]) {
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$normalized').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> getJson(String path) async {
    final res = await _http.get(_uri(path));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw RestException(res.statusCode, res.body);
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await _http.post(
      _uri(path),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw RestException(res.statusCode, res.body);
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  void close() => _http.close();
}

class RestException implements Exception {
  RestException(this.statusCode, this.body);
  final int statusCode;
  final String body;

  @override
  String toString() => 'RestException($statusCode): $body';
}

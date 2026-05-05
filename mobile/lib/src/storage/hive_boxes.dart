import 'package:hive_flutter/hive_flutter.dart';

const String kPrefsBox = 'prefs';

/// Caja local mínima (último look, flags). Sustituible por Isar si necesitas
/// consultas e índices más ricos.
Future<void> openAppBoxes() async {
  await Hive.openBox<dynamic>(kPrefsBox);
}

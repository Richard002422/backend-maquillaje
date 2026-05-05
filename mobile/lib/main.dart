import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'src/app.dart';
import 'src/storage/hive_boxes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await openAppBoxes();
  runApp(const ProviderScope(child: GlowLabApp()));
}

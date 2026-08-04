import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'src/app.dart';
import 'src/core/config/app_config.dart';
import 'src/core/logging/app_logger.dart';
import 'src/storage/hive_boxes.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final config = AppConfig.fromEnvironment();
  AppLogger(flavor: config.flavor).info(
    'GlowLab host flavor=${config.flavor} api=${config.apiBaseUrl} web=${config.webBaseUrl}',
    tag: 'boot',
  );

  await Hive.initFlutter();
  await openAppBoxes();
  runApp(const ProviderScope(child: GlowLabApp()));
}

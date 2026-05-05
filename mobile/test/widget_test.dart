import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'package:glowlab_mobile/src/app.dart';

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    await Hive.initFlutter();
    await Hive.openBox<dynamic>('prefs');
  });

  tearDownAll(() async {
    await Hive.close();
  });

  testWidgets('GlowLabApp se construye', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: GlowLabApp()));
    await tester.pumpAndSettle(const Duration(seconds: 2));
    expect(find.textContaining('GlowLab'), findsWidgets);
  });
}

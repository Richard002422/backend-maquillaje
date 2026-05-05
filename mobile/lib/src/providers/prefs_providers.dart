import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../storage/hive_boxes.dart';

final prefsBoxProvider = Provider<Box<dynamic>>((ref) {
  return Hive.box<dynamic>(kPrefsBox);
});

/// Id del último estilo de maquillaje elegido (string libre).
final lastLookIdProvider = NotifierProvider<LastLookIdNotifier, String?>(
  LastLookIdNotifier.new,
);

class LastLookIdNotifier extends Notifier<String?> {
  static const _key = 'last_look_id';

  @override
  String? build() {
    final box = ref.watch(prefsBoxProvider);
    return box.get(_key) as String?;
  }

  Future<void> setLook(String? id) async {
    final box = ref.read(prefsBoxProvider);
    if (id == null) {
      await box.delete(_key);
    } else {
      await box.put(_key, id);
    }
    state = id;
  }
}

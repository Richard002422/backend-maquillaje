import 'package:share_plus/share_plus.dart';

/// Compartir texto/archivos con el sheet nativo del sistema.
abstract class IShareService {
  Future<void> shareText(String text, {String? subject});
}

class ShareService implements IShareService {
  @override
  Future<void> shareText(String text, {String? subject}) async {
    await SharePlus.instance.share(ShareParams(text: text, subject: subject));
  }
}

class ShareServiceStub implements IShareService {
  @override
  Future<void> shareText(String text, {String? subject}) async {}
}

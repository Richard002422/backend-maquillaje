import '../services/launch_urls.dart';

/// Apertura de enlaces externos (navegador / Custom Tabs).
abstract class ILinkService {
  Future<bool> openExternal(String url);
}

class LinkService implements ILinkService {
  @override
  Future<bool> openExternal(String url) => openExternalUrl(url);
}

class LinkServiceStub implements ILinkService {
  @override
  Future<bool> openExternal(String url) async => false;
}

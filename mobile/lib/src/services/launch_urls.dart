import 'package:url_launcher/url_launcher.dart';

Future<bool> openExternalUrl(String url) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri)) {
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

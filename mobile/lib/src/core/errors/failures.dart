/// Fallos de dominio/plataforma. La UI traduce [message] a copy localizado.
///
/// Se evita lanzar excepciones crudas de plugins hacia la presentación.
sealed class Failure {
  const Failure(this.message, {this.code});

  final String message;
  final String? code;
}

final class PermissionFailure extends Failure {
  const PermissionFailure(super.message, {super.code});
}

final class PlatformFailure extends Failure {
  const PlatformFailure(super.message, {super.code});
}

final class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code});
}

final class BridgeFailure extends Failure {
  const BridgeFailure(super.message, {super.code});
}

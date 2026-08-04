import 'failures.dart';

/// Resultado explícito éxito/error (sin excepciones en el happy path).
sealed class Result<T> {
  const Result();

  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  });
}

final class Success<T> extends Result<T> {
  const Success(this.data);
  final T data;

  @override
  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  }) =>
      success(data);
}

final class Err<T> extends Result<T> {
  const Err(this.failure);
  final Failure failure;

  @override
  R when<R>({
    required R Function(T data) success,
    required R Function(Failure failure) failure,
  }) =>
      failure(this.failure);
}

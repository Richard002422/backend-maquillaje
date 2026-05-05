export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'HTTP_ERROR',
    public details?: unknown,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const toConflictException = (message: string): ConflictException =>
  new ConflictException(message);

export const extractDatabaseErrorMessage = (
  error: unknown,
): string | undefined => {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const regexMatches = [
    /message:\s+"([^"]+)"/u,
    /ERROR:\s+([^\r\n]+)/u,
  ];

  for (const expression of regexMatches) {
    const match = error.message.match(expression);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
};

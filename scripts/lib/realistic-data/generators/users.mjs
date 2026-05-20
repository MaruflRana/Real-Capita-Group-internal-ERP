// ── Users generator: walkthrough users with password hashing ──────────

import argon2 from 'argon2';
import { WALKTHROUGH_USERS, UAT_PASSWORD } from '../config.mjs';

export const seedUsers = async (tx, companyId, refs, roles) => {
  const passwordHash = await argon2.hash(UAT_PASSWORD);
  const users = {};

  for (const userSpec of WALKTHROUGH_USERS) {
    const user = await tx.user.upsert({
      where: { email: userSpec.email },
      create: {
        email: userSpec.email,
        passwordHash,
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        isActive: true,
      },
      update: {
        passwordHash,
        firstName: userSpec.firstName,
        lastName: userSpec.lastName,
        isActive: true,
      },
    });

    users[userSpec.email] = user;
    refs.set('user', userSpec.email, user.id);

    // Assign roles to company scope
    for (const roleCode of userSpec.roles) {
      await tx.userRole.upsert({
        where: {
          userId_companyId_roleId: {
            userId: user.id,
            companyId,
            roleId: roles[roleCode].id,
          },
        },
        create: {
          userId: user.id,
          companyId,
          roleId: roles[roleCode].id,
          isActive: true,
        },
        update: {
          isActive: true,
        },
      });
    }
  }

  return users;
};

import { fn } from "storybook/test";
import type { AuthContextValue } from "../src/auth/authContext";
import type { Role, User } from "../src/types/user";

export function demoUser(role: Role): User {
  return {
    id: 1,
    name: "Camille Martin",
    email: "camille@example.test",
    role,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };
}

export function demoAuth(user: User | null, loading = false): AuthContextValue {
  return {
    user,
    loading,
    login: fn<AuthContextValue["login"]>().mockResolvedValue(undefined),
    register: fn<AuthContextValue["register"]>().mockResolvedValue(undefined),
    logout: fn<AuthContextValue["logout"]>(),
  };
}

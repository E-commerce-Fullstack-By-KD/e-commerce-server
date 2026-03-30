import { User } from "src/core/database/entity";

export type AuthUser = Partial<User> & { id: number };
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: RoleUser;
}

export interface RoleUser {
  id: number;
  name: string;
  code: string;
}

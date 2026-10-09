export interface AdminJwtPayload {
  sub: string;
  username: string;
  role: 'admin';
  type: 'admin';
}

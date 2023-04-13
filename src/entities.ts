export interface Meal {
  id: string;
  user_id: string; 
  name: string;
  description: string;
  date: Date;
  is_compliant: boolean;
}

export interface User {
  id: string;
  user_name: string;
  password: string;
}

export interface Session_id {
  value: string;
  user_id: string;
  expire_date: Date;
}
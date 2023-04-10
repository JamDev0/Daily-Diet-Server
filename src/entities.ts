export interface Meal {
  id: string;
  user_session_id: string; // Id of the user that is storage in user cookies
  name: string;
  description: string;
  date: Date;
  is_compliant: boolean;
}
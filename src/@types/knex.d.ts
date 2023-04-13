import { Knex } from "knex"; // eslint-disable-line

Knex; // Needed so vs code dosen't erase the line above (Even with the eslint-disable-line )

import { Meal, Session_id, User } from './../entities';

declare module 'knex/types/tables' {
  export interface Tables {
    meals: Meal;
    users: User;
    session_ids: Session_id;
  }
}
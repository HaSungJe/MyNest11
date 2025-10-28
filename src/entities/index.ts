import { Auth } from "./user/t_auth.entity";
import { State } from "./user/t_state.entity";
import { User } from "./user/t_user.entity";
import { UserLogin } from "./user/t_user_login.entity";

export default function getEntities() {
    return [
        User, UserLogin, State, Auth
    ];
}
import { User } from "./user/t_user.entity";
import { UserLogin } from "./user/t_user_login.entity";

export default function getEntities() {
    return [
        User, UserLogin
    ];
}
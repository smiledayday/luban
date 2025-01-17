import { mongoConfig } from '@/backend/config';
import { LoginInDTO, UserEntity } from './types';
import {
  createAccessToken,
  createRefreshToken,
  decode,
  formatUserResponse,
  hash,
} from './utils';

export const loginService = async (body: LoginInDTO) => {
  try {
    const { userName, password } = body;
    const mongodb = process.dbContext.mongo;
    const db = mongodb.db(mongoConfig.dbName);
    const collection = db.collection(mongoConfig.userCollectionName);
    const user = await collection.findOne({ name: userName });
    if (user) {
      const decodedPassword = await decode(password);
      const passwordHash = hash(decodedPassword, user._salt);
      if (passwordHash === user._password) {
        const lastLoginTimes = [...user.last_login_times, new Date().getTime()];
        const result = await collection.updateOne(
          { id: user.id },
          { $set: { last_login_times: lastLoginTimes } },
        );
        if (result.acknowledged) {
          const userData: UserEntity = {
            _id: user._id,
            id: user.id,
            name: user.name,
            _password: user._password,
            _salt: user._salt,
            desc: user.desc,
            sex: user.sex,
            avatar: user.avatar,
            roles: user.roles,
            create_time: user.create_time,
            last_login_times: lastLoginTimes,
          };

          const responseUser = formatUserResponse(user);

          const accessToken = createAccessToken(userData);
          const refreshToken = createRefreshToken(userData);

          return { user: responseUser, accessToken, refreshToken };
        } else {
          throw new Error('服务器发生错误');
        }
      } else {
        throw new Error('账号或密码错误');
      }
    } else {
      throw new Error('账号或密码错误');
    }
  } catch (e) {
    return Promise.reject(e);
  }
};

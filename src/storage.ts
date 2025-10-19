// 数据存储工具函数

import type { Requirement, SprintPool } from './types';

export interface User {
  name: string;
  email: string;
}

export interface StorageData {
  requirements: Requirement[];
  sprintPools: SprintPool[];
  unscheduled: Requirement[];
}

const STORAGE_PREFIX = 'wsjf_';
const USER_KEY = 'current_user';

// 生成用户数据key
const getUserDataKey = (email: string) => {
  return `${STORAGE_PREFIX}data_${email}`;
};

// 保存当前用户
export const saveCurrentUser = (user: User) => {
  localStorage.setItem(`${STORAGE_PREFIX}${USER_KEY}`, JSON.stringify(user));
};

// 获取当前用户
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(`${STORAGE_PREFIX}${USER_KEY}`);
  return userStr ? JSON.parse(userStr) : null;
};

// 登出
export const logout = () => {
  localStorage.removeItem(`${STORAGE_PREFIX}${USER_KEY}`);
};

// 保存用户数据
export const saveUserData = (user: User, data: StorageData) => {
  const key = getUserDataKey(user.email);
  localStorage.setItem(key, JSON.stringify(data));
};

// 加载用户数据
export const loadUserData = (user: User): StorageData | null => {
  const key = getUserDataKey(user.email);
  const dataStr = localStorage.getItem(key);
  return dataStr ? JSON.parse(dataStr) : null;
};

// 注册或登录用户
export const loginUser = (name: string, email: string): User => {
  const user: User = { name, email };
  saveCurrentUser(user);
  return user;
};

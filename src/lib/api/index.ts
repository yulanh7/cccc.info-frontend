// src/lib/api/index.ts

// 导出客户端
export { apiClient, ApiClient } from './client';

// 导出认证 API
export { authApi, AuthApi } from './auth';

// 导出类型
export type {
    ApiResponse,
    User,
    LoginRequest,
    SignupRequest,
    AuthResponse,
    RefreshTokenResponse,
    RequestConfig,
} from './types';

// 导出错误类
export { ApiError } from './types';

// 未来可以添加其他 API 模块
// export { postsApi } from './posts';
// export { groupsApi } from './groups';
// export { messagesApi } from './messages';
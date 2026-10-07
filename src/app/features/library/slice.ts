import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AxiosResponse } from 'axios';
import api, { apiRequest } from '../request';
import { unwrapData } from '@/app/types';
import type { LoadStatus, ApiResponseRaw } from '@/app/types';
import type {
  LibraryPagination,
  LibraryCatalogGroup,
  LibraryCatalogData,
  LibraryCatalogParams,
  LibraryCategory,
  LibraryItem,
  LibraryItemDetail,
  LibraryBorrow,
  LibraryBorrowsData,
  LibraryBorrowStatus,
  LibraryBorrowResult,
  LibraryBorrowBody,
  LibraryItemInput,
  LibraryAdminBorrowsParams,
  LibraryBorrower,
  LibraryImportReport,
  LibraryAccessLink,
} from '@/app/types/library';

type ListState<T> = {
  list: T[];
  pagination: LibraryPagination | null;
  status: LoadStatus;
  error: string | null;
};

const emptyList = <T,>(): ListState<T> => ({ list: [], pagination: null, status: 'idle', error: null });

interface LibraryState {
  catalog: ListState<LibraryCatalogGroup>;
  categories: { list: LibraryCategory[]; status: LoadStatus; error: string | null };
  myBorrows: ListState<LibraryBorrow>;
  adminBorrows: ListState<LibraryBorrow>;
}

const initialState: LibraryState = {
  catalog: emptyList(),
  categories: { list: [], status: 'idle', error: null },
  myBorrows: emptyList(),
  adminBorrows: emptyList(),
};

const LIBRARY_ENDPOINTS = {
  CATALOG: '/library/catalog',
  CATEGORIES: '/library/categories',
  ITEMS: '/library/items',
  ITEM: (id: number) => `/library/items/${id}`,
  LOOKUP: '/library/items/lookup',
  BORROW: (id: number) => `/library/items/${id}/borrow`,
  RESTORE: (id: number) => `/library/items/${id}/restore`,
  RETURN: (borrowId: number) => `/library/borrows/${borrowId}/return`,
  MY_BORROWS: '/library/my-borrows',
  BORROWS: '/library/borrows',
  BORROWERS: '/library/borrowers',
  IMPORT_PREVIEW: '/library/import/preview',
  IMPORT: '/library/import',
  EXPORT: '/library/export',
  ACCESS_LINK: '/library/access-link',
  ACCESS_LINK_RESET: '/library/access-link/reset',
  ACCESS_CHECK: (code: string) => `/library/access/${encodeURIComponent(code)}`,
} as const;

/** 拼查询串：跳过 undefined / null / '' / false */
const toQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

const errMsg = (e: any, fallback: string) =>
  (typeof e === 'string' ? e : e?.message) || fallback;

/* ======================================================
 *                     所有登录用户
 * ====================================================== */

// ===== 目录：GET /api/library/catalog（复本合并为组）
export const fetchLibraryCatalog = createAsyncThunk<LibraryCatalogData, LibraryCatalogParams>(
  'library/fetchCatalog',
  async ({ page = 1, per_page = 20, ...rest }, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryCatalogData>(
        'GET',
        LIBRARY_ENDPOINTS.CATALOG + toQuery({ ...rest, page, per_page })
      );
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load the catalog')) as any;
    }
  }
);

// ===== 分类：GET /api/library/categories
export const fetchLibraryCategories = createAsyncThunk<LibraryCategory[], void>(
  'library/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ categories: LibraryCategory[] }>('GET', LIBRARY_ENDPOINTS.CATEGORIES);
      return unwrapData(res).categories ?? [];
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load categories')) as any;
    }
  }
);

// ===== 详情：GET /api/library/items/<id>（管理员编辑时读取完整资料，不存进 store）
export const fetchLibraryItem = createAsyncThunk<LibraryItemDetail, number>(
  'library/fetchItem',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryItemDetail>('GET', LIBRARY_ENDPOINTS.ITEM(id));
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load the item')) as any;
    }
  }
);

// ===== 按编号 / 条码查找：GET /api/library/items/lookup?code=（不区分大小写）
// 目前没有页面使用（主页搜索框已能搜编号）；保留给以后的扫码功能
export const lookupLibraryItem = createAsyncThunk<LibraryItemDetail, string>(
  'library/lookupItem',
  async (code, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryItemDetail>('GET', LIBRARY_ENDPOINTS.LOOKUP + toQuery({ code }));
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Item not found')) as any;
    }
  }
);

// ===== 借书 / 代借：POST /api/library/items/<id>/borrow
// 目录分组 / 详情页带 any_copy: true；按编号查到的那一件不带；代借带 user_id
export const borrowLibraryItem = createAsyncThunk<
  LibraryBorrowResult,
  { itemId: number } & LibraryBorrowBody
>('library/borrowItem', async ({ itemId, ...body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<LibraryBorrowResult>('POST', LIBRARY_ENDPOINTS.BORROW(itemId), body);
    return unwrapData(res);
  } catch (e: any) {
    return rejectWithValue(errMsg(e, 'Borrow failed')) as any;
  }
});

// ===== 还书 / 代还：POST /api/library/borrows/<record_id>/return
export const returnLibraryBorrow = createAsyncThunk<LibraryBorrow, number>(
  'library/returnBorrow',
  async (borrowId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ borrow: LibraryBorrow }>('POST', LIBRARY_ENDPOINTS.RETURN(borrowId));
      return unwrapData(res).borrow;
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Return failed')) as any;
    }
  }
);

// ===== 我的借阅：GET /api/library/my-borrows（不传 status = 全部）
export const fetchMyBorrows = createAsyncThunk<
  LibraryBorrowsData,
  { status?: LibraryBorrowStatus; page?: number; per_page?: number }
>('library/fetchMyBorrows', async ({ page = 1, per_page = 20, status }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<LibraryBorrowsData>(
      'GET',
      LIBRARY_ENDPOINTS.MY_BORROWS + toQuery({ status, page, per_page })
    );
    return unwrapData(res);
  } catch (e: any) {
    return rejectWithValue(errMsg(e, 'Failed to load your borrows')) as any;
  }
});

/* ======================================================
 *                 仅图书管理员 / admin
 * ====================================================== */

// ===== 新增：POST /api/library/items
export const createLibraryItem = createAsyncThunk<LibraryItem, LibraryItemInput>(
  'library/createItem',
  async (body, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryItem>('POST', LIBRARY_ENDPOINTS.ITEMS, body);
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Create item failed')) as any;
    }
  }
);

// ===== 编辑：PUT /api/library/items/<id>（只传要改的字段）
export const updateLibraryItem = createAsyncThunk<
  LibraryItem,
  { id: number; body: LibraryItemInput }
>('library/updateItem', async ({ id, body }, { rejectWithValue }) => {
  try {
    const res = await apiRequest<LibraryItem>('PUT', LIBRARY_ENDPOINTS.ITEM(id), body);
    return unwrapData(res);
  } catch (e: any) {
    return rejectWithValue(errMsg(e, 'Update item failed')) as any;
  }
});

// ===== 下架（软删除）：DELETE /api/library/items/<id>
export const deactivateLibraryItem = createAsyncThunk<LibraryItem, number>(
  'library/deactivateItem',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryItem>('DELETE', LIBRARY_ENDPOINTS.ITEM(id));
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Deactivate item failed')) as any;
    }
  }
);

// ===== 恢复：POST /api/library/items/<id>/restore
export const restoreLibraryItem = createAsyncThunk<LibraryItem, number>(
  'library/restoreItem',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryItem>('POST', LIBRARY_ENDPOINTS.RESTORE(id));
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Restore item failed')) as any;
    }
  }
);

// ===== 所有借阅：GET /api/library/borrows
export const fetchAdminBorrows = createAsyncThunk<LibraryBorrowsData, LibraryAdminBorrowsParams>(
  'library/fetchAdminBorrows',
  async ({ page = 1, per_page = 20, ...rest }, { rejectWithValue }) => {
    try {
      const res = await apiRequest<LibraryBorrowsData>(
        'GET',
        LIBRARY_ENDPOINTS.BORROWS + toQuery({ ...rest, page, per_page })
      );
      return unwrapData(res);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load borrows')) as any;
    }
  }
);

// ===== 找借阅人（代借用）：GET /api/library/borrowers?q=（最多 20 人）
export const searchLibraryBorrowers = createAsyncThunk<LibraryBorrower[], string>(
  'library/searchBorrowers',
  async (q, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ users: LibraryBorrower[] }>('GET', LIBRARY_ENDPOINTS.BORROWERS + toQuery({ q }));
      return unwrapData(res).users ?? [];
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to search users')) as any;
    }
  }
);

// ===== 导入 Excel：preview 只检查不写入；正式导入为单个事务
// multipart：必须覆盖实例默认的 JSON Content-Type，否则 axios 会把 FormData 转成 JSON
const postImportFile = async (endpoint: string, file: File): Promise<LibraryImportReport> => {
  const form = new FormData();
  form.append('file', file);
  try {
    const res: AxiosResponse<ApiResponseRaw<LibraryImportReport>> = await api.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Import failed');
    return res.data.data;
  } catch (e: any) {
    throw new Error(e?.response?.data?.message || e?.message || 'Import failed');
  }
};

export const previewLibraryImport = createAsyncThunk<LibraryImportReport, File>(
  'library/previewImport',
  async (file, { rejectWithValue }) => {
    try {
      return await postImportFile(LIBRARY_ENDPOINTS.IMPORT_PREVIEW, file);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Import preview failed')) as any;
    }
  }
);

export const importLibrary = createAsyncThunk<LibraryImportReport, File>(
  'library/import',
  async (file, { rejectWithValue }) => {
    try {
      return await postImportFile(LIBRARY_ENDPOINTS.IMPORT, file);
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Import failed')) as any;
    }
  }
);

// ===== 导出：GET /api/library/export → xlsx 下载（不能当 JSON 解析）
export const exportLibrary = createAsyncThunk<void, void>(
  'library/export',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<Blob>(LIBRARY_ENDPOINTS.EXPORT, { responseType: 'blob' });
      const disposition = String(res.headers['content-disposition'] ?? '');
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      // 跨域时后端未暴露 Content-Disposition，按后端同样的规则兜底：library-YYYY-MM-DD.xlsx
      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fallback = `library-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.xlsx`;
      const filename = match ? decodeURIComponent(match[1]) : fallback;

      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      // 错误响应也是 blob，读出来取 message
      let message = e?.message || 'Export failed';
      const data = e?.response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text())?.message || message;
        } catch { /* 不是 JSON，保留默认文案 */ }
      }
      return rejectWithValue(message) as any;
    }
  }
);

/* ======================================================
 *          访问链接 / 二维码（第 5.9 节）
 * ====================================================== */

// ===== 验证访问码：GET /api/library/access/<code>（任何登录用户；无效 → 404）
export const verifyLibraryAccess = createAsyncThunk<boolean, string>(
  'library/verifyAccess',
  async (code, { rejectWithValue }) => {
    try {
      return !!unwrapData(await apiRequest<{ valid: boolean }>('GET', LIBRARY_ENDPOINTS.ACCESS_CHECK(code))).valid;
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'This library link is no longer valid')) as any;
    }
  }
);

// ===== 读取访问链接（没有就自动创建）：GET /api/library/access-link（仅图书管理员）
export const fetchAccessLink = createAsyncThunk<LibraryAccessLink, void>(
  'library/fetchAccessLink',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<LibraryAccessLink>('GET', LIBRARY_ENDPOINTS.ACCESS_LINK));
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to load the library link')) as any;
    }
  }
);

// ===== 打开 / 关闭：PUT /api/library/access-link（再打开还是同一个 code）
export const setAccessLinkEnabled = createAsyncThunk<LibraryAccessLink, boolean>(
  'library/setAccessLinkEnabled',
  async (enabled, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<LibraryAccessLink>('PUT', LIBRARY_ENDPOINTS.ACCESS_LINK, { enabled }));
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to update the library link')) as any;
    }
  }
);

// ===== 重新生成：POST /api/library/access-link/reset（旧链接、旧二维码立即失效）
export const resetAccessLink = createAsyncThunk<LibraryAccessLink, void>(
  'library/resetAccessLink',
  async (_, { rejectWithValue }) => {
    try {
      return unwrapData(await apiRequest<LibraryAccessLink>('POST', LIBRARY_ENDPOINTS.ACCESS_LINK_RESET));
    } catch (e: any) {
      return rejectWithValue(errMsg(e, 'Failed to reset the library link')) as any;
    }
  }
);

/* ======================================================
 *                         Slice
 * ====================================================== */

/** 用返回的那一行替换列表里同 id 的行 */
const replaceById = <T extends { id: number }>(list: T[], next: T) => {
  const idx = list.findIndex((x) => x.id === next.id);
  if (idx >= 0) list[idx] = next;
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibraryCatalog.pending, (s) => {
        s.catalog.status = 'loading';
        s.catalog.error = null;
      })
      .addCase(fetchLibraryCatalog.fulfilled, (s, a) => {
        s.catalog.status = 'succeeded';
        s.catalog.list = a.payload.groups ?? [];
        s.catalog.pagination = a.payload.pagination ?? null;
      })
      .addCase(fetchLibraryCatalog.rejected, (s, a) => {
        s.catalog.status = 'failed';
        s.catalog.error = (a.payload as string) || 'Failed to load the catalog';
      });

    builder
      .addCase(fetchLibraryCategories.pending, (s) => {
        s.categories.status = 'loading';
        s.categories.error = null;
      })
      .addCase(fetchLibraryCategories.fulfilled, (s, a) => {
        s.categories.status = 'succeeded';
        s.categories.list = a.payload;
      })
      .addCase(fetchLibraryCategories.rejected, (s, a) => {
        s.categories.status = 'failed';
        s.categories.error = (a.payload as string) || 'Failed to load categories';
      });

    builder
      .addCase(fetchMyBorrows.pending, (s) => {
        s.myBorrows.status = 'loading';
        s.myBorrows.error = null;
      })
      .addCase(fetchMyBorrows.fulfilled, (s, a) => {
        s.myBorrows.status = 'succeeded';
        s.myBorrows.list = a.payload.borrows ?? [];
        s.myBorrows.pagination = a.payload.pagination ?? null;
      })
      .addCase(fetchMyBorrows.rejected, (s, a) => {
        s.myBorrows.status = 'failed';
        s.myBorrows.error = (a.payload as string) || 'Failed to load your borrows';
      });

    builder
      .addCase(fetchAdminBorrows.pending, (s) => {
        s.adminBorrows.status = 'loading';
        s.adminBorrows.error = null;
      })
      .addCase(fetchAdminBorrows.fulfilled, (s, a) => {
        s.adminBorrows.status = 'succeeded';
        s.adminBorrows.list = a.payload.borrows ?? [];
        s.adminBorrows.pagination = a.payload.pagination ?? null;
      })
      .addCase(fetchAdminBorrows.rejected, (s, a) => {
        s.adminBorrows.status = 'failed';
        s.adminBorrows.error = (a.payload as string) || 'Failed to load borrows';
      });

    // 还书 / 代还：更新对应的借阅行（是否移到“历史”由页面重新拉取决定）
    builder.addCase(returnLibraryBorrow.fulfilled, (s, a) => {
      replaceById(s.myBorrows.list, a.payload);
      replaceById(s.adminBorrows.list, a.payload);
    });
  },
});

export default librarySlice.reducer;

import type { UserProps } from "./user";

/** ===================== 图书馆（对应后端 /api/library/*） ===================== */

/** 图书管理员权限值 */
export const PERMISSION_MANAGE_LIBRARY = "manage_library";

/** 能否看到图书馆的管理操作：必须单独授予 manage_library，admin 也不例外 */
export const canManageLibrary = (user?: UserProps | null): boolean =>
  !!user?.permissions?.includes(PERMISSION_MANAGE_LIBRARY);

export type LibraryItemType = "book" | "dvd" | "cd" | "vcd" | "mp3";
export const LIBRARY_ITEM_TYPES: LibraryItemType[] = ["book", "dvd", "cd", "vcd", "mp3"];

export type LibraryPagination = {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  /** 仅目录接口：符合筛选条件的总册数（available_only 时只算可借的）；total 是组数 */
  total_items?: number;
};

/** 复本：目录分组的 items、详情 / 查找接口的 copies */
export type LibraryCopy = {
  id: number;
  call_number: string | null;
  available: boolean;
  /** 仅图书管理员带 include_inactive 时有：false = 已下架 */
  is_active?: boolean;
  /** 仅图书管理员的目录响应有：没人借为 null；普通用户的响应里没有这个键。前端不显示借阅人，只用 id 代还 */
  current_borrow?: {
    id: number;
    user: { id: number; firstName: string; email?: string };
    borrowed_at: string;
  } | null;
};

/** 借阅里内嵌的精简馆藏 */
export type LibraryBorrowItem = {
  id: number;
  call_number: string | null;
  title: string;
  item_type: LibraryItemType;
  category: string;
};

/** 借阅记录；user.email 只在图书管理员的响应里有 */
export type LibraryBorrow = {
  id: number;
  item: LibraryBorrowItem;
  user: { id: number; firstName: string; email?: string };
  borrowed_at: string;
  borrowed_by: { id: number; firstName: string } | null;
  /** null = 借阅中 */
  returned_at: string | null;
  returned_by: { id: number; firstName: string } | null;
};

/** 馆藏对象：除 id / item_type / category / title / is_active / available 外都可能为 null */
export type LibraryItem = {
  id: number;
  call_number: string | null;
  item_type: LibraryItemType;
  category: string;
  title: string;
  creator: string | null;
  publisher: string | null;
  publish_place: string | null;
  year: string | null;
  language: string | null;
  subtitles: string | null;
  disc_count: number | null;
  duration: string | null;
  catalog_date: string | null;
  barcode: string | null;
  is_active: boolean;
  available: boolean;
  /** 仅图书管理员的响应有：没人借为 null */
  current_borrow?: LibraryBorrow | null;
};

/** 详情 / 按编号查找：多一个 copies（同一本书的所有在架复本，含自己） */
export type LibraryItemDetail = LibraryItem & { copies: LibraryCopy[] };

/** 目录：同一本书的复本合并为一组 */
export type LibraryCatalogGroup = {
  title: string;
  creator: string | null;
  publisher: string | null;
  item_type: LibraryItemType;
  category: string;
  total: number;
  available: number;
  items: LibraryCopy[];
};

/** 注意：pagination.total 是组数，不是册数 */
export type LibraryCatalogData = {
  groups: LibraryCatalogGroup[];
  pagination: LibraryPagination;
};

export type LibraryCategory = {
  category: string;
  item_type: LibraryItemType;
  total: number;
  available: number;
};

export type LibraryCatalogParams = {
  q?: string;
  category?: string;
  item_type?: LibraryItemType;
  available_only?: boolean;
  /** 仅图书管理员：也列出已下架的 */
  include_inactive?: boolean;
  page?: number;
  per_page?: number;
};

export type LibraryBorrowStatus = "active" | "returned";

export type LibraryBorrowsData = {
  borrows: LibraryBorrow[];
  pagination: LibraryPagination;
};

/** 借书成功：item 是实际借到的那一件（any_copy 时可能不是点的那件） */
export type LibraryBorrowResult = {
  borrow: LibraryBorrow;
  item: LibraryItem;
};

export type LibraryBorrowBody = {
  /** 目录分组 / 详情页的“借这本书”用；按编号查到的那一件不要带 */
  any_copy?: boolean;
  /** 代借：仅图书管理员 */
  user_id?: number;
};

/** ===== 仅图书管理员 ===== */

/** 新增 / 编辑：编辑只传要改的字段；传空字符串 = 清空（title、category 不能清空） */
export type LibraryItemInput = Partial<{
  item_type: LibraryItemType;
  category: string;
  call_number: string;
  title: string;
  creator: string;
  publisher: string;
  publish_place: string;
  year: string;
  language: string;
  subtitles: string;
  disc_count: number | string;
  duration: string;
  catalog_date: string;
  barcode: string;
}>;

export type LibraryAdminBorrowsParams = {
  /** 模糊搜借阅人名字 / 邮箱、书名、编号 */
  q?: string;
  status?: LibraryBorrowStatus;
  user_id?: number;
  item_id?: number;
  page?: number;
  per_page?: number;
};

export type LibraryBorrower = { id: number; firstName: string; email: string };

export type LibraryImportStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "merged"
  | "ignored"
  | "error";

export type LibraryImportRow = {
  sheet: string;
  /** 工作表级别的错误为 null */
  row: number | null;
  call_number: string | null;
  title: string | null;
  status: LibraryImportStatus;
  messages: string[];
};

/** warning 与其他数字有重叠，不要加进总数 */
export type LibraryImportSummary = Record<LibraryImportStatus | "warning", number>;

export type LibraryImportReport = {
  summary: LibraryImportSummary;
  rows: LibraryImportRow[];
};

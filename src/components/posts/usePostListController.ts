"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadAllFiles } from "@/app/ultility/uploadAllFiles";
import { useCameBack } from "@/hooks/useBackNavigation";

// ✅ 使用“最新的帖子 API 类型”
import type {
  CreatePostRequest,
  PostListItemApi,
} from "@/app/types";
import { errorMessage } from "@/app/lib/errors";

type Status = "idle" | "loading" | "succeeded" | "failed";

/** 与 PostModal 对齐的表单类型（本 Hook 内部用） */
import type { CommentPolicy } from "@/app/types/group";
import type { AppDispatch, RootState } from "@/app/features/store";

export type CreatePostForm = {
  title: string;
  description: string;
  content: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
  comment_policy?: CommentPolicy | null;
};

/**
 * FArgs: fetchPosts 的参数类型（例如：{ groupId: number; page?: number; per_page?: number; append?: boolean }）
 * CArgs: createPost 的参数类型（例如：{ groupId: number; body: CreatePostRequest }）
 * DArg : deletePost 的参数类型（通常就是 number）
 */
/** createAsyncThunk 生成的 thunk 动作：dispatch 之后可以 unwrap */
type PostThunkAction = (
  dispatch: AppDispatch,
  getState: () => RootState,
  extra: unknown
) => Promise<unknown> & { unwrap(): Promise<unknown> };

export type UsePostListControllerOptions<
  FArgs = unknown,
  CArgs = unknown,
  DArg = number
> = {
  // 基础
  dispatch: AppDispatch;
  perPage: number;

  // —— 无限滚动：已加载到第几页、一共几页、现在有没有内容（来自页面读取的 store）
  loadedPage: number;
  totalPages: number;
  hasItems: boolean;

  // —— 数据源策略（注入各页面不同的 thunk/参数）
  fetchPosts: (args: FArgs) => PostThunkAction;       // 例如 fetchGroupPosts
  buildFetchArgs: (page: number, append: boolean) => FArgs;// 例如 ({ groupId, page, per_page, append })
  createPost?: (args: CArgs) => PostThunkAction;      // 例如 createPost
  buildCreateArgs?: (body: CreatePostRequest) => CArgs;
  deletePost?: (postId: DArg) => PostThunkAction;     // 例如 deletePostThunk

  // —— 权限 & UI 注入
  canEdit: (p: PostListItemApi) => boolean;
  canDelete: (p: PostListItemApi) => boolean;

  // —— 外部状态（用于“首次加载骨架”和“更新中提示”的判定）
  postsStatus: Status;

  /** false = 先不请求帖子（例如还不知道能不能看，或 request 组的非成员）；默认 true */
  enabled?: boolean;
};

export function usePostListController<
  FArgs = unknown,
  CArgs = unknown,
  DArg = number
>(opts: UsePostListControllerOptions<FArgs, CArgs, DArg>) {
  const {
    dispatch,
    loadedPage,
    totalPages,
    hasItems,
    fetchPosts,
    buildFetchArgs,
    createPost,
    buildCreateArgs,
    deletePost,
    canEdit,
    canDelete,
    postsStatus,
    enabled = true,
  } = opts;

  const router = useRouter();

  const [uploading, setUploading] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0); // 0~100（多文件平均）

  // —— 选择模式
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const toggleSelectMode = useCallback(() => {
    setSelectedIds(new Set());
    setSelectMode((v) => !v);
  }, []);
  const toggleSelect = useCallback((postId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  // —— 无限滚动：第 1 页的参数决定“是不是同一个列表”（例如换了小组）
  const firstArgs: FArgs = useMemo(() => buildFetchArgs(1, false), [buildFetchArgs]);
  const key = useMemo(() => JSON.stringify(firstArgs), [firstArgs]);
  const cameBack = useCameBack();
  const firstLoad = useRef(true);

  // 列表变了（或第一次进来）：从第 1 页开始；通过“返回”回来且已有内容就沿用，不重新加载
  useEffect(() => {
    if (!enabled) return;
    const reuse = firstLoad.current && cameBack && hasItems;
    firstLoad.current = false;
    if (reuse) return;
    dispatch(fetchPosts(firstArgs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch, enabled]);

  const loading = postsStatus === "loading";
  const hasMore = loadedPage > 0 && loadedPage < totalPages;
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    dispatch(fetchPosts(buildFetchArgs(loadedPage + 1, true)));
  }, [loading, hasMore, dispatch, fetchPosts, buildFetchArgs, loadedPage]);

  // 第一次加载（还没有内容）显示骨架；往下加载更多时只在底部显示 Loading
  const initialPostsLoading = loading && !hasItems;
  const loadingMore = loading && hasItems;
  const showUpdatingTip = uploading;

  // —— 刷新：重新拿已加载的那几页（新建 / 删除之后），列表不跳回顶部
  const refreshCurrentPage = useCallback(async () => {
    const upto = Math.max(1, loadedPage);
    await dispatch(fetchPosts(buildFetchArgs(1, false)));
    for (let p = 2; p <= upto; p++) {
      await dispatch(fetchPosts(buildFetchArgs(p, true)));
    }
  }, [dispatch, fetchPosts, buildFetchArgs, loadedPage]);

  // —— 新建（可选）
  const onCreatePost = useCallback(
    async (form: CreatePostForm) => {
      if (!createPost || !buildCreateArgs) return;

      let newIds: number[] = [];
      try {
        // —— 上传阶段（有文件才进入）
        if (form.localFiles?.length) {
          setUploading(true);
          setUploadingProgress(0);

          const count = form.localFiles.length;
          const filePercents = Array(count).fill(0);
          const onEachProgress = (index: number, percent: number) => {
            filePercents[index] = percent; // 0~100
            const avg = filePercents.reduce((a, b) => a + b, 0) / count;
            // 上传阶段最多显示 99%，避免“卡 100%”
            setUploadingProgress(Math.min(99, Math.round(avg)));
          };

          const { successIds, failures } = await uploadAllFiles(
            form.localFiles,
            dispatch,
            onEachProgress,
            2 // 小并发更稳
          );

          newIds = successIds;

          if (failures.length) {
            const failedList = failures.map((f) => `• ${f.name}: ${f.error}`).join("\n");
            alert(`Some files failed to upload:\n${failedList}\n\nThe post will be created without these files.`);
            // 若需要“有失败就终止”，此处可 return;
          }

          // ✅ 关键：上传结束后，立刻退出 uploading 状态
          setUploading(false);
          setUploadingProgress(0);
        }

        // —— 保存阶段（无论是否有文件都会走）
        const fileIds = [...(form.fileIds ?? []), ...newIds];
        const body: CreatePostRequest = {
          title: form.title?.trim() ?? "",
          content: form.content ?? "",
          description: form.description ?? "",
          video_urls: form.videos ?? [],
          file_ids: fileIds,
          // 不传 = 跟随小组
          ...(form.comment_policy ? { comment_policy: form.comment_policy } : {}),
        };

        await dispatch(createPost(buildCreateArgs(body))).unwrap();

        // 成功后刷新列表
        refreshCurrentPage();
      } finally {
        // 兜底：若上面因异常提前 return，也确保复位
        setUploading(false);
        setUploadingProgress(0);
      }
    },
    [createPost, buildCreateArgs, dispatch, refreshCurrentPage]
  );



  // —— 单删（可选）
  const onDeleteSingle = useCallback(
    async (postId: number extends DArg ? number : DArg) => {
      if (!deletePost) return;
      try {
        await dispatch(deletePost(postId)).unwrap();
      } catch (e) {
        // 例如 leaders_only 组被拒：后端 403 文案原样展示
        alert(errorMessage(e, "Delete post failed"));
      }
      refreshCurrentPage();
    },
    [deletePost, dispatch, refreshCurrentPage]
  );

  // —— 批量删除
  const onBulkDelete = useCallback(
    async (ids: number[]) => {
      if (!deletePost || ids.length === 0) return;
      await Promise.allSettled(
        // @ts-expect-error 由调用方保证 DArg 与 number 兼容（通常是 number）
        ids.map((id) => dispatch(deletePost(id)).unwrap())
      );
      setSelectMode(false);
      setSelectedIds(new Set());
      refreshCurrentPage();
    },
    [deletePost, dispatch, refreshCurrentPage]
  );

  const goEdit = useCallback((id: number) => {
    router.push(`/posts/${id}?edit=1`);
  }, [router]);

  return {
    // 选择模式
    selectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelect,

    // 加载提示
    initialPostsLoading,
    showUpdatingTip,

    // 无限滚动
    hasMore,
    loadMore,
    loadingMore,
    uploadingPercent: uploading ? uploadingProgress : 0,

    // 动作
    onCreatePost,
    onDeleteSingle,
    onBulkDelete,
    canEdit,
    canDelete,
    goEdit,

    // 手动刷新
    refreshCurrentPage,
  };
}

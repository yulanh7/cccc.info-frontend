"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadAllFiles } from "@/app/ultility";

// ✅ 使用“最新的帖子 API 类型”
import type {
  CreatePostRequest,
  PostListItemApi,
} from "@/app/types";

type Status = "idle" | "loading" | "succeeded" | "failed";

/** 与 PostModal 对齐的表单类型（本 Hook 内部用） */
export type CreatePostForm = {
  title: string;
  description: string;
  content: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
};

/**
 * FArgs: fetchPosts 的参数类型（例如：{ groupId: number; page?: number; per_page?: number; append?: boolean }）
 * CArgs: createPost 的参数类型（例如：{ groupId: number; body: CreatePostRequest }）
 * DArg : deletePost 的参数类型（通常就是 number）
 */
export type UsePostListControllerOptions<
  FArgs = any,
  CArgs = any,
  DArg = number
> = {
  // 基础
  dispatch: any;
  perPage: number;
  currentPage: number;

  // —— 数据源策略（注入各页面不同的 thunk/参数）
  fetchPosts: (args: FArgs) => any;       // 例如 fetchGroupPosts
  buildFetchArgs: (page: number) => FArgs;// 例如 ({ groupId, page, per_page, append: false })
  createPost?: (args: CArgs) => any;      // 例如 createPost
  buildCreateArgs?: (body: CreatePostRequest) => CArgs;
  deletePost?: (postId: DArg) => any;     // 例如 deletePostThunk

  // —— 权限 & UI 注入
  canEdit: (p: PostListItemApi) => boolean;
  canDelete: (p: PostListItemApi) => boolean;

  // —— 外部状态（用于“首次加载骨架”和“更新中提示”的判定）
  postsStatus: Status;
};

export function usePostListController<
  FArgs = any,
  CArgs = any,
  DArg = number
>(opts: UsePostListControllerOptions<FArgs, CArgs, DArg>) {
  const {
    dispatch,
    perPage,
    currentPage,
    fetchPosts,
    buildFetchArgs,
    createPost,
    buildCreateArgs,
    deletePost,
    canEdit,
    canDelete,
    postsStatus,
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
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }, []);

  // —— 计算当前请求参数 & key（函数身份变也不影响，只认参数内容）
  const args: FArgs = useMemo(() => buildFetchArgs(currentPage), [buildFetchArgs, currentPage]);
  const key = useMemo(() => JSON.stringify(args), [args]);

  // —— 首次加载骨架 / 更新提示
  const [fetchStarted, setFetchStarted] = useState(false);
  const [everLoaded, setEverLoaded] = useState(false);
  const lastKeyRef = useRef<string | null>(null);

  // 当 key 变化时（参数真的变了），重置“首次加载”判定
  useEffect(() => {
    if (lastKeyRef.current !== key) {
      setFetchStarted(false);
      setEverLoaded(false);
    }
  }, [key]);

  // 仅当 key 变化时才发起请求；避免因为函数 identity 改变而重复请求
  useEffect(() => {
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    dispatch(fetchPosts(args));
    setFetchStarted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch]);

  useEffect(() => {
    if (fetchStarted && postsStatus !== "loading") setEverLoaded(true);
  }, [fetchStarted, postsStatus]);

  const initialPostsLoading = postsStatus === "loading" && !everLoaded && fetchStarted;
  const showUpdatingTip = (postsStatus === "loading" && everLoaded) || uploading;

  // —— 刷新当前页：立即用当前参数强制拉取（即便 key 未变化）
  const refreshCurrentPage = useCallback(() => {
    dispatch(fetchPosts(args));
  }, [dispatch, args, fetchPosts]);

  // —— 新建（可选）
  const onCreatePost = useCallback(
    async (form: CreatePostForm) => {
      if (!createPost || !buildCreateArgs) return;

      let newIds: number[] = [];
      try {
        // 开始上传：打开“Updating …”提示
        if (form.localFiles?.length) {
          setUploading(true);
          setUploadingProgress(0);

          // 多文件进度：对每个文件的进度做简单平均
          const count = form.localFiles.length;
          const filePercents = Array(count).fill(0);
          const onEachProgress = (index: number, percent: number) => {
            filePercents[index] = percent; // 每个文件 0~100
            const avg = filePercents.reduce((a, b) => a + b, 0) / count;
            setUploadingProgress(Math.round(avg));
          };

          newIds = await uploadAllFiles(form.localFiles, dispatch, onEachProgress);
        }

        const fileIds = [...(form.fileIds ?? []), ...newIds];
        const body: CreatePostRequest = {
          title: form.title?.trim() ?? "",
          content: form.content ?? "",
          description: form.description ?? "",
          video_urls: form.videos ?? [],
          file_ids: fileIds,
        };

        await dispatch(createPost(buildCreateArgs(body))).unwrap();

        // 成功后刷新列表
        refreshCurrentPage();
      } finally {
        // 结束上传：关闭 uploading，但“列表拉取中”的加载仍由 postsStatus 控制
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
      await dispatch(deletePost(postId)).unwrap();
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

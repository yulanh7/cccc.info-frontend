"use client";
import { Suspense } from "react";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import PostModal from "@/components/posts/PostModal";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import {
  CalendarIcon,
  UserGroupIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
  HandThumbUpIcon as HandThumbUpOutline,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";
import { HandThumbUpIcon as HandThumbUpSolid } from "@heroicons/react/24/solid";
import { formatDate } from "@/app/ultility";
import { fetchPostDetail, updatePost, deletePost } from "@/app/features/posts/slice";
import {
  likePost,
  unlikePost,
  setLikeCount,
  setLikedByMe,
  selectLikeCount,
  selectLikedByMe,
} from "@/app/features/posts/likeSlice";
import IconButton from "@/components/ui/IconButton";
import YouTubeList from "@/components/ui/YouTubeList";
import { uploadAllFiles } from "@/app/ultility";
import CommentsSection from "@/components/posts/CommentsSection";
import type { UserProps } from "@/app/types";
import type {
  PostDetailData,
  UpdatePostRequest,
  PostFileApi,
} from "@/app/types";
import { canEditPostDetail } from "@/app/types/post";

// —— 本页内部使用：编辑表单的最小类型（与 PostModal 对接）
type EditForm = {
  title: string;
  content: string;
  description: string;
  videos: string[];
  fileIds: number[];
  localFiles?: File[];
};

// —— 把 PostFileApi 按用途拆分（图片/文档/其他）
const isImageMime = (mime?: string) => !!mime && /^image\//i.test(mime);
const isPdfOrDoc = (mime?: string) =>
  !!mime &&
  /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/i.test(
    mime
  );

function splitFiles(files: PostFileApi[]) {
  const images = files.filter((f) => isImageMime(f.file_type));
  const documents = files.filter((f) => isPdfOrDoc(f.file_type));
  const others = files.filter((f) => !isImageMime(f.file_type) && !isPdfOrDoc(f.file_type));
  return { images, documents, others };
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={<LoadingOverlay show text="Loading post…" />}>
      <PostDetailPageInner />
    </Suspense>
  );
}

function PostDetailPageInner() {
  const { id } = useParams<{ id: string }>();
  const postId = useMemo(() => Number(id), [id]);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [editSaving, setEditSaving] = useState(false);
  const [editUploadingPercent, setEditUploadingPercent] = useState(0);

  const status = useAppSelector((s) => s.posts.status["fetchPostDetail"]);
  const error = useAppSelector((s) => s.posts.error["fetchPostDetail"]);
  const storeCount = useAppSelector(selectLikeCount(postId));
  const storeLiked = useAppSelector(selectLikedByMe(postId));
  const postFromStore = useAppSelector((s) => s.posts.byId[postId] || null) as PostDetailData | null;
  const post: PostDetailData | null = postFromStore;
  const user = useAppSelector((s) => s.auth.user as UserProps | null);
  const canManage = !!(post && canEditPostDetail(post, user));
  const isEdit = searchParams.get("edit") === "1";
  const likeCount = storeCount ?? (post as any)?.like_count ?? 0;
  const liked = Boolean(storeLiked ?? (post as any)?.clicked_like ?? false);
  const inFlightRef = useRef(false);
  const [likeBusy, setLikeBusy] = useState(false);
  // —— 内容折叠
  const [expanded, setExpanded] = useState(false);
  const [maxChars, setMaxChars] = useState(300);

  // —— 图片灯箱
  const { images, documents } = useMemo(
    () => splitFiles(post?.files || []),
    [post?.files]
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // 首次把详情里的初值写入 likes store
  useEffect(() => {
    if (!post) return;
    if (typeof post.like_count === "number") {
      dispatch(setLikeCount({ postId: post.id, like_count: post.like_count }));
    }
    if (typeof (post as any).clicked_like === "boolean") {
      dispatch(setLikedByMe({ postId: post.id, liked: (post as any).clicked_like }));
    }
  }, [post?.id]);

  useEffect(() => {
    if (!Number.isFinite(postId)) return;
    dispatch(fetchPostDetail({ postId }));
  }, [dispatch, postId]);

  // 根据屏幕大小决定折叠长度（<768 走 200）
  useEffect(() => {
    const compute = () => setMaxChars(window.innerWidth < 768 ? 200 : 300);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  const pageLoading = status === "loading" || !mounted;
  const pageError = status === "failed" && error;

  // —— 删除
  const handleDelete = async (id: number) => {
    try {
      await dispatch(deletePost(id)).unwrap();
      history.back();
    } catch (e: any) {
      alert(e?.message || "Delete post failed");
    }
  };

  const handleEditOpen = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("edit", "1");
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const handleEditClose = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("edit");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleEditSave = async (form: EditForm) => {
    if (!post) return;
    try {
      setEditSaving(true);
      setEditUploadingPercent(0);

      // 带进度地上传本地文件
      const uploadedIds = form.localFiles?.length
        ? await (async () => {
          const count = form.localFiles!.length;
          const per = Array(count).fill(0);
          const onEachProgress = (idx: number, percent: number) => {
            per[idx] = percent;                          // 0~100
            const avg = per.reduce((a, b) => a + b, 0) / count;
            setEditUploadingPercent(Math.round(avg));    // 整体平均进度
          };
          return await uploadAllFiles(form.localFiles!, dispatch, onEachProgress);
        })()
        : [];

      const fileIds = [...(form.fileIds ?? []), ...uploadedIds];

      const body: UpdatePostRequest = {
        title: form.title?.trim() ?? "",
        content: form.content ?? "",
        description: form.description ?? "",
        video_urls: form.videos ?? [],
        file_ids: fileIds,
      };

      await dispatch(updatePost({ postId: post.id, body })).unwrap();
      handleEditClose();
    } catch (e: any) {
      alert(e?.message || "Update post failed");
    } finally {
      setEditSaving(false);
      setEditUploadingPercent(0);
    }
  };


  const onToggleLike = async () => {
    if (!post || inFlightRef.current) return;
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;
    const nextCount = prevCount + (prevLiked ? -1 : 1);

    inFlightRef.current = true;
    setLikeBusy(true);
    dispatch(setLikedByMe({ postId: post.id, liked: nextLiked }));
    dispatch(setLikeCount({ postId: post.id, like_count: nextCount }));

    try {
      if (prevLiked) {
        await dispatch(unlikePost(post.id)).unwrap();
      } else {
        await dispatch(likePost(post.id)).unwrap();
      }
      // fulfilled 时我们已经在 groupDetail/posts slice 覆盖了 props 源
    } catch (err: any) {
      // 回滚 + 显示后端字符串
      dispatch(setLikedByMe({ postId: post.id, liked: prevLiked }));
      dispatch(setLikeCount({ postId: post.id, like_count: prevCount }));
      alert(typeof err === "string" ? err : err?.message || (prevLiked ? "Unlike failed" : "Like failed"));
    } finally {
      inFlightRef.current = false;
      setLikeBusy(false);
    }
  };

  // —— content 折叠/展开
  const content = post?.content ?? "";
  const isLong = content.length > maxChars;
  const shown = expanded || !isLong ? content : content.slice(0, maxChars);

  // —— 灯箱控制
  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImg = useCallback(() => {
    setLightboxIdx((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const nextImg = useCallback(() => {
    setLightboxIdx((i) => (i + 1) % images.length);
  }, [images.length]);

  // 键盘左右/Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") prevImg();
      else if (e.key === "ArrowRight") nextImg();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prevImg, nextImg]);

  // 触摸滑动
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    // 阈值 40px
    if (dx > 40) prevImg();
    if (dx < -40) nextImg();
    touchStartX.current = null;
  };

  // YouTube 需要 string[] 的视频链接
  const videoUrls = useMemo(
    () => (post?.videos ?? []).map((v) => v.url).filter(Boolean),
    [post?.videos]
  );

  return (
    <>
      <LoadingOverlay show={pageLoading} text="Loading post…" />

      {pageError && <div className="text-red-600 mt-20">Failed to load post: {String(pageError)}</div>}
      {!pageLoading && post && (
        <>
          <CustomHeader
            item={{ id: post.id, author: post.author?.first_name }}
            showEdit={canManage}
            showDelete={canManage}
            onDelete={() => handleDelete(post.id)}
            onEdit={handleEditOpen}
            showAdd={false}
            pageTitle={post.title}
          />
          {/* 顶部横幅：视频优先，否则背景图 */}
          <div className="container mx-auto px-4 mt-1">
            <div>
              {videoUrls.length > 0 ? (
                <YouTubeList
                  videos={videoUrls}
                  iframeClassName="w-full h-[200px] md:h-[400px] rounded-sm"
                />
              ) : (
                <div className="w-full min-h-20 md:min-h-30 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center">
                  <h2 className="text-dark-gray text-xl md:text-5xl font-'Apple Color Emoji' font-semibold text-center px-4">
                    {post.title}
                  </h2>
                </div>
              )}
            </div>


            <div className="flex items-center justify-between gap-2 mt-3">
              <h1 className="text-2xl mb-2">{post.title}</h1>

              <div className="hidden md:flex items-center gap-2">
                {/* 互动条：点赞 + 评论数 */}
                <button
                  onClick={onToggleLike}
                  disabled={likeBusy}
                  aria-pressed={liked}
                  aria-label={liked ? "Unlike" : "Like"}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sm shadow-sm
                 hover:bg-gray-50 disabled:opacity-60"
                  title={liked ? "Unlike" : "Like"}
                >
                  {liked ? (
                    <HandThumbUpSolid className="h-4 w-4 text-red-500" />
                  ) : (
                    <HandThumbUpOutline className="h-4 w-4 text-dark-gray" />
                  )}
                  <span className="text-dark-gray">{likeCount}</span>
                </button>

                {/* 评论数（未来接入真实数值：post.comment_count 或从你的评论 slice 取） */}
                {/* <div
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-sm shadow-sm"
                title="Comments"
              >
                <ChatBubbleLeftIcon className="h-4 w-4 text-dark-gray" />
                <span className="text-dark-gray">{(post as any)?.comment_count ?? 0}</span>
              </div> */}

                {/* 分隔线 + 管理操作（仅作者/管理员可见） */}
                {canManage && (
                  <div className="mx-1 h-5 w-px bg-border" aria-hidden />
                )}
                {canManage && (
                  <div className="flex items-center gap-2">
                    <IconButton
                      className="text-white"
                      title="Edit post"
                      aria-label="Edit post"
                      variant="outline"
                      tone="brand"
                      size="md"
                      onClick={handleEditOpen}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </IconButton>

                    <IconButton
                      title="Delete post"
                      aria-label="Delete post"
                      variant="outline"
                      tone="danger"
                      size="md"
                      onClick={() => handleDelete(post.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </IconButton>
                  </div>
                )}
              </div>
            </div>


            <div className="flex flex-wrap gap-3 mb-3">
              <span className="hidden md:inline-flex items-center gap-1 text-xs">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-dark-green/10 text-dark-green font-semibold">
                  {(post?.author?.first_name?.[0] || "?").toUpperCase()}
                </span>
                <span className="text-sm">
                  {post?.author?.first_name}
                </span>
              </span>
              <div className="text-xs  md:text-sm flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1 text-dark-green" />
                {post.group.name}
              </div>
              <div className="text-xs md:text-sm flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {formatDate(post.created_at)}
              </div>
            </div>

            {/* 正文（纯文本 + 保留换行，点击文字本身可收起） */}
            <div
              className="text-gray whitespace-pre-wrap cursor-pointer mb-5"
              onClick={() => {
                if (expanded) setExpanded(false);
              }}
            >
              {shown}
              {isLong && !expanded && (
                <>
                  {"… "}
                  <button
                    className="text-dark-green underline text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(true);
                    }}
                  >
                    See more
                  </button>
                </>
              )}
            </div>

            {/* 图片缩略图 */}
            {images.length > 0 && (
              <div className="mb-4">
                <ul className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {images.map((img, idx) => (
                    <li
                      key={`${img.id ?? img.url}-${idx}`}
                      className="relative cursor-zoom-in aspect-square"
                      onClick={() => openLightbox(idx)}
                      title="Click to preview"
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full h-full object-cover rounded-sm border border-border"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 底部文档 */}
            {documents.length > 0 && (
              <div className="mt-4 shadow-md p-4">
                <h3 className="text-lg font-semibold text-dark-gray mb-2">「资料」</h3>
                <ul className="space-y-2">
                  {documents.map((file, index) => (
                    <li key={`${file.id ?? file.url}-${index}`} className="flex items-center space-x-4">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex text-sm items-center text-dark-green hover:text-green underline"
                        title={file.filename}
                      >
                        <EyeIcon className="h-5 w-5 mr-2" />
                        {file.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 评论区 */}
            <CommentsSection
              postId={post.id}
              postAuthorId={post.author.id}      // 你 PostDetailData 里 author: { id, first_name }
              currentUserId={user?.id ?? null}
            />


            {/* 编辑弹窗（传入与 API 对齐的数据） */}
            {isEdit && post && (
              <PostModal
                item={{
                  title: post.title,
                  description: post.description,
                  content: post.content,          // ← 用 content
                  videos: videoUrls,              // ← string[]
                  fileIds: (post.files || [])
                    .map((f) => f.id)
                    .filter((id): id is number => typeof id === "number"),
                }}
                isNew={false}
                onSave={handleEditSave as any}    // 你的 PostModal 若有专门类型，可调整此处
                onClose={handleEditClose}
                existingFiles={post.files as any}
                saving={editSaving}
                uploadingPercent={editUploadingPercent}
              />
            )}

            {/* 图片灯箱 */}
            {lightboxOpen && images.length > 0 && (
              <div
                className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center"
                onClick={closeLightbox}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <button
                  className="absolute top-4 right-4 text-white p-1 rounded hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                  aria-label="Close preview"
                  title="Close"
                >
                  <XMarkIcon className="h-7 w-7" />
                </button>

                <button
                  className="absolute left-3 md:left-6 text-white p-2 rounded hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); prevImg(); }}
                  aria-label="Previous image"
                  title="Previous"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>

                <img
                  src={images[lightboxIdx].url}
                  alt={images[lightboxIdx].filename}
                  className="max-h-[85vh] max-w-[90vw] object-contain rounded"
                  onClick={(e) => e.stopPropagation()}
                />

                <button
                  className="absolute right-3 md:right-6 text-white p-2 rounded hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); nextImg(); }}
                  aria-label="Next image"
                  title="Next"
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>

                <div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lightboxIdx + 1}/{images.length}
                </div>
              </div>
            )}
          </div>
        </>

      )}

    </>
  );
}

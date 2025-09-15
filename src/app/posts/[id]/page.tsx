"use client";
import { Suspense } from "react";
import Link from 'next/link';
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import PostModal from "@/components/posts/PostModal";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import {
  CalendarIcon,
  UsersIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ImageLightboxGrid from "@/components/ui/ImageLightboxGrid";
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
import { uploadAllFiles } from "@/app/ultility/uploadAllFiles";
import CommentsSection from "@/components/posts/CommentsSection";
import type { UserProps } from "@/app/types";
import type {
  PostDetailData,
  UpdatePostRequest,
  PostFileApi,
} from "@/app/types";
import { isPostAuthor, isGroupCreatorOfPost } from "@/app/types";
import ConfirmModal from "@/components/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import CollapsibleText from "@/components/ui/CollapsibleText";
import SubscribeToggleButton from "@/components/groups/SubscribeToggleButton";


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


  const confirmOwnDelete = useConfirm<number>("Delete this post?");
  const confirmOtherDelete = useConfirm<number>(
    "This post was created by someone else. You are a group owner and have permission to delete it. Delete anyway?"
  );

  const askDeleteWithContext = (p: PostDetailData | null) => {
    if (!p) return;
    if (isPostAuthor(p, user)) {
      confirmOwnDelete.ask(p.id);
    } else if (isGroupCreatorOfPost(p, user)) {
      confirmOtherDelete.ask(p.id);
    } else {
      // 正常不会走到这里（按钮本就不可见），留作兜底
    }
  };

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

      let uploadedIds: number[] = [];

      if (form.localFiles?.length) {
        const count = form.localFiles.length;
        const per = Array(count).fill(0);

        const { successIds, failures } = await uploadAllFiles(
          form.localFiles,
          dispatch,
          (idx, percent) => {
            // ✅ 进度取平均，但最多显示 99%
            per[idx] = percent;
            const avg = per.reduce((a, b) => a + b, 0) / count;
            setEditUploadingPercent(Math.min(99, Math.round(avg)));
          },
          2 // 小并发
        );

        uploadedIds = successIds;

        if (failures.length) {
          const failedList = failures.map(f => `• ${f.name}: ${f.error}`).join("\n");
          alert(`Some files failed to upload:\n${failedList}\n\nThe post will be saved without these files.`);
        }

        // ✅ 上传完立刻退出“Uploading%”状态，让按钮回到 “Saving…”
        setEditUploadingPercent(0);
        // 可选：为了丝滑一点，加入极短缓冲
        // await new Promise(r => setTimeout(r, 120));
      }

      const fileIds = [...(form.fileIds ?? []), ...uploadedIds];
      const body: UpdatePostRequest = {
        title: form.title?.trim() ?? "",
        content: form.content ?? "",
        description: form.description ?? "",
        video_urls: form.videos ?? [],
        file_ids: fileIds,
      };

      await dispatch(updatePost({ postId: post.id, body })).unwrap();

      // ✅ 到这里才算彻底成功：关闭编辑
      handleEditClose();

    } catch (e: any) {
      alert(e?.message || "Update post failed");
      // ❌ 失败则不关闭，保持在编辑态
      throw e; // 抛给 PostModal 的 try/catch，避免“保存并关闭”把弹窗关掉
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
            item={{ id: post.id, author: post.author?.firstName }}
            showEdit={!!(post && isPostAuthor(post, user))}
            showDelete={!!(post && (isPostAuthor(post, user) || isGroupCreatorOfPost(post, user)))}
            onDelete={() => askDeleteWithContext(post)}
            onEdit={handleEditOpen}
            showAdd={false}
            pageTitle={post.title}
          />
          {/* 顶部横幅：视频优先，否则背景图 */}
          <div className="container mx-auto ">

            {videoUrls.length > 0 ? (
              <YouTubeList
                videos={videoUrls}
                iframeClassName="w-full h-[200px] md:h-[400px] rounded-sm"
              />
            ) : (
              <div className="flex w-full px-2 py-4 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm items-center justify-center">
                <h2 className="text-dark-gray text-xl md:text-2xl font-'Apple Color Emoji' font-semibold text-center px-4">
                  {post.title}
                </h2>
              </div>
            )}


            <div className="mx-auto px-4 mt-1">
              <div className="flex items-center justify-between gap-2 mt-3 ">
                {videoUrls.length > 0 &&

                  <h1 className={`${videoUrls.length > 0 ? "inline" : "hidden"} md:inline text-2xl`}>{post.title}</h1>
                }

                {!!post && (
                  <div className="hidden md:flex items-center gap-2">
                    {/* 编辑：只能帖子作者 */}
                    {isPostAuthor(post, user) && (
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
                    )}

                    {/* 删除：帖子作者 或 小组创建者 */}
                    {(isPostAuthor(post, user) || isGroupCreatorOfPost(post, user)) && (
                      <IconButton
                        title="Delete post"
                        aria-label="Delete post"
                        variant="outline"
                        tone="danger"
                        size="md"
                        onClick={() => askDeleteWithContext(post)}   // ← 修改这里
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    )}
                  </div>
                )}

              </div>

              <div className="text-xs md:text-sm flex items-center mb-2">
                <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {formatDate(post.created_at)}
              </div>

              <div className="inline-flex items-center flex-wrap gap-3 mb-2 mt-2 w-fit ">

                <Link
                  href={`/groups/${post.group?.id}`}
                >
                  <div className="text-xs  md:text-sm flex items-center hover:underline">
                    <UsersIcon className="h-4 w-4 mr-1 text-dark-green" />
                    {post.group.name}
                  </div>
                </Link>
                {post.group?.creator === user?.id ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-dark-green text-dark-green">
                    Group Owner
                  </span>
                ) : (

                  <SubscribeToggleButton
                    groupId={post.group.id}
                    mode="follow"
                    isMemberHint={post.group.is_member}
                    confirmOnLeave
                    className="ml-2"
                  />
                )}
              </div>


              {/* 正文（纯文本 + 保留换行，点击文字本身可收起） */}
              <CollapsibleText
                text={post.content ?? ""}
                mobileChars={200}
                desktopChars={300}
                className="text-gray mb-5"
              />
              <div className="hidden md:inline-flex items-center gap-1 text-xs mb-4">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-dark-green/10 text-dark-green font-semibold">
                  {(post.author?.firstName?.[0] || "?").toUpperCase()}
                </span>
                <span className="text-sm">
                  {post.author?.firstName}
                </span>
              </div>

              {/* 图片缩略图 */}
              {images.length > 0 && (
                <div className="mb-4">
                  <ImageLightboxGrid
                    items={images.map((img) => ({
                      id: img.id,
                      url: img.url,
                      filename: img.filename,
                      alt: img.filename,
                    }))}
                  />
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
                postAuthorId={post.author.id}
                currentUserId={user?.id ?? null}
                likeCount={likeCount}
                liked={liked}
                likeBusy={likeBusy}
                onToggleLike={onToggleLike}
              />

            </div>
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


          </div>
        </>

      )}

      {/* 自己帖子：确认删除 */}
      <ConfirmModal
        isOpen={confirmOwnDelete.open}
        message={confirmOwnDelete.message}
        onCancel={confirmOwnDelete.cancel}
        onConfirm={confirmOwnDelete.confirm(async (id) => {
          if (!id) return;
          await handleDelete(id);
        })}
      />

      {/* 别人帖子但你是组长：权限说明 + 确认 */}
      <ConfirmModal
        isOpen={confirmOtherDelete.open}
        message={confirmOtherDelete.message}
        onCancel={confirmOtherDelete.cancel}
        onConfirm={confirmOtherDelete.confirm(async (id) => {
          if (!id) return;
          await handleDelete(id);
        })}
      />

    </>
  );
}

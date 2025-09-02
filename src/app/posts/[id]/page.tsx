"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import PostModal from "@/components/posts/PostModal";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import { CalendarIcon, UserGroupIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/app/ultility";
import { fetchPostDetail, updatePost, deletePost } from "@/app/features/posts/slice";
import type { CreatePostFormModel, PostDetailUi } from "@/app/types/post";
import { toUpdateRequest } from "@/app/types/post";
import { splitFiles } from "@/app/types/post";
// import PostInfoBar from '@/components/posts/PostInfoBar';
import { canEditPost } from "@/app/types/post";
import { uploadAllFiles } from "@/app/ultility";
import IconButton from "@/components/ui/IconButton";
import YouTubeList from "@/components/ui/YouTubeList";


export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = useMemo(() => Number(id), [id]);

  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.posts.status["fetchPostDetail"]);
  const error = useAppSelector((s) => s.posts.error["fetchPostDetail"]);
  const postFromStore = useAppSelector((s) => s.posts.byId[postId] || null);
  const post: PostDetailUi | null = postFromStore;
  const user = useAppSelector((s) => s.auth.user);
  const canManage = !!(post && canEditPost(post, user));

  // 编辑弹窗
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // —— 内容折叠
  const [expanded, setExpanded] = useState(false);
  const [maxChars, setMaxChars] = useState(300);

  // —— 图片灯箱
  const { images, documents } = useMemo(() => splitFiles(post?.files || []), [post?.files]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);



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

  const pageLoading = status === "loading" || !post;
  const pageError = status === "failed" && error;

  // —— 删除 & 编辑（最小实现）
  const handleDelete = async (id: number) => {
    try {
      await dispatch(deletePost(id)).unwrap();
      history.back();
    } catch (e: any) {
      alert(e?.message || "Delete post failed");
    }
  };

  const handleEditOpen = () => setIsPostModalOpen(true);
  const handleEditSave = async (form: CreatePostFormModel) => {
    if (!post) return;
    try {
      const uploadedIds = form.localFiles?.length
        ? await uploadAllFiles(form.localFiles, dispatch)
        : [];
      const fileIds = [...(form.fileIds ?? []), ...uploadedIds];
      const body = toUpdateRequest({
        title: form.title?.trim() ?? "",
        contentText: form.contentText ?? "",
        description: form.description ?? "",
        videos: form.videos ?? [],
        fileIds,
      });
      await dispatch(
        updatePost({
          postId: post.id,
          body
        })
      ).unwrap();
      setIsPostModalOpen(false);
    } catch (e: any) {
      alert(e?.message || "Update post failed");
    }
  };

  // —— contentText 折叠/展开
  const content = post?.contentText ?? "";
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


  return (
    <div className="container mx-auto px-4">
      <LoadingOverlay show={pageLoading} text="Loading post…" />
      {pageError && <div className="text-red-600 mt-20">Failed to load post: {String(pageError)}</div>}
      {!pageLoading && post && (
        <>
          {/* 顶部横幅：视频优先，否则背景图 */}
          <div>
            {post.videos && post.videos.length > 0 ? (
              <YouTubeList
                videos={post.videos}
                iframeClassName="w-full h-[200px] md:h-[400px] rounded-sm"
              />
            ) : (
              <div className="w-full min-h-30 md:min-h-60 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center">
                <h2 className="text-dark-gray text-xl md:text-5xl font-'Apple Color Emoji' font-semibold text-center px-4">
                  {post.title}
                </h2>
              </div>
            )}
          </div>
          <CustomHeader
            item={{ id: post.id, author: post.author?.firstName }}
            showEdit={true}
            showDelete={true}
            onDelete={() => handleDelete(post.id)}
            onEdit={handleEditOpen}
            showAdd={false}
            pageTitle={post.title}
          />

          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl mb-2">{post.title}</h1>
            {canManage && (
              <div className="hidden md:flex items-center gap-2">
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
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="text-xs text-dark-green md:text-sm flex items-center">
              <UserGroupIcon className="h-4 w-4 mr-1 text-dark-green" />
              {post.group}
            </div>
            <div className="text-xs text-dark-green md:text-sm flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {formatDate(post.date)}
            </div>
          </div>


          {/* 正文（纯文本 + 保留换行） */}
          {/* 正文（纯文本 + 保留换行，点击文字本身可收起） */}
          <div
            className="text-gray whitespace-pre-wrap cursor-pointer mb-5"
            onClick={() => {
              if (expanded) {
                setExpanded(false); // 展开状态 -> 点击正文收起
              }
            }}
          >
            {shown}
            {isLong && !expanded && (
              <>
                {"… "}
                <button
                  className="text-dark-green underline text-sm"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止冒泡，避免触发上面的收起逻辑
                    setExpanded(true);
                  }}
                >
                  See more
                </button>
              </>
            )}
          </div>

          {/* 顶部图片缩略图 */}
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
                      alt={img.name}
                      className="w-full h-full object-cover rounded-sm border border-border"
                    />
                  </li>

                ))}
              </ul>
            </div>
          )}

          {/* ✅ 底部文档区域（「課件」） */}
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
                      title={file.name}
                    >
                      <EyeIcon className="h-5 w-5 mr-2" />
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 编辑弹窗（把现有文件传进 PostModal） */}
          {isPostModalOpen && (
            <PostModal
              item={{
                title: post.title,
                description: post.description,
                contentText: post.contentText ?? "",
                videos: post.videos,
                fileIds: (post.files || [])
                  .map((f) => f.id)
                  .filter((id): id is number => typeof id === "number"),
              }}
              isNew={false}
              onSave={handleEditSave}
              onClose={() => setIsPostModalOpen(false)}
              existingFiles={post.files}
            />
          )}

          {/* ✅ 图片灯箱（左右切换 + 触摸滑动） */}
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
                alt={images[lightboxIdx].name}
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
        </>
      )}
    </div>
  );
}

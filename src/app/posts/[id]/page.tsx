"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import CustomHeader from "@/components/layout/CustomHeader";
import PostModal from "@/components/posts/PostModal";
import LoadingOverlay from "@/components/feedback/LoadingOverLay";
import { CalendarIcon, UserGroupIcon, EyeIcon } from "@heroicons/react/24/outline";

import { fetchPostDetail, updatePost, deletePost } from "@/app/features/posts/slice";
import type { CreatePostFormModel, PostDetailUi } from "@/app/types/post";
import { splitFiles } from "@/app/types/post";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = useMemo(() => Number(id), [id]);

  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.posts.status["fetchPostDetail"]);
  const error = useAppSelector((s) => s.posts.error["fetchPostDetail"]);
  const postFromStore = useAppSelector((s) => s.posts.byId[postId] || null);
  const post: PostDetailUi | null = postFromStore;

  // 编辑弹窗
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(postId)) return;
    dispatch(fetchPostDetail({ postId }));
  }, [dispatch, postId]);

  const pageLoading = status === "loading" || !post;
  const pageError = status === "failed" && error;

  // 顶部图片与底部文档分区
  const { images, documents } = useMemo(() => splitFiles(post?.files || []), [post?.files]);

  // —— 删除 & 编辑（这里给出最小实现；你可以接入 confirm）
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
      await dispatch(
        updatePost({
          postId: post.id,
          body: {
            title: form.title,
            content: form.contentText, // ✅ 纯文本，后端字段仍叫 content
            description: form.description,
            videos: form.videos,
            file_ids: form.fileIds,
          },
        })
      ).unwrap();
      setIsPostModalOpen(false);
    } catch (e: any) {
      alert(e?.message || "Update post failed");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <LoadingOverlay show={pageLoading} text="Loading post…" />
      {pageError && (
        <div className="text-red-600 mt-20">Failed to load post: {String(pageError)}</div>
      )}
      {!pageLoading && post && (
        <>
          {/* 顶部横幅：视频优先，否则背景图 */}
          <div className="aspect-w-16 aspect-h-9 mb-4 mt-16">
            {post.videos && post.videos.length > 0 ? (
              <iframe
                src={post.videos[0]}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-[200px] md:h-[400px] rounded-sm"
              />
            ) : (
              <div className="w-full min-h-30 md:min-h-60 bg-[url('/images/bg-for-homepage.png')] bg-cover bg-center rounded-t-xs md:rounded-t-sm flex items-center justify-center">
                <h2 className="text-dark-gray text-xl md:text-5xl font-'Apple Color Emoji' font-semibold text-center px-4">
                  {post.title}
                </h2>
              </div>
            )}
          </div>

          {/* ✅ 顶部图片区域（按你的要求“图片在页面上方”） */}
          {images.length > 0 && (
            <div className="mb-4">
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <li key={`${img.id ?? img.url}-${idx}`} className="border border-border rounded-sm p-1">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-40 md:h-56 object-cover rounded-xs"
                    />
                    <div className="mt-1 text-xs truncate text-dark-gray">{img.name}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <CustomHeader
            item={{ id: post.id, author: post.author?.firstName }}
            showEdit={true}
            showDelete={true}
            onDelete={() => handleDelete(post.id)}
            onEdit={handleEditOpen}
            showAdd={false}
            pageTitle={post.title}
          />

          <h1 className="text-2xl mb-2">{post.title}</h1>
          <div className="text-xs text-dark-green md:text-sm mb-1 flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-1 text-dark-green" />
            {post.group}
          </div>
          <div className="text-xs text-dark-green md:text-sm mb-4 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1 text-dark-green" /> {post.date}
          </div>

          {/* 正文（纯文本 + 保留换行） */}
          <p className="text-gray whitespace-pre-wrap">{post.contentText}</p>

          {/* ✅ 底部文档区域（「課件」） */}
          {documents.length > 0 && (
            <div className="mt-4 shadow-md p-4">
              <h3 className="text-lg font-semibold text-dark-gray mb-2">「課件」</h3>
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

          {/* 编辑弹窗（可把现有文件传给 PostModal 的 existingFiles） */}
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
        </>
      )}
    </div>
  );
}

"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import type { PostListItemApi } from "@/app/types";
import Link from 'next/link';
import {
  HandThumbUpIcon as HandThumbUpOutline,
  CheckIcon, TrashIcon, PencilSquareIcon, UsersIcon
} from "@heroicons/react/24/outline";
import IconButton from "@/components/ui/IconButton";
import { HandThumbUpIcon as HandThumbUpSolid, PlayIcon, } from "@heroicons/react/24/solid";
import { ellipsize } from '@/app/ultility';
import { getYouTubeThumbnail } from '@/app/ultility';
import { useAppDispatch, useAppSelector } from "@/app/features/hooks";
import { likePost, unlikePost, setLikeCount, setLikedByMe, selectLikeCount, selectLikedByMe } from "@/app/features/posts/likeSlice";

type Props = {
  post: PostListItemApi;
  formatDate: (timestamp: string, showTime?: boolean) => string;
  showEnterArrow?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  showDelete?: boolean;
  onEditSingle?: (id: number) => void;
  onDeleteSingle?: (id: number) => void;
};

const BG_URLS = ["/images/bg-card-2.jpg", "/images/bg-for-homepage.png"];

export default function PostCardSimple({
  post,
  formatDate,
  showEnterArrow = true,
  canEdit = false,
  canDelete = false,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  showDelete = false,
  onEditSingle,
  onDeleteSingle,
}: Props) {

  const dispatch = useAppDispatch();
  const { id, title, author, summary, videos, like_count } = post;

  // like 数优先取全局（被点赞后会更新），否则回退列表原始值
  const storeCount = useAppSelector(selectLikeCount(id));
  const count = (storeCount ?? like_count ?? 0);

  // 是否已点赞：优先取全局（被点赞后会更新），否则回退接口字段（如果后端给了）
  const storeLiked = useAppSelector(selectLikedByMe(id));
  const initialLiked = (post as any)?.clicked_like as boolean | undefined;
  const liked = Boolean(storeLiked ?? initialLiked ?? false);

  const inFlightRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const bgUrl = useMemo(
    () => BG_URLS[Math.abs(post.id) % BG_URLS.length],
    [post.id]
  );
  const thumbnail = videos && videos[0] ? getYouTubeThumbnail(videos[0], 'hqdefault') : null;

  const withFilesPrefix = (u: string) =>
    /^https?:\/\//i.test(u) || u.startsWith('/files/')
      ? u
      : `/files/${u.replace(/^\/+/, '')}`;

  const isImageUrl = (url: string) =>
    typeof url === 'string' && /\.(png|jpe?g|gif|bmp|webp)(\?|#|$)/i.test(url);

  const imageUrl = useMemo(() => {
    const candidates = (post.files ?? [])
      .map((f: any) => (typeof f === 'string' ? f : f?.url))
      .filter((u: unknown): u is string => typeof u === 'string');

    const raw = candidates.find(isImageUrl);
    return raw ? withFilesPrefix(raw) : null;
  }, [post.files]);


  useEffect(() => {
    if (post.like_count !== undefined) {
      dispatch(setLikeCount({ postId: post.id, like_count: post.like_count }));
    }
    const initialLiked = (post as any)?.clicked_like;
    if (typeof initialLiked === "boolean") {
      dispatch(setLikedByMe({ postId: post.id, liked: initialLiked }));
    }
  }, [post.id]);

  // —— 点赞/取消点赞（乐观更新 + 阻止跳转）
  const onToggleLike: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inFlightRef.current) return;

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;
    const nextCount = prevCount + (prevLiked ? -1 : 1);

    // 乐观更新 + 加锁
    inFlightRef.current = true;
    setBusy(true);
    dispatch(setLikedByMe({ postId: post.id, liked: nextLiked }));
    dispatch(setLikeCount({ postId: post.id, like_count: nextCount }));

    try {
      if (prevLiked) {
        await dispatch(unlikePost(post.id)).unwrap();
      } else {
        await dispatch(likePost(post.id)).unwrap();
      }
    } catch (err: any) {
      // 回滚 + 正确显示后端 message
      dispatch(setLikedByMe({ postId: post.id, liked: prevLiked }));
      dispatch(setLikeCount({ postId: post.id, like_count: prevCount }));

      const msg = typeof err === "string" ? err : err?.message || (prevLiked ? "Unlike failed" : "Like failed");
      alert(msg);
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };


  return (
    <div className="card relative group cursor-pointer border border-border">
      <div className="aspect-w-16 aspect-h-9 mb-1">
        {thumbnail ? (
          // 正常显示缩略图
          <div className="relative">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-25 md:h-30 object-cover rounded-t-xs md:rounded-t-sm"
            />
            <div className="absolute top-3 left-3 pointer-events-none">
              <div className="rounded-full bg-[rgba(0,0,0,0.35)] p-2">
                <PlayIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        ) : videos && videos.length > 0 ? (
          // 这里提示链接错误
          <div className="flex items-center justify-center w-full h-25 md:h-30 bg-gray-100 text-red-500 rounded-t-xs md:rounded-t-sm">
            Unable to parse this YouTube link
          </div>
        ) : imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto min-h-20 max-h-27 md:min-h-25 md:max-h-32 object-cover rounded-t-xs md:rounded-t-sm"
            />
          </div>
        ) : (
          <div
            className="w-full pt-7 pb-4 px-3 min-h-20 bg-cover bg-center rounded-t-xs md:rounded-t-sm items-center justify-center"
            style={{ backgroundImage: `url(${bgUrl})` }}
          >
            <h2 className="text-dark-gray font-semibold text-center px-4">
              {ellipsize(title, 90)}
            </h2>
          </div>
        )}
      </div>
      <div className='px-2 pb-2'>
        <div className="flex justify-end">
          {canDelete && (selectMode || showDelete) && (
            <>
              <div className="absolute right-2 top-2 z-1 pointer-events-none">
                <div
                  className="pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectMode && (
                    <IconButton
                      title={isSelected ? "Unselect" : "Select"}
                      aria-label="Select post"
                      size="sm"
                      variant={isSelected ? "primary" : "outline"}
                      tone={isSelected ? "default" : "brand"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSelect?.(post.id);
                      }}
                      active={isSelected}
                      className="rounded-sm"
                    >
                      {isSelected && <CheckIcon className="h-4 w-4" />}
                    </IconButton>
                  )}
                </div>
              </div>
              <div className="z-1 pointer-events-none">
                <div
                  className="pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!selectMode && showDelete && (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <IconButton
                          title="Edit post"
                          aria-label="Edit post"
                          rounded="full"
                          variant="ghost"
                          tone="brand"
                          size="xs"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditSingle?.(post.id);
                          }}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </IconButton>
                      )}

                      <IconButton
                        title="Delete post"
                        aria-label="Delete post"
                        rounded="full"
                        variant="ghost"
                        tone="danger"
                        size="xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteSingle?.(post.id);
                        }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
        <h2 className="flex-1 font-semibold text-sm text-dark-gray leading-[1.3] md:leading-[1.3] my-2">
          {ellipsize(title, 40)}
        </h2>

        {/* {summary && (
          <p className="text-gray text-sm text-text line-clamp-3 leading-[1.1] md:leading-[1.2] whitespace-pre-line mt-2">
            {ellipsize(summary, 160)}
          </p>
        )} */}
        {post.group?.id ? (
          <Link
            href={`/groups/${post.group.id}`}
            className="inline-flex items-center gap-1 hover:underline text-xs text-gray-500 leading-none" onClick={(e) => e.stopPropagation()}
            aria-label={`Open group ${post.group?.name ?? ""}`}
            title={post.group?.name ?? ""}
            prefetch={false} // 列表很多时可关预取，减少网络压力；需要的话可以删掉
          >
            <UsersIcon className="h-4 w-4 text-dark-green" />
            <span>
              {ellipsize(post.group?.name, 25)}
            </span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <UsersIcon className="h-4 w-4" />
            <span>Ungrouped</span>
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-gray">
          <span className="flex-1 inline-flex items-center gap-1 text-xs m-0">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-dark-green/10 text-dark-green font-semibold">
              {(author.firstName?.[0] || "?").toUpperCase()}
            </span>
            <span className="text-[9px] leading-none">
              {ellipsize(author.firstName, 10)}
            </span>
          </span>

          <div className="ml-1">
            <button
              onClick={onToggleLike}
              disabled={busy}
              aria-pressed={liked}
              aria-label={liked ? "Unlike" : "Like"}
              className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow
                 focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-60"
            >
              {liked ? (
                <HandThumbUpSolid className="h-4 w-4 text-red-500" />
              ) : (
                <HandThumbUpOutline className="h-4 w-4 text-dark-gray" />
              )}
              <span className="text-xs text-dark-gray">{count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

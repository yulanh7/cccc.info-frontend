"use client";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { PostListItemApi } from "@/app/types";
import { useRouter } from "next/navigation";
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
  canEdit?: boolean;
  canDelete?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  showDelete?: boolean;
  onEditSingle?: (id: number) => void;
  onDeleteSingle?: (id: number) => void;
  onOpenPost?: () => void;
};

const BG_URLS = [
  "/images/bg-card-1.jpg",
  "/images/bg-card-2.jpg",
  "/images/bg-card-3.jpg",
  "/images/bg-card-4.jpg",
  "/images/bg-card-5.jpg",
  // "/images/bg-card-6.jpg",
];

export default function PostCardSimple({
  post,
  formatDate,
  canEdit = false,
  canDelete = false,
  selectMode = false,
  isSelected = false,
  onToggleSelect,
  showDelete = false,
  onEditSingle,
  onDeleteSingle,
  onOpenPost
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id, title, author, summary, videos, like_count } = post;

  // Redux state selectors
  const storeCount = useAppSelector(selectLikeCount(id));
  const storeLiked = useAppSelector(selectLikedByMe(id));

  // Computed values
  const count = storeCount ?? like_count ?? 0;
  const initialLiked = (post as any)?.clicked_like as boolean | undefined;
  const liked = Boolean(storeLiked ?? initialLiked ?? false);

  const inFlightRef = useRef(false);
  const [isLiking, setIsLiking] = useState(false);

  // Memoized values
  const bgUrl = useMemo(
    () => BG_URLS[Math.abs(id) % BG_URLS.length],
    [id]
  );

  const thumbnail = useMemo(() =>
    videos?.[0] ? getYouTubeThumbnail(videos[0], 'hqdefault') : null,
    [videos]
  );

  const imageUrl = useMemo(() => {
    const withFilesPrefix = (u: string) =>
      /^https?:\/\//i.test(u) || u.startsWith('/files/')
        ? u
        : `/files/${u.replace(/^\/+/, '')}`;

    const isImageUrl = (url: string) =>
      typeof url === 'string' && /\.(png|jpe?g|gif|bmp|webp)(\?|#|$)/i.test(url);

    const candidates = (post.files ?? [])
      .map((f: any) => (typeof f === 'string' ? f : f?.url))
      .filter((u: unknown): u is string => typeof u === 'string');

    const raw = candidates.find(isImageUrl);
    return raw ? withFilesPrefix(raw) : null;
  }, [post.files]);

  // Initialize Redux state from props
  useEffect(() => {
    if (like_count !== undefined) {
      dispatch(setLikeCount({ postId: id, like_count }));
    }
    if (typeof initialLiked === "boolean") {
      dispatch(setLikedByMe({ postId: id, liked: initialLiked }));
    }
  }, [id, like_count, initialLiked, dispatch]);

  // Event handlers
  const handleToggleLike = useCallback<React.MouseEventHandler<HTMLButtonElement>>(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (inFlightRef.current) return;

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;
    const nextCount = prevCount + (prevLiked ? -1 : 1);

    // Optimistic update with lock
    inFlightRef.current = true;
    setIsLiking(true);
    dispatch(setLikedByMe({ postId: id, liked: nextLiked }));
    dispatch(setLikeCount({ postId: id, like_count: nextCount }));

    try {
      if (prevLiked) {
        await dispatch(unlikePost(id)).unwrap();
      } else {
        await dispatch(likePost(id)).unwrap();
      }
    } catch (err: any) {
      // Rollback on error
      dispatch(setLikedByMe({ postId: id, liked: prevLiked }));
      dispatch(setLikeCount({ postId: id, like_count: prevCount }));

      const message = err?.message || (prevLiked ? "Unlike failed" : "Like failed");
      console.error("Like operation failed:", err);
      // Consider using a toast notification instead of alert
      alert(message);
    } finally {
      inFlightRef.current = false;
      setIsLiking(false);
    }
  }, [liked, count, id, dispatch]);

  const handleOpenPost = useCallback(() => {
    if (onOpenPost) {
      onOpenPost();
    } else {
      router.push(`/posts/${id}`);
    }
  }, [onOpenPost, router, id]);

  const handleCardClick = useCallback(() => {
    handleOpenPost();
  }, [handleOpenPost]);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenPost();
    }
  }, [handleOpenPost]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditSingle?.(id);
  }, [onEditSingle, id]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteSingle?.(id);
  }, [onDeleteSingle, id]);

  const handleSelectToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.(id);
  }, [onToggleSelect, id]);

  const handleGroupClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (post.group?.id) {
      router.push(`/groups/${post.group.id}`);
    }
  }, [router, post.group?.id]);

  // Prevent propagation wrapper
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Render helpers
  const renderThumbnail = () => {
    if (thumbnail) {
      return (
        <div className="relative">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-20 md:h-25 object-cover rounded-t-xs md:rounded-t-sm"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="rounded-full bg-[rgba(0,0,0,0.35)] p-2">
              <PlayIcon className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (videos?.length > 0) {
      return (
        <div className="flex items-center justify-center w-full h-25 md:h-30 bg-gray-100 text-red-500 rounded-t-xs md:rounded-t-sm">
          Unable to parse this YouTube link
        </div>
      );
    }

    if (imageUrl) {
      return (
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto min-h-20 max-h-22 md:min-h-25 md:max-h-25 object-cover rounded-t-xs md:rounded-t-sm"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        className="w-full pt-7 pb-4 px-3 min-h-15  bg-cover bg-center rounded-t-xs md:rounded-t-sm items-center justify-center"
        style={{ backgroundImage: `url(${bgUrl})` }}
      >
        <h2 className="text-dark-gray font-semibold text-center px-4">
          {ellipsize(title, 90)}
        </h2>
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!canDelete || (!selectMode && !showDelete)) return null;

    return (
      <div className="flex justify-between p-1">
        <div className="z-1 pointer-events-none">
          <div className="pointer-events-auto" onClick={stopPropagation}>
            {showDelete && (
              <div className="flex items-center gap-1">
                {canEdit && (
                  <IconButton
                    title="Edit post"
                    aria-label="Edit post"
                    rounded="full"
                    variant="ghost"
                    tone="brand"
                    size="xs"
                    onClick={handleEditClick}
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
                  onClick={handleDeleteClick}
                >
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none">
          <div className="pointer-events-auto" onClick={stopPropagation}>
            <div className="flex">

              {selectMode && (
                <IconButton
                  title={isSelected ? "Unselect" : "Select"}
                  aria-label="Select post"
                  size="xs"
                  variant={isSelected ? "primary" : "outline"}
                  tone={isSelected ? "default" : "brand"}
                  onClick={handleSelectToggle}
                  active={isSelected}
                  className="rounded-sm"
                >
                  {isSelected && <CheckIcon className="h-4 w-4" />}
                </IconButton>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupInfo = () => {
    if (post.group?.id) {
      return (
        <div className="pointer-events-auto" onClick={stopPropagation}>
          <button
            type="button"
            onClick={handleGroupClick}
            className="inline-flex items-center gap-1 hover:underline text-xs text-gray-500 leading-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded"
            aria-label={`Open group ${post.group.name ?? ""}`}
            title={post.group.name ?? ""}
          >
            <UsersIcon className="h-4 w-4 text-dark-green" />
            <span>{ellipsize(post.group.name, 22)}</span>
          </button>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-gray-500">
        <UsersIcon className="h-4 w-4" />
        <span>Ungrouped</span>
      </span>
    );
  };

  return (
    <div
      className="card relative group cursor-pointer border border-border"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`Open post ${title}`}
      title={title}
    >
      {renderActionButtons()}

      <div className="aspect-w-16 aspect-h-9 mb-1">
        {renderThumbnail()}
      </div>

      <div className='px-2 pb-2'>
        <h2 className="flex-1 font-semibold text-base text-dark-gray leading-[1.3] md:leading-[1.3] my-2">
          {ellipsize(title, 40)}
        </h2>

        {renderGroupInfo()}

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
              onClick={handleToggleLike}
              disabled={isLiking}
              aria-pressed={liked}
              aria-label={liked ? "Unlike" : "Like"}
              className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow
                 focus:outline-none focus:ring-2 focus:ring-yellow disabled:opacity-60 transition-opacity"
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
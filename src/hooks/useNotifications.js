import { kintreeApi } from "@/services/kintreeApi";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";

export function useNotifications(limit = 10) {
  const queryClient = useQueryClient();

  // Fetch notifications with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await kintreeApi.get("/user/notifications", {
        params: {
          page: pageParam,
          limit,
        },
      });
      return response.data.data;
    },
    refetchInterval: 60000,
    getNextPageParam: (lastPage) => {
      if (lastPage.current_page < lastPage.last_page) {
        return lastPage.current_page + 1;
      }
      return undefined;
    },
  });

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId) => {
      const response = await kintreeApi.put(
        `/user/notifications/${notificationId}/mark-as-read`
      );
      return response.data.data;
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(["notifications"], (oldData) => {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            ),
          })),
        };
      });
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await kintreeApi.put(
        "/user/notifications/mark-as-all-read"
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Update all notifications in the cache to be marked as read
      queryClient.setQueryData(["notifications"], (oldData) => {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((notification) => ({
              ...notification,
              is_read: true,
            })),
          })),
        };
      });
      // Invalidate the unread count query
      queryClient.invalidateQueries(["notifications-unread-count"]);
      queryClient.invalidateQueries(["notifications"]);
    },
  });

  // Fetch unread notifications count
  const {
    data: unreadCountData,
    isLoading: isLoadingUnreadCount,
    isError: isErrorUnreadCount,
    error: unreadCountError,
  } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await kintreeApi.get(
        "/user/notifications/unreaded-count"
      );
      return response.data.data.unreaded_count;
    },
    refetchInterval: 60000,
  });

  // Mark notification as unread
  const markAsUnread = useMutation({
    mutationFn: async (notificationId) => {
      const response = await kintreeApi.put(
        `/user/notifications/${notificationId}/mark-as-unread`
      );
      return response.data.data;
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(["notifications"], (oldData) => {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((notification) =>
              notification.id === updatedNotification.id
                ? updatedNotification
                : notification
            ),
          })),
        };
      });
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId) => {
      await kintreeApi.delete(`/user/notifications/${notificationId}`);
      return notificationId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["notifications"], (oldData) => {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            notifications: page.notifications.filter(
              (notification) => notification.id !== deletedId
            ),
            total_record: page.total_record - 1,
            filtered_record: page.filtered_record - 1,
          })),
        };
      });
      queryClient.invalidateQueries(["notifications-unread-count"]);
    },
  });

  // Helper function to get all notifications from all pages
  const getAllNotifications = () => {
    return data?.pages.flatMap((page) => page.notifications) || [];
  };

  return {
    notifications: getAllNotifications(),
    unreadCount: unreadCountData ?? 0,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    markAsRead: markAsRead.mutate,
    markAsUnread: markAsUnread.mutate,
    deleteNotification: deleteNotification.mutate,
    isMarkingAsRead: markAsRead.isLoading,
    isMarkingAsUnread: markAsUnread.isLoading,
    isDeleting: deleteNotification.isLoading,
    isLoadingUnreadCount,
    isErrorUnreadCount,
    unreadCountError,
    markAllAsRead: markAllAsRead.mutate,
    isMarkingAllAsRead: markAllAsRead.isLoading,
  };
}

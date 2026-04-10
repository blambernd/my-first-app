import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Setup Notification mock before any imports
function setupNotificationMock(permission: string) {
  const NotificationMock = vi.fn() as unknown as typeof Notification;
  Object.defineProperty(NotificationMock, "permission", {
    get: () => permission,
    configurable: true,
  });
  NotificationMock.requestPermission = vi.fn();
  global.Notification = NotificationMock;
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "unsupported" when serviceWorker is not available', async () => {
    // Ensure no serviceWorker
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    setupNotificationMock("default");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("unsupported");
    });
  });

  it('returns "unsupported" when PushManager is not available', async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: { ready: Promise.resolve({}) },
      configurable: true,
      writable: true,
    });
    delete (global.window as Record<string, unknown>).PushManager;

    setupNotificationMock("default");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("unsupported");
    });
  });

  it('returns "denied" when Notification.permission is denied', async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: { ready: Promise.resolve({}) },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("denied");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("denied");
    });
  });

  it('returns "prompt" when Notification.permission is default', async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: { ready: Promise.resolve({}) },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("default");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("prompt");
    });
  });

  it('returns "granted" when permission is granted and subscription exists', async () => {
    const mockSubscription = { endpoint: "https://push.example.com" };
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(mockSubscription),
          },
        }),
      },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("granted");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("granted");
    });
  });

  it('returns "prompt" when permission is granted but no active subscription', async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
          },
        }),
      },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("granted");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("prompt");
    });
  });

  it("subscribe returns false when status is denied", async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: { ready: Promise.resolve({}) },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("denied");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("denied");
    });

    let success = true;
    await act(async () => {
      success = await result.current.subscribe();
    });
    expect(success).toBe(false);
  });

  it("subscribe returns false when user denies permission", async () => {
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve({
          pushManager: { getSubscription: vi.fn().mockResolvedValue(null) },
        }),
      },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("default");
    global.Notification.requestPermission = vi.fn().mockResolvedValue("denied");

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("prompt");
    });

    let success = true;
    await act(async () => {
      success = await result.current.subscribe();
    });
    expect(success).toBe(false);
    expect(result.current.status).toBe("denied");
  });

  it("full subscribe flow sets status to granted", async () => {
    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({
        toJSON: () => ({
          endpoint: "https://push.example.com/sub",
          keys: { p256dh: "key1", auth: "key2" },
        }),
      }),
    };
    Object.defineProperty(global.navigator, "serviceWorker", {
      value: { ready: Promise.resolve({ pushManager: mockPushManager }) },
      configurable: true,
      writable: true,
    });
    (global.window as Record<string, unknown>).PushManager = vi.fn();
    setupNotificationMock("default");
    global.Notification.requestPermission = vi.fn().mockResolvedValue("granted");

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ publicKey: "BNTest123Key" }),
      })
      .mockResolvedValueOnce({ ok: true });

    const { usePushNotifications } = await import("./use-push-notifications");
    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.status).toBe("prompt");
    });

    expect(result.current.subscribing).toBe(false);

    await act(async () => {
      const success = await result.current.subscribe();
      expect(success).toBe(true);
    });

    expect(result.current.status).toBe("granted");
    expect(result.current.subscribing).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith("/api/push/vapid-key");
  });
});

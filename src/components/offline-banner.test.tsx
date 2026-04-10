import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { OfflineBanner } from "./offline-banner";

describe("OfflineBanner", () => {
  let originalOnLine: boolean;
  let listeners: Record<string, Set<EventListener>>;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
    listeners = { offline: new Set(), online: new Set() };

    vi.spyOn(window, "addEventListener").mockImplementation(
      (event: string, handler: EventListener) => {
        if (listeners[event]) listeners[event].add(handler);
      }
    );
    vi.spyOn(window, "removeEventListener").mockImplementation(
      (event: string, handler: EventListener) => {
        if (listeners[event]) listeners[event].delete(handler);
      }
    );
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("renders nothing when online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
    const { container } = render(<OfflineBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows banner when initially offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(<OfflineBanner />);
    expect(
      screen.getByText("Keine Internetverbindung")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Bitte verbinde dich mit dem Internet um fortzufahren."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Erneut versuchen")).toBeInTheDocument();
  });

  it("shows banner when going offline after mount", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
    render(<OfflineBanner />);
    expect(screen.queryByText("Keine Internetverbindung")).toBeNull();

    // Simulate going offline
    act(() => {
      listeners.offline.forEach((fn) => fn(new Event("offline")));
    });
    expect(
      screen.getByText("Keine Internetverbindung")
    ).toBeInTheDocument();
  });

  it("hides banner when coming back online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(<OfflineBanner />);
    expect(
      screen.getByText("Keine Internetverbindung")
    ).toBeInTheDocument();

    // Simulate coming back online
    act(() => {
      listeners.online.forEach((fn) => fn(new Event("online")));
    });
    expect(screen.queryByText("Keine Internetverbindung")).toBeNull();
  });

  it("retry button dismisses banner when navigator is online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(<OfflineBanner />);
    expect(
      screen.getByText("Keine Internetverbindung")
    ).toBeInTheDocument();

    // Simulate network restored but event not yet fired
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    fireEvent.click(screen.getByText("Erneut versuchen"));
    expect(screen.queryByText("Keine Internetverbindung")).toBeNull();
  });

  it("retry button does nothing when still offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(<OfflineBanner />);

    fireEvent.click(screen.getByText("Erneut versuchen"));
    // Banner should still be visible
    expect(
      screen.getByText("Keine Internetverbindung")
    ).toBeInTheDocument();
  });

  it("cleans up event listeners on unmount", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
    const { unmount } = render(<OfflineBanner />);
    expect(listeners.offline.size).toBe(1);
    expect(listeners.online.size).toBe(1);

    unmount();
    expect(listeners.offline.size).toBe(0);
    expect(listeners.online.size).toBe(0);
  });
});

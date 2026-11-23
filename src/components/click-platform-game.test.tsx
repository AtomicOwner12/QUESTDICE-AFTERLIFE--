import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClickPlatformGame } from "./click-platform-game";
import { CLICK_GAMES } from "@/lib/click-games";

afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("click platform gameplay", () => {
  it.each(CLICK_GAMES)("$id completes both 10-second player rounds", (game) => {
    vi.useFakeTimers();
    const done = vi.fn();
    render(<ClickPlatformGame game={game} players={[{ name: "Anna" }, { name: "Ben" }]} onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "▶ RUNDE STARTEN" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "▶ RUNDE STARTEN" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(done).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Anna: 0 Punkte/)).toBeInTheDocument();
    expect(screen.getByText(/Ben: 0 Punkte/)).toBeInTheDocument();
  });
  it("continuous tapping does not restart the timer and final scores read back", () => {
    vi.useFakeTimers();
    const game = CLICK_GAMES[0];
    if (!game) throw new Error("Missing sprint");
    const done = vi.fn();
    render(<ClickPlatformGame game={game} players={[{ name: "Anna" }]} onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "▶ RUNDE STARTEN" }));
    for (let i = 0; i < 10; i++) {
      fireEvent.pointerDown(screen.getByRole("button", { name: "Klickziel" }));
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(done).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Anna: 13 Punkte/)).toBeInTheDocument();
  });
});
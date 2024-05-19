/* eslint-disable react/no-array-index-key */

"use client";

import React from "react";
import { useGame } from "@/app/(apps)/_features/game/hooks";
import { Button } from "@/components/ui/button";

export function Game() {
  const { canvasRef, isPlaying, setIsPlaying, score } = useGame();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex w-full items-center justify-between gap-2">
        {score.map((s, i) => {
          return (
            <p key={`score-${i}`} className="grid place-items-center gap-2">
              <span>Player {i + 1}</span>
              <span className="text-2xl font-bold">{s}</span>
            </p>
          );
        })}
      </div>
      <div className="border">
        <canvas ref={canvasRef} height={600} width={800} />
      </div>
      <Button
        onClick={() => setIsPlaying(!isPlaying)}
        variant={isPlaying ? "destructive" : "default"}
      >
        {isPlaying ? "Pause" : "Play"}
      </Button>
    </div>
  );
}

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";

const paddleSpeed = 100;
const ballSpeed = 4;

const url = "ws://localhost:8787";

type MoveAction = {
  action: "over";
  message: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
  active: boolean;
};

type Data = { senderId: string } & (
  | {
      action: "start" | "stop";
    }
  | {
      action: "score";
      winner: "left" | "right";
    }
  | MoveAction
);

export function useGame() {
  const searchParams = useSearchParams();

  const id = searchParams.get("id") ?? "1";
  const { sendJsonMessage, lastJsonMessage } = useWebSocket(`${url}?id=${id}`);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [active, setActive] = useState(id === "1");

  const [isPlaying, setIsPlaying] = useState(false);
  const [ball, setBall] = useState({
    x: 400,
    y: 300,
    radius: 10,
    dx: ballSpeed,
    dy: ballSpeed,
  });
  const [paddle1, setPaddle1] = useState({
    x: id === "1" ? 10 : 770,
    y: 250,
    width: 20,
    height: 100,
  });

  const [score, setScore] = useState([0, 0]);

  const onRestartPosition = useCallback(
    (isPlayer1Win: boolean) => {
      setScore((prev) => {
        if (isPlayer1Win) {
          return [prev[0] + 1, prev[1]];
        }

        return [prev[0], prev[1] + 1];
      });

      setIsPlaying(false);

      setBall({
        x: 400,
        y: 300,
        radius: 10,
        dx: ballSpeed,
        dy: ballSpeed,
      });
      setPaddle1({
        x: id === "1" ? 10 : 770,
        y: 250,
        width: 20,
        height: 100,
      });
    },
    [id]
  );
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        setPaddle1((prev) => ({
          ...prev,
          y: Math.max(prev.y - paddleSpeed, 0),
        }));
        break;
      case "ArrowDown":
        setPaddle1((prev) => ({
          ...prev,
          y: Math.min(prev.y + paddleSpeed, 500),
        }));
        break;

      default:
        break;
    }
  }, []);

  useEffect(() => {
    const message = lastJsonMessage as Data;

    switch (message?.action) {
      case "start":
        setIsPlaying(true);
        break;
      case "stop":
        setIsPlaying(false);
        break;
      case "score":
        onRestartPosition(message.winner === "left");
        break;
      case "over":
        setActive(message.active);
        setBall((prev) => ({
          ...prev,
          x: 800 - message.message.x,
          y: message.message.y,
          dx: message.message.dx,
          dy: message.message.dy,
        }));
        break;
      default:
        break;
    }
  }, [lastJsonMessage, onRestartPosition]);

  const updateBallPosition = useCallback(() => {
    if (!isPlaying) return;
    if (!canvasRef.current) return;
    setBall((prevBall) => {
      if (!canvasRef.current) return prevBall;
      let { x, y, dx, dy } = prevBall;
      const { radius } = prevBall;

      x += dx;
      y += dy;
      const isOverHeight =
        y + radius > canvasRef.current.height || y - radius < 0;

      if (isOverHeight) dy = -dy;

      const isOverWidth =
        id === "1" ? x + radius > canvasRef.current.width : x - radius < 0;

      if (isOverWidth && active) {
        sendJsonMessage({
          action: "over",
          senderId: id,
          message: { x, y, dx, dy },
        } as Data);
      }

      if (isOverWidth) {
        return prevBall;
      }

      const isPaddleHeightHit =
        y + radius > paddle1.y && y - radius < paddle1.y + paddle1.height;

      const isPaddleWidthHit =
        id === "1"
          ? x - radius < paddle1.x + paddle1.width
          : x + radius > paddle1.x;

      if (active && isPaddleWidthHit && isPaddleHeightHit) {
        dx = -dx;
      }

      return { ...prevBall, x, y, dx, dy };
    });
  }, [
    active,
    id,
    isPlaying,
    paddle1.height,
    paddle1.width,
    paddle1.x,
    paddle1.y,
    sendJsonMessage,
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      canvas.width = 800;
      canvas.height = 600;
    }
    const context = canvas?.getContext("2d");

    const draw = () => {
      if (!context || !canvas) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      // ボールの描画
      if (active) {
        context.beginPath();
        context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        context.fillStyle = "red";
        context.fill();
        context.closePath();
      }

      // パドルの描画
      context.fillStyle = "blue";
      context.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);

      updateBallPosition();
    };

    animationRef.current = requestAnimationFrame(function animate() {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, ball, isPlaying, paddle1, updateBallPosition]);

  return {
    canvasRef,
    setIsPlaying,
    isPlaying,
    score,
    sendJsonMessage,
    id,
  };
}

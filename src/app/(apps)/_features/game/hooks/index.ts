import { useCallback, useEffect, useRef, useState } from "react";

// type DrawProps = {
//   ctx: CanvasRenderingContext2D;
//   canvas: HTMLCanvasElement;
// };

const paddleSpeed = 100;
const ballSpeed = 4;

export function useGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [ball, setBall] = useState({
    x: 400,
    y: 300,
    radius: 10,
    dx: ballSpeed,
    dy: ballSpeed,
  });
  const [paddle1, setPaddle1] = useState({
    x: 10,
    y: 250,
    width: 20,
    height: 100,
  });
  const [paddle2, setPaddle2] = useState({
    x: 770,
    y: 250,
    width: 20,
    height: 100,
  });

  const [score, setScore] = useState([0, 0]);

  const onRestartPosition = (isPlayer1Win: boolean) => {
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
      x: 10,
      y: 250,
      width: 20,
      height: 100,
    });
    setPaddle2({
      x: 770,
      y: 250,
      width: 20,
      height: 100,
    });
  };
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "w":
        setPaddle1((prev) => ({
          ...prev,
          y: Math.max(prev.y - paddleSpeed, 0),
        }));
        break;
      case "s":
        setPaddle1((prev) => ({
          ...prev,
          y: Math.min(prev.y + paddleSpeed, 500),
        }));
        break;
      case "ArrowUp":
        setPaddle2((prev) => ({
          ...prev,
          y: Math.max(prev.y - paddleSpeed, 0),
        }));
        break;
      case "ArrowDown":
        setPaddle2((prev) => ({
          ...prev,
          y: Math.min(prev.y + paddleSpeed, 500),
        }));
        break;

      default:
        break;
    }
  }, []);

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
        x + radius > canvasRef.current.width || x - radius < 0;

      if (isOverWidth) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        onRestartPosition(x - radius < 0);

        return prevBall;
      }

      if (
        (x - radius < paddle1.x + paddle1.width &&
          y > paddle1.y &&
          y < paddle1.y + paddle1.height) ||
        (x + radius > paddle2.x &&
          y > paddle2.y &&
          y < paddle2.y + paddle2.height)
      ) {
        dx = -dx;
      }

      return { ...prevBall, x, y, dx, dy };
    });
  }, [
    isPlaying,
    paddle1.height,
    paddle1.width,
    paddle1.x,
    paddle1.y,
    paddle2.height,
    paddle2.x,
    paddle2.y,
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
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = "red";
      context.fill();
      context.closePath();

      // パドルの描画
      context.fillStyle = "blue";
      context.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
      context.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

      updateBallPosition();
    };

    animationRef.current = requestAnimationFrame(function animate() {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [ball, isPlaying, paddle1, paddle2, updateBallPosition]);

  return {
    canvasRef,
    setIsPlaying,
    isPlaying,
    score,
  };
}

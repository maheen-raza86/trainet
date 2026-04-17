'use client';
import { useRef, useEffect } from 'react';

/* ─────────────────────────────────────────────
   CertStack — premium certificate scroll stack
   Pure canvas · no deps · SSR-safe via dynamic()
───────────────────────────────────────────── */

interface Props {
  mouseX?: number; // -0.5 … 0.5
  mouseY?: number;
  className?: string;
}

/* ── 4 certs, natural stacking offsets ── */
const CERTS = [
  { label: 'Cybersecurity',      tilt: -5,  ox: -14, oy:  4  },
  { label: 'DevOps Engineering', tilt:  3.5,ox:  12, oy: -10 },
  { label: 'Cloud Computing',    tilt: -2,  ox:  -6, oy: -22 },
  { label: 'Networking (CCNA)',  tilt:  5,  ox:  16, oy: -34 },
];

/* ── Soft paper-fall easing — tiny settle, no bounce ── */
const easeOutSoft = (t: number): number => {
  // cubic ease-out with a single tiny overshoot (≈2%) then settle
  const c = 1 - Math.pow(1 - t, 3);
  if (t > 0.82) {
    const over = Math.sin((t - 0.82) / 0.18 * Math.PI) * 0.018;
    return c + over * (1 - t) * 5;
  }
  return c;
};

export default function CertStack({ mouseX = 0, mouseY = 0, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const sizeRef   = useRef({ w: 480, h: 480 });
  const startRef  = useRef<number | null>(null);
  const mouseRef  = useRef({ x: mouseX, y: mouseY });

  // keep mouse ref fresh without re-mounting
  useEffect(() => { mouseRef.current = { x: mouseX, y: mouseY }; }, [mouseX, mouseY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ── HiDPI resize ── */
    const resize = () => {
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      const c = canvas.getContext('2d');
      if (c) c.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── Timing ── */
    const DROP_DUR   = 1.15;  // slower, more paper-like
    const DROP_DELAY = 0.70;  // longer pause between drops
    const LOOP_PAUSE = 3.2;   // stack rests longer before reset
    const N          = CERTS.length;
    const SEQ        = N * DROP_DELAY + DROP_DUR + LOOP_PAUSE;

    /* ── Draw ── */
    const draw = (ts: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      if (startRef.current === null) startRef.current = ts;
      const t = ((ts - startRef.current) / 1000) % SEQ;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const { w: W, h: H } = sizeRef.current;
      // very subtle parallax
      const cx = W / 2 + mx * 10;
      const cy = H / 2 + my * 7;

      ctx.save();
      ctx.clearRect(0, 0, W, H);

      /* ── 1. Wide soft spotlight ── */
      const spot = ctx.createRadialGradient(cx, cy + 70, 0, cx, cy + 70, 240);
      spot.addColorStop(0,   'rgba(110,60,230,0.10)');
      spot.addColorStop(0.45,'rgba(99,102,241,0.04)');
      spot.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = spot;
      ctx.beginPath(); ctx.ellipse(cx, cy + 70, 240, 120, 0, 0, Math.PI * 2); ctx.fill();

      /* ── 2. Soft reflection ellipse ── */
      const refl = ctx.createRadialGradient(cx, cy + 125, 0, cx, cy + 125, 120);
      refl.addColorStop(0,   'rgba(139,92,246,0.07)');
      refl.addColorStop(0.7, 'rgba(99,102,241,0.02)');
      refl.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = refl;
      ctx.beginPath(); ctx.ellipse(cx, cy + 125, 120, 18, 0, 0, Math.PI * 2); ctx.fill();

      /* ── cert sizing ── */
      const CW = Math.min(W * 0.70, 310);
      const CH = CW * 0.63;

      const allLanded = t > N * DROP_DELAY + DROP_DUR;
      // very slow float — 0.38 rad/s, 5px amplitude
      const floatY = allLanded ? Math.sin(t * 0.38) * 5 : 0;
      // shimmer every 7s, very soft
      const shimT  = (t % 7) / 7;

      /* ── draw certs back-to-front ── */
      CERTS.forEach((cert, idx) => {
        const progress = Math.max(0, Math.min(1, (t - idx * DROP_DELAY) / DROP_DUR));
        if (progress === 0) return;

        const eased = easeOutSoft(progress);

        // top cert is slightly larger (scale 1 → 1.04 for top)
        const isTop   = idx === N - 1;
        const scale   = isTop ? 1.04 : 1.0 - (N - 1 - idx) * 0.015;
        const startY  = cy - H * 0.80;
        const restY   = cy + cert.oy;
        const curY    = startY + (restY - startY) * eased + floatY;
        const curX    = cx + cert.ox;
        const tiltRad = (cert.tilt * Math.PI) / 180;

        ctx.save();
        ctx.translate(curX, curY);
        ctx.rotate(tiltRad);
        ctx.scale(scale, scale);

        /* ── shadow — deeper for top cert ── */
        ctx.shadowColor   = `rgba(60,30,120,${isTop ? 0.22 : 0.14} )`;
        ctx.shadowBlur    = isTop ? 32 : 20;
        ctx.shadowOffsetY = isTop ? 12 : 7;

        /* ── paper body ── */
        const pg = ctx.createLinearGradient(-CW/2, -CH/2, CW*0.3, CH*0.6);
        pg.addColorStop(0,   'rgba(254,252,248,0.98)');
        pg.addColorStop(0.55,'rgba(250,246,240,0.97)');
        pg.addColorStop(1,   'rgba(245,241,234,0.96)');
        roundRect(ctx, -CW/2, -CH/2, CW, CH, 12);
        ctx.fillStyle = pg; ctx.fill();

        /* clear shadow before strokes */
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        /* ── outer border ── */
        roundRect(ctx, -CW/2, -CH/2, CW, CH, 12);
        const bg = ctx.createLinearGradient(-CW/2, -CH/2, CW/2, CH/2);
        bg.addColorStop(0, `rgba(139,92,246,${isTop ? 0.50 : 0.30})`);
        bg.addColorStop(1, `rgba(59,130,246,${isTop ? 0.35 : 0.20})`);
        ctx.strokeStyle = bg; ctx.lineWidth = isTop ? 1.4 : 1.0; ctx.stroke();

        /* ── inner inset border ── */
        roundRect(ctx, -CW/2+9, -CH/2+9, CW-18, CH-18, 8);
        ctx.strokeStyle = `rgba(139,92,246,${isTop ? 0.16 : 0.09})`;
        ctx.lineWidth   = 0.7; ctx.stroke();

        /* ── rolled left edge ── */
        drawRolledEdge(ctx, -CW/2, -CH/2, CH, 'left',  isTop);
        /* ── rolled right edge ── */
        drawRolledEdge(ctx, CW/2,  -CH/2, CH, 'right', isTop);

        /* ── header band ── */
        const hbH = CH * 0.21;
        roundRectTop(ctx, -CW/2+1.5, -CH/2+1.5, CW-3, hbH, 11);
        const hg = ctx.createLinearGradient(-CW/2, -CH/2, CW/2, -CH/2+hbH);
        hg.addColorStop(0,   'rgba(88,28,200,0.92)');
        hg.addColorStop(0.5, 'rgba(109,40,217,0.90)');
        hg.addColorStop(1,   'rgba(37,99,235,0.86)');
        ctx.fillStyle = hg; ctx.fill();
        // header inner highlight
        roundRectTop(ctx, -CW/2+1.5, -CH/2+1.5, CW-3, hbH*0.35, 11);
        ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();

        /* ── TRAINET wordmark ── */
        ctx.fillStyle    = 'rgba(255,255,255,0.94)';
        ctx.font         = `700 ${CW*0.062}px Inter,sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TRAINET', 0, -CH/2 + hbH*0.5);

        /* ── cert title ── */
        ctx.fillStyle = `rgba(28,18,55,${isTop ? 0.88 : 0.70})`;
        ctx.font      = `600 ${CW*0.056}px Inter,sans-serif`;
        ctx.fillText(cert.label, 0, -CH/2 + hbH + CH*0.175);

        /* ── subtitle ── */
        ctx.fillStyle = `rgba(90,70,150,${isTop ? 0.62 : 0.45})`;
        ctx.font      = `${CW*0.038}px Inter,sans-serif`;
        ctx.fillText('Certificate of Completion', 0, -CH/2 + hbH + CH*0.295);

        /* ── decorative lines ── */
        for (let li = 0; li < 3; li++) {
          const ly = -CH/2 + hbH + CH*(0.42 + li*0.10);
          const lw = li === 0 ? CW*0.52 : CW*0.36;
          ctx.beginPath();
          ctx.moveTo(-lw/2, ly); ctx.lineTo(lw/2, ly);
          ctx.strokeStyle = `rgba(139,92,246,${isTop ? 0.16-li*0.04 : 0.08-li*0.02})`;
          ctx.lineWidth   = li === 0 ? 1.1 : 0.7; ctx.stroke();
        }

        /* ── premium seal ── */
        const sX = CW*0.27, sY = CH*0.21, sR = CW*0.088;
        // outer glow ring
        ctx.beginPath(); ctx.arc(sX, sY, sR*1.45, 0, Math.PI*2);
        ctx.fillStyle = `rgba(109,40,217,${isTop ? 0.12 : 0.06})`; ctx.fill();
        // main seal disc
        ctx.beginPath(); ctx.arc(sX, sY, sR, 0, Math.PI*2);
        const sg = ctx.createRadialGradient(sX-sR*0.35, sY-sR*0.35, 0, sX, sY, sR*1.1);
        sg.addColorStop(0,   'rgba(196,181,253,0.98)');
        sg.addColorStop(0.4, 'rgba(139,92,246,0.95)');
        sg.addColorStop(0.8, 'rgba(88,28,200,0.92)');
        sg.addColorStop(1,   'rgba(60,20,160,0.88)');
        ctx.fillStyle = sg; ctx.fill();
        // seal border
        ctx.strokeStyle = 'rgba(220,200,255,0.55)'; ctx.lineWidth = 1.0; ctx.stroke();
        // inner ring detail
        ctx.beginPath(); ctx.arc(sX, sY, sR*0.72, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.7; ctx.stroke();
        // star
        drawStar(ctx, sX, sY, sR*0.50, sR*0.24, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.90)'; ctx.fill();
        // inner glow
        ctx.beginPath(); ctx.arc(sX, sY, sR*0.30, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();

        /* ── ribbon ── */
        const rW = CW*0.115, rH = CH*0.30;
        const rX = -CW*0.27, rY = CH*0.07;
        const rg = ctx.createLinearGradient(rX-rW/2, rY, rX+rW/2, rY+rH);
        rg.addColorStop(0,   'rgba(88,28,200,0.95)');
        rg.addColorStop(0.35,'rgba(109,40,217,0.98)');
        rg.addColorStop(0.65,'rgba(139,92,246,0.95)');
        rg.addColorStop(1,   'rgba(37,99,235,0.90)');
        ctx.beginPath();
        ctx.moveTo(rX-rW/2, rY);
        ctx.lineTo(rX+rW/2, rY);
        ctx.lineTo(rX+rW/2, rY+rH*0.68);
        ctx.lineTo(rX,       rY+rH);
        ctx.lineTo(rX-rW/2, rY+rH*0.68);
        ctx.closePath();
        ctx.fillStyle = rg; ctx.fill();
        ctx.strokeStyle = 'rgba(196,181,253,0.35)'; ctx.lineWidth = 0.7; ctx.stroke();
        // ribbon centre highlight
        ctx.beginPath();
        ctx.moveTo(rX-rW*0.15, rY+2);
        ctx.lineTo(rX+rW*0.15, rY+2);
        ctx.lineTo(rX+rW*0.15, rY+rH*0.55);
        ctx.lineTo(rX,          rY+rH*0.72);
        ctx.lineTo(rX-rW*0.15, rY+rH*0.55);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill();

        /* ── shimmer on top cert only — softer, every 7s ── */
        if (isTop && allLanded) {
          const shmX = -CW/2 - CW*0.15 + shimT * CW*1.3;
          const shg  = ctx.createLinearGradient(shmX-50, -CH/2, shmX+50, CH/2);
          shg.addColorStop(0,   'rgba(255,255,255,0)');
          shg.addColorStop(0.5, 'rgba(255,255,255,0.07)');
          shg.addColorStop(1,   'rgba(255,255,255,0)');
          roundRect(ctx, -CW/2, -CH/2, CW, CH, 12);
          ctx.fillStyle = shg; ctx.fill();
        }

        /* ── landing sparkles — 3 only, very soft ── */
        if (progress > 0.88 && progress < 0.97) {
          const sp = (progress - 0.88) / 0.09;
          for (let s = 0; s < 3; s++) {
            const sa = (s / 3) * Math.PI * 2 + 0.4;
            const sr = CW*0.32 * sp;
            ctx.beginPath();
            ctx.arc(Math.cos(sa)*sr, Math.sin(sa)*sr*0.38, 2*(1-sp), 0, Math.PI*2);
            ctx.fillStyle = `rgba(196,181,253,${0.55*(1-sp)})`; ctx.fill();
          }
        }

        ctx.restore();
      });

      /* ── 3 ambient particles — very subtle ── */
      if (allLanded) {
        const pt = t - (N * DROP_DELAY + DROP_DUR);
        for (let i = 0; i < 3; i++) {
          const pa = (i / 3) * Math.PI * 2 + pt * 0.22;
          const pr = 130 + Math.sin(pt*0.35 + i*1.4) * 22;
          const px = cx + Math.cos(pa) * pr * 0.85;
          const py = cy + Math.sin(pa) * pr * 0.30;
          const al = 0.18 + 0.12 * Math.sin(pt*0.5 + i*1.1);
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2);
          ctx.fillStyle = i%2===0 ? `rgba(167,139,250,${al})` : `rgba(96,165,250,${al})`;
          ctx.fill();
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas ref={canvasRef} className={className}
      style={{ width:'100%', height:'100%', display:'block' }} />
  );
}

/* ─── Canvas helpers ─────────────────────── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h); ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

function drawRolledEdge(
  ctx: CanvasRenderingContext2D,
  edgeX: number, topY: number, h: number,
  side: 'left'|'right', prominent: boolean
) {
  const dir   = side === 'left' ? 1 : -1;
  const depth = prominent ? 16 : 11; // deeper roll on top cert
  const grad  = ctx.createLinearGradient(edgeX, topY, edgeX + dir*depth*2.2, topY);
  const a1 = prominent ? 0.28 : 0.16;
  const a2 = prominent ? 0.12 : 0.07;
  if (side === 'left') {
    grad.addColorStop(0,   `rgba(160,140,210,${a1})`);
    grad.addColorStop(0.45,`rgba(210,200,235,${a2})`);
    grad.addColorStop(1,   'rgba(255,255,255,0)');
  } else {
    grad.addColorStop(0,   'rgba(255,255,255,0)');
    grad.addColorStop(0.55,`rgba(210,200,235,${a2})`);
    grad.addColorStop(1,   `rgba(160,140,210,${a1})`);
  }
  // curved roll shape
  ctx.beginPath();
  ctx.moveTo(edgeX, topY);
  ctx.bezierCurveTo(edgeX+dir*depth*0.8, topY+h*0.1, edgeX+dir*depth*0.8, topY+h*0.9, edgeX, topY+h);
  ctx.lineTo(edgeX+dir*depth*2.2, topY+h);
  ctx.bezierCurveTo(edgeX+dir*depth*1.4, topY+h*0.9, edgeX+dir*depth*1.4, topY+h*0.1, edgeX+dir*depth*2.2, topY);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, pts: number) {
  ctx.beginPath();
  for (let i = 0; i < pts*2; i++) {
    const r = i%2===0 ? outerR : innerR;
    const a = (i/(pts*2))*Math.PI*2 - Math.PI/2;
    i===0 ? ctx.moveTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r)
           : ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
  }
  ctx.closePath();
}

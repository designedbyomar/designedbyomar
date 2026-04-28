import React from 'react';

// ============================================================
// Galaxy — canvas pixel orbit
// ============================================================
export const Galaxy = ({ density = 1, speed = 1, style = 'pixel', accent = 'mono', theme = 'dark' }) => {
  const canvasRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = false;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const styles = getComputedStyle(document.documentElement);
    const token = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    const toAlpha = (color, alpha) => {
      const value = color.trim();
      if (value.startsWith('#')) {
        let hex = value.slice(1);
        if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
        const int = Number.parseInt(hex, 16);
        return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
      }
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const [r, g, b] = match[1].split(',').map((part) => part.trim());
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      return value;
    };
    const fgPrimary = token('--fg-primary', theme === 'dark' ? '#ededed' : '#171717');
    const fgSecondary = token('--fg-secondary', theme === 'dark' ? '#a1a1a1' : '#4d4d4d');
    const fgTertiary = token('--fg-tertiary', theme === 'dark' ? '#8f8f8f' : '#666666');
    const bgPage = token('--bg-page', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    const developBlue = token('--color-develop-blue', theme === 'dark' ? '#3291ff' : '#0a72ef');
    const previewPink = token('--color-preview-pink', theme === 'dark' ? '#ff3da0' : '#de1d8d');
    const shipRed = token('--color-ship-red', theme === 'dark' ? '#ff6b60' : '#ff5b4f');
    let w = 0, h = 0, cx = 0, cy = 0, rMin = 0, rMax = 0;
    let inView = true;
    let pageVisible = document.visibilityState === 'visible';
    let last = performance.now();
    let tick = () => { };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * DPR); canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = w / 2; cy = h * 0.61;
      rMin = Math.min(w, h) * 0.36; rMax = Math.min(w, h) * 0.57;
      rebuild();
    };
    const palettes = {
      mono: [fgPrimary, fgSecondary, fgTertiary],
      photo: [developBlue, previewPink, shipRed, fgPrimary, fgSecondary],
      workflow: [developBlue, previewPink, shipRed, fgPrimary, fgTertiary],
    };
    let particles = [];
    const rebuild = () => {
      particles = new Array(Math.round(140 * density)).fill(0).map(() => mk());
      if (style === 'ethereal') for (let i = 0; i < 60 * density; i++) particles.push(mk(true));
    };
    const mk = (outer = false) => {
      const rp = Math.random(), ring = rp < 0.45 ? 0 : rp < 0.8 ? 1 : 2;
      const ringR = rMin + (rMax - rMin) * (ring === 0 ? 0.05 : ring === 1 ? 0.45 : 0.9);
      const r = ringR + (Math.random() - 0.5) * (rMax - rMin) * 0.22;
      const dir = Math.random() < 0.85 ? 1 : -1;
      const ringSpeed = ring === 0 ? 0.00055 : ring === 1 ? 0.00038 : 0.00024;
      return {
        a: Math.random() * Math.PI * 2, r,
        av: dir * ringSpeed * (0.7 + Math.random() * 0.8),
        tilt: 0.32 + Math.random() * 0.08,
        size: style === 'pixel' ? (Math.random() < 0.55 ? 2 : Math.random() < 0.85 ? 3 : 4) : style === 'ethereal' ? 0.6 + Math.random() * 1.8 : (Math.random() < 0.6 ? 2 : 3),
        color: palettes[accent][Math.floor(Math.random() * palettes[accent].length)],
        twinkle: Math.random() * Math.PI * 2, tv: 0.01 + Math.random() * 0.03,
        outer: !!outer, z: 0.5 + Math.random() * 0.9,
      };
    };
    const updateRunning = () => {
      const shouldRun = inView && pageVisible;
      if (shouldRun === activeRef.current) return;
      activeRef.current = shouldRun;
      if (shouldRun) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        updateRunning();
      }, { threshold: 0.05 });
    observer?.observe(canvas);
    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === 'visible';
      updateRunning();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    tick = (now) => {
      if (!activeRef.current) return;
      const dt = Math.min(40, now - last); last = now;
      if (style === 'ethereal') { ctx.fillStyle = toAlpha(bgPage, theme === 'dark' ? 0.18 : 0.22); ctx.fillRect(0, 0, w, h); }
      else ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.a += p.av * dt * speed; p.twinkle += p.tv;
        const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * p.tilt;
        const back = Math.sin(p.a) < 0;
        ctx.globalAlpha = Math.max(0, Math.min(1, (back ? 0.22 : 1) * (0.55 + Math.sin(p.twinkle) * 0.45) * (p.outer ? 0.45 : 1)));
        ctx.fillStyle = p.color;
        const s = p.size * (back ? 0.85 : 1);
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    updateRunning();
    return () => {
      cancelAnimationFrame(rafRef.current);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
    };
  }, [density, speed, style, accent, theme]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

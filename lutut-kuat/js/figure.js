// =====================================================
//  FIGUR ANIMASI (SVG stick figure)
// =====================================================
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const L = { torso: 45, neck: 5, head: 10, ua: 28, fa: 27, th: 35, sh: 35, ft: 11 };

  const rad = (d) => (d * Math.PI) / 180;
  const pt = (o, len, ang) => [o[0] + len * Math.sin(rad(ang)), o[1] + len * Math.cos(rad(ang))];
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

  function lerpPose(a, b, t) {
    const out = {};
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach((k) => {
      const va = a[k], vb = b[k] === undefined ? va : b[k];
      if (va === undefined) out[k] = vb;
      else if (Array.isArray(va)) out[k] = va.map((v, i) => lerp(v, vb[i], t));
      else if (typeof va === "number") out[k] = lerp(va, vb, t);
      else out[k] = t < 0.5 ? va : vb;
    });
    return out;
  }

  function poseAt(frames, p) {
    if (frames.length === 1) return frames[0];
    const x = Math.max(0, Math.min(1, p)) * (frames.length - 1);
    const i = Math.min(Math.floor(x), frames.length - 2);
    return lerpPose(frames[i], frames[i + 1], x - i);
  }

  // Inverse kinematics dua tulang (lengan)
  function ik(s, target, a, b) {
    const dx = target[0] - s[0], dy = target[1] - s[1];
    let d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, d));
    const base = Math.atan2(dy, dx);
    const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d));
    const c1 = [s[0] + a * Math.cos(base + alpha), s[1] + a * Math.sin(base + alpha)];
    const c2 = [s[0] + a * Math.cos(base - alpha), s[1] + a * Math.sin(base - alpha)];
    const elbow = c1[1] > c2[1] ? c1 : c2;
    const hand = [s[0] + d * Math.cos(base), s[1] + d * Math.sin(base)];
    return [elbow, hand];
  }

  function solve(pose) {
    const hip = pose.hip;
    const sh = pt(hip, L.torso, 180 - pose.torso);
    const head = pt(hip, L.torso + L.neck + L.head, 180 - pose.torso);
    const leg = (l) => {
      const k = pt(hip, L.th, l[0]);
      const an = pt(k, L.sh, l[1]);
      const fa = l[1] + l[2];
      return { knee: k, ankle: an, toe: pt(an, L.ft, fa), heel: pt(an, 3, fa + 180) };
    };
    let elbow, hand;
    if (pose.hold) [elbow, hand] = ik(sh, pose.hold, L.ua, L.fa);
    else {
      elbow = pt(sh, L.ua, pose.arm[0]);
      hand = pt(elbow, L.fa, pose.arm[1]);
    }
    return { hip, sh, head, n: leg(pose.n), f: leg(pose.f), elbow, hand };
  }

  const P = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  const legPath = (hip, l) => `M${P(hip)}L${P(l.knee)}L${P(l.ankle)}M${P(l.heel)}L${P(l.toe)}`;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function drawProps(g, props) {
    el("line", { x1: 6, y1: 160.5, x2: 194, y2: 160.5, class: "fig-floor" }, g);
    (props || []).forEach((p) => {
      if (p === "chair") {
        el("path", { d: "M70 72 L70 124 L113 124 M72 124 L72 160 M110 124 L110 160", class: "fig-prop" }, g);
      } else if (p === "support") {
        el("path", { d: "M127 80 L127 160 M127 121 L162 121 L162 160", class: "fig-prop" }, g);
      } else if (p === "mat") {
        el("rect", { x: 22, y: 154.5, width: 172, height: 5, rx: 2.5, class: "fig-mat" }, g);
      }
    });
  }

  class Figure {
    constructor(container, opts = {}) {
      this.svg = el("svg", { viewBox: "0 0 200 172", class: "figure" + (opts.small ? " figure-sm" : ""), role: "img" });
      this.svg.setAttribute("aria-label", "Ilustrasi gerakan");
      container.appendChild(this.svg);
      this.raf = null;
    }

    setExercise(ex, mirror) {
      this.ex = ex;
      this.svg.innerHTML = "";
      const root = el("g", mirror ? { transform: "translate(200 0) scale(-1 1)" } : {}, this.svg);
      drawProps(root, ex.props);
      this.hl = el("circle", { r: 10, class: "fig-hl" }, root);
      this.farLeg = el("path", { class: "fig-far" }, root);
      this.torso = el("path", { class: "fig-body" }, root);
      this.head = el("circle", { r: L.head, class: "fig-head" }, root);
      this.nearLeg = el("path", { class: "fig-body" }, root);
      this.arm = el("path", { class: "fig-body fig-arm" }, root);
      this.render(ex.frames[0]);
    }

    render(pose) {
      const j = solve(pose);
      this.farLeg.setAttribute("d", legPath(j.hip, j.f));
      this.nearLeg.setAttribute("d", legPath(j.hip, j.n));
      this.torso.setAttribute("d", `M${P(j.hip)}L${P(j.sh)}`);
      this.head.setAttribute("cx", j.head[0].toFixed(1));
      this.head.setAttribute("cy", j.head[1].toFixed(1));
      this.arm.setAttribute("d", `M${P(j.sh)}L${P(j.elbow)}L${P(j.hand)}`);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const h = this.ex.highlight;
      const c =
        h === "knee" ? j.n.knee :
        h === "ankle" ? j.n.ankle :
        h === "calf" ? mid(j.n.knee, j.n.ankle) :
        mid(j.hip, j.n.knee);
      this.hl.setAttribute("cx", c[0].toFixed(1));
      this.hl.setAttribute("cy", c[1].toFixed(1));
    }

    // p: 0..1 sepanjang keyframe
    setProgress(p) {
      this.render(poseAt(this.ex.frames, ease(p)));
    }

    // Animasi berulang untuk pratinjau
    loop(speed = 1) {
      this.stop();
      const ex = this.ex;
      const up = ex.up, hold = ex.mode === "time" ? 1.5 : Math.max(ex.hold, 0.4), down = ex.down, rest = 0.6;
      const total = up + hold + down + rest;
      const t0 = performance.now();
      const tick = (now) => {
        const t = (((now - t0) / 1000) * speed) % total;
        this.setProgress(repProgress(t, up, hold, down));
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    stop() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    destroy() {
      this.stop();
      this.svg.remove();
    }
  }

  // Progres linear (sebelum easing) dalam satu repetisi
  function repProgress(t, up, hold, down) {
    if (t < up) return t / up;
    if (t < up + hold) return 1;
    if (t < up + hold + down) return 1 - (t - up - hold) / down;
    return 0;
  }

  window.LK_FIG = { Figure, repProgress };
})();

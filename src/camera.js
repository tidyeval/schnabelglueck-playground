const smooth = n => { n = Math.max(0, Math.min(1, n)); return n * n * (3 - 2 * n); };
const windowAt = (x, a, b, c, d) => smooth((x - a) / (b - a)) * smooth((d - x) / (d - c));
export function cameraTarget(run, reduced = false) {
  if (reduced || run.flight.active) return { scroll: 0, y: 0, zoom: 1 };
  const x = run.distance;
  const reef = windowAt(x, 2900, 3350, 4280, 4700), cave = windowAt(x, 9250, 9650, 10580, 10900);
  const machine = windowAt(x, 7950, 8350, 9060, 9400), tide = windowAt(x, 5000, 5350, 5750, 6050);
  const wind = windowAt(x, 10850, 11100, 11360, 11400);
  const emphasis = Math.max(reef, cave, machine, tide * .7, wind * .55);
  return { scroll: emphasis * 32, y: run.player.y > 450 ? Math.max(reef, cave) * 14 : 0, zoom: 1 - emphasis * .035 };
}

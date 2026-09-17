"""Limpa a moldura branca embutida em alguns arquivos e gera WebP para a web.
Os originais em imgs/ nao sao tocados; a saida vai para imgs/web/."""
import json
import os

from PIL import Image, ImageChops

SRC = r"C:\Users\tiago\OneDrive\Documentos\Meus Projetos\NewProject\imgs"
OUT = os.path.join(SRC, "web")
MAX_LONG = 1800
QUALITY = 82

os.makedirs(OUT, exist_ok=True)


def crop_light_border(im):
    """Corta margens quase brancas e uniformes. Devolve (imagem, cortou?)."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    def line_is_border(coords):
        # borda = todos os pixels claros E praticamente sem cor
        for x, y in coords:
            r, g, b = px[x, y]
            if min(r, g, b) < 225:
                return False
            if max(r, g, b) - min(r, g, b) > 12:
                return False
        return True

    step = max(1, w // 120)
    vstep = max(1, h // 120)

    top = 0
    while top < h - 1 and line_is_border([(x, top) for x in range(0, w, step)]):
        top += 1
    bottom = h - 1
    while bottom > top and line_is_border([(x, bottom) for x in range(0, w, step)]):
        bottom -= 1
    left = 0
    while left < w - 1 and line_is_border([(left, y) for y in range(0, h, vstep)]):
        left += 1
    right = w - 1
    while right > left and line_is_border([(right, y) for y in range(0, h, vstep)]):
        right -= 1

    box = (left, top, right + 1, bottom + 1)
    if box == (0, 0, w, h):
        return im, False
    # ignora recortes irrisorios
    if (right - left) > w * 0.985 and (bottom - top) > h * 0.985:
        return im, False
    return im.crop(box), True


report = []
for name in sorted(os.listdir(SRC)):
    path = os.path.join(SRC, name)
    if not os.path.isfile(path):
        continue
    stem, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg", ".png"):
        continue

    im = Image.open(path)
    im = im.convert("RGB")
    before = im.size

    im, cropped = crop_light_border(im)
    after_crop = im.size

    w, h = im.size
    if max(w, h) > MAX_LONG:
        scale = MAX_LONG / max(w, h)
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    # nome unico: pic7.jpg e pic7.png viram pic7-jpg / pic7-png
    out_name = f"{stem}-{ext.lstrip('.').lower()}.webp"
    out_path = os.path.join(OUT, out_name)
    im.save(out_path, "WEBP", quality=QUALITY, method=6)

    report.append({
        "origem": name,
        "saida": out_name,
        "antes": f"{before[0]}x{before[1]}",
        "pos_corte": f"{after_crop[0]}x{after_crop[1]}",
        "final": f"{im.size[0]}x{im.size[1]}",
        "w": im.size[0],
        "h": im.size[1],
        "cortou": cropped,
        "kb_antes": round(os.path.getsize(path) / 1024),
        "kb_depois": round(os.path.getsize(out_path) / 1024),
    })

print(json.dumps(report, indent=1, ensure_ascii=False))
tot_a = sum(r["kb_antes"] for r in report)
tot_d = sum(r["kb_depois"] for r in report)
print(f"\nTOTAL {tot_a} KB -> {tot_d} KB  ({round(100 - tot_d / tot_a * 100)}% menor)")

"""
#!/usr/bin/env python3
\"\"\"
BreachWatcher — Générateur de GIFs animés HUD
Crée 6 GIFs (hud0.gif à hud5.gif) avec :
- Défilement horizontal de la case 0 vers la case cible
- Effet vibration/oscillation (comme une aiguille de balance)
- 6 secondes totales : scroll 4s + vibration 1s + pause 1s
Dépendances : pip install Pillow
\"\"\"

from PIL import Image, ImageDraw, ImageFont
import math
import os

# ── Configuration ─────────────────────────────────────────────────────────────

CELL_W     = 160   # largeur d'une case (= largeur du GIF)
CELL_H     = 160   # hauteur du GIF
NUM_CELLS  = 6     # cases 0 à 5
FPS        = 30    # frames par seconde
SCROLL_SEC = 3.0   # durée du scroll principal
VIBR_SEC   = 1.5   # durée de la vibration
PAUSE_SEC  = 1.5   # pause finale sur le résultat
FRAME_MS   = int(1000 / FPS)  # durée d'une frame en ms

# Couleurs par niveau
COLORS = {
    0: (30,  109, 255),   # bleu
    1: (56,  193, 114),   # vert
    2: (255, 209,  51),   # jaune
    3: (255, 140,   0),   # orange
    4: (229,  57,  53),   # rouge
    5: ( 17,  17,  17),   # noir
}

LABELS = {
    0: "DEMARRAGE",
    1: "AUCUNE ALERTE",
    2: "ARTICLE PRESSE",
    3: "FAILLE",
    4: "VIRUS TOTAL",
    5: "RISQUE ELEVE",
}

# Couleur du texte (sombre sur jaune, blanc sur les autres)
TEXT_COLORS = {
    0: (255, 255, 255),
    1: (255, 255, 255),
    2: (40,  40,  40),
    3: (255, 255, 255),
    4: (255, 255, 255),
    5: (220, 220, 220),
}

# ── Icônes textuelles par niveau (unicode) ────────────────────────────────────
ICONS = {
    0: "~",    # chauffage / flamme stylisée
    1: "✓",
    2: "≡",    # journal
    3: "!",
    4: "Σ",
    5: "!Σ",
}

# ── Utilitaires ───────────────────────────────────────────────────────────────

def ease_out_cubic(t):
    \"\"\"Courbe d'accélération : départ rapide, arrivée douce.\"\"\"
    return 1 - (1 - t) ** 3

def ease_in_out(t):
    \"\"\"Courbe symétrique.\"\"\"
    return t * t * (3 - 2 * t)

def vibration_offset(t, amplitude, decay, frequency):
    \"\"\"
    Simule l'oscillation d'une aiguille :
    - amplitude  : déplacement max en pixels
    - decay      : vitesse d'amortissement
    - frequency  : fréquence d'oscillation
    \"\"\"
    return amplitude * math.exp(-decay * t) * math.sin(2 * math.pi * frequency * t)

def draw_cell(draw, x_offset, level, cell_w, cell_h):
    \"\"\"
    Dessine une case du ruban à la position x_offset.
    Le ruban est horizontal : chaque case fait cell_w × cell_h.
    \"\"\"
    bg = COLORS[level]
    tc = TEXT_COLORS[level]

    # Fond de la case
    draw.rectangle(
        [x_offset, 0, x_offset + cell_w - 1, cell_h - 1],
        fill=bg
    )

    # Séparateur vertical léger entre les cases
    draw.line(
        [(x_offset + cell_w - 1, 0), (x_offset + cell_w - 1, cell_h - 1)],
        fill=(0, 0, 0, 60), width=1
    )

    # Chiffre (grand, centré horizontalement, décalé vers le haut)
    num_text = str(level)
    try:
        font_num  = ImageFont.truetype("arialbd.ttf", 36)
        font_icon = ImageFont.truetype("arial.ttf",   16)
        font_lbl  = ImageFont.truetype("arial.ttf",    9)
    except:
        font_num  = ImageFont.load_default()
        font_icon = font_num
        font_lbl  = font_num

    # Mesure du chiffre
    bbox_num = draw.textbbox((0, 0), num_text, font=font_num)
    nw = bbox_num[2] - bbox_num[0]
    nh = bbox_num[3] - bbox_num[1]
    nx = x_offset + (cell_w - nw) // 2
    ny = 8

    draw.text((nx, ny), num_text, font=font_num, fill=tc)

    # Icône
    icon_text = ICONS[level]
    bbox_icon = draw.textbbox((0, 0), icon_text, font=font_icon)
    iw = bbox_icon[2] - bbox_icon[0]
    ix = x_offset + (cell_w - iw) // 2
    iy = ny + nh + 2
    draw.text((ix, iy), icon_text, font=font_icon, fill=tc)

    # Label
    lbl = LABELS[level]
    bbox_lbl = draw.textbbox((0, 0), lbl, font=font_lbl)
    lw = bbox_lbl[2] - bbox_lbl[0]
    lx = x_offset + (cell_w - lw) // 2
    ly = cell_h - 14
    draw.text((lx, ly), lbl, font=font_lbl, fill=(*tc[:3], 200))


def render_frame(offset_x, cell_w, cell_h):
    \"\"\"
    Crée une image PIL représentant l'état du ruban
    avec un décalage horizontal offset_x.
    Le ruban fait NUM_CELLS * cell_w de large.
    La fenêtre affichée fait cell_w × cell_h.
    offset_x est la position gauche du ruban (négatif = scrollé vers la droite).
    \"\"\"
    # Canvas de la taille du ruban complet
    ribbon_w = NUM_CELLS * cell_w
    ribbon = Image.new("RGBA", (ribbon_w, cell_h), (0, 0, 0, 0))
    draw   = ImageDraw.Draw(ribbon)

    for lvl in range(NUM_CELLS):
        draw_cell(draw, lvl * cell_w, lvl, cell_w, cell_h)

    # Effet de verre bombé : dégradé semi-transparent en haut
    overlay = Image.new("RGBA", (ribbon_w, cell_h), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    for y in range(cell_h // 3):
        alpha = int(55 * (1 - y / (cell_h // 3)))
        ov_draw.line([(0, y), (ribbon_w, y)], fill=(255, 255, 255, alpha))
    ribbon = Image.alpha_composite(ribbon, overlay)

    # Cadre métal brossé : bordure arrondie simulée
    border = Image.new("RGBA", (ribbon_w, cell_h), (0, 0, 0, 0))
    bd     = ImageDraw.Draw(border)
    bd.rectangle([0, 0, ribbon_w - 1, cell_h - 1],
                 outline=(180, 180, 180, 200), width=3)
    ribbon = Image.alpha_composite(ribbon, border)

    # Crop sur la fenêtre visible (cell_w × cell_h) avec offset_x
    ox = int(offset_x)
    ox = max(0, min(ox, ribbon_w - cell_w))
    frame = ribbon.crop((ox, 0, ox + cell_w, cell_h))

    # Ombre portée légère sur les bords gauche/droit de la fenêtre
    shadow = Image.new("RGBA", (cell_w, cell_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for i in range(8):
        alpha = int(60 * (1 - i / 8))
        sd.line([(i, 0), (i, cell_h)],           fill=(0, 0, 0, alpha))
        sd.line([(cell_w - 1 - i, 0), (cell_w - 1 - i, cell_h)], fill=(0, 0, 0, alpha))
    frame = Image.alpha_composite(frame, shadow)

    return frame.convert("RGB")


def generate_gif(target_level, output_path):
    \"\"\"
    Génère le GIF animé pour un niveau cible donné.
    Le ruban démarre sur la case 0 et se déplace vers target_level.
    \"\"\"
    frames    = []
    durations = []

    scroll_frames = int(SCROLL_SEC * FPS)
    vibr_frames   = int(VIBR_SEC   * FPS)
    pause_frames  = int(PAUSE_SEC  * FPS)

    target_x = target_level * CELL_W  # position X cible dans le ruban

    # ── Phase 1 : Scroll de 0 vers target_level ──────────────────────────────
    for i in range(scroll_frames):
        t      = i / max(scroll_frames - 1, 1)
        eased  = ease_out_cubic(t)
        offset = eased * target_x
        frame  = render_frame(offset, CELL_W, CELL_H)
        frames.append(frame)
        durations.append(FRAME_MS)

    # ── Phase 2 : Vibration / oscillation autour de target_x ─────────────────
    for i in range(vibr_frames):
        t      = i / max(vibr_frames - 1, 1)
        # Oscillation amortie : grande au départ, s'arrête progressivement
        vib    = vibration_offset(t,
                                  amplitude=18,   # pixels max d'oscillation
                                  decay=4.5,       # amortissement
                                  frequency=3.5)   # fréquences d'oscillation
        offset = target_x + vib
        frame  = render_frame(offset, CELL_W, CELL_H)
        frames.append(frame)
        durations.append(FRAME_MS)

    # ── Phase 3 : Pause sur le résultat ──────────────────────────────────────
    final_frame = render_frame(target_x, CELL_W, CELL_H)
    # On réduit le nombre de frames de pause (une seule frame longue)
    frames.append(final_frame)
    durations.append(int(PAUSE_SEC * 1000))

    # ── Sauvegarde GIF ────────────────────────────────────────────────────────
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=1,        # 1 = joue une seule fois (pas de boucle)
        optimize=False
    )
    total_ms = sum(durations)
    print(f"  ✓ {os.path.basename(output_path)} — {len(frames)} frames — {total_ms/1000:.1f}s — niveau {target_level}")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print("BreachWatcher — Génération des GIFs HUD")
    print(f"Dossier de sortie : {script_dir}")
    print("-" * 50)

    # 5 GIFs : chacun part de 0 et s'arrête sur le niveau cible (1 à 5)
    for level in range(1, NUM_CELLS):
        output = os.path.join(script_dir, f"hud{level}.gif")
        generate_gif(level, output)

    print("-" * 50)
    print(f"5 GIFs générés dans {script_dir} (hud1.gif à hud5.gif)")
    print("Installez Pillow si besoin : pip install Pillow")
"""
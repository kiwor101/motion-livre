import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

from androguard.core.dex import DEX
from loguru import logger

logger.remove()

APK = Path(sys.argv[1])
OUT = Path(sys.argv[2])
first_party = ("Lcom/alightcreative/", "Lcom/alightmotion/")
classes = []
packages = Counter()
terms = Counter()
methods_by_area = defaultdict(list)

areas = {
    "editor": ("editor", "layer", "timeline", "composition", "keyframe"),
    "effects": ("effect", "filter", "blur", "color", "transform"),
    "media": ("media", "video", "image", "audio", "font", "camera"),
    "export": ("export", "render", "encode", "save", "share"),
    "projects": ("project", "template", "preset", "element", "import"),
    "account_social": ("account", "profile", "ranking", "creator", "reward"),
    "monetization": ("paywall", "billing", "purchase", "subscription", "offer"),
    "onboarding_settings": ("onboarding", "tutorial", "setting", "preference"),
}

with zipfile.ZipFile(APK) as zf:
    for name in sorted(n for n in zf.namelist() if re.fullmatch(r"classes\d*\.dex", n)):
        dex = DEX(zf.read(name))
        for cls in dex.get_classes():
            cname = cls.get_name()
            if not cname.startswith(first_party):
                continue
            dotted = cname[1:-1].replace("/", ".")
            classes.append(dotted)
            parts = dotted.split(".")
            packages[".".join(parts[: min(6, len(parts) - 1)])] += 1
            low = dotted.lower()
            for area, needles in areas.items():
                if any(n in low for n in needles):
                    for method in cls.get_methods():
                        m = method.get_name()
                        if not (m.startswith(("access$", "component", "copy$")) or m in ("<init>", "<clinit>")):
                            methods_by_area[area].append(f"{dotted}#{m}")
            for token in re.findall(r"[A-Z][a-z]+|[a-z]{4,}", dotted.split(".")[-1]):
                terms[token.lower()] += 1

report = {
    "first_party_class_count": len(classes),
    "classes": sorted(classes),
    "package_counts": packages.most_common(),
    "class_terms": terms.most_common(300),
    "areas": {k: sorted(set(v)) for k, v in methods_by_area.items()},
    "area_counts": {k: len(set(v)) for k, v in methods_by_area.items()},
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"classes": len(classes), "areas": report["area_counts"], "top_packages": report["package_counts"][:20]}, ensure_ascii=False, indent=2))

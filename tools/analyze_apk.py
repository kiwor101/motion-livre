import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path

from androguard.core.apk import APK


def uniq(items):
    return list(dict.fromkeys(items))


def main():
    apk_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    apk = APK(str(apk_path))
    components = {
        "activities": apk.get_activities(),
        "services": apk.get_services(),
        "receivers": apk.get_receivers(),
        "providers": apk.get_providers(),
    }

    url_re = re.compile(rb"https?://[^\x00-\x20\"'<>\\]{4,}")
    host_re = re.compile(r"https?://([^/:?#]+)", re.I)
    urls = []
    entries = []
    with zipfile.ZipFile(apk_path) as zf:
        for info in zf.infolist():
            entries.append({"name": info.filename, "size": info.file_size})
            if info.filename.endswith((".dex", ".xml", ".json", ".js", ".html", ".txt")):
                data = zf.read(info)
                for raw in url_re.findall(data):
                    urls.append(raw.decode("utf-8", "ignore").rstrip(".,);]"))

    urls = uniq(urls)
    hosts = Counter(
        match.group(1).lower()
        for url in urls
        if (match := host_re.match(url))
    )

    report = {
        "file": str(apk_path),
        "size": apk_path.stat().st_size,
        "package": apk.get_package(),
        "app_name": apk.get_app_name(),
        "version_name": apk.get_androidversion_name(),
        "version_code": apk.get_androidversion_code(),
        "min_sdk": apk.get_min_sdk_version(),
        "target_sdk": apk.get_target_sdk_version(),
        "main_activity": apk.get_main_activity(),
        "permissions": sorted(apk.get_permissions()),
        "components": components,
        "libraries": sorted(apk.get_libraries()),
        "features": sorted(apk.get_features()),
        "files": entries,
        "urls": urls,
        "hosts": hosts.most_common(),
    }

    (out_dir / "analysis.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out_dir / "AndroidManifest.xml").write_text(
        apk.get_android_manifest_axml().get_xml(pretty=True).decode("utf-8"),
        encoding="utf-8",
    )
    print(json.dumps({k: report[k] for k in (
        "app_name", "package", "version_name", "version_code", "min_sdk",
        "target_sdk", "main_activity", "hosts"
    )}, ensure_ascii=False, indent=2))
    print({name: len(values) for name, values in components.items()})


if __name__ == "__main__":
    main()

import hashlib
import os
import shutil
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
cache = root / ".cache"
cache.mkdir(exist_ok=True)
temporary = cache / "starea-statului-source.zip"
excluded = {"node_modules", "dist", ".git", ".cache", ".vite", "__pycache__"}
with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED, compresslevel=6, strict_timestamps=False) as archive:
    for current, directories, files in os.walk(root):
        directories[:] = [name for name in directories if name not in excluded]
        folder = Path(current)
        relative_folder = folder.relative_to(root)
        if str(relative_folder).replace("\\", "/").startswith("docs/qa"):
            directories[:] = []
            continue
        if str(relative_folder).replace("\\", "/") == "apps/web/public/monitor":
            directories[:] = []
            continue
        if str(relative_folder).replace("\\", "/") == "public":
            directories[:] = []
            continue
        for filename in files:
            item = folder / filename
            relative = item.relative_to(root)
            if item.is_symlink() or (filename.startswith(".env") and filename != ".env.example"):
                continue
            if ".sqlite" in filename or filename.endswith((".log", ".zip", ".sha256", ".pyc")):
                continue
            archive.write(item, Path("starea-statului") / relative)
public = root / "apps/web/public"
public.mkdir(parents=True, exist_ok=True)
destination = public / temporary.name
shutil.copyfile(temporary, destination)
digest = hashlib.sha256(destination.read_bytes()).hexdigest()
(public / "starea-statului-source.sha256").write_text(digest + "  starea-statului-source.zip\n", encoding="utf-8")
client = root / "apps/web/dist/client"
if client.exists():
    shutil.copyfile(destination, client / destination.name)
    shutil.copyfile(public / "starea-statului-source.sha256", client / "starea-statului-source.sha256")
with zipfile.ZipFile(destination) as archive:
    invalid = archive.testzip()
    if invalid:
        raise RuntimeError("Arhiva este coruptă: " + invalid)
print("Surse arhivate: " + str(destination) + "\nSHA-256: " + digest)
